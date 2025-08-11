from django import forms

class AIChatForm(forms.Form):
    prompt = forms.CharField(
        label='Your Message',
        widget=forms.Textarea(attrs={'rows': 3, 'class': 'form-control', 'placeholder': 'Type your question or request here...'}),
        required=True
    )
