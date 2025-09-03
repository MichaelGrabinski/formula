import json
import os
from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

@register.simple_tag
def vite_asset(entry: str):
    """Return tags for a Vite-built entry using manifest.

    - In production (manifest exists): serve from /static/dist/...
    - In dev (no build yet): naive fallback pointing to local dev server if VITE_DEV_SERVER env var set,
      otherwise a static path which will 404 (prompting a build).
    """
    # Vite places manifest in dist/.vite/manifest.json
    manifest_path = os.path.join(
        settings.BASE_DIR, 'frontend_v2', 'dist', '.vite', 'manifest.json'
    )
    if not os.path.exists(manifest_path):
        dev_server = os.environ.get('VITE_DEV_SERVER', 'http://localhost:5173')
        # Expect dev server running; Vite serves raw TSX via transformed module.
        return mark_safe(
            f'<script type="module" src="{dev_server}/{entry}"></script>'
        )
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return ''
    rec = data.get(entry)
    if not rec:
        return ''
    tags = []
    # CSS linked files
    for c in rec.get('css', []):
        # Files live under dist/, exposed at /static/dist/<...>
        tags.append(f'<link rel="stylesheet" href="/static/{c}" />')
    # JS entry
    file_path = rec.get('file')
    if file_path:
        tags.append(f'<script type="module" src="/static/{file_path}"></script>')
    return mark_safe('\n'.join(tags))