# Django REST Framework settings for the new app
INSTALLED_APPS = [
    # ...existing apps...
    'rest_framework',
    'route',
]

# Optionally, add REST Framework default settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
}
