/* eslint-disable no-continue, max-depth */

import test from 'tape-promise/tape';
import {getWebGLTestDevice, getTestDevices} from '@luma.gl/test-utils';

import {
  TypedArray,
  Buffer,
  Device,
  Texture,
  TextureFormat,
  TextureReadOptions,
  TextureWriteOptions,
  textureFormatDecoder,
  VertexFormat,
  _getTextureFormatTable,
  TextureView,
  getTypedArrayConstructor
} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '@luma.gl/webgl';

import {SAMPLER_PARAMETERS} from './sampler.spec';

// Utility to compare TypedArray contents
function toUint8(arr: ArrayBuffer | ArrayBufferView): Uint8Array {
  return arr instanceof ArrayBuffer
    ? new Uint8Array(arr)
    : new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

test('Texture#createView returns a TextureView', async t => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 2});
    const view = tex.createView({});
    t.ok(view instanceof TextureView, `${device.type}: createView returns TextureView`);
    t.equal(
      view.texture.width,
      tex.width,
      `${device.type}: view.texture.width matches texture.width`
    );
    t.equal(
      view.texture.height,
      tex.height,
      `${device.type}: view.texture.height matches texture.height`
    );
    tex.destroy();
  }
  t.end();
});

test('Texture#clone overrides size', async t => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});

    const cloned = tex.clone({width: 4, height: 4});

    t.notEqual(cloned, tex, `${device.type}: clone returns a new texture`);
    t.equal(cloned.width, 4, `${device.type}: cloned width is overridden`);
    t.equal(cloned.height, 4, `${device.type}: cloned height is overridden`);
    t.equal(tex.width, 2, `${device.type}: original width unchanged`);
    t.equal(tex.height, 2, `${device.type}: original height unchanged`);

    tex.destroy();
    cloned.destroy();
  }
  t.end();
});

const RGBA8_DATA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const TEXTURE_UPLOAD_METHODS = ['writeData', 'copyImageData', 'writeBuffer'] as const;
type TextureUploadMethod = (typeof TEXTURE_UPLOAD_METHODS)[number];

function createRgbaUploadData(options: {
  width: number;
  height: number;
  depthOrArrayLayers?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
  byteOffset?: number;
  pixel: [number, number, number, number];
}): Uint8Array {
  const {
    width,
    height,
    depthOrArrayLayers = 1,
    bytesPerRow = width * 4,
    rowsPerImage = height,
    byteOffset = 0,
    pixel
  } = options;

  const data = new Uint8Array(byteOffset + bytesPerRow * rowsPerImage * depthOrArrayLayers);
  for (let layer = 0; layer < depthOrArrayLayers; layer++) {
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const offset =
          byteOffset + layer * rowsPerImage * bytesPerRow + row * bytesPerRow + column * 4;
        data.set(pixel, offset);
      }
    }
  }

  return data;
}

async function readTexturePixels(
  texture: Texture,
  options: TextureReadOptions
): Promise<Uint8Array> {
  const arrayBuffer = await texture.readDataAsync(options);
  const layout = texture.computeMemoryLayout(options);
  const width = options.width ?? texture.width;
  const height = options.height ?? texture.height;
  const depthOrArrayLayers = options.depthOrArrayLayers ?? 1;
  const rowByteLength = width * layout.bytesPerPixel;
  const compact = new Uint8Array(rowByteLength * height * depthOrArrayLayers);
  const source = toUint8(arrayBuffer);

  for (let layer = 0; layer < depthOrArrayLayers; layer++) {
    for (let row = 0; row < height; row++) {
      const sourceOffset =
        layer * layout.rowsPerImage * layout.bytesPerRow + row * layout.bytesPerRow;
      const destinationOffset = layer * height * rowByteLength + row * rowByteLength;
      compact.set(source.slice(sourceOffset, sourceOffset + rowByteLength), destinationOffset);
    }
  }

  return compact;
}

function createTextureWriteOptions(options: {
  width: number;
  height: number;
  depthOrArrayLayers?: number;
  mipLevel?: number;
  x?: number;
  y?: number;
  z?: number;
  byteOffset?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}): TextureWriteOptions {
  return {
    width: options.width,
    height: options.height,
    depthOrArrayLayers: options.depthOrArrayLayers,
    mipLevel: options.mipLevel,
    x: options.x,
    y: options.y,
    z: options.z,
    byteOffset: options.byteOffset,
    bytesPerRow: options.bytesPerRow,
    rowsPerImage: options.rowsPerImage
  };
}

function uploadTexture(
  device: Device,
  texture: Texture,
  method: TextureUploadMethod,
  data: Uint8Array,
  options: TextureWriteOptions
): Buffer | null {
  switch (method) {
    case 'writeData':
      texture.writeData(data, options);
      return null;

    case 'copyImageData':
      texture.copyImageData({data, ...options});
      return null;

    case 'writeBuffer':
      const buffer = device.createBuffer({data, usage: Buffer.COPY_SRC});
      texture.writeBuffer(buffer, options);
      return buffer;

    default:
      throw new Error(method);
  }
}

function captureWebGLTexSubImageCalls(device: Device): {
  calls: Array<{method: 'texSubImage2D' | 'texSubImage3D'; args: unknown[]}>;
  restore: () => void;
} | null {
  if (device.type !== 'webgl') {
    return null;
  }

  const gl = (device as WebGLDevice).gl;
  const calls: Array<{method: 'texSubImage2D' | 'texSubImage3D'; args: unknown[]}> = [];
  const originalTexSubImage2D = gl.texSubImage2D.bind(gl);
  const originalTexSubImage3D = gl.texSubImage3D.bind(gl);

  (gl as any).texSubImage2D = (...args: unknown[]) => {
    calls.push({method: 'texSubImage2D', args});
    return originalTexSubImage2D(...(args as Parameters<typeof gl.texSubImage2D>));
  };

  (gl as any).texSubImage3D = (...args: unknown[]) => {
    calls.push({method: 'texSubImage3D', args});
    return originalTexSubImage3D(...(args as Parameters<typeof gl.texSubImage3D>));
  };

  return {
    calls,
    restore: () => {
      (gl as any).texSubImage2D = originalTexSubImage2D;
      (gl as any).texSubImage3D = originalTexSubImage3D;
    }
  };
}

test('Texture#copyImageData updates correct cubemap face on WebGL', async t => {
  const device = await getWebGLTestDevice();
  if (!device) {
    t.comment('WebGL not available');
    t.end();
    return;
  }

  const tex = device.createTexture({
    dimension: 'cube',
    format: 'rgba8unorm',
    width: 1,
    height: 1
  });

  const gl = device.gl;
  const calls: number[] = [];
  const original = gl.texSubImage2D.bind(gl);
  (gl as any).texSubImage2D = function (target: number, ...args: any[]) {
    calls.push(target);
    return original(target, ...args);
  };

  const data = new Uint8Array([0, 0, 0, 0]);
  tex.copyImageData({data, z: 1});

  (gl as any).texSubImage2D = original;
  tex.destroy();

  t.equal(calls[0], GL.TEXTURE_CUBE_MAP_NEGATIVE_X, 'updates specified face');
  t.end();
});

test('Texture#copyImageData handles padded rows on WebGL', async t => {
  const device = await getWebGLTestDevice();
  if (!device) {
    t.comment('WebGL not available');
    t.end();
    return;
  }

  const width = 2;
  const height = 2;
  const bytesPerPixel = 4;
  const paddedBytesPerRow = 16;
  const paddedData = new Uint8Array(paddedBytesPerRow * height);
  const expected = new Uint8Array(width * height * bytesPerPixel);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const base = row * width + col;
      const r = base + 1;
      const g = base + 2;
      const b = base + 3;
      const a = base + 4;
      const expectedOffset = (row * width + col) * bytesPerPixel;
      expected[expectedOffset + 0] = r;
      expected[expectedOffset + 1] = g;
      expected[expectedOffset + 2] = b;
      expected[expectedOffset + 3] = a;

      const paddedOffset = row * paddedBytesPerRow + col * bytesPerPixel;
      paddedData[paddedOffset + 0] = r;
      paddedData[paddedOffset + 1] = g;
      paddedData[paddedOffset + 2] = b;
      paddedData[paddedOffset + 3] = a;
    }
  }

  const texture = device.createTexture({width, height, format: 'rgba8unorm'});
  texture.copyImageData({
    data: paddedData,
    width,
    height,
    bytesPerRow: paddedBytesPerRow,
    rowsPerImage: height
  });

  const result = toUint8(texture.readDataSyncWebGL({width, height})).slice(0, expected.length);

  t.deepEquals(result, expected, 'webgl: copyImageData uploads data with padded rows correctly');

  texture.destroy();
  t.end();
});

test('Texture#writeData & readDataAsync round-trip', async t => {
  for (const device of await getTestDevices()) {
    t.comment(`Testing ${device.type}`);

    const tex = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });

    tex.writeData(RGBA8_DATA);
    const arrayBuffer = await tex.readDataAsync();
    const result = toUint8(arrayBuffer).slice(0, RGBA8_DATA.length);

    t.deepEquals(
      result,
      RGBA8_DATA,
      `${device.type}: writeData + readDataAsync returns same pixels`
    );
    tex.destroy();
  }
  t.end();
});

test('Texture upload methods round-trip through full-level uploads', async t => {
  for (const device of await getTestDevices()) {
    for (const method of TEXTURE_UPLOAD_METHODS) {
      const texture = device.createTexture({
        width: 64,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const expected = createRgbaUploadData({
        width: 64,
        height: 1,
        pixel: [12, 34, 56, 255]
      });

      const uploadBuffer = uploadTexture(
        device,
        texture,
        method,
        expected,
        createTextureWriteOptions({width: 64, height: 1})
      );
      const result = await readTexturePixels(texture, {width: 64, height: 1});

      t.deepEquals(
        result,
        expected,
        `${device.type}: ${method} round-trips tightly packed full-level uploads`
      );

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  t.end();
});

test('Texture upload methods support lower mip uploads', async t => {
  for (const device of await getTestDevices()) {
    for (const method of TEXTURE_UPLOAD_METHODS) {
      const texture = device.createTexture({
        width: 4,
        height: 4,
        mipLevels: 2,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const expected = createRgbaUploadData({
        width: 2,
        height: 2,
        bytesPerRow: 256,
        rowsPerImage: 2,
        pixel: [90, 80, 70, 255]
      });
      const options = createTextureWriteOptions({
        width: 2,
        height: 2,
        mipLevel: 1,
        bytesPerRow: 256,
        rowsPerImage: 2
      });

      const webglCalls = captureWebGLTexSubImageCalls(device);
      const uploadBuffer = uploadTexture(device, texture, method, expected, options);

      if (device.type === 'webgl') {
        const call = webglCalls?.calls.at(-1);
        t.equal(
          call?.method,
          'texSubImage2D',
          `${device.type}: ${method} uses texSubImage2D for lower mip uploads`
        );
        t.equal(call?.args[1], 1, `${device.type}: ${method} targets mip level 1`);
        t.equal(call?.args[4], 2, `${device.type}: ${method} uploads mip-sized width`);
        t.equal(call?.args[5], 2, `${device.type}: ${method} uploads mip-sized height`);
      } else {
        const result = await readTexturePixels(texture, {width: 2, height: 2, mipLevel: 1});

        t.deepEquals(
          result,
          new Uint8Array([90, 80, 70, 255, 90, 80, 70, 255, 90, 80, 70, 255, 90, 80, 70, 255]),
          `${device.type}: ${method} uploads lower mip subresources using mip-sized extents`
        );
      }

      webglCalls?.restore();
      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  t.end();
});

test('Texture upload methods honor explicit byteOffset and bytesPerRow', async t => {
  for (const device of await getTestDevices()) {
    for (const method of TEXTURE_UPLOAD_METHODS) {
      const texture = device.createTexture({
        width: 2,
        height: 2,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const data = createRgbaUploadData({
        width: 2,
        height: 2,
        byteOffset: 4,
        bytesPerRow: 256,
        rowsPerImage: 2,
        pixel: [11, 22, 33, 255]
      });
      const options = createTextureWriteOptions({
        width: 2,
        height: 2,
        byteOffset: 4,
        bytesPerRow: 256,
        rowsPerImage: 2
      });

      const uploadBuffer = uploadTexture(device, texture, method, data, options);
      const result = await readTexturePixels(texture, {width: 2, height: 2});

      t.deepEquals(
        result,
        new Uint8Array([11, 22, 33, 255, 11, 22, 33, 255, 11, 22, 33, 255, 11, 22, 33, 255]),
        `${device.type}: ${method} honors byteOffset and padded rows`
      );

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  t.end();
});

test('Texture upload methods interpret byteOffset as bytes for typed array uploads', async t => {
  for (const device of await getTestDevices()) {
    if (!device.isTextureFormatSupported('rgba16uint')) {
      t.comment(`${device.type}: skipping rgba16uint byteOffset regression test`);
      continue;
    }

    for (const method of TEXTURE_UPLOAD_METHODS) {
      const texture = device.createTexture({
        width: 1,
        height: 1,
        format: 'rgba16uint',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const sourceData = new Uint16Array([10, 0, 0, 65535, 20, 0, 0, 65535, 30, 0, 0, 65535]);
      const options = createTextureWriteOptions({
        width: 1,
        height: 1,
        byteOffset: 8
      });

      let uploadBuffer: Buffer | null = null;
      switch (method) {
        case 'writeData':
          texture.writeData(sourceData, options);
          break;

        case 'copyImageData':
          texture.copyImageData({data: sourceData, ...options});
          break;

        case 'writeBuffer':
          uploadBuffer = device.createBuffer({data: sourceData, usage: Buffer.COPY_SRC});
          texture.writeBuffer(uploadBuffer, options);
          break;

        default:
          throw new Error(method);
      }

      const result = await readTexturePixels(texture, {width: 1, height: 1});
      const pixel = Array.from(new Uint16Array(result.buffer, result.byteOffset, 4));

      t.deepEquals(
        pixel,
        [20, 0, 0, 65535],
        `${device.type}: ${method} converts byteOffset to typed-array element offset`
      );

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  t.end();
});

test('Texture upload methods target cube faces and array layers consistently', async t => {
  for (const device of await getTestDevices()) {
    for (const method of TEXTURE_UPLOAD_METHODS) {
      const cubeTexture = device.createTexture({
        dimension: 'cube',
        width: 1,
        height: 1,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const cubeData = createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [7, 8, 9, 255]
      });
      const cubeOptions = createTextureWriteOptions({
        width: 1,
        height: 1,
        z: 5,
        bytesPerRow: 256
      });

      const cubeCalls = captureWebGLTexSubImageCalls(device);
      const cubeUploadBuffer = uploadTexture(device, cubeTexture, method, cubeData, cubeOptions);

      if (device.type === 'webgl') {
        const cubeCall = cubeCalls?.calls.at(-1);
        t.equal(
          cubeCall?.method,
          'texSubImage2D',
          `${device.type}: ${method} uses texSubImage2D for cube uploads`
        );
        t.equal(
          cubeCall?.args[0],
          GL.TEXTURE_CUBE_MAP_NEGATIVE_Z,
          `${device.type}: ${method} targets the requested cube face`
        );
      } else {
        const cubePixels = await readTexturePixels(cubeTexture, {
          width: 1,
          height: 1,
          z: 5,
          depthOrArrayLayers: 1
        });

        t.deepEquals(
          cubePixels,
          new Uint8Array([7, 8, 9, 255]),
          `${device.type}: ${method} targets the requested cube face`
        );
      }

      cubeCalls?.restore();
      cubeUploadBuffer?.destroy();
      cubeTexture.destroy();

      const arrayTexture = device.createTexture({
        dimension: '2d-array',
        width: 1,
        height: 1,
        depth: 2,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const arrayData = createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [21, 22, 23, 255]
      });
      const arrayOptions = createTextureWriteOptions({
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1,
        bytesPerRow: 256
      });

      const arrayCalls = captureWebGLTexSubImageCalls(device);
      const arrayUploadBuffer = uploadTexture(
        device,
        arrayTexture,
        method,
        arrayData,
        arrayOptions
      );

      if (device.type === 'webgl') {
        const arrayCall = arrayCalls?.calls.at(-1);
        t.equal(
          arrayCall?.method,
          'texSubImage3D',
          `${device.type}: ${method} uses texSubImage3D for array uploads`
        );
        t.equal(arrayCall?.args[4], 1, `${device.type}: ${method} targets array layer 1`);
        t.equal(arrayCall?.args[7], 1, `${device.type}: ${method} uploads one array layer`);
      } else {
        const arrayPixels = await readTexturePixels(arrayTexture, {
          width: 1,
          height: 1,
          z: 1,
          depthOrArrayLayers: 1
        });

        t.deepEquals(
          arrayPixels,
          new Uint8Array([21, 22, 23, 255]),
          `${device.type}: ${method} targets the requested array layer`
        );
      }

      arrayCalls?.restore();
      arrayUploadBuffer?.destroy();
      arrayTexture.destroy();
    }
  }

  t.end();
});

test('Texture#copyExternalImage uploads image data on both backends', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC | Texture.RENDER
    });
    const image = new ImageData(new Uint8ClampedArray([1, 2, 3, 255, 5, 6, 7, 255]), 2, 1);

    texture.copyExternalImage({image});
    const result = await readTexturePixels(texture, {width: 2, height: 1});

    t.deepEquals(
      result,
      new Uint8Array([1, 2, 3, 255, 5, 6, 7, 255]),
      `${device.type}: copyExternalImage uploads pixel data`
    );

    texture.destroy();
  }

  t.end();
});

test('Texture#copyImageData is a compatibility wrapper over writeData', async t => {
  for (const device of await getTestDevices()) {
    const writeDataTexture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    const copyImageDataTexture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    const data = createRgbaUploadData({
      width: 2,
      height: 2,
      byteOffset: 4,
      bytesPerRow: 256,
      rowsPerImage: 2,
      pixel: [101, 102, 103, 255]
    });
    const options = createTextureWriteOptions({
      width: 2,
      height: 2,
      byteOffset: 4,
      bytesPerRow: 256,
      rowsPerImage: 2
    });

    writeDataTexture.writeData(data, options);
    copyImageDataTexture.copyImageData({data, ...options});

    const writeDataPixels = await readTexturePixels(writeDataTexture, {width: 2, height: 2});
    const copyImageDataPixels = await readTexturePixels(copyImageDataTexture, {
      width: 2,
      height: 2
    });

    t.deepEquals(
      copyImageDataPixels,
      writeDataPixels,
      `${device.type}: copyImageData matches writeData for equivalent uploads`
    );

    writeDataTexture.destroy();
    copyImageDataTexture.destroy();
  }

  t.end();
});

test('Texture#writeData rejects invalid row layout', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });

    t.throws(
      () =>
        texture.writeData(new Uint8Array(8), {
          width: 2,
          height: 2,
          bytesPerRow: 4,
          rowsPerImage: 2
        }),
      /bytesPerRow/,
      `${device.type}: writeData rejects bytesPerRow smaller than the write width`
    );

    texture.destroy();
  }

  t.end();
});

test('Texture#writeData & readDataAsync round-trip for all formats and dimensions', async t => {
  for (const device of await getTestDevices()) {
    t.comment(`Testing device: ${device.type}`);
    const formatTable = _getTextureFormatTable(device);
    const formats: TextureFormat[] = Object.keys(formatTable) as TextureFormat[];

    for (const format of formats) {
      const info = device.getTextureFormatInfo(format);

      const skipFormat =
        // While ES 3.0 theoretically allows this, WebGL2 validation is stricter
        // and some implementations reject RGB reads. The most portable fix is to
        // read as RGBA/UNSIGNED_BYTE (alpha will come back as 255).
        // Alternatively, avoid RGB attachments altogether and use RGBA8.
        info.channels === 'rgb' ||
        // WebGL does not support BGRA
        (device.type === 'webgl' && format.startsWith('bgra')) ||
        // WebGL has assymetric read/write support for half floats
        info.dataType === 'float16' ||
        info.packed ||
        info.attachment !== 'color' ||
        (device.type === 'webgpu' && format.includes('16'));
      if (skipFormat) {
        continue;
      }

      if (!device.isTextureFormatRenderable(format)) {
        t.comment(`Skipping unrenderable format ${format}`);
        continue;
      }

      // Loop over supported dimensions
      for (const dimension of ['2d', '3d'] as const) {
        // TODO - fix bigger read buffer needed bug
        if (dimension === '3d' && device.type === 'webgl') continue;

        // Pick small, fixed size
        const texSize = {
          // '1d': {width: 8},
          '2d': {width: 4, height: 2},
          '3d': {width: 2, height: 2, depthOrArrayLayers: 2}
        }[dimension];

        const tex = device.createTexture({
          ...texSize,
          dimension,
          format,
          usage: Texture.COPY_SRC | Texture.COPY_DST
        });

        const {byteLength, bytesPerRow} = tex.computeMemoryLayout();
        const ArrayType = getTypedArrayConstructor(info.dataType);
        const arraySize = byteLength / ArrayType.BYTES_PER_ELEMENT;
        const input = new ArrayType(arraySize);
        for (let i = 0; i < texSize.height; i++)
          for (let j = 0; j < texSize.width; j++)
            input[i * bytesPerRow + j * info.components] = (i + j) % 251;

        try {
          tex.writeData(input);
          const outputBuffer = await tex.readDataAsync();
          const output = new ArrayType(outputBuffer).slice(0, input.length);

          const match =
            ArrayType === Float32Array ? almostEqual(output, input) : deepEqual(output, input);

          if (!match) {
            // eslint-disable-next-line no-debugger
            debugger;
          }
          t.ok(match, `${device.type} ${format} ${dimension} round-trip succeeded`);
        } catch (err) {
          t.fail(`${device.type} ${format} ${dimension} round-trip failed: ${err.message}`);
        }

        tex.destroy();
      }
    }
  }

  t.end();
});

function deepEqual(a: TypedArray, b: TypedArray): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function almostEqual(a: Float32Array, b: Float32Array, epsilon = 1e-6): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > epsilon) return false;
  }
  return true;
}

test.skip('Texture#copyImageData & readDataAsync round-trip', async t => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
    tex.copyImageData({data: RGBA8_DATA});
    const buffer = await tex.readDataAsync({});
    const result = toUint8(buffer).slice(0, RGBA8_DATA.length);
    t.deepEquals(
      result,
      RGBA8_DATA,
      `${device.type}: copyImageData + readDataAsync returns same pixels`
    );
    tex.destroy();
  }
  t.end();
});

test.skip('Texture#writeBuffer & readDataAsync round-trip', async t => {
  for (const device of await getTestDevices()) {
    const width = 2;
    const height = 1;
    const bytesPerRow = width * 4;
    const bufferSize = bytesPerRow * height;
    const upload = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
      mappedAtCreation: true
    });
    new Uint8Array(upload.getMappedRange()).set(RGBA8_DATA);
    upload.unmap();

    const tex = device.createTexture({width, height, format: 'rgba8unorm'});
    tex.writeBuffer(upload, {});
    const data = await tex.readDataAsync({});
    const result = toUint8(data);
    t.deepEquals(
      result,
      RGBA8_DATA,
      `${device.type}: writeBuffer + readDataAsync returns same pixels`
    );
    upload.destroy();
    tex.destroy();
  }
  t.end();
});

test.skip('Texture#readBuffer & Buffer.readAsync round-trip', async t => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
    // initialize via writeData
    tex.writeData(RGBA8_DATA, {});
    const buf = tex.readBuffer({});
    const arr = await buf.readAsync();
    const result = toUint8(arr);
    t.deepEquals(
      result,
      RGBA8_DATA,
      `${device.type}: readBuffer + Buffer.readAsync returns same pixels`
    );
    tex.destroy();
  }
  t.end();
});

test('Texture#readDataSyncWebGL returns correct data on WebGL', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device instanceof WebGLDevice) {
      const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
      tex.writeData(RGBA8_DATA, {});
      const syncData = tex.readDataSyncWebGL({});
      const result = toUint8(syncData);
      t.deepEquals(result, RGBA8_DATA, `webgl: readDataSyncWebGL returns same pixels`);
      tex.destroy();
    }
  }
  t.end();
});

// //////////////////////////////

test('Device#isTextureFormatSupported()', async t => {
  const UNSUPPORTED_FORMATS: Record<string, TextureFormat[]> = {
    webgl: [],
    webgpu: ['rgb32float-webgl']
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatSupported(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: unsupported formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Device#isTextureFormatFilterable()', async t => {
  const UNSUPPORTED_FORMATS: Record<Device['type'], TextureFormat[]> = {
    webgl: ['rgba8unorm', 'r32float', 'rg32float', 'rgb32float-webgl', 'rgba32float'],
    webgpu: []
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatFilterable(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: Unfilterable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Device#isTextureFormatRenderable()', async t => {
  const UNSUPPORTED_FORMATS: Record<Device['type'], TextureFormat[]> = {
    webgl: ['rgba8unorm', 'r32float', 'rg32float', 'rgb32float-webgl', 'rgba32float'],
    webgpu: []
  };

  for (const device of await getTestDevices()) {
    const unSupportedFormats: TextureFormat[] = [];
    UNSUPPORTED_FORMATS[device.type].forEach(format => {
      if (!device.isTextureFormatRenderable(format)) {
        unSupportedFormats.push(format);
      }
    });

    unSupportedFormats.sort();
    const expected = UNSUPPORTED_FORMATS[device.type].sort();
    t.ok(
      unSupportedFormats.every(format => expected.includes(format)),
      `${device.type}: Unrenderable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    );
  }

  t.end();
});

test('Texture#construct/delete', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({width: 1, height: 1});
    t.ok(texture instanceof Texture, 'Texture construction successful');
    texture.destroy();
    t.ok(texture instanceof Texture, 'Texture delete successful');
    texture.destroy();
    t.ok(texture instanceof Texture, 'Texture repeated delete successful');
  }
  t.end();
});

test('Texture#depth/stencil formats', async t => {
  const DEPTH_STENCIL_FORMATS = ['depth16unorm', 'depth24plus', 'depth24plus-stencil8'];
  for (const device of await getTestDevices()) {
    for (const key of DEPTH_STENCIL_FORMATS) {
      const format = key as TextureFormat;
      t.ok(device.isTextureFormatSupported(format), `${device.type} ${format} is supported`);
      t.notOk(
        device.isTextureFormatFilterable(format),
        `${device.type} ${format} is not filterable`
      );
      const texture = device.createTexture({format, width: 1, height: 1});
      t.ok(texture instanceof Texture, `Texture ${format} construction successful`);
    }
  }
  t.end();
});

test('Texture#format simple creation', async t => {
  for (const device of await getTestDevices()) {
    for (const key of Object.keys(_getTextureFormatTable)) {
      const formatName = key as TextureFormat;
      if (['stencil8'].includes(formatName)) {
        continue;
      }

      if (device.isTextureFormatSupported(formatName)) {
        // For compressed textures there may be a block size that we need to be a multiple of
        const decodedFormat = textureFormatDecoder.getInfo(formatName);
        const width = decodedFormat.blockWidth ?? 4;
        const height = decodedFormat.blockHeight ?? 4;

        let texture: Texture;
        t.doesNotThrow(() => {
          texture = device.createTexture({
            format: formatName,
            height,
            width
          });
        }, `Texture(${device.type},${formatName}) creation OK`);

        t.equals(texture.format, formatName, `Texture(${device.type},${formatName}).format OK`);
        texture.destroy();
      }
    }
  }
  t.end();
});

const DEFAULT_TEXTURE_DATA = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
const DATA = [1, 0.5, 0.25, 0.125];
const TEXTURE_DATA = {
  uint8: new Uint8Array(DATA),
  sint8: new Int8Array(DATA),
  uint16: new Uint16Array(DATA),
  sint16: new Int16Array(DATA),
  uint32: new Uint32Array(DATA),
  sint32: new Int32Array(DATA),
  // [GL.UNSIGNED_SHORT_5_6_5]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  // [GL.UNSIGNED_SHORT_4_4_4_4]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  // [GL.UNSIGNED_SHORT_5_5_5_1]: UINT16_DATA, // RGB_TO[GL.UNSIGNED_SHORT_5_6_5](DATA))
  float16: new Uint16Array(DATA),
  float32: new Float32Array(DATA)
} as const satisfies Partial<Record<VertexFormat, TypedArray>>;

// const RGB_TO = {
//   [GL.UNSIGNED_BYTE]: (r, g, b) => [r * 256, g * 256, b * 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: (r, g, b) => r * 32 << 11 + g * 64 << 6 + b * 32
// };
// const RGB_FROM = {
//   [GL.UNSIGNED_BYTE]: v => [v[0] / 256, v[1] / 256, v[2] / 256],
//   [GL.UNSIGNED_SHORT_5_6_5]: v => [v >> 11 / 32, v >> 6 % 64 / 64, v % 32 * 32]
// };

function testFormatCreation(t, device: Device, withData: boolean = false) {
  for (const [formatName] of Object.entries(_getTextureFormatTable)) {
    const format = formatName as TextureFormat;

    const decodedFormat = textureFormatDecoder.getInfo(format);
    const {dataType, packed, bitsPerChannel} = decodedFormat;

    // WebGPU texture can currently only be set from 8 bit data
    const notImplemented = device.type === 'webgpu' && bitsPerChannel !== 8;
    // console.log(formatName, bitsPerChannel);
    if (['stencil8'].includes(formatName) || notImplemented) {
      continue;
    }

    const canGenerateMipmaps = format === 'rgba8unorm';
    // device.isTextureFormatSupported(format) && !device.isTextureFormatCompressed(format);
    if (canGenerateMipmaps) {
      try {
        const data = withData && !packed ? TEXTURE_DATA[dataType] || DEFAULT_TEXTURE_DATA : null;

        const capabilities = device.getTextureFormatCapabilities(format);
        const mipmaps = capabilities.render && capabilities.filter;

        const sampler = mipmaps
          ? {
              magFilter: 'linear',
              minFilter: 'linear',
              addressModeU: 'clamp-to-edge',
              addressModeW: 'clamp-to-edge'
            }
          : {};

        const texture = device.createTexture({
          data,
          format,
          width: 1,
          height: 1,
          mipmaps,
          sampler
        });
        t.equals(
          texture.props.format,
          format,
          `Texture(${device.type},${format}) created with mipmaps=${mipmaps}`
        );
        texture.destroy();
      } catch (error) {
        t.comment(`Texture(${device.type},${format}) creation FAILED ${error}`);
      }
    } else {
      t.comment(`Texture(${device.type},${format}) not supported`);
    }
  }
}

// test.skip('Texture#format creation', async t => {
//   for (const device of await getTestDevices()) {
//     testFormatCreation(t, device);
//   }
//   t.end();
// });

test('Texture#format creation with data', async t => {
  for (const device of await getTestDevices()) {
    testFormatCreation(t, device, true);
  }
  t.end();
});

test('Texture#dimension=3d,format=r32float', async t => {
  for (const device of await getTestDevices()) {
    if (device.info.type === 'webgpu') {
      // TODO validation fails due to insufficient texture layers?
      continue;
    }
    const texture = device.createTexture({
      id: '3d-texture',
      width: 16,
      height: 16,
      depth: 16,
      dimension: '3d',
      format: 'r32float',
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge'
      }
    });
    t.ok(texture, `${device.type}: Texture(dimension=3d,format=r32float) created`);
    t.end();
  }
});

test('Texture#copyExternalImage', async t => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm'
    });

    if (device.info.type === 'webgl') {
      const webglDevice = device as WebGLDevice;
      t.deepEquals(
        webglDevice.readPixelsToArrayWebGL(texture),
        new Uint8Array(8),
        `${device.info.type} Pixels are initially empty`
      );
    }

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;

      // Full copy
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 2, 1);
      texture.copyExternalImage({image: canvas});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255]),
          `${device.info.type} Pixels were set correctly (full image)`
        );
      }

      // Subimage copy
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 2, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 0, 0, 0, 255]),
          `${device.info.type} Pixels were set correctly (sub image)`
        );
      }

      // Subimage copy (smaller canvas)
      canvas.width = 1;
      canvas.height = 1;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, 1, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        t.deepEquals(
          device.readPixelsToArrayWebGL(texture),
          new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
          `${device.info.type} Pixels were set correctly (sub image small canvas)`
        );
      }
    }

    if (device.info.type !== 'webgl') {
      t.pass('WebGPU copyExternalImage test cannot yet read pixels');
    }
  }

  t.end();
});

test.skip('Texture#setImageData', async t => {
  const webglDevice = await getWebGLTestDevice();

  const texture = webglDevice.createTexture({
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmaps: false
  });
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  const data = new Float32Array([0.1, 0.2, -3, -2, 0, 0.5, 128, 255]);
  texture.copyExternalImage({data});
  t.deepEquals(readPixelsToArray(texture), data, 'Pixels are set correctly');
  t.end();
});

test.skip('WebGL2#Texture setSubImageData', async t => {
  let data;

  // data: null
  const texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmaps: false
  });
  t.deepEquals(readPixelsToArray(texture), new Float32Array(8), 'Pixels are empty');

  // data: typed array
  data = new Float32Array([0.1, 0.2, -3, -2]);
  texture.setSubImageData({data, x: 0, y: 0, width: 1, height: 1});
  t.deepEquals(
    readPixelsToArray(texture),
    new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 0]),
    'Pixels are set correctly'
  );

  // data: buffer
  data = new Float32Array([-3, 255, 128, 3.333]);
  const buffer = webglDevice.createByffer({data, accessor: {size: 4, type: GL.FLOAT}});
  texture.setSubImageData({data: buffer, x: 1, y: 0, width: 1, height: 1});
  t.deepEquals(
    readPixelsToArray(texture),
    new Float32Array([0.1, 0.2, -3, -2, -3, 255, 128, 3.333]),
    'Pixels are set correctly'
  );

  // data: canvas
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 1, 1);
    texture.setSubImageData({data: canvas, x: 1, y: 0, width: 1, height: 1});
    t.deepEquals(
      readPixelsToArray(texture),
      new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 1]),
      'Pixels are set correctly'
    );
  }

  t.end();
});

// NON-2D TEXTURES

test('Texture(dimension)#construct/delete', async t => {
  for (const device of await getTestDevices()) {
    for (const dimension of ['3d', '2d-array', 'cube']) {
      const texture = device.createTexture({dimension, width: 1, height: 1});
      t.equal(texture.dimension, dimension, `${device.info.type} Texture construction successful`);
      t.equal(
        texture.view.props.dimension,
        dimension,
        `${device.info.type} Texture view construction successful`
      );
      texture.destroy();
    }
  }

  t.end();
});

test.skip('Texture#buffer update', async t => {
  let texture = webglDevice.createTexture({width: 1, height: 1});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  texture = texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

// CUBE TEXTURES

test.skip('WebGL#TextureCube construct/delete', async t => {
  t.throws(
    // @ts-expect-error
    () => new TextureCube(),
    /.*WebGLRenderingContext.*/,
    'TextureCube throws on missing gl context'
  );

  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  // t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube repeated delete successful');

  t.end();
});

test.skip('WebGL#TextureCube buffer update', async t => {
  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  texture.destroy();
  t.ok(texture instanceof Texture, 'TextureCube delete successful');

  t.end();
});

test.skip('WebGL#TextureCube multiple LODs', async t => {
  const texture = webglDevice.createTexture(
    {dimension: 'cube', width: 1, height: 1},
    {
      pixels: {
        [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: [],
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: [],
        [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: [],
        [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: []
      }
    }
  );
  t.ok(texture instanceof Texture, 'TextureCube construction successful');

  t.end();
});

// 3D TEXTURES

test.skip('WebGL#Texture3D construct/delete', async t => {
  t.throws(
    () => webglDevice.createTexture({dimension: '3d', width: 1, height: 1}),
    'Texture3D throws on missing gl context'
  );

  // TODO(Tarek): generating mipmaps on an empty 3D texture seems to trigger an INVALID_OPERATION
  //    error. See if this is expected behaviour.
  /*
  let texture = new Texture3D(gl);
  t.ok(texture instanceof Texture3D, 'Texture3D construction successful');
  texture.destroy();

  gl.getError(); // Reset error

  texture = new Texture3D(gl, {
    width: 4,
    height: 4,
    depth: 4,
    data: new Uint8Array(4 * 4 * 4),
    format: gl.RED,
    dataFormat: gl.R8
  });

  t.ok(gl.getError() === gl.NO_ERROR, 'Texture3D construction with array produces no errors');

  texture.destroy();
  t.ok(!gl.isTexture(texture.handle), `Texture GL object was deleted`);
  t.ok(texture instanceof Texture3D, 'Texture3D delete successful');

  const buffer = new Buffer(gl, new Uint8Array(4 * 4 * 4));

  texture = new Texture3D(gl, {
    width: 4,
    height: 4,
    depth: 4,
    data: buffer,
    format: gl.RED,
    dataFormat: gl.R8
  });

  t.ok(gl.getError() === gl.NO_ERROR, 'Texture3D construction with buffer produces no errors');

  texture.destroy();
  buffer.destroy();
  */

  t.end();
});

test.skip('Texture#setParameters', async t => {
  const texture = webglDevice.createTexture({width: 1, height: 1});
  t.ok(texture instanceof Texture, 'Texture construction successful');

  testSamplerParameters({t, texture, sampler: SAMPLER_PARAMETERS});

  /*
  // Bad tests
  const parameter = GL.TEXTURE_MAG_FILTER;
  const value = GL.LINEAR_MIPMAP_LINEAR;
  texture.setParameters({
    [parameter]: value
  });
  const newValue = getParameter(texture, GL.TEXTURE_MAG_FILTER);
  t.equals(newValue, value,
    `Texture.setParameters({[${device.getGLKey(parameter)}]: ${device.getGLKey(value)}})`);
  */

  texture.destroy();
  t.ok(texture instanceof Texture, 'Texture delete successful');

  t.end();
});

// Move to engine

test.skip('WebGL2#Texture generateMipmap', async t => {
  let texture = webglDevice.createTexture({
    data: null,
    width: 3,
    height: 3,
    mipmaps: false
  });

  texture.generateMipmap();
  t.notOk(texture.mipmaps, 'Should not turn on mipmaps for NPOT.');

  texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: false
  });

  texture.generateMipmap();
  t.ok(texture.mipmaps, 'Should turn on mipmaps for POT.');

  t.end();
});
