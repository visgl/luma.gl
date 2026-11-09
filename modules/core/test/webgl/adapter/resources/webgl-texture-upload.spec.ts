// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type TextureWriteOptions,
  type CopyExternalImageOptions
} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {GL} from '@luma.gl/core/webgl-constants';
import {withGLParameters} from '@luma.gl/core/webgl';
import {WebGLStateTracker} from '@luma.gl/core/webgl/context/state-tracker/webgl-state-tracker';
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

it.each([
  'data',
  'buffer'
] as const)('%s uploads reuse scratch options across nested and failed calls', async method => {
  const device = await getWebGLTestDevice();
  const texture = device.createTexture({format: 'rgba8unorm', width: 4, height: 4});
  const buffer = device.createBuffer({byteLength: 64, usage: Buffer.COPY_SRC});
  const normalize = vi.spyOn(Texture.prototype, '_normalizeTextureWriteOptions');
  const upload = vi.spyOn(device.gl, 'texSubImage2D').mockImplementation(() => {});
  const data = new Uint8Array(64);
  const write = (options?: TextureWriteOptions) =>
    method === 'data' ? texture.writeData(data, options) : texture.writeBuffer(buffer, options);
  try {
    upload.mockImplementationOnce(() =>
      method === 'data'
        ? texture.writeBuffer(buffer, {width: 1, height: 1})
        : texture.writeData(data, {width: 1, height: 1})
    );
    write({width: 2, height: 2});
    const outer = normalize.mock.results[0].value;
    const inner = normalize.mock.results[1].value;
    expect(outer).not.toBe(inner);
    expect(outer.width).toBe(2);
    expect(inner.width).toBe(1);
    write({width: 3, height: 1});
    expect(normalize.mock.results[2].value).toBe(outer);
    upload.mockImplementationOnce(() => {
      throw new Error('upload failed');
    });
    expect(() => write()).toThrow('upload failed');
    write({width: 1, height: 1});
    expect(normalize.mock.results[4].value).toBe(outer);
    expect(() => write({bytesPerRow: 1})).toThrow('bytesPerRow');
    write({width: 1, height: 1});
    expect(normalize.mock.results[6].value).toBe(outer);
  } finally {
    upload.mockRestore();
    normalize.mockRestore();
    texture.destroy();
    buffer.destroy();
  }
});

it.each([
  'data',
  'buffer'
] as const)('%s uploads skip matching unpack scopes and restore differing state', async method => {
  const device = await getWebGLTestDevice();
  const gl = device.gl;
  const tracker = WebGLStateTracker.get(gl);
  const texture = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});
  const data = new Uint8Array(16).fill(127);
  const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
  const parameters = [GL.UNPACK_ALIGNMENT, GL.UNPACK_ROW_LENGTH, GL.UNPACK_IMAGE_HEIGHT] as const;
  const original = parameters.map(parameter => gl.getParameter(parameter));
  const originalEnabled = tracker.enable;
  const stackDepth = tracker.stateStack.length;
  try {
    for (const mode of ['matching', 'different', 'disabled']) {
      const ambient = mode === 'different' ? [4, 0, 0] : [1, 2, 2];
      parameters.forEach((parameter, index) => gl.pixelStorei(parameter, ambient[index]));
      tracker.enable = mode !== 'disabled';
      const push = vi.spyOn(WebGLStateTracker.prototype, 'push');
      const pop = vi.spyOn(WebGLStateTracker.prototype, 'pop');
      const pixelStore = vi.spyOn(gl, 'pixelStorei');
      try {
        if (method === 'data') texture.writeData(data);
        else texture.writeBuffer(buffer);
        expect(push).toHaveBeenCalledTimes(mode === 'disabled' ? 1 : 0);
        expect(pop).toHaveBeenCalledTimes(mode === 'disabled' ? 1 : 0);
        if (mode === 'matching') expect(pixelStore).not.toHaveBeenCalled();
        expect(parameters.map(parameter => gl.getParameter(parameter))).toEqual(ambient);
        expect(tracker.stateStack).toHaveLength(stackDepth);
      } finally {
        push.mockRestore();
        pop.mockRestore();
        pixelStore.mockRestore();
        tracker.enable = originalEnabled;
      }
      expect(Array.from(new Uint8Array(texture.readDataSyncWebGL()))).toEqual(Array.from(data));
    }
  } finally {
    parameters.forEach((parameter, index) => gl.pixelStorei(parameter, original[index]));
    tracker.enable = originalEnabled;
    texture.destroy();
    buffer.destroy();
  }
});

it.each([
  true,
  false
])('throwing writeData preserves unpack state (matching=%s)', async matching => {
  const device = await getWebGLTestDevice();
  const gl = device.gl;
  const tracker = WebGLStateTracker.get(gl);
  const texture = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});
  const parameters = [GL.UNPACK_ALIGNMENT, GL.UNPACK_ROW_LENGTH, GL.UNPACK_IMAGE_HEIGHT] as const;
  const original = parameters.map(parameter => gl.getParameter(parameter));
  const ambient = matching ? [1, 2, 2] : [4, 0, 0];
  const stackDepth = tracker.stateStack.length;
  const upload = vi.spyOn(gl, 'texSubImage2D').mockImplementation(() => {
    expect(parameters.map(parameter => gl.getParameter(parameter))).toEqual([1, 2, 2]);
    throw new Error('upload failed');
  });
  try {
    parameters.forEach((parameter, index) => gl.pixelStorei(parameter, ambient[index]));
    expect(() => texture.writeData(new Uint8Array(16))).toThrow('upload failed');
    expect(parameters.map(parameter => gl.getParameter(parameter))).toEqual(ambient);
    expect(tracker.stateStack).toHaveLength(stackDepth);
  } finally {
    upload.mockRestore();
    parameters.forEach((parameter, index) => gl.pixelStorei(parameter, original[index]));
    texture.destroy();
  }
});

const UNPACK_PARAMETERS = [
  GL.UNPACK_ALIGNMENT,
  GL.UNPACK_ROW_LENGTH,
  GL.UNPACK_IMAGE_HEIGHT
] as const;

/** Check the driver state as well as the cache, including when tracking is enabled. */
function readNativeUnpackState(gl: WebGL2RenderingContext): unknown[] {
  const tracker = WebGLStateTracker.get(gl);
  const enabled = tracker.enable;
  tracker.enable = false;
  try {
    return UNPACK_PARAMETERS.map(parameter => gl.getParameter(parameter));
  } finally {
    tracker.enable = enabled;
  }
}

it.each([
  'data',
  'buffer'
] as const)('%s uploads unwind nested uploads and an enclosing generic scope after exceptions', async method => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const tracker = WebGLStateTracker.get(gl);
  const texture = device.createTexture({format: 'rgba8unorm', width: 4, height: 4});
  const data = new Uint8Array(64);
  const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
  const original = readNativeUnpackState(gl);
  const originalEnabled = tracker.enable;
  const stackDepth = tracker.stateStack.length;
  const innerError = new Error('inner upload failed');
  const outerError = new Error('outer upload failed');
  const upload = vi.spyOn(gl, 'texSubImage2D').mockImplementation(() => {});
  const write = (nested: boolean) => {
    const options = {width: nested ? 1 : 2, height: nested ? 1 : 2};
    if ((method === 'data') !== nested) texture.writeData(data, options);
    else texture.writeBuffer(buffer, options);
  };
  try {
    for (const enabled of [true, false]) {
      tracker.enable = enabled;
      UNPACK_PARAMETERS.forEach((parameter, index) => gl.pixelStorei(parameter, [8, 0, 0][index]));
      upload.mockImplementationOnce(() => {
        expect(readNativeUnpackState(gl)).toEqual([1, 2, 2]);
        upload.mockImplementationOnce(() => {
          expect(readNativeUnpackState(gl)).toEqual([1, 1, 1]);
          throw innerError;
        });
        expect(() => write(true)).toThrow(innerError);
        expect(readNativeUnpackState(gl)).toEqual([1, 2, 2]);
        throw outerError;
      });
      expect(() =>
        withGLParameters(gl, {[GL.UNPACK_ALIGNMENT]: 4}, () => {
          expect(() => write(false)).toThrow(outerError);
          expect(readNativeUnpackState(gl)).toEqual([4, 0, 0]);
          expect(tracker.stateStack).toHaveLength(stackDepth + 1);
          throw outerError;
        })
      ).toThrow(outerError);
      expect(readNativeUnpackState(gl)).toEqual([8, 0, 0]);
      expect(UNPACK_PARAMETERS.map(parameter => tracker.cache[parameter])).toEqual([8, 0, 0]);
      expect(tracker.stateStack).toHaveLength(stackDepth);
      expect(gl.getParameter(GL.PIXEL_UNPACK_BUFFER_BINDING)).toBeNull();
      expect(gl.getParameter(GL.TEXTURE_BINDING_2D)).toBeNull();
      // A later successful upload must not inherit any failed scope's state.
      write(false);
      expect(readNativeUnpackState(gl)).toEqual([8, 0, 0]);
    }
  } finally {
    upload.mockRestore();
    tracker.enable = originalEnabled;
    UNPACK_PARAMETERS.forEach((parameter, index) =>
      gl.pixelStorei(parameter, original[index] as number)
    );
    texture.destroy();
    buffer.destroy();
  }
});

it.each([
  'data',
  'buffer'
] as const)('%s uploads restore partially applied unpack state when setup throws', async method => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const tracker = WebGLStateTracker.get(gl);
  const texture = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});
  const data = new Uint8Array(16);
  const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
  const original = readNativeUnpackState(gl);
  const originalEnabled = tracker.enable;
  const stackDepth = tracker.stateStack.length;
  const originalPixelStore = gl.pixelStorei.bind(gl);
  const setupError = new Error('pixel store failed');
  const upload = vi.spyOn(gl, 'texSubImage2D').mockImplementation(() => {});
  try {
    for (const enabled of [true, false]) {
      tracker.enable = enabled;
      UNPACK_PARAMETERS.forEach((parameter, index) => gl.pixelStorei(parameter, [4, 0, 0][index]));
      let shouldThrow = true;
      const pixelStore = vi.spyOn(gl, 'pixelStorei').mockImplementation((parameter, value) => {
        originalPixelStore(parameter, value);
        if (shouldThrow && parameter === GL.UNPACK_IMAGE_HEIGHT) {
          shouldThrow = false;
          throw setupError;
        }
      });
      upload.mockClear();
      try {
        expect(() =>
          method === 'data' ? texture.writeData(data) : texture.writeBuffer(buffer)
        ).toThrow(setupError);
        expect(upload).not.toHaveBeenCalled();
        expect(readNativeUnpackState(gl)).toEqual([4, 0, 0]);
        expect(UNPACK_PARAMETERS.map(parameter => tracker.cache[parameter])).toEqual([4, 0, 0]);
        expect(tracker.stateStack).toHaveLength(stackDepth);
        expect(gl.getParameter(GL.PIXEL_UNPACK_BUFFER_BINDING)).toBeNull();
        expect(gl.getParameter(GL.TEXTURE_BINDING_2D)).toBeNull();
      } finally {
        pixelStore.mockRestore();
      }
    }
  } finally {
    upload.mockRestore();
    tracker.enable = originalEnabled;
    UNPACK_PARAMETERS.forEach((parameter, index) =>
      gl.pixelStorei(parameter, original[index] as number)
    );
    texture.destroy();
    buffer.destroy();
  }
});

it.each([
  true,
  false
])('writeData clears a previously bound unpack buffer (tracking=%s)', async enabled => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const tracker = WebGLStateTracker.get(gl);
  const originalEnabled = tracker.enable;
  const texture = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});
  const data = new Uint8Array(16).fill(63);
  const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
  try {
    tracker.enable = enabled;
    gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, buffer.handle);
    texture.writeData(data);
    expect(gl.getParameter(GL.PIXEL_UNPACK_BUFFER_BINDING)).toBeNull();
    expect(Array.from(new Uint8Array(texture.readDataSyncWebGL()))).toEqual(Array.from(data));
  } finally {
    tracker.enable = originalEnabled;
    gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
    texture.destroy();
    buffer.destroy();
  }
});
