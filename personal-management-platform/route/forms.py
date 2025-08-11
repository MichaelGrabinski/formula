from django import forms
from .models import Repair, Property, Asset, Project, FinancialEntry, Report, Document

class RepairForm(forms.ModelForm):
    class Meta:
        model = Repair
        fields = [
            'property', 'unit', 'asset', 'title', 'description', 'priority', 'status',
            'reported_by', 'assigned_to', 'estimated_cost', 'reported_date', 'scheduled_date', 'category'
        ]
        widgets = {
            'reported_date': forms.DateInput(attrs={'type': 'date'}),
            'scheduled_date': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        }

class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        fields = ['name', 'address', 'property_type', 'purchase_date', 'value', 'gps_latitude', 'gps_longitude', 'image']
        widgets = {
            'purchase_date': forms.DateInput(attrs={'type': 'date'}),
            'gps_latitude': forms.NumberInput(attrs={'step': '0.000001'}),
            'gps_longitude': forms.NumberInput(attrs={'step': '0.000001'}),
            'image': forms.ClearableFileInput(),
        }

class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = ['name', 'category', 'purchase_date', 'value', 'serial_number', 'image']
        widgets = {
            'purchase_date': forms.DateInput(attrs={'type': 'date'}),
            'image': forms.ClearableFileInput(),
        }

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'start_date', 'end_date', 'status', 'budget', 'assigned_to']
        widgets = {
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
            'budget': forms.NumberInput(),
        }

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if not name:
            raise forms.ValidationError('Project name is required.')
        return name

class FinancialEntryForm(forms.ModelForm):
    class Meta:
        model = FinancialEntry
        fields = ['date', 'amount', 'description']

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount <= 0:
            raise forms.ValidationError('Amount must be greater than zero.')
        return amount

class ReportForm(forms.ModelForm):
    class Meta:
        model = Report
        fields = ['title', 'content']

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not title:
            raise forms.ValidationError('Report title is required.')
        return title

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title', 'file', 'location']

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if not file:
            raise forms.ValidationError('File upload is required.')
        return file
