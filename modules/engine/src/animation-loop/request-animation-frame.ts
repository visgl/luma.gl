// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global window, setTimeout, clearTimeout */

/** Node.js polyfill for requestAnimationFrame */
// / <reference types="@types/node" />
export function requestAnimationFramePolyfill(callback: (time?: any) => void): any {
  const browserRequestAnimationFrame =
    typeof window !== 'undefined'
      ? window.requestAnimationFrame ||
        (window as Window & {webkitRequestAnimationFrame?: (cb: FrameRequestCallback) => number})
          .webkitRequestAnimationFrame ||
        (window as Window & {mozRequestAnimationFrame?: (cb: FrameRequestCallback) => number})
          .mozRequestAnimationFrame
      : null;

  if (browserRequestAnimationFrame) {
    return browserRequestAnimationFrame.call(window, callback);
  }

  return setTimeout(
    () => callback(typeof performance !== 'undefined' ? performance.now() : Date.now()),
    1000 / 60
  );
}

/** Node.js polyfill for cancelAnimationFrame */
export function cancelAnimationFramePolyfill(timerId: any): void {
  const browserCancelAnimationFrame =
    typeof window !== 'undefined'
      ? window.cancelAnimationFrame ||
        (window as Window & {webkitCancelAnimationFrame?: (handle: number) => void})
          .webkitCancelAnimationFrame ||
        (window as Window & {mozCancelAnimationFrame?: (handle: number) => void})
          .mozCancelAnimationFrame
      : null;

  if (browserCancelAnimationFrame) {
    browserCancelAnimationFrame.call(window, timerId);
    return;
  }

  clearTimeout(timerId);
}
