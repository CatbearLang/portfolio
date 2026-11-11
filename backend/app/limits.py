"""In-memory demo quotas and answer cache (single instance; resets on restart, which is fine for a demo)."""
from __future__ import annotations

import json
import threading
import time
from collections import OrderedDict, defaultdict, deque
from datetime import date
from pathlib import Path

from .guard import norm

MSG = {
    "too_long": {"en": "Please keep questions under {n} characters.", "es": "Por favor, escribí preguntas de menos de {n} caracteres."},
    "ip_quota": {"en": "Demo quota reached: {n} free questions per day. The suggested questions still work, or reach Lian on LinkedIn (https://www.linkedin.com/in/lianyang-dev).",
                 "es": "Se alcanzó la cuota de demostración: {n} preguntas libres por día. Las preguntas sugeridas siguen funcionando, o escribile a Lian por LinkedIn (https://www.linkedin.com/in/lianyang-dev)."},
    "burst": {"en": "Too many questions in a row. Please wait a minute and try again.", "es": "Demasiadas preguntas seguidas. Esperá un minuto y probá de nuevo."},
    "global": {"en": "The demo's daily AI budget is used up. The suggested questions still work; please try again tomorrow.",
               "es": "Se agotó el presupuesto diario de IA de la demo. Las preguntas sugeridas siguen funcionando; probá de nuevo mañana."},
}


def client_ip(headers, peer: str | None, trusted_headers: tuple[str, ...] | list[str] = ("cf-connecting-ip",),
              hops: int = 1) -> tuple[str, str]:
    """Return (ip, where it came from).

    The leftmost X-Forwarded-For value is written by the visitor and can be faked on every request, which would
    bypass the per-visitor quota and burn the global one. So: first a header that the hosting edge overwrites
    (configurable), else the X-Forwarded-For entry appended by the nearest trusted proxy, counted from the right.
    """
    for h in trusted_headers:
        v = (headers.get(h) or "").strip()
        if v:
            return v.split(",")[0].strip(), h
    hops_list = [x.strip() for x in (headers.get("x-forwarded-for") or "").split(",") if x.strip()]
    if hops_list and hops >= 1:
        return hops_list[max(0, len(hops_list) - hops)], f"x-forwarded-for[-{hops}]"
    return peer or "unknown", "peer"


class Quotas:
    def __init__(self, per_ip_day: int = 8, burst: int = 3, burst_window: float = 60.0, global_day: int = 40):
        self.per_ip_day, self.burst, self.window, self.global_day = per_ip_day, burst, burst_window, global_day
        self._lock = threading.Lock()
        self._day = date.today()
        self._ip_day: dict[str, int] = defaultdict(int)
        self._recent: dict[str, deque] = defaultdict(deque)
        self._global = 0

    def check(self, ip: str) -> str | None:
        """Consume one free question; return a MSG key if refused."""
        with self._lock:
            if date.today() != self._day:
                self._day, self._global = date.today(), 0
                self._ip_day.clear()
            now, q = time.monotonic(), self._recent[ip]
            while q and now - q[0] > self.window:
                q.popleft()
            if self._ip_day[ip] >= self.per_ip_day:
                return "ip_quota"
            if len(q) >= self.burst:
                return "burst"
            if self._global >= self.global_day:
                return "global"
            q.append(now)
            self._ip_day[ip] += 1
            self._global += 1
            return None


def cache_key(question: str, lang: str) -> str:
    return f"{lang}:{' '.join(''.join(ch for ch in norm(question) if ch.isalnum() or ch.isspace()).split())}"


class AnswerCache:
    """Precomputed suggested answers (JSON, generated once by scripts/build_suggested.py) + LRU of free questions."""

    def __init__(self, suggested_file: Path | None, size: int = 200):
        self.size = size
        self._lru: OrderedDict[str, dict] = OrderedDict()
        self._lock = threading.Lock()
        self.suggested: dict[str, dict] = {}
        if suggested_file and Path(suggested_file).exists():
            for item in json.loads(Path(suggested_file).read_text()):
                self.suggested[cache_key(item["question"], item["lang"])] = item["response"]

    def get(self, key: str) -> tuple[dict, str] | None:
        if key in self.suggested:
            return self.suggested[key], "suggested"
        with self._lock:
            if key in self._lru:
                self._lru.move_to_end(key)
                return self._lru[key], "lru"
        return None

    def put(self, key: str, value: dict) -> None:
        with self._lock:
            self._lru[key] = value
            self._lru.move_to_end(key)
            while len(self._lru) > self.size:
                self._lru.popitem(last=False)
