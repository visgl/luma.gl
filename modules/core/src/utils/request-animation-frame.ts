// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Node.js polyfills for requestAnimationFrame and cancelAnimationFrame
/* global window, setTimeout, clearTimeout */

// / <reference types="@types/node" />
export function requestAnimationFrame(callback: (time?: any) => void): any {
  return typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame(callback)
    : setTimeout(callback, 1000 / 60);
}

export function cancelAnimationFrame(timerId: any): void {
  return typeof window !== 'undefined' && window.cancelAnimationFrame
    ? window.cancelAnimationFrame(timerId)
    : clearTimeout(timerId);
}
