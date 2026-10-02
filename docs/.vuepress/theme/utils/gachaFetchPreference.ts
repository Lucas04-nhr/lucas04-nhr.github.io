import { ref } from "vue";

export const gachaFetchAllowed = ref(false);

// URL values override the saved preference; only this tool can activate it.
export function applyGachaFetchPreference(allowed: boolean | null, url: URL): void {
  const isBrowser = typeof document !== "undefined";
  if (allowed !== null && isBrowser) {
    const secure = url.protocol === "https:" ? "; Secure" : "";
    document.cookie = `gachaFetchAllowed=${allowed}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  }
  const saved = isBrowser && document.cookie.split(";").some(cookie => cookie.trim() === "gachaFetchAllowed=true");
  gachaFetchAllowed.value = (allowed ?? saved) && /^\/tool\/gacha-manager\/?$/.test(url.pathname);
}
