// ==UserScript==
// @name         Gacha Manager by Lucas
// @namespace    https://blog.lucas04.top/tool/gacha-manager/
// @version      1.1.0
// @updateURL    https://blog.lucas04.top/script/gacha-manager-helper.user.js
// @downloadURL  https://blog.lucas04.top/script/gacha-manager-helper.user.js
// @description  Fetch official gacha history locally for Gacha Manager by Lucas, without a relay server.
// @author       Lucas
// @license      GPL-3.0-only
// @match        https://blog.lucas04.top/tool/gacha-manager/
// @match        http://localhost:*/tool/gacha-manager/
// @match        http://127.0.0.1:*/tool/gacha-manager/
// @match        http://192.168.31.11:*/tool/gacha-manager/
// @grant        GM_xmlhttpRequest
// @connect      public-operation-hk4e.mihoyo.com
// @connect      public-operation-hk4e-sg.hoyoverse.com
// @connect      public-operation-hkrpg.mihoyo.com
// @connect      public-operation-hkrpg-sg.hoyoverse.com
// @connect      public-operation-nap.mihoyo.com
// @connect      public-operation-nap-sg.hoyoverse.com
// @run-at       document-start
// @noframes
// ==/UserScript==

(() => {
  "use strict";
  const REQUEST = "lucas-gacha-helper-request";
  const RESPONSE = "lucas-gacha-helper-response";
  const allowed = new Map([
    ["public-operation-hk4e.mihoyo.com", ["/gacha_info/api/getGachaLog", "/gacha_info/api/getBeyondGachaLog"]],
    ["public-operation-hk4e-sg.hoyoverse.com", ["/gacha_info/api/getGachaLog", "/gacha_info/api/getBeyondGachaLog"]],
    ["public-operation-hkrpg.mihoyo.com", ["/common/hkrpg_gacha_record/api/getGachaLog", "/common/hkrpg_gacha_record/api/getLdGachaLog"]],
    ["public-operation-hkrpg-sg.hoyoverse.com", ["/common/hkrpg_gacha_record/api/getGachaLog", "/common/hkrpg_gacha_record/api/getLdGachaLog"]],
    ["public-operation-nap.mihoyo.com", ["/common/gacha_record/api/getGachaLog"]],
    ["public-operation-nap-sg.hoyoverse.com", ["/common/gacha_record/api/getGachaLog"]],
  ]);
  const pending = new Map();
  const validUrl = (url) => url.protocol === "https:" && !url.username && !url.password && !url.port && allowed.get(url.hostname)?.includes(url.pathname);
  const reply = (id, result, error) => {
    window.postMessage({ type: RESPONSE, protocol: 1, id, ...(error ? { error } : { result }) }, window.location.origin);
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin || window.location.pathname !== "/tool/gacha-manager/") return;
    const message = event.data;
    if (!message || message.type !== REQUEST || message.protocol !== 1 || typeof message.id !== "string" || message.id.length > 100) return;
    if (message.action === "probe") { reply(message.id, { version: "1.0.1" }); return; }
    if (message.action === "cancel") { pending.get(message.id)?.abort(); pending.delete(message.id); return; }
    if (message.action !== "fetch") return;
    let url;
    try {
      if (typeof message.url !== "string" || message.url.length > 8192) throw new Error();
      url = new URL(message.url);
      if (!validUrl(url) || !url.searchParams.get("authkey")) throw new Error();
    } catch { reply(message.id, null, "The helper only accepts official gacha history endpoints with authkey."); return; }
    if (pending.size >= 2 || pending.has(message.id)) { reply(message.id, null, "Too many helper requests. Stop the current fetch and try again."); return; }
    const finish = (result, error) => { pending.delete(message.id); reply(message.id, result, error); };
    try {
      const request = GM_xmlhttpRequest({
        method: "GET",
        url: url.href,
        anonymous: true,
        timeout: 20000,
        // No custom Origin header, cookies, relay, storage or external code.
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) { finish(null, `Official API returned HTTP ${response.status}.`); return; }
          try {
            if (response.finalUrl && !validUrl(new URL(response.finalUrl))) throw new Error();
            if (response.responseText.length > 10 * 1024 * 1024) throw new Error();
            const body = JSON.parse(response.responseText);
            if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
            finish(body);
          } catch { finish(null, "The official API returned invalid JSON or an unexpected redirect."); }
        },
        onerror: () => finish(null, "Helper request failed. Check your connection and Tampermonkey host permissions."),
        ontimeout: () => finish(null, "Official API request timed out. Try again."),
        onabort: () => finish(null, "Helper request cancelled."),
      });
      pending.set(message.id, request);
    } catch { finish(null, "Tampermonkey could not start the request. Check the helper permissions."); }
  });
  window.addEventListener("pagehide", () => { for (const request of pending.values()) request.abort(); pending.clear(); });
})();
