import { IP_API_URL } from "../chinaMainlandUserDetection";
import { TZ_CC } from "./vendor/who-are-you/tz.mjs";

export type Tone = "ok" | "warn" | "bad" | "muted" | "";

export interface ConnectionSummary {
  ip?: string | null;
  version?: number | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
  asn?: number | null;
  org?: string | null;
  colo?: string | null;
  http?: string | null;
}

export const ME_URL = `${IP_API_URL}/v1/me`;
export const WHOAMI_URL = `${IP_API_URL}/v1/whoami`;
export const TRACE_URL = `${IP_API_URL}/cdn-cgi/trace`;

export const fetchMe = async (
  signal?: AbortSignal,
): Promise<ConnectionSummary | null> => {
  try {
    const response = await fetch(ME_URL, {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(8000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

export const countryName = (code?: string | null) => {
  if (!code) return "N/A";

  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
};

export const browserTimeZoneCountry = (): string => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (TZ_CC as Record<string, string>)[timeZone] ?? "";
  } catch {
    return "";
  }
};

export const formatMs = (ms?: number | null) => {
  if (ms === null || ms === undefined) return "N/A";
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
};

export const msTone = (ms?: number | null): Tone => {
  if (ms === null || ms === undefined) return "muted";
  if (ms <= 50) return "ok";
  if (ms <= 200) return "warn";
  return "bad";
};

export const fillTemplate = (
  template: string,
  values: Record<string, string | number | null | undefined>,
) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] === null || values[key] === undefined
      ? match
      : String(values[key]),
  );

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Unknown error";
