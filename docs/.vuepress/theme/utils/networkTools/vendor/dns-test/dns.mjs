// DNS messages for DoH GET (RFC 8484): build a query, encode it for ?dns=, read the answer. Shared by the page and
// scripts/verify.mjs.

const TYPES = { A: 1, TXT: 16, AAAA: 28 };

// The name with each letter's case flipped at random (DNS 0x20): resolvers treat names case-insensitively, so the
// resolver's cache is still hit, but every URL is new and no HTTP cache on the way can answer instead of the resolver.
export function mixCase(name, rnd = Math.random) {
  let s = "";
  for (const c of name) s += /[a-z]/i.test(c) && rnd() < .5 ? (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()) : c;
  return s;
}

export function randLabel(n = 12) {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789", b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map(x => abc[x % abc.length]).join("");
}

// A recursive query with EDNS (1232-byte UDP size) and the AD bit set, which asks a validating resolver to say whether
// the answer passed DNSSEC validation (RFC 6840). ID 0, as RFC 8484 recommends for GET.
export function query(name, type = "A") {
  const labels = name.replace(/\.$/, "").split(".");
  const len = 12 + labels.reduce((n, l) => n + 1 + l.length, 0) + 1 + 4 + 11;
  const b = new Uint8Array(len);
  b.set([0, 0, 0x01, 0x20, 0, 1, 0, 0, 0, 0, 0, 1]);   // ID 0, RD + AD, one question, one additional (OPT)
  let i = 12;
  for (const l of labels) {
    b[i++] = l.length;
    for (const c of l) b[i++] = c.charCodeAt(0);
  }
  b[i++] = 0;
  const t = TYPES[type];
  b.set([t >> 8, t & 255, 0, 1], i); i += 4;
  b.set([0, 0, 41, 0x04, 0xd0, 0, 0, 0, 0, 0, 0], i);   // OPT: root name, type 41, UDP size 1232, no flags, no options
  return b;
}

export function b64url(bytes) {
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The GET URL for a query to a DoH endpoint
export const dohURL = (endpoint, name, type = "A") => endpoint + (endpoint.includes("?") ? "&" : "?") + "dns=" + b64url(query(name, type));

// Read an answer: rcode, AD flag, A/AAAA addresses and TXT strings. null when it isn't a DNS response.
export function parse(buf) {
  const b = new Uint8Array(buf);
  if (b.length < 12 || !(b[2] & 0x80)) return null;
  const out = { rcode: b[3] & 15, ad: !!(b[3] & 0x20), addrs: [], txt: [] };
  const qd = b[4] << 8 | b[5], an = b[6] << 8 | b[7];
  let i = 12;
  const skipName = () => {
    while (i < b.length) {
      const l = b[i];
      if (l === 0) { i++; return; }
      if ((l & 0xc0) === 0xc0) { i += 2; return; }
      i += l + 1;
    }
  };
  for (let q = 0; q < qd; q++) { skipName(); i += 4; }
  for (let a = 0; a < an && i < b.length; a++) {
    skipName();
    const type = b[i] << 8 | b[i + 1], rdlen = b[i + 8] << 8 | b[i + 9];
    const rd = i + 10;
    if (type === 1 && rdlen === 4) out.addrs.push([...b.slice(rd, rd + 4)].join("."));
    else if (type === 28 && rdlen === 16) {
      const h = []; for (let k = 0; k < 16; k += 2) h.push((b[rd + k] << 8 | b[rd + k + 1]).toString(16));
      out.addrs.push(h.join(":"));
    } else if (type === 16) {
      let s = "", k = rd;
      while (k < rd + rdlen) { const n = b[k++]; s += String.fromCharCode(...b.slice(k, k + n)); k += n; }
      out.txt.push(s);
    }
    i = rd + rdlen;
  }
  return out;
}

export const RCODE = { NOERROR: 0, SERVFAIL: 2, NXDOMAIN: 3 };
