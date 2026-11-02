// The resolvers the page tests, and what scripts/verify.mjs checks about them.
//
//   doh    the resolver's DNS over HTTPS address: measured in the browser, for real
//   cors   it sends Access-Control-Allow-Origin, so the page can read the answers (otherwise it can only time them)
//   ip, ipCors  the same DoH service on the address plain DNS and DoT use (https://1.1.1.1/dns-query), when the doh host is
//          on other addresses; the page times it to estimate UDP and DoT
//   est    where the UDP and DoT estimates come from: "doh" (the doh host is that very server), "ip", or null (no
//          HTTPS on that server: no estimate)
//   udp, udp6, dot, doq   what to enter to use it; shown under the row
//   dnssec  validates DNSSEC (checked by scripts/verify.mjs)
//   icon    the domain whose site icon public/icons/<id>.png is (scripts/icons.mjs fetches it)
//   blocks  what it blocks by default, if anything (the unfiltered variant is listed wherever there is one)
//
// Browsers can't send UDP, DoT or DoQ queries. A warm DoH query to the same server is one round trip to the same
// anycast node plus the same resolver behind it, which is what a UDP or DoT query costs; hence the estimate.
// Rules for the list: public, free, no sign-up, unfiltered variant where there is a choice, answers DoH over GET
// (?dns=) with 200, and checked from more than one continent (scripts/verify.mjs).
export const RESOLVERS = [
  { id: "cloudflare", icon: "one.one.one.one", name: "Cloudflare", group: "global", site: "https://one.one.one.one/",
    udp: ["1.1.1.1", "1.0.0.1"], udp6: ["2606:4700:4700::1111", "2606:4700:4700::1001"], dot: "one.one.one.one",
    doh: "https://cloudflare-dns.com/dns-query", cors: true, ip: "https://1.1.1.1/dns-query", ipCors: true, est: { udp: "ip", dot: "ip" }, dnssec: true },
  { id: "google", icon: "google.com", name: "Google", group: "global", site: "https://developers.google.com/speed/public-dns",
    udp: ["8.8.8.8", "8.8.4.4"], udp6: ["2001:4860:4860::8888", "2001:4860:4860::8844"], dot: "dns.google",
    doh: "https://dns.google/dns-query", cors: true, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "quad9", icon: "quad9.net", name: "Quad9", group: "global", site: "https://quad9.net/",
    udp: ["9.9.9.9", "149.112.112.112"], udp6: ["2620:fe::fe", "2620:fe::9"], dot: "dns.quad9.net",
    doh: "https://dns.quad9.net/dns-query", cors: true, est: { udp: "doh", dot: "doh" }, dnssec: true, blocks: "malware" },
  { id: "opendns", icon: "opendns.com", name: "OpenDNS", group: "global", site: "https://www.opendns.com/",
    udp: ["208.67.222.222", "208.67.220.220"], udp6: ["2620:119:35::35", "2620:119:53::53"], dot: "dns.opendns.com",
    doh: "https://doh.opendns.com/dns-query", cors: false, ip: "https://208.67.222.222/dns-query", est: { udp: "ip", dot: "ip" }, dnssec: true, blocks: "phishing" },
  { id: "adguard", icon: "adguard-dns.io", name: "AdGuard DNS", group: "global", site: "https://adguard-dns.io/en/public-dns.html",
    udp: ["94.140.14.14", "94.140.15.15"], udp6: ["2a10:50c0::ad1:ff", "2a10:50c0::ad2:ff"], dot: "dns.adguard-dns.com", doq: "dns.adguard-dns.com",
    doh: "https://dns.adguard-dns.com/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true, blocks: "ads" },
  { id: "adguard-nf", icon: "adguard-dns.io", name: "AdGuard Unfiltered", group: "global", site: "https://adguard-dns.io/en/public-dns.html",
    udp: ["94.140.14.140", "94.140.14.141"], udp6: ["2a10:50c0::1:ff", "2a10:50c0::2:ff"], dot: "unfiltered.adguard-dns.com", doq: "unfiltered.adguard-dns.com",
    doh: "https://unfiltered.adguard-dns.com/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "nextdns", icon: "nextdns.io", name: "NextDNS", group: "global", site: "https://nextdns.io/",
    udp: ["45.90.28.0", "45.90.30.0"], udp6: ["2a07:a8c0::", "2a07:a8c1::"], dot: "dns.nextdns.io", doq: "dns.nextdns.io",
    doh: "https://dns.nextdns.io/", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "controld", icon: "controld.com", name: "Control D", group: "global", site: "https://controld.com/free-dns",
    udp: ["76.76.2.0", "76.76.10.0"], udp6: ["2606:1a40::", "2606:1a40:1::"], dot: "p0.freedns.controld.com", doq: "p0.freedns.controld.com",
    doh: "https://freedns.controld.com/p0", cors: true, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "mullvad", icon: "mullvad.net", name: "Mullvad", group: "global", site: "https://mullvad.net/en/help/dns-over-https-and-dns-over-tls",
    dot: "dns.mullvad.net", doh: "https://dns.mullvad.net/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "dnssb", icon: "dns.sb", name: "DNS.SB", group: "global", site: "https://dns.sb/",
    udp: ["185.222.222.222", "45.11.45.11"], udp6: ["2a09::", "2a11::"], dot: "dot.sb",
    doh: "https://doh.dns.sb/dns-query", cors: true, ip: "https://185.222.222.222/dns-query", ipCors: true, est: { udp: "ip", dot: "ip" }, dnssec: true },
  { id: "he", icon: "he.net", name: "Hurricane Electric", group: "global", site: "https://dns.he.net/",
    udp: ["74.82.42.42"], udp6: ["2001:470:20::2"], dot: "ordns.he.net",
    doh: "https://ordns.he.net/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "wikimedia", icon: "wikimedia.org", name: "Wikimedia DNS", group: "global", site: "https://meta.wikimedia.org/wiki/Wikimedia_DNS",
    dot: "wikimedia-dns.org", doh: "https://wikimedia-dns.org/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
{ id: "cleanbrowsing", icon: "cleanbrowsing.org", name: "CleanBrowsing", group: "global", site: "https://cleanbrowsing.org/filters/",
    udp: ["185.228.168.9", "185.228.169.9"], udp6: ["2a0d:2a00:1::2", "2a0d:2a00:2::2"], dot: "security-filter-dns.cleanbrowsing.org",
    doh: "https://doh.cleanbrowsing.org/doh/security-filter/", cors: true, est: { udp: null, dot: null }, dnssec: false, blocks: "malware" },
  { id: "rethink", icon: "rethinkdns.com", name: "Rethink DNS", group: "global", site: "https://rethinkdns.com/",
    dot: "max.rethinkdns.com", doh: "https://sky.rethinkdns.com/dns-query", cors: true, est: { udp: null, dot: null }, dnssec: true },
  { id: "alidns", icon: "alidns.com", name: "AliDNS", group: "cn", site: "https://www.alidns.com/",
    udp: ["223.5.5.5", "223.6.6.6"], udp6: ["2400:3200::1", "2400:3200:baba::1"], dot: "dns.alidns.com", doq: "dns.alidns.com",
    doh: "https://dns.alidns.com/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: false },
  { id: "dnspod", icon: "dnspod.cn", name: "DNSPod", group: "cn", site: "https://www.dnspod.cn/products/publicdns",
    udp: ["119.29.29.29"], udp6: ["2402:4e00::"], dot: "dot.pub",
    doh: "https://doh.pub/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: false },
  { id: "360", icon: "360.cn", name: "360 DNS", group: "cn", site: "https://sdns.360.net/",
    udp: ["101.226.4.6", "218.30.118.6"], dot: "dot.360.cn",
    doh: "https://doh.360.cn/dns-query", cors: false, ip: "https://101.226.4.6/dns-query", est: { udp: "ip", dot: "doh" }, dnssec: false },
  { id: "yandex", icon: "yandex.com", name: "Yandex DNS", group: "region", cc: "RU", site: "https://dns.yandex.com/",
    udp: ["77.88.8.8", "77.88.8.1"], udp6: ["2a02:6b8::feed:0ff", "2a02:6b8:0:1::feed:0ff"], dot: "common.dot.dns.yandex.net",
    doh: "https://common.dot.dns.yandex.net/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: false },
  { id: "dns4eu", icon: "joindns4.eu", name: "DNS4EU", group: "region", cc: "EU", site: "https://www.joindns4.eu/",
    udp: ["86.54.11.100", "86.54.11.200"], udp6: ["2a13:1001::86:54:11:100", "2a13:1001::86:54:11:200"], dot: "unfiltered.joindns4.eu",
    doh: "https://unfiltered.joindns4.eu/dns-query", cors: true, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "cira", icon: "cira.ca", name: "CIRA Canadian Shield", short: "CIRA", group: "region", cc: "CA", site: "https://www.cira.ca/en/canadian-shield/",
    udp: ["149.112.121.10", "149.112.122.10"], udp6: ["2620:10a:80bb::10", "2620:10a:80bc::10"], dot: "private.canadianshield.cira.ca",
    doh: "https://private.canadianshield.cira.ca/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true },
{ id: "cznic", icon: "nic.cz", name: "CZ.NIC ODVR", group: "region", cc: "CZ", site: "https://www.nic.cz/odvr/",
    udp: ["193.17.47.1", "185.43.135.1"], udp6: ["2001:148f:ffff::1", "2001:148f:fffe::1"], dot: "odvr.nic.cz",
    doh: "https://odvr.nic.cz/doh", cors: true, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "switch", icon: "switch.ch", name: "SWITCH", group: "region", cc: "CH", site: "https://www.switch.ch/en/security/info/public-dns",
    dot: "dns.switch.ch", doh: "https://dns.switch.ch/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "digiges", icon: "www.digitale-gesellschaft.ch", name: "Digitale Gesellschaft", group: "region", cc: "CH", site: "https://www.digitale-gesellschaft.ch/dns/",
    dot: "dns.digitale-gesellschaft.ch", doh: "https://dns.digitale-gesellschaft.ch/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "dnsforge", icon: "dnsforge.de", name: "DNSForge", group: "region", cc: "DE", site: "https://dnsforge.de/",
    udp: ["176.9.93.198", "176.9.1.117"], udp6: ["2a01:4f8:151:34aa::198", "2a01:4f8:141:316d::117"], dot: "dnsforge.de",
    doh: "https://dnsforge.de/dns-query", cors: true, est: { udp: null, dot: "doh" }, dnssec: true, blocks: "ads" },
  { id: "uncensored", icon: "uncensoreddns.org", name: "UncensoredDNS", group: "region", cc: "DK", site: "https://blog.uncensoreddns.org/",
    udp: ["91.239.100.100", "89.233.43.71"], udp6: ["2001:67c:28a4::", "2a01:3a0:53:53::"], dot: "anycast.uncensoreddns.org",
    doh: "https://anycast.uncensoreddns.org/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "appliedprivacy", icon: "applied-privacy.net", name: "Applied Privacy", group: "region", cc: "AT", site: "https://applied-privacy.net/services/dns/",
    dot: "dot1.applied-privacy.net", doh: "https://doh.applied-privacy.net/query", cors: false, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "njalla", icon: "njal.la", name: "Njalla", group: "region", cc: "SE", site: "https://dns.njal.la/",
    udp: ["95.215.19.53"], udp6: ["2001:67c:2354:2::53"], dot: "dns.njal.la",
    doh: "https://dns.njal.la/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "dns4all", icon: "dns4all.eu", name: "DNS4ALL", group: "region", cc: "NL", site: "https://dns4all.eu/",
    udp: ["194.0.5.3"], udp6: ["2001:678:8::3"], dot: "dot.dns4all.eu",
    doh: "https://doh.dns4all.eu/dns-query", cors: false, est: { udp: "doh", dot: "doh" }, dnssec: true },
  { id: "libredns", icon: "libredns.gr", name: "LibreDNS", group: "region", cc: "GR", site: "https://libredns.gr/",
    dot: "dot.libredns.gr", doh: "https://doh.libredns.gr/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: false },
  { id: "comss", icon: "comss.ru", name: "Comss.one DNS", group: "region", cc: "RU", site: "https://www.comss.ru/page.php?id=7315",
    dot: "dns.comss.one", doh: "https://dns.comss.one/dns-query", cors: false, est: { udp: null, dot: "doh" }, dnssec: false, blocks: "ads" },
  { id: "xfinity", icon: "xfinity.com", name: "Xfinity", group: "region", cc: "US", site: "https://www.xfinity.com/support/articles/dns-over-https",
    doh: "https://doh.xfinity.com/dns-query", cors: false, est: { udp: null, dot: null }, dnssec: true },
  { id: "tiarap", icon: "tiar.app", name: "Tiarap", group: "region", cc: "SG", site: "https://tiar.app/",
    udp: ["174.138.21.128"], dot: "dot.tiar.app", doh: "https://doh.tiar.app/dns-query", cors: true, est: { udp: null, dot: "doh" }, dnssec: true },
  { id: "iij", icon: "iij.ad.jp", name: "IIJ Public DNS", short: "IIJ", group: "region", cc: "JP", site: "https://public.dns.iij.jp/",
    dot: "public.dns.iij.jp", doh: "https://public.dns.iij.jp/dns-query", cors: true, est: { udp: null, dot: "doh" }, dnssec: true },
];

// Not in the list: 114DNS (114.114.114.114), Baidu DNS (180.76.76.76) and CNNIC SDNS (1.2.4.8) offer plain DNS only and
// answer no HTTPS at all, so a browser can't reach them; the help says so.

// Popular names, cached at any busy resolver. The page picks three per run, the same for every resolver.
export const NAMES = ["www.apple.com", "www.microsoft.com", "www.amazon.com", "www.bing.com", "www.cloudflare.com", "www.icloud.com", "www.baidu.com", "www.qq.com"];
// A random name under this zone exists nowhere: never cached, so the resolver has to ask the zone's authoritative
// servers (Cloudflare's, near everywhere but mainland China). Always NXDOMAIN.
export const NXZONE = "nx.dns.lucas04.top";
// The checks scripts/verify.mjs runs
export const CHECKS = { dnssecBad: "dnssec-failed.org", dnssecGood: "cloudflare.com", ecs: "o-o.myaddr.l.google.com" };
