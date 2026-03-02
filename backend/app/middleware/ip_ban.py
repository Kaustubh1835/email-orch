import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# Config
MAX_REQUESTS = 50          # max requests in the window
WINDOW_SECONDS = 60        # tracking window
BAN_DURATION_SECONDS = 900  # 15 min ban

# In-memory stores
_request_counts: dict[str, list[float]] = defaultdict(list)
_banned_ips: dict[str, float] = {}


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _cleanup_old_entries(ip: str, now: float) -> None:
    """Remove timestamps older than the window."""
    cutoff = now - WINDOW_SECONDS
    _request_counts[ip] = [t for t in _request_counts[ip] if t > cutoff]


class IPBanMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = _get_client_ip(request)
        now = time.time()

        # Check if IP is banned
        if ip in _banned_ips:
            if now < _banned_ips[ip]:
                remaining = int(_banned_ips[ip] - now)
                logger.warning("Blocked request from banned IP: %s (%ds remaining)", ip, remaining)
                return JSONResponse(
                    status_code=403,
                    content={"detail": f"IP temporarily blocked. Try again in {remaining} seconds."},
                )
            else:
                # Ban expired
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
            return JSONResponse(
                status_code=403,
                content={"detail": f"Too many requests. IP blocked for {BAN_DURATION_SECONDS // 60} minutes."},
            )

        response = await call_next(request)
        return response
