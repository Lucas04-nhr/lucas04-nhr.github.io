type LogLevel = "info" | "warning" | "error";

// Log only fixed operation names and numeric counts, never URLs, tokens or records.
export function gachaLog(level: LogLevel, operation: string, counts?: Record<string, number>) {
  const write = level === "warning" ? console.warn : level === "error" ? console.error : console.info;
  write.call(console, `[Gacha Manager] [${level}] ${operation}`, counts ?? {});
}
