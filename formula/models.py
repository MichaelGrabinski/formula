from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from djmoney.models.fields import MoneyField
from simple_history.models import HistoricalRecords
from django_currentuser.db.models import CurrentUserField

from formula.encoders import PrettyJSONEncoder


class DriverStatus(models.TextChoices):
    ACTIVE = "ACTIVE", _("Active")
    INACTIVE = "INACTIVE", _("Inactive")


class DriverCategory(models.TextChoices):
    ROOKIE = "ROOKIE", _("Rookie")
    EXPERIENCED = "EXPERIENCED", _("Experienced")
    VETERAN = "VETERAN", _("Veteran")
    CHAMPION = "CHAMPION", _("Champion")


class AuditedModel(models.Model):
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    modified_at = models.DateTimeField(_("modified at"), auto_now=True)

    class Meta:
        abstract = True


class Tag(AuditedModel):
    title = models.CharField(_("title"), max_length=255)
    slug = models.CharField(_("slug"), max_length=255)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, verbose_name=_("content type")
    )
    object_id = models.PositiveIntegerField(_("object id"))
    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return self.tag

    class Meta:
        db_table = "tags"
        verbose_name = _("tag")
        verbose_name_plural = _("tags")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]


class User(AbstractUser, AuditedModel):
    biography = models.TextField(_("biography"), null=True, blank=True, default=None)
    tags = GenericRelation(Tag)

    class Meta:
        db_table = "users"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.email if self.email else self.username

    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.last_name}, {self.first_name}"

        return None


class Profile(AuditedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    picture = models.ImageField(_("picture"), null=True, blank=True, default=None)
    resume = models.FileField(_("resume"), null=True, blank=True, default=None)
    link = models.URLField(_("link"), null=True, blank=True)
    data = models.JSONField(_("data"), null=True, blank=True)

    class Meta:
        db_table = "profiles"
        verbose_name = _("profile")
        verbose_name_plural = _("profiles")


class Circuit(AuditedModel):
    name = models.CharField(_("name"), max_length=255)
    city = models.CharField(_("city"), max_length=255)
    country = models.CharField(_("country"), max_length=255)
    data = models.JSONField(_("data"), null=True, blank=True)

    class Meta:
        db_table = "circuits"
        verbose_name = _("circuit")
        verbose_name_plural = _("circuits")

    def __str__(self):
        return self.name


class Driver(AuditedModel):
    first_name = models.CharField(_("first name"), max_length=255)
    last_name = models.CharField(_("last name"), max_length=255)
    salary = MoneyField(
        max_digits=14, decimal_places=2, null=True, blank=True, default_currency=None
    )
    category = models.CharField(
        _("category"),
        choices=DriverCategory.choices,
        null=True,
        blank=True,
        max_length=255,
    )
    picture = models.ImageField(_("picture"), null=True, blank=True, default=None)
    born_at = models.DateField(_("born"), null=True, blank=True)
    last_race_at = models.DateField(_("last race"), null=True, blank=True)
    best_time = models.TimeField(_("best time"), null=True, blank=True)
    first_race_at = models.DateTimeField(_("first race"), null=True, blank=True)
    resume = models.FileField(_("resume"), null=True, blank=True, default=None)
    author = models.ForeignKey(
        "User",
        verbose_name=_("author"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="driver_author",
    )
    standing = models.ForeignKey(
        "Standing",
        verbose_name=_("standing"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="driver_standing",
    )
    constructors = models.ManyToManyField(
        "Constructor", verbose_name=_("constructors"), blank=True
    )
    code = models.CharField(_("code"), max_length=3)
    color = models.CharField(_("color"), null=True, blank=True, max_length=255)
    link = models.URLField(_("link"), null=True, blank=True)
    status = models.CharField(
        _("status"),
        choices=DriverStatus.choices,
        null=True,
        blank=True,
        max_length=255,
    )
    conditional_field_active = models.CharField(
        _("conditional field active"),
        null=True,
        blank=True,
        max_length=255,
        help_text="This field is only visible if the status is ACTIVE",
    )
    conditional_field_inactive = models.CharField(
        _("conditional field inactive"),
        null=True,
        blank=True,
        max_length=255,
        help_text="This field is only visible if the status is INACTIVE",
    )
    data = models.JSONField(_("data"), null=True, blank=True, encoder=PrettyJSONEncoder)
    history = HistoricalRecords()
    is_active = models.BooleanField(_("active"), default=False)
    is_retired = models.BooleanField(
        _("retired"),
        choices=(
            (None, ""),
            (True, _("Active")),
            (False, _("Inactive")),
        ),
        null=True,
    )
    is_hidden = models.BooleanField(_("hidden"), default=False)
    created_by = CurrentUserField(related_name="driver_created_by")
    updated_by = CurrentUserField(on_update=True, related_name="driver_updated_by")

    class Meta:
        db_table = "drivers"
        verbose_name = _("driver")
        verbose_name_plural = _("drivers")
        permissions = (("update_statistics", _("Update statistics")),)

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.last_name}, {self.first_name}"

        return None

    @property
    def initials(self):
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}"

        return None


class DriverWithFilters(Driver):
    history = HistoricalRecords()

    class Meta:
        proxy = True


class Constructor(AuditedModel):
    name = models.CharField(_("name"), max_length=255)

    class Meta:
        db_table = "constructors"
        verbose_name = _("constructor")
        verbose_name_plural = _("constructors")

    def __str__(self):
        return self.name


class Race(AuditedModel):
    circuit = models.ForeignKey(
        Circuit, verbose_name=_("circuit"), on_delete=models.PROTECT
    )
    winner = models.ForeignKey(
        Driver, verbose_name=_("winner"), on_delete=models.PROTECT
    )
    picture = models.ImageField(_("picture"), null=True, blank=True, default=None)
    year = models.PositiveIntegerField(_("year"))
    laps = models.PositiveIntegerField(_("laps"))
    date = models.DateField(_("date"))
    weight = models.PositiveIntegerField(_("weight"), default=0, db_index=True)

    class Meta:
        db_table = "races"
        verbose_name = _("race")
        verbose_name_plural = _("races")
        ordering = ["weight"]

    def __str__(self):
        return f"{self.circuit.name}, {self.year}"


class Standing(AuditedModel):
    race = models.ForeignKey(Race, verbose_name=_("race"), on_delete=models.PROTECT)
    driver = models.ForeignKey(
        Driver,
        verbose_name=_("driver"),
        on_delete=models.PROTECT,
        related_name="standings",
    )
    constructor = models.ForeignKey(
        Constructor, verbose_name=_("constructor"), on_delete=models.PROTECT
    )
    position = models.PositiveIntegerField(_("position"))
    number = models.PositiveIntegerField(_("number"))
    laps = models.PositiveIntegerField(_("laps"))
    points = models.DecimalField(_("points"), decimal_places=2, max_digits=4)
    weight = models.PositiveIntegerField(_("weight"), default=0, db_index=True)

    class Meta:
        db_table = "standings"
        verbose_name = _("standing")
        verbose_name_plural = _("standings")
        ordering = ["weight"]

    def __str__(self):
        return f"{self.driver.full_name}, {self.position}"


class FileStorage(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="files/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # New: optional user-set category and description
    CATEGORY_CHOICES = [
        ("BOL", "BOL"),
        ("POD", "POD"),
        ("Invoice", "Invoice"),
        ("Insurance", "Insurance"),
        ("Registration", "Registration"),
        ("IFTA", "IFTA"),
        ("Logs", "Logs"),
        ("Permits", "Permits"),
        ("Maintenance", "Maintenance"),
        ("Driver Docs", "Driver Docs"),
        ("Load Docs", "Load Docs"),
        ("Documents", "Documents"),
        ("Other", "Other"),
    ]
    category = models.CharField(
        max_length=32, choices=CATEGORY_CHOICES, blank=True, null=True
    )
    description = models.CharField(max_length=255, blank=True, null=True)
    load = models.ForeignKey(
        "Load", on_delete=models.SET_NULL, null=True, blank=True, related_name="documents"
    )

    @property
    def category_display(self):
        # Prefer explicit category if provided
        if getattr(self, "category", None):
            return self.category
        filename = (self.name or "") + " " + (self.file.name or "")
        f = filename.lower()
        mapping = [
            ("BOL", ["bol", "bill of lading"]),
            ("POD", ["pod", "proof of delivery"]),
            ("Invoice", ["invoice"]),
            ("Insurance", ["insurance", "policy", "cert"]),
            ("Registration", ["registration", "cab card"]),
            ("IFTA", ["ifta", "fuel", "miles"]),
            ("Logs", ["eld", "log"]),
            ("Permits", ["permit"]),
            ("Maintenance", ["maintenance", "repair", "service"]),
            ("Driver Docs", ["license", "cdl", "medical", "mvr"]),
            ("Load Docs", ["rate con", "rate confirmation"]),
        ]
        for label, keywords in mapping:
            if any(k in f for k in keywords):
                return label
        # fallback based on extension
        if f.endswith((".pdf", ".png", ".jpg", ".jpeg")):
            return "Documents"
        return "Other"


class IFTAReport(models.Model):
    report_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    total_miles = models.FloatField()
    total_fuel = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)


class Route(models.Model):
    name = models.CharField(max_length=255)
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    distance = models.FloatField()
    start_latitude = models.FloatField(blank=True, null=True)
    start_longitude = models.FloatField(blank=True, null=True)
    end_latitude = models.FloatField(blank=True, null=True)
    end_longitude = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Load(models.Model):
    load_name = models.CharField(max_length=255)
    description = models.TextField()
    pickup_date = models.DateField()
    delivery_date = models.DateField()
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="loads")
    created_at = models.DateTimeField(auto_now_add=True)


class BusinessAsset(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="assets/", blank=True, null=True)
    purchase_date = models.DateField()
    value = models.FloatField()
    # New optional fields to support richer display/filters
    category = models.CharField(max_length=255, blank=True, null=True)
    miles = models.FloatField(blank=True, null=True)
    hours = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Finance(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
    )
    category = models.CharField(max_length=255)
    # New: income vs expense
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, blank=True, null=True)
    amount = models.FloatField()
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expense(self) -> bool:
        if self.type:
            return self.type == "EXPENSE"
        # Fallback: negative amounts treated as expenses
        return (self.amount or 0) < 0


# =====================
# Personal section models
# =====================
class PersonalProperty(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PersonalAsset(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PersonalProject(models.Model):
    STATUS_CHOICES = (
        ("PLANNED", "Planned"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("ON_HOLD", "On Hold"),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, blank=True, null=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PersonalProjectMedia(models.Model):
    project = models.ForeignKey(PersonalProject, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to="personal_project_media/", blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.caption or (self.file.name if self.file else self.url or "media")

    @property
    def media_type(self):
        name = (self.file.name if self.file else self.url or "").lower()
        if name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
            return "image"
        if name.endswith((".mp4", ".mov", ".webm", ".m4v")):
            return "video"
        return "other"


# New: Personal savings goals
class SavingsPlan(models.Model):
    """Singleton-like model to store the weekly savings pool for goals."""
    weekly_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Savings Plan"
        verbose_name_plural = "Savings Plan"

    def __str__(self):
        return f"Weekly: ${self.weekly_amount}"


class SavingsGoal(models.Model):
    """A savings goal prioritized via drag-and-drop ordering."""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    priority = models.PositiveIntegerField(default=0, help_text="Lower number = higher priority")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority", "created_at"]

    def __str__(self):
        return self.title

    @property
    def remaining_amount(self):
        try:
            rem = (self.target_amount or 0) - (self.current_amount or 0)
        except Exception:
            rem = 0
        return max(rem, 0)

    def weeks_to_complete_alone(self, weekly_amount: float | int):
        """Number of weeks to complete this goal alone given weekly pool (ceil)."""
        try:
            w = float(weekly_amount or 0)
            if w <= 0:
                return None
            rem = float(self.remaining_amount)
            if rem <= 0:
                return 0
            import math
            return int(math.ceil(rem / w))
        except Exception:
            return None


class PersonalRepair(models.Model):
    PRIORITY_CHOICES = (("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"))
    STATUS_CHOICES = (
        ("OPEN", "Open"),
        ("SCHEDULED", "Scheduled"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, blank=True, null=True)
    reported_by = models.CharField(max_length=255, blank=True, null=True)
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    reported_date = models.DateField(blank=True, null=True)
    scheduled_date = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PersonalFinancialEntry(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
    )
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Optional: category and type (like admin Finance)
    category = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} ${self.amount}"


class PersonalDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="personal_docs/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PersonalReport(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PersonalTask(models.Model):
    PRIORITY_CHOICES = (("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"))
    STATUS_CHOICES = (("TODO", "To Do"), ("IN_PROGRESS", "In Progress"), ("DONE", "Done"))
    project = models.ForeignKey(PersonalProject, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="TODO")
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, blank=True, null=True)
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    # New fields for planning and visualization
    section = models.CharField(max_length=255, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    progress = models.PositiveIntegerField(default=0)
    ai_suggested = models.BooleanField(default=False)
    ai_details = models.JSONField(blank=True, null=True)
    # New: estimated hours for scheduling into weekly calendar
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


# New: Personal monthly recurring income/expense items
class PersonalMonthlyItem(models.Model):
    TYPE_CHOICES = (
        ("INCOME", "Income"),
        ("EXPENSE", "Expense"),
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=255, blank=True, null=True)
    day_of_month = models.PositiveSmallIntegerField(blank=True, null=True, help_text="Day of month this is due/received (1-31)")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["type", "title"]

    def __str__(self):
        sign = "+" if self.type == "INCOME" else "-"
        return f"{self.title} {sign}${self.amount}"
