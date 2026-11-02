// What the raw readings say about the visitor: the system and browser behind the user agent, the graphics card behind
// the WebGL string, the keyboard layout, whether the network is a data center's, a guess at nationality, and the
// disguise checks. Pure functions (no DOM), so they run in tests too.
import { TZ_CC } from "./tz.mjs";

// the country a language tag points at: its own region (zh-CN, pt-BR), else the one country most speakers of a
// language without a region live in. English, Spanish, Arabic and the like are spoken too widely to say.
const LANG_CC = { ja: "JP", ko: "KR", de: "DE", fr: "FR", it: "IT", ru: "RU", uk: "UA", pl: "PL", nl: "NL", tr: "TR", vi: "VN",
  th: "TH", id: "ID", ms: "MY", he: "IL", fa: "IR", el: "GR", cs: "CZ", sk: "SK", hu: "HU", ro: "RO", bg: "BG", sv: "SE", da: "DK",
  nb: "NO", no: "NO", fi: "FI", et: "EE", lv: "LV", lt: "LT", sl: "SI", hr: "HR", sr: "RS", ka: "GE", hy: "AM", kk: "KZ", uz: "UZ",
  bn: "BD", hi: "IN", ta: "IN", te: "IN", mr: "IN", ur: "PK", km: "KH", lo: "LA", my: "MM", mn: "MN", ne: "NP", si: "LK", fil: "PH", tl: "PH" };
// Where each language is widely spoken, beyond its first country (official, or by a large share of people). zh is
// Simplified (zh-CN is how Singapore and Malaysia write it too); zh-Hant is Traditional.
const SPOKEN = {
  zh: ["CN", "SG", "MY"], "zh-Hant": ["TW", "HK", "MO"], es: ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "US", "GQ"],
  pt: ["PT", "BR", "AO", "MZ", "CV", "GW", "ST", "TL"], fr: ["FR", "BE", "CH", "CA", "LU", "MC", "SN", "CI", "CM", "CD", "MA", "DZ", "TN", "HT", "MG", "ML", "BF", "NE", "BJ", "TG", "GA", "CG"],
  de: ["DE", "AT", "CH", "LI", "LU", "BE"], it: ["IT", "CH", "SM", "VA"], nl: ["NL", "BE", "SR"], sv: ["SE", "FI"], ru: ["RU", "BY", "KZ", "KG", "UA", "MD"],
  ar: ["SA", "AE", "EG", "MA", "DZ", "TN", "IQ", "JO", "LB", "SY", "KW", "QA", "BH", "OM", "YE", "LY", "SD", "PS", "MR"], ms: ["MY", "BN", "SG", "ID"],
  ta: ["IN", "LK", "SG", "MY"], tr: ["TR", "CY"], el: ["GR", "CY"], ro: ["RO", "MD"], sr: ["RS", "BA", "ME"], hr: ["HR", "BA"], fa: ["IR", "AF", "TJ"],
  ur: ["PK", "IN"], bn: ["BD", "IN"], ko: ["KR", "KP"], he: ["IL"], uk: ["UA"], hi: ["IN"], sw: ["KE", "TZ", "UG"],
};
// the countries where a language tag's language is widely spoken (its own region among them)
export function spokenIn(tag) {
  if (!tag) return [];
  const base = String(tag).split(/[-_]/)[0].toLowerCase(), key = base === "zh" && /hant|-(tw|hk|mo)\b/i.test(tag) ? "zh-Hant" : base;
  const own = langCC(tag);
  return [...new Set([...(own ? [own] : []), ...(SPOKEN[key] || [])])];
}
export function langCC(tag) {
  if (!tag) return null;
  const p = String(tag).split(/[-_]/), base = p[0].toLowerCase();
  const region = p.slice(1).find(x => /^[A-Za-z]{2}$/.test(x));
  if (region) return region.toUpperCase();
  if (base === "zh") return /hant/i.test(tag) ? "TW" : "CN";
  return LANG_CC[base] || null;
}
export const tzCC = tz => TZ_CC[tz] || null;

// nationality: the browser language says most about it, unless it is plain (US) English, which is every device's
// default; then the system time zone (where the device was set up), then the address.
// English in any variant says little: en-US is the default half the world leaves on, en-GB the English of India,
// Singapore or Australia as much as of Britain. (ios: on iPhone and iPad the language's region comes from the Region
// setting, so there en-GB or en-US is someone who set that country; the time zone of a phone follows where it is.)
export function nationality({ langs = [], tz, ipcc, sys, ios }) {
  const first = langs[0] || "", lcc = langCC(first), tcc = tzCC(tz);
  const english = l => /^en\b/i.test(l || ""), plainEn = ios ? /^en$/i.test(first) : english(first);
  // (a language widely spoken in the time zone's country too says that country: Chinese on Kuala Lumpur's clock)
  if (lcc && !plainEn) return tcc && tcc !== lcc && spokenIn(first).includes(tcc) ? { cc: tcc, from: ["langs", "tz"] } : { cc: lcc, from: tcc === lcc ? ["langs", "tz"] : ["langs"] };
  // plain English first, another language further down the list: that one says more
  const other = langs.slice(1).filter(l => !english(l)).map(langCC).find(Boolean);
  if (other) return { cc: other, from: tcc === other ? ["langs", "tz"] : ["langs"] };
  // a browser left in plain English on a system that installed one other language (its fonts, voices, keyboard)
  if (sys && sys.cc.length === 1) return { cc: sys.cc[0], from: tcc === sys.cc[0] ? [...sys.from, "tz"] : sys.from };
  if (tcc) return { cc: tcc, from: ["tz"] };
  if (lcc) return { cc: lcc, from: ["langs"] };
  return ipcc ? { cc: ipcc, from: ["geo"] } : null;
}

// Operating system, browser and kind of device. Client hints (Chromium) are precise; the user agent string is the
// fallback (Safari and Firefox), where macOS is frozen at 10.15 and Windows at 10.
export function device(ua = "", hi = {}, touch = 0) {
  let os = null, osv = "", kind = "pc", model = hi.model || "";
  const plat = hi.platform || "", pv = hi.platformVersion || "";
  // HarmonyOS first: its browsers claim Windows or Android in the user agent to get the right pages, and name
  // themselves with OpenHarmony / HarmonyOS / ArkWeb ("(Phone; OpenHarmony 5.0)", "(PC; OpenHarmony 5.1)")
  if (/^(HarmonyOS|OpenHarmony)$/i.test(plat) || /OpenHarmony|HarmonyOS|ArkWeb/.test(ua)) {
    os = "HarmonyOS";
    const v = ua.match(/(?:OpenHarmony|HarmonyOS)[ /]?(\d+(?:\.\d+)?)/);
    osv = pv ? pv.split(".").slice(0, 2).join(".").replace(/\.0$/, "") : v ? v[1] : "";
    kind = /\(Phone;/.test(ua) ? "phone" : /\(Tablet;/.test(ua) ? "tablet" : /\(PC;/.test(ua) ? "pc" : /Mobile/.test(ua) || hi.mobile ? "phone" : touch > 1 ? "tablet" : "pc";
    if (!model) { const m = ua.match(/HarmonyOS; ([^;)]+?)[;)]/); if (m) model = m[1].trim(); }
  } else if (plat === "Windows" || /Windows NT/.test(ua)) {
    os = "Windows";
    if (pv) osv = parseInt(pv, 10) >= 13 ? "11" : parseInt(pv, 10) > 0 ? "10" : "";
    else { const m = ua.match(/Windows NT ([\d.]+)/); osv = m ? ({ "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" })[m[1]] || m[1] : ""; }
  } else if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch > 1)) {
    const ipad = /iPad/.test(ua) || /Macintosh/.test(ua);
    os = ipad ? "iPadOS" : "iOS"; kind = ipad ? "tablet" : "phone";
    const m = ua.match(/OS (\d+)[_.](\d+)/) || ua.match(/Version\/(\d+)\.(\d+)/);
    osv = m ? m[1] + "." + m[2] : "";
    model = ipad ? "iPad" : "iPhone";
  } else if (plat === "macOS" || /Macintosh|Mac OS X/.test(ua)) {
    os = "macOS"; kind = "mac";
    if (pv) osv = pv.split(".").slice(0, 2).join(".").replace(/\.0$/, "");
    else { const m = ua.match(/Mac OS X (\d+)[_.](\d+)/); osv = m ? m[1] + "." + m[2] : ""; }
  } else if (plat === "Android" || /Android/.test(ua)) {
    os = "Android"; kind = /Mobile/.test(ua) || hi.mobile ? "phone" : "tablet";
    osv = pv ? pv.split(".")[0] : ((ua.match(/Android (\d+)/) || [])[1] || "");
    if (!model) { const m = ua.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/); if (m && m[1] !== "K") model = m[1].trim(); }
  } else if (plat === "Chrome OS" || /CrOS/.test(ua)) os = "ChromeOS";
  else if (plat === "Linux" || /Linux/.test(ua)) os = "Linux";
  return { os, osv, kind, model };
}

// the browser and its version: client hints name the real brand (Edge, Opera, Brave report "Chromium" plus their own);
// otherwise read the user agent, most specific first
export function browser(ua = "", brands = []) {
  // the browsers apps open links in, which otherwise read as WebKit or Android WebView with no name
  const apps = [["X", /Twitter for (?:iPhone|iPad|Android)\/(\d+)|TwitterAndroid\/(\d+)/], ["WeChat", /MicroMessenger\/(\d+)/], ["Weibo", /Weibo \(|__weibo__(\d+)/],
    ["QQ", /\bQQ\/(\d+)/], ["Instagram", /Instagram (\d+)/], ["Facebook", /FBAV\/(\d+)|\[FBAN/], ["LINE", /\bLine\/(\d+)/], ["TikTok", /musical_ly_(\d+)|BytedanceWebview|TikTok (\d+)/],
    ["Telegram", /Telegram-Android\/(\d+)/]];
  for (const [name, re] of apps) { const m = ua.match(re); if (m) return { name, v: (m.slice(1).find(Boolean) || "").split(".")[0] }; }
  const real = brands.filter(b => !/Not.?A.?Brand|Chromium/i.test(b.brand));
  const b = real.find(b => !/Google Chrome/.test(b.brand)) || real[0];
  if (b) return { name: b.brand.replace(/^Microsoft /, "").replace(/^Google /, ""), v: String(b.version).split(".")[0] };
  const tests = [["Edge", /Edg(?:e|A|iOS)?\/(\d+)/], ["Opera", /OPR\/(\d+)/], ["Samsung Internet", /SamsungBrowser\/(\d+)/], ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
    ["Chrome", /(?:Chrome|CriOS)\/(\d+)/], ["Safari", /Version\/(\d+).*Safari/]];
  for (const [name, re] of tests) { const m = ua.match(re); if (m) return { name, v: m[1] }; }
  return { name: null, v: "" };
}

// "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 (0x00002786) Direct3D11 vs_5_0 ps_5_0, D3D11)" → "NVIDIA GeForce RTX 4070"
export function gpuName(r) {
  if (!r || /^(Brave|Mozilla)$/i.test(r)) return null;   // Brave's and Firefox's (resistFingerprinting) stand-ins for the card's name
  let s = String(r);
  const m = s.match(/^ANGLE \((?:[^,]*), (.*?)(?:, [^,]*)?\)$/);
  if (m) s = m[1].replace(/^ANGLE Metal Renderer: /, "");
  // the driver's API after the name: "… Direct3D11 vs_5_0 ps_5_0", "… OpenGL 4.6"
  s = s.replace(/\s*\(0x[0-9a-f]+\)/i, "").replace(/\s+(Direct3D\d*|OpenGL|Vulkan|Metal)(\s.*)?$/i, "").replace(/\s*\(TM\)|\(R\)/gi, "").replace(/, or similar$/, "").trim();
  return s || null;
}

// the OS family a WebGL renderer string gives away, when it does
export function gpuOS(r) {
  if (!r) return null;
  if (/Direct3D|D3D1\d/.test(r)) return "Windows";
  if (/Apple (M\d|GPU)|Metal/.test(r)) return "Apple";
  if (/Adreno|Mali|PowerVR|Xclipse|Maleoon/.test(r)) return "Android";
  return null;
}

// keyboard layout from navigator.keyboard.getLayoutMap(): a Map of key codes to the characters they type
export function kbdLayout(map) {
  if (!map || !map.size) return null;
  const k = c => (map.get(c) || "").toLowerCase();
  const q = k("KeyQ"), w = k("KeyW"), y = k("KeyY"), z = k("KeyZ");
  if (/[Ѐ-ӿ]/.test(q)) return "ЙЦУКЕН";
  if (/[֐-׿]/.test(q + w)) return "Hebrew";
  if (/[Ͱ-Ͽ]/.test(w)) return "Greek";
  if (/[؀-ۿ]/.test(q)) return "Arabic";
  if (q === "a" && w === "z") return "AZERTY";
  if (y === "z" && z === "y") return "QWERTZ";
  if (q === "'" || q === ";" || k("KeyE") === ".") return "Dvorak";
  if (k("KeyD") === "s" && k("KeyF") === "t") return "Colemak";
  return q === "q" ? "QWERTY" : null;
}

// Data centers, clouds and VPN hosts: the networks sites can tell apart from home and mobile connections.
const DC_ASN = new Set([13335, 209242, 16509, 14618, 15169, 396982, 19527, 8075, 8068, 14061, 63949, 20473, 16276, 24940, 31898, 45102, 37963,
  132203, 45090, 9009, 60068, 212238, 51167, 136907, 55990, 906, 25820, 35916, 54600, 40065, 36352, 53667, 46562, 8100, 62904, 21859, 199524,
  202422, 12876, 197540, 47583, 141995, 35913, 32613, 26496, 46606, 398101, 30633, 64267, 201814, 22612, 7979, 10439, 400328, 49981, 61317]);
const DC_NAME = /amazon|\baws\b|google cloud|google llc|microsoft|azure|digitalocean|linode|akamai|vultr|choopa|\bovh|hetzner|oracle|alibaba|aliyun|tencent|huawei cloud|contabo|leaseweb|m247|datacamp|cdn77|g-?core|hostinger|hosting|\bhost|server|cloud|data ?cent|colo|\bvps\b|dedicated|ionos|scaleway|kamatera|racknerd|frantech|psychz|quadranet|zenlayer|dmit|cloudflare|fastly|packet|equinix|terrahost|hostwinds|interserver|liquid web|ponynet|clouvider|tzulo|cogent|mullvad|proton|nordvpn|expressvpn|surfshark|private internet/i;
export const isDataCenter = (asn, org) => DC_ASN.has(+asn) || DC_NAME.test(org || "");

// hints about what the visitor does, from the fonts only certain software installs
export const FONT_HINTS = [
  ["dev", ["JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", "Hack", "Inconsolata"]],
  ["design", ["Myriad Pro", "Minion Pro", "Adobe Garamond Pro", "Source Han Sans", "Adobe Clean"]],
  ["office", ["Aptos", "Calibri", "Cambria"]],
];
// fonts that come with Windows itself (Cascadia Code with Windows Terminal), so there they say nothing; Aptos
// (Microsoft 365 since 2023) still says Office
const WIN_FONTS = ["Calibri", "Cambria", "Cascadia Code"];
export function fontHints(fonts, os) {
  return FONT_HINTS.map(([k, l]) => [k, l.find(f => fonts.includes(f) && !(os === "Windows" && WIN_FONTS.includes(f)))]).filter(([, f]) => f);
}

// Addresses in one network count as one exit: CGNAT pools and temporary IPv6 addresses move around inside a /16 or /64
const v6g = a => {
  const [h, tl = ""] = a.toLowerCase().split("::"), H = h ? h.split(":") : [], T = tl ? tl.split(":") : [];
  return [...H, ...Array(Math.max(0, 8 - H.length - T.length)).fill("0"), ...T].map(g => g.padStart(4, "0"));
};
export const netOf = ip => ip.includes(":") ? v6g(ip).slice(0, 4).join(":") : ip.split(".").slice(0, 2).join(".");
// Split routing: two destinations that saw different networks over the same IP version. IPv4 next to IPv6 is just a
// dual-stack connection. exits: [[row id, address]] in the order the rows are drawn; the first pair that differs.
export function splitOf(exits) {
  const seen = [];
  for (const [id, ip] of exits) {
    if (!ip) continue;
    const other = seen.find(([, x]) => (x.includes(":") === ip.includes(":")) && netOf(x) !== netOf(ip));
    if (other) return { a: other[0], b: id, ipA: other[1], ipB: ip, n: new Set(exits.filter(([, x]) => x).map(([, x]) => netOf(x))).size };
    seen.push([id, ip]);
  }
  return null;
}

// The disguise checks. Each returns [level, key, vars]: "ok" (nothing gives you away), "warn" (a site could notice),
// "bad" (a clear contradiction), "info" (says nothing either way), or null while its inputs are still coming in.
const fam = ip => ip && ip.includes(":") ? 6 : 4;
export function checks(x) {
  const out = {};
  // the system time zone against the address's: another zone of the same country (the US has six) only hints, since
  // an address is often placed in the right country but the wrong city; another country's is a contradiction
  if (x.tz == null || !x.ipcc) out.tz = null;
  else if (x.tzOff === x.ipTzOff) out.tz = ["ok", "c_tz_ok", { a: x.tzOff }];
  // (Firefox's resistFingerprinting gives every site the same stand-in clock: it hides the zone, and shows the setting)
  else if (x.rfp) out.tz = ["warn", "c_tz_rfp", { a: x.ipTzOff }];
  else out.tz = [tzCC(x.tz) === x.ipcc ? "warn" : "bad", tzCC(x.tz) === x.ipcc ? "c_tz_near" : "c_tz_off", { a: x.ipTzOff, b: x.tzOff, za: x.ipTz || null, zb: x.tz }];
  // the browser language against the address's country
  // (any language on the list that points to the address's country, or is widely spoken there, will do: en-IN or
  // Tamil in India, Chinese in Singapore, Spanish in Mexico; English first otherwise says little, whatever its variant)
  const lcc = langCC((x.langs || [])[0]);
  if (!x.ipcc || !x.langs) out.lang = null;
  else if (x.langs.some(l => langCC(l) === x.ipcc || (!/^en\b/i.test(l) && spokenIn(l).includes(x.ipcc)))) out.lang = ["ok", "c_lang_ok", {}];
  else if (!lcc || /^en\b/i.test(x.langs[0])) out.lang = ["info", "c_lang_info", {}];
  else out.lang = ["warn", "c_lang_warn", { cc: lcc }];
  // the DNS resolver that looked the page's test name up, against the address's country: a VPN that leaves DNS
  // outside the tunnel shows the visitor's own provider here
  if (x.dnsCC === undefined || !x.ipcc) out.dns = null;
  else if (!x.dnsCC) out.dns = ["info", "c_dns_info", {}];
  else if (x.dnsCC === x.ipcc) out.dns = ["ok", "c_dns_ok", {}];
  else out.dns = ["bad", "c_dns_bad", { cc: x.dnsCC }];
  // split routing: the exits seen by different kinds of destination (x.exits, set once they are all in)
  if (!x.exits) out.split = null;
  else if (x.exits.filter(([, ip]) => ip).length < 2) out.split = ["info", "c_na", {}];
  else { const s = splitOf(x.exits); out.split = s ? ["warn", "c_split_warn", { a: s.a, b: s.b }] : ["ok", "c_split_ok", {}]; }
  // WebRTC: addresses the STUN servers saw that a site doesn't already see, over IPv4 or IPv6. The IPv4 / IPv6 test's
  // addresses count only when one of them is the page's own (otherwise they took another route, and the page's is the
  // one a site gets); another destination's exit never does. One of the page's family leaks; one of the other family
  // leaks once that family's address is known to differ, and until then may be the IPv6 a VPN lets through.
  if (x.rtc === undefined || !x.ip) out.webrtc = null;
  else if (x.rtc === false) out.webrtc = ["ok", "c_rtc_off", {}];
  // iCloud Private Relay gives each connection an exit of its own: the page's and WebRTC's both relay exits is no leak
  else if (isRelayIp(x.ip) && x.rtc.length && x.rtc.every(isRelayIp)) out.webrtc = ["ok", "c_rtc_relay", {}];
  else {
    const st = (x.exits || []).filter(([id]) => id === "stack").map(([, ip]) => ip), site = [x.ip, ...(st.includes(x.ip) ? st : [])];
    const other = x.rtc.filter(ip => !site.includes(ip)), known = f => site.some(ip => fam(ip) === f), leak = other.filter(ip => known(fam(ip)));
    out.webrtc = leak.length ? ["bad", "c_rtc_bad", { ip: leak[0] }] : other.length ? ["warn", "c_rtc_warn", { ip: other[0] }] : ["ok", x.rtc.length ? "c_rtc_ok" : "c_rtc_none", {}];
  }
  // the network
  out.dc = x.asn == null ? null : isRelayIp(x.ip) ? ["warn", "c_dc_relay", {}] : isDataCenter(x.asn, x.org) ? ["warn", "c_dc_warn", { org: x.org || "AS" + x.asn }] : ["ok", "c_dc_ok", { org: x.org || "AS" + x.asn }];
  // the system the user agent claims against the one the browser's other parts give away
  if (!x.uaOS) out.ua = x.real ? ["info", "c_ua_info", {}] : null;
  else {
    // (one name per system, whichever source names it: client hints say "Chrome OS", the user agent's reading "ChromeOS")
    const fam = o => /^(macOS|iOS|iPadOS)$/.test(o) ? "Apple" : /Harmony/i.test(o) ? "HarmonyOS" : /^Chrome ?OS$/i.test(o) ? "ChromeOS" : o;
    const claim = fam(x.uaOS);
    const tells = [x.hintOS && fam(x.hintOS), x.gpuOS].filter(Boolean);
    // (a HarmonyOS phone draws on the same GPUs as Android ones, and Linux runs on them too)
    const off = tells.find(t => t !== claim && !(t === "Android" && (claim === "Linux" || claim === "HarmonyOS")));
    out.ua = off ? ["bad", "c_ua_bad", { a: x.uaOS, b: off }] : ["ok", "c_ua_ok", { a: x.uaOS }];
  }
  // (a browser that adds noise per site, like Brave, draws the same twice on one page, but differently on the next site)
  out.fp = x.rand == null ? null : x.rand ? ["ok", "c_fp_rand", {}] : x.noise ? ["ok", "c_fp_site", {}] : ["warn", "c_fp_same", {}];
  out.bot = x.webdriver == null ? null : x.webdriver ? ["bad", "c_bot_bad", {}] : ["ok", "c_bot_ok", {}];
  // The round trip the browser measures to this site against the one Cloudflare measures on its connection: through a
  // proxy, Cloudflare only sees the proxy's leg, so the browser's is much longer. Over QUIC there is no TCP figure.
  if (!x.rttB || !x.rttCf) out.rtt = null;
  else {
    const extra = x.rttB - x.rttCf, v = { a: Math.round(x.rttCf), b: Math.round(x.rttB) };
    out.rtt = extra < 40 || x.rttB < x.rttCf * 1.6 ? ["ok", "c_rtt_ok", v] : extra < 100 ? ["warn", "c_rtt_warn", v] : ["bad", "c_rtt_bad", v];
  }
  // the languages the system itself has installed (Windows only: elsewhere every system ships them all)
  if (x.sys === undefined || !x.ipcc) out.syslang = null;
  else if (x.sys === false) out.syslang = ["info", "c_sys_na", {}];
  else if (!x.sys.cc.length) out.syslang = ["ok", "c_sys_none", {}];
  else if (x.sys.cc.includes(x.ipcc)) out.syslang = ["ok", "c_sys_ok", { cc: x.ipcc }];
  else out.syslang = ["warn", "c_sys_warn", { cc: x.sys.cc[0], from: x.sys.from.join(",") }];
  // an environment something rewrote: properties redefined, functions replaced, parts that should agree but don't
  if (!x.tamper) out.tamper = null;
  else out.tamper = x.tamper.length ? ["bad", "c_tamper_bad", { list: x.tamper.join(",") }] : ["ok", "c_tamper_ok", {}];
  return out;
}

// "+08:00" from a UTC offset in minutes
export const offTxt = m => (m < 0 ? "−" : "+") + String(Math.floor(Math.abs(m) / 60)).padStart(2, "0") + ":" + String(Math.abs(m) % 60).padStart(2, "0");

// The connection's protocols, from this site's /cdn-cgi/trace and the request itself. Each is [level, key, vars] like
// a check, or null while its inputs are still coming in. They say how the connection is made, not who you are, so
// they don't count among the things that give you away.
//   http   the protocols seen so far ("HTTP/2", "http/3", …: the page's request, then repeated traces)
//   rtc    the public addresses STUN servers saw over UDP ([] none, false WebRTC off, undefined not yet)
//   br     { name, v } the browser; sni, kex, warp, gateway: the trace's fields
export function protocols(x) {
  const out = {}, v = +(x.br && x.br.v) || 0, name = (x.br && x.br.name) || "";
  // HTTP/3 needs UDP 443. Seen once, it works; not seen, the browser may simply not have switched yet (it learns
  // that a site speaks HTTP/3 from a first answer over TCP), unless UDP gets out nowhere at all: then it's blocked
  // or the proxy doesn't carry it. Without WebRTC there's no telling.
  if (!x.http || !x.http.length || x.rtc === undefined) out.h3 = null;
  else if (x.http.some(p => /^(http\/3|h3)$/i.test(p))) out.h3 = ["ok", "c_h3_ok", {}];
  else if (x.rtc === false) out.h3 = ["info", "c_h3_unk", {}];
  else out.h3 = x.rtc.length ? ["info", "c_h3_wait", {}] : ["warn", "c_h3_udp", {}];
  // ECH: this site publishes its keys in DNS (an HTTPS record), so a browser that can use them hides which site it
  // talks to. When it doesn't, the likeliest reason depends on the browser.
  if (!x.sni) out.ech = null;
  else if (x.sni === "encrypted") out.ech = ["ok", "c_ech_ok", {}];
  else out.ech = ["warn", name === "Safari" ? "c_ech_safari" : name === "Firefox" ? "c_ech_ff" : "c_ech_dns", {}];
  // post-quantum key exchange: browsers that offer it by default (Chromium 124, Firefox 132, Safari 26) and still
  // end up with a classical one point to something in between that makes its own TLS connections
  if (!x.kex) out.pq = null;
  else if (/MLKEM|Kyber/i.test(x.kex)) out.pq = ["ok", "c_pq_ok", { kex: x.kex }];
  else {
    const chromium = /^(Chrome|Edge|Opera|Brave|Vivaldi|Yandex)$/.test(name), want = chromium ? 124 : name === "Firefox" ? 132 : name === "Safari" ? 26 : 0;
    out.pq = want && v >= want ? ["warn", "c_pq_mitm", { kex: x.kex, b: name + " " + v }] : ["info", "c_pq_old", { kex: x.kex }];
  }
  // WARP and Gateway: Cloudflare's own tunnel and filter, neither good nor bad
  if (!x.warp) out.warp = null;
  else if (x.warp !== "off") out.warp = ["info", "c_warp_on", { w: x.warp }];
  else out.warp = ["info", x.gateway === "on" ? "c_warp_gw" : "c_warp_off", {}];
  return out;
}

// The signs of the languages a Windows system installed: the supplemental fonts Windows adds with a language (and
// the ones Chinese Office installs), the voices that come with a language pack, a keyboard layout tied to a region.
// Returns { cc: [countries], from: [rows] }, or false where it can't tell (other systems ship every font and voice).
const SYS_FONTS = [["CN", ["DengXian", "FangSong", "KaiTi", "SimHei", "STKaiti", "STSong", "STXihei"]], ["TW", ["DFKai-SB", "MingLiU", "PMingLiU"]],
  ["JP", ["BIZ UDGothic", "BIZ UDMincho", "UD Digi Kyokasho N-R", "Yu Mincho"]], ["KR", ["Batang", "Gulim", "Dotum", "Gungsuh"]]];
export const SYS_FONT_LIST = SYS_FONTS.flatMap(([, l]) => l);
const KBD_CC = { AZERTY: ["FR", "BE"], QWERTZ: ["DE", "AT", "CH", "CZ", "SK", "HU"], "ЙЦУКЕН": ["RU", "UA", "BY", "KZ"], Hebrew: ["IL"], Greek: ["GR", "CY"] };
export function sysLangs({ os, fonts = [], voices = [], kbd }) {
  if (os !== "Windows") return false;
  const cc = [], from = [], add = (l, row) => { for (const c of l) if (!cc.includes(c)) cc.push(c); if (l.length && !from.includes(row)) from.push(row); };
  for (const [c, l] of SYS_FONTS) if (l.some(n => fonts.includes(n))) add([c], "fonts");
  // a local voice in a language other than English came with that language's pack; a dozen of them says nothing
  const local = [...new Set(voices.map(langCC).filter(c => c && !/^(US|GB|AU|CA|IE|IN|NZ|ZA)$/.test(c)))];
  if (local.length && local.length <= 3) add(local, "voices");
  if (KBD_CC[kbd]) add(KBD_CC[kbd], "kbd");
  return { cc, from };
}

// The environment's grade: every check that gives you away costs points, a clear contradiction more than a hint
export function grade(ck, ids) {
  let score = 100;
  for (const id of ids) { const l = ck[id] && ck[id][0]; if (l === "bad") score -= 18; else if (l === "warn") score -= 8; }
  score = Math.max(0, score);
  return { score, grade: score === 100 ? "A+" : score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F" };
}

// The screen in physical pixels. screen.width is in CSS pixels, after the system's scaling: a 4K monitor at the
// 150% Windows sets by default reports 2560×1440. devicePixelRatio is that scaling times the browser's zoom, so the
// product lands on a monitor's real size unless the page is zoomed; then the system scales Windows and macOS offer
// are tried for one that gives a standard size. Phones (whole ratios, no zoom) keep the plain product.
const SIZES = [[7680, 4320], [6016, 3384], [5120, 2880], [5120, 2160], [5120, 1440], [4096, 2304], [3840, 2400], [3840, 2160], [3840, 1600], [3840, 1080],
  [3456, 2234], [3440, 1440], [3200, 1800], [3024, 1964], [3000, 2000], [2880, 1920], [2880, 1800], [2736, 1824], [2560, 1664], [2560, 1600], [2560, 1440],
  [2560, 1080], [2496, 1664], [2256, 1504], [2160, 1440], [1920, 1200], [1920, 1080], [1680, 1050], [1600, 900], [1440, 900], [1366, 768], [1280, 1024],
  [1280, 800], [1280, 720]];
const near = (w, h) => SIZES.find(([a, b]) => (Math.abs(a - w) <= a * 0.01 && Math.abs(b - h) <= b * 0.01) || (Math.abs(a - h) <= a * 0.01 && Math.abs(b - w) <= b * 0.01));
export function physicalScreen(w, h, dpr = 1) {
  const pw = Math.round(w * dpr), ph = Math.round(h * dpr), hit = near(pw, ph);
  if (hit) return w >= h === hit[0] >= hit[1] ? [hit[0], hit[1]] : [hit[1], hit[0]];
  // a page is more often zoomed in than out: the scales just under the ratio first, then the rest
  const S = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3], under = S.filter(s => s < dpr).reverse(), over = S.filter(s => s > dpr);
  for (const s of [...under, ...over]) {
    const m = near(Math.round(w * s), Math.round(h * s));
    if (m) return w >= h === m[0] >= m[1] ? [m[0], m[1]] : [m[1], m[0]];
  }
  return [pw, ph];
}

// What WebGL reports when the browser isn't drawing on the graphics card: Windows' fallback (remote desktop, virtual
// machines, no driver), Chrome's own, Mesa's. None of them names the card.
export const isSoftGpu = r => /Basic Render Driver|SwiftShader|llvmpipe|softpipe|Software Rasterizer/i.test(r || "");
// Some networks are registered under a street address rather than a name ("7F, World Peace Centre, 55 Wo Tong Tsui St")
// (a number with an address word, or a number in a list of three or more parts; "Level 3 Parent, LLC" is a name)
export const looksLikeAddress = o => { const s = String(o || ""); return /\d/.test(s) && ((s.match(/,/g) || []).length >= 2 || /\b\d+\s*\/?\s*F\b|\b(floor|street|st|road|rd|avenue|ave|building|bldg|suite|room)\b/i.test(s)); };

// A graphics card built into the processor (the one a laptop draws pages on by default)
// (AMD's numbered ones too: "Radeon 610M", "Radeon 780M", where discrete ones say "RX"; Intel's "Arc Graphics" in Core Ultra)
export const isIntegratedGpu = g => /UHD|HD Graphics|Iris|Radeon\(TM\) Graphics|Radeon Graphics|Vega \d+ Graphics|Radeon(\(TM\))? \d{3}M\b|Intel(\(R\))? Arc(\(TM\))? Graphics/i.test(g || "");
// WebGPU's name for the discrete card, when the default WebGL one is integrated and from another maker
// (browsers give the maker and the architecture only: "nvidia", "ada-lovelace" → "NVIDIA Ada Lovelace")
const MAKERS = { nvidia: "NVIDIA", amd: "AMD", intel: "Intel", apple: "Apple", qualcomm: "Qualcomm", arm: "Arm" };
export function discreteGpu(gl, hiGl, wgpu) {
  if (!gl || !isIntegratedGpu(gl)) return null;
  if (hiGl && hiGl !== gl && !isIntegratedGpu(hiGl)) return hiGl;
  const v = wgpu && MAKERS[String(wgpu.vendor || "").toLowerCase()];
  if (!v || gl.toLowerCase().includes(v.toLowerCase())) return null;
  const arch = String(wgpu.architecture || "").split("-").filter(Boolean).map(w => /^\w/.test(w) ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  return wgpu.description ? gpuName(wgpu.description) || wgpu.description : [v, arch].filter(Boolean).join(" ");
}


// iCloud Private Relay's exits, from Apple's published list (mask-api.icloud.com/egress-ip-ranges.csv): Cloudflare,
// Akamai and Fastly. Cloudflare's also carries WARP.
const RELAY4 = [[104, 28], [172, 224], [172, 225], [172, 226], [146, 75], [140, 248]], RELAY6 = /^(2606:54c0|2a02:26f7|2a04:4e41):/i;
export const isRelayIp = ip => { const s = String(ip || ""); if (s.includes(":")) return RELAY6.test(s); const [a, b] = s.split(".").map(Number); return RELAY4.some(([x, y]) => x === a && y === b); };

// Firefox with resistFingerprinting (Tor and Mullvad Browser too): Reykjavik's clock for every site (UTC in older
// versions), and "Mozilla" for the graphics card unless WebGL is off
export const rfpClock = (firefox, tz, gpuRaw) => !!firefox && /^(Atlantic\/Reykjavik|UTC|Etc\/UTC)$/.test(tz || "") && (gpuRaw == null || gpuRaw === "Mozilla");
