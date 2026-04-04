import AsyncStorage from "@react-native-async-storage/async-storage";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const domain = process.env.EXPO_PUBLIC_DOMAIN;
const BASE_URL = apiUrl
  ? apiUrl.replace(/\/$/, "")
  : domain
    ? domain.startsWith("http")
      ? `${domain.replace(/\/$/, "")}/api`
      : `http://${domain.replace(/\/$/, "")}/api`
    : "http://192.168.1.105:3000/api";

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include", // CRITICAL: This tells fetch to send the HttpOnly session cookie
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Safely handle non-JSON error pages (like 401s or HTML 500s) to prevent the "Unexpected character <" crash
    const err = await res.text().then(text => {
      try { return JSON.parse(text); }
      catch { return { message: `HTTP ${res.status}: Unauthorized or Server Error` }; }
    });
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body: unknown) => apiRequest<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => apiRequest<T>("PUT", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};