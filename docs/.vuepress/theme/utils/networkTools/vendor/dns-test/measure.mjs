// The test, in the browser. Every resolver's DoH address is a target, plus its "ip" address where the list has one
// (the server its UDP and DoT use, for the estimate). How it keeps the numbers honest:
//   - Warm-up: the first query opens the connection, then each of the run's three popular names is asked once, which
//     puts them in the resolver's cache. None of it counts. Every later query rides the open connection, so its time
//     is one round trip plus the resolver's work, as for UDP or DoT.
//   - Rounds: each round asks every target once, in a new random order, a few at a time. A burst of trouble on the
//     network hits all resolvers alike rather than whichever was being tested at that moment.
//     Cached: one of the popular names. Uncached (every other round): a random name under NXZONE, which no resolver
//     can have cached.
//   - Every URL is new (random letter case, random names) and fetched with cache: "no-store": no HTTP cache on the
//     way can answer instead of the resolver.
//   - Time: the browser's own network timing for that request (Resource Timing) when it has it, which page scripts
//     can't delay; otherwise the time until the answer is in.
//   - Where the resolver allows reading answers (CORS), an answer only counts when it is one: NOERROR for the popular
//     names, NXDOMAIN for the random one (an address there means the resolver rewrites missing names). Elsewhere the
//     page can only time the answer, which scripts/verify.mjs checks is a DNS answer.
//   - No answer within the timeout, or a failed request, is a loss.
//   - first: targets tested on their own before the rest (a resolver's own page tests that resolver first): its
//     warm-up and all its rounds, then the others', with the same names.
import { dohURL, parse, mixCase, randLabel, RCODE } from "./dns.mjs";

export const ROUNDS = 10;
const CONC = 8, TIMEOUT = 3000;

// Resource Timing entries by URL, as the browser records them
const seen = new Map();
let observer = null;
function watch() {
  if (observer || typeof PerformanceObserver === "undefined") return;
  try {
    performance.setResourceTimingBufferSize && performance.setResourceTimingBufferSize(2000);
    observer = new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name.includes("dns=")) seen.set(e.name, e); });
    observer.observe({ type: "resource", buffered: false });
  } catch (e) { observer = null; }
}

async function timing(url, fallback) {
  // the entry is recorded when the response ends, which can be a moment after the promise settles
  for (let i = 0; i < 6 && !seen.has(url); i++) await new Promise(r => setTimeout(r, 25));
  const e = seen.get(url);
  seen.delete(url);
  if (e && e.duration > 0) return e.duration;
  return fallback;
}

// One query. Resolves to { ms, answer } (answer null when it can't be read), or throws.
async function hit(t, name, signal) {
  const url = dohURL(t.url, name);
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT);
  const stop = () => ctl.abort();
  signal && signal.addEventListener("abort", stop);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { mode: t.cors ? "cors" : "no-cors", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { accept: "application/dns-message" }, signal: ctl.signal });
    let answer = null;
    if (t.cors) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      answer = parse(await res.arrayBuffer());
      if (!answer) throw new Error("not DNS");
    } else {
      await res.arrayBuffer().catch(() => {});
    }
    const wall = performance.now() - t0;
    return { ms: await timing(url, wall), answer };
  } finally {
    clearTimeout(timer);
    signal && signal.removeEventListener("abort", stop);
  }
}

export function targets(resolvers) {
  const out = [];
  for (const r of resolvers) {
    out.push({ r, kind: "doh", url: r.doh, cors: !!r.cors });
    if (r.ip) out.push({ r, kind: "ip", url: r.ip, cors: !!r.ipCors });
  }
  for (const t of out) Object.assign(t, { up: null, err: "", warm: [], cached: [], uncached: [], sent: 0, lost: 0, rewrites: false });
  return out;
}

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

async function pool(items, n, f, signal) {
  const q = shuffle([...items]);
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => {
    while (q.length && !(signal && signal.aborted)) await f(q.shift());
  }));
}

// run the whole test; onStep(target) after every query that changes what a row shows, onPhase(i) when a
// group of targets starts (0: first, if any; then the rest)
export async function run(ts, { names, nxzone, rounds = ROUNDS, signal, first = [], onStep = () => {}, onPhase = () => {} }) {
  watch();
  const pickNames = shuffle([...names]).slice(0, 3);
  const groups = first.length ? [first, ts.filter(t => !first.includes(t))] : [ts];
  for (let i = 0; i < groups.length && !(signal && signal.aborted); i++) {
    onPhase(i);
    await runGroup(groups[i], pickNames, { nxzone, rounds, signal, onStep });
  }
  return { names: pickNames };
}

async function runGroup(ts, pickNames, { nxzone, rounds, signal, onStep }) {
  // warm-up: open the connection (finding out whether answers can be read), then cache the names
  await pool(ts, CONC, async t => {
    try {
      try { await hit(t, mixCase(pickNames[0]), signal); }
      catch (e) {
        if (!t.cors || (signal && signal.aborted)) throw e;
        t.cors = false;                    // no CORS here after all: time it without reading
        await hit(t, mixCase(pickNames[0]), signal);
      }
      // the cache-filling queries already ride the open connection: a first idea of the time, until the rounds have some
      for (const n of pickNames.slice(1)) await hit(t, mixCase(n), signal).then(x => t.warm.push(x.ms), () => {});
      t.up = true;
    } catch (e) {
      t.up = false;
      t.err = e && e.name === "AbortError" ? "timeout" : "fail";
    }
    onStep(t);
  }, signal);

  const live = ts.filter(t => t.up);
  for (let r = 0; r < rounds && !(signal && signal.aborted); r++) {
    const name = pickNames[r % pickNames.length], nx = r % 2 === 0;
    await pool(live, CONC, async t => {
      t.sent++;
      try {
        const { ms, answer } = await hit(t, mixCase(name), signal);
        if (answer && answer.rcode !== RCODE.NOERROR) throw new Error("rcode " + answer.rcode);
        t.cached.push(ms);
      } catch (e) { t.lost++; }
      if (nx) {
        t.sent++;
        try {
          const { ms, answer } = await hit(t, randLabel() + "." + nxzone, signal);
          if (answer && answer.rcode === RCODE.NOERROR && answer.addrs.length) t.rewrites = true;
          t.uncached.push(ms);
        } catch (e) { t.lost++; }
      }
      onStep(t);
    }, signal);
  }
}

/* ---------- statistics ---------- */

export function quantile(a, q) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), p = q * (s.length - 1), i = Math.floor(p);
  return i + 1 < s.length ? s[i] + (p - i) * (s[i + 1] - s[i]) : s[i];
}
export const median = a => quantile(a, .5);
export const loss = t => t.sent ? t.lost / t.sent : 0;

// rank by the cached median; each percent of lost queries makes it 3% worse (a lost query costs a retry, a second or
// more). Uncached times are shown, not ranked: they depend on where each site's own DNS servers are.
export function score(t) {
  const m = median(t.cached);
  if (!t.up || m == null || loss(t) >= .5) return null;
  return m * (1 + 3 * loss(t));
}
