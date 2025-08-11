import json
import random
from functools import lru_cache
from django.http import HttpResponse
import csv
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta

from django.contrib import messages
from django.contrib.humanize.templatetags.humanize import intcomma
from django.core.exceptions import ValidationError
from django.forms import modelformset_factory
from django.urls import reverse_lazy
from django.shortcuts import render, get_object_or_404, redirect
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from django.views.generic import FormView, RedirectView, ListView, CreateView, UpdateView, DeleteView, TemplateView
from django.db.models import Q
from django.db import models
from unfold.views import UnfoldModelAdminViewMixin
from django import forms
from django.core.paginator import Paginator
from django import forms as djforms
from .models import (
    PersonalProperty, PersonalAsset, PersonalProject, PersonalRepair,
    PersonalFinancialEntry, PersonalDocument, PersonalReport, PersonalTask
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
    DocumentForm,
    ReportForm,
    TaskForm,
)
from formula.models import Driver, FileStorage, IFTAReport, Route, Load, BusinessAsset, Finance
from formula.sites import formula_admin_site
from .ai import chat_with_openai, rag_chat


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
        return context


class RouteCreateView(AdminContextMixin, CreateView):
    model = Route
    fields = ['name', 'start_location', 'end_location', 'distance']
    template_name = 'formula/route_form.html'
    success_url = reverse_lazy('route_list')
    title = _("Add Route")


class RouteUpdateView(AdminContextMixin, UpdateView):
    model = Route
    fields = ['name', 'start_location', 'end_location', 'distance']
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
            rows.append([name_link, l.pickup_date, l.delivery_date, route_name, days])
        context["load_table"] = build_table([
            _("Load"), _("Pickup"), _("Delivery"), _("Route"), _("Days")
        ], rows)
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
    fields = ['name', 'description', 'image', 'purchase_date', 'value']
    template_name = 'formula/businessasset_form.html'
    success_url = reverse_lazy('businessasset_list')
    title = _("Add Business Asset")


class BusinessAssetUpdateView(AdminContextMixin, UpdateView):
    model = BusinessAsset
    fields = ['name', 'description', 'image', 'purchase_date', 'value']
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
        import re
        m = re.search(r"\{[\s\S]*\}", reply)
        if m:
            try:
                data = json.loads(m.group(0))
            except Exception:
                data = None
    if not isinstance(data, dict):
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
            qs = qs.filter(Q(description__icontains=q))
        page = Paginator(qs, 10).get_page(request.GET.get('page'))
        ctx = self.get_context_data(form=FinancialEntryForm(), page_obj=page, search_query=q)
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
        if request.POST.get('action') == 'add_task':
            form = TaskForm(request.POST)
            task = None
            if form.is_valid():
                task = form.save()
                # Optional: enrich with AI immediately if requested
                enrich_flag = request.POST.get('enrich_on_add') in ('on', 'true', '1')
                if enrich_flag and task:
                    try:
                        enrich_task_record_with_ai(task)
                    except Exception:
                        pass
            pid = request.POST.get('project')
            return redirect(f"{reverse_lazy('projects')}?project={pid}")
        if request.POST.get('action') == 'upload_media':
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
        form = ProjectForm(request.POST)
        if form.is_valid():
            form.save()
        return redirect('projects')


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