export type DetectionState = boolean | null;

export type IpApiResponse = {
  IP?: {
    IP?: string;
    Continent?: string;
    Country?: string;
    Region?: string;
    RegionCode?: string;
    City?: string;
    Timezone?: string;
    ASN?: string | number;
    ASOrganization?: string;
    Colo?: string;
  };
  Headers?: Record<string, string>;
};

export type BrowserSignal = {
  id: "language" | "timezone" | "emoji" | "font";
  label: string;
  result: DetectionState;
  value: string;
  detail: string;
};

export type IpSignal = {
  result: DetectionState;
  value: string;
  detail: string;
  data: IpApiResponse | null;
};

export type MainlandVerdictKind =
  | "mainland-ip"
  | "mainland-like"
  | "non-mainland";

export type MainlandVerdict = {
  kind: MainlandVerdictKind;
  title: string;
  summary: string;
};

export const IP_API_URL = "https://ip.lucas04.top";

const mainlandLanguagePattern = /^zh(-Hans)?(-CN)?$/i;

const mainlandTimeZones = new Set([
  "Asia/Shanghai",
  "Asia/Chongqing",
  "Asia/Harbin",
  "Asia/Urumqi",
  "Asia/Kashgar",
  "Asia/Beijing",
  "PRC",
]);

const chineseFonts = [
  "DengXian",
  "FangSong",
  "方正小标宋简体",
  "小标宋体",
  "仿宋_GB2312",
  "HarmonyOS Sans",
  "Alibaba PuHuiTi",
  "Smiley Sans",
];

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "N/A";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A";
  return String(value);
};

export const countMainlandBrowserSignals = (
  signals: BrowserSignal[],
): number => signals.filter((signal) => signal.result === true).length;

export const readIpSignal = (data: IpApiResponse | null): IpSignal => {
  if (!data?.IP) {
    return {
      result: null,
      value: "N/A",
      detail: "IP API did not return a usable IP object.",
      data,
    };
  }

  const country = data.IP.Country?.toUpperCase();
  const location = [data.IP.City, data.IP.Region, country]
    .filter(Boolean)
    .join(", ");

  return {
    result: country ? country === "CN" : null,
    value: location || country || "N/A",
    detail: country
      ? `Cloudflare geolocation country code: ${country}.`
      : "Cloudflare geolocation country code is unavailable.",
    data,
  };
};

export const fetchIpSignal = async (): Promise<IpSignal> => {
  const response = await fetch(IP_API_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as IpApiResponse;
  return readIpSignal(data);
};

const detectLanguage = (): BrowserSignal => {
  if (typeof navigator === "undefined") {
    return {
      id: "language",
      label: "Browser language",
      result: null,
      value: "N/A",
      detail: "navigator is unavailable.",
    };
  }

  const primary = navigator.language || "en";
  const languages = navigator.languages?.length
    ? navigator.languages
    : [primary];
  const matched = languages.some((lang) => mainlandLanguagePattern.test(lang));

  return {
    id: "language",
    label: "Browser language",
    result: matched,
    value: formatValue(languages),
    detail: "Matches any ISO language code for mainland China.",
  };
};

const detectTimeZone = (): BrowserSignal => {
  const timeZone =
    typeof Intl === "object" && typeof Intl.DateTimeFormat === "function"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";

  if (timeZone) {
    return {
      id: "timezone",
      label: "Time zone",
      result: mainlandTimeZones.has(timeZone),
      value: timeZone,
      detail: "Uses known mainland China tzdata names and legacy aliases.",
    };
  }

  const offset = new Date().getTimezoneOffset();

  return {
    id: "timezone",
    label: "Time zone",
    result: offset === -480,
    value: `UTC${offset <= 0 ? "+" : "-"}${Math.abs(offset / 60)}`,
    detail: "Intl time zone unavailable; fell back to UTC offset.",
  };
};

const getCharRenderStats = (char: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 100;

  if (!context) {
    throw new Error("Canvas context not supported");
  }

  canvas.width = fontSize;
  canvas.height = fontSize;
  context.font = `${fontSize}px sans-serif`;
  context.fillStyle = "black";
  context.textBaseline = "top";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(char, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  let isMono = true;
  let opaquePixelCount = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const alpha = imageData.data[index + 3];

    if (alpha > 0) {
      opaquePixelCount += 1;
      if (isMono && !(red === green && green === blue)) {
        isMono = false;
      }
    }
  }

  canvas.remove();
  return { isMono, opaquePixelCount };
};

const isWindows = (): boolean => {
  if (typeof navigator === "undefined") return false;
  if (navigator.platform?.startsWith("Win")) return true;
  return /Windows/i.test(navigator.userAgent ?? "");
};

const detectEmoji = (): BrowserSignal => {
  if (!isBrowser()) {
    return {
      id: "emoji",
      label: "Emoji rendering",
      result: null,
      value: "N/A",
      detail: "DOM canvas is unavailable.",
    };
  }

  if (isWindows()) {
    return {
      id: "emoji",
      label: "Emoji rendering",
      result: null,
      value: "Windows",
      detail: "Windows does not provide a reliable flag emoji signal.",
    };
  }

  try {
    const controlEmoji = String.fromCodePoint(0x1f600);
    const taiwanFlag = String.fromCodePoint(0x1f1f9, 0x1f1fc);
    const control = getCharRenderStats(controlEmoji);

    if (control.opaquePixelCount === 0 || control.isMono) {
      return {
        id: "emoji",
        label: "Emoji rendering",
        result: null,
        value: "Unsupported",
        detail: "Color emoji rendering is unavailable or protected.",
      };
    }

    const flag = getCharRenderStats(taiwanFlag);
    const matched = flag.opaquePixelCount === 0 || flag.isMono;

    return {
      id: "emoji",
      label: "Emoji rendering",
      result: matched,
      value: matched ? "Flag fallback detected" : "Color flag rendered",
      detail: "Checks whether the Taiwan flag emoji falls back after color emoji support is confirmed.",
    };
  } catch (error) {
    return {
      id: "emoji",
      label: "Emoji rendering",
      result: null,
      value: "N/A",
      detail: error instanceof Error ? error.message : "Canvas test failed.",
    };
  }
};

const isFontAvailable = (
  context: CanvasRenderingContext2D,
  font: string,
): boolean => {
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const sample = "mmmmmmmmmmlli中文测试";

  return baseFonts.some((baseFont) => {
    context.font = `72px ${baseFont}`;
    const baseWidth = context.measureText(sample).width;
    context.font = `72px "${font}", ${baseFont}`;
    const fontWidth = context.measureText(sample).width;
    return fontWidth !== baseWidth;
  });
};

const formatPlural = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

const detectFont = (): BrowserSignal => {
  if (!isBrowser()) {
    return {
      id: "font",
      label: "Chinese fonts",
      result: null,
      value: "N/A",
      detail: "DOM canvas is unavailable.",
    };
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return {
      id: "font",
      label: "Chinese fonts",
      result: null,
      value: "N/A",
      detail: "Canvas context not supported.",
    };
  }

  const matchedFonts = chineseFonts.filter((font) =>
    isFontAvailable(context, font),
  );
  canvas.remove();
  const matchedCount = matchedFonts.length;

  return {
    id: "font",
    label: `Chinese fonts: ${matchedCount} ${formatPlural(matchedCount, "font")} found`,
    result: matchedCount > 0,
    value: matchedCount > 0 ? matchedFonts.join(", ") : "none",
    detail: "Detects the availability of selected Chinese fonts.",
  };
};

export const detectBrowserSignals = (): BrowserSignal[] => [
  detectLanguage(),
  detectTimeZone(),
  detectEmoji(),
  detectFont(),
];

export const isBrowserMainlandLike = (signals: BrowserSignal[]): boolean =>
  countMainlandBrowserSignals(signals) >= 3;

export const shouldTreatAsMainlandUser = (
  ipSignal: IpSignal | null,
  browserSignals: BrowserSignal[],
): boolean =>
  ipSignal?.result === true || isBrowserMainlandLike(browserSignals);

export const resolveMainlandVerdict = (
  ipSignal: IpSignal | null,
  browserSignals: BrowserSignal[],
): MainlandVerdict => {
  const ipResult = ipSignal?.result ?? null;
  const mainlandBrowserSignalCount = countMainlandBrowserSignals(browserSignals);
  const totalBrowserSignals = browserSignals.length || 4;

  if (ipResult === true) {
    return {
      kind: "mainland-ip",
      title: "Mainland China User",
      summary: `The current IP geolocation is CN, so this is treated as a mainland China user.\nVPNs, proxies, and privacy tools may change regional access behavior.`,
    };
  }

  if (mainlandBrowserSignalCount >= 3) {
    return {
      kind: "mainland-like",
      title: "Mainland China User",
      summary: `${mainlandBrowserSignalCount}/${totalBrowserSignals} non-IP signals look mainland-like, so this is treated as a mainland China user.\nYour IP does not directly confirm mainland China: you may be using a VPN, proxy, privacy relay, or routed network.`,
    };
  }

  return {
    kind: "non-mainland",
    title: "Non-mainland China User",
    summary: `The current IP geolocation is not CN or unavailable, and only ${mainlandBrowserSignalCount}/${totalBrowserSignals} non-IP signals look mainland-like.`,
  };
};
