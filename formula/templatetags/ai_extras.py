from django import template
import re

register = template.Library()

_bullet_re = re.compile(r"^\s*(?:[-\*\+\u2022•]|(?:\d+|[a-zA-Z])[\.\)])\s*")


def _split_text(val):
    if not val:
        return []
    # Already a sequence of lines
    if isinstance(val, (list, tuple)):
        items = []
        for x in val:
            if x is None:
                continue
            if isinstance(x, (list, tuple)):
                items.extend(_split_text(x))
            else:
                s = str(x)
                parts = re.split(r"[\r\n;]+", s)
                if len(parts) == 1 and "•" in s:
                    parts = [p for p in s.split("•")]
                items.extend(parts)
        return items
    # Dict: flatten values
    if isinstance(val, dict):
        items = []
        for v in val.values():
            items.extend(_split_text(v))
        return items
    # String or other types
    s = str(val)
    parts = re.split(r"[\r\n;]+", s)
    if len(parts) == 1 and "•" in s:
        parts = [p for p in s.split("•")]
    return parts


def _clean_item(s):
    s = _bullet_re.sub("", str(s)).strip()
    # Remove stray leading '+' markers and collapse whitespace
    s = s.lstrip("+").strip()
    s = re.sub(r"\s+", " ", s)
    return s


@register.filter
def to_lines(value):
    """Coerce strings/lists/dicts into a cleaned list of bullet lines."""
    items = _split_text(value)
    return [x for x in (_clean_item(i) for i in items) if x]


@register.filter
def has_content(value):
    """Return True if value produces at least one cleaned line."""
    return len(to_lines(value)) > 0


@register.filter
def to_text(value):
    """Coerce any value to a single cleaned text line suitable for inline display."""
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return ", ".join(to_lines(value))
    if isinstance(value, dict):
        parts = []
        for v in value.values():
            parts.extend(to_lines(v))
        return ", ".join(parts)
    return _clean_item(value)


@register.filter(name="dict_get")
def dict_get(d, key):
    try:
        return d.get(key)
    except Exception:
        return None


@register.filter(name="percent")
def percent(cur, total):
    """Return percentage (0-100) of cur/total as an integer."""
    try:
        c = float(cur or 0)
        t = float(total or 0)
        if t <= 0:
            return 0
        v = (c / t) * 100.0
        if v < 0:
            return 0
        if v > 100:
            return 100
        return int(v)
    except Exception:
        return 0
