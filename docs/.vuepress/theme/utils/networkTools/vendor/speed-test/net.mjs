// Which way the test goes: the exit Cloudflare sees, and signs that it isn't the visitor's own line (as the
// me2cloud tool reads them): the device's time zone in one country and the exit in another, and an exit on a
// data-center network. Pure, unit-tested.

export const DC_RE = /amazon|google|microsoft|azure|digitalocean|vultr|choopa|constant company|linode|akamai|ovh|hetzner|oracle|alibaba|aliyun|tencent|huawei|m247|datacamp|cloudflare|leaseweb|contabo|hostinger|it7|racknerd|colocrossing|psychz|zenlayer|g-core|gcore|hostwinds|scaleway|ionos|kamatera|upcloud|bandwagon|dmit|cogent|quadranet|servers\.com|packet|equinix|fastly|cdn77|datapacket|tzulo|hostdare|greencloud|nexeon|frantech|buyvm/i;

export const TZ_CC = Object.fromEntries(("Asia/Shanghai:CN Asia/Chongqing:CN Asia/Harbin:CN Asia/Urumqi:CN Asia/Hong_Kong:HK Asia/Macau:MO Asia/Taipei:TW Asia/Tokyo:JP " +
  "Asia/Seoul:KR Asia/Singapore:SG Asia/Kuala_Lumpur:MY Asia/Bangkok:TH Asia/Jakarta:ID Asia/Manila:PH Asia/Ho_Chi_Minh:VN Asia/Saigon:VN " +
  "Asia/Kolkata:IN Asia/Calcutta:IN Asia/Dubai:AE Asia/Riyadh:SA Asia/Qatar:QA Asia/Jerusalem:IL Asia/Tel_Aviv:IL Asia/Karachi:PK " +
  "Europe/London:GB Europe/Dublin:IE Europe/Paris:FR Europe/Berlin:DE Europe/Amsterdam:NL Europe/Brussels:BE Europe/Zurich:CH Europe/Rome:IT " +
  "Europe/Madrid:ES Europe/Lisbon:PT Europe/Stockholm:SE Europe/Oslo:NO Europe/Helsinki:FI Europe/Copenhagen:DK Europe/Warsaw:PL Europe/Vienna:AT " +
  "Europe/Prague:CZ Europe/Moscow:RU Europe/Istanbul:TR Europe/Kiev:UA Europe/Kyiv:UA Europe/Athens:GR Europe/Bucharest:RO Europe/Budapest:HU " +
  "Australia/Sydney:AU Australia/Melbourne:AU Australia/Brisbane:AU Australia/Perth:AU Australia/Adelaide:AU Pacific/Auckland:NZ " +
  "America/New_York:US America/Chicago:US America/Denver:US America/Los_Angeles:US America/Phoenix:US America/Anchorage:US Pacific/Honolulu:US " +
  "America/Toronto:CA America/Vancouver:CA America/Montreal:CA America/Edmonton:CA America/Mexico_City:MX America/Sao_Paulo:BR America/Santiago:CL " +
  "America/Bogota:CO America/Lima:PE America/Argentina/Buenos_Aires:AR Africa/Johannesburg:ZA Africa/Cairo:EG Africa/Lagos:NG Africa/Nairobi:KE")
  .split(" ").map(p => p.split(":")));

// Cloudflare's /meta answer (or its /cdn-cgi/trace as key=value lines) → the exit
export function fromMeta(j) {
  if (!j || !j.clientIp) return null;
  const c = j.colo || {};
  return { ip: j.clientIp, cc: j.country || "", city: j.city || "", asn: j.asn || null, org: j.asOrganization || "",
    colo: c.iata || "", coloCity: c.city || "", coloCc: c.cca2 || "", http: j.httpProtocol || "" };
}
// 1ms-shell's /_ms/me: what Cloudflare knows of this connection to the page's own host (a 404 when self-hosted)
export function fromMe(j) {
  if (!j || !j.ip) return null;
  return { ip: j.ip, cc: j.country || "", city: j.city || "", asn: j.asn || null, org: j.org || "", colo: j.colo || "", coloCity: "", coloCc: "", http: j.http || "" };
}
export function fromTrace(text) {
  const d = Object.fromEntries(String(text || "").trim().split("\n").map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
  return d.ip ? { ip: d.ip, cc: d.loc && d.loc !== "XX" ? d.loc : "", city: "", asn: null, org: "", colo: d.colo || "", coloCity: "", coloCc: "", http: d.http || "" } : null;
}

// Signs that the test doesn't measure the visitor's own line, each { k: string key, ...values }:
//   r_tz     the device's time zone is in one country, the exit in another (Hong Kong and Macau count as China's)
//   r_dc     the exit is on a data-center network
export function reasons(exit, { tz = "" } = {}) {
  const out = [];
  if (!exit) return out;
  const tzc = TZ_CC[tz];
  if (tzc && exit.cc && tzc !== exit.cc && !(tzc === "CN" && ["HK", "MO"].includes(exit.cc))) out.push({ k: "r_tz", a: tzc, b: exit.cc });
  if (exit.org && DC_RE.test(exit.org)) out.push({ k: "r_dc", org: exit.org + (exit.asn ? " (AS" + exit.asn + ")" : "") });
  return out;
}

