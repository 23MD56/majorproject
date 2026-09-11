#!/usr/bin/env python3
"""QuantNiti Mobile Network Server Runner.

Discovers the local LAN IPv4 address, starts the FastAPI server bound to 0.0.0.0:8000
with Vite integration enabled, and displays clear network URLs with an ASCII QR code
for instant mobile camera scanning.
"""

import os
import sys
import socket
import subprocess
from pathlib import Path


def get_lan_ip() -> str:
    """Detect local LAN IPv4 address using UDP socket probe."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually transmit packets, just routes to public DNS
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def print_qr_code(url: str) -> None:
    """Print an ASCII QR code in the terminal if qrcode is available, or instructions."""
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=1,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        print("\n  [Scan QR code on your mobile camera]:")
        qr.print_ascii(invert=True)
    except ImportError:
        # Fallback: simple text banner
        pass


def main():
    repo_root = Path(__file__).resolve().parent.parent
    os.chdir(repo_root)

    lan_ip = get_lan_ip()
    port = int(os.getenv("PORT", "8000"))
    local_url = f"http://localhost:{port}/"
    mobile_url = f"http://{lan_ip}:{port}/"

    banner = f"""
======================================================================
       QuantNiti Mobile Web & Network Testing Server
======================================================================
  [Local Machine]   : {local_url}
  [Mobile on LAN]   : {mobile_url}
  [Vite Client]     : {mobile_url}app
  [Binding]         : 0.0.0.0:{port} (All Network Interfaces)
======================================================================
  * Mobile Device Setup:
    1. Ensure your smartphone is connected to the SAME Wi-Fi network.
    2. Open your mobile browser (Chrome / Safari) and navigate to:
       {mobile_url}
    3. If prompted by Windows Defender Firewall, click 'Allow Access'.
    4. To install as PWA: tap 'Add to Home Screen' or install prompt.
======================================================================
"""
    print(banner)
    print_qr_code(mobile_url)

    # Set environment variables for Vite integration
    env = os.environ.copy()
    env["QUANTNITI_USE_VITE"] = "1"
    env["PYTHONPATH"] = str(repo_root / "src")

    # Load .env variables if present
    env_file = repo_root / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip("\"'")


    # Prefer project virtualenv python if available
    venv_python = repo_root / ".venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = repo_root / ".venv" / "bin" / "python"
    
    python_bin = str(venv_python) if venv_python.exists() else sys.executable
    cmd = [
        python_bin,
        "-m",
        "uvicorn",
        "app.api.app:app",
        "--app-dir",
        str(repo_root / "src"),
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
    ]

    try:
        subprocess.run(cmd, env=env, check=True)
    except KeyboardInterrupt:
        print("\nStopping QuantNiti Mobile Server. Goodbye!")


if __name__ == "__main__":
    main()
