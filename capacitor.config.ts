import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quantniti.app",
  appName: "QuantNiti",
  webDir: "src/app/static/dist",
  bundledWebRuntime: false,
  server: {
    // Allows cleartext HTTP traffic to local LAN servers during development & testing
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
