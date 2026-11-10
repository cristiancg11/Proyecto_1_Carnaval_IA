/**
 * Performance and Event Loop Utilities for CarnavalIA.
 * Optimizes the browser rendering pipeline, prevents layout thrashing,
 * batches state updates via microtasks, and avoids Long Tasks (>50ms)
 * to keep Interaction to Next Paint (INP) strictly below 200ms.
 */

/**
 * Schedules a callback to run on the next browser animation frame (rAF),
 * aligning DOM mutations and Leaflet map tile invalidations with the vsync cycle.
 * Returns a cancel function.
 */
export function scheduleNextFrame(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.requestAnimationFrame) {
    const timer = setTimeout(callback, 16);
    return () => clearTimeout(timer);
  }

  const frameId = window.requestAnimationFrame(() => {
    try {
      callback();
    } catch (err) {
      console.warn('[Performance] Error executing scheduled frame task:', err);
    }
  });

  return () => window.cancelAnimationFrame(frameId);
}

/**
 * Enqueues a microtask via queueMicrotask for atomic state batching
 * before the browser yields control to rendering or macrotask queues.
 */
export function scheduleMicrotask(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      try {
        callback();
      } catch (err) {
        console.warn('[Performance] Error executing scheduled microtask:', err);
      }
    });
  } else {
    Promise.resolve().then(callback).catch((err) => {
      console.warn('[Performance] Microtask fallback error:', err);
    });
  }
}

/**
 * Splits heavy computational workloads across event loop turns
 * to ensure that no single task blocks the main thread for >50ms.
 */
export async function yieldToMain(): Promise<void> {
  if (typeof (globalThis as any).scheduler?.yield === 'function') {
    return (globalThis as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wraps a synchronous or asynchronous operation with standard Performance Timeline marks.
 */
export function measureInteraction(label: string, task: () => void): void {
  if (typeof performance === 'undefined' || !performance.mark || !performance.measure) {
    task();
    return;
  }

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;

  performance.mark(startMark);
  try {
    task();
  } finally {
    performance.mark(endMark);
    try {
      performance.measure(label, startMark, endMark);
    } catch {
      // Ignore measure errors in restricted environments
    }
  }
}

export default {
  scheduleNextFrame,
  scheduleMicrotask,
  yieldToMain,
  measureInteraction,
};

