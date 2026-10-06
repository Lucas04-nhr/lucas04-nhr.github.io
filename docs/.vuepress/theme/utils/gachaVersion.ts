export const fallbackGachaVersion = "1.4.2";

let cachedVersion: { value: string; expires: number } | undefined;

// This is the project's latest stable release, not a deployed Worker's version.
export async function fetchGachaVersion(signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  if (cachedVersion && cachedVersion.expires > Date.now()) return cachedVersion.value;
  try {
    const response = await fetch("https://api.github.com/repos/Lucas04-nhr/Gacha-Manager/releases/latest", {
      credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
    });
    if (!response.ok) throw new Error("Release lookup failed.");
    const release = await response.json();
    signal.throwIfAborted();
    if (release.draft !== false || release.prerelease !== false || typeof release.tag_name !== "string") throw new Error("Invalid release.");
    const match = /^v?(\d+\.\d+\.\d+)$/.exec(release.tag_name);
    if (!match) throw new Error("Invalid release version.");
    // A stale GitHub release must not downgrade the version shipped with this page.
    const latest = match[1].split(".").map(Number);
    const bundled = fallbackGachaVersion.split(".").map(Number);
    const differing = latest.findIndex((part, index) => part !== bundled[index]);
    const value = differing >= 0 && latest[differing] < bundled[differing] ? fallbackGachaVersion : match[1];
    cachedVersion = { value, expires: Date.now() + 5 * 60 * 1000 };
    return cachedVersion.value;
  } catch {
    signal.throwIfAborted();
    return cachedVersion?.value ?? fallbackGachaVersion;
  }
}
