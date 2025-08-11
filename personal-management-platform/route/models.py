from django.db import models

class Property(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    owner = models.CharField(max_length=255, blank=True, null=True)
    property_type = models.CharField(max_length=50, choices=[('Residential', 'Residential'), ('Commercial', 'Commercial'), ('Industrial', 'Industrial')], default='Residential')
    purchase_date = models.DateField(blank=True, null=True)
    value = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    number_of_units = models.PositiveIntegerField(blank=True, null=True)
    # GPS coordinates for property location
    gps_latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    gps_longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    # Image of the property
    image = models.ImageField(upload_to='properties/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Unit(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=50)
    floor = models.CharField(max_length=10, blank=True, null=True)
    bedrooms = models.PositiveSmallIntegerField(blank=True, null=True)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    is_occupied = models.BooleanField(default=False)
    rent_amount = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    tenant_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Asset(models.Model):
    CATEGORY_CHOICES = [
        ('Heavy Machinery', 'Heavy Machinery'),
        ('Car', 'Car'),
        ('Truck', 'Truck'),
        ('Semi Truck', 'Semi Truck'),
        ('Boat', 'Boat'),
        ('Motorcycle', 'Motorcycle'),
        ('Tools', 'Tools'),
        ('Equipment', 'Equipment'),
    ]
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Tools')
    purchase_date = models.DateField(blank=True, null=True)
    value = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True)
    warranty_expiration = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    assigned_unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True, related_name='assets')
    # Image of the asset
    image = models.ImageField(upload_to='assets/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Repair(models.Model):
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Emergency', 'Emergency')])
    status = models.CharField(max_length=20, choices=[('Open', 'Open'), ('Scheduled', 'Scheduled'), ('In Progress', 'In Progress')])
    reported_by = models.CharField(max_length=255)
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reported_date = models.DateField()
    scheduled_date = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=50)

    resolution_date = models.DateField(blank=True, null=True)
    completion_notes = models.TextField(blank=True, null=True)
    def __str__(self):
        return f"{self.title} - {self.status}"

class Project(models.Model):
    STATUS_CHOICES = [
        ('Planned', 'Planned'),
        ('Active', 'Active'),
        ('Completed', 'Completed'),
        ('On Hold', 'On Hold'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planned')
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class FinancialEntry(models.Model):
    TRANSACTION_TYPES = [
        ('Income', 'Income'),
        ('Expense', 'Expense'),
        ('Transfer', 'Transfer'),
    ]
    CATEGORIES = [
        ('Rent', 'Rent'),
        ('Utilities', 'Utilities'),
        ('Maintenance', 'Maintenance'),
        ('Salary', 'Salary'),
        ('Miscellaneous', 'Miscellaneous'),
    ]
    date = models.DateField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='Expense')
    category = models.CharField(max_length=50, choices=CATEGORIES, default='Miscellaneous')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    account = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Report(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    report_date = models.DateField(blank=True, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Document(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.CharField(max_length=255, blank=True, null=True)
    # Location associated with the document (e.g., GPS or address)
    location = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
