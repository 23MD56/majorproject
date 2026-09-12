# =====================================================================
# QuantNiti Production Dockerfile
# Multi-Stage Build: Node.js (Vite Frontend) + Python 3.12 (FastAPI ASGI)
# Supports: Render, Railway, Fly.io, Google Cloud Run, AWS ECS, Docker
# =====================================================================

# ---------------------------------------------------------------------
# Stage 1: Build Modern Frontend SPA (Vite + React + Tailwind)
# ---------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /build

# Copy dependency definitions
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || npm install

# Copy frontend source files and build configurations
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/frontend/ ./src/frontend/
COPY src/app/static/ ./src/app/static/

# Build static production bundle into src/app/static/dist
RUN npm run build

# ---------------------------------------------------------------------
# Stage 2: Production Python Runtime (FastAPI + ML Intelligence Engine)
# ---------------------------------------------------------------------
FROM python:3.12-slim AS runtime

# System dependencies for numerical routines and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

# Copy application source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Copy built frontend assets from Stage 1 into the static directory
COPY --from=frontend-builder /build/src/app/static/dist/ ./src/app/static/dist/
COPY --from=frontend-builder /build/src/app/static/sw.js ./src/app/static/sw.js

# Configure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    QUANTNITI_USE_VITE=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Expose default port
EXPOSE 8000

# Healthcheck probe against FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/v1/health || exit 1

# Launch production server entrypoint
CMD ["python", "scripts/serve_production.py"]
