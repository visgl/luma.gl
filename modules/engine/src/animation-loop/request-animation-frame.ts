// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global window, setTimeout, clearTimeout */

/** Node.js polyfill for requestAnimationFrame */
// / <reference types="@types/node" />
export function requestAnimationFramePolyfill(callback: (time?: any) => void): any {
  return typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame(callback)
    : setTimeout(callback, 1000 / 60);
}

/** Node.js polyfill for cancelAnimationFrame */
export function cancelAnimationFramePolyfill(timerId: any): void {
  return typeof window !== 'undefined' && window.cancelAnimationFrame
    ? window.cancelAnimationFrame(timerId)
    : clearTimeout(timerId);
}
