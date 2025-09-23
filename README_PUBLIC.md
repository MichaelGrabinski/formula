Public landing enhancements

What changed
- Added public landing pages and cars listing templates: `templates/public_home.html`, `templates/public_services.html`, `templates/public_cars.html`.
- Added `Lead` and `Car` models in `formula/models.py` and admin registration in `formula/admin.py`.
- Added `LeadForm` and `ContactSubmitView` to accept contact submissions and persist leads.

Local setup / migrations

1. Make migrations for the new models and apply them:

```powershell
python manage.py makemigrations formula
python manage.py migrate
```

2. (Optional) Create a superuser to view leads/cars in admin:

```powershell
python manage.py createsuperuser
```

3. Run the dev server and visit:

 - http://127.0.0.1:8000/  (public landing)
 - http://127.0.0.1:8000/services/
 - http://127.0.0.1:8000/cars/
 - http://127.0.0.1:8000/dashboard/ (internal dashboard)

Notes
- The `public_home` template will render a `lead_form` if provided by the view; the contact submit endpoint is `POST /contact/submit/`.
- Placeholder images are in `static/img/` — replace them with real assets for production.

Quick all-in-one setup (Windows PowerShell)

There is a convenience script `run_all.ps1` at the repository root that will:

- create/activate a `.venv` (if not present)
- install Python requirements (from `requirements.txt`)
- make migrations and migrate for `formula`
- seed sample cars via `python manage.py seed_cars`
- run the root `tailwind:build` npm script (if present)
- install and start `frontend_v2` dev server (Vite) in a new PowerShell window
- start the Django development server

Run it from PowerShell:

```powershell
.\run_all.ps1
```

Email configuration (development)

To receive lead notifications, set these in your Django settings (development example):

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # prints emails to the console
SALES_EMAIL = 'you@example.com'
DEFAULT_FROM_EMAIL = 'webmaster@example.com'
```

For production, configure a real EMAIL_BACKEND and `SALES_EMAIL`.

Troubleshooting dependencies

- `run_all.ps1` checks `requirements.txt` and attempts to install missing packages using `pip` (or `python -m pip`). If you see errors, make sure your Python is on PATH and you have an active virtualenv.
- The script also verifies `node` and `npm` before attempting frontend tasks. If Node is missing, install it from https://nodejs.org/.
- If you manage Python deps with `poetry`, run `poetry install` manually instead of relying on `run_all.ps1`.
