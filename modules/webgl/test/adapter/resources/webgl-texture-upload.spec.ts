// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CopyExternalImageOptions} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {GL} from '@luma.gl/webgl/constants';
import {WebGLStateTracker} from '@luma.gl/webgl/context/state-tracker/webgl-state-tracker';
import {expect, it, vi} from 'vitest';

const IMAGE_UPLOAD_OPTIONS: Pick<CopyExternalImageOptions, 'flipY' | 'premultipliedAlpha'>[] = [
  {},
  {flipY: false, premultipliedAlpha: false},
  {flipY: true, premultipliedAlpha: false},
  {flipY: false, premultipliedAlpha: true},
  {flipY: true, premultipliedAlpha: true}
];

function createImageData(): ImageData {
  return new ImageData(new Uint8ClampedArray([255, 0, 0, 128, 0, 255, 0, 128]), 1, 2);
}

function getExpectedPixels(flipY = false, premultipliedAlpha = false): number[] {
  const color = premultipliedAlpha ? 128 : 255;
  const redPixel = [color, 0, 0, 128];
  const greenPixel = [0, color, 0, 128];
  return flipY ? [...greenPixel, ...redPixel] : [...redPixel, ...greenPixel];
}

it.each(
  IMAGE_UPLOAD_OPTIONS
)('copyExternalImage applies %j and restores ambient flags', async options => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const texture = device.createTexture({format: 'rgba8unorm', width: 1, height: 2});
  const originalFlipY = gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL);
  const originalPremultipliedAlpha = gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  const tracker = WebGLStateTracker.get(gl);
  const originalStackDepth = tracker.stateStack.length;
  const ambientFlipY = !options.flipY;
  const ambientPremultipliedAlpha = !options.premultipliedAlpha;
  try {
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, ambientFlipY);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, ambientPremultipliedAlpha);
    texture.copyExternalImage({image: createImageData(), ...options});
    expect(Array.from(new Uint8Array(texture.readDataSyncWebGL()))).toEqual(
      getExpectedPixels(options.flipY, options.premultipliedAlpha)
    );
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(ambientFlipY);
    expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(ambientPremultipliedAlpha);
    expect(tracker.stateStack).toHaveLength(originalStackDepth);
  } finally {
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, originalFlipY);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, originalPremultipliedAlpha);
    texture.destroy();
  }
});

it('copyExternalImage restores ambient flags when an upload throws', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const texture = device.createTexture({format: 'rgba8unorm', width: 1, height: 2});
  const originalFlipY = gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL);
  const originalPremultipliedAlpha = gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  const tracker = WebGLStateTracker.get(gl);
  const originalStackDepth = tracker.stateStack.length;
  const uploadError = new DOMException('Image is not origin-clean', 'SecurityError');
  const upload = vi.spyOn(gl, 'texSubImage2D').mockImplementation(() => {
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(false);
    expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(false);
    throw uploadError;
  });
  try {
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    expect(() => texture.copyExternalImage({image: createImageData()})).toThrow(uploadError);
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(true);
    expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(true);
    expect(tracker.stateStack).toHaveLength(originalStackDepth);
  } finally {
    upload.mockRestore();
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, originalFlipY);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, originalPremultipliedAlpha);
    texture.destroy();
  }
});

it.each([
  ...IMAGE_UPLOAD_OPTIONS,
  {throwUpload: true}
])('copyElementImage applies %j and restores ambient flags', async options => {
  const device = await getWebGLTestDevice();
  const gl = device.gl as WebGL2RenderingContext & {
    texElementImage2D?: (...parameters: unknown[]) => void;
  };
  const texture = device.createTexture({format: 'rgba8unorm', width: 1, height: 2});
  const originalFlipY = gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL);
  const originalPremultipliedAlpha = gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  const originalUpload = gl.texElementImage2D;
  const tracker = WebGLStateTracker.get(gl);
  const originalStackDepth = tracker.stateStack.length;
  const {flipY, premultipliedAlpha} = options;
  const ambientFlipY = !flipY;
  const ambientPremultipliedAlpha = !premultipliedAlpha;
  const uploadError = new Error('Element upload failed');
  const upload = vi.fn(() => {
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(Boolean(flipY));
    expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(Boolean(premultipliedAlpha));
    if (options.throwUpload) {
      throw uploadError;
    }
  });
  try {
    gl.texElementImage2D = upload;
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, ambientFlipY);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, ambientPremultipliedAlpha);
    const copyImage = () =>
      texture.copyElementImage({
        element: document.createElement('div'),
        width: 1,
        height: 2,
        flipY,
        premultipliedAlpha
      });
    if (options.throwUpload) {
      expect(copyImage).toThrow(uploadError);
    } else {
      expect(copyImage()).toEqual({width: 1, height: 2});
    }
    expect(upload).toHaveBeenCalledOnce();
    expect(gl.getParameter(GL.UNPACK_FLIP_Y_WEBGL)).toBe(ambientFlipY);
    expect(gl.getParameter(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(ambientPremultipliedAlpha);
    expect(tracker.stateStack).toHaveLength(originalStackDepth);
  } finally {
    if (originalUpload) {
      gl.texElementImage2D = originalUpload;
    } else {
      delete gl.texElementImage2D;
    }
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, originalFlipY);
    gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, originalPremultipliedAlpha);
    texture.destroy();
  }
});

it.each([
  false,
  true
])('ImageBitmap uses creation-time flags (%s) instead of upload flags', async converted => {
  const device = await getWebGLTestDevice();
  const bitmap = await createImageBitmap(createImageData(), {
    imageOrientation: converted ? 'flipY' : 'from-image',
    premultiplyAlpha: converted ? 'premultiply' : 'none'
  });
  const texture = device.createTexture({format: 'rgba8unorm', width: 1, height: 2});
  try {
    texture.copyExternalImage({image: bitmap, flipY: !converted, premultipliedAlpha: !converted});
    expect(Array.from(new Uint8Array(texture.readDataSyncWebGL()))).toEqual(
      getExpectedPixels(converted, converted)
    );
  } finally {
    texture.destroy();
    bitmap.close();
  }
});
