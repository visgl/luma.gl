// Node.js polyfills for requestAnimationFrame and cancelAnimationFrame
// / <reference types="@types/node" />

export function requestAnimationFrame(callback): number | NodeJS.Timeout {
  return typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame(callback)
    : setTimeout(callback, 1000 / 60);
}

export function cancelAnimationFrame(timerId): void {
  return typeof window !== 'undefined' && window.cancelAnimationFrame
    ? window.cancelAnimationFrame(timerId)
    : clearTimeout(timerId);
}
