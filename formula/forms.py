from crispy_forms.helper import FormHelper
from crispy_forms.layout import Column, Div, Fieldset, Layout, Row
from django import forms
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.views.generic import RedirectView
from unfold.forms import AuthenticationForm
from unfold.layout import Submit
from unfold.widgets import (
    UnfoldAdminCheckboxSelectMultiple,
    UnfoldAdminDateWidget,
    UnfoldAdminEmailInputWidget,
    UnfoldAdminExpandableTextareaWidget,
    UnfoldAdminFileFieldWidget,
    UnfoldAdminImageFieldWidget,
    UnfoldAdminIntegerFieldWidget,
    UnfoldAdminMoneyWidget,
    UnfoldAdminRadioSelectWidget,
    UnfoldAdminSelect2Widget,
    UnfoldAdminSplitDateTimeWidget,
    UnfoldAdminTextareaWidget,
    UnfoldAdminTextInputWidget,
    UnfoldAdminTimeWidget,
    UnfoldAdminURLInputWidget,
    UnfoldBooleanSwitchWidget,
)

from formula.models import Driver
from .utils import RUBRICS

from formula.models import Lead, Car

# =====================
# Personal section forms
# =====================
from formula.models import (
    PersonalProperty,
    PersonalAsset,
    PersonalProject,
    PersonalRepair,
    PersonalFinancialEntry,
    PersonalMonthlyItem,
    PersonalDocument,
    PersonalReport,
    PersonalTask,
)

def _rubric_choices():
    base = [("auto", _("Auto-detect (recommended)"))]
    # Keep ordering stable
    base.extend([(k, k) for k in sorted(RUBRICS.keys())])
    return base


class UploadForm(forms.Form):
    file = forms.FileField(label=_('Assignment File'), required=True, widget=UnfoldAdminFileFieldWidget())
    assignment_type = forms.ChoiceField(
        label=_('Assignment / Rubric'),
        required=False,
        choices=_rubric_choices(),
        help_text=_('Choose a rubric to force evaluation or leave Auto for detection.'),
        widget=UnfoldAdminSelect2Widget,
    )
    evaluation_mode = forms.ChoiceField(
        label=_('Evaluation Mode'),
        required=False,
        choices=[('heuristic', _('Heuristic (offline)')), ('ai', _('AI Model (OpenAI)'))],
        initial='heuristic',
        help_text=_('AI requires OPENAI_API_KEY; falls back to heuristic on error.'),
        widget=UnfoldAdminSelect2Widget,
    )


class HomeView(RedirectView):
    pattern_name = "admin:index"


class CustomFormMixin(forms.Form):
    name = forms.CharField(
        max_length=100,
        label=_("Name"),
        required=True,
        widget=UnfoldAdminTextInputWidget(),
    )
    email = forms.EmailField(
        label=_("Email"),
        required=True,
        widget=UnfoldAdminEmailInputWidget(),
    )
    age = forms.IntegerField(
        label=_("Age"),
        required=True,
        min_value=18,
        max_value=120,
        widget=UnfoldAdminIntegerFieldWidget(),
    )
    url = forms.URLField(
        label=_("URL"),
        required=True,
        widget=UnfoldAdminURLInputWidget(),
    )
    salary = forms.DecimalField(
        label=_("Salary"),
        required=True,
        help_text=_("Enter your salary"),
        widget=UnfoldAdminMoneyWidget(),
    )
    title = forms.CharField(
        label=_("Title"),
        required=True,
        widget=UnfoldAdminExpandableTextareaWidget(),
    )
    message = forms.CharField(
        label=_("Message"),
        required=True,
        widget=UnfoldAdminTextareaWidget(),
    )
    subscribe = forms.BooleanField(
        label=_("Subscribe to newsletter"),
        required=True,
        initial=True,
        help_text=_("Toggle to receive our newsletter with updates and offers"),
        widget=UnfoldBooleanSwitchWidget,
    )
    notifications = forms.BooleanField(
        label=_("Receive notifications"),
        required=True,
        initial=False,
        help_text=_("Toggle to receive notifications about your inquiry status"),
        widget=UnfoldBooleanSwitchWidget,
    )
    department = forms.ChoiceField(
        label=_("Department"),
        choices=[
            ("sales", _("Sales")),
            ("marketing", _("Marketing")),
            ("development", _("Development")),
            ("hr", _("Human Resources")),
            ("other", _("Other")),
        ],
        required=True,
        help_text=_("Select the department to contact"),
        widget=UnfoldAdminRadioSelectWidget,
    )
    category = forms.ChoiceField(
        label=_("Category"),
        choices=[
            ("general", _("General Inquiry")),
            ("support", _("Technical Support")),
            ("feedback", _("Feedback")),
            ("other", _("Other")),
        ],
        required=True,
        help_text=_("Select the category of your message"),
        widget=UnfoldAdminCheckboxSelectMultiple,
    )
    priority = forms.TypedChoiceField(
        label=_("Priority"),
        choices=[
            (1, _("Low")),
            (2, _("Medium")),
            (3, _("High")),
        ],
        coerce=int,
        required=True,
        initial=2,
        help_text=_("Select the priority of your message"),
        widget=UnfoldAdminSelect2Widget,
    )
    date = forms.DateField(
        label=_("Date"),
        required=True,
        widget=UnfoldAdminDateWidget,
    )
    time = forms.TimeField(
        label=_("Time"),
        required=True,
        widget=UnfoldAdminTimeWidget,
    )
    datetime = forms.SplitDateTimeField(
        label=_("Date and Time"),
        required=True,
        widget=UnfoldAdminSplitDateTimeWidget,
    )
    file = forms.FileField(
        label=_("File"),
        required=True,
        widget=UnfoldAdminFileFieldWidget,
    )
    image = forms.ImageField(
        label=_("Image"),
        required=True,
        widget=UnfoldAdminImageFieldWidget,
    )


class CustomHorizontalForm(CustomFormMixin):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_class = "form-horizontal"
        self.helper.layout = Layout(
            Fieldset(
                _("Custom horizontal form"),
                "name",
                "email",
                "age",
                "url",
                "salary",
                "title",
                "message",
                "subscribe",
                "notifications",
                "department",
                "category",
                "date",
                "time",
                "datetime",
            ),
        )


class CustomForm(CustomFormMixin):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.add_input(Submit("submit", _("Submit")))
        self.helper.add_input(Submit("submit", _("Submit 2")))
        self.helper.add_input(Submit("submit", _("Submit 3")))
        self.helper.attrs = {
            "novalidate": "novalidate",
        }
        self.helper.layout = Layout(
            Row(
                Column(
                    Fieldset(
                        _("Custom form"),
                        Column(
                            Row(
                                Div("name", css_class="w-1/2"),
                                Div("email", css_class="w-1/2"),
                            ),
                            Row(
                                Div("age", css_class="w-1/2"),
                                Div("url", css_class="w-1/2"),
                            ),
                            "salary",
                            "priority",
                            css_class="gap-5",
                        ),
                    ),
                    Fieldset(
                        _("Textarea & expandable textarea widgets"),
                        "title",
                        "message",
                    ),
                    css_class="lg:w-1/2",
                ),
                Column(
                    Fieldset(
                        _("Radio & checkbox widgets"),
                        Column(
                            "subscribe",
                            "notifications",
                            Row(
                                Div("department", css_class="w-1/2"),
                                Div("category", css_class="w-1/2"),
                            ),
                            css_class="gap-5",
                        ),
                    ),
                    Fieldset(
                        _("File upload widgets"),
                        Column(
                            "file",
                            "image",
                            css_class="gap-5",
                        ),
                    ),
                    Fieldset(
                        _("Date & time widgets"),
                        Column(
                            "date",
                            "time",
                            "datetime",
                            css_class="gap-5",
                        ),
                    ),
                    css_class="lg:w-1/2",
                ),
                css_class="mb-8",
            ),
        )


class DriverFormHelper(FormHelper):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.template = "unfold_crispy/layout/table_inline_formset.html"
        self.form_id = "driver-formset"
        self.form_add = True
        self.form_show_labels = False
        self.attrs = {
            "novalidate": "novalidate",
        }
        self.add_input(Submit("submit", _("Another submit")))
        self.add_input(Submit("submit", _("Submit")))


class DriverForm(forms.ModelForm):
    class Meta:
        model = Driver
        fields = [
            "first_name",
            "last_name",
        ]  # Removed the `code` field
        widgets = {
            "first_name": UnfoldAdminTextInputWidget(),
            "last_name": UnfoldAdminTextInputWidget(),
        }

    def clean(self):
        pass  # Removed the testing ValidationError


class DriverFormSet(forms.BaseModelFormSet):
    def clean(self):
        raise ValidationError("Testing formset wide error messages.")


class LoginForm(AuthenticationForm):
    password = forms.CharField(widget=forms.PasswordInput(render_value=True))

    def __init__(self, request=None, *args, **kwargs):
        super().__init__(request, *args, **kwargs)

        if settings.LOGIN_USERNAME and settings.LOGIN_PASSWORD:
            self.fields["username"].initial = settings.LOGIN_USERNAME
            self.fields["password"].initial = settings.LOGIN_PASSWORD


class LeadForm(forms.ModelForm):
    class Meta:
        model = Lead
        fields = ['name', 'email', 'phone', 'zip_code', 'message']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # simple bootstrap-like defaults for public form rendering
        for f in self.fields.values():
            f.widget.attrs.update({'class': 'form-control'})


class PropertyForm(forms.ModelForm):
    class Meta:
        model = PersonalProperty
        fields = ["name", "address"]


class AssetForm(forms.ModelForm):
    class Meta:
        model = PersonalAsset
        fields = ["name", "category"]


class ProjectForm(forms.ModelForm):
    class Meta:
        model = PersonalProject
        fields = [
            "name",
            "description",
            "start_date",
            "end_date",
            "status",
            "budget",
            "assigned_to",
        ]


class RepairForm(forms.ModelForm):
    class Meta:
        model = PersonalRepair
        fields = [
            "title",
            "description",
            "priority",
            "status",
            "reported_by",
            "assigned_to",
            "estimated_cost",
            "reported_date",
            "scheduled_date",
            "category",
        ]


class FinancialEntryForm(forms.ModelForm):
    class Meta:
        model = PersonalFinancialEntry
        fields = ["date", "amount", "type", "category", "description"]


class DocumentForm(forms.ModelForm):
    class Meta:
        model = PersonalDocument
        fields = ["title", "file"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make file optional on edit but required on create
        if getattr(self.instance, "pk", None):
            self.fields["file"].required = False
        else:
            self.fields["file"].required = True


class ReportForm(forms.ModelForm):
    class Meta:
        model = PersonalReport
        fields = ["title", "content"]


# New: PersonalTask form used in projects task management
class TaskForm(forms.ModelForm):
    progress = forms.IntegerField(required=False, min_value=0, max_value=100)
    estimated_hours = forms.DecimalField(required=False, min_value=0, max_value=9999, decimal_places=2)

    class Meta:
        model = PersonalTask
        fields = [
            "project",
            "title",
            "description",
            "section",
            "status",
            "priority",
            "assigned_to",
            "start_date",
            "due_date",
            "progress",
            "estimated_hours",
            "ai_suggested",
        ]

    def clean_progress(self):
        v = self.cleaned_data.get("progress")
        return 0 if v in (None, "") else v


class AIChatForm(forms.Form):
    prompt = forms.CharField(label="", widget=forms.Textarea(attrs={"rows": 3, "placeholder": "Type your question..."}))


# Savings forms
from .models import SavingsPlan, SavingsGoal


class SavingsPlanForm(forms.ModelForm):
    class Meta:
        model = SavingsPlan
        fields = ["weekly_amount"]
        widgets = {
            "weekly_amount": forms.NumberInput(attrs={"step": "0.01", "min": "0"}),
        }


class SavingsGoalForm(forms.ModelForm):
    class Meta:
        model = SavingsGoal
        fields = ["title", "description", "target_amount", "current_amount", "monthly_contribution", "goal_type"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 2}),
            "target_amount": forms.NumberInput(attrs={"step": "0.01", "min": "0"}),
            "current_amount": forms.NumberInput(attrs={"step": "0.01", "min": "0"}),
            "monthly_contribution": forms.NumberInput(attrs={"step": "0.01", "min": "0"}),
        }


# New: Monthly recurring income/expense form
class MonthlyItemForm(forms.ModelForm):
    class Meta:
        model = PersonalMonthlyItem
        fields = ["title", "amount", "type", "category", "day_of_month", "notes"]
        widgets = {
            "amount": forms.NumberInput(attrs={"step": "0.01"}),
            "day_of_month": forms.NumberInput(attrs={"min": "1", "max": "31"}),
            "notes": forms.Textarea(attrs={"rows": 2}),
        }


## (Removed older stub UploadForm – unified above)
