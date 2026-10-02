import { ref } from "vue";

// A page-scoped opt-in. Keep the query parameter in the URL and never persist
// it in storage, so a normal visit always starts with link fetching hidden.
export const gachaFetchAllowed = ref(false);

export function applyGachaFetchPreference(allowed: boolean, url: URL): void {
  gachaFetchAllowed.value = allowed && /^\/tool\/gacha-manager\/?$/.test(url.pathname);
}
