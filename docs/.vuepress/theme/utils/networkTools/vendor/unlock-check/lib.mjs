// Pure logic, shared by the browser code (the build inlines this file into src/app.js) and the tests:
// reading each probe's answer, judging a service from it, the share link format.

// Cloudflare's /cdn-cgi/trace: "key=value" lines
export function parseTrace(text) {
  const o = {};
  for (const line of String(text).split("\n")) { const i = line.indexOf("="); if (i > 0) o[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return o;
}
const CC = s => (typeof s === "string" && /^[a-z]{2}$/i.test(s.trim()) ? s.trim().toUpperCase() : null);
const json = text => { try { return JSON.parse(text); } catch (e) { return null; } };

// Each reader takes the answer's status and text and returns { ok, cc, ip } (ok: the service says it is available
// here; cc: the country it sees), or null when the answer isn't one it understands.
export const READERS = {
  trace(st, text) { const t = parseTrace(text); return CC(t.loc) ? { cc: CC(t.loc), ip: t.ip || "", colo: t.colo || "" } : null; },
  // OpenAI's compliance endpoint names the unsupported country in an error; any other answer means supported
  openai(st, text) {
    const j = json(text);
    if (!j) return null;
    const code = (j.error && (j.error.code || j.error.type)) || "";
    return { ok: !/unsupported_country/i.test(code) && !/unsupported_country/i.test(text) };
  },
  dazn(st, text) {
    const a = /"isAllowed"\s*:\s*(true|false)/.exec(text), c = /"GeolocatedCountry"\s*:\s*"([a-z]{2})"/i.exec(text);
    return a ? { ok: a[1] === "true", cc: c ? CC(c[1]) : null } : null;
  },
  kktv(st, text) { const d = (json(text) || {}).data; return d && typeof d.is_allowed === "boolean" ? { ok: d.is_allowed, cc: CC(d.country), ip: d.ip || "" } : null; },
  philo(st, text) { const j = json(text); return j && j.status ? { ok: j.status === "SUCCESS", cc: CC(j.country) } : null; },
  tvb(st, text) { const j = json(text); return j && typeof j.allow_in_this_country === "boolean" ? { ok: j.allow_in_this_country, cc: CC(j.country), ip: j.ip || "" } : null; },
  sbs(st, text) { const r = ((json(text) || {}).get || {}).response; const cc = r && CC(r.country_code); return cc ? { ok: cc === "AU", cc } : null; },
  nbc(st, text) { const j = json(text); return j && typeof j.restricted === "boolean" ? { ok: !j.restricted, cc: CC((j.requestInfo || {}).countryCode) } : null; },
  // DMM TV names a foreign visitor; a Japanese one gets past the region check to "not signed in"
  dmm(st, text) { return /FOREIGN/.test(text) ? { ok: false } : /UNAUTHORIZED/.test(text) ? { ok: true, cc: "JP" } : null; },
  shudder(st, text) { return /not (yet )?available/i.test(text) ? { ok: false } : /movies/i.test(text) ? { ok: true } : null; },
  // beIN: 451 (unavailable for legal reasons) outside its region, 500 from its offers endpoint inside it
  bein(st) { return st === 451 ? { ok: false } : st === 500 ? { ok: true } : null; },
  // ZDF: 403 outside Germany, 404 inside
  zdf(st) { return st === 403 ? { ok: false } : st === 404 ? { ok: true, cc: "DE" } : null; },
  fod(st, text) { const m = /<FLAG\s+TYPE="(true|false)"/i.exec(text); return m ? { ok: m[1] === "true", cc: m[1] === "true" ? "JP" : null } : null; },
};

const has = (list, cc) => !!cc && (" " + list + " ").includes(" " + cc + " ");
// Whether a service is offered in a country by its published rules; null when it has no rules or the country is unknown
export function offered(s, cc) {
  if (!cc) return null;
  if (s.only) return cc === s.only;
  if (s.allow) return has(s.allow, cc);
  if (s.deny) return !has(s.deny, cc);
  return null;
}

// The country to assume for a service whose own answer can't be read: the one most services see. Edge traces and
// region APIs each count once; ties go to the earliest.
export function guessCountry(ccs) {
  const n = new Map();
  for (const cc of ccs) if (cc) n.set(cc, (n.get(cc) || 0) + 1);
  let best = null, max = 0;
  for (const [cc, k] of n) if (k > max) { best = cc; max = k; }
  return best;
}

// The verdict for one service from what its probe got.
//   r: { err: "net"|"timeout"|"http"|"parse"|null, n (status), reach: true|false|null,
//        ok (from a region API), cc, ip, colo, edge: { cc, ip } (ChatGPT's own trace), hops (redirects added; null: not measured) }
//   guess: the country most services see (guessCountry)
// Returns { v, cc, ip, how, why }:
//   v    "ok" available · "no" not available here · "reach" reachable, availability unknown · "fail" couldn't connect
//   how  "api" | "edge" | "hops" | "guess" (see src/services.mjs)
//   why  for "fail": the probe's error; for "reach": "unknown" (no rules) or "nocc" (no country)
export function judge(s, r, guess) {
  const p = s.probe;
  const fail = () => ({ v: "fail", cc: null, ip: "", how: null, why: r.err || "net", n: r.n });
  const byList = (cc, how, ip = "") => { const o = offered(s, cc); return { v: o == null ? "reach" : o ? "ok" : "no", cc, ip, how, why: o == null ? (cc ? "unknown" : "nocc") : null }; };
  if (p.api) {
    if (r.err) return fail();
    const cc = (r.edge && r.edge.cc) || r.cc || null;
    return { v: r.ok ? "ok" : "no", cc, ip: (r.edge && r.edge.ip) || r.ip || "", how: "api", why: null };
  }
  if (p.trace) return r.err ? fail() : byList(r.cc, "edge", r.ip);
  if (p.netflix) {
    if (r.reach === false) return fail();
    if (r.cc) return byList(r.cc, "hops");
    return guess && offered(s, guess) === false ? byList(guess, "guess") : { v: "reach", cc: null, ip: "", how: r.hops == null ? "guess" : "hops", why: "nocc" };
  }
  if (p.hops) {
    if (r.reach === false) return fail();
    if (r.hops == null) return s.only ? byList(guess, "guess") : { v: "reach", cc: null, ip: "", how: "guess", why: "unknown" };
    const ok = p.zero ? r.hops === 0 : r.hops > 0;
    return { v: ok ? "ok" : "no", cc: ok && s.only ? s.only : null, ip: "", how: "hops", why: null };
  }
  // reachability only: the published list against the country the other services see
  if (r.reach === false) return fail();
  return byList(guess, "guess");
}

// Summary counts for the headline: available, not available, reachable but unknown, failed
export function tally(verdicts) {
  const o = { ok: 0, no: 0, reach: 0, fail: 0 };
  for (const v of verdicts) if (v && o[v.v] != null) o[v.v]++;
  return o;
}

// Countries the services see, most common first: [{ cc, ids }]. More than one means traffic leaves by different routes.
export function exitsByCountry(verdicts) {
  const m = new Map();
  for (const [id, v] of Object.entries(verdicts)) if (v && v.cc && (v.how === "api" || v.how === "edge" || v.how === "hops")) {
    if (!m.has(v.cc)) m.set(v.cc, []);
    m.get(v.cc).push(id);
  }
  return [...m].map(([cc, ids]) => ({ cc, ids })).sort((a, b) => b.ids.length - a.ids.length);
}

// An IP with its middle hidden: 203.0.•.• / 2001:db8:•
export function maskIp(ip) {
  if (!ip) return "";
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":•";
  const p = ip.split("."); return p.length === 4 ? `${p[0]}.${p[1]}.•.•` : "•";
}

// Share links carry the result in the hash, which never reaches a server:
//   #r=1.<time, base 36>.<tz country or ->.<id>~<v><how><cc>_<id>~…
// v: o ok, n no, r reach, f fail · how: a api, e edge, h hops, g guess, - none · cc: two letters or -.
// Version 1; a later format gets a new number and this parser keeps reading version 1.
const V = { ok: "o", no: "n", reach: "r", fail: "f" }, H = { api: "a", edge: "e", hops: "h", guess: "g" };
const unV = Object.fromEntries(Object.entries(V).map(([k, v]) => [v, k])), unH = Object.fromEntries(Object.entries(H).map(([k, v]) => [v, k]));
export function encodeShare({ ts, tz, verdicts }) {
  const rows = Object.entries(verdicts).filter(([, v]) => v).map(([id, v]) => `${id}~${V[v.v]}${H[v.how] || "-"}${v.cc || "-"}`);
  return `#r=1.${Math.round(ts / 1000).toString(36)}.${tz || "-"}.${rows.join("_")}`;
}
export function parseShare(hash, ids) {
  const m = /^#r=1\.([0-9a-z]+)\.([A-Z]{2}|-)\.(.*)$/.exec(hash || "");
  if (!m) return null;
  const verdicts = {};
  for (const row of m[3].split("_")) {
    const x = /^([a-z0-9]+)~([onrf])([aehg-])([A-Z]{2}|-)$/.exec(row);
    if (!x || !ids.includes(x[1])) continue;
    verdicts[x[1]] = { v: unV[x[2]], how: unH[x[3]] || null, cc: x[4] === "-" ? null : x[4], ip: "" };
  }
  if (!Object.keys(verdicts).length) return null;
  return { ts: parseInt(m[1], 36) * 1000, tz: m[2] === "-" ? "" : m[2], verdicts };
}
