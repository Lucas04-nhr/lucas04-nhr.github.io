// Estimate the in-flight batch using observed request durations. Confirmed
// batches set a lower bound, while the visible percentage advances one at a time.
export function createUploadProgress(total: number, report: (percentage: number) => void) {
  let percentage = 0;
  let committed = 0;
  let startedAt = Date.now();
  let averageDuration = 1500;
  let finished = false;
  report(0);
  const timer = setInterval(() => {
    const estimatedBatch = Math.min(.9, (Date.now() - startedAt) / averageDuration);
    const target = finished ? 100 : Math.min(99, Math.floor((committed + estimatedBatch) / total * 100));
    if (percentage < target) report(++percentage);
  }, 40);
  return {
    committed() {
      const duration = Math.max(40, Date.now() - startedAt);
      averageDuration = (averageDuration * committed + duration) / (committed + 1);
      committed++;
      startedAt = Date.now();
    },
    async finish(signal: AbortSignal) {
      finished = true;
      // Let a fast upload catch up smoothly without jumping straight to 100%.
      while (percentage < 100) {
        signal.throwIfAborted();
        await new Promise<void>((resolve) => setTimeout(resolve, 40));
      }
      signal.throwIfAborted();
    },
    stop() { clearInterval(timer); },
  };
}
