import json
import random
import re
from functools import lru_cache
from django.http import HttpResponse, JsonResponse
import csv
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from datetime import timedelta

from django.contrib import messages
from django.contrib.humanize.templatetags.humanize import intcomma
from django.core.exceptions import ValidationError
from django.forms import modelformset_factory
from django.urls import reverse_lazy
from django.shortcuts import render, get_object_or_404, redirect
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _, gettext as _gt
from django.views.generic import FormView, RedirectView, ListView, CreateView, UpdateView, DeleteView, TemplateView
from django.db.models import Q
from django.db import models
from unfold.views import UnfoldModelAdminViewMixin
from django import forms
from django.core.paginator import Paginator
from django import forms as djforms
from .models import (
    PersonalProperty, PersonalAsset, PersonalProject, PersonalRepair,
    PersonalFinancialEntry, PersonalMonthlyItem, PersonalDocument, PersonalReport, PersonalTask
)

from formula.forms import (
    CustomForm,
    CustomHorizontalForm,
    DriverForm,
    DriverFormHelper,
    DriverFormSet,
)
# Personal forms
from formula.forms import (
    PropertyForm,
    AssetForm,
    ProjectForm,
    RepairForm,
    FinancialEntryForm,
    MonthlyItemForm,
    DocumentForm,
    ReportForm,
    TaskForm,
)
from formula.models import Driver, FileStorage, IFTAReport, Route, Load, BusinessAsset, Finance
from formula.sites import formula_admin_site
from .ai import chat_with_openai, rag_chat
from datetime import datetime, date, time
from django.db import transaction


class AdminContextMixin:
    admin_site = formula_admin_site
    title = None

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Inject Django admin context so Unfold admin/base.html renders sidebar/topbar/theme
        context.update(self.admin_site.each_context(self.request))
        if self.title:
            context["title"] = self.title
        # Ensure nav sidebar is enabled on custom pages
        context.setdefault("is_nav_sidebar_enabled", True)
        return context


class HomeView(AdminContextMixin, ListView):
    template_name = "formula/home.html"
    model = Driver
    title = _("Dashboard")

    def get_queryset(self):
        return Driver.objects.none()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["links"] = [
            {"name": "File Storage", "url": reverse_lazy("filestorage_list")},
            {"name": "Add File Storage", "url": reverse_lazy("filestorage_add")},
            {"name": "IFTA Reports", "url": reverse_lazy("iftareport_list")},
            {"name": "Add IFTA Report", "url": reverse_lazy("iftareport_add")},
        ]
        return context


class CrispyFormView(UnfoldModelAdminViewMixin, FormView):
    title = _("Crispy form")  # required: custom page header title
    form_class = CustomForm
    success_url = reverse_lazy("admin:index")
    # required: tuple of permissions
    permission_required = (
        "formula.view_driver",
        "formula.add_driver",
        "formula.change_driver",
        "formula.delete_driver",
    )
    template_name = "formula/driver_crispy_form.html"
    admin_site = formula_admin_site

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["horizontal_form"] = CustomHorizontalForm()
        return context


class CrispyFormsetView(UnfoldModelAdminViewMixin, FormView):
    title = _("Crispy form with formset")  # required: custom page header title
    success_url = reverse_lazy("admin:crispy_formset")
    # required: tuple of permissions
    permission_required = (
        "formula.view_driver",
        "formula.add_driver",
        "formula.change_driver",
        "formula.delete_driver",
    )
    template_name = "formula/driver_crispy_formset.html"
    admin_site = formula_admin_site

    def get_form_class(self):
        return modelformset_factory(
            Driver, DriverForm, formset=DriverFormSet, extra=1, can_delete=True
        )

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs.update(
            {
                "queryset": Driver.objects.filter(code__in=["VER", "HAM"]),
            }
        )
        return kwargs

    def form_invalid(self, form):
        messages.error(self.request, _("Formset submitted with errors"))
        return super().form_invalid(form)

    def form_valid(self, form):
        messages.success(self.request, _("Formset submitted successfully"))
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context.update(
            {
                "driver_formset_helper": DriverFormHelper(),
            }
        )
        return context


def build_table(headers, rows):
    return {"headers": headers, "rows": rows}


def dashboard_callback(request, context):
    context.update(random_data())
    # Add dynamic tables for admin index from DB
    filestorage_rows = []
    for fs in FileStorage.objects.order_by("-uploaded_at")[:10]:
        edit_url = reverse_lazy("filestorage_edit", args=[fs.pk])
        delete_url = reverse_lazy("filestorage_delete", args=[fs.pk])
        actions = f'<a class="text-blue-600 hover:underline mr-2" href="{edit_url}">Edit</a>' \
                  f'<a class="text-red-600 hover:underline" href="{delete_url}">Delete</a>'
        filestorage_rows.append([fs.name, fs.uploaded_at.strftime("%Y-%m-%d %H:%M"), actions])
    context["filestorage_table"] = build_table([
        _("Name"), _("Uploaded at"), _("Actions")
    ], filestorage_rows)

    iftareport_rows = []
    for r in IFTAReport.objects.order_by("-created_at")[:10]:
        edit_url = reverse_lazy("iftareport_edit", args=[r.pk])
        delete_url = reverse_lazy("iftareport_delete", args=[r.pk])
        actions = f'<a class="text-blue-600 hover:underline mr-2" href="{edit_url}">Edit</a>' \
                  f'<a class="text-red-600 hover:underline" href="{delete_url}">Delete</a>'
        iftareport_rows.append([r.report_name, r.start_date, r.end_date, r.total_miles, r.total_fuel, actions])
    context["iftareport_table"] = build_table([
        _("Report"), _("Start"), _("End"), _("Miles"), _("Fuel"), _("Actions")
    ], iftareport_rows)
    return context


@lru_cache
def random_data():
    WEEKDAYS = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
    ]

    positive = [[1, random.randrange(8, 28)] for i in range(1, 28)]
    negative = [[-1, -random.randrange(8, 28)] for i in range(1, 28)]
    average = [r[1] - random.randint(3, 5) for r in positive]
    performance_positive = [[1, random.randrange(8, 28)] for i in range(1, 28)]
    performance_negative = [[-1, -random.randrange(8, 28)] for i in range(1, 28)]

    return {
        "navigation": [
            {"title": _("Dashboard"), "link": "/", "active": True},
            {"title": _("Analytics"), "link": "#"},
            {"title": _("Settings"), "link": "#"},
        ],
        "filters": [
            {"title": _("All"), "link": "#", "active": True},
            {
                "title": _("New"),
                "link": "#",
            },
        ],
        "kpi": [
            {
                "title": "Product A Performance",
                "metric": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "footer": mark_safe(
                    f'<strong class="text-green-700 font-semibold dark:text-green-400">+{intcomma(f"{random.uniform(1, 9):.02f}")}%</strong>&nbsp;progress from last week'
                ),
                "chart": json.dumps(
                    {
                        "labels": [WEEKDAYS[day % 7] for day in range(1, 28)],
                        "datasets": [{"data": average, "borderColor": "#9333ea"}],
                    }
                ),
            },
            {
                "title": "Product B Performance",
                "metric": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "footer": mark_safe(
                    f'<strong class="text-green-700 font-semibold dark:text-green-400">+{intcomma(f"{random.uniform(1, 9):.02f}")}%</strong>&nbsp;progress from last week'
                ),
            },
            {
                "title": "Product C Performance",
                "metric": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "footer": mark_safe(
                    f'<strong class="text-green-700 font-semibold dark:text-green-400">+{intcomma(f"{random.uniform(1, 9):.02f}")}%</strong>&nbsp;progress from last week'
                ),
            },
        ],
        "progress": [
            {
                "title": "Social marketing e-book",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Freelancing tasks",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Development coaching",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Product consulting",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Other income",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Course sales",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Ads revenue",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
            {
                "title": "Customer Retention Rate",
                "description": f"${intcomma(f'{random.uniform(1000, 9999):.02f}')}",
                "value": random.randint(10, 90),
            },
        ],
        "chart": json.dumps(
            {
                "labels": [WEEKDAYS[day % 7] for day in range(1, 28)],
                "datasets": [
                    {
                        "label": "Example 1",
                        "type": "line",
                        "data": average,
                        "borderColor": "var(--color-primary-500)",
                    },
                    {
                        "label": "Example 2",
                        "data": positive,
                        "backgroundColor": "var(--color-primary-700)",
                    },
                    {
                        "label": "Example 3",
                        "data": negative,
                        "backgroundColor": "var(--color-primary-300)",
                    },
                ],
            }
        ),
        "performance": [
            {
                "title": _("Last week revenue"),
                "metric": "$1,234.56",
                "footer": mark_safe(
                    '<strong class="text-green-600 font-medium">+3.14%</strong>&nbsp;progress from last week'
                ),
                "chart": json.dumps(
                    {
                        "labels": [WEEKDAYS[day % 7] for day in range(1, 28)],
                        "datasets": [
                            {
                                "data": performance_positive,
                                "borderColor": "var(--color-primary-700)",
                            }
                        ],
                    }
                ),
            },
            {
                "title": _("Last week expenses"),
                "metric": "$1,234.56",
                "footer": mark_safe(
                    '<strong class="text-green-600 font-medium">+3.14%</strong>&nbsp;progress from last week'
                ),
                "chart": json.dumps(
                    {
                        "labels": [WEEKDAYS[day % 7] for day in range(1, 28)],
                        "datasets": [
                            {
                                "data": performance_negative,
                                "borderColor": "var(--color-primary-300)",
                            }
                        ],
                    }
                ),
            },
        ],
        "table_data": {
            "headers": [_("Day"), _("Income"), _("Expenses")],
            "rows": [
                ["22-10-2025", "$2,341.89", "$1,876.45"],
                ["23-10-2025", "$1,987.23", "$2,109.67"],
                ["24-10-2025", "$3,456.78", "$1,543.21"],
                ["25-10-2025", "$1,765.43", "$2,987.65"],
                ["26-10-2025", "$2,876.54", "$1,234.56"],
                ["27-10-2025", "$1,543.21", "$2,765.43"],
                ["28-10-2025", "$3,210.98", "$1,987.65"],
            ],
        },
    }


class FileStorageListView(AdminContextMixin, ListView):
    model = FileStorage
    template_name = 'formula/filestorage_list.html'
    title = _("File Storage")

    def get_queryset(self):
        qs = super().get_queryset().order_by('-uploaded_at')
        q = self.request.GET.get('q')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(file__icontains=q))
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Build categories from model choices (stable list)
        all_categories = [label for value, label in getattr(FileStorage, 'CATEGORY_CHOICES', [])]
        selected = self.request.GET.get('category') or 'All'
        files = [
            fs for fs in self.object_list
            if selected == 'All' or fs.category_display == selected
        ]
        # Build table without Actions, with Description, and link to file
        rows = []
        for fs in files:
            file_url = fs.file.url if getattr(fs, 'file', None) else '#'
            name_link = format_html(
                '<a class="text-blue-600 hover:underline" href="{}" target="_blank" rel="noopener">{}</a>',
                file_url,
                fs.name,
            )
            rows.append([
                name_link,
                fs.category_display,
                (fs.description or ''),
                fs.uploaded_at.strftime("%Y-%m-%d %H:%M"),
            ])
        context["filestorage_table"] = build_table([
            _("Name"), _("Category"), _("Description"), _("Uploaded at")
        ], rows)
        context["categories"] = ['All'] + all_categories
        context["selected_category"] = selected
        context["query"] = self.request.GET.get('q', '')
        return context


class FileStorageCreateView(AdminContextMixin, CreateView):
    model = FileStorage
    fields = ['name', 'file', 'category', 'description']
    template_name = 'formula/filestorage_form.html'
    success_url = reverse_lazy('filestorage_list')
    title = _("Add File")

    def form_valid(self, form):
        # Add custom validation logic for file size or type
        uploaded_file = form.cleaned_data['file']
        if uploaded_file.size > 10 * 1024 * 1024:  # Limit file size to 10MB
            form.add_error('file', 'File size must be under 10MB.')
            return self.form_invalid(form)
        return super().form_valid(form)


class FileStorageUpdateView(AdminContextMixin, UpdateView):
    model = FileStorage
    fields = ['name', 'file', 'category', 'description']
    template_name = 'formula/filestorage_form.html'
    success_url = reverse_lazy('filestorage_list')
    title = _("Edit File")

    def form_valid(self, form):
        # Add custom validation logic for file size or type
        uploaded_file = form.cleaned_data['file']
        if uploaded_file.size > 10 * 1024 * 1024:  # Limit file size to 10MB
            form.add_error('file', 'File size must be under 10MB.')
            return self.form_invalid(form)
        return super().form_valid(form)


class FileStorageDeleteView(AdminContextMixin, DeleteView):
    model = FileStorage
    template_name = 'formula/filestorage_confirm_delete.html'
    success_url = reverse_lazy('filestorage_list')
    title = _("Delete File")


class IFTAReportListView(AdminContextMixin, ListView):
    model = IFTAReport
    template_name = 'formula/iftareport_list.html'
    title = _("IFTA Reports")

    def get_queryset(self):
        qs = super().get_queryset().order_by('-created_at')
        q = self.request.GET.get('q')
        if q:
            qs = qs.filter(report_name__icontains=q)
        start = self.request.GET.get('start')
        end = self.request.GET.get('end')
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(end_date__lte=end)
        return qs

    def render_to_response(self, context, **response_kwargs):
        if self.request.GET.get('export') == 'csv':
            # Export current queryset
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="ifta_reports.csv"'
            writer = csv.writer(response)
            writer.writerow(['Report', 'Start', 'End', 'Miles', 'Fuel', 'MPG'])
            for r in self.object_list:
                mpg = (r.total_miles / r.total_fuel) if r.total_fuel else 0
                writer.writerow([r.report_name, r.start_date, r.end_date, r.total_miles, r.total_fuel, f"{mpg:.2f}"])
            return response
        return super().render_to_response(context, **response_kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # KPI totals
        total_miles = sum((r.total_miles or 0) for r in self.object_list)
        total_fuel = sum((r.total_fuel or 0) for r in self.object_list)
        avg_mpg = (total_miles / total_fuel) if total_fuel else 0
        context.update({
            'total_miles': total_miles,
            'total_fuel': total_fuel,
            'avg_mpg': avg_mpg,
            'q': self.request.GET.get('q', ''),
            'start': self.request.GET.get('start', ''),
            'end': self.request.GET.get('end', ''),
        })
        # Build table rows: link report name to edit, include MPG, no Actions
        rows = []
        for r in self.object_list:
            edit_url = reverse_lazy("iftareport_edit", args=[r.pk])
            name_link = format_html(
                '<a class="text-blue-600 hover:underline" href="{}">{}</a>',
                edit_url,
                r.report_name,
            )
            mpg = (r.total_miles / r.total_fuel) if r.total_fuel else 0
            rows.append([name_link, r.start_date, r.end_date, r.total_miles, r.total_fuel, f"{mpg:.2f}"])
        context["iftareport_table"] = build_table([
            _("Report"), _("Start"), _("End"), _("Miles"), _("Fuel"), _("MPG")
        ], rows)
        return context


class IFTAReportCreateView(AdminContextMixin, CreateView):
    model = IFTAReport
    fields = ['report_name', 'start_date', 'end_date', 'total_miles', 'total_fuel']
    template_name = 'formula/iftareport_form.html'
    success_url = reverse_lazy('iftareport_list')
    title = _("Add IFTA Report")

    def form_valid(self, form):
        # Ensure start_date is before end_date
        start_date = form.cleaned_data['start_date']
        end_date = form.cleaned_data['end_date']
        if start_date > end_date:
            form.add_error('end_date', 'End date must be after start date.')
            return self.form_invalid(form)
        return super().form_valid(form)


class IFTAReportUpdateView(AdminContextMixin, UpdateView):
    model = IFTAReport
    fields = ['report_name', 'start_date', 'end_date', 'total_miles', 'total_fuel']
    template_name = 'formula/iftareport_form.html'
    success_url = reverse_lazy('iftareport_list')
    title = _("Edit IFTA Report")

    def form_valid(self, form):
        # Ensure start_date is before end_date
        start_date = form.cleaned_data['start_date']
        end_date = form.cleaned_data['end_date']
        if start_date > end_date:
            form.add_error('end_date', 'End date must be after start date.')
            return self.form_invalid(form)
        return super().form_valid(form)


class IFTAReportDeleteView(AdminContextMixin, DeleteView):
    model = IFTAReport
    template_name = 'formula/iftareport_confirm_delete.html'
    success_url = reverse_lazy('iftareport_list')
    title = _("Delete IFTA Report")


class RouteListView(AdminContextMixin, ListView):
    model = Route
    template_name = 'formula/route_list.html'
    title = _("Routes")

    def render_to_response(self, context, **response_kwargs):
        if self.request.GET.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="routes.csv"'
            writer = csv.writer(response)
            writer.writerow(['name','start_location','end_location','distance','start_latitude','start_longitude','end_latitude','end_longitude'])
            for r in self.object_list:
                writer.writerow([
                    r.name, r.start_location, r.end_location, r.distance,
                    getattr(r, 'start_latitude', ''), getattr(r, 'start_longitude', ''),
                    getattr(r, 'end_latitude', ''), getattr(r, 'end_longitude', ''),
                ])
            return response
        if self.request.GET.get('template') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="routes_template.csv"'
            writer = csv.writer(response)
            writer.writerow(['name','start_location','end_location','distance','start_latitude','start_longitude','end_latitude','end_longitude'])
            writer.writerow(['I-90 East','Seattle, WA','Spokane, WA','279','47.6062','-122.3321','47.6588','-117.4260'])
            return response
        return super().render_to_response(context, **response_kwargs)

    def post(self, request, *args, **kwargs):
        f = request.FILES.get('csv_file')
        if not f:
            return redirect('route_list')
        try:
            import io, csv as _csv
            data = f.read()
            try:
                text = data.decode('utf-8')
            except Exception:
                text = data.decode('latin-1')
            reader = _csv.DictReader(io.StringIO(text))
            for row in reader:
                name = (row.get('name') or '').strip()
                if not name:
                    continue
                start_loc = row.get('start_location') or ''
                end_loc = row.get('end_location') or ''
                try:
                    dist = float(row.get('distance') or 0)
                except Exception:
                    dist = 0
                def _flt(v):
                    try:
                        return float(v)
                    except Exception:
                        return None
                Route.objects.update_or_create(
                    name=name,
                    defaults={
                        'start_location': start_loc,
                        'end_location': end_loc,
                        'distance': dist,
                        'start_latitude': _flt(row.get('start_latitude')),
                        'start_longitude': _flt(row.get('start_longitude')),
                        'end_latitude': _flt(row.get('end_latitude')),
                        'end_longitude': _flt(row.get('end_longitude')),
                    }
                )
        except Exception:
            pass
        return redirect('route_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        rows = []
        for r in self.object_list:
            edit_url = reverse_lazy("route_edit", args=[r.pk])
            delete_url = reverse_lazy("route_delete", args=[r.pk])
            actions = f'<a class="text-blue-600 hover:underline mr-2" href="{edit_url}">Edit</a>' \
                      f'<a class="text-red-600 hover:underline" href="{delete_url}">Delete</a>'
            rows.append([r.name, r.start_location, r.end_location, r.distance, r.created_at.strftime("%Y-%m-%d"), actions])
        context["route_table"] = build_table([
            _("Name"), _("Start"), _("End"), _("Distance"), _("Created"), _("Actions")
        ], rows)
        context["download_template_url"] = reverse_lazy("route_list") + "?template=csv"
        try:
            from django.conf import settings as dj_settings
            context["GOOGLE_MAPS_EMBED_API_KEY"] = getattr(dj_settings, "GOOGLE_MAPS_EMBED_API_KEY", "")
        except Exception:
            context["GOOGLE_MAPS_EMBED_API_KEY"] = ""
        return context


class RouteCreateView(AdminContextMixin, CreateView):
    model = Route
    fields = ['name', 'start_location', 'end_location', 'distance', 'start_latitude', 'start_longitude', 'end_latitude', 'end_longitude']
    template_name = 'formula/route_form.html'
    success_url = reverse_lazy('route_list')
    title = _("Add Route")


class RouteUpdateView(AdminContextMixin, UpdateView):
    model = Route
    fields = ['name', 'start_location', 'end_location', 'distance', 'start_latitude', 'start_longitude', 'end_latitude', 'end_longitude']
    template_name = 'formula/route_form.html'
    success_url = reverse_lazy('route_list')
    title = _("Edit Route")


class RouteDeleteView(AdminContextMixin, DeleteView):
    model = Route
    template_name = 'formula/route_confirm_delete.html'
    success_url = reverse_lazy('route_list')
    title = _("Delete Route")


class LoadListView(AdminContextMixin, ListView):
    model = Load
    template_name = 'formula/load_list.html'
    title = _("Loads")

    def post(self, request, *args, **kwargs):
        f = request.FILES.get('csv_file')
        if not f:
            messages.error(request, _("No file selected."))
            return redirect('load_list')

        import io, csv as _csv
        from datetime import datetime as _dt, timedelta as _td, date as _date

        data = f.read()
        try:
            text = data.decode('utf-8')
        except Exception:
            text = data.decode('latin-1')

        reader = _csv.DictReader(io.StringIO(text))
        created = 0
        skipped = 0

        def _parse_date_any(s: str | None) -> _date | None:
            if not s:
                return None
            s = s.strip()
            fmts = ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d")
            for fmt in fmts:
                try:
                    return _dt.strptime(s, fmt).date()
                except Exception:
                    continue
            try:
                return _date.fromisoformat(s)
            except Exception:
                return None

        # Ensure a fallback route exists
        fallback_route, _created_fb = Route.objects.get_or_create(
            name="Unassigned", defaults={"start_location": "", "end_location": "", "distance": 0}
        )

        for row in reader:
            try:
                # normalize keys (case/space insensitive)
                nrow = {(k or '').strip().lower(): (v or '') for k, v in row.items()}

                def get_any(*keys):
                    for k in keys:
                        if k in nrow and str(nrow[k]).strip():
                            return str(nrow[k]).strip()
                    return ''

                name = get_any('load_name', 'name', 'load')
                if not name:
                    skipped += 1
                    continue
                desc = get_any('description', 'desc', 'notes')
                p = _parse_date_any(get_any('pickup_date', 'pickup', 'pickupdate', 'pickup date'))
                d = _parse_date_any(get_any('delivery_date', 'delivery', 'deliverydate', 'delivery date', 'dropoff'))

                # If dates missing, default to today and +1 day
                if not p and not d:
                    p = _date.today()
                    d = p + _td(days=1)
                elif p and not d:
                    d = p
                elif d and not p:
                    p = d

                route_name = get_any('route_name', 'route', 'routename') or "Unassigned"
                route, _created_rt = Route.objects.get_or_create(
                    name=route_name, defaults={'start_location': '', 'end_location': '', 'distance': 0}
                )

                Load.objects.create(
                    load_name=name,
                    description=desc,
                    pickup_date=p,
                    delivery_date=d,
                    route=route or fallback_route,
                )
                created += 1
            except Exception:
                skipped += 1
                continue

        if created:
            messages.success(request, _gt("Imported %(c)s loads. Skipped %(s)s.") % {"c": created, "s": skipped})
        elif skipped:
            messages.error(request, _gt("No loads imported. Skipped %(s)s. Check columns: load_name, description, pickup_date, delivery_date, route_name.") % {"s": skipped})
        else:
            messages.info(request, _gt("Nothing to import."))
        return redirect('load_list')

    def get_queryset(self):
        qs = super().get_queryset().order_by('-created_at')
        q = self.request.GET.get('q')
        if q:
            qs = qs.filter(Q(load_name__icontains=q) | Q(description__icontains=q))
        route_id = self.request.GET.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        pstart = self.request.GET.get('pstart')
        pend = self.request.GET.get('pend')
        if pstart:
            qs = qs.filter(pickup_date__gte=pstart)
        if pend:
            qs = qs.filter(pickup_date__lte=pend)
        return qs

    def render_to_response(self, context, **response_kwargs):
        if self.request.GET.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="loads.csv"'
            writer = csv.writer(response)
            writer.writerow(['Load', 'Pickup', 'Delivery', 'Route', 'Days'])
            for l in self.object_list:
                route_name = l.route.name if l.route_id else ''
                days = (l.delivery_date - l.pickup_date).days if l.delivery_date and l.pickup_date else ''
                writer.writerow([l.load_name, l.pickup_date, l.delivery_date, route_name, days])
            return response
        if self.request.GET.get('template') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="loads_template.csv"'
            writer = csv.writer(response)
            writer.writerow(['load_name','description','pickup_date','delivery_date','route_name'])
            writer.writerow(['Acme Widgets','20 pallets widgets','2025-08-01','2025-08-05','I-90 East'])
            return response
        return super().render_to_response(context, **response_kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # KPIs
        count = self.object_list.count()
        durations = [
            (l.delivery_date - l.pickup_date).days
            for l in self.object_list
            if l.delivery_date and l.pickup_date
        ]
        avg_days = sum(durations) / len(durations) if durations else 0
        without_route = self.object_list.filter(route__isnull=True).count()
        context.update({
            'loads_count': count,
            'avg_days': avg_days,
            'without_route': without_route,
            'q': self.request.GET.get('q', ''),
            'pstart': self.request.GET.get('pstart', ''),
            'pend': self.request.GET.get('pend', ''),
            'route_selected': self.request.GET.get('route', ''),
            'routes': Route.objects.all().order_by('name'),
        })
        # Table rows (clickable name, no Actions)
        rows = []
        for l in self.object_list:
            edit_url = reverse_lazy("load_edit", args=[l.pk])
            name_link = format_html('<a class="text-blue-600 hover:underline" href="{}">{}</a>', edit_url, l.load_name)
            route_name = l.route.name if l.route_id else ""
            days = (l.delivery_date - l.pickup_date).days if l.delivery_date and l.pickup_date else ""
            docs = getattr(l, 'documents', None)
            docs_count = docs.count() if docs is not None else 0
            rows.append([name_link, l.pickup_date, l.delivery_date, route_name, days, docs_count])
        context["load_table"] = build_table([
            _("Load"), _("Pickup"), _("Delivery"), _("Route"), _("Days"), _("Docs")
        ], rows)
        context["download_template_url"] = reverse_lazy("load_list") + "?template=csv"
        return context


class LoadCreateView(AdminContextMixin, CreateView):
    model = Load
    fields = ['load_name', 'description', 'pickup_date', 'delivery_date', 'route']
    template_name = 'formula/load_form.html'
    success_url = reverse_lazy('load_list')
    title = _("Add Load")


class LoadUpdateView(AdminContextMixin, UpdateView):
    model = Load
    fields = ['load_name', 'description', 'pickup_date', 'delivery_date', 'route']
    template_name = 'formula/load_form.html'
    success_url = reverse_lazy('load_list')
    title = _("Edit Load")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["documents"] = self.object.documents.all().order_by('-uploaded_at')
        return context

    def post(self, request, *args, **kwargs):
        # If uploading a document, handle it and stay on page
        if request.POST.get('upload_for') == 'document':
            self.object = self.get_object()
            f = request.FILES.get('file')
            if f:
                FileStorage.objects.create(
                    name=request.POST.get('name') or f.name,
                    file=f,
                    load=self.object,
                )
            return redirect('load_edit', pk=self.object.pk)
        return super().post(request, *args, **kwargs)


class LoadDeleteView(AdminContextMixin, DeleteView):
    model = Load
    template_name = 'formula/load_confirm_delete.html'
    success_url = reverse_lazy('load_list')
    title = _("Delete Load")


class DriverListView(AdminContextMixin, ListView):
    model = Driver
    template_name = 'formula/driver_list.html'
    title = _("Drivers")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        rows = []
        for d in self.object_list:
            edit_url = reverse_lazy("driver_edit", args=[d.pk])
            delete_url = reverse_lazy("driver_delete", args=[d.pk])
            actions = f'<a class="text-blue-600 hover:underline mr-2" href="{edit_url}">Edit</a>' \
                      f'<a class="text-red-600 hover:underline" href="{delete_url}">Delete</a>'
            rows.append([d.full_name or "", d.status or "", d.category or "", d.created_at.strftime("%Y-%m-%d"), actions])
        context["driver_table"] = build_table([
            _("Name"), _("Status"), _("Category"), _("Created"), _("Actions")
        ], rows)
        return context


class DriverCreateView(AdminContextMixin, CreateView):
    model = Driver
    fields = ['first_name', 'last_name', 'license_number', 'phone_number', 'email', 'is_active']
    template_name = 'formula/driver_form.html'
    success_url = reverse_lazy('driver_list')
    title = _("Add Driver")


class DriverUpdateView(AdminContextMixin, UpdateView):
    model = Driver
    fields = ['first_name', 'last_name', 'license_number', 'phone_number', 'email', 'is_active'
    ]
    template_name = 'formula/driver_form.html'
    success_url = reverse_lazy('driver_list')
    title = _("Edit Driver")


class DriverDeleteView(AdminContextMixin, DeleteView):
    model = Driver
    template_name = 'formula/driver_confirm_delete.html'
    success_url = reverse_lazy('driver_list')
    title = _("Delete Driver")


class BusinessAssetListView(AdminContextMixin, ListView):
    model = BusinessAsset
    template_name = 'formula/businessasset_list.html'
    title = _("Business Assets")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        rows = []
        for a in self.object_list:
            edit_url = reverse_lazy("businessasset_edit", args=[a.pk])
            delete_url = reverse_lazy("businessasset_delete", args=[a.pk])
            actions = f'<a class="text-blue-600 hover:underline mr-2" href="{edit_url}">Edit</a>' \
                      f'<a class="text-red-600 hover:underline" href="{delete_url}">Delete</a>'
            rows.append([a.name, a.value, a.purchase_date, actions])
        context["businessasset_table"] = build_table([
            _("Name"), _("Value"), _("Purchased"), _("Actions")
        ], rows)
        return context


class BusinessAssetCreateView(AdminContextMixin, CreateView):
    model = BusinessAsset
    fields = ['name', 'description', 'image', 'purchase_date', 'value', 'category', 'miles', 'hours']
    template_name = 'formula/businessasset_form.html'
    success_url = reverse_lazy('businessasset_list')
    title = _("Add Business Asset")


class BusinessAssetUpdateView(AdminContextMixin, UpdateView):
    model = BusinessAsset
    fields = ['name', 'description', 'image', 'purchase_date', 'value', 'category', 'miles', 'hours']
    template_name = 'formula/businessasset_form.html'
    success_url = reverse_lazy('businessasset_list')
    title = _("Edit Business Asset")


class BusinessAssetDeleteView(AdminContextMixin, DeleteView):
    model = BusinessAsset
    template_name = 'formula/businessasset_confirm_delete.html'
    success_url = reverse_lazy('businessasset_list')
    title = _("Delete Business Asset")


class FinanceListView(AdminContextMixin, ListView):
    model = Finance
    template_name = 'formula/finance_list.html'
    title = _("Finance")

    def get_queryset(self):
        qs = super().get_queryset().order_by('-date')
        q = self.request.GET.get('q')
        if q:
            qs = qs.filter(Q(category__icontains=q) | Q(description__icontains=q))
        category = self.request.GET.get('category')
        if category:
            qs = qs.filter(category=category)
        kind = self.request.GET.get('type')
        if kind in ("INCOME", "EXPENSE"):
            qs = qs.filter(type=kind)
        start = self.request.GET.get('start')
        end = self.request.GET.get('end')
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        min_amt = self.request.GET.get('min')
        max_amt = self.request.GET.get('max')
        try:
            if min_amt not in (None, ""):
                qs = qs.filter(amount__gte=float(min_amt))
            if max_amt not in (None, ""):
                qs = qs.filter(amount__lte=float(max_amt))
        except ValueError:
            pass
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # KPI split income vs expense
        income = sum((f.amount or 0) for f in self.object_list if (f.type == 'INCOME') or (not f.type and (f.amount or 0) > 0))
        expenses = sum((f.amount or 0) for f in self.object_list if (f.type == 'EXPENSE') or (not f.type and (f.amount or 0) < 0))
        net = income + expenses
        expenses_display = abs(expenses)
        # Monthly aggregates for charts
        series = {}
        expense_by_cat = {}
        for f in self.object_list:
            ym = f.date.strftime('%Y-%m') if f.date else 'Unknown'
            if ym not in series:
                series[ym] = {'income': 0.0, 'expense': 0.0}
            amt = abs(f.amount or 0)
            if (f.type == 'INCOME') or (not f.type and (f.amount or 0) > 0):
                series[ym]['income'] += amt
            else:
                series[ym]['expense'] += amt
                # category breakdown for expenses
                key = f.category or 'Uncategorized'
                expense_by_cat[key] = expense_by_cat.get(key, 0.0) + amt
        months = sorted(series.keys())
        income_points = [series[m]['income'] for m in months]
        expense_points = [series[m]['expense'] for m in months]
        # Build JSON strings for charts
        context.update({
            'income_total': income,
            'expense_total': expenses_display,
            'net_total': net,
            'months': months,
            'income_points': income_points,
            'expense_points': expense_points,
            'months_json': json.dumps(months),
            'income_points_json': json.dumps(income_points),
            'expense_points_json': json.dumps(expense_points),
            'expense_cat_labels_json': json.dumps(list(expense_by_cat.keys())),
            'expense_cat_values_json': json.dumps(list(expense_by_cat.values())),
            'q': self.request.GET.get('q', ''),
            'start': self.request.GET.get('start', ''),
            'end': self.request.GET.get('end', ''),
            'min': self.request.GET.get('min', ''),
            'max': self.request.GET.get('max', ''),
            'category_selected': self.request.GET.get('category', ''),
            'type_selected': self.request.GET.get('type', ''),
            'categories': list(
                Finance.objects.exclude(category__isnull=True).exclude(category__exact="").values_list('category', flat=True).distinct().order_by('category')
            ),
        })
        # Table rows (no Actions); link category to edit
        rows = []
        for f in self.object_list:
            edit_url = reverse_lazy("finance_edit", args=[f.pk])
            cat_link = format_html('<a class="text-blue-600 hover:underline" href="{}">{}</a>', edit_url, f.category)
            sign = '-' if f.type == 'EXPENSE' or ((not f.type) and (f.amount or 0) < 0) else ''
            amount_txt = f"{sign}${abs(f.amount):,.2f}"
            rows.append([cat_link, f.type or '', amount_txt, f.date, (f.description or '')])
        context["finance_table"] = build_table([
            _("Category"), _("Type"), _("Amount"), _("Date"), _("Description")
        ], rows)
        return context


class FinanceCreateView(AdminContextMixin, CreateView):
    model = Finance
    fields = ['category', 'type', 'amount', 'date', 'description']
    template_name = 'formula/finance_form.html'
    success_url = reverse_lazy('finance_list')
    title = _("Add Finance")


class FinanceUpdateView(AdminContextMixin, UpdateView):
    model = Finance
    fields = ['category', 'type', 'amount', 'date', 'description']
    template_name = 'formula/finance_form.html'
    success_url = reverse_lazy('finance_list')
    title = _("Edit Finance")


class FinanceDeleteView(AdminContextMixin, DeleteView):
    model = Finance
    template_name = 'formula/finance_confirm_delete.html'
    success_url = reverse_lazy('finance_list')
    title = _("Delete Finance")


class AIAssistantView(AdminContextMixin, FormView):
    template_name = 'formula/ai_assistant.html'
    success_url = reverse_lazy('ai_assistant')
    title = _("AI Assistant")
    form_class = forms.Form

    MODELS = [
        ("gpt-5", "GPT-5"),
        ("gpt-4o", "GPT-4o"),
        ("o3-mini", "o3-mini"),
        ("llama-3.1-405b", "Llama 3.1 405B"),
    ]

    AGENTS = [
        ("general", "General Purpose"),
        ("internal", "Internal Data QA"),
        ("docs", "Docs QA"),
        ("code", "Code Assistant"),
    ]

    DEFAULT_PROMPTS = {
        "general": "You are a helpful, concise assistant.",
        "internal": "You can reference our internal data sources. If unsure, say so and ask clarifying questions.",
        "docs": "Answer strictly from the provided documentation. If not found, say you don't know.",
        "code": "Be a precise coding assistant. Provide short answers and examples when needed.",
    }

    def get_initial(self):
        return {
            'model': self.request.POST.get('model') or 'gpt-5',
            'agent': self.request.POST.get('agent') or 'general',
            'system_prompt': self.request.POST.get('system_prompt') or self.DEFAULT_PROMPTS.get('general'),
        }

    def get_chat(self):
        return self.request.session.get('ai_chat', [])

    def set_chat(self, chat):
        self.request.session['ai_chat'] = chat
        self.request.session.modified = True

    def post(self, request, *args, **kwargs):
        model = request.POST.get('model') or 'gpt-5'
        agent = request.POST.get('agent') or 'general'
        system_prompt = request.POST.get('system_prompt') or self.DEFAULT_PROMPTS.get(agent, self.DEFAULT_PROMPTS['general'])
        message = (request.POST.get('message') or '').strip()
        action = request.POST.get('action')

        if action == 'clear':
            self.set_chat([])
            return self.form_valid(form=None)

        chat = self.get_chat()
        chat = chat[-50:]
        request.session['ai_settings'] = {'model': model, 'agent': agent, 'system_prompt': system_prompt}

        if message:
            chat.append({'role': 'user', 'content': message})
            try:
                if agent == 'internal':
                    reply = rag_chat(model=model, system_prompt=system_prompt, chat=chat)
                else:
                    reply = chat_with_openai(model=model, system_prompt=system_prompt, messages=chat)
            except Exception as e:
                reply = f"Error: {e}. Ensure OPENAI_API_KEY is set."
            chat.append({'role': 'assistant', 'content': reply})
            self.set_chat(chat)
        return self.form_valid(form=None)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        saved = self.request.session.get('ai_settings') or {}
        model = saved.get('model', 'gpt-5')
        agent = saved.get('agent', 'general')
        system_prompt = saved.get('system_prompt', self.DEFAULT_PROMPTS.get(agent, self.DEFAULT_PROMPTS['general']))
        context.update({
            'models': self.MODELS,
            'agents': self.AGENTS,
            'model_selected': model,
            'agent_selected': agent,
            'system_prompt': system_prompt,
            'chat': self.get_chat(),
            'show_internal_tools': False,
        })
        return context


# Personal base + list views (needed before PersonalAIChatView)
class PersonalBaseView(TemplateView):
    extra_context = {}

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        today = timezone.localdate()
        ctx.setdefault('today', today)
        ctx.setdefault('today_plus_3', today + timedelta(days=3))
        return ctx


# Helper: AI enrichment for a PersonalTask record
def enrich_task_record_with_ai(task: PersonalTask):
    system_prompt = (
        "You are an expert task assistant for DIY/home projects. For a given task, "
        "return concise JSON with keys: tips (array of 3-5 bullet tips), "
        "instructions (array of 5-10 ordered steps), tools (array of common tools), "
        "materials (array of materials/parts), duration_estimate (human string), "
        "estimated_cost (human string), safety (array). Keep answers short and practical."
    )
    user_msg = (
        f"Project: {task.project.name}\n"
        f"Task: {task.title}\n"
        f"Description: {task.description or ''}\n"
        f"Section: {task.section or ''}"
    )
    reply = chat_with_openai(model='gpt-4o', system_prompt=system_prompt, messages=[{"role": "user", "content": user_msg}])
    data = None
    try:
        data = json.loads(reply)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", reply)
        if m:
            try:
                data = json.loads(m.group(0))
            except Exception:
                data = None

    # Normalize structure for template rendering
    def _to_list(val):
        if val is None:
            return None
        if isinstance(val, list):
            # ensure strings
            out = [str(x).strip() for x in val if str(x).strip()]
            return out or None
        if isinstance(val, str):
            txt = val.strip()
            if not txt:
                return None
            # split by newlines and common separators
            parts = re.split(r"\r?\n|\u2022|•|;|\t", txt)
            cleaned = []
            for p in parts:
                s = p.strip()
                # strip leading bullets/numbers like -, *, +, 1), 1., - [ ]
                s = re.sub(r"^(?:[-*+•\u2022]\s*|\d+[\).]\s*)", "", s).strip()
                if s:
                    cleaned.append(s)
            return cleaned or None
        # fallback
        return [str(val).strip()]

    if not isinstance(data, dict):
        data = {"raw": reply}
    else:
        data = {
            "instructions": _to_list(data.get("instructions")),
            "tips": _to_list(data.get("tips")),
            "tools": _to_list(data.get("tools")),
            "materials": _to_list(data.get("materials")),
            "safety": _to_list(data.get("safety")),
            "duration_estimate": (str(data.get("duration_estimate")).strip() if data.get("duration_estimate") else None),
            "estimated_cost": (str(data.get("estimated_cost")).strip() if data.get("estimated_cost") else None),
        }
        # If all normalized fields are empty, keep raw for debugging
        if not any([data.get("instructions"), data.get("tips"), data.get("tools"), data.get("materials"), data.get("safety"), data.get("duration_estimate"), data.get("estimated_cost")]):
            data = {"raw": reply}

    task.ai_suggested = True
    task.ai_details = data
    task.save(update_fields=["ai_suggested", "ai_details"])


# Exposed endpoint to enrich a task via POST
@csrf_exempt
def enrich_task_with_ai(request, pk: int):
    if request.method != 'POST':
        return redirect('projects')
    task = get_object_or_404(PersonalTask, pk=pk)
    try:
        enrich_task_record_with_ai(task)
    except Exception as e:
        task.ai_details = {"error": str(e)}
        task.save(update_fields=["ai_details"])
    return redirect(f"{reverse_lazy('projects')}?project={task.project_id}")


# Personal CRUD helpers (edit/delete views)
class PersonalPropertyEditView(PersonalBaseView):
    template_name = 'properties.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalProperty, pk=pk)
        q = request.GET.get('search', '').strip()
        qs = PersonalProperty.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(address__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=PropertyForm(instance=obj), page_obj=page, search_query=q, edit_property=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalProperty, pk=pk)
        form = PropertyForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('properties')


class PersonalPropertyDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalProperty, pk=pk)
        obj.delete()
        return redirect('properties')


class PersonalRepairsView(PersonalBaseView):
    template_name = 'repairs.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        qs = PersonalRepair.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(assigned_to__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=RepairForm(), page_obj=page, search_query=q)
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = RepairForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('repairs')


class PersonalRepairEditView(PersonalBaseView):
    template_name = 'repairs.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalRepair, pk=pk)
        q = request.GET.get('search', '').strip()
        page = Paginator(PersonalRepair.objects.all().order_by('-created_at'), 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=RepairForm(instance=obj), page_obj=page, search_query=q, edit_repair=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalRepair, pk=pk)
        form = RepairForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('repairs')


class PersonalRepairDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalRepair, pk=pk)
        obj.delete()
        return redirect('repairs')


class PersonalProjectEditView(PersonalBaseView):
    template_name = 'projects.html'

    def get(self, request, pk: int, *args, **kwargs):
        project = get_object_or_404(PersonalProject, pk=pk)
        q = request.GET.get('search', '').strip()
        status = request.GET.get('status', '').strip()
        page = Paginator(PersonalProject.objects.all().order_by('-created_at'), 10).get_page(request.GET.get('page'))
        by_status = {
            'PLANNED': PersonalProject.objects.filter(status='PLANNED').count(),
            'IN_PROGRESS': PersonalProject.objects.filter(status='IN_PROGRESS').count(),
            'COMPLETED': PersonalProject.objects.filter(status='COMPLETED').count(),
            'ON_HOLD': PersonalProject.objects.filter(status='ON_HOLD').count(),
        }
        total_budget = PersonalProject.objects.exclude(budget__isnull=True).aggregate(s=models.Sum('budget'))['s'] or 0
        tasks = project.tasks.all().order_by('-created_at')
        ctx = self.get_context_data(
            form=ProjectForm(instance=project), page_obj=page, search_query=q,
            status_selected=status, project_status_counts=by_status, total_budget=total_budget,
            selected_project=project, tasks=tasks, task_form=TaskForm(initial={'project': project}), edit_project=True,
        )
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        project = get_object_or_404(PersonalProject, pk=pk)
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
        return redirect('projects')


class PersonalProjectDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        project = get_object_or_404(PersonalProject, pk=pk)
        project.delete()
        return redirect('projects')


class PersonalAssetEditView(PersonalBaseView):
    template_name = 'assets.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalAsset, pk=pk)
        q = request.GET.get('search', '').strip()
        cat = request.GET.get('category', '').strip()
        qs = PersonalAsset.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__icontains=q))
        if cat:
            qs = qs.filter(category__iexact=cat)
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        categories = (
            PersonalAsset.objects.exclude(category__isnull=True)
            .exclude(category__exact='')
            .values_list('category', flat=True).distinct().order_by('category')
        )
        ctx = self.get_context_data(form=AssetForm(instance=obj), page_obj=page, search_query=q, categories=categories, category_selected=cat, edit_asset=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalAsset, pk=pk)
        form = AssetForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('assets')


class PersonalAssetDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalAsset, pk=pk)
        obj.delete()
        return redirect('assets')


class PersonalFinancialView(PersonalBaseView):
    template_name = 'financial.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        qs = PersonalFinancialEntry.objects.all().order_by('-date', '-created_at')
        if q:
            qs = qs.filter(Q(description__icontains=q) | Q(category__icontains=q))
        # extra filters
        category = request.GET.get('category', '').strip()
        kind = request.GET.get('type', '').strip()
        start = request.GET.get('start', '').strip()
        end = request.GET.get('end', '').strip()
        min_amt = request.GET.get('min', '').strip()
        max_amt = request.GET.get('max', '').strip()
        if category:
            qs = qs.filter(category=category)
        if kind in ("INCOME", "EXPENSE"):
            qs = qs.filter(type=kind)
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        try:
            if min_amt:
                qs = qs.filter(amount__gte=float(min_amt))
            if max_amt:
                qs = qs.filter(amount__lte=float(max_amt))
        except ValueError:
            pass

        # CSV export
        if request.GET.get('export') == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="personal_finance.csv"'
            writer = csv.writer(response)
            writer.writerow(['Category', 'Type', 'Amount', 'Date', 'Description'])
            for f in qs:
                writer.writerow([f.category or '', f.type or '', f.amount, f.date, (f.description or '')])
            return response

        # KPIs and charts
        income = sum((float(f.amount) if f.amount is not None else 0) for f in qs if (f.type == 'INCOME') or (not f.type and (f.amount or 0) > 0))
        expenses = sum((float(f.amount) if f.amount is not None else 0) for f in qs if (f.type == 'EXPENSE') or (not f.type and (f.amount or 0) < 0))
        net = income + expenses
        expenses_display = abs(expenses)
        series = {}
        expense_by_cat = {}
        for f in qs:
            ym = f.date.strftime('%Y-%m') if f.date else 'Unknown'
            if ym not in series:
                series[ym] = {'income': 0.0, 'expense': 0.0}
            amt = abs(float(f.amount) if f.amount is not None else 0)
            if (f.type == 'INCOME') or (not f.type and (f.amount or 0) > 0):
                series[ym]['income'] += amt
            else:
                series[ym]['expense'] += amt
                key = f.category or 'Uncategorized'
                expense_by_cat[key] = expense_by_cat.get(key, 0.0) + amt
        months = sorted(series.keys())
        income_points = [series[m]['income'] for m in months]
        expense_points = [series[m]['expense'] for m in months]

        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        categories = list(
            PersonalFinancialEntry.objects.exclude(category__isnull=True).exclude(category__exact="").values_list('category', flat=True).distinct().order_by('category')
        )
        ctx = self.get_context_data(
            form=FinancialEntryForm(),
            page_obj=page,
            search_query=q,
            income_total=income,
            expense_total=expenses_display,
            net_total=net,
            months_json=json.dumps(months),
            income_points_json=json.dumps(income_points),
            expense_points_json=json.dumps(expense_points),
            expense_cat_labels_json=json.dumps(list(expense_by_cat.keys())),
            expense_cat_values_json=json.dumps(list(expense_by_cat.values())),
            categories=categories,
            category_selected=category,
            type_selected=kind,
            start=start,
            end=end,
            min=min_amt,
            max=max_amt,
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = FinancialEntryForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('financial')


class PersonalFinancialEditView(PersonalBaseView):
    template_name = 'financial.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalFinancialEntry, pk=pk)
        q = request.GET.get('search', '').strip()
        page = Paginator(PersonalFinancialEntry.objects.all().order_by('-date', '-created_at'), 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=FinancialEntryForm(instance=obj), page_obj=page, search_query=q, edit_financial_entry=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalFinancialEntry, pk=pk)
        form = FinancialEntryForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('financial')


class PersonalFinancialDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalFinancialEntry, pk=pk)
        obj.delete()
        return redirect('financial')


# New: Monthly Items subpage
class PersonalMonthlyItemsView(PersonalBaseView):
    template_name = 'monthly_items.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        kind = request.GET.get('type', '').strip()
        qs = PersonalMonthlyItem.objects.all().order_by('type', 'title')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(category__icontains=q) | Q(notes__icontains=q))
        if kind in ("INCOME", "EXPENSE"):
            qs = qs.filter(type=kind)
        income_total = sum(float(x.amount or 0) for x in qs if x.type == 'INCOME')
        expense_total = sum(float(x.amount or 0) for x in qs if x.type == 'EXPENSE')
        net = income_total - expense_total
        page = Paginator(qs, 20).get_page(request.GET.get('page'))
        ctx = self.get_context_data(
            form=MonthlyItemForm(), page_obj=page, search_query=q,
            type_selected=kind, income_total=income_total, expense_total=expense_total, net_total=net,
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = MonthlyItemForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('monthly_items')


class PersonalMonthlyItemEditView(PersonalBaseView):
    template_name = 'monthly_items.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalMonthlyItem, pk=pk)
        q = request.GET.get('search', '').strip()
        kind = request.GET.get('type', '').strip()
        page = Paginator(PersonalMonthlyItem.objects.all().order_by('type', 'title'), 20).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=MonthlyItemForm(instance=obj), page_obj=page, search_query=q, type_selected=kind, edit_item=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalMonthlyItem, pk=pk)
        form = MonthlyItemForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('monthly_items')


class PersonalMonthlyItemDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalMonthlyItem, pk=pk)
        obj.delete()
        return redirect('monthly_items')


class PersonalDocumentsView(PersonalBaseView):
    template_name = 'documents.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        qs = PersonalDocument.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(title__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=DocumentForm(), page_obj=page, search_query=q)
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
        return redirect('documents')


class PersonalDocumentEditView(PersonalBaseView):
    template_name = 'documents.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalDocument, pk=pk)
        q = request.GET.get('search', '').strip()
        page = Paginator(PersonalDocument.objects.all().order_by('-created_at'), 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=DocumentForm(instance=obj), page_obj=page, search_query=q, edit_document=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalDocument, pk=pk)
        form = DocumentForm(request.POST, request.FILES, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('documents')


class PersonalDocumentDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalDocument, pk=pk)
        obj.delete()
        return redirect('documents')


class PersonalReportsView(PersonalBaseView):
    template_name = 'reports.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        qs = PersonalReport.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(content__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=ReportForm(), page_obj=page, search_query=q)
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = ReportForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('reports')


class PersonalReportEditView(PersonalBaseView):
    template_name = 'reports.html'

    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalReport, pk=pk)
        q = request.GET.get('search', '').strip()
        page = Paginator(PersonalReport.objects.all().order_by('-created_at'), 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=ReportForm(instance=obj), page_obj=page, search_query=q, edit_report=True)
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalReport, pk=pk)
        form = ReportForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
        return redirect('reports')


class PersonalReportDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        obj = get_object_or_404(PersonalReport, pk=pk)
        obj.delete()
        return redirect('reports')


class GlobalCalendarView(PersonalBaseView):
    template_name = 'global_calendar.html'

    def get(self, request, *args, **kwargs):
        # Build unified events for all projects and tasks
        events = []
        for p in PersonalProject.objects.all():
            if p.start_date or p.end_date:
                start = p.start_date or p.end_date
                end = p.end_date if (p.start_date and p.end_date) else None
                evt = {
                    'title': f"Project: {p.name}",
                    'start': start.isoformat(),
                    'backgroundColor': '#93c5fd',
                }
                if end:
                    evt['end'] = end.isoformat()
                events.append(evt)
            for t in p.tasks.all():
                if t.start_date or t.due_date:
                    start = t.start_date or t.due_date
                    end = t.due_date if (t.start_date and t.due_date) else None
                    evt = {
                        'title': f"{t.title} ({p.name})",
                        'start': start.isoformat(),
                        'backgroundColor': '#a78bfa' if t.status == 'IN_PROGRESS' else ('#34d399' if t.status == 'DONE' else '#fbbf24'),
                    }
                    if end:
                        evt['end'] = end.isoformat()
                    events.append(evt)
        ctx = self.get_context_data(events_json=json.dumps(events))
        return self.render_to_response(ctx)


class PersonalProjectsView(PersonalBaseView):
    template_name = 'projects.html'

    def get(self, request, *args, **kwargs):
        # Export tasks as JSON (project-scoped or all)
        if request.GET.get('export') == 'tasks_json':
            pid = request.GET.get('project')
            data = []
            qs = PersonalTask.objects.all().select_related('project')
            if pid:
                qs = qs.filter(project_id=pid)
            for t in qs.order_by('project_id', 'start_date', 'due_date', 'id'):
                data.append({
                    'id': t.id,
                    'project_id': t.project_id,
                    'project': t.project.name if t.project_id else None,
                    'title': t.title,
                    'description': t.description,
                    'status': t.status,
                    'priority': t.priority,
                    'assigned_to': t.assigned_to,
                    'section': t.section,
                    'start_date': t.start_date.isoformat() if t.start_date else None,
                    'due_date': t.due_date.isoformat() if t.due_date else None,
                    'progress': t.progress,
                    'ai_suggested': t.ai_suggested,
                    'ai_details': t.ai_details,
                    'created_at': t.created_at.isoformat() if t.created_at else None,
                })
            proj_details = None
            if pid:
                p = PersonalProject.objects.filter(pk=pid).first()
                if p:
                    proj_details = {
                        'id': p.id,
                        'name': p.name,
                        'description': p.description,
                        'status': p.status,
                        'assigned_to': p.assigned_to,
                        'budget': float(p.budget) if getattr(p, 'budget', None) is not None else None,
                        'start_date': p.start_date.isoformat() if p.start_date else None,
                        'end_date': p.end_date.isoformat() if p.end_date else None,
                        'created_at': p.created_at.isoformat() if getattr(p, 'created_at', None) else None,
                    }
            return JsonResponse({'tasks': data, 'project': pid, 'project_details': proj_details}, json_dumps_params={'indent': 2})

        # New: export projects with nested tasks as JSON
        if request.GET.get('export') == 'projects_json':
            pid = request.GET.get('project')
            projects_qs = PersonalProject.objects.all()
            if pid:
                projects_qs = projects_qs.filter(pk=pid)
            projects = []
            for p in projects_qs:
                tasks = []
                for t in p.tasks.all().order_by('start_date', 'due_date', 'id'):
                    tasks.append({
                        'id': t.id,
                        'title': t.title,
                        'description': t.description,
                        'status': t.status,
                        'priority': t.priority,
                        'assigned_to': t.assigned_to,
                        'section': t.section,
                        'start_date': t.start_date.isoformat() if t.start_date else None,
                        'due_date': t.due_date.isoformat() if t.due_date else None,
                        'progress': t.progress,
                        'ai_suggested': t.ai_suggested,
                        'ai_details': t.ai_details,
                        'created_at': t.created_at.isoformat() if t.created_at else None,
                    })
                projects.append({
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'status': p.status,
                    'assigned_to': p.assigned_to,
                    'budget': float(p.budget) if getattr(p, 'budget', None) is not None else None,
                    'start_date': p.start_date.isoformat() if p.start_date else None,
                    'end_date': p.end_date.isoformat() if p.end_date else None,
                    'created_at': p.created_at.isoformat() if getattr(p, 'created_at', None) else None,
                    'tasks': tasks,
                })
            return JsonResponse({'projects': projects}, json_dumps_params={'indent': 2})

        # New: provide a CSV template for importing tasks
        if request.GET.get('export') == 'tasks_csv_template':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="tasks_template.csv"'
            writer = csv.writer(response)
            # Updated template: includes per-row project assignment and estimated hours for scheduler
            writer.writerow(['title', 'project', 'estimated_hours', 'description', 'section', 'status', 'priority', 'assigned_to', 'start_date', 'due_date', 'progress'])
            # Add multiple examples with different date formats and projects
            writer.writerow(['Install new faucet', 'Home Renovation', '2.5', 'Replace kitchen faucet with modern stainless steel model', 'Kitchen', 'TODO', 'HIGH', 'John', '2025-08-12', '2025-08-15', '0'])
            writer.writerow(['Paint living room', 'Home Renovation', '4', 'Apply fresh coat of paint to living room walls', 'Living Room', 'IN_PROGRESS', 'MEDIUM', 'Sarah', '08/10/2025', '08/20/2025', '25'])
            writer.writerow(['Fix bathroom tile', 'Bathroom Refresh', '1.5', 'Repair loose tile in master bathroom', 'Bathroom', 'DONE', 'LOW', 'Mike', '2025-08-01', '2025-08-05', '100'])
            # Notes about accepted values and behaviors
            writer.writerow(['# NOTE: Dates can be in YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY format', '', '', '', '', '', '', '', '', '', ''])
            writer.writerow(['# Valid status: TODO, IN_PROGRESS, DONE', '', '', '', '', '', '', '', '', '', ''])
            writer.writerow(['# Valid priority: LOW, MEDIUM, HIGH (or leave blank)', '', '', '', '', '', '', '', '', '', ''])
            writer.writerow(['# If project does not exist, it will be created automatically', '', '', '', '', '', '', '', '', '', ''])
            writer.writerow(['# If no project column is provided, the selected project (if any) will be used', '', '', '', '', '', '', '', '', '', ''])
            return response

        q = request.GET.get('search', '').strip()
        status = request.GET.get('status', '').strip()
        qs = PersonalProject.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        if status:
            qs = qs.filter(status=status)
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        by_status = {
            'PLANNED': PersonalProject.objects.filter(status='PLANNED').count(),
            'IN_PROGRESS': PersonalProject.objects.filter(status='IN_PROGRESS').count(),
            'COMPLETED': PersonalProject.objects.filter(status='COMPLETED').count(),
            'ON_HOLD': PersonalProject.objects.filter(status='ON_HOLD').count(),
        }
        total_budget = PersonalProject.objects.exclude(budget__isnull=True).aggregate(s=models.Sum('budget'))['s'] or 0
        ctx = self.get_context_data(
            form=ProjectForm(), page_obj=page, search_query=q,
            status_selected=status, project_status_counts=by_status, total_budget=total_budget,
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        if action == 'generate_project_ai':
            name = (request.POST.get('name') or '').strip()
            description = (request.POST.get('description') or '').strip()
            if not name:
                messages.error(request, 'Provide a project name.')
                return redirect('projects')
            # Create the project first
            p = PersonalProject.objects.create(name=name, description=description or None, status='PLANNED')
            # Ask AI to generate a structured plan
            try:
                from .ai import chat_with_openai
                system = (
                    'You are a project planner. Given a title and description, generate a JSON with fields: '
                    '{"tasks":[{"title":"...","description":"...","status":"TODO|IN_PROGRESS|DONE","priority":"LOW|MEDIUM|HIGH","section":"","assigned_to":"","start_date":"YYYY-MM-DD","due_date":"YYYY-MM-DD"}],'
                    '"images":[{"prompt":"alt text or caption for image related to project"}]}'
                )
                user_msg = f"Title: {name}\nDescription: {description}"
                content = chat_with_openai('gpt-4o-mini', system, [{ 'role':'user', 'content': user_msg }])
            except Exception as e:
                content = ''
            import json, re
            tasks = []
            images = []
            if content:
                try:
                    data = json.loads(content)
                    tasks = data.get('tasks') or []
                    images = data.get('images') or []
                except Exception:
                    m = re.search(r"\{[\s\S]*\}", content)
                    if m:
                        try:
                            data = json.loads(m.group(0))
                            tasks = data.get('tasks') or []
                            images = data.get('images') or []
                        except Exception:
                            pass
            # Save tasks (ensure dates for calendar/gantt where possible)
            from .models import PersonalTask, PersonalProjectMedia
            from datetime import datetime as _dt
            from datetime import timedelta as _td
            proj_start_candidates = []
            proj_end_candidates = []
            for t in tasks if isinstance(tasks, list) else []:
                title = (t.get('title') or '').strip()
                if not title:
                    continue
                nt = PersonalTask(project=p, title=title)
                nt.description = (t.get('description') or '').strip() or None
                st = (t.get('status') or 'TODO').strip().upper()
                nt.status = st if st in ('TODO','IN_PROGRESS','DONE') else 'TODO'
                pr = (t.get('priority') or '').strip().upper()
                nt.priority = pr if pr in ('LOW','MEDIUM','HIGH') else None
                nt.section = (t.get('section') or '').strip() or None
                nt.assigned_to = (t.get('assigned_to') or '').strip() or None
                try:
                    sd = (t.get('start_date') or '').strip()
                    dd = (t.get('due_date') or '').strip()
                    # Parse ISO or fallback noop
                    sdt = _dt.fromisoformat(sd).date() if sd else None
                    edt = _dt.fromisoformat(dd).date() if dd else None
                    if sdt and not edt:
                        edt = sdt + _td(days=1)
                    if edt and not sdt:
                        sdt = edt - _td(days=1)
                    # If both still missing, set a sensible default window
                    if not sdt and not edt:
                        today = timezone.localdate()
                        sdt = today + _td(days=1)
                        edt = today + _td(days=2)
                    nt.start_date = sdt
                    nt.due_date = edt
                except Exception:
                    pass
                try:
                    nt.save()
                    if nt.start_date:
                        proj_start_candidates.append(nt.start_date)
                    if nt.due_date:
                        proj_end_candidates.append(nt.due_date)
                except Exception:
                    continue
            # Backfill project start/end if missing
            try:
                if not p.start_date and proj_start_candidates:
                    p.start_date = min(proj_start_candidates)
                if not p.end_date and proj_end_candidates:
                    p.end_date = max(proj_end_candidates)
                if p.start_date or p.end_date:
                    p.save(update_fields=[f for f in ['start_date','end_date'] if getattr(p, f)])
            except Exception:
                pass
            # Save image placeholders as media entries (URL field) using prompts as captions
            # Generate images when possible; fallback to placeholder URLs
            for idx, im in enumerate(images if isinstance(images, list) else []):
                cap = (im.get('prompt') or '').strip()
                if not cap:
                    continue
                try:
                    # Try AI image generation
                    from .ai import generate_image
                    from django.core.files.base import ContentFile
                    img_bytes = generate_image(cap, size="1024x1024")
                    if img_bytes:
                        fname = f"ai_project_{p.id}_{idx+1}.png"
                        media = PersonalProjectMedia(project=p, caption=cap)
                        media.file.save(fname, ContentFile(img_bytes), save=True)
                        continue
                except Exception:
                    pass
                # Fallback to URL placeholder so UI still shows a tile
                try:
                    PersonalProjectMedia.objects.create(project=p, url='https://via.placeholder.com/512?text=AI+Image', caption=cap)
                except Exception:
                    pass
            messages.success(request, 'AI generated project created.')
            return redirect(f"{reverse_lazy('projects')}?project={p.id}")

        if action == 'add_task':
            pid = request.POST.get('project')
            project = get_object_or_404(PersonalProject, pk=pid)
            form = TaskForm(request.POST)
            task = None
            if form.is_valid():
                task = form.save(commit=False)
                if not getattr(task, 'project_id', None):
                    task.project = project
                task.save()
            else:
                # Fallback manual create for robustness
                title = (request.POST.get('title') or '').strip()
                if title:
                    t = PersonalTask(
                        project=project,
                        title=title,
                        description=(request.POST.get('description') or '').strip() or None,
                        section=(request.POST.get('section') or '').strip() or None,
                        status=(request.POST.get('status') or 'TODO').strip() or 'TODO',
                        priority=(request.POST.get('priority') or '').strip() or None,
                        assigned_to=(request.POST.get('assigned_to') or '').strip() or None,
                        progress=int(request.POST.get('progress') or 0),
                        ai_suggested=bool(request.POST.get('ai_suggested')),
                    )
                    sd = (request.POST.get('start_date') or '').strip()
                    dd = (request.POST.get('due_date') or '').strip()
                    try:
                        if sd:
                            t.start_date = timezone.datetime.fromisoformat(sd).date()
                        if dd:
                            t.due_date = timezone.datetime.fromisoformat(dd).date()
                    except Exception:
                        pass
                    t.save()
                    task = t
            # Optional enrich
            enrich_flag = request.POST.get('enrich_on_add') in ('on', 'true', '1')
            if enrich_flag and task:
                try:
                    enrich_task_record_with_ai(task)
                except Exception:
                    pass
            return redirect(f"{reverse_lazy('projects')}?project={project.id}")

        if action == 'upload_media':
            pid = request.POST.get('project')
            project = get_object_or_404(PersonalProject, pk=pid)
            from .models import PersonalProjectMedia
            m = PersonalProjectMedia(project=project)
            m.caption = request.POST.get('caption') or None
            if request.FILES.get('file'):
                m.file = request.FILES['file']
            url = (request.POST.get('url') or '').strip()
            if url:
                m.url = url
            if not m.file and not m.url:
                return redirect(f"{reverse_lazy('projects')}?project={pid}")
            m.save()
            return redirect(f"{reverse_lazy('projects')}?project={pid}")

        if action == 'import_tasks_csv':
            pid = request.POST.get('project')
            default_project = None
            if pid:
                try:
                    default_project = get_object_or_404(PersonalProject, pk=pid)
                except Exception:
                    default_project = None
            f = request.FILES.get('file')
            if not f:
                messages.error(request, 'No file selected for import.')
                return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

            import io
            try:
                text = f.read().decode('utf-8', errors='ignore')
            except Exception:
                try:
                    text = f.read().decode('latin-1', errors='ignore')
                except Exception as e:
                    messages.error(request, f'Error reading file: {e}')
                    return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

            try:
                reader = csv.DictReader(io.StringIO(text))
                imported_count = 0
                error_count = 0
                created_projects = 0
                from datetime import datetime as _dt
                date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']
                for row_num, row in enumerate(reader, start=1):
                    title = (row.get('title') or row.get('Task') or '').strip()
                    if not title or title.startswith('#'):
                        continue

                    # Resolve project per row or fallback to default
                    proj_name = (row.get('project') or row.get('Project') or row.get('project_name') or '').strip()
                    project = default_project
                    if proj_name:
                        try:
                            project_obj, created = PersonalProject.objects.get_or_create(name=proj_name)
                            if created:
                                created_projects += 1
                            project = project_obj
                        except Exception:
                            project = default_project
                    if not project:
                        error_count += 1
                        continue  # cannot assign without project

                    try:
                        t = PersonalTask(project=project, title=title)
                        t.description = (row.get('description') or row.get('Description') or '').strip() or None
                        t.section = (row.get('section') or '').strip() or None
                        st = (row.get('status') or '').strip().upper()
                        t.status = st if st in ('TODO','IN_PROGRESS','DONE') else 'TODO'
                        pr = (row.get('priority') or '').strip().upper()
                        t.priority = pr if pr in ('LOW','MEDIUM','HIGH') else None
                        t.assigned_to = (row.get('assigned_to') or '').strip() or None
                        try:
                            t.progress = int(row.get('progress') or 0)
                        except Exception:
                            t.progress = 0
                        # Estimated hours for scheduler
                        hours_val = (row.get('estimated_hours') or row.get('hours') or row.get('hrs') or '').strip()
                        try:
                            if hours_val:
                                t.estimated_hours = float(hours_val)
                        except Exception:
                            pass
                        # Dates
                        sd = (row.get('start_date') or row.get('start') or '').strip()
                        dd = (row.get('due_date') or row.get('end') or '').strip()
                        def parse_date(s):
                            s = (s or '').strip()
                            if not s:
                                return None
                            try:
                                return timezone.datetime.fromisoformat(s).date()
                            except Exception:
                                for fmt in date_formats:
                                    try:
                                        return _dt.strptime(s, fmt).date()
                                    except Exception:
                                        continue
                            return None
                        try:
                            t.start_date = parse_date(sd) or t.start_date
                            t.due_date = parse_date(dd) or t.due_date
                        except Exception:
                            pass
                        t.save()
                        imported_count += 1
                    except Exception:
                        error_count += 1
                        continue

                if imported_count > 0:
                    extra = f" Created {created_projects} new project(s)." if created_projects else ''
                    if error_count > 0:
                        messages.success(request, f"Imported {imported_count} task(s). {error_count} row(s) skipped.{extra}")
                    else:
                        messages.success(request, f"Imported {imported_count} task(s).{extra}")
                else:
                    messages.warning(request, 'No tasks were imported. Please check your CSV format.')
            except Exception as e:
                messages.error(request, f'Error processing CSV file: {e}')

            return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

        if action == 'import_tasks_json':
            pid = request.POST.get('project')
            default_project = None
            if pid:
                try:
                    default_project = get_object_or_404(PersonalProject, pk=pid)
                except Exception:
                    default_project = None
            f = request.FILES.get('file')
            if not f:
                messages.error(request, 'No file selected for import.')
                return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

            import io
            try:
                text = f.read().decode('utf-8', errors='ignore')
                items = json.loads(text)
            except Exception as e:
                messages.error(request, f'Error reading JSON file: {e}')
                return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

            try:
                if isinstance(items, dict):
                    items = items.get('tasks') or []

                imported_count = 0
                created_projects = 0
                for row in items if isinstance(items, list) else []:
                    title = (row.get('title') or '').strip()
                    if not title:
                        continue
                    # Per-item project, else default
                    proj_name = (row.get('project') or row.get('Project') or row.get('project_name') or '').strip()
                    project = default_project
                    if proj_name:
                        try:
                            project_obj, created = PersonalProject.objects.get_or_create(name=proj_name)
                            if created:
                                created_projects += 1
                            project = project_obj
                        except Exception:
                            project = default_project
                    if not project:
                        continue
                    t = PersonalTask(project=project, title=title)
                    t.description = (row.get('description') or '').strip() or None
                    t.section = (row.get('section') or '').strip() or None
                    st = (row.get('status') or '').strip().upper()
                    if st not in ('TODO','IN_PROGRESS','DONE'):
                        st = 'TODO'
                    t.status = st
                    pr = (row.get('priority') or '').strip().upper()
                    t.priority = pr if pr in ('LOW','MEDIUM','HIGH') else None
                    t.assigned_to = (row.get('assigned_to') or '').strip() or None
                    try:
                        t.progress = int(row.get('progress') or 0)
                    except Exception:
                        t.progress = 0
                    # Estimated hours support
                    try:
                        eh = row.get('estimated_hours') if isinstance(row, dict) else None
                        if eh is None:
                            eh = row.get('hours')
                        if eh is not None:
                            t.estimated_hours = float(eh)
                    except Exception:
                        pass
                    sd = row.get('start_date') or row.get('start')
                    dd = row.get('due_date') or row.get('end')
                    from datetime import datetime as _dt
                    try:
                        if sd:
                            t.start_date = _dt.fromisoformat(sd).date()
                        if dd:
                            t.due_date = _dt.fromisoformat(dd).date()
                    except Exception:
                        pass
                    t.save()
                    imported_count += 1

                if imported_count > 0:
                    extra = f" Created {created_projects} new project(s)." if created_projects else ''
                    messages.success(request, f'Successfully imported {imported_count} tasks from JSON.{extra}')
                else:
                    messages.warning(request, 'No tasks were imported. Please check your JSON format.')
            except Exception as e:
                messages.error(request, f'Error processing JSON file: {e}')

            return redirect(f"{reverse_lazy('projects')}" + (f"?project={pid}" if pid else ''))

        # default: add or edit project
        form = ProjectForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('projects')


# New: Project tasks scheduler subpage
class ProjectSchedulerView(PersonalBaseView):
    template_name = 'project_scheduler.html'

    def get(self, request, *args, **kwargs):
        # Inputs: optional project filter, weekly open window settings
        pid = request.GET.get('project')
        start_week = request.GET.get('week')  # ISO date for Monday
        open_start = request.GET.get('open_start', '18:00')  # HH:MM
        open_end = request.GET.get('open_end', '22:00')
        # Load tasks (unscheduled first). Require estimated_hours to be set.
        tasks = PersonalTask.objects.all().order_by('-priority' if hasattr(PersonalTask, 'priority') else 'created_at')
        if pid:
            tasks = tasks.filter(project_id=pid)
        tasks = [t for t in tasks if (t.estimated_hours or 0) > 0]
        # Compute week dates (Mon..Sun)
        today = timezone.localdate()
        if start_week:
            try:
                monday = timezone.datetime.fromisoformat(start_week).date()
            except Exception:
                monday = today - timedelta(days=today.weekday())
        else:
            monday = today - timedelta(days=today.weekday())
        days = [monday + timedelta(days=i) for i in range(7)]
        # Capacity and totals
        try:
            s_h, s_m = [int(x) for x in (open_start or '18:00').split(':')]
            e_h, e_m = [int(x) for x in (open_end or '22:00').split(':')]
        except Exception:
            s_h, s_m, e_h, e_m = 18, 0, 22, 0
        per_day_minutes = max((e_h * 60 + e_m) - (s_h * 60 + s_m), 0)
        capacity_hours = round((per_day_minutes * len(days)) / 60.0, 2)
        total_hours = round(sum(float(t.estimated_hours or 0) for t in tasks), 2)
        remaining_hours = round(capacity_hours - total_hours, 2)
        # Try to load a persisted schedule for this week
        from .models import PersonalSchedule
        saved = PersonalSchedule.objects.filter(week_start=monday).order_by('-updated_at').first()
        saved_schedule = saved.data if saved else None

        ctx = self.get_context_data(
            tasks=tasks,
            days=days,
            open_start=open_start,
            open_end=open_end,
            total_hours=total_hours,
            capacity_hours=capacity_hours,
            remaining_hours=remaining_hours,
            projects=PersonalProject.objects.all().order_by('name'),
            selected_project=int(pid) if pid else None,
            saved_schedule=saved_schedule,
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        if action == 'auto_schedule':
            return self._auto_schedule(request)
        if action == 'export_ics':
            return self._export_ics(request)
        return redirect('project_scheduler')

    def _auto_schedule(self, request):
        # Greedy pack tasks (by longest first) into week open windows, honoring per-day availability
        pid = request.POST.get('project')
        open_start = request.POST.get('open_start') or '18:00'
        open_end = request.POST.get('open_end') or '22:00'
        week = request.POST.get('week')

        tasks = PersonalTask.objects.all()
        if pid:
            tasks = tasks.filter(project_id=pid)
        tasks = [t for t in tasks if (t.estimated_hours or 0) > 0]
        # Prioritize by priority then by estimated hours, then recency
        def prio_weight(t):
            try:
                v = (t.priority or '').upper()
                return {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}.get(v, 0)
            except Exception:
                return 0
        tasks.sort(key=lambda t: (
            prio_weight(t),
            float(t.estimated_hours or 0),
            (t.created_at or timezone.now()).timestamp(),
        ), reverse=True)

        today = timezone.localdate()
        if week:
            try:
                monday = timezone.datetime.fromisoformat(week).date()
            except Exception:
                monday = today - timedelta(days=today.weekday())
        else:
            monday = today - timedelta(days=today.weekday())

        # Per-day windows (fallback to global open_start/open_end)
        def parse_hhmm(val, default):
            try:
                h, m = [int(x) for x in (val or default).split(':')]
                return h, m
            except Exception:
                return [int(x) for x in default.split(':')]

        day_windows = []
        for i in range(7):
            en = request.POST.get(f'day{i}_enabled')
            enabled = True if en is None else str(en).lower() in ('1', 'true', 'on', 'yes')
            s_val = request.POST.get(f'day{i}_start') or open_start
            e_val = request.POST.get(f'day{i}_end') or open_end
            s_h, s_m = parse_hhmm(s_val, open_start)
            e_h, e_m = parse_hhmm(e_val, open_end)
            minutes = max((e_h * 60 + e_m) - (s_h * 60 + s_m), 0)
            if not enabled:
                minutes = 0
            day_windows.append({
                'enabled': enabled and minutes > 0,
                's_h': s_h,
                's_m': s_m,
                'e_h': e_h,
                'e_m': e_m,
                'total_minutes': minutes,
            })

        # Build slots per day
        day_slots = []
        for i in range(7):
            day_slots.append({'date': monday + timedelta(days=i), 'blocks': [], 'window': day_windows[i]})

        # Allocate greedily day by day
        for t in tasks:
            minutes_needed = int(float(t.estimated_hours) * 60)
            remaining = minutes_needed
            for d in day_slots:
                w = d['window']
                if not w['enabled']:
                    continue
                used = sum((b['duration'] for b in d['blocks']))
                avail = max(w['total_minutes'] - used, 0)
                if avail <= 0:
                    continue
                take = min(avail, remaining)
                if take <= 0:
                    continue
                start_min = w['s_h'] * 60 + w['s_m'] + used
                start_h, start_m = divmod(start_min, 60)
                end_min = start_min + take
                end_h, end_m = divmod(end_min, 60)
                d['blocks'].append({
                    'task_id': t.id,
                    'title': t.title,
                    'project': t.project.name if t.project_id else '',
                    'duration': take,
                    'start_h': start_h,
                    'start_m': start_m,
                    'end_h': end_h,
                    'end_m': end_m,
                })
                remaining -= take
                if remaining <= 0:
                    break

        # Return JSON to render schedule UI
        data = {
            'week_start': monday.isoformat(),
            'open_start': open_start,
            'open_end': open_end,
            'days': [
                {
                    'date': d['date'].isoformat(),
                    'blocks': [
                        {
                            'task_id': b['task_id'],
                            'title': b['title'],
                            'project': b['project'],
                            'duration': b['duration'],
                            'start': f"{b['start_h']:02d}:{b['start_m']:02d}",
                            'end': f"{b['end_h']:02d}:{b['end_m']:02d}",
                        }
                        for b in d['blocks']
                    ],
                }
                for d in day_slots
            ],
        }
        # Persist schedule so it survives refresh
        from .models import PersonalSchedule
        try:
            with transaction.atomic():
                obj, _created = PersonalSchedule.objects.get_or_create(week_start=monday, defaults={'data': data})
                if not _created:
                    obj.data = data
                    obj.save(update_fields=['data', 'updated_at'])
        except Exception:
            pass
        return JsonResponse(data)

    def _export_ics(self, request):
        # Expect a JSON schedule payload from the client, return ICS file for calendar import
        try:
            sched_json = request.POST.get('schedule_json') or '{}'
            sched = json.loads(sched_json)
        except Exception:
            return redirect('project_scheduler')
        def dtstr(d, t):
            return f"{d.replace('-', '')}T{t.replace(':', '')}00"
        lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Personal Projects Scheduler//EN',
        ]
        tz = 'UTC'  # basic; can be enhanced to local tz
        for day in sched.get('days', []):
            d = day.get('date')
            for b in day.get('blocks', []):
                start = b.get('start') or '18:00'
                dur = int(b.get('duration') or 60)
                # compute end time
                sh, sm = [int(x) for x in start.split(':')]
                end_minutes = sh * 60 + sm + dur
                eh, em = divmod(end_minutes, 60)
                end = f"{eh:02d}:{em:02d}"
                title = b.get('title') or 'Task'
                desc = b.get('project') or ''
                lines += [
                    'BEGIN:VEVENT',
                    f'SUMMARY:{title}',
                    f'DESCRIPTION:{desc}',
                    f'DTSTART;TZID={tz}:{dtstr(d, start)}',
                    f'DTEND;TZID={tz}:{dtstr(d, end)}',
                    'END:VEVENT',
                ]
        lines.append('END:VCALENDAR')
        resp = HttpResponse('\r\n'.join(lines), content_type='text/calendar')
        resp['Content-Disposition'] = 'attachment; filename="project_schedule.ics"'
        return resp


# New: compact mobile-friendly scheduler page (blocks only)
class ProjectSchedulerCompactView(PersonalBaseView):
    template_name = 'project_scheduler_compact.html'

    def get(self, request, *args, **kwargs):
        # Reuse same context building as main scheduler
        open_start = request.GET.get('open_start', '18:00')
        open_end = request.GET.get('open_end', '22:00')
        today = timezone.localdate()
        monday = today - timedelta(days=today.weekday())
        days = [monday + timedelta(days=i) for i in range(7)]
        # Load persisted schedule if any
        from .models import PersonalSchedule
        saved = PersonalSchedule.objects.filter(week_start=monday).order_by('-updated_at').first()
        saved_schedule = saved.data if saved else None
        ctx = self.get_context_data(
            days=days,
            open_start=open_start,
            open_end=open_end,
            saved_schedule=saved_schedule,
        )
        return self.render_to_response(ctx)


# New: Personal section root dashboard
class PersonalDashboardView(PersonalBaseView):
    template_name = 'dashboard.html'

    def get(self, request, *args, **kwargs):
        counts = {
            'properties': PersonalProperty.objects.count(),
            'assets': PersonalAsset.objects.count(),
            'projects': PersonalProject.objects.count(),
            'repairs': PersonalRepair.objects.count(),
            'documents': PersonalDocument.objects.count(),
            'reports': PersonalReport.objects.count(),
            'tasks': PersonalTask.objects.count(),
        }
        recent_projects = PersonalProject.objects.all().order_by('-created_at')[:5]
        recent_tasks = PersonalTask.objects.all().order_by('-created_at')[:5]
        ctx = self.get_context_data(counts=counts, recent_projects=recent_projects, recent_tasks=recent_tasks)
        return self.render_to_response(ctx)


# New: Properties list/create
class PersonalPropertiesView(PersonalBaseView):
    template_name = 'properties.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        qs = PersonalProperty.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(address__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=PropertyForm(), page_obj=page, search_query=q)
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = PropertyForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('properties')


# New: Assets list/create
class PersonalAssetsView(PersonalBaseView):
    template_name = 'assets.html'

    def get(self, request, *args, **kwargs):
        q = request.GET.get('search', '').strip()
        cat = request.GET.get('category', '').strip()
        qs = PersonalAsset.objects.all().order_by('-created_at')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(category__icontains=q))
        if cat:
            qs = qs.filter(category__iexact=cat)
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        categories = (
            PersonalAsset.objects.exclude(category__isnull=True)
            .exclude(category__exact='')
            .values_list('category', flat=True).distinct().order_by('category')
        )
        ctx = self.get_context_data(form=AssetForm(), page_obj=page, search_query=q, categories=categories, category_selected=cat)
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        form = AssetForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('assets')


# New: Task edit/delete within projects
class ProjectTaskEditView(PersonalBaseView):
    template_name = 'projects.html'

    def get(self, request, pk: int, *args, **kwargs):
        task = get_object_or_404(PersonalTask, pk=pk)
        project = task.project
        q = request.GET.get('search', '').strip()
        status = request.GET.get('status', '').strip()
        page = Paginator(PersonalProject.objects.all().order_by('-created_at'), 10).get_page(request.GET.get('page'))
        by_status = {
            'PLANNED': PersonalProject.objects.filter(status='PLANNED').count(),
            'IN_PROGRESS': PersonalProject.objects.filter(status='IN_PROGRESS').count(),
            'COMPLETED': PersonalProject.objects.filter(status='COMPLETED').count(),
            'ON_HOLD': PersonalProject.objects.filter(status='ON_HOLD').count(),
        }
        total_budget = PersonalProject.objects.exclude(budget__isnull=True).aggregate(s=models.Sum('budget'))['s'] or 0
        tasks = project.tasks.all().order_by('-created_at')
        ctx = self.get_context_data(
            form=ProjectForm(instance=project), page_obj=page, search_query=q,
            status_selected=status, project_status_counts=by_status, total_budget=total_budget,
            selected_project=project, tasks=tasks, task_form=TaskForm(instance=task), edit_task=True,
        )
        return self.render_to_response(ctx)

    def post(self, request, pk: int, *args, **kwargs):
        task = get_object_or_404(PersonalTask, pk=pk)
        form = TaskForm(request.POST, instance=task)
        if form.is_valid():
            form.save()
        return redirect(f"{reverse_lazy('projects')}?project={task.project_id}")


class ProjectTaskDeleteView(PersonalBaseView):
    def get(self, request, pk: int, *args, **kwargs):
        task = get_object_or_404(PersonalTask, pk=pk)
        pid = task.project_id
        task.delete()
        return redirect(f"{reverse_lazy('projects')}?project={pid}")


# New: Personal AI Chat
class PersonalAIChatView(PersonalBaseView, FormView):
    template_name = 'ai_chat.html'
    form_class = forms.Form
    success_url = reverse_lazy('personal_ai')

    def get_chat(self):
        return self.request.session.get('personal_ai_chat', [])

    def set_chat(self, chat):
        self.request.session['personal_ai_chat'] = chat
        self.request.session.modified = True

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        if action == 'clear':
            self.set_chat([])
            return self.form_valid(form=None)
        message = (request.POST.get('message') or '').strip()
        chat = self.get_chat()[-50:]
        if message:
            chat.append({'role': 'user', 'content': message})
            try:
                reply = chat_with_openai(model='gpt-4o', system_prompt='You are a concise, helpful home projects assistant.', messages=chat)
            except Exception as e:
                reply = f"Error: {e}. Ensure OPENAI_API_KEY is set."
            chat.append({'role': 'assistant', 'content': reply})
            self.set_chat(chat)
        return self.form_valid(form=None)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx.update({'chat': self.get_chat()})
        return ctx


# New: Savings Goals page
class SavingsGoalsView(PersonalBaseView):
    template_name = 'goals.html'

    def _get_plan(self):
        from .models import SavingsPlan
        plan = SavingsPlan.objects.first()
        if not plan:
            plan = SavingsPlan.objects.create(weekly_amount=0)
        return plan

    def get(self, request, *args, **kwargs):
        from .models import SavingsGoal
        from .forms import SavingsPlanForm, SavingsGoalForm
        plan = self._get_plan()
        goals = list(SavingsGoal.objects.all().order_by('priority', 'created_at'))
        ctx = self.get_context_data(
            plan_form=SavingsPlanForm(instance=plan),
            goal_form=SavingsGoalForm(),
            goals=goals,
            weekly=float(plan.weekly_amount or 0),
            schedule=self._compute_schedule(goals, float(plan.weekly_amount or 0)),
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        from .models import SavingsGoal
        from .forms import SavingsPlanForm, SavingsGoalForm
        plan = self._get_plan()
        if action == 'set_weekly':
            form = SavingsPlanForm(request.POST, instance=plan)
            if form.is_valid():
                form.save()
            return redirect('goals')
        if action == 'add_goal':
            form = SavingsGoalForm(request.POST)
            if form.is_valid():
                g = form.save(commit=False)
                # Set priority to end
                last = SavingsGoal.objects.order_by('-priority').first()
                g.priority = (last.priority + 1) if last else 0
                g.save()
            return redirect('goals')
        if action == 'edit_goal':
            pk = request.POST.get('id')
            g = get_object_or_404(SavingsGoal, pk=pk)
            form = SavingsGoalForm(request.POST, instance=g)
            if form.is_valid():
                form.save()
            return redirect('goals')
        if action == 'delete_goal':
            pk = request.POST.get('id')
            g = get_object_or_404(SavingsGoal, pk=pk)
            g.delete()
            return redirect('goals')
        return redirect('goals')

    def _compute_schedule(self, goals, weekly):
        """Return a list of {id,title,remaining,weeks,cumulative_weeks,eta_date} based on priority order."""
        out = []
        if weekly <= 0:
            for g in goals:
                out.append({
                    'id': g.id, 'title': g.title, 'remaining': float(g.remaining_amount),
                    'weeks': None, 'cumulative_weeks': None, 'eta_date': None
                })
            return out
        cum = 0
        today = timezone.localdate()
        for g in goals:
            rem = float(g.remaining_amount)
            if rem <= 0:
                wk = 0
            else:
                import math
                wk = int(math.ceil(rem / float(weekly)))
            cum += wk
            eta = (today + timedelta(weeks=cum)) if wk is not None else None
            out.append({
                'id': g.id,
                'title': g.title,
                'remaining': rem,
                'weeks': wk,
                'cumulative_weeks': cum if wk is not None else None,
                'eta_date': eta,
            })
        return out


class SavingsGoalsV2View(SavingsGoalsView):
    template_name = 'goals_v2.html'

    def _sequence_goals(self, goals):
        """Return list of dicts augmenting goals with start_date, completion_date, status, progress."""
        from datetime import date
        today = timezone.localdate()
        cursor = today
        processed = []
        for g in goals:
            remaining = float(g.remaining_amount)
            monthly = float(g.monthly_contribution or 0)
            if monthly > 0 and remaining > 0:
                import math
                months = math.ceil(remaining / monthly)
            else:
                months = 0 if remaining <= 0 else None
            start_date = cursor
            if months and months > 0:
                # Add months one by one to handle year rollover
                year = start_date.year
                month = start_date.month + months
                # Normalize month/year
                while month > 12:
                    month -= 12
                    year += 1
                # Use same day or last day fallback
                from calendar import monthrange
                day = min(start_date.day, monthrange(year, month)[1])
                completion_date = date(year, month, day)
            else:
                completion_date = start_date
            cursor = completion_date  # next goal starts when previous finishes
            progress = 100.0 if g.target_amount and g.current_amount >= g.target_amount else (
                (float(g.current_amount) / float(g.target_amount) * 100.0) if g.target_amount else 0.0
            )
            if progress >= 100:
                status = 'completed'
            elif start_date <= today < completion_date:
                status = 'active'
            elif progress < 100 and today < start_date:
                status = 'pending'
            else:
                status = 'active'
            processed.append({
                'obj': g,
                'id': g.id,
                'title': g.title,
                'description': g.description,
                'target_amount': g.target_amount,
                'current_amount': g.current_amount,
                'monthly_contribution': g.monthly_contribution,
                'remaining_amount': remaining,
                'progress': round(progress),
                'start_date': start_date,
                'completion_date': completion_date,
                'status': status,
                'goal_type': g.goal_type or 'savings',
            })
        return processed

    def get(self, request, *args, **kwargs):
        from .models import SavingsGoal
        from .forms import SavingsPlanForm, SavingsGoalForm
        plan = self._get_plan()
        goals = list(SavingsGoal.objects.all().order_by('priority', 'created_at'))
        processed = self._sequence_goals(goals)
        ctx = self.get_context_data(
            plan_form=SavingsPlanForm(instance=plan),
            goal_form=SavingsGoalForm(),
            goals=goals,  # raw list if needed
            processed_goals=processed,
            weekly=float(plan.weekly_amount or 0),
            schedule=self._compute_schedule(goals, float(plan.weekly_amount or 0)),
        )
        return self.render_to_response(ctx)

    def post(self, request, *args, **kwargs):
        # mirror parent but redirect to goals_v2
        action = request.POST.get('action')
        from .models import SavingsGoal
        from .forms import SavingsPlanForm, SavingsGoalForm
        plan = self._get_plan()
        if action == 'set_weekly':
            form = SavingsPlanForm(request.POST, instance=plan)
            if form.is_valid():
                form.save()
            return redirect('goals_v2')
        if action == 'add_goal':
            form = SavingsGoalForm(request.POST)
            if form.is_valid():
                g = form.save(commit=False)
                last = SavingsGoal.objects.order_by('-priority').first()
                g.priority = (last.priority + 1) if last else 0
                g.save()
            return redirect('goals_v2')
        if action == 'edit_goal':
            pk = request.POST.get('id')
            g = get_object_or_404(SavingsGoal, pk=pk)
            form = SavingsGoalForm(request.POST, instance=g)
            if form.is_valid():
                form.save()
            return redirect('goals_v2')
        if action == 'delete_goal':
            pk = request.POST.get('id')
            g = get_object_or_404(SavingsGoal, pk=pk)
            g.delete()
            return redirect('goals_v2')
        return redirect('goals_v2')


from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator


@method_decorator(ensure_csrf_cookie, name='dispatch')
@method_decorator(csrf_exempt, name='dispatch')
class SavingsGoalsV2EmbedView(SavingsGoalsV2View):
    template_name = 'goals_v2_original.html'
    # Serve static original front-end (no dynamic context needed)
    def get(self, request, *args, **kwargs):
        from .models import SavingsGoal
        goals = list(SavingsGoal.objects.all().order_by('priority', 'created_at'))
        payload = [
            {
                'id': str(g.id),
                'name': g.title,
                'description': g.description or '',
                'targetAmount': float(g.target_amount or 0),
                'currentAmount': float(g.current_amount or 0),
                'monthlyContribution': float(g.monthly_contribution or 0),
                'type': g.goal_type or 'savings',
                'icon': g.icon or '',
            }
            for g in goals
        ]
        return self.render_to_response({'goals': payload})


#########################################
# Lightweight Goals API (no deep validation; CSRF exempt for simplicity)
#########################################
@csrf_exempt
def api_goals_list(request):
    from .models import SavingsGoal
    goals = list(SavingsGoal.objects.all().order_by('priority', 'created_at'))
    data = [
        {
            'id': g.id,
            'name': g.title,
            'description': g.description or '',
            'targetAmount': float(g.target_amount or 0),
            'currentAmount': float(g.current_amount or 0),
            'monthlyContribution': float(g.monthly_contribution or 0),
            'type': g.goal_type or 'savings',
            'icon': g.icon or '',
        }
        for g in goals
    ]
    return JsonResponse({'ok': True, 'goals': data})

@csrf_exempt
def api_goals_add(request):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Invalid JSON'}, status=400)
    from .models import SavingsGoal
    title = body.get('name') or body.get('title') or 'Untitled'
    try:
        from decimal import Decimal
        target = Decimal(str(body.get('targetAmount') or 0))
        current = Decimal(str(body.get('currentAmount') or 0))
        monthly = Decimal(str(body.get('monthlyContribution') or 0))
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Invalid numeric value'}, status=400)
    last = SavingsGoal.objects.order_by('-priority').first()
    g = SavingsGoal.objects.create(
        title=title,
        description=body.get('description') or '',
        target_amount=target,
        current_amount=current,
        monthly_contribution=monthly,
        goal_type=body.get('type') or 'savings',
    icon=body.get('icon') or '',
        priority=(last.priority + 1) if last else 0,
    )
    return JsonResponse({'ok': True, 'goal': {
        'id': g.id,
        'name': g.title,
        'description': g.description or '',
        'targetAmount': float(g.target_amount or 0),
        'currentAmount': float(g.current_amount or 0),
        'monthlyContribution': float(g.monthly_contribution or 0),
        'type': g.goal_type or 'savings',
    'icon': g.icon or '',
    }})

@csrf_exempt
def api_goals_update(request, pk: int):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)
    from .models import SavingsGoal
    g = get_object_or_404(SavingsGoal, pk=pk)
    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Invalid JSON'}, status=400)
    mapping = {
        'name': 'title', 'title': 'title', 'description': 'description',
        'targetAmount': 'target_amount', 'currentAmount': 'current_amount',
    'monthlyContribution': 'monthly_contribution', 'type': 'goal_type', 'icon': 'icon'
    }
    from decimal import Decimal
    for k, v in body.items():
        if k in mapping:
            field = mapping[k]
            if field in ('target_amount', 'current_amount', 'monthly_contribution'):
                setattr(g, field, Decimal(str(v or 0)))
            else:
                setattr(g, field, v)
    g.save()
    return JsonResponse({'ok': True, 'goal': {
        'id': g.id,
        'name': g.title,
        'description': g.description or '',
        'targetAmount': float(g.target_amount or 0),
        'currentAmount': float(g.current_amount or 0),
        'monthlyContribution': float(g.monthly_contribution or 0),
        'type': g.goal_type or 'savings',
    'icon': g.icon or '',
    }})

@csrf_exempt
def api_goals_delete(request, pk: int):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)
    from .models import SavingsGoal
    g = get_object_or_404(SavingsGoal, pk=pk)
    g.delete()
    return JsonResponse({'ok': True})


@csrf_exempt
def reorder_goals(request):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)
    from .models import SavingsGoal
    try:
        import json
        data = json.loads(request.body.decode('utf-8'))
        ids = data.get('ids') or []
        for i, pk in enumerate(ids):
            SavingsGoal.objects.filter(pk=pk).update(priority=i)
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=400)


@csrf_exempt
def update_goal_amount(request, pk: int):
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': 'POST required'}, status=405)
    from .models import SavingsGoal
    g = get_object_or_404(SavingsGoal, pk=pk)
    try:
        import json
        data = json.loads(request.body.decode('utf-8'))
        cur = data.get('current_amount')
        if cur is not None:
            g.current_amount = cur
            g.save(update_fields=['current_amount'])
        tgt = data.get('target_amount')
        if tgt is not None:
            g.target_amount = tgt
            g.save(update_fields=['target_amount'])
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=400)


# === Assignments evaluation (inline implementation) ===
from django.contrib.auth.decorators import login_required
from .forms import UploadForm
from .models import Upload, RunResult, ChatTurn
from .utils import RUBRICS


def _detect_rubric(extracted_text: str) -> str:
    """Very simple heuristic rubric set selector based on keyword presence."""
    text_l = extracted_text.lower()
    # Prefer more specific matches first
    preference_order = [
        ("logistic", "NBM3 Task 2"),
        ("regression", "NBM3 Task 1"),
        ("dashboard", "NAM2 Task 1"),
        ("machine learning", "NIP TASK 3"),
        ("chatbot", "NIP TASK 1"),
        ("robot", "NIP TASK 2"),
    ]
    for kw, name in preference_order:
        if kw in text_l and name in RUBRICS:
            return name
    # fallback: first available rubric
    return next(iter(RUBRICS.keys())) if RUBRICS else ""


def _evaluate_text(rubric_name: str, text: str):
    """Produce per-item comments heuristically (no external API)."""
    rubric = RUBRICS.get(rubric_name, {})
    results = []
    text_l = text.lower()
    for label, question in rubric.items():
        # crude relevance: count overlapping words from first 3 significant words of label
        tokens = [t for t in re.split(r"[^a-z0-9]+", label.lower()) if t and len(t) > 2][:4]
        hits = sum(1 for t in tokens if t in text_l)
        if hits >= max(1, len(tokens)//2):
            comment = f"The submission addresses {label} with some relevant detail; consider adding one deeper example."  # positive-ish
        else:
            comment = f"The submission lacks clear coverage of {label}; add specific evidence – this area needs improvement."  # needs improvement
        results.append({
            "label": label,
            "question": question,
            "comment": comment,
        })
    # synthesis
    needs = [r for r in results if "needs improvement" in r["comment"].lower()]
    strengths = len(results) - len(needs)
    synthesis = (
        f"You provide solid development across {strengths} rubric areas while {len(needs)} need(s) clearer evidence. "
        f"You can strengthen weak areas by adding concrete data, examples, or justification. "
        "You are on the right track; iterate with targeted revisions for the flagged items."  # always 3 sentences
    )
    return results, synthesis


@login_required
def upload_view(request):
    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            f = form.cleaned_data['file']
            forced_type = form.cleaned_data.get('assignment_type') or 'auto'
            evaluation_mode = form.cleaned_data.get('evaluation_mode') or 'heuristic'
            raw = f.read()
            try:
                text = raw.decode('utf-8', errors='ignore')
            except Exception:
                text = ''
            # Detect title as first non-empty line
            detected_title = ''
            for line in text.splitlines():
                stripped = line.strip()
                if stripped:
                    detected_title = stripped[:500]
                    break
            upload = Upload.objects.create(
                file=f,
                original_name=getattr(f, 'name', 'uploaded'),
                detected_title=detected_title,
                extracted_text=text[:200000],  # safety cap
                status='uploaded'
            )
            rubric_name = _detect_rubric(upload.extracted_text)
            if forced_type and forced_type != 'auto' and forced_type in RUBRICS:
                rubric_name = forced_type
            upload.assignment_type = rubric_name
            # Evaluate (currently heuristic only; placeholder for AI mode)
            items, synthesis = _evaluate_text(rubric_name, upload.extracted_text)
            if evaluation_mode == 'ai':
                ChatTurn.objects.create(upload=upload, role='system', content='AI mode requested; heuristic used (AI path not yet implemented).')
            upload.status = 'evaluated'
            upload.save(update_fields=['assignment_type', 'status'])
            # Persist run + chat trace (simple)
            RunResult.objects.create(
                upload=upload,
                step_name='heuristic_evaluation',
                prompt=f'Rubric: {rubric_name}',
                output_text=str(items)
            )
            ChatTurn.objects.create(upload=upload, role='system', content=f'Heuristic rubric evaluation executed for {rubric_name}')
            ChatTurn.objects.create(upload=upload, role='assistant', content=synthesis)
            # Stash synthesized data in session for immediate detail view (avoid re-parsing list string)
            request.session[f'assign_eval_{upload.pk}'] = {
                'items': items,
                'synthesis': synthesis,
            }
            return redirect('assignments_detail', pk=upload.pk)
    else:
        form = UploadForm()
    return render(request, 'assignments/upload.html', {'form': form})


@login_required
def detail_view(request, pk: int):
    upload = get_object_or_404(Upload, pk=pk)
    sess_key = f'assign_eval_{upload.pk}'
    data = request.session.get(sess_key)
    final_items = []
    synthesis = ''
    if data:
        final_items = data.get('items', [])
        synthesis = data.get('synthesis', '')
    else:
        # attempt to reconstruct from RunResult (eval of stored list string)
        run = upload.runs.filter(step_name='heuristic_evaluation').order_by('-id').first()
        if run:
            try:
                # unsafe eval avoided; use literal_eval
                from ast import literal_eval
                final_items = literal_eval(run.output_text)
            except Exception:
                final_items = []
        last_chat = upload.chat_turns.order_by('-id').first()
        if last_chat and last_chat.role == 'assistant':
            synthesis = last_chat.content
    needs_improvement = [it['label'] for it in final_items if 'needs improvement' in it['comment'].lower()]
    context = {
        'upload': upload,
        'final_items': final_items,
        'needs_improvement': needs_improvement,
        'synthesis': synthesis,
        'chat': upload.chat_turns.all(),
        'runs': upload.runs.all(),
    'all_comments_csv': ', '.join(it.get('comment','') for it in final_items) if final_items else '',
    }
    # prevent stale session growth
    request.session.pop(sess_key, None)
    return render(request, 'assignments/detail.html', context)


@login_required
def list_view(request):
    """Simple listing of recent uploads."""
    uploads = Upload.objects.all()[:200]
    return render(request, 'assignments/list.html', {
        'uploads': uploads,
    })


@login_required
def chat_view(request, pk: int):
    """Accept a user question and generate a heuristic assistant reply referencing extracted text.

    This is a lightweight retrieval: we take up to 5 keywords (>=3 chars) from the question and
    return sentences from the extracted_text that contain them, plus a brief summary.
    """
    upload = get_object_or_404(Upload, pk=pk)
    if request.method != 'POST':  # safety
        return redirect('assignments_detail', pk=pk)
    question = (request.POST.get('question') or '').strip()
    if not question:
        return redirect('assignments_detail', pk=pk)
    ChatTurn.objects.create(upload=upload, role='user', content=question)
    text = upload.extracted_text[:50000]  # cap
    # naive sentence split
    sentences = re.split(r'(?<=[.!?])\s+', text)
    # extract simple keywords
    words = [w.lower() for w in re.findall(r'[A-Za-z]{3,}', question) if len(w) > 2]
    seen = set()
    keywords = []
    for w in words:
        if w not in seen:
            seen.add(w)
            keywords.append(w)
        if len(keywords) >= 6:
            break
    matched = []
    if keywords:
        for s in sentences:
            ls = s.lower()
            if any(k in ls for k in keywords):
                matched.append(s.strip())
            if len(matched) >= 6:
                break
    if not matched:
        answer_body = "I didn't find explicit matching content; consider adding more detail for: " + ', '.join(keywords[:3])
    else:
        answer_body = "Relevant excerpts:\n" + '\n'.join(f"- {m}" for m in matched)
    synthesis = (
        answer_body + "\n\nHeuristic note: This is a surface-level retrieval. Add concrete evidence or examples to strengthen alignment."  # guidance
    )
    ChatTurn.objects.create(upload=upload, role='assistant', content=synthesis)
    return redirect('assignments_detail', pk=pk)
