// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Framebuffer, Texture} from '@luma.gl/core';
// import {copyTextureToImage} from '../debug/copy-texture-to-image';

/** Only works with 1st device? */
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
// let targetImage: HTMLImageElement | null = null;

/** Debug utility to draw FBO contents onto screen */
// eslint-disable-next-line
export function debugFramebuffer(
  fbo: Framebuffer | Texture,
  {
    id,
    minimap,
    opaque,
    top = '0',
    left = '0',
    rgbaScale = 1
  }: {
    id: string;
    minimap?: boolean;
    opaque?: boolean;
    top?: string;
    left?: string;
    rgbaScale?: number;
  }
) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.title = id;
    canvas.style.zIndex = '100';
    canvas.style.position = 'absolute';
    canvas.style.top = top; // ⚠️
    canvas.style.left = left; // ⚠️
    canvas.style.border = 'blue 5px solid';
    canvas.style.transform = 'scaleY(-1)';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    // targetImage = new Image();
  }

  // const canvasHeight = (minimap ? 2 : 1) * fbo.height;
  if (canvas.width !== fbo.width || canvas.height !== fbo.height) {
    canvas.width = fbo.width / 2;
    canvas.height = fbo.height / 2;
    canvas.style.width = '400px';
    canvas.style.height = '400px';
  }

  // const image = copyTextureToImage(fbo, {targetMaxHeight: 100, targetImage});
  // ctx.drawImage(image, 0, 0);

  const color = fbo.device.readPixelsToArrayWebGL(fbo);
  const imageData = ctx?.createImageData(fbo.width, fbo.height);
  if (imageData) {
    // Full map
    const offset = 0;
    // if (color.some((v) => v > 0)) {
    //   console.error('THERE IS NON-ZERO DATA IN THE FBO!');
    // }
    for (let i = 0; i < color.length; i += 4) {
      imageData.data[offset + i + 0] = color[i + 0] * rgbaScale;
      imageData.data[offset + i + 1] = color[i + 1] * rgbaScale;
      imageData.data[offset + i + 2] = color[i + 2] * rgbaScale;
      imageData.data[offset + i + 3] = opaque ? 255 : color[i + 3] * rgbaScale;
    }
    ctx?.putImageData(imageData, 0, 0);
  }
}
