# QuantNiti: Hosting, Centralized Server & Scalability Guide

> **Context**: Resolves **GitHub Issue #10 ("Hosting and Scalability: To be hosted somewhere so that doesnt need to run on client. A centralized scalable server")**.

---

## 1. Architectural Overview

Previously, running QuantNiti required executing Python backend servers and Vite dev servers locally on the user's personal computer (`python scripts/serve_mobile.py` or `npm run dev`), binding to local LAN IP addresses.

With the centralized server architecture:
1. **Single Autonomous Service**: A multi-stage Docker container packs both the high-performance Vite frontend SPA and the Python 3.12 FastAPI intelligence engine into a single unified container.
2. **Dynamic Cloud Port Binding**: The container dynamically binds to `$PORT` (assigned automatically by cloud providers like Render, Railway, Fly.io, Cloud Run, Heroku, or AWS).
3. **Integrated Static & API Routing**: FastAPI serves the pre-rendered Vite production SPA from `/` and `/app`, while simultaneously handling all REST APIs (`/api/v1/...` and `/api/...`) on the same domain and port, eliminating cross-origin headaches.
4. **Decoupled Remote Client Connectivity**: External client distributions (such as the standalone Android APK or external PWAs) can connect to the centralized cloud server by simply setting `VITE_API_URL=https://your-quantniti-app.onrender.com`.

```
                        +---------------------------------------+
                        |       Centralized Cloud Host          |
                        |   (Render / Railway / Fly.io / GCP)   |
                        |                                       |
                        |   +-------------------------------+   |
                        |   |        FastAPI Router         |   |
                        |   |  Port: $PORT (e.g. 8000/443)  |   |
                        |   +---------------+---------------+   |
                        |                   |                   |
                        |         +---------+---------+         |
                        |         |                   |         |
                        |         v                   v         |
                        |   [Static SPA]       [REST APIs]      |
                        |   Vite Frontend      /api/v1/...      |
                        |   /app, /sw.js       Market & ML      |
                        +---------^-------------------^---------+
                                  |                   |
               HTTPS (Same Origin)|                   | HTTPS (Remote API)
                                  |                   |
                     +------------+----+         +----+-------------+
                     |  Mobile Browser |         |  Native Android  |
                     |  PWA / Desktop  |         |     App / APK    |
                     +-----------------+         +------------------+
```

---

## 2. 1-Click Cloud Deployment Guides

### Option A: Render (Recommended — Free / Low-Cost Tier)
The repository includes a ready-to-use [`render.yaml`](../render.yaml) blueprint.

1. Create a free account at [render.com](https://render.com).
2. Link your GitHub account and select your `majorproject` repository.
3. Click **New +** -> **Blueprint**.
4. Render automatically parses `render.yaml` and provisions:
   - **Service Name**: `quantniti`
   - **Runtime**: `Docker`
   - **Healthcheck Path**: `/api/v1/health`
   - **Environment Variables**: `QUANTNITI_USE_VITE=1`, `GEMINI_API_KEY` (optional secret).
5. Click **Apply**. Within ~2 minutes, your centralized server is live at `https://quantniti-xxxx.onrender.com`.

---

### Option B: Railway
The repository includes [`railway.toml`](../railway.toml) and [`Procfile`](../Procfile).

1. Log in to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `majorproject`.
4. Railway will automatically detect the `Dockerfile`, build both stages, and expose a public domain.
5. In project settings, add `GEMINI_API_KEY` (if using Gemini AI capabilities).

---

### Option C: Fly.io (Global Edge Deployment)
The repository includes [`fly.toml`](../fly.toml).

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh` (Linux/macOS) or `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`.
2. Authenticate: `fly auth login`.
3. Launch: `fly launch` (it will detect `fly.toml`).
4. Deploy: `fly deploy`.
5. Your service will be globally routed and can automatically scale to zero when idle to minimize costs.

---

### Option D: Google Cloud Run (Serverless Container)
Google Cloud Run provides fully managed serverless container execution with auto-scaling from 0 to 100+ instances.

1. Build and push image to Google Artifact Registry / Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/quantniti:latest
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy quantniti \
     --image gcr.io/[PROJECT-ID]/quantniti:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8000 \
     --memory 1Gi \
     --cpu 1
   ```

---

## 3. Running with Docker & Docker Compose (Any VPS / Local Machine)

To run the centralized server on any standard cloud virtual machine (Ubuntu / Debian / AWS EC2 / DigitalOcean Droplet):

### Using Docker Compose
```bash
# Clone the repository
git clone https://github.com/jayadityadev/majorproject.git
cd majorproject

# (Optional) Export Gemini API Key
export GEMINI_API_KEY="your_api_key_here"

# Build and start container in the background
docker compose up -d --build
```
Verify the server is healthy:
```bash
curl http://localhost:8000/api/v1/health
# {"status":"healthy","service":"QuantNiti Core API","version":"0.1.0"}
```

### Direct Docker Run
```bash
docker build -t quantniti:latest .
docker run -d --name quantniti-server -p 8000:8000 -e QUANTNITI_USE_VITE=1 quantniti:latest
```

---

## 4. Connecting Standalone Clients (Mobile APK & PWAs)

When compiling a standalone Android APK using Capacitor or when deploying the web UI separately from the backend:

1. Specify your centralized server URL when running the build:
   ```bash
   VITE_API_URL=https://your-quantniti-app.onrender.com npm run build
   ```
2. Build the Android APK:
   ```bash
   python scripts/build_apk.py
   ```
3. The generated mobile app will now automatically point all quantitative queries, real-time regimes, and backtesting requests to your centralized cloud server.

---

## 5. Horizontal & Vertical Scalability

### ASGI Concurrency
The production launcher ([`scripts/serve_production.py`](../scripts/serve_production.py)) automatically sets worker counts:
- On containers with multiple CPU cores, it scales up to 4 concurrent Uvicorn workers.
- You can override concurrency at any time via the `WEB_CONCURRENCY` or `WORKERS` environment variable:
  ```bash
  export WEB_CONCURRENCY=4
  ```

### Memory Optimization
- Stage 1 compiles all JavaScript, CSS, and icons into optimized, gzipped static chunks.
- Python runtime memory is capped to ~250MB under standard load, comfortably fitting within standard 512MB/1GB free and starter cloud tiers.
