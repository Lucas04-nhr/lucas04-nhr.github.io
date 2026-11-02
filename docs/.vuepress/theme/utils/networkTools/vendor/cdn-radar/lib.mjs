// Pure logic shared by the page, the Worker and the tests: distances, what a result means, and results in links.

import { IDS, BY } from "./cdns.mjs";

// Great-circle distance in km
export function km(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180, dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// The fastest a round trip over that distance can be: light in fiber covers about 200 km per ms, there and back
export const floorMs = d => d / 100;

// How far a location is, in tiers: near (same metro or region), mid, far, and another continent
export const TIERS = [[500, "t1", "near"], [1500, "t2", "region"], [4000, "t3", "far"], [Infinity, "t5", "away"]];
export const tierOf = d => TIERS.find(([max]) => d < max);

// A round trip that takes much longer than the distance needs went a long way round (or waited in a queue): more
// than twice the floor plus 40 ms, as the floor is a straight line and real routes are 1.5-2 times longer
export const detoured = (ms, d) => ms > floorMs(d) * 2 + 40;

// The nearest location of a CDN whose list is known, to a point: [code, place, km], or null
export function nearest(map, lat, lon, skip) {
  let best = null;
  for (const [code, p] of Object.entries(map || {})) {
    if (code === skip) continue;
    const d = km(lat, lon, p[2], p[3]);
    if (!best || d < best[2]) best = [code, p, d];
  }
  return best;
}

// A location answered that is much farther than the CDN's nearest one: not chosen by distance (a cheaper route, the
// site's plan, or the network's peering). 1000 km and twice the distance, so that a neighboring city doesn't count.
export const missedNearest = (d, near) => !!near && d - near[2] > 1000 && d > near[2] * 2;

export const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 : null; };

// A location that serves the visitor badly: 1500 km or more away, or a round trip far beyond what its distance needs
export const isFar = r => r.d >= 1500 || detoured(r.ms, r.d);
export const FAST = 30;   // ms: a round trip this short is a nearby edge, whatever the distance says

// What the results say together: rows = [{ id, code, place, ms, d, near }] (d: km when the visitor's location is
// known; near: the CDN's nearest location, when its list is known). →
//   key       the headline: v_good (three in four located ones nearby), v_mixed, v_far, v_noloc, v_none
//   near/far  how many located ones are nearby / far; located: how many say where they are; med: the median round trip
//   farthest  the located row farthest away
//   findings  what to tell, most important first, at most four: [{ kind: "bad" | "warn" | "ok", key, ids?, row?, n? }]
//             f_fail      these didn't answer
//             f_far       this one serves from far away (row.near set when it isn't its nearest location)
//             f_slowpath  this one is near, but the round trip is much longer than the distance needs
//             f_more      n more serve from far away
//             f_fast      these answer within FAST ms
export function summary(rows) {
  const ok = rows.filter(r => r.ms != null), failed = rows.filter(r => r.ms == null);
  const findings = [];
  if (failed.length) findings.push({ kind: "bad", key: "f_fail", ids: failed.map(r => r.id) });
  if (!ok.length) return { key: "v_none", near: 0, far: 0, located: 0, med: null, farthest: null, findings };
  const located = ok.filter(r => r.d != null);
  const far = located.filter(isFar).sort((a, b) => b.d - a.d), near = located.filter(r => !isFar(r));
  for (const r of far.slice(0, 2)) findings.push({ kind: "warn", key: r.d >= 1500 ? "f_far" : "f_slowpath", row: r });
  if (far.length > 2) findings.push({ kind: "warn", key: "f_more", n: far.length - 2 });
  const fast = ok.filter(r => r.ms < FAST).sort((a, b) => a.ms - b.ms);
  if (fast.length) findings.push({ kind: "ok", key: "f_fast", ids: fast.map(r => r.id) });
  const share = located.length ? near.length / located.length : 0;
  const key = !located.length ? "v_noloc" : share >= .75 ? "v_good" : share <= .34 ? "v_far" : "v_mixed";
  const farthest = [...located].sort((a, b) => b.d - a.d)[0] || null;
  return { key, near: near.length, far: far.length, located: located.length, med: median(ok.map(r => r.ms)), farthest, findings: findings.slice(0, 4) };
}

/* ---------- a result in a link: /r/<code>, or /<lang folder>/r/<code> ---------- */
// The Worker reads it to put the locations in the link's preview title; the page reads it to draw the result. It never
// holds an address. The visitor's city (and where it is, to 0.1°, for the distances) and network only when they tick
// the box: without them the link has the locations and round trips but no distances, which would place the visitor.
//
// Format 1:  1~<time, base 36 seconds>~<where>~<network>~<rows>~<site>
//   where:   <cc>.<lat>.<lon>.<city>  lat/lon in tenths of a degree from -90/-180, base 36; city base64url (UTF-8);
//            "-" when not shown
//   network: base64url of the network's name, or "-"
//   rows:    <id>.<code>.<ms>  joined by "_"; ms in tenths, base 36, empty when it didn't answer; code empty when the
//            CDN didn't say
//   site:    <cdn or ->.<code>.<ms>.<host>  the site check, or "-"
// Ids the reader doesn't know are skipped, so links keep working when CDNs are added. A later format gets a new
// first number; old links keep theirs.
export const FORMAT = 1;
const n36 = v => v == null ? "" : Math.max(0, Math.round(v * 10)).toString(36);
const p36 = s => !s ? null : /^[0-9a-z]+$/.test(s) ? parseInt(s, 36) / 10 : NaN;
const b64u = s => { const b = new TextEncoder().encode(s); let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = s => { try { const x = atob(s.replace(/-/g, "+").replace(/_/g, "/")); return new TextDecoder().decode(Uint8Array.from(x, c => c.charCodeAt(0))); } catch (e) { return null; } };
const CODE = /^[A-Z0-9-]{1,40}$/, HOST = /^[a-z0-9.-]{1,253}$/;

// { ts, where: { cc, lat, lon, city } | null, isp, rows: [{ id, code, ms }], site: { cdn, code, ms, host } | null } → code
export function encode({ ts, where, isp, rows, site }) {
  const w = where && /^[A-Z]{2}$/.test(where.cc || "") && where.lat != null
    ? [where.cc, Math.round((where.lat + 90) * 10).toString(36), Math.round((where.lon + 180) * 10).toString(36), b64u(where.city || "")].join(".") : "-";
  const r = rows.map(x => [x.id, x.code || "", n36(x.ms)].join(".")).join("_");
  const s = site && HOST.test(site.host) ? [site.cdn && /^[\w ]+$/.test(site.cdn) ? b64u(site.cdn) : "-", site.code || "", n36(site.ms), site.host].join(".") : "-";
  return [FORMAT, Math.round(ts / 1000).toString(36), w, isp ? b64u(isp) : "-", r || "-", s].join("~");
}

// code → { ts, where, isp, rows, site }, or null when it isn't a result this page can read
export function decode(code) {
  if (typeof code !== "string" || code.length > 3000) return null;
  const [v, ts, w, isp, r, s] = code.split("~");
  if (v !== "1" || !/^[0-9a-z]+$/.test(ts || "") || r == null || s == null) return null;
  let where = null;
  if (w && w !== "-") {
    const [cc, la, lo, city] = w.split(".");
    if (!/^[A-Z]{2}$/.test(cc) || !/^[0-9a-z]+$/.test(la) || !/^[0-9a-z]+$/.test(lo)) return null;
    where = { cc, lat: parseInt(la, 36) / 10 - 90, lon: parseInt(lo, 36) / 10 - 180, city: city ? unb64u(city) || "" : "" };
  }
  const rows = [], seen = new Set();
  for (const part of r === "-" ? [] : r.split("_")) {
    const [id, c, ms] = part.split(".");
    if (!BY[id] || seen.has(id)) continue;
    const x = { id, code: c && CODE.test(c) ? c : null, ms: p36(ms) };
    if (Number.isNaN(x.ms)) return null;
    seen.add(id); rows.push(x);
  }
  let site = null;
  if (s !== "-") {
    const [cdn, c, ms, ...h] = s.split("."), host = h.join(".");
    if (!HOST.test(host)) return null;
    site = { cdn: cdn && cdn !== "-" ? unb64u(cdn) : null, code: c && CODE.test(c) ? c : null, ms: p36(ms), host };
    if (Number.isNaN(site.ms)) return null;
  }
  if (!rows.length && !site) return null;
  return { ts: parseInt(ts, 36) * 1000, where, isp: isp && isp !== "-" ? unb64u(isp) || "" : "", rows, site };
}

// /r/<code> or /<lang folder>/r/<code> → { slug, code }, or null
export function sharePath(pathname) {
  const m = /^\/(?:([a-z]{2}(?:-[a-z]{2})?)\/)?r\/([0-9A-Za-z~._-]+)\/?$/.exec(pathname);
  return m ? { slug: m[1] || "", code: m[2] } : null;
}

// A host name from what someone typed: a URL, a name with a path, upper case… → "www.example.com", or null
export function hostOf(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = "https://" + s;
  try {
    const h = new URL(s).hostname.replace(/\.$/, "");
    return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(h) ? h : null;
  } catch (e) { return null; }
}

export const KNOWN = IDS;
