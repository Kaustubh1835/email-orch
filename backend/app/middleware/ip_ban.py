import json
import time
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Config
MAX_REQUESTS = 50          # max requests in the window
WINDOW_SECONDS = 60        # tracking window
BAN_DURATION_SECONDS = 900  # 15 min ban

# In-memory stores
_request_counts: dict[str, list[float]] = defaultdict(list)
_banned_ips: dict[str, float] = {}


def _get_client_ip(scope: dict) -> str:
    headers = dict(scope.get("headers", []))
    forwarded = headers.get(b"x-forwarded-for", b"").decode()
    if forwarded:
        return forwarded.split(",")[0].strip()
    client = scope.get("client")
    return client[0] if client else "unknown"


def _cleanup_old_entries(ip: str, now: float) -> None:
    cutoff = now - WINDOW_SECONDS
    _request_counts[ip] = [t for t in _request_counts[ip] if t > cutoff]


class IPBanMiddleware:
    """Pure ASGI middleware — does not buffer responses, so SSE streaming works."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        ip = _get_client_ip(scope)
        now = time.time()

        # Check if IP is banned
        if ip in _banned_ips:
            if now < _banned_ips[ip]:
                remaining = int(_banned_ips[ip] - now)
                logger.warning("Blocked request from banned IP: %s (%ds remaining)", ip, remaining)
                body = json.dumps({"detail": f"IP temporarily blocked. Try again in {remaining} seconds."})
                await send({"type": "http.response.start", "status": 403, "headers": [
                    [b"content-type", b"application/json"],
                ]})
                await send({"type": "http.response.body", "body": body.encode()})
                return
            else:
                del _banned_ips[ip]
                _request_counts.pop(ip, None)

        # Track request
        _cleanup_old_entries(ip, now)
        _request_counts[ip].append(now)

        # Check if threshold exceeded
        if len(_request_counts[ip]) > MAX_REQUESTS:
            _banned_ips[ip] = now + BAN_DURATION_SECONDS
            logger.warning("Banning IP %s for %ds (%d requests in %ds)",
                           ip, BAN_DURATION_SECONDS, len(_request_counts[ip]), WINDOW_SECONDS)
            body = json.dumps({"detail": f"Too many requests. IP blocked for {BAN_DURATION_SECONDS // 60} minutes."})
            await send({"type": "http.response.start", "status": 403, "headers": [
                [b"content-type", b"application/json"],
            ]})
            await send({"type": "http.response.body", "body": body.encode()})
            return

        await self.app(scope, receive, send)
