#!/usr/bin/env python3
"""QuantNiti Centralized Production Server Runner.

Designed for production cloud environments (Render, Railway, Fly.io,
Google Cloud Run, AWS App Runner/ECS, and Docker containers).
Automatically handles dynamic port binding ($PORT), ASGI multi-worker
concurrency, and integrated Vite SPA + FastAPI serving.
"""

import os
import sys
from pathlib import Path

# Add src to Python module path
repo_root = Path(__file__).resolve().parent.parent
src_dir = repo_root / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

# Enforce production Vite integration
os.environ["QUANTNITI_USE_VITE"] = "1"
os.environ["PYTHONPATH"] = str(src_dir)


def main():
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    # Determine worker count based on environment or hardware
    default_workers = 1
    if os.getenv("WEB_CONCURRENCY"):
        try:
            default_workers = int(os.environ["WEB_CONCURRENCY"])
        except ValueError:
            default_workers = 1
    elif os.getenv("WORKERS"):
        try:
            default_workers = int(os.environ["WORKERS"])
        except ValueError:
            default_workers = 1
    else:
        # Auto-tune: 2 workers for multi-core environments, 1 for constrained containers
        cpu_count = os.cpu_count() or 1
        default_workers = min(max(cpu_count, 1), 4)

    banner = f"""
======================================================================
              QuantNiti Centralized Cloud Server
======================================================================
  [Host Binding] : {host}:{port}
  [Workers]      : {default_workers}
  [Vite SPA]     : Enabled (src/app/static/dist)
  [Health Check] : http://{host}:{port}/api/v1/health
  [Swagger Docs] : http://{host}:{port}/docs
======================================================================
"""
    print(banner, flush=True)

    # Launch Uvicorn production server
    uvicorn.run(
        "app.api.app:app",
        host=host,
        port=port,
        workers=default_workers if default_workers > 1 else 1,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
        access_log=True,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()
