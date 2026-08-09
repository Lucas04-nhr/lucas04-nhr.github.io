export interface DetectedClient {
  name: string;
  icon: string;
}

export interface ClientEnvironment {
  operatingSystem: DetectedClient;
  browser: DetectedClient;
}

interface ClientMatcher extends DetectedClient {
  pattern: RegExp;
}

const IDE_BROWSER_MATCHERS: ClientMatcher[] = [
  {
    name: "Visual Studio Code",
    icon: "simple-icons:visualstudiocode",
    pattern: /(?:\bCode|VSCode)\/[\d.]+/i,
  },
  {
    name: "Cursor",
    icon: "simple-icons:cursor",
    pattern: /\bCursor\/[\d.]+/i,
  },
  {
    name: "Windsurf",
    icon: "simple-icons:windsurf",
    pattern: /\bWindsurf\/[\d.]+/i,
  },
  {
    name: "IntelliJ IDEA",
    icon: "simple-icons:intellijidea",
    pattern: /\bIntelliJ(?: IDEA)?\b/i,
  },
  {
    name: "PyCharm",
    icon: "simple-icons:pycharm",
    pattern: /\bPyCharm\b/i,
  },
  {
    name: "WebStorm",
    icon: "simple-icons:webstorm",
    pattern: /\bWebStorm\b/i,
  },
  {
    name: "PhpStorm",
    icon: "simple-icons:phpstorm",
    pattern: /\bPhpStorm\b/i,
  },
  {
    name: "Rider",
    icon: "simple-icons:rider",
    pattern: /\bRider\b/i,
  },
  {
    name: "CLion",
    icon: "simple-icons:clion",
    pattern: /\bCLion\b/i,
  },
  {
    name: "GoLand",
    icon: "simple-icons:goland",
    pattern: /\bGoLand\b/i,
  },
  {
    name: "RubyMine",
    icon: "simple-icons:rubymine",
    pattern: /\bRubyMine\b/i,
  },
  {
    name: "Android Studio",
    icon: "simple-icons:androidstudio",
    pattern: /\bAndroid Studio\b/i,
  },
  {
    name: "Zed",
    icon: "simple-icons:zedindustries",
    pattern: /\bZed\/[\d.]+/i,
  },
  {
    name: "JetBrains IDE",
    icon: "simple-icons:jetbrains",
    pattern: /\b(?:JetBrains|JCEF)\b/i,
  },
];

const BROWSER_MATCHERS: ClientMatcher[] = [
  {
    name: "Microsoft Edge",
    icon: "simple-icons:microsoftedge",
    pattern: /\bEdg(?:A|iOS)?\/[\d.]+/i,
  },
  {
    name: "Opera",
    icon: "simple-icons:opera",
    pattern: /\b(?:OPR|Opera)\/[\d.]+/i,
  },
  {
    name: "Vivaldi",
    icon: "simple-icons:vivaldi",
    pattern: /\bVivaldi\/[\d.]+/i,
  },
  {
    name: "Arc",
    icon: "simple-icons:arc",
    pattern: /\bArc\/[\d.]+/i,
  },
  {
    name: "Firefox",
    icon: "simple-icons:firefoxbrowser",
    pattern: /\b(?:Firefox|FxiOS)\/[\d.]+/i,
  },
  {
    name: "Google Chrome",
    icon: "simple-icons:googlechrome",
    pattern: /\b(?:Chrome|CriOS)\/[\d.]+/i,
  },
  {
    name: "Safari",
    icon: "simple-icons:safari",
    pattern: /\bVersion\/[\d.]+.*\bSafari\/[\d.]+/i,
  },
];

const detectOperatingSystem = (
  userAgent: string,
  reportedPlatform?: string,
): DetectedClient => {
  const browserPlatform =
    typeof navigator === "undefined" ? "" : navigator.platform;
  const platform = reportedPlatform || browserPlatform;

  if (/Android/i.test(userAgent)) {
    return { name: "Android", icon: "simple-icons:android" };
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return { name: "iOS / iPadOS", icon: "simple-icons:apple" };
  }

  if (
    /Macintosh/i.test(userAgent) &&
    typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 1
  ) {
    return { name: "iPadOS", icon: "simple-icons:apple" };
  }

  if (/CrOS/i.test(userAgent)) {
    return { name: "ChromeOS", icon: "simple-icons:googlechrome" };
  }

  if (/Windows/i.test(userAgent)) {
    return { name: "Windows", icon: "simple-icons:windows11" };
  }

  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return { name: "macOS", icon: "simple-icons:apple" };
  }

  if (/Ubuntu/i.test(userAgent)) {
    return { name: "Ubuntu", icon: "simple-icons:ubuntu" };
  }

  if (/Linux/i.test(userAgent)) {
    return { name: "Linux", icon: "simple-icons:linux" };
  }

  if (/Windows/i.test(platform)) {
    return { name: "Windows", icon: "simple-icons:windows11" };
  }

  if (/macOS|MacIntel/i.test(platform)) {
    return { name: "macOS", icon: "simple-icons:apple" };
  }

  if (/Ubuntu/i.test(platform)) {
    return { name: "Ubuntu", icon: "simple-icons:ubuntu" };
  }

  if (/Linux/i.test(platform)) {
    return { name: "Linux", icon: "simple-icons:linux" };
  }

  return { name: reportedPlatform || "Unknown", icon: "mdi:monitor-question" };
};

const isBraveBrowser = () =>
  typeof navigator !== "undefined" && "brave" in navigator;

const detectBrowser = (userAgent: string): DetectedClient => {
  const ideBrowser = IDE_BROWSER_MATCHERS.find(({ pattern }) =>
    pattern.test(userAgent),
  );
  if (ideBrowser) {
    return { name: ideBrowser.name, icon: ideBrowser.icon };
  }

  if (isBraveBrowser()) {
    return { name: "Brave", icon: "simple-icons:brave" };
  }

  const browser = BROWSER_MATCHERS.find(({ pattern }) =>
    pattern.test(userAgent),
  );
  if (browser) {
    return { name: browser.name, icon: browser.icon };
  }

  if (
    /\b(?:Chromium|Chrome|CriOS)\/[\d.]+|\bElectron\/[\d.]+/i.test(
      userAgent,
    )
  ) {
    return {
      name: "Chromium-based Browser",
      icon: "simple-icons:googlechrome",
    };
  }

  return { name: "Unknown", icon: "mdi:web" };
};

export const detectClientEnvironment = (
  userAgent: string,
  reportedPlatform?: string,
): ClientEnvironment => ({
  operatingSystem: detectOperatingSystem(userAgent, reportedPlatform),
  browser: detectBrowser(userAgent),
});
