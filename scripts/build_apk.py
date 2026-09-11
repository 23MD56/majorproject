#!/usr/bin/env python3
"""QuantNiti APK Build & Packaging Script.

Automates the build of the production web bundle, synchronization into the Android project
assets directory, and execution of Gradle to compile QuantNiti APKs.
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path


def run_command(cmd, cwd=None):
    print(f"-> Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    subprocess.run(cmd, cwd=cwd, check=True, shell=isinstance(cmd, str))


def main():
    repo_root = Path(__file__).resolve().parent.parent
    android_dir = repo_root / "android"
    web_dist_dir = repo_root / "src" / "app" / "static" / "dist"
    android_assets_dist = android_dir / "app" / "src" / "main" / "assets" / "dist"
    output_apk_dir = repo_root / "build" / "apk"

    print("==================================================================")
    print("             QuantNiti Android APK Packaging Studio              ")
    print("==================================================================")

    # 1. Build Vite Production Bundle
    print("\n[Step 1/3] Building production web assets via Vite...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        run_command([npm_cmd, "run", "build"], cwd=repo_root)
    except Exception as e:
        print(f"Warning: npm run build failed ({e}), checking if dist already exists...")

    if not web_dist_dir.exists():
        print(f"Error: Production dist directory not found at {web_dist_dir}")
        sys.exit(1)

    # 2. Synchronize Assets into Android Project
    print("\n[Step 2/3] Synchronizing web bundle into Android assets...")
    if android_assets_dist.exists():
        shutil.rmtree(android_assets_dist)
    android_assets_dist.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(web_dist_dir, android_assets_dist)
    print(f"[OK] Synchronized {len(list(android_assets_dist.rglob('*')))} files to {android_assets_dist}")

    # Also copy manifest.json and icons into assets root for PWA fallback
    static_dir = repo_root / "src" / "app" / "static"
    shutil.copy2(static_dir / "manifest.json", android_assets_dist / "manifest.json")

    # 3. Compile APK using Gradle (if Java/Android SDK available)
    print("\n[Step 3/3] Checking Gradle and Android Toolchain...")
    gradlew = android_dir / ("gradlew.bat" if sys.platform == "win32" else "gradlew")
    java_found = shutil.which("java") is not None
    gradle_found = gradlew.exists() or shutil.which("gradle") is not None

    output_apk_dir.mkdir(parents=True, exist_ok=True)

    if java_found and gradle_found:
        print("[OK] Java toolchain found. Compiling Android APK via Gradle...")
        gradle_cmd = str(gradlew) if gradlew.exists() else "gradle"
        try:
            run_command([gradle_cmd, "assembleDebug"], cwd=android_dir)
            built_apk = android_dir / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
            if built_apk.exists():
                dest_apk = output_apk_dir / "QuantNiti-debug.apk"
                shutil.copy2(built_apk, dest_apk)
                print(f"\n[SUCCESS] QuantNiti APK generated at:")
                print(f"   --> {dest_apk}")
                return
        except Exception as err:
            print(f"Gradle build encountered an issue: {err}")
    else:
        print("\n[INFO] Local Android SDK / Java toolchain not detected in PATH.")
        print("  The Android project and bundled web assets are 100% prepared at:")
        print(f"  --> {android_dir}")
        print("\n  To build and install the APK:")
        print("  Option A (Android Studio): Open the 'android/' folder in Android Studio and click 'Build > Build APK'.")
        print("  Option B (GitHub Actions): Push or trigger the '.github/workflows/build-apk.yml' workflow to download the compiled APK artifact.")
        print("  Option C (Gradle CLI): Once Java 17+ & Android SDK 34 are installed, run: python scripts/build_apk.py")


if __name__ == "__main__":
    main()
