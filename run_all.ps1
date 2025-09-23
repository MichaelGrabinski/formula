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

function Test-CommandExists($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

# Ensure pip is available
if (-not (Test-CommandExists 'pip')) {
    Write-Note 'pip not found on PATH; attempting to use python -m pip'
    if (Test-CommandExists 'python') {
        function pip { python -m pip @Args }
    } else {
        Write-Note 'python not found; cannot install Python packages automatically. Please install Python and pip.'
    }
}

# Install python deps by checking requirements.txt and installing missing packages
if (Test-Path 'requirements.txt') {
    Write-Note 'Checking Python requirements from requirements.txt'
    $reqLines = Get-Content requirements.txt | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }
    $missing = @()
    foreach ($line in $reqLines) {
        # parse package name (handle ==, >=, <=, ~=, >)
        $pkg = $line -split '[<>=~!]' | Select-Object -First 1
        $pkg = $pkg.Trim()
        if (-not $pkg) { continue }
        # pip show returns non-zero if not installed
        $proc = Start-Process -FilePath pip -ArgumentList "show","$pkg" -NoNewWindow -PassThru -Wait -ErrorAction SilentlyContinue
        if ($proc.ExitCode -ne 0) {
            $missing += $line
        }
    }

    if ($missing.Count -gt 0) {
        Write-Note "Missing packages detected: $($missing -join ', ')"
        Write-Note 'Installing missing packages via pip install -r requirements.txt'
        pip install -r requirements.txt
    } else {
        Write-Note 'All required Python packages appear to be installed.'
    }
} elseif (Test-Path 'pyproject.toml') {
    Write-Note 'pyproject.toml found — if you use poetry, run `poetry install` manually or install poetry.'
    if (-not (Test-CommandExists 'poetry')) {
        Write-Note 'poetry not found; skipping automatic poetry install.'
    } else {
        Write-Note 'Running poetry install'
        poetry install
    }
} else {
    Write-Note 'No requirements.txt or pyproject.toml found — skipping Python package install.'
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
        # Ensure node/npm available
        if (-not (Test-CommandExists 'npm')) {
            Write-Note 'npm not found on PATH; please install Node.js and npm to build Tailwind.'
        } else {
            Write-Note 'Installing root npm deps for tailwind'
            npm install
            Write-Note 'Building tailwind CSS (tailwind:build)'
            npm run tailwind:build
        }
    } else {
        Write-Note 'No tailwind:build script found in root package.json; skipping'
    }
}

# Start frontend dev server(s) — frontend_v2 uses Vite
$frontendV2 = Join-Path $PSScriptRoot 'frontend_v2'
if (Test-Path (Join-Path $frontendV2 'package.json')) {
    Write-Note 'Installing frontend_v2 npm deps'
    Push-Location $frontendV2
    if (-not (Test-CommandExists 'node') -or -not (Test-CommandExists 'npm')) {
        Write-Note 'Node or npm not found; skipping frontend_v2 install/start. Install Node.js and npm to run the frontend dev server.'
    } else {
        npm install
        Write-Note 'Starting frontend_v2 dev server in a new PowerShell window (runs `npm run dev`)'
        Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendV2'; npm run dev"
    }
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
