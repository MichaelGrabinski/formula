from django.shortcuts import render, redirect, get_object_or_404
from .models import Repair
from .forms import RepairForm
from .forms_ai import AIChatForm
from django.conf import settings
import openai
import datetime
from django.contrib import messages
from django.core.paginator import Paginator

# Export views for use in urls.py
__all__ = [
    'dashboard', 'repairs', 'projects', 'assets', 'financial', 'reports', 'documents', 'ai_chat',
    'properties', 'edit_asset', 'delete_asset', 'edit_property', 'delete_property',
    'edit_project', 'delete_project'
]

def dashboard(request):
    # Compute metrics for dashboard display
    from .models import Project, FinancialEntry, Report, Document, Repair, Property, Asset, Unit
    total_projects = Project.objects.count()
    total_financial_entries = FinancialEntry.objects.count()
    total_reports = Report.objects.count()
    total_documents = Document.objects.count()
    total_repairs = Repair.objects.count()
    total_properties = Property.objects.count()
    total_units = Unit.objects.count()
    total_assets = Asset.objects.count()
    return render(request, 'dashboard.html', {
        'total_projects': total_projects,
        'total_financial_entries': total_financial_entries,
        'total_reports': total_reports,
        'total_documents': total_documents,
        'total_repairs': total_repairs,
        'total_properties': total_properties,
        'total_units': total_units,
        'total_assets': total_assets,
    })

def repairs(request):
    from .models import Repair
    from .forms import RepairForm
    query = request.GET.get('search', '')
    repairs_qs = Repair.objects.filter(title__icontains=query).order_by('-reported_date')
    paginator = Paginator(repairs_qs, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.method == 'POST':
        form = RepairForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Repair ticket created successfully.')
            return redirect('repairs')
        else:
            messages.error(request, 'Failed to create repair ticket. Please check the form.')
    else:
        form = RepairForm()

    return render(request, 'repairs.html', {'form': form, 'page_obj': page_obj, 'search_query': query})

def projects(request):
    from .forms import ProjectForm
    from .models import Project
    query = request.GET.get('search', '')
    projects = Project.objects.filter(name__icontains=query).order_by('-created_at')
    paginator = Paginator(projects, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Project created successfully.')
            return redirect('projects')
        else:
            messages.error(request, 'Failed to create project. Please check the form.')
    else:
        form = ProjectForm()

    return render(request, 'projects.html', {'form': form, 'page_obj': page_obj, 'search_query': query})

def assets(request):
    from .models import Asset
    from .forms import AssetForm
    query = request.GET.get('search', '')
    assets = Asset.objects.filter(name__icontains=query).order_by('-id')
    paginator = Paginator(assets, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('assets')
    else:
        form = AssetForm()
    return render(request, 'assets.html', {'form': form, 'page_obj': page_obj, 'search_query': query})

def financial(request):
    from .models import FinancialEntry
    from .forms import FinancialEntryForm
    query = request.GET.get('search', '')
    financial_entries = FinancialEntry.objects.filter(description__icontains=query).order_by('-date')
    paginator = Paginator(financial_entries, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.method == 'POST':
        form = FinancialEntryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Financial entry created successfully.')
            return redirect('financial')
        else:
            messages.error(request, 'Failed to create financial entry. Please check the form.')
    else:
        form = FinancialEntryForm()

    return render(request, 'financial.html', {'form': form, 'page_obj': page_obj, 'search_query': query})

def reports(request):
    if request.method == 'POST':
        from .forms import ReportForm
        form = ReportForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Report created successfully.')
            return redirect('reports')
        else:
            messages.error(request, 'Failed to create report. Please check the form.')
    else:
        from .forms import ReportForm
        form = ReportForm()
    from .models import Report
    query = request.GET.get('search', '')
    reports = Report.objects.filter(title__icontains=query).order_by('-created_at')
    paginator = Paginator(reports, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'reports.html', {'reports': reports, 'form': form, 'page_obj': page_obj, 'search_query': query})

def documents(request):
    if request.method == 'POST':
        from .forms import DocumentForm
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Document uploaded successfully.')
            return redirect('documents')
        else:
            messages.error(request, 'Failed to upload document. Please check the form.')
    else:
        from .forms import DocumentForm
        form = DocumentForm()
    from .models import Document
    query = request.GET.get('search', '')
    documents = Document.objects.filter(title__icontains=query).order_by('-uploaded_at')
    paginator = Paginator(documents, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'documents.html', {'documents': documents, 'form': form, 'page_obj': page_obj, 'search_query': query})

def ai_chat(request):
    # Model options
    model_options = [
        ('gpt-4o', 'GPT-4o'),
        ('gpt-4o-mini', 'GPT-4o Mini'),
        ('o3-mini', 'O3 Mini'),
        ('o1-mini', 'O1 Mini'),
        ('o1-preview', 'O1 Preview'),
        ('gpt-4-turbo', 'GPT-4 Turbo'),
    ]
    # System prompt options
    system_prompts = [
        ('property-assistant', 'Property Management Assistant', "You are a professional property management assistant with access to the user's complete property portfolio data. You can help with financial analysis, property management decisions, project planning, maintenance scheduling, and investment strategies. Always provide specific, actionable advice based on the actual data provided. Format your responses clearly with proper headings, bullet points, and mathematical formulas when needed."),
        ('general-purpose', 'General Purpose Assistant', "You are a helpful, knowledgeable AI assistant. Provide accurate, helpful responses to any questions or tasks. Be concise but thorough in your explanations. Format your responses clearly with proper structure and formatting."),
    ]
    # Conversation/thread support
    conversations = request.session.get('ai_chat_conversations', {})
    current_thread = request.session.get('ai_chat_current_thread', 'default')
    # Thread selection via GET or POST
    if request.method == 'POST' and 'new_thread' in request.POST:
        # Start a new thread
        current_thread = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        conversations[current_thread] = []
        request.session['ai_chat_current_thread'] = current_thread
    elif request.method == 'POST' and 'select_thread' in request.POST:
        # Switch to selected thread
        selected_thread = request.POST.get('select_thread')
        if selected_thread in conversations:
            current_thread = selected_thread
            request.session['ai_chat_current_thread'] = current_thread
    elif request.method == 'GET' and 'thread' in request.GET:
        selected_thread = request.GET.get('thread')
        if selected_thread in conversations:
            current_thread = selected_thread
            request.session['ai_chat_current_thread'] = current_thread
    messages = conversations.get(current_thread, [])
    selected_model = request.session.get('ai_chat_model', model_options[0][0])
    selected_prompt = request.session.get('ai_chat_system', system_prompts[0][0])
    if request.method == 'POST':
        form = AIChatForm(request.POST)
        selected_model = request.POST.get('model', model_options[0][0])
        selected_prompt = request.POST.get('system_prompt', system_prompts[0][0])
        if form.is_valid():
            user_message = form.cleaned_data['prompt']
            # Get system prompt text
            system_prompt_text = next((p[2] for p in system_prompts if p[0] == selected_prompt), system_prompts[0][2])
            # Prepare OpenAI messages
            openai_messages = [
                {"role": "system", "content": system_prompt_text},
            ]
            for m in messages:
                openai_messages.append({"role": m["role"], "content": m["content"]})
            openai_messages.append({"role": "user", "content": user_message})
            if form.cleaned_data.get('file'):
                uploaded_file = form.cleaned_data.get('file')
                file_content = uploaded_file.read().decode(errors='ignore')
                openai_messages.append({"role": "user", "content": f"[File uploaded]\n{file_content}"})

            # Call OpenAI API
            try:
                import openai
                from django.conf import settings
                api_key = getattr(settings, 'OPENAI_API_KEY', None)
                if not api_key:
                    import os
                    api_key = os.environ.get('OPENAI_API_KEY')
                if not api_key:
                    raise Exception('OpenAI API key not set in settings or environment')
                client = openai.OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=selected_model,
                    messages=openai_messages,
                    max_tokens=512,
                )
                ai_response = response.choices[0].message.content
            except Exception as e:
                ai_response = f"[Error: {str(e)}]"
            timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
            messages.append({'role': 'user', 'content': user_message, 'timestamp': timestamp})
            messages.append({'role': 'assistant', 'content': ai_response, 'timestamp': timestamp})
            conversations[current_thread] = messages
            request.session['ai_chat_conversations'] = conversations
            request.session['ai_chat_current_thread'] = current_thread
            request.session['ai_chat_model'] = selected_model
            request.session['ai_chat_system'] = selected_prompt
            return redirect('ai_chat')
    else:
        form = AIChatForm()
    return render(request, 'ai_chat.html', {
        'form': form,
        'messages': messages,
        'model_options': model_options,
        'selected_model': selected_model,
        'system_prompts': system_prompts,
        'selected_prompt': selected_prompt,
        'conversations': conversations,
        'current_thread': current_thread,
        'conversation_list': [(tid, messages[0]['timestamp'] if messages else tid) for tid, messages in conversations.items()],
    })

def properties(request):
    from .models import Property
    from .forms import PropertyForm
    query = request.GET.get('search', '')
    properties_qs = Property.objects.filter(name__icontains=query).order_by('-created_at')
    paginator = Paginator(properties_qs, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    if request.method == 'POST':
        form = PropertyForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Property added successfully.')
            return redirect('properties')
        else:
            messages.error(request, 'Failed to add property. Please check the form.')
    else:
        form = PropertyForm()

    return render(request, 'properties.html', {'form': form, 'page_obj': page_obj, 'search_query': query})

def edit_asset(request, asset_id):
    from .models import Asset
    from .forms import AssetForm
    asset = get_object_or_404(Asset, id=asset_id)
    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES, instance=asset)
        if form.is_valid():
            form.save()
            return redirect('assets')
    else:
        form = AssetForm(instance=asset)
    assets = Asset.objects.all().order_by('-id')
    return render(request, 'assets.html', {'assets': assets, 'form': form, 'edit_asset': asset})

def delete_asset(request, asset_id):
    from .models import Asset
    asset = get_object_or_404(Asset, id=asset_id)
    asset.delete()
    return redirect('assets')

def edit_project(request, project_id):
    from .models import Project
    from .forms import ProjectForm
    project = get_object_or_404(Project, id=project_id)
    if request.method == 'POST':
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            messages.success(request, 'Project updated successfully.')
            return redirect('projects')
        else:
            messages.error(request, 'Failed to update project. Please check the form.')
    else:
        form = ProjectForm(instance=project)
    projects = Project.objects.all().order_by('-created_at')
    return render(request, 'projects.html', {'projects': projects, 'form': form, 'edit_project': project})

def delete_project(request, project_id):
    from .models import Project
    project = get_object_or_404(Project, id=project_id)
    project.delete()
    messages.success(request, 'Project deleted successfully.')
    return redirect('projects')

def delete_financial_entry(request, entry_id):
    from .models import FinancialEntry
    entry = get_object_or_404(FinancialEntry, id=entry_id)
    entry.delete()
    return redirect('financial')

def delete_report(request, report_id):
    from .models import Report
    report = get_object_or_404(Report, id=report_id)
    report.delete()
    return redirect('reports')

def delete_document(request, document_id):
    from .models import Document
    document = get_object_or_404(Document, id=document_id)
    document.delete()
    return redirect('documents')

def edit_property(request, property_id):
    from .models import Property
    from .forms import PropertyForm
    property = get_object_or_404(Property, id=property_id)
    if request.method == 'POST':
        form = PropertyForm(request.POST, request.FILES, instance=property)
        if form.is_valid():
            form.save()
            messages.success(request, 'Property updated successfully.')
            return redirect('properties')
        else:
            messages.error(request, 'Failed to update property. Please check the form.')
    else:
        form = PropertyForm(instance=property)
    properties = Property.objects.all().order_by('-created_at')
    return render(request, 'properties.html', {'properties': properties, 'form': form, 'edit_property': property})
