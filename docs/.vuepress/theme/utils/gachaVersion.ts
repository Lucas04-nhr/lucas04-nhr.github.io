export const fallbackGachaVersion = "1.3.1";

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
    cachedVersion = { value: match[1], expires: Date.now() + 5 * 60 * 1000 };
    return cachedVersion.value;
  } catch {
    signal.throwIfAborted();
    return cachedVersion?.value ?? fallbackGachaVersion;
  }
}
