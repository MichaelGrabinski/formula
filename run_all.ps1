<#
Run all setup tasks for development on Windows (PowerShell).

What this script does:
- Create and activate a virtualenv at .venv
- Install Python dependencies from requirements.txt if present
- Run Django makemigrations and migrate for the 'formula' app
- Seed sample cars (management command)
- Build Tailwind CSS (uses root package.json script: tailwind:build)
- Install frontend npm deps and start the Vite dev server for frontend_v2 in a new window
- Start Django development server in the current window

Run this from the repository root in PowerShell.
#>

Set-StrictMode -Version Latest

function Write-Note($msg) { Write-Host "[run_all] $msg" -ForegroundColor Cyan }

cd $PSScriptRoot

if (-not (Test-Path -Path '.venv')) {
    Write-Note 'Creating virtualenv at .venv'
    python -m venv .venv
}

# Activate venv for this script
$activate = Join-Path $PSScriptRoot '.venv\Scripts\Activate.ps1'
if (Test-Path $activate) {
    Write-Note 'Activating virtualenv'
    & $activate
} else {
    Write-Note 'Virtualenv activate script not found; ensure you activate your environment manually'
}

# Install python deps
if (Test-Path 'requirements.txt') {
    Write-Note 'Installing Python requirements'
    pip install -r requirements.txt
} elseif (Test-Path 'pyproject.toml') {
    Write-Note 'pyproject.toml found — using pip to install poetry-managed deps if poetry.lock exists'
    if (Get-Command poetry -ErrorAction SilentlyContinue) {
        poetry install
    } else {
        Write-Note 'poetry not found; skipping poetry install — consider running `poetry install`'
    }
} else {
    Write-Note 'No requirements.txt found — skipping pip install'
}

# Run Django migrations (best-effort)
if (Test-Path 'manage.py') {
    Write-Note 'Making migrations (formula) and applying migrations'
    python manage.py makemigrations formula
    python manage.py migrate

    Write-Note 'Seeding sample cars (management command)'
    python manage.py seed_cars
} else {
    Write-Note 'manage.py not found — are you in the repo root? Skipping migrations and seed.'
}

# Build Tailwind CSS via npm script in root package.json if present
if (Test-Path 'package.json') {
    $pkg = Get-Content package.json -Raw
    if ($pkg -match '"tailwind:build"') {
        Write-Note 'Installing root npm deps for tailwind'
        npm install
        Write-Note 'Building tailwind CSS (tailwind:build)'
        npm run tailwind:build
    } else {
        Write-Note 'No tailwind:build script found in root package.json; skipping'
    }
}

# Start frontend dev server(s) — frontend_v2 uses Vite
$frontendV2 = Join-Path $PSScriptRoot 'frontend_v2'
if (Test-Path (Join-Path $frontendV2 'package.json')) {
    Write-Note 'Installing frontend_v2 npm deps'
    Push-Location $frontendV2
    npm install
    Write-Note 'Starting frontend_v2 dev server in a new PowerShell window (runs `npm run dev`)'
    Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendV2'; npm run dev"
    Pop-Location
} else {
    Write-Note 'frontend_v2 not found — skipping frontend dev server start.'
}

# Finally, start Django runserver in this window
if (Test-Path 'manage.py') {
    Write-Note 'Starting Django development server (http://127.0.0.1:8000)'
    python manage.py runserver
} else {
    Write-Note 'manage.py not found — cannot start Django runserver.'
}

Write-Note 'run_all.ps1 finished.'
