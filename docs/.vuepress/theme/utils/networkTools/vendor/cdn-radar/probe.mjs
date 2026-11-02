// Timing a CDN from the browser, and reading which of its locations answered.
//
// The first request only opens the connection (DNS, TCP, TLS) and isn't counted; the timed ones reuse it, one after
// another, and the median is the round trip to the CDN's edge. No cache-busting query: a CDN answers a URL it has
// cached at the edge, and one it hasn't from its origin, which isn't what this measures (cache: "no-store" keeps the
// browser's own cache out of it). The location is read from the first answer that has one.

import { PARSE, parserOf } from "./cdns.mjs";

export const TIMEOUT = 5000, WARM_TIMEOUT = 6000, TIMED = 3, GAP = 80;

try { performance.setResourceTimingBufferSize(2000); } catch (e) {}

// One request: how long until its answer started, and what the answer says (the response, for CORS reads; its
// resource timing entry, for Server-Timing). A request that fails or times out throws.
async function once(url, cors, timeout, signal) {
  const ctl = new AbortController(), stop = () => ctl.abort();
  const tm = setTimeout(stop, timeout);
  if (signal) signal.addEventListener("abort", stop, { once: true });
  const t0 = performance.now();
  try {
    const r = await fetch(url, { mode: cors ? "cors" : "no-cors", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: ctl.signal });
    const t1 = performance.now();
    const body = cors ? await r.text() : (await r.blob(), "");
    const e = performance.getEntriesByName(new URL(url, location.href).href).pop();
    // with Timing-Allow-Origin the entry has the request's own times, without the browser's queueing
    const ms = e && e.requestStart > 0 && e.responseStart >= e.requestStart ? e.responseStart - e.requestStart : t1 - t0;
    return { r, body, e, ms };
  } finally { clearTimeout(tm); if (signal) signal.removeEventListener("abort", stop); }
}

// The location an answer names, by the CDN's read rule ("trace", "h:<header>", "st:<Server-Timing name>")
export function readPop(read, x) {
  if (!read || !x) return null;
  if (read === "trace") return PARSE.trace(x.body);
  if (read.startsWith("h:")) return parserOf(read)(x.r.headers.get(read.slice(2)));
  if (read.startsWith("st:")) {
    const name = read.slice(3), st = x.e && x.e.serverTiming && x.e.serverTiming.find(s => s.name === name);
    return st ? PARSE[name](st.description) : null;
  }
  return null;
}

const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// A CDN: { ms, code, loc } (ms null when it never answered; code null when it didn't say; loc: the country a trace
// saw the request from) and err ("timeout", "fail")
export async function probe(cdn, signal) {
  const cors = !!cdn.read && !cdn.read.startsWith("st:");
  let code = null, warm = null, err = null;
  try {
    warm = await once(cdn.url, cors, WARM_TIMEOUT, signal);
    code = readPop(cdn.read, warm);
  } catch (e) {
    if (signal && signal.aborted) throw e;
    err = e && e.name === "AbortError" ? "timeout" : "fail";
  }
  // the first file unreachable: the second one stands in, timed too (a host can be blocked or misrouted on one
  // network while the CDN works)
  const alts = [].concat(cdn.alt || []);
  if (!warm && alts.length) return probe({ ...cdn, url: alts[0].url, read: alts[0].read, alt: alts.slice(1) }, signal);
  // the second file, for the location only, when the first answered without one
  if (!code && alts.length) {
    try { code = readPop(alts[0].read, await once(alts[0].url, !alts[0].read.startsWith("st:"), WARM_TIMEOUT, signal)); } catch (e) { if (signal && signal.aborted) throw e; }
  }
  if (!warm) return { ms: null, code, err };
  // Cloudflare's trace also says which country the request came from: a proxy that carries this CDN shows here
  const loc = cdn.read === "trace" ? (/loc=([A-Z]{2})/.exec(warm.body) || [])[1] || null : null;
  const ts = [];
  for (let i = 0; i < TIMED; i++) {
    await wait(GAP);
    try {
      const x = await once(cdn.url, cors, TIMEOUT, signal);
      ts.push(x.ms);
      if (!code) code = readPop(cdn.read, x);
    } catch (e) { if (signal && signal.aborted) throw e; }
  }
  return { ms: ts.length ? median(ts) : warm.ms, code, loc, err: null };
}

// Names and addresses a site's DNS gives, not the local resolver's (or a proxy's fake addresses). This site's Worker
// asks Cloudflare's DNS over HTTPS from the edge (/dns): from mainland China the public resolvers a page can ask either
// don't answer (Google's, Cloudflare's) or give made-up addresses for sites blocked there (AliDNS for Discord).
// Without the Worker (the site served as plain files), AliDNS and Google's from the browser, merged.
export async function dns(host, signal) {
  try {
    const r = await fetch("https://ip.lucas04.top/v1/dns?name=" + encodeURIComponent(host), { signal });
    if (r.ok) return await r.json();
  } catch (e) { if (signal && signal.aborted) throw e; }
  // four seconds each: a blocked resolver would otherwise hold the check until the browser gives up
  const sig = AbortSignal.any && signal ? AbortSignal.any([signal, AbortSignal.timeout(4000)]) : AbortSignal.timeout ? AbortSignal.timeout(4000) : signal;
  const ask = base => fetch(base + encodeURIComponent(host), { signal: sig, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
    .then(r => r.json()).then(j => j.Answer || []);
  const got = await Promise.allSettled([ask("https://dns.alidns.com/resolve?type=1&name="), ask("https://dns.google/resolve?type=A&name=")]);
  if (signal && signal.aborted) throw new DOMException("aborted", "AbortError");
  const ans = got.filter(x => x.status === "fulfilled").flatMap(x => x.value);
  if (!got.some(x => x.status === "fulfilled")) return null;
  const uniq = a => [...new Set(a)];
  return { cnames: uniq(ans.filter(a => a.type === 5).map(a => String(a.data).replace(/\.$/, ""))), ips: uniq(ans.filter(a => a.type === 1).map(a => a.data)) };
}

export { once };
