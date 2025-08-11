from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, UnitViewSet, AssetViewSet, RepairViewSet
from .views_index import index
from .views_tabs import (
    dashboard, repairs, projects, assets, financial, reports, documents, ai_chat,
    properties, edit_asset, delete_asset, edit_property, delete_property
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'units', UnitViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'repairs', RepairViewSet)

urlpatterns = [
    path('', dashboard, name='dashboard'),
    path('repairs/', repairs, name='repairs'),
    path('projects/', projects, name='projects'),
    path('assets/', assets, name='assets'),
    path('financial/', financial, name='financial'),
    path('reports/', reports, name='reports'),
    path('documents/', documents, name='documents'),
    path('ai-chat/', ai_chat, name='ai_chat'),
    path('properties/', properties, name='properties'),
    path('api/', include(router.urls)),
    path('assets/edit/<int:asset_id>/', edit_asset, name='edit_asset'),
    path('assets/delete/<int:asset_id>/', delete_asset, name='delete_asset'),
    path('properties/edit/<int:property_id>/', edit_property, name='edit_property'),
    path('properties/delete/<int:property_id>/', delete_property, name='delete_property'),
    path('projects/edit/<int:project_id>/', edit_project, name='edit_project'),
    path('projects/delete/<int:project_id>/', delete_project, name='delete_project'),
]
