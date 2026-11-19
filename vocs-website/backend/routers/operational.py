"""
routers/operational.py
----------------------
Operational readiness, health probes, and SRE metrics endpoints:
- GET/HEAD /, GET /health, GET /api/health
- GET /api/metrics (JSON SRE telemetry)
- GET /metrics (Prometheus exposition format)
"""
from datetime import datetime, timezone
import sys
import time
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse


def create_operational_router(*, get_pool, app_start_time: float, metrics: dict, in_memory_alerts: list) -> APIRouter:
    router = APIRouter(tags=["Operational"])

    @router.get("/")
    @router.head("/")
    @router.get("/health")
    @router.get("/api/health")
    async def root_health():
        db_connected = False
        try:
            pool = await get_pool()
            if pool:
                db_connected = not pool._closed
        except Exception:
            db_connected = False

        return {
            "status": "ok",
            "service": "voc-backend-api",
            "database": "connected" if db_connected else "disconnected",
        }

    @router.get("/api/metrics")
    async def get_system_metrics():
        """
        Operational Metrics & Telemetry Observability.
        Exposes uptime, memory RSS, HTTP request stats, DB pool utilization, and active alerts.
        """
        uptime_sec = round(time.time() - app_start_time, 2)
        avg_latency = round(
            metrics["total_latency_ms"] / max(1, metrics["total_requests"]), 2
        )

        mem_mb = 0.0
        try:
            import resource
            rusage = resource.getrusage(resource.RUSAGE_SELF)
            if sys.platform == "darwin":
                mem_mb = round(rusage.ru_maxrss / (1024 * 1024), 2)
            else:
                mem_mb = round(rusage.ru_maxrss / 1024, 2)
        except Exception:
            mem_mb = 0.0

        db_stats = {"status": "disconnected", "active_connections": 0, "pool_size": 0, "max_size": 0}
        try:
            pool = await get_pool()
            if pool and not pool._closed:
                db_stats["status"] = "connected"
                total_holders = len(pool._holders) if hasattr(pool, "_holders") else 0
                idle_count = pool._queue.qsize() if hasattr(pool, "_queue") else 0
                db_stats["pool_size"] = total_holders
                db_stats["active_connections"] = max(0, total_holders - idle_count)
                db_stats["max_size"] = getattr(pool, "_maxsize", 10)
        except Exception:
            pass

        active_alerts = len([a for a in in_memory_alerts if not a.get("resolved")])

        return {
            "status": "HEALTHY",
            "service": "voc-backend-api",
            "version": "1.4.0",
            "uptime_seconds": uptime_sec,
            "memory_rss_mb": mem_mb,
            "http_requests": {
                "total": metrics["total_requests"],
                "errors": metrics["total_errors"],
                "ingest_telemetry": metrics["ingest_requests"],
                "avg_latency_ms": avg_latency,
            },
            "database": db_stats,
            "active_alerts_count": active_alerts,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @router.get("/metrics")
    async def prometheus_metrics():
        """Prometheus exposition format for industrial scrape targets."""
        uptime_sec = round(time.time() - app_start_time, 2)
        total_req = metrics["total_requests"]
        total_err = metrics["total_errors"]
        ingest_req = metrics["ingest_requests"]
        active_alerts = len([a for a in in_memory_alerts if not a.get("resolved")])

        lines = [
            "# HELP voc_uptime_seconds Application uptime in seconds",
            "# TYPE voc_uptime_seconds gauge",
            f"voc_uptime_seconds {uptime_sec}",
            "# HELP voc_http_requests_total Total HTTP requests served",
            "# TYPE voc_http_requests_total counter",
            f"voc_http_requests_total {total_req}",
            "# HELP voc_http_errors_total Total 5xx HTTP errors",
            "# TYPE voc_http_errors_total counter",
            f"voc_http_errors_total {total_err}",
            "# HELP voc_ingest_telemetry_total Total sensor readings ingested",
            "# TYPE voc_ingest_telemetry_total counter",
            f"voc_ingest_telemetry_total {ingest_req}",
            "# HELP voc_active_alerts Current active alerts",
            "# TYPE voc_active_alerts gauge",
            f"voc_active_alerts {active_alerts}",
        ]
        return PlainTextResponse("\n".join(lines) + "\n")

    return router
