import { TRACE_URL, ME_URL, WHOAMI_URL, countryName } from "./shared";
import {
  SYS_FONT_LIST,
  browser,
  device,
  discreteGpu,
  gpuName,
  gpuOS,
  isSoftGpu,
  kbdLayout,
  offTxt,
  physicalScreen,
  rfpClock,
  sysLangs,
} from "./vendor/who-are-you/infer.mjs";

export interface SnifferRow {
  id: string;
  label: string;
  method: string;
  value: string;
  sensitive: boolean;
}

export interface SnifferGroup {
  id: string;
  title: string;
  rows: SnifferRow[];
}

export interface WhoamiAnswer {
  ip: string;
  v: number;
  cf: Record<string, any>;
  h: Record<string, string>;
  ptr: string | null;
  at: number;
}

// 采集结果：每项检测的原始读数，供伪装检查和摘要使用。
export interface Readings {
  server?: WhoamiAnswer | null;
  langs?: string[];
  tz?: string;
  tzOff?: number | null;
  kbd?: string | null;
  voices?: string[];
  dev?: { os: string | null; osv: string; kind: string; model: string };
  hints?: Record<string, any>;
  browserInfo?: { name: string | null; v: string };
  gpuRaw?: string | null;
  gpu?: string | null;
  gpuHi?: string | null;
  webgpu?: Record<string, string | undefined>;
  dark?: boolean;
  webdriver?: boolean;
  adblock?: boolean;
  fonts?: string[];
  sysFonts?: string[];
  rand?: boolean;
  noise?: boolean;
  fingerprint?: string;
  rtc?: string[] | false;
  exits?: Record<string, string | null>;
  stack?: string[];
  dnsCC?: string | null;
  dnsOrg?: string;
  trace?: Record<string, string>;
  http?: string[];
  rttBrowser?: number | null;
}

type Emit = (id: string, value: string) => void;

const NA = "this browser doesn't say";
const NONE = "none";
const FAILED = "couldn't read";
const FONTS = [
  "Segoe UI", "Calibri", "Cambria", "Consolas", "Microsoft YaHei", "SimSun", "Microsoft JhengHei", "Yu Gothic", "Meiryo", "MS Gothic",
  "Malgun Gothic", "Leelawadee UI", "Nirmala UI", "Helvetica Neue", "PingFang SC", "PingFang TC", "Hiragino Sans", "Apple SD Gothic Neo", "Menlo",
  "Avenir", "Songti SC", "Ubuntu", "DejaVu Sans", "Liberation Sans", "Noto Sans CJK SC", "WenQuanYi Micro Hei", "Cantarell", "Roboto", "Noto Color Emoji",
  "Aptos", "Myriad Pro", "Minion Pro", "Source Han Sans", "Adobe Clean", "JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", "Hack", "Inconsolata",
  "Comic Sans MS", "Arial", "Times New Roman", "Courier New", "Verdana", "Georgia",
];

export const SNIFFER_GROUPS: [string, string, [string, string, string, boolean?][]][] = [
  ["net", "What the Server Sees", [
    ["ip", "IP address", "CF-Connecting-IP", true],
    ["geo", "Location", "request.cf.city", true],
    ["coords", "Coordinates", "request.cf.latitude", true],
    ["isp", "Network (ASN)", "request.cf.asOrganization"],
    ["dns", "DNS resolver", "edns.ip-api.com", true],
    ["tzip", "Time zone of the IP", "request.cf.timezone"],
    ["ptr", "Reverse DNS", "DNS PTR", true],
    ["edge", "Nearest data center", "request.cf.colo"],
    ["proto", "HTTP and TLS", "request.cf.tlsVersion"],
    ["kex", "Key exchange", "/cdn-cgi/trace · kex, sni"],
    ["warp", "Cloudflare WARP", "/cdn-cgi/trace · warp"],
    ["tlsfp", "TLS fingerprint", "TLS ClientHello"],
    ["clock", "Your clock", "Date.now()"],
    ["webrtc", "WebRTC addresses", "RTCPeerConnection · STUN", true],
    ["lan", "Local address", "WebRTC host candidate"],
  ]],
  ["exit", "Exits", [
    ["ex_cn", "Site in mainland China", "myip.ipip.net", true],
    ["ex_intl", "IP service abroad", "api.ip.sb", true],
    ["ex_gpt", "ChatGPT", "chatgpt.com/cdn-cgi/trace", true],
    ["ex_claude", "Claude", "claude.ai/cdn-cgi/trace", true],
    ["ex_cf", "Cloudflare", "www.cloudflare.com/cdn-cgi/trace", true],
    ["stack", "IPv4 and IPv6", "Cloudflare Radar · IPv4 / IPv6", true],
  ]],
  ["hdr", "Request Headers", [
    ["h_ua", "User agent", "User-Agent"],
    ["h_lang", "Languages", "Accept-Language"],
    ["h_chua", "Browser brands", "Sec-CH-UA"],
    ["h_plat", "Platform", "Sec-CH-UA-Platform"],
    ["h_enc", "Compression", "Accept-Encoding"],
    ["h_dnt", "Do Not Track", "DNT · Sec-GPC"],
    ["h_ref", "Came from", "Referer · document.referrer"],
  ]],
  ["loc", "Language and Region", [
    ["langs", "Browser languages", "navigator.languages"],
    ["locale", "Locale", "Intl.DateTimeFormat"],
    ["tz", "System time zone", "Intl …timeZone"],
    ["hour", "Clock format", "Intl …hourCycle"],
    ["week", "Week starts", "Intl.Locale weekInfo"],
    ["fmt", "Number and date format", "Intl.NumberFormat"],
    ["kbd", "Keyboard layout", "navigator.keyboard"],
    ["voices", "Speech voices", "speechSynthesis"],
  ]],
  ["dev", "Device", [
    ["os", "Operating system", "userAgentData"],
    ["browser", "Browser", "userAgentData.brands"],
    ["arch", "CPU architecture", "…architecture · bitness"],
    ["screen", "Screen", "screen · devicePixelRatio"],
    ["hz", "Refresh rate", "requestAnimationFrame"],
    ["screens", "Screens", "screen.isExtended · screenX"],
    ["win", "Window", "innerWidth · availHeight"],
    ["gpu", "Graphics card", "WebGL RENDERER"],
    ["webgpu", "WebGPU", "navigator.gpu adapter.info"],
    ["glx", "WebGL capabilities", "WebGL2 · MAX_TEXTURE_SIZE"],
    ["cpu", "CPU cores", "hardwareConcurrency"],
    ["mem", "Memory", "navigator.deviceMemory"],
    ["touch", "Touch and pointer", "maxTouchPoints · pointer"],
    ["battery", "Battery", "navigator.getBattery"],
    ["conn", "Connection", "navigator.connection"],
    ["media", "Cameras and mics", "enumerateDevices"],
    ["audiohw", "Audio hardware", "AudioContext.sampleRate"],
    ["bio", "Biometrics", "PublicKeyCredential"],
    ["bt", "Bluetooth", "bluetooth.getAvailability"],
    ["codecs", "Video codecs", "MediaSource.isTypeSupported"],
    ["drm", "DRM", "requestMediaKeySystemAccess"],
    ["storage", "Storage quota", "storage.estimate"],
  ]],
  ["brw", "Browser Settings", [
    ["scheme", "Color scheme", "prefers-color-scheme"],
    ["motion", "Animations", "prefers-reduced-motion"],
    ["gamut", "Display colors", "color-gamut · dynamic-range"],
    ["a11y", "Accessibility", "prefers-contrast · forced-colors"],
    ["display", "Opened as", "display-mode"],
    ["dnt", "Privacy signals", "doNotTrack · GPC"],
    ["cookies", "Cookies", "navigator.cookieEnabled"],
    ["perms", "Permissions", "permissions.query"],
    ["pdf", "PDF viewer", "pdfViewerEnabled"],
    ["webdriver", "Automation", "navigator.webdriver"],
    ["adblock", "Ad blocker", "bait element"],
    ["ext", "Extensions", "window.ethereum · DOM marks"],
    ["history", "Tab history", "history.length"],
    ["fonts", "Installed fonts", "canvas measureText"],
  ]],
  ["fp", "Fingerprints", [
    ["engine", "JS engine", "Error.message"],
    ["canvas", "Canvas", "canvas.toDataURL"],
    ["webgl", "WebGL", "WebGL getParameter"],
    ["audio", "Audio", "OfflineAudioContext"],
    ["fontfp", "Font list", "fonts → SHA-256"],
    ["fpid", "Combined fingerprint", "SHA-256"],
    ["rand", "Fingerprint protection", "canvas × 2"],
  ]],
];

const within = <T,>(promise: Promise<T>, ms: number, fallback: T) =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), ms)),
  ]);

const mq = (query: string) => matchMedia(query).matches;

const getJson = (url: string, ms = 5000) =>
  fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(ms) }).then(
    (response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))),
  );

const getText = (url: string, ms = 5000) =>
  fetch(url, { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(ms) }).then(
    (response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))),
  );

const parseKeyValues = (text: string) =>
  Object.fromEntries(
    text
      .split("\n")
      .map((line) => line.split("="))
      .filter((pair) => pair.length === 2),
  ) as Record<string, string>;

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const shortHash = (hash: string) => `${hash.slice(0, 8)}·${hash.slice(8, 16)}`;

export const tzOffset = (timeZone: string): number | null => {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(new Date())
      .find((item) => item.type === "timeZoneName")?.value ?? "";
    const match = part.match(/GMT([+-−])(\d{2}):?(\d{2})?/);
    if (!match) return 0;
    return (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  } catch {
    return null;
  }
};

const readServer = async (R: Readings, emit: Emit) => {
  const ids = ["ip", "geo", "coords", "isp", "tzip", "ptr", "edge", "proto", "tlsfp", "clock", "h_ua", "h_lang", "h_chua", "h_plat", "h_enc", "h_dnt"];
  let answer: WhoamiAnswer;
  let sentAt = 0;
  let receivedAt = 0;

  try {
    sentAt = Date.now();
    answer = await getJson(WHOAMI_URL, 8000);
    receivedAt = Date.now();
  } catch {
    ids.forEach((id) => emit(id, FAILED));
    R.server = null;
    return;
  }

  const cf = answer.cf ?? {};
  const headers = answer.h ?? {};
  R.server = answer;

  emit("ip", `${answer.ip} · IPv${answer.v}`);
  emit("geo", cf.country ? [cf.city, cf.region, countryName(cf.country)].filter(Boolean).join(", ") : NONE);
  emit("coords", cf.latitude != null
    ? [`${Number(cf.latitude).toFixed(2)}, ${Number(cf.longitude).toFixed(2)}`, cf.postalCode].filter(Boolean).join(" · ")
    : NONE);
  emit("isp", cf.asn ? `AS${cf.asn} · ${cf.asOrganization ?? ""}` : NONE);
  emit("tzip", cf.timezone ? `${cf.timezone} · UTC${offTxt(tzOffset(cf.timezone) ?? 0)}` : NONE);
  emit("ptr", answer.ptr ?? NONE);
  emit("edge", cf.colo ? `${cf.colo}${cf.clientTcpRtt ? ` · RTT ${cf.clientTcpRtt} ms` : ""}` : NONE);
  emit("proto", [cf.httpProtocol, cf.tlsVersion, cf.tlsCipher].filter(Boolean).join(" · ") || NONE);
  emit("tlsfp", cf.tlsClientExtensionsSha1
    ? `${(await sha256(cf.tlsClientExtensionsSha1)).slice(0, 12)}${cf.tlsClientHelloLength ? ` · ${cf.tlsClientHelloLength} B` : ""}`
    : NONE);

  const skew = (sentAt + receivedAt) / 2 - answer.at;
  const seconds = Math.abs(skew) / 1000;
  const rounded = seconds < 10 ? seconds.toFixed(1) : Math.round(seconds);
  emit("clock", seconds < 1
    ? `on time (${Math.round(Math.abs(skew))} ms off)`
    : `${rounded} s ${skew > 0 ? "fast" : "slow"}`);

  const header = (id: string, value?: string) => emit(id, value || "not sent");
  header("h_ua", headers["user-agent"]);
  header("h_lang", headers["accept-language"]);
  header("h_chua", headers["sec-ch-ua"]);
  header("h_plat", [headers["sec-ch-ua-platform"], headers["sec-ch-ua-mobile"] === "?1" ? "mobile" : ""].filter(Boolean).join(" · "));
  header("h_enc", headers["accept-encoding"]);
  header("h_dnt", [
    headers.dnt != null ? `DNT: ${headers.dnt}` : "",
    headers["sec-gpc"] != null ? `Sec-GPC: ${headers["sec-gpc"]}` : "",
  ].filter(Boolean).join(" · "));
};

const readLocale = (R: Readings, emit: Emit) => {
  const langs = navigator.languages?.length
    ? [...navigator.languages]
    : [navigator.language].filter(Boolean);
  const options = Intl.DateTimeFormat().resolvedOptions();

  R.langs = langs;
  R.tz = options.timeZone;
  R.tzOff = tzOffset(options.timeZone);

  emit("langs", langs.join(", ") || NONE);
  emit("locale", [options.locale, options.calendar, options.numberingSystem].filter(Boolean).join(" · "));
  emit("tz", `${R.tz} · UTC${offTxt(R.tzOff ?? 0)}`);

  const cycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
  const clockKind = cycle === "h11" || cycle === "h12" ? "12-hour" : "24-hour";
  emit("hour", `${clockKind} · ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())}`);

  try {
    const locale = new Intl.Locale(langs[0] ?? options.locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const week = locale.getWeekInfo ? locale.getWeekInfo() : locale.weekInfo;
    emit("week", week
      ? `on ${new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(2024, 0, week.firstDay))}`
      : NA);
  } catch {
    emit("week", NA);
  }

  emit("fmt", `${new Intl.NumberFormat().format(1234567.89)} · ${new Intl.DateTimeFormat().format(new Date())}`);
};

const readKeyboard = async (R: Readings, emit: Emit) => {
  const keyboard = (navigator as any).keyboard;
  if (!keyboard?.getLayoutMap) return emit("kbd", NA);

  R.kbd = kbdLayout(await within(keyboard.getLayoutMap(), 1500, null));
  emit("kbd", R.kbd ?? NA);
};

const readVoices = async (R: Readings, emit: Emit) => {
  if (!window.speechSynthesis) return emit("voices", NA);

  let voices = speechSynthesis.getVoices();
  if (!voices.length) {
    voices = await within(
      new Promise<SpeechSynthesisVoice[]>((resolve) => {
        speechSynthesis.addEventListener("voiceschanged", () => resolve(speechSynthesis.getVoices()), { once: true });
      }),
      1500,
      [],
    );
  }
  if (!voices.length) return emit("voices", NONE);

  R.voices = voices.filter((voice) => voice.localService).map((voice) => voice.lang ?? "");
  const langs = [...new Set(voices.map((voice) => (voice.lang ?? "").split(/[-_]/)[0]).filter(Boolean))];
  emit("voices", `${voices.length}: ${langs.slice(0, 6).join(", ")}${langs.length > 6 ? "…" : ""}`);
};

const readHardware = async (R: Readings, emit: Emit) => {
  const nav = navigator as any;
  const clientHints = nav.userAgentData;
  let hints: Record<string, any> = {};

  if (clientHints) {
    hints = { platform: clientHints.platform, mobile: clientHints.mobile, brands: clientHints.brands };
    Object.assign(hints, await within(
      clientHints.getHighEntropyValues(["platformVersion", "architecture", "bitness", "model", "fullVersionList"]),
      1500,
      {},
    ));
  }

  R.hints = hints;
  R.dev = device(nav.userAgent, hints, nav.maxTouchPoints ?? 0);
  R.browserInfo = browser(nav.userAgent, hints.fullVersionList ?? hints.brands ?? []);

  emit("os", [R.dev?.os, R.dev?.osv].filter(Boolean).join(" ") || nav.platform || NA);
  emit("browser", [R.browserInfo?.name, R.browserInfo?.v].filter(Boolean).join(" ") || NA);
  if (hints.architecture) {
    emit("arch", `${hints.architecture} · ${hints.bitness ?? "?"}-bit${R.dev?.model ? ` · ${R.dev.model}` : ""}`);
  } else {
    emit("arch", nav.platform || NA);
  }

  const ratio = devicePixelRatio || 1;
  if (screen.width) {
    const [width, height] = physicalScreen(screen.width, screen.height, ratio);
    emit("screen", `${width}×${height} · ${Math.round(ratio * 100) / 100}× · ${screen.colorDepth}-bit color`);
  } else {
    emit("screen", NA);
  }

  emit("cpu", nav.hardwareConcurrency ? `${nav.hardwareConcurrency} threads` : NA);
  emit("mem", nav.deviceMemory ? `≥ ${nav.deviceMemory} GB` : NA);
  emit("touch", `${nav.maxTouchPoints ?? 0} touch points · ${mq("(pointer: coarse)") ? "finger" : "mouse or trackpad"}`);

  const connection = nav.connection;
  emit("conn", connection && (connection.effectiveType || connection.type)
    ? [connection.type, connection.effectiveType, connection.rtt != null ? `${connection.rtt} ms` : "", connection.downlink ? `${connection.downlink} Mbps` : "", connection.saveData ? "save-data" : ""].filter(Boolean).join(" · ")
    : NA);
};

const readGpu = (R: Readings, emit: Emit): string | null => {
  const canvas = document.createElement("canvas");
  const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

  if (!gl) {
    R.gpuRaw = null;
    ["gpu", "webgl", "glx"].forEach((id) => emit(id, NA));
    return null;
  }

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer: string = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const vendor: string = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  const software = isSoftGpu(renderer);

  R.gpuRaw = renderer;
  R.gpu = software ? null : gpuName(renderer);

  try {
    const highPower = document.createElement("canvas").getContext("webgl", { powerPreference: "high-performance" });
    const highDebug = highPower?.getExtension("WEBGL_debug_renderer_info");
    R.gpuHi = highDebug ? gpuName(highPower?.getParameter(highDebug.UNMASKED_RENDERER_WEBGL)) : null;
  } catch {
    R.gpuHi = null;
  }

  const discrete = discreteGpu(R.gpu, R.gpuHi, null);
  let label = R.gpu ?? renderer ?? NONE;
  if (software) label = `${renderer} · software-rendered`;
  else if (renderer === "Mozilla") label = "Mozilla · hidden by Firefox's resistFingerprinting";
  else if (discrete) label = `${label} · discrete ${discrete}`;
  emit("gpu", label);

  const hasWebgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
  const extensions = gl.getSupportedExtensions() ?? [];
  emit("glx", `${hasWebgl2 ? "WebGL 2" : "WebGL 1"} · max texture ${gl.getParameter(gl.MAX_TEXTURE_SIZE)} · ${extensions.length} extensions`);

  const parameters = ["MAX_TEXTURE_SIZE", "MAX_RENDERBUFFER_SIZE", "MAX_VIEWPORT_DIMS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_FRAGMENT_UNIFORM_VECTORS",
    "MAX_VARYING_VECTORS", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "SHADING_LANGUAGE_VERSION", "VERSION"] as const;
  return [vendor, renderer, ...parameters.map((name) => String(gl.getParameter(gl[name]))), extensions.join(",")].join("|");
};

const readAudioHardware = async (emit: Emit) => {
  const Context = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Context) return emit("audiohw", NA);

  const context = new Context();
  emit("audiohw", `${Number((context.sampleRate / 1000).toFixed(1))} kHz · ${context.destination.maxChannelCount} channels`);
  await context.close().catch(() => undefined);
};

const readYesNo = async (id: string, check: Promise<boolean> | undefined, emit: Emit) => {
  if (!check) return emit(id, NA);
  const answer = await within<boolean | null>(check, 1500, null);
  emit(id, answer === null ? NA : answer ? "yes" : "no");
};

const readEngine = (emit: Emit) => {
  let message = "";
  try {
    (JSON.parse("null") as any).x;
  } catch (err) {
    message = String((err as Error).message);
  }

  if (/Cannot read prop/.test(message)) emit("engine", "V8 · Chromium");
  else if (/is null|has no properties/.test(message)) emit("engine", "SpiderMonkey · Firefox");
  else if (/not an object/.test(message)) emit("engine", "JavaScriptCore · WebKit");
  else emit("engine", "unknown");
};

const readBattery = async (emit: Emit) => {
  const getBattery = (navigator as any).getBattery;
  if (!getBattery) return emit("battery", NA);

  const battery = await within<any>(getBattery.call(navigator), 1500, null);
  if (!battery) return emit("battery", NA);
  if (battery.level === 1 && battery.charging && battery.chargingTime === 0) {
    return emit("battery", "none, on mains power (a desktop?)");
  }
  emit("battery", `${Math.round(battery.level * 100)}%, ${battery.charging ? "charging" : "not charging"}`);
};

const readMedia = async (emit: Emit) => {
  if (!navigator.mediaDevices?.enumerateDevices) return emit("media", NA);

  const devices = await within<MediaDeviceInfo[] | null>(navigator.mediaDevices.enumerateDevices(), 1500, null);
  if (!devices) return emit("media", NA);

  const count = (kind: MediaDeviceKind) => devices.filter((item) => item.kind === kind).length;
  emit("media", `${count("videoinput")} camera · ${count("audioinput")} mic · ${count("audiooutput")} speaker`);
};

const readStorage = async (emit: Emit) => {
  if (!navigator.storage?.estimate) return emit("storage", NA);

  const estimate = await within<StorageEstimate | null>(navigator.storage.estimate(), 1500, null);
  if (!estimate?.quota) return emit("storage", NA);
  emit("storage", `${estimate.quota >= 1e9 ? `${Math.round(estimate.quota / 1e9)} GB` : `${Math.round(estimate.quota / 1e6)} MB`} for this site`);
};

const readPreferences = (R: Readings, emit: Emit) => {
  const nav = navigator as any;
  const onOff = (value: unknown) => (value ? "on" : "off");
  const a11y = [
    ["(prefers-contrast: more)", "High contrast"],
    ["(forced-colors: active)", "Forced colors"],
    ["(prefers-reduced-transparency: reduce)", "Reduced transparency"],
    ["(inverted-colors: inverted)", "Inverted colors"],
  ].filter(([query]) => mq(query)).map(([, label]) => label);
  const displayMode = ["fullscreen", "standalone", "minimal-ui"].find((mode) => mq(`(display-mode: ${mode})`));
  const gamut = mq("(color-gamut: rec2020)") ? "Rec.2020" : mq("(color-gamut: p3)") ? "Display P3" : mq("(color-gamut: srgb)") ? "sRGB" : "unknown";

  R.dark = mq("(prefers-color-scheme: dark)");
  R.webdriver = Boolean(nav.webdriver);

  emit("scheme", [R.dark ? "dark" : "light", mq("(prefers-contrast: more)") ? "more contrast" : "", mq("(forced-colors: active)") ? "forced-colors" : ""].filter(Boolean).join(" · "));
  emit("motion", mq("(prefers-reduced-motion: reduce)") ? "reduced" : "no preference");
  emit("gamut", `${gamut} · ${mq("(dynamic-range: high)") ? "HDR" : "SDR"}`);
  emit("dnt", `DNT ${onOff(nav.doNotTrack === "1" || (window as any).doNotTrack === "1")} · GPC ${onOff(nav.globalPrivacyControl)}`);
  emit("cookies", onOff(nav.cookieEnabled));
  emit("pdf", nav.pdfViewerEnabled == null ? NA : nav.pdfViewerEnabled ? "yes" : "no");
  emit("webdriver", R.webdriver ? "yes: a script drives this browser" : "no");
  emit("win", `${innerWidth}×${innerHeight} · system bar ${Math.max(0, screen.height - screen.availHeight)} px`);
  emit("a11y", a11y.length ? a11y.join(", ") : "Nothing special");
  emit("display", displayMode === "fullscreen" ? "Full screen" : displayMode ? "Installed app" : "Browser tab");
  emit("h_ref", document.referrer || "not sent");
  emit("history", `${history.length} pages in this tab`);
  emit("screens", `${(screen as any).isExtended == null ? NA : (screen as any).isExtended ? "more than one" : "one"} · window at ${screenX}, ${screenY}`);
};

const readAdblock = async (R: Readings, bait: HTMLElement | null, emit: Emit) => {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const style = bait && getComputedStyle(bait);
  R.adblock = !bait || bait.offsetHeight === 0 || style?.display === "none" || style?.visibility === "hidden";
  emit("adblock", R.adblock ? "on: the bait was hidden" : "none detected");
};

const readFonts = (R: Readings, emit: Emit) => {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) {
    R.fonts = [];
    return emit("fonts", NA);
  }

  const sample = "mmmmmmmmmlli你是谁あア한1WO@";
  const bases = ["monospace", "sans-serif", "serif"];
  const widthOf = (font: string) => {
    context.font = `72px ${font}`;
    return context.measureText(sample).width;
  };
  const baseWidths = bases.map(widthOf);
  const isInstalled = (font: string) =>
    bases.some((base, index) => widthOf(`"${font}", ${base}`) !== baseWidths[index]);

  R.fonts = FONTS.filter(isInstalled);
  R.sysFonts = (SYS_FONT_LIST as string[]).filter(isInstalled);
  emit("fonts", `${R.fonts.length} of ${FONTS.length}: ${R.fonts.join(", ")}`);
};

const drawCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 60;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 280, 0);
  gradient.addColorStop(0, "#f60");
  gradient.addColorStop(1, "#06c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 280, 60);
  context.textBaseline = "top";
  context.font = "18px Arial";
  context.fillStyle = "#069";
  context.fillText("Who are you? 你是谁 😃 1ms", 4, 8);
  context.font = "bold 15px serif";
  context.fillStyle = "rgba(255,255,255,.7)";
  context.fillText("Cwm fjordbank glyphs vext quiz", 6, 32);
  context.beginPath();
  context.arc(250, 30, 18, 0, Math.PI * 2);
  context.strokeStyle = "#fc0";
  context.lineWidth = 3;
  context.stroke();
  return canvas.toDataURL();
};

const renderAudio = async () => {
  const Context = window.OfflineAudioContext ?? (window as any).webkitOfflineAudioContext;
  if (!Context) return null;

  const context = new Context(1, 5000, 44100);
  const oscillator = context.createOscillator();
  const compressor = context.createDynamicsCompressor();

  oscillator.type = "triangle";
  oscillator.frequency.value = 10000;
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;
  oscillator.connect(compressor);
  compressor.connect(context.destination);
  oscillator.start(0);

  const buffer = await within<AudioBuffer | null>(context.startRendering(), 2000, null);
  if (!buffer) return null;

  const samples = buffer.getChannelData(0);
  let sum = 0;
  for (let index = 4500; index < 5000; index += 1) sum += Math.abs(samples[index]);
  return sum.toString();
};

const readFingerprints = async (R: Readings, webglInfo: string | null, emit: Emit) => {
  const first = drawCanvas();
  const second = drawCanvas();
  const canvasHash = first ? await sha256(first) : null;
  const webglHash = webglInfo ? await sha256(webglInfo) : null;
  const audioValue = await renderAudio().catch(() => null);
  const audioHash = audioValue ? await sha256(audioValue) : null;
  const fontHash = await sha256((R.fonts ?? []).join(","));

  emit("canvas", canvasHash ? shortHash(canvasHash) : NA);
  if (webglHash) emit("webgl", shortHash(webglHash));
  emit("audio", audioHash ? shortHash(audioHash) : NA);
  emit("fontfp", shortHash(fontHash));

  R.rand = Boolean(first && second && first !== second);

  try {
    const square = document.createElement("canvas");
    square.width = 16;
    square.height = 16;
    const context = square.getContext("2d") as CanvasRenderingContext2D;
    context.fillStyle = "rgb(100,150,200)";
    context.fillRect(0, 0, 16, 16);
    R.noise = context.getImageData(0, 0, 16, 16).data.some(
      (value, index) => value !== [100, 150, 200, 255][index % 4],
    );
  } catch {
    R.noise = false;
  }

  emit("rand", R.rand ? "on: the same drawing came out different" : "off: the same both times");

  R.fingerprint = shortHash(await sha256([
    canvasHash, webglHash, audioHash, fontHash,
    `${screen.width}x${screen.height}x${screen.colorDepth}`, devicePixelRatio, R.tz, (R.langs ?? []).join(),
    navigator.hardwareConcurrency, (navigator as any).deviceMemory, navigator.platform, navigator.maxTouchPoints,
  ].join("|")));
  emit("fpid", R.fingerprint);
};

const readWebrtc = async (R: Readings, emit: Emit) => {
  if (!window.RTCPeerConnection) {
    R.rtc = false;
    emit("webrtc", "WebRTC is off");
    emit("lan", "WebRTC is off");
    return;
  }

  const publicAddresses = new Set<string>();
  const localAddresses = new Set<string>();

  await Promise.all(
    ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"].map(async (urls) => {
      let connection: RTCPeerConnection | null = null;

      try {
        connection = new RTCPeerConnection({ iceServers: [{ urls }] });
        connection.createDataChannel("x");

        const finished = new Promise<void>((resolve) => {
          connection!.onicecandidate = (event) => {
            if (!event.candidate) {
              resolve();
              return;
            }
            const line = event.candidate.candidate ?? "";
            const reflexive = line.match(/ ([0-9a-f.:]+) \d+ typ srflx/i);
            const host = line.match(/ (\S+) \d+ typ host/i);
            if (reflexive) publicAddresses.add(reflexive[1]);
            if (host) localAddresses.add(host[1]);
          };
          window.setTimeout(resolve, 3500);
        });

        await connection.setLocalDescription(await connection.createOffer());
        await finished;
      } catch {
        // 单个 STUN 服务器失败不影响另一个。
      } finally {
        connection?.close();
      }
    }),
  );

  R.rtc = [...publicAddresses].sort(
    (first, second) => Number(first.includes(":")) - Number(second.includes(":")),
  );
  emit("webrtc", R.rtc.length ? R.rtc.join(", ") : "no public address");

  const local = [...localAddresses];
  const visible = local.filter((address) => !/\.local$/i.test(address));
  const hidden = local.length > visible.length ? "hidden (mDNS)" : "";
  emit("lan", [...visible, hidden].filter(Boolean).join(", ") || NONE);
};

const EXIT_SOURCES: [string, () => Promise<{ ip?: string; cc?: string | null; note?: string }>][] = [
  ["ex_cn", () => getJson("https://myip.ipip.net/json").then((body) => ({
    ip: body.data.ip,
    cc: null,
    note: (body.data.location ?? []).filter(Boolean).join(" "),
  }))],
  ["ex_intl", () => getJson("https://api.ip.sb/geoip").then((body) => ({
    ip: body.ip,
    cc: body.country_code,
    note: body.isp ?? body.asn_organization ?? "",
  }))],
  ...([["ex_gpt", "chatgpt.com"], ["ex_claude", "claude.ai"], ["ex_cf", "www.cloudflare.com"]] as const).map(
    ([id, host]): [string, () => Promise<{ ip?: string; cc?: string | null; note?: string }>] => [
      id,
      () => getText(`https://${host}/cdn-cgi/trace`).then((text) => {
        const trace = parseKeyValues(text);
        return {
          ip: trace.ip,
          cc: trace.loc,
          note: [trace.colo, trace.warp && trace.warp !== "off" ? "WARP" : ""].filter(Boolean).join(" · "),
        };
      }),
    ],
  ),
];

const readExits = async (R: Readings, emit: Emit) => {
  R.exits = {};

  await Promise.all(
    EXIT_SOURCES.map(async ([id, source]) => {
      const answer = await source().catch(() => null);
      if (!answer?.ip) {
        (R.exits as Record<string, string | null>)[id] = null;
        return emit(id, FAILED);
      }

      (R.exits as Record<string, string | null>)[id] = answer.ip;
      const country = /^[A-Z]{2}$/.test(answer.cc ?? "") && answer.cc !== "XX" ? countryName(answer.cc) : "";
      emit(id, [answer.ip, country, answer.note].filter(Boolean).join(" · "));
    }),
  );
};

const readStack = async (R: Readings, emit: Emit) => {
  const addressOf = (family: number) =>
    getJson(`https://ipv${family}-check-perf.radar.cloudflare.com/`)
      .then((body) => (body.ip_address as string) ?? null)
      .catch(() => null);
  const [v4, v6] = await Promise.all([addressOf(4), addressOf(6)]);

  R.stack = [v4, v6].filter(Boolean) as string[];
  emit("stack", v4 || v6 ? `IPv4 ${v4 ?? "N/A"} · IPv6 ${v6 ?? "N/A"}` : NONE);
};

const COUNTRY_ALIASES: Record<string, string> = {
  "Hong Kong": "HK", Macao: "MO", Macau: "MO", Taiwan: "TW", "South Korea": "KR", Russia: "RU", Vietnam: "VN", Turkey: "TR", "Türkiye": "TR",
  Czechia: "CZ", "The Netherlands": "NL", Netherlands: "NL", "United States": "US", "United Kingdom": "GB",
};

let englishCountryCodes: Record<string, string> | null = null;

const countryCodeOfName = (name: string) => {
  if (COUNTRY_ALIASES[name]) return COUNTRY_ALIASES[name];

  if (!englishCountryCodes) {
    englishCountryCodes = {};
    try {
      const names = new Intl.DisplayNames(["en"], { type: "region" });
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (const first of letters) {
        for (const second of letters) {
          const code = first + second;
          const label = names.of(code);
          if (label && label !== code) englishCountryCodes[label] = code;
        }
      }
    } catch {
      // 不支持 Intl.DisplayNames 时只保留别名表。
    }
  }
  return englishCountryCodes[name] ?? null;
};

const readDnsResolver = async (R: Readings, emit: Emit) => {
  const id = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  try {
    const answer = await getJson(`https://${id}.edns.ip-api.com/json`, 6000);
    const resolver = answer.dns ?? {};
    const parts = String(resolver.geo ?? "").split(" - ");
    const name = parts[0].trim();
    const subnet = answer.edns?.ip ? `ECS ${answer.edns.ip}` : "";

    R.dnsCC = countryCodeOfName(name);
    R.dnsOrg = parts.slice(1).join(" - ").trim();
    emit("dns", [resolver.ip, R.dnsOrg || name, subnet].filter(Boolean).join(" · "));
  } catch {
    R.dnsCC = null;
    emit("dns", FAILED);
  }
};

const readTrace = async (R: Readings, emit: Emit) => {
  const trace = parseKeyValues(await getText(TRACE_URL).catch(() => ""));
  R.trace = trace;

  if (trace.kex) {
    emit("kex", `${trace.kex}${/MLKEM|Kyber/i.test(trace.kex) ? " · post-quantum" : ""} · ECH ${trace.sni === "encrypted" ? "on" : "off"}`);
  } else {
    emit("kex", FAILED);
  }
  emit("warp", trace.warp ? `WARP ${trace.warp} · Gateway ${trace.gateway ?? "N/A"}` : FAILED);
};

const seenProtocols = () =>
  [...performance.getEntriesByType("navigation"), ...performance.getEntriesByType("resource")]
    .map((entry) => (entry as PerformanceResourceTiming).nextHopProtocol)
    .filter(Boolean);

const readHttp3 = async (R: Readings) => {
  R.http = [];

  for (let attempt = 0; attempt < 4 && !seenProtocols().includes("h3"); attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const text = await getText(TRACE_URL).catch(() => "");
    const match = text.match(/^http=(.+)$/m);
    if (match) R.http.push(match[1].trim());
    if (match && /^http\/3$/i.test(match[1].trim())) break;
  }
  R.http.push(...seenProtocols());
};

const readWebgpu = async (R: Readings, emit: Emit) => {
  const gpu = (navigator as any).gpu;
  if (!gpu) return emit("webgpu", NA);

  const adapter = await within<any>(gpu.requestAdapter({ powerPreference: "high-performance" }), 2000, null);
  if (!adapter) return emit("webgpu", NONE);

  const info = adapter.info ?? {};
  R.webgpu = { vendor: info.vendor, architecture: info.architecture, description: info.description };
  emit("webgpu", [info.vendor, info.architecture, info.device, info.description].filter(Boolean).join(" · ") || NONE);
};

const readRefreshRate = async (emit: Emit) => {
  const stamps = await within<number[] | null>(
    new Promise((resolve) => {
      const seen: number[] = [];
      const step = (stamp: number) => {
        seen.push(stamp);
        if (seen.length < 40) requestAnimationFrame(step);
        else resolve(seen);
      };
      requestAnimationFrame(step);
    }),
    2000,
    null,
  );
  if (!stamps) return emit("hz", NA);

  const gaps = stamps.slice(1).map((stamp, index) => stamp - stamps[index]).sort((first, second) => first - second);
  const rate = 1000 / gaps[gaps.length >> 1];
  const nearest = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360].reduce(
    (best, value) => (Math.abs(value - rate) < Math.abs(best - rate) ? value : best),
  );
  emit("hz", `${Math.abs(nearest - rate) < 4 ? nearest : Math.round(rate)} Hz`);
};

const readCodecs = (emit: Emit) => {
  const video = document.createElement("video");
  const supported = (type: string) => {
    try {
      return window.MediaSource?.isTypeSupported ? MediaSource.isTypeSupported(type) : Boolean(video.canPlayType(type));
    } catch {
      return false;
    }
  };
  const list = [
    ["H.264", 'video/mp4; codecs="avc1.42E01E"'],
    ["VP9", 'video/webm; codecs="vp9"'],
    ["AV1", 'video/mp4; codecs="av01.0.05M.08"'],
    ["HEVC", 'video/mp4; codecs="hvc1.1.6.L93.B0"'],
    ["Dolby Vision", 'video/mp4; codecs="dvh1.05.06"'],
    ["E-AC-3", 'audio/mp4; codecs="ec-3"'],
  ].filter(([, type]) => supported(type)).map(([name]) => name);
  emit("codecs", list.join(" · ") || NONE);
};

const readDrm = async (emit: Emit) => {
  // Firefox 会提示访客启用 DRM，这里不询问。
  if (!navigator.requestMediaKeySystemAccess || /Firefox\//.test(navigator.userAgent)) return emit("drm", NA);

  const config = [{ initDataTypes: ["cenc"], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }] }];
  const systems = [["Widevine", "com.widevine.alpha"], ["PlayReady", "com.microsoft.playready.recommendation"], ["FairPlay", "com.apple.fps"], ["ClearKey", "org.w3.clearkey"]];
  const answers = await Promise.all(
    systems.map(([name, key]) =>
      within<string | null>(navigator.requestMediaKeySystemAccess(key, config).then(() => name), 2000, null),
    ),
  );
  emit("drm", answers.filter(Boolean).join(" · ") || NONE);
};

const readPermissions = async (emit: Emit) => {
  if (!navigator.permissions) return emit("perms", NA);

  const names = [["geolocation", "location"], ["notifications", "notifications"], ["camera", "camera"], ["microphone", "mic"]];
  const states: Record<string, string> = { granted: "allowed", denied: "blocked", prompt: "ask" };
  const answers = await Promise.all(
    names.map(([name, label]) =>
      navigator.permissions
        .query({ name: name as PermissionName })
        .then((status) => `${label} ${states[status.state]}`, () => null),
    ),
  );
  emit("perms", answers.filter(Boolean).join(" · ") || NA);
};

const readExtensions = async (emit: Emit) => {
  await new Promise((resolve) => window.setTimeout(resolve, 1200));

  const win = window as any;
  const root = document.documentElement;
  const body = document.body;
  const has = (selector: string) => {
    try {
      return Boolean(document.querySelector(selector));
    } catch {
      return false;
    }
  };
  const found: string[] = [];
  const wallet = win.ethereum;

  if (wallet) {
    found.push(
      wallet.isRabby ? "Rabby" : wallet.isCoinbaseWallet ? "Coinbase Wallet" : wallet.isBraveWallet ? "Brave Wallet"
        : wallet.isOkxWallet || win.okxwallet ? "OKX Wallet" : wallet.isTrust ? "Trust Wallet" : wallet.isTokenPocket ? "TokenPocket"
          : wallet.isMetaMask ? "MetaMask" : "Ethereum wallet",
    );
  } else if (win.okxwallet) found.push("OKX Wallet");

  if (win.phantom || win.solana?.isPhantom) found.push("Phantom");
  if (win.tronLink || win.tronWeb) found.push("TronLink");
  if (win.keplr) found.push("Keplr");
  if (win.bitkeep) found.push("Bitget Wallet");
  if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) found.push("React DevTools");
  if (win.__VUE_DEVTOOLS_GLOBAL_HOOK__) found.push("Vue DevTools");
  if (win.__REDUX_DEVTOOLS_EXTENSION__) found.push("Redux DevTools");
  if (body.hasAttribute("data-gr-ext-installed") || body.hasAttribute("data-new-gr-c-s-check-loaded")) found.push("Grammarly");
  if (root.hasAttribute("data-darkreader-mode") || root.hasAttribute("data-darkreader-scheme") || has('meta[name="darkreader"]')) found.push("Dark Reader");
  if (has('[id*="immersive-translate"],[class*="immersive-translate"]') || root.hasAttribute("imt-state")) found.push("Immersive Translate");
  if (has("#loom-companion-mv3")) found.push("Loom");
  if (has('script[src*="kaspersky-labs"],link[href*="kaspersky-labs"]')) found.push("Kaspersky");
  if (root.classList.contains("translated-ltr") || root.classList.contains("translated-rtl")) found.push("Google Translate");

  emit("ext", found.join(" · ") || "none detectable");
};

const readLatency = async (R: Readings) => {
  const samples: number[] = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const url = `${ME_URL}?rtt=${attempt}`;
    const ok = await getText(url).then(() => true, () => false);
    if (!ok) continue;

    const entry = performance.getEntriesByName(url)[0] as PerformanceResourceTiming | undefined;
    if (entry && entry.requestStart > 0 && entry.responseStart > entry.requestStart) {
      samples.push(entry.responseStart - entry.requestStart);
    }
  }
  R.rttBrowser = samples.length >= 3 ? Math.min(...samples) : null;
};

export const isResistFingerprinting = (R: Readings) =>
  rfpClock(/Firefox\//.test(navigator.userAgent), R.tz, R.gpuRaw) as boolean;

export const systemLanguages = (R: Readings) =>
  R.dev
    ? sysLangs({
        os: R.dev.os,
        fonts: [...(R.fonts ?? []), ...(R.sysFonts ?? [])],
        voices: R.voices ?? [],
        kbd: R.kbd,
      })
    : undefined;

export const readGpuOs = (R: Readings) => gpuOS(R.gpuRaw) as string | null;

export const bestGpuName = (R: Readings) =>
  (discreteGpu(R.gpu, R.gpuHi, R.webgpu) as string | null) || R.gpu || null;

// 每项检测互相独立，单项失败只显示“读不到”，不影响其他项。
export const collectReadings = async (
  R: Readings,
  bait: HTMLElement | null,
  emit: Emit,
  onChange: () => void,
) => {
  const guard = async (ids: string[], work: () => unknown) => {
    try {
      await work();
    } catch {
      ids.forEach((id) => emit(id, FAILED));
    }
    onChange();
  };

  await guard(["langs", "locale", "tz", "hour", "week", "fmt"], () => readLocale(R, emit));
  await guard(["scheme", "motion", "gamut", "dnt", "cookies", "pdf", "webdriver", "win", "a11y", "display", "h_ref", "history", "screens"], () => readPreferences(R, emit));
  await guard(["fonts"], () => readFonts(R, emit));
  await guard(["engine"], () => readEngine(emit));
  await guard(["codecs"], () => readCodecs(emit));

  let webglInfo: string | null = null;
  await guard(["gpu", "webgl", "glx"], () => {
    webglInfo = readGpu(R, emit);
  });

  await Promise.all([
    guard(["ip"], () => readServer(R, emit)),
    guard(["os", "browser", "arch", "screen", "cpu", "mem", "touch", "conn"], () => readHardware(R, emit)),
    guard(["kbd"], () => readKeyboard(R, emit)),
    guard(["voices"], () => readVoices(R, emit)),
    guard(["audiohw"], () => readAudioHardware(emit)),
    guard(["bio"], () => readYesNo("bio", window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.(), emit)),
    guard(["bt"], () => readYesNo("bt", (navigator as any).bluetooth?.getAvailability?.(), emit)),
    guard(["battery"], () => readBattery(emit)),
    guard(["media"], () => readMedia(emit)),
    guard(["storage"], () => readStorage(emit)),
    guard(["adblock"], () => readAdblock(R, bait, emit)),
    guard(["canvas", "webgl", "audio", "fontfp", "fpid", "rand"], () => readFingerprints(R, webglInfo, emit)),
    guard(["webrtc", "lan"], () => readWebrtc(R, emit)),
    guard(["ex_cn", "ex_intl", "ex_gpt", "ex_claude", "ex_cf"], () => readExits(R, emit)),
    guard(["stack"], () => readStack(R, emit)),
    guard(["dns"], () => readDnsResolver(R, emit)),
    guard(["kex", "warp"], () => readTrace(R, emit)),
    guard([], () => readHttp3(R)),
    guard(["webgpu"], () => readWebgpu(R, emit)),
    guard(["hz"], () => readRefreshRate(emit)),
    guard(["drm"], () => readDrm(emit)),
    guard(["perms"], () => readPermissions(emit)),
    guard(["ext"], () => readExtensions(emit)),
    guard([], () => readLatency(R)),
  ]);
};
