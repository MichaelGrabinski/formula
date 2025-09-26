from django.contrib import messages
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.auth.views import redirect_to_login


class ReadonlyExceptionHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if (
            exception
            and repr(exception)
            == "ReadonlyException('Database is operating in readonly mode. Not possible to save any data.')"
        ):
            messages.warning(
                request,
                _(
                    "Database is operating in readonly mode. Not possible to save any data."
                ),
            )
            return redirect(request.headers.get("referer", reverse_lazy("admin:login")))


class PublicLoginExemptMiddleware:
    """Require login for internal sections but exempt public site.

    Exempt prefixes: '/', '/services/', '/cars/', '/cars/<id>/', '/contact/submit/', '/login/', static/media and debug.
    Protect: '/app/', '/admin/', '/personal/', assignments, and anything not starting with an exempt path.
    """

    EXEMPT_PREFIXES = (
        "/",  # root public site
        "/services/",
        "/cars/",
        "/contact/submit/",
        "/login/",
        settings.STATIC_URL,
        settings.MEDIA_URL,
        "/__debug__/",
        "/i18n/",
    )

    PROTECTED_PREFIXES = (
        "/app/",
        "/admin/",
        "/personal/",
        "/assignments/",
        "/tv/",
        "/filestorage/",
        "/iftareport/",
        "/route/",
        "/load/",
        "/driver/",
        "/businessasset/",
        "/finance/",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        # Public car detail pages like /cars/<id>/ are covered by '/cars/' prefix.
        is_exempt = any(path.startswith(p) for p in self.EXEMPT_PREFIXES)
        is_protected = any(path.startswith(p) for p in self.PROTECTED_PREFIXES)

        if is_protected and not request.user.is_authenticated:
            return redirect_to_login(path, login_url=reverse_lazy("admin:login"))

        # Explicitly allow public root and related paths even if not authenticated
        if is_exempt:
            return self.get_response(request)

        # Default: allow unauthenticated for non-admin pages under '/'
        return self.get_response(request)
