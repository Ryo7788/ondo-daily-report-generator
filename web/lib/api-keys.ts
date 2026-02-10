import fs from "fs";
import { parse } from "dotenv";
import { ENV_FILE } from "./constants";

export interface ApiKeyStatus {
  fmp: { valid: boolean; error: string | null; keyPresent: boolean };
  polygon: { valid: boolean; error: string | null; keyPresent: boolean };
}

function loadEnvKeys(): { FMP_API_KEY?: string; MASSIVE_API_KEY?: string } {
  if (!fs.existsSync(ENV_FILE)) return {};
  const content = fs.readFileSync(ENV_FILE, "utf-8");
  return parse(content);
}

// Cache API health results for 5 minutes to avoid burning quota
let cachedResult: ApiKeyStatus | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function checkApiKeys(): Promise<ApiKeyStatus> {
  if (cachedResult && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedResult;
  }

  const env = loadEnvKeys();

  const result: ApiKeyStatus = {
    fmp: { valid: false, error: null, keyPresent: !!env.FMP_API_KEY },
    polygon: { valid: false, error: null, keyPresent: !!env.MASSIVE_API_KEY },
  };

  if (env.FMP_API_KEY) {
    try {
      const res = await fetch(
        `https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=${env.FMP_API_KEY}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      result.fmp.valid = Array.isArray(data) && data.length > 0;
      if (!result.fmp.valid) {
        result.fmp.error = data?.message || data?.error || "Invalid response";
      }
    } catch (e) {
      result.fmp.error = (e as Error).message;
    }
  }

  if (env.MASSIVE_API_KEY) {
    try {
      const res = await fetch(
        `https://api.polygon.io/v2/last/trade/AAPL?apiKey=${env.MASSIVE_API_KEY}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      result.polygon.valid = data.results !== undefined;
      if (!result.polygon.valid) {
        result.polygon.error = data?.error || data?.message || "Invalid response";
      }
    } catch (e) {
      result.polygon.error = (e as Error).message;
    }
  }

  cachedResult = result;
  cacheTime = Date.now();
  return result;
}
