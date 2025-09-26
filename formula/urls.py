from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.urls import include, path

from formula.sites import formula_admin_site
from . import views

urlpatterns = (
    [
    # Public site
    path("", views.PublicHomePageView.as_view(), name="public_home"),
    path("services/", views.PublicServicesView.as_view(), name="public_services"),
    path("cars/", views.PublicCarsView.as_view(), name="public_cars"),
    path("cars/<int:pk>/", views.PublicCarDetailView.as_view(), name="public_car_detail"),
    path("contact/submit/", views.ContactSubmitView.as_view(), name="contact_submit"),
    path("login/", views.LoginRedirectView.as_view(), name="login"),

    # Internal dashboard (employees can use admin login, then access personal tools)
    path("app/", views.HomeView.as_view(), name="internal_home"),
        path("i18n/", include("django.conf.urls.i18n")),
    path("__debug__/", include("debug_toolbar.urls")),
        path("ai/", views.AIAssistantView.as_view(), name="ai_assistant"),
        path("personal/", include("formula.personal_urls")),

        # Assignments evaluation tool
    path("assignments/", views.list_view, name="assignments_list"),
    path("assignments/upload/", views.upload_view, name="assignments_upload"),
    path("assignments/<int:pk>/", views.detail_view, name="assignments_detail"),
    path("assignments/<int:pk>/chat/", views.chat_view, name="assignments_chat"),
    path("tv/dashboard/", views.tv_dashboard, name="tv_dashboard"),
    ]
    + i18n_patterns(
        path("admin/", formula_admin_site.urls),
        path('filestorage/', views.FileStorageListView.as_view(), name='filestorage_list'),
        path('filestorage/add/', views.FileStorageCreateView.as_view(), name='filestorage_add'),
        path('filestorage/<int:pk>/edit/', views.FileStorageUpdateView.as_view(), name='filestorage_edit'),
        path('filestorage/<int:pk>/delete/', views.FileStorageDeleteView.as_view(), name='filestorage_delete'),
        path('iftareport/', views.IFTAReportListView.as_view(), name='iftareport_list'),
        path('iftareport/add/', views.IFTAReportCreateView.as_view(), name='iftareport_add'),
        path('iftareport/<int:pk>/edit/', views.IFTAReportUpdateView.as_view(), name='iftareport_edit'),
        path('iftareport/<int:pk>/delete/', views.IFTAReportDeleteView.as_view(), name='iftareport_delete'),
        path('route/', views.RouteListView.as_view(), name='route_list'),
        path('route/add/', views.RouteCreateView.as_view(), name='route_add'),
        path('route/<int:pk>/edit/', views.RouteUpdateView.as_view(), name='route_edit'),
        path('route/<int:pk>/delete/', views.RouteDeleteView.as_view(), name='route_delete'),
        path('load/', views.LoadListView.as_view(), name='load_list'),
        path('load/add/', views.LoadCreateView.as_view(), name='load_add'),
        path('load/<int:pk>/edit/', views.LoadUpdateView.as_view(), name='load_edit'),
        path('load/<int:pk>/delete/', views.LoadDeleteView.as_view(), name='load_delete'),
        path('driver/', views.DriverListView.as_view(), name='driver_list'),
        path('driver/add/', views.DriverCreateView.as_view(), name='driver_add'),
        path('driver/<int:pk>/edit/', views.DriverUpdateView.as_view(), name='driver_edit'),
        path('driver/<int:pk>/delete/', views.DriverDeleteView.as_view(), name='driver_delete'),
        path('businessasset/', views.BusinessAssetListView.as_view(), name='businessasset_list'),
        path('businessasset/add/', views.BusinessAssetCreateView.as_view(), name='businessasset_add'),
        path('businessasset/<int:pk>/edit/', views.BusinessAssetUpdateView.as_view(), name='businessasset_edit'),
        path('businessasset/<int:pk>/delete/', views.BusinessAssetDeleteView.as_view(), name='businessasset_delete'),
        path('finance/', views.FinanceListView.as_view(), name='finance_list'),
        path('finance/add/', views.FinanceCreateView.as_view(), name='finance_add'),
        path('finance/<int:pk>/edit/', views.FinanceUpdateView.as_view(), name='finance_edit'),
        path('finance/<int:pk>/delete/', views.FinanceDeleteView.as_view(), name='finance_delete'),
    )
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
)
