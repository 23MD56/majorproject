/**
 * Application Configuration & Remote Centralized API Endpoint Discovery.
 *
 * In web deployment on the centralized server, VITE_API_URL is unset or empty,
 * meaning API requests use relative paths (e.g. "/api/...").
 *
 * When compiling standalone native mobile APKs or external web clients,
 * VITE_API_URL can be set to the centralized remote cloud backend (e.g. "https://quantniti.onrender.com").
 */

export const API_BASE_URL: string = (
  ((import.meta as any).env?.VITE_API_URL as string) || ""
).replace(/\/+$/, "");

/**
 * Returns a fully qualified API endpoint URL, prepending API_BASE_URL if configured.
 *
 * Examples:
 *   apiUrl("/api/explore/stocks") -> "/api/explore/stocks" (when VITE_API_URL is empty)
 *   apiUrl("/api/explore/stocks") -> "https://quantniti.onrender.com/api/explore/stocks" (when VITE_API_URL is configured)
 */
export function apiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanPath}`;
}
