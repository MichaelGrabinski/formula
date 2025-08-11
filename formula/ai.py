import os
from typing import List, Dict, Optional, Tuple
from math import sqrt
from django.db.models import Q

from django.conf import settings
from django.db import connection

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

from formula.models import Driver, FileStorage, IFTAReport, Route, Load, BusinessAsset, Finance


MODEL_MAP = {
    # UI value -> provider model id
    "gpt-5": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "o3-mini": "o3-mini",
}

EMBED_MODEL = "text-embedding-3-small"


def _get_client() -> Optional["OpenAI"]:
    if OpenAI is None:
        return None
    api_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY")
    base_url = getattr(settings, "OPENAI_BASE_URL", None) or os.getenv("OPENAI_BASE_URL")
    if not api_key:
        return None
    return OpenAI(api_key=api_key, base_url=base_url or "https://api.openai.com/v1")


def _chat_model_id(ui_model: str) -> str:
    return MODEL_MAP.get(ui_model, ui_model)


def _embed_model_id() -> str:
    return EMBED_MODEL


def chat_with_openai(model: str, system_prompt: str, messages: List[Dict[str, str]]) -> str:
    """
    Send a chat completion request to OpenAI.
    messages: list of dicts with role in {system,user,assistant} and content string.
    Returns assistant content.
    """
    client = _get_client()
    if client is None:
        raise RuntimeError("OpenAI client not configured. Set OPENAI_API_KEY.")

    provider_model = _chat_model_id(model)

    # Ensure first message is system
    msgs: List[Dict[str, str]] = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})
    msgs.extend(messages)

    resp = client.chat.completions.create(
        model=provider_model,
        messages=msgs,
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""


def embed_texts(texts: List[str]) -> List[List[float]]:
    client = _get_client()
    if client is None:
        raise RuntimeError("OpenAI client not configured. Set OPENAI_API_KEY.")
    model = _embed_model_id()
    resp = client.embeddings.create(model=model, input=texts)
    # OpenAI SDK returns data list with .embedding
    return [d.embedding for d in resp.data]


def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x*y for x, y in zip(a, b))
    na = sqrt(sum(x*x for x in a))
    nb = sqrt(sum(y*y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def ensure_docs_table():
    with connection.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_documents(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                content TEXT,
                embedding BLOB
            )
            """
        )


def db_search_context(query: str, per_model: int = 3) -> str:
    if not query:
        return ""
    q = query.strip()
    parts: list[str] = []
    # Drivers
    try:
        ds = Driver.objects.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q) | Q(license_number__icontains=q)
        ).order_by('-created_at')[:per_model]
        if ds:
            parts.append("Drivers:")
            for d in ds:
                parts.append(f"- {d.full_name or ''} | status={d.status or ''} | phone={d.phone_number or ''} | email={d.email or ''}")
    except Exception:
        pass
    # Routes
    try:
        rs = Route.objects.filter(
            Q(name__icontains=q) | Q(start_location__icontains=q) | Q(end_location__icontains=q)
        ).order_by('-created_at')[:per_model]
        if rs:
            parts.append("Routes:")
            for r in rs:
                parts.append(f"- {r.name} | {r.start_location} -> {r.end_location} | {r.distance} mi")
    except Exception:
        pass
    # Loads
    try:
        ls = Load.objects.filter(
            Q(load_name__icontains=q) | Q(description__icontains=q)
        ).order_by('-created_at')[:per_model]
        if ls:
            parts.append("Loads:")
            for l in ls:
                parts.append(f"- {l.load_name} | pickup={l.pickup_date} delivery={l.delivery_date} | route={(l.route.name if l.route_id else '')}")
    except Exception:
        pass
    # Finance
    try:
        fs = Finance.objects.filter(
            Q(category__icontains=q) | Q(description__icontains=q)
        ).order_by('-date')[:per_model]
        if fs:
            parts.append("Finance:")
            for f in fs:
                parts.append(f"- {f.date} | {f.type or ''} | {f.category} | ${f.amount}")
    except Exception:
        pass
    # IFTA Reports
    try:
        irs = IFTAReport.objects.filter(Q(report_name__icontains=q)).order_by('-created_at')[:per_model]
        if irs:
            parts.append("IFTA Reports:")
            for r in irs:
                parts.append(f"- {r.report_name} | {r.start_date} - {r.end_date} | miles={r.total_miles} fuel={r.total_fuel}")
    except Exception:
        pass
    # FileStorage metadata (not file content)
    try:
        fss = FileStorage.objects.filter(
            Q(name__icontains=q) | Q(description__icontains=q)
        ).order_by('-uploaded_at')[:per_model]
        if fss:
            parts.append("Files:")
            for f in fss:
                parts.append(f"- {f.name} | category={f.category_display} | uploaded={f.uploaded_at}")
    except Exception:
        pass
    # Business assets
    try:
        bas = BusinessAsset.objects.filter(
            Q(name__icontains=q) | Q(description__icontains=q)
        ).order_by('-purchase_date')[:per_model]
        if bas:
            parts.append("Business Assets:")
            for a in bas:
                parts.append(f"- {a.name} | value={a.value} | purchased={a.purchase_date}")
    except Exception:
        pass

    return "\n".join(parts[:200])  # cap lines


def rag_chat(model: str, system_prompt: str, chat: List[Dict[str, str]], top_k: int = 5) -> str:
    latest = next((m for m in reversed(chat) if m.get('role') == 'user'), None)
    context = db_search_context(latest.get('content', '') if latest else '')
    sys = (system_prompt or '') + "\nUse the following internal context from the database if relevant:\n" + context
    return chat_with_openai(model=model, system_prompt=sys, messages=chat)
