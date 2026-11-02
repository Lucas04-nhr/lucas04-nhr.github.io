// The CDNs the page tests, and how each one says which of its locations answered.
//
// Every CDN writes its location into the answer, but a browser may only read what the server lets it: the body and
// headers of a CORS answer that lists them in Access-Control-Expose-Headers, or the Server-Timing of an answer with
// Timing-Allow-Origin. So each CDN here is tested through a public file, on that CDN, whose answer lets the page read
// the location (chosen 2026-11, checked from Asia, the US and Europe; scripts/verify.mjs checks them again):
//
//   cloudflare  www.cloudflare.com/cdn-cgi/trace     the body: colo=HKG
//   cfchina     www.cloudflare-cn.com/cdn-cgi/trace  the same, on Cloudflare's China Network (data centers in mainland
//                                                    China run with JD Cloud; it answers from China wherever you are)
//   cloudfront  static.figma.com                     Server-Timing cdn-pop;desc="NRT57-P11" (Timing-Allow-Origin: *);
//                                                    Hugging Face's avatars (X-Amz-Cf-Pop, all headers exposed) where
//                                                    Figma's has none
//   akamai      res-1.cdn.office.net                 Akamai-Request-BC: [a=<edge IP>,…,n=JP_13_TOKYO,…]: Microsoft
//                                                    365's CDN, whose res-1 host is always Akamai
//   fastly      fastly.jsdelivr.net                  X-Served-By: cache-fra-…-FRA, cache-nrt-…-NRT (the last is the edge)
//   azure       res-2.cdn.office.net                 X-Azure-Ref: 20261102T…Z-…hC1SEL…: Azure Front Door, always
//   bunny       fonts.bunny.net                      Server: BunnyCDN-JP1-1195 (the region API's code, and a number)
//   wikimedia   upload.wikimedia.org                 X-Cache: cp5029 hit (the first digit is the data center)
//
// The others don't let a page read their location from any public file found, so they are timed only: Google (by far
// the biggest of these), and the CDNs most of China's sites use, with Gcore and CDN77.
//
// read: how to read the location ("trace": the body; "h:<header>": a header of a CORS answer; "st:<name>": a
//       Server-Timing entry's description); null: timed only, fetched no-cors
// alt:  a second file, or a list of them: for the location when the first answers without one, and in its place
//       (each in turn) when it doesn't answer
// list: the CDN publishes every location, and the page has them (data/pops.json): its own pages, one per location
// name: a brand, the same in every language, or one per language for the names that have one

export const CDNS = [
  { id: "cloudflare", name: "Cloudflare", url: "https://www.cloudflare.com/cdn-cgi/trace", read: "trace",
    // this site's own trace last: same origin, so neither an extension nor a proxy rule singles it out
    alt: [{ url: "https://speed.cloudflare.com/cdn-cgi/trace", read: "trace" }, { url: "https://ip.lucas04.top/cdn-cgi/trace", read: "trace" }], list: "cloudflare", c: "#f38020" },
  { id: "cfchina", name: { en: "Cloudflare China Network", "zh-CN": "Cloudflare 中国网络", "zh-TW": "Cloudflare 中國網路", ja: "Cloudflare 中国ネットワーク",
      ko: "Cloudflare 중국 네트워크", es: "Cloudflare China Network", fr: "Cloudflare China Network", de: "Cloudflare China Network",
      pt: "Cloudflare China Network", ru: "Cloudflare China Network" }, short: "CF China",
    url: "https://www.cloudflare-cn.com/cdn-cgi/trace", read: "trace", list: "cloudflare", c: "#e8590c" },
  { id: "cloudfront", name: "Amazon CloudFront", short: "CloudFront", url: "https://static.figma.com/app/icon/1/favicon.ico", read: "st:cdn-pop",
    alt: { url: "https://cdn-avatars.huggingface.co/v1/production/uploads/1583856921041-5dd96eb166059660ed1ee413.png", read: "h:x-amz-cf-pop" }, c: "#8c4fff" },
  { id: "akamai", name: "Akamai", url: "https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/word_16x1.svg",
    read: "h:akamai-request-bc", c: "#0096d6" },
  { id: "fastly", name: "Fastly", url: "https://fastly.jsdelivr.net/npm/jquery@3.7.1/package.json", read: "h:x-served-by", c: "#ff282d" },
  { id: "azure", name: "Azure Front Door", short: "Front Door", url: "https://res-2.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/word_16x1.svg",
    read: "h:x-azure-ref", c: "#0078d4" },
  { id: "bunny", name: "Bunny CDN", short: "Bunny", url: "https://fonts.bunny.net/css?family=inter:400", read: "h:server", list: "bunny", c: "#ff7a1a" },
  { id: "wikimedia", name: "Wikimedia", url: "https://upload.wikimedia.org/favicon.ico", read: "h:x-cache", list: "wikimedia", c: "#9a9a9a" },
  { id: "google", name: "Google", url: "https://www.gstatic.com/generate_204", read: null, c: "#4285f4" },
  { id: "alibaba", name: { en: "Alibaba Cloud", "zh-CN": "阿里云", "zh-TW": "阿里雲", ja: "Alibaba Cloud", ko: "알리바바 클라우드", es: "Alibaba Cloud",
      fr: "Alibaba Cloud", de: "Alibaba Cloud", pt: "Alibaba Cloud", ru: "Alibaba Cloud" }, url: "https://g.alicdn.com/favicon.ico", read: null, c: "#ff6a00" },
  { id: "tencent", name: { en: "Tencent EdgeOne", "zh-CN": "腾讯云 EdgeOne", "zh-TW": "騰訊雲 EdgeOne", ja: "Tencent EdgeOne", ko: "Tencent EdgeOne",
      es: "Tencent EdgeOne", fr: "Tencent EdgeOne", de: "Tencent EdgeOne", pt: "Tencent EdgeOne", ru: "Tencent EdgeOne" }, short: "EdgeOne",
    url: "https://www.tencentcloud.com/favicon.ico", read: null, c: "#0052d9" },
  { id: "wangsu", name: { en: "Wangsu (CDNetworks)", "zh-CN": "网宿", "zh-TW": "網宿", ja: "Wangsu (CDNetworks)", ko: "Wangsu (CDNetworks)",
      es: "Wangsu (CDNetworks)", fr: "Wangsu (CDNetworks)", de: "Wangsu (CDNetworks)", pt: "Wangsu (CDNetworks)", ru: "Wangsu (CDNetworks)" }, short: "Wangsu",
    url: "https://www.cdnetworks.com/favicon.ico", read: null, c: "#e60012" },
  { id: "gcore", name: "Gcore", url: "https://gcore.com/favicon.ico", read: null, c: "#ff4c00" },
  { id: "cdn77", name: "CDN77", url: "https://www.cdn77.com/favicon.ico", read: null, c: "#2bb24c" },
];
export const IDS = CDNS.map(c => c.id);
// every host the test fetches from (not this site's own), for routing rules that put them all on one route
export const HOSTS = [...new Set(CDNS.flatMap(c => [c.url, ...[].concat(c.alt || []).map(a => a.url)]).filter(u => /^https:/.test(u)).map(u => new URL(u).hostname))];
export const BY = Object.fromEntries(CDNS.map(c => [c.id, c]));
export const nameOf = (c, lang) => typeof c.name === "string" ? c.name : c.name[lang];

// The location in an answer, as each CDN writes it → its code: an IATA code (cloudflare, cloudfront, fastly, azure), a
// region code (bunny), a data center's name (wikimedia), or "CC-CITY" (akamai, which names cities, not airports)
const WMF = { 1: "eqiad", 2: "codfw", 3: "esams", 4: "ulsfo", 5: "eqsin", 6: "drmrs", 7: "magru" };
export const PARSE = {
  trace: s => (/\bcolo=([A-Z]{3})\b/.exec(s || "") || [])[1] || null,
  "cdn-pop": s => (/^([A-Z]{3})\d/.exec(s || "") || [])[1] || null,
  "x-amz-cf-pop": s => (/^([A-Z]{3})\d/.exec(s || "") || [])[1] || null,
  // the first bracket is the edge that answered (c=g); the others are its parents
  "akamai-request-bc": s => { const m = /n=([A-Z]{2})_[^_,\]]*_([A-Z]+)/.exec(s || ""); return m ? m[1] + "-" + m[2] : null; },
  "x-served-by": s => (/-([A-Z]{3})\s*$/.exec(s || "") || [])[1] || null,
  "x-azure-ref": s => (/Z-[0-9a-z]*C1([A-Z]{3})/.exec(s || "") || [])[1] || null,
  // the region code without its number: BunnyCDN-JP1-1195 → JP
  server: s => (/^BunnyCDN-([A-Z]+?)\d*-/.exec(s || "") || [])[1] || null,
  "x-cache": s => WMF[(/\bcp(\d)\d{3}/.exec(s || "") || [])[1]] || null,
};
export const parserOf = read => read === "trace" ? PARSE.trace : PARSE[read.slice(read.indexOf(":") + 1)];

// Where a code is: [city, country, lat, lon], or null. pops: data/pops.json as maps by code; places: data/places.json
export function placeOf(id, code, pops, places) {
  if (!code) return null;
  const list = BY[id] && BY[id].list, own = list && pops[list] && pops[list][code];
  if (own) return own;
  if (id === "akamai" || id === "cdn77") {
    const [cc, key] = code.split("-"), c = places && places.city[cc + ":" + key];
    if (c) return [c[2], cc, c[0], c[1]];
    // a city the airport list doesn't name (Akamai's JP_08_IBARAKI): its name as written, at the country's main
    // airport (the list puts the big ones first), so the distance is about right
    const main = places && Object.values(places.iata).find(p => p[2] === cc);
    return main && key ? [key.charAt(0) + key.slice(1).toLowerCase(), cc, main[0], main[1]] : null;
  }
  const p = places && places.iata[code];
  return p ? [p[3], p[2], p[0], p[1]] : null;
}

// data/pops.json's lists ([code, city, cc, lat, lon]) → { [list]: { [code]: [city, cc, lat, lon] } }
export const popMaps = pops => Object.fromEntries(["cloudflare", "bunny", "wikimedia"].map(k =>
  [k, Object.fromEntries((pops[k] || []).map(([code, city, cc, lat, lon]) => [code, [city, cc, lat, lon]]))]));

// What a site's own answer says about its CDN, for the site check: the location headers and Server-Timing entries of
// the CDNs that write one (only readable when the site exposes them), and the names its DNS points to.
export const SITE_HEADERS = [
  ["x-amz-cf-pop", "cloudfront"], ["akamai-request-bc", "akamai"], ["x-served-by", "fastly"], ["x-azure-ref", "azure"],
  ["server", "bunny"], ["x-cache", "wikimedia"],
];
export const SITE_TIMING = [["cdn-pop", "cloudfront"]];
// CNAME suffixes → CDN; the ones not tested above are named as they are (a brand in every language)
export const CNAMES = [
  [/\.cdn\.cloudflare\.net$|\.cdn\.cloudflare-cn\.com$/, "cloudflare"], [/\.cloudfront\.net$/, "cloudfront"],
  [/\.(akamaiedge|edgekey|edgesuite|akamai|akamaized|akamaihd|akamaitechnologies|akadns)\.net$/, "akamai"],
  [/\.(fastly|fastlylb)\.net$|\.fastly-edge\.com$/, "fastly"], [/\.(azurefd|azureedge|t-msedge|afd\.azureedge)\.net$|\.azurefd\.us$/, "azure"],
  [/\.b-cdn\.net$|\.bunnycdn\.com$/, "bunny"], [/\.wikimedia\.org$/, "wikimedia"],
  [/\.(googlehosted|googleusercontent|google|gvt1)\.com$|\.l\.google\.com$/, "google"],
  [/\.(alikunlun|kunlunaq|kunlunar|kunlunca|kunluncan|kunlungr|kunlunhuf|kunlunle|kunlunno|kunlunpi|kunlunra|kunlunsa|kunlunsc|kunlunsl|kunlunso|kunlunwe|tbcache|alicdn|aliyuncs)\.com$|\.(alikunlun|aliyun-inc)\.net$/, "alibaba"],
  [/\.(dnsv1|tdnsv\d*|cdntip|eo\.dnse\d|edgeone)\.com$|\.dsa\.dnsv1\.com$|\.eo\.dnse\d\.com$|\.qcloudcdn\.com$/, "tencent"],
  [/\.(wscdns|wsglb0|ourwebcdn|wswebcdn|chinanetcenter|lxdns|wsdvs|wscloudcdn|cdn20)\.com$|\.cdnetworks\.net$/, "wangsu"],
  [/\.gcdn\.co$|\.gcorelabs\.net$/, "gcore"], [/\.cdn77\.(org|net)$|\.rsc\.cdn77\.org$/, "cdn77"],
  [/\.vercel-dns\.com$|\.vercel\.app$/, "Vercel"], [/\.netlify(globalcdn)?\.(app|com)$/, "Netlify"],
  [/\.(cdnhwc\d|hwcdn|huaweicloud-cdn)\.(com|cn|net)$/, "Huawei Cloud"], [/\.aaplimg\.com$/, "Apple"],
  [/\.(volcgslb|bytegslb|bytedns|ttdns2)\.com$/, "Volcengine"], [/\.qiniudns\.com$|\.qiniucdn\.com$/, "Qiniu"],
  [/\.bsclink\.cn$|\.bsgslb\.cn$|\.trpcdn\.net$/, "Baishan"], [/\.ksyuncdn\.com$|\.ks-cdn\.com$/, "Kingsoft Cloud"],
  [/\.github\.io$/, "fastly"], [/\.incapdns\.net$/, "Imperva"], [/\.sucuri\.net$/, "Sucuri"], [/\.edgecastcdn\.net$/, "Edgio"],
];
// Cloudflare's addresses (cloudflare.com/ips): a site behind it has no CNAME to give it away
export const CF_V4 = ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14",
  "172.64.0.0/13", "131.0.72.0/22"];
export const CF_V6 = ["2400:cb00", "2606:4700", "2803:f800", "2405:b500", "2405:8100", "2a06:98c", "2c0f:f248"];
export function isCloudflareIP(ip) {
  if (ip.includes(":")) { const l = ip.toLowerCase(); return CF_V6.some(p => l.startsWith(p)); }
  const n = ip.split(".").reduce((a, b) => a * 256 + +b, 0);
  return CF_V4.some(r => { const [b, bits] = r.split("/"), base = b.split(".").reduce((a, x) => a * 256 + +x, 0), size = 2 ** (32 - bits); return n >= base && n < base + size; });
}
export function cdnOfName(name) {
  const n = String(name || "").toLowerCase().replace(/\.$/, "");
  for (const [re, id] of CNAMES) if (re.test(n)) return id;
  return null;
}
