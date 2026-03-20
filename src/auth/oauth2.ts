import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { TokenData } from "../types/fortnox.js";

const TOKEN_FILE = resolve(process.cwd(), ".fortnox-tokens.json");
const TOKEN_URL = "https://apps.fortnox.se/oauth-v1/token";

let tokenCache: TokenData | null = null;

function loadTokens(): TokenData | null {
  // First check env vars
  if (process.env.FORTNOX_ACCESS_TOKEN && process.env.FORTNOX_REFRESH_TOKEN) {
    return {
      access_token: process.env.FORTNOX_ACCESS_TOKEN,
      refresh_token: process.env.FORTNOX_REFRESH_TOKEN,
      expires_at: 0, // Will trigger refresh on first use
    };
  }

  // Then check file
  if (existsSync(TOKEN_FILE)) {
    const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    return data as TokenData;
  }

  return null;
}

function saveTokens(tokens: TokenData): void {
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  tokenCache = tokens;

  // Also update env vars for current process
  process.env.FORTNOX_ACCESS_TOKEN = tokens.access_token;
  process.env.FORTNOX_REFRESH_TOKEN = tokens.refresh_token;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const clientId = process.env.FORTNOX_CLIENT_ID;
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FORTNOX_CLIENT_ID and FORTNOX_CLIENT_SECRET are required");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${error}`);
  }

  const data = await response.json();

  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // 60s buffer
  };

  saveTokens(tokens);
  return tokens;
}

export async function getAccessToken(): Promise<string> {
  if (!tokenCache) {
    tokenCache = loadTokens();
  }

  if (!tokenCache) {
    throw new Error(
      "No tokens available. Run 'npm run auth' to authorize with Fortnox."
    );
  }

  // Refresh if expired or about to expire
  if (Date.now() >= tokenCache.expires_at) {
    tokenCache = await refreshAccessToken(tokenCache.refresh_token);
  }

  return tokenCache.access_token;
}

export async function exchangeAuthCode(code: string): Promise<TokenData> {
  const clientId = process.env.FORTNOX_CLIENT_ID;
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FORTNOX_CLIENT_ID and FORTNOX_CLIENT_SECRET are required");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:9999/callback",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }

  const data = await response.json();

  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  saveTokens(tokens);
  return tokens;
}
