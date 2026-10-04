// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';

/** Reduce actual framebuffer work while preserving CSS coordinates and screenshot dimensions. */
export async function setVisualTestPixelScale(page, sceneName, pixelScale = getVisualTestPixelScale()) {
  assert(Number.isFinite(pixelScale) && pixelScale > 0);
  await page.waitForFunction(name => Boolean(window[name]?.deck || window[name]?.device), sceneName);
  await page.evaluate(({sceneName, pixelScale}) => {
    const scene = window[sceneName];
    // Explicit scaling is required: Chromium's native ResizeObserver can ignore emulated DPR.
    if (scene.deck) scene.deck.setProps({useDevicePixels: pixelScale});
    else scene.device.getDefaultCanvasContext().setProps({useDevicePixels: pixelScale});
  }, {sceneName, pixelScale});
  await page.waitForFunction(scale => {
    const canvas = document.querySelector('canvas');
    return canvas.width === Math.floor(canvas.clientWidth * scale) &&
      canvas.height === Math.floor(canvas.clientHeight * scale);
  }, pixelScale);
}

export function getVisualTestPixelScale() {
  return Number(process.env.LUMA_VISUAL_TEST_PIXEL_SCALE ?? 0.5);
}

/** Page and Locator screenshots share this interface; inspect images in CSS coordinates. */
export function captureVisualTestScreenshot(target, options = {}) {
  return target.screenshot({...options, scale: 'css'});
}
