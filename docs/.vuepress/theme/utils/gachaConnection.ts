// Convenience encryption: the key stays in this browser, so same-origin
// scripts can decrypt the cookie. This does not protect against XSS.
export interface GachaConnection {
  worker: string;
  personalToken: string;
  updateToken: string;
}
const COOKIE = "lucas-gacha-connection-v1";
const KEY = "lucas-gacha-connection-key-v1";
const AGE = 60 * 60 * 24 * 30;
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const attributes = () => `Path=/; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;

async function key(create: boolean): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error("Remembering connection details requires HTTPS or localhost.");
  let value = localStorage.getItem(KEY);
  if (!value && create) {
    value = encode(crypto.getRandomValues(new Uint8Array(32)));
    localStorage.setItem(KEY, value);
  }
  if (!value) throw new Error("The saved connection key is missing. Clear saved details and enter them again.");
  return crypto.subtle.importKey("raw", decode(value), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function saveGachaConnection(connection: GachaConnection): Promise<void> {
  const secret = await key(true);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, secret, new TextEncoder().encode(JSON.stringify(connection)));
  const value = `${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
  if (value.length > 3800) throw new Error("Connection details are too large for a cookie.");
  document.cookie = `${COOKIE}=${value}; Max-Age=${AGE}; ${attributes()}`;
  if (!document.cookie.split("; ").includes(`${COOKIE}=${value}`)) throw new Error("Browser cookies are unavailable; connection details were not saved.");
}

export async function loadGachaConnection(): Promise<GachaConnection | undefined> {
  const saved = document.cookie.split("; ").find(entry => entry.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!saved) return;
  const parts = saved.split(".");
  if (parts.length !== 2) throw new Error("Invalid saved connection cookie.");
  const secret = await key(false);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(parts[0]) }, secret, decode(parts[1]));
  const value = JSON.parse(new TextDecoder().decode(decrypted));
  if (!value || ["worker", "personalToken", "updateToken"].some(field => typeof value[field] !== "string")) throw new Error("Invalid saved connection details.");
  return value;
}

export function clearGachaConnection(): void {
  document.cookie = `${COOKIE}=; Max-Age=0; ${attributes()}`;
  localStorage.removeItem(KEY);
}
