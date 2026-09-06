import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { initPWAInstallListener } from "./services/pwaService";

// Initialize PWA installation event listener
initPWAInstallListener();

// Register Service Worker in browser environments
if (typeof window !== "undefined" && "serviceWorker" in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("QuantNiti ServiceWorker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.warn("QuantNiti ServiceWorker registration notice:", err);
      });
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

