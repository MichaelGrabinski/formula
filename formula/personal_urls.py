from django.urls import path
from . import views

urlpatterns = [
    path("", views.PersonalDashboardView.as_view(), name="dashboard"),
    path("properties/", views.PersonalPropertiesView.as_view(), name="properties"),
    path("properties/<int:pk>/edit/", views.PersonalPropertyEditView.as_view(), name="edit_property"),
    path("properties/<int:pk>/delete/", views.PersonalPropertyDeleteView.as_view(), name="delete_property"),

    path("repairs/", views.PersonalRepairsView.as_view(), name="repairs"),
    path("repairs/<int:pk>/edit/", views.PersonalRepairEditView.as_view(), name="edit_repair"),
    path("repairs/<int:pk>/delete/", views.PersonalRepairDeleteView.as_view(), name="delete_repair"),

    path("projects/", views.PersonalProjectsView.as_view(), name="projects"),
    path("projects/scheduler/", views.ProjectSchedulerView.as_view(), name="project_scheduler"),
    path("projects/scheduler/compact/", views.ProjectSchedulerCompactView.as_view(), name="project_scheduler_compact"),
    path("projects/<int:pk>/edit/", views.PersonalProjectEditView.as_view(), name="edit_project"),
    path("projects/<int:pk>/delete/", views.PersonalProjectDeleteView.as_view(), name="delete_project"),

    path("tasks/<int:pk>/edit/", views.ProjectTaskEditView.as_view(), name="edit_task"),
    path("tasks/<int:pk>/delete/", views.ProjectTaskDeleteView.as_view(), name="delete_task"),
    path("tasks/<int:pk>/enrich/", views.enrich_task_with_ai, name="enrich_task"),

    # Savings Goals
    path("goals/", views.SavingsGoalsView.as_view(), name="goals"),
    path("goals/v2/", views.SavingsGoalsV2View.as_view(), name="goals_v2"),
    path("goals/v2/react/", views.SavingsGoalsV2EmbedView.as_view(), name="goals_v2_embed"),
    # Lightweight API for the embedded original goals dashboard
    path("goals/v2/api/list", views.api_goals_list, name="goals_v2_api_list"),
    path("goals/v2/api/add", views.api_goals_add, name="goals_v2_api_add"),
    path("goals/v2/api/update/<int:pk>/", views.api_goals_update, name="goals_v2_api_update"),
    path("goals/v2/api/delete/<int:pk>/", views.api_goals_delete, name="goals_v2_api_delete"),
    path("goals/reorder/", views.reorder_goals, name="goals_reorder"),
    path("goals/update-amount/<int:pk>/", views.update_goal_amount, name="goals_update_amount"),

    path("assets/", views.PersonalAssetsView.as_view(), name="assets"),
    path("assets/<int:pk>/edit/", views.PersonalAssetEditView.as_view(), name="edit_asset"),
    path("assets/<int:pk>/delete/", views.PersonalAssetDeleteView.as_view(), name="delete_asset"),

    path("financial/", views.PersonalFinancialView.as_view(), name="financial"),
    path("financial/<int:pk>/edit/", views.PersonalFinancialEditView.as_view(), name="edit_financial_entry"),
    path("financial/<int:pk>/delete/", views.PersonalFinancialDeleteView.as_view(), name="delete_financial_entry"),
    # Monthly recurring items subpage
    path("financial/monthly/", views.PersonalMonthlyItemsView.as_view(), name="monthly_items"),
    path("financial/monthly/<int:pk>/edit/", views.PersonalMonthlyItemEditView.as_view(), name="edit_monthly_item"),
    path("financial/monthly/<int:pk>/delete/", views.PersonalMonthlyItemDeleteView.as_view(), name="delete_monthly_item"),

    path("documents/", views.PersonalDocumentsView.as_view(), name="documents"),
    path("documents/<int:pk>/edit/", views.PersonalDocumentEditView.as_view(), name="edit_document"),
    path("documents/<int:pk>/delete/", views.PersonalDocumentDeleteView.as_view(), name="delete_document"),

    path("reports/", views.PersonalReportsView.as_view(), name="reports"),
    path("reports/<int:pk>/edit/", views.PersonalReportEditView.as_view(), name="edit_report"),
    path("reports/<int:pk>/delete/", views.PersonalReportDeleteView.as_view(), name="delete_report"),

    path("calendar/", views.GlobalCalendarView.as_view(), name="global_calendar"),

    path("ai/", views.PersonalAIChatView.as_view(), name="personal_ai"),
]
