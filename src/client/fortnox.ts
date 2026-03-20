import { getAccessToken } from "../auth/oauth2.js";
import type { FortnoxError } from "../types/fortnox.js";

const BASE_URL = "https://api.fortnox.se";

// Rate limiter: sliding window
const requestTimestamps: number[] = [];
const RATE_LIMIT = parseInt(process.env.FORTNOX_RATE_LIMIT || "25");
const RATE_WINDOW = parseInt(process.env.FORTNOX_RATE_WINDOW_MS || "5000");

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();

  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_WINDOW) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= RATE_LIMIT) {
    const oldestInWindow = requestTimestamps[0]!;
    const waitTime = oldestInWindow + RATE_WINDOW - now + 50; // 50ms buffer
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return waitForRateLimit(); // Re-check
  }

  requestTimestamps.push(Date.now());
}

async function fortnoxFetch(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<Response> {
  await waitForRateLimit();

  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Handle 429 rate limit
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "5");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return fortnoxFetch(path, options, retried);
  }

  // Handle 401 - try refresh once
  if (response.status === 401 && !retried) {
    return fortnoxFetch(path, options, true);
  }

  return response;
}

function buildQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (filtered.length === 0) return "";
  return "?" + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
}

export class FortnoxClient {
  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const qs = buildQueryString(params);
    const response = await fortnoxFetch(`${path}${qs}`);

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as FortnoxError | null;
      throw new Error(
        error?.ErrorInformation?.message ||
          `Fortnox API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fortnoxFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as FortnoxError | null;
      throw new Error(
        error?.ErrorInformation?.message ||
          `Fortnox API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fortnoxFetch(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as FortnoxError | null;
      throw new Error(
        error?.ErrorInformation?.message ||
          `Fortnox API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    const response = await fortnoxFetch(path, { method: "DELETE" });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as FortnoxError | null;
      throw new Error(
        error?.ErrorInformation?.message ||
          `Fortnox API error: ${response.status} ${response.statusText}`
      );
    }
  }
}
