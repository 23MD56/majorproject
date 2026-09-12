/**
 * PWA Service Module
 * Handles BeforeInstallPrompt interception, iOS Safari installation detection,
 * and Web Push notification subscription.
 */

import { apiUrl } from "../config";

let deferredInstallPrompt: any = null;
let isInitialized = false;

export function initPWAInstallListener(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent("quantniti:pwa-installable"));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent("quantniti:pwa-installed"));
  });
}

export function getDeferredInstallPrompt(): any {
  return deferredInstallPrompt;
}

export async function promptPWAInstall(): Promise<"accepted" | "dismissed" | null> {
  if (!deferredInstallPrompt) {
    return null;
  }

  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice?.outcome || null;
  } catch (err) {
    console.warn("PWA install prompt error:", err);
    deferredInstallPrompt = null;
    return null;
  }
}

export function isIOSSafariBannerEligible(userAgentOverride?: string): boolean {
  if (typeof window === "undefined") return false;

  const ua = userAgentOverride || navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isStandalone =
    (window.navigator as any).standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  const isDismissed = localStorage.getItem("quantniti_ios_pwa_dismissed") === "true";

  return isIOS && !isStandalone && !isDismissed;
}

export function dismissIOSSafariBanner(): void {
  try {
    localStorage.setItem("quantniti_ios_pwa_dismissed", "true");
  } catch {
    // Ignore storage quota or disabled errors
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const keyResp = await fetch(apiUrl("/api/v1/notifications/vapid-public-key"));
    if (!keyResp.ok) return false;

    const keyData = await keyResp.json();
    const vapidKey = keyData.public_key;
    if (!vapidKey) return false;

    const convertedKey = urlBase64ToUint8Array(vapidKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as any,
    });

    const subJson = subscription.toJSON();
    const subResp = await fetch(apiUrl("/api/v1/notifications/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
        user_id: "default_user",
      }),
    });

    return subResp.ok;
  } catch (err) {
    console.warn("Failed to subscribe to Web Push:", err);
    return false;
  }
}
