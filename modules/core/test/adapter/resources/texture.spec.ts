/* eslint-disable no-continue, max-depth */

import {expect, it} from 'vitest';
import {
  getNullTestDevice,
  getWebGLTestDevice,
  getTestDevices,
  getWebGPUTestDevice
} from '@luma.gl/test-utils';

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
import {GL} from '@luma.gl/webgl/constants';
import {WebGLDevice} from '@luma.gl/webgl';

import {SAMPLER_PARAMETERS} from './sampler.spec';

// Utility to compare TypedArray contents
function toUint8(arr: ArrayBuffer | ArrayBufferView): Uint8Array {
  return arr instanceof ArrayBuffer
    ? new Uint8Array(arr)
    : new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

it('Texture#createView returns a TextureView', async () => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 2});
    const view = tex.createView({});
    expect(
      Boolean(view instanceof TextureView),
      `${device.type}: createView returns TextureView`
    ).toBe(true);
    expect(view.texture.width, `${device.type}: view.texture.width matches texture.width`).toBe(
      tex.width
    );
    expect(view.texture.height, `${device.type}: view.texture.height matches texture.height`).toBe(
      tex.height
    );
    tex.destroy();
  }
  void 0;
});

it('Texture#clone overrides size', async () => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({format: 'rgba8unorm', width: 2, height: 2});

    const cloned = tex.clone({width: 4, height: 4});

    expect(cloned, `${device.type}: clone returns a new texture`).not.toBe(tex);
    expect(cloned.width, `${device.type}: cloned width is overridden`).toBe(4);
    expect(cloned.height, `${device.type}: cloned height is overridden`).toBe(4);
    expect(tex.width, `${device.type}: original width unchanged`).toBe(2);
    expect(tex.height, `${device.type}: original height unchanged`).toBe(2);

    tex.destroy();
    cloned.destroy();
  }
  void 0;
});

it('Texture#copyElementImage returns copied size on supported implementations', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({width: 2, height: 2});
  const copiedSize = texture.copyElementImage({
    element: {} as Element,
    width: 2,
    height: 2
  });

  expect(copiedSize, 'copyElementImage returns copied size').toEqual({width: 2, height: 2});

  texture.destroy();
  void 0;
});

function getTextureMemoryStats(device: Device): {
  gpuMemory: number;
  textureMemory: number;
  externalTextureMemory: number;
} {
  const stats = device.statsManager.getStats('GPU Time and Memory');
  return {
    gpuMemory: stats.get('GPU Memory').count,
    textureMemory: stats.get('Texture Memory').count,
    externalTextureMemory: stats.get('External Texture Memory').count
  };
}

function getTextureResourceCountStats(device: Device): {
  texturesCreated: number;
  textureViewsCreated: number;
} {
  const stats = device.statsManager.getStats('GPU Resource Counts');
  return {
    texturesCreated: stats.get('Textures Created').count,
    textureViewsCreated: stats.get('TextureViews Created').count
  };
}

function getExpectedTextureAllocation(texture: Texture): number {
  let expectedAllocation = 0;

  for (let mipLevel = 0; mipLevel < texture.mipLevels; mipLevel++) {
    const width = Math.max(1, texture.width >> mipLevel);
    const height = texture.baseDimension === '1d' ? 1 : Math.max(1, texture.height >> mipLevel);
    const depthOrArrayLayers =
      texture.dimension === '3d' ? Math.max(1, texture.depth >> mipLevel) : texture.depth;

    expectedAllocation += textureFormatDecoder.computeMemoryLayout({
      format: texture.format,
      width,
      height,
      depth: depthOrArrayLayers,
      byteAlignment: 1
    }).byteLength;
  }

  return expectedAllocation * texture.samples;
}

it('Texture tracks GPU memory stats', async () => {
  for (const device of await getTestDevices(['webgl', 'webgpu', 'null'])) {
    const beforeStats = getTextureMemoryStats(device);
    const texture = device.createTexture({
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      mipLevels: 3
    });
    const expectedAllocation = getExpectedTextureAllocation(texture);
    const afterCreateStats = getTextureMemoryStats(device);

    expect(
      afterCreateStats.gpuMemory - beforeStats.gpuMemory,
      `${device.type} Texture updates total GPU Memory`
    ).toBe(expectedAllocation);
    expect(
      afterCreateStats.textureMemory - beforeStats.textureMemory,
      `${device.type} Texture updates Texture Memory`
    ).toBe(expectedAllocation);

    texture.destroy();

    const afterDestroyStats = getTextureMemoryStats(device);
    expect(
      afterDestroyStats.gpuMemory,
      `${device.type} Texture destroy restores total GPU Memory`
    ).toBe(beforeStats.gpuMemory);
    expect(
      afterDestroyStats.textureMemory,
      `${device.type} Texture destroy restores Texture Memory`
    ).toBe(beforeStats.textureMemory);
  }
  void 0;
});

it('Handle-backed Texture tracks external memory stats', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const beforeStats = getTextureMemoryStats(device);
  const handle = device.handle.createTexture({
    size: {width: 4, height: 4, depthOrArrayLayers: 1},
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    dimension: '2d',
    format: 'rgba8unorm',
    mipLevelCount: 1,
    sampleCount: 1
  });

  const texture = device.createTexture({
    handle,
    format: 'rgba8unorm',
    width: 4,
    height: 4
  });
  const afterCreateStats = getTextureMemoryStats(device);
  const expectedAllocation = getExpectedTextureAllocation(texture);

  expect(
    afterCreateStats.gpuMemory - beforeStats.gpuMemory,
    'webgpu handle-backed Texture updates total GPU Memory'
  ).toBe(expectedAllocation);
  expect(
    afterCreateStats.textureMemory - beforeStats.textureMemory,
    'webgpu handle-backed Texture does not update owned Texture Memory'
  ).toBe(0);
  expect(
    afterCreateStats.externalTextureMemory - beforeStats.externalTextureMemory,
    'webgpu handle-backed Texture updates External Texture Memory'
  ).toBe(expectedAllocation);

  texture.destroy();

  const afterDestroyStats = getTextureMemoryStats(device);
  expect(
    afterDestroyStats.gpuMemory,
    'webgpu handle-backed Texture destroy restores total GPU Memory'
  ).toBe(beforeStats.gpuMemory);
  expect(
    afterDestroyStats.externalTextureMemory,
    'webgpu handle-backed Texture destroy restores External Texture Memory'
  ).toBe(beforeStats.externalTextureMemory);

  handle.destroy();
  void 0;
});

it('WebGPU handle-backed Texture reinitialize updates external memory stats', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const beforeStats = getTextureMemoryStats(device);
  const firstHandle = device.handle.createTexture({
    size: {width: 4, height: 4, depthOrArrayLayers: 1},
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    dimension: '2d',
    format: 'rgba8unorm',
    mipLevelCount: 1,
    sampleCount: 1
  });
  const secondHandle = device.handle.createTexture({
    size: {width: 8, height: 8, depthOrArrayLayers: 1},
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    dimension: '2d',
    format: 'rgba8unorm',
    mipLevelCount: 1,
    sampleCount: 1
  });

  const texture = device.createTexture({
    handle: firstHandle,
    format: 'rgba8unorm',
    width: 4,
    height: 4
  }) as any;
  const afterCreateStats = getTextureMemoryStats(device);
  const afterCreateResourceStats = getTextureResourceCountStats(device);
  const initialAllocation = getExpectedTextureAllocation(texture);

  texture._reinitialize(secondHandle, {
    handle: secondHandle,
    format: 'rgba8unorm',
    width: 8,
    height: 8
  });
  const afterReinitializeStats = getTextureMemoryStats(device);
  const afterReinitializeResourceStats = getTextureResourceCountStats(device);
  const resizedAllocation = getExpectedTextureAllocation(texture);

  expect(
    afterCreateStats.externalTextureMemory - beforeStats.externalTextureMemory,
    'webgpu handle-backed Texture initially tracks external memory'
  ).toBe(initialAllocation);
  expect(
    afterReinitializeStats.externalTextureMemory - beforeStats.externalTextureMemory,
    'webgpu handle-backed Texture reinitialize updates external memory'
  ).toBe(resizedAllocation);
  expect(
    afterReinitializeResourceStats.texturesCreated,
    'webgpu handle-backed Texture reinitialize does not increment Textures Created'
  ).toBe(afterCreateResourceStats.texturesCreated);
  expect(
    afterReinitializeResourceStats.textureViewsCreated,
    'webgpu handle-backed Texture reinitialize does not increment TextureViews Created'
  ).toBe(afterCreateResourceStats.textureViewsCreated);

  texture.destroy();

  const afterDestroyStats = getTextureMemoryStats(device);
  expect(
    afterDestroyStats.externalTextureMemory,
    'webgpu handle-backed Texture destroy restores external memory after reinitialize'
  ).toBe(beforeStats.externalTextureMemory);

  firstHandle.destroy();
  secondHandle.destroy();
  void 0;
});

it('WebGPU Texture reuses the shared default sampler when sampler is omitted', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const firstTextureWithoutSampler = device.createTexture({width: 4, height: 4});
  const secondTextureWithoutSampler = device.createTexture({width: 4, height: 4});
  const sharedSampler = firstTextureWithoutSampler.sampler;

  expect(
    secondTextureWithoutSampler.sampler,
    'webgpu textures without sampler props reuse the shared default sampler'
  ).toBe(sharedSampler);

  firstTextureWithoutSampler.destroy();
  expect(
    Boolean(sharedSampler.destroyed),
    'webgpu shared default sampler remains alive after texture destroy'
  ).toBe(false);
  expect(
    secondTextureWithoutSampler.sampler,
    'webgpu remaining texture still references the shared default sampler'
  ).toBe(sharedSampler);

  const textureWithSamplerProps = device.createTexture({
    width: 4,
    height: 4,
    sampler: {}
  });
  expect(
    textureWithSamplerProps.sampler,
    'webgpu explicit sampler props create a dedicated sampler'
  ).not.toBe(sharedSampler);

  const explicitSampler = device.createSampler({
    minFilter: 'nearest',
    magFilter: 'nearest'
  });
  const textureWithExplicitSampler = device.createTexture({
    width: 4,
    height: 4,
    sampler: explicitSampler
  });
  expect(
    textureWithExplicitSampler.sampler,
    'webgpu explicit sampler instance is used unchanged'
  ).toBe(explicitSampler);

  textureWithExplicitSampler.destroy();
  expect(
    Boolean(explicitSampler.destroyed),
    'webgpu explicit sampler instance is not destroyed with texture'
  ).toBe(false);

  secondTextureWithoutSampler.destroy();
  textureWithSamplerProps.destroy();
  explicitSampler.destroy();
  void 0;
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

function createLayeredRgbaUploadData(options: {
  width: number;
  height: number;
  pixels: Array<[number, number, number, number]>;
  bytesPerRow?: number;
  rowsPerImage?: number;
  byteOffset?: number;
}): Uint8Array {
  const {
    width,
    height,
    pixels,
    bytesPerRow = width * 4,
    rowsPerImage = height,
    byteOffset = 0
  } = options;

  const data = new Uint8Array(byteOffset + bytesPerRow * rowsPerImage * pixels.length);
  for (let layerIndex = 0; layerIndex < pixels.length; layerIndex++) {
    const layerData = createRgbaUploadData({
      width,
      height,
      bytesPerRow,
      rowsPerImage,
      byteOffset,
      pixel: pixels[layerIndex]
    });
    const layerByteOffset = layerIndex * rowsPerImage * bytesPerRow;
    data.set(
      layerData.subarray(byteOffset, byteOffset + rowsPerImage * bytesPerRow),
      layerByteOffset
    );
  }

  return data;
}

function repeatRgbaPixel(pixel: [number, number, number, number], texelCount: number): Uint8Array {
  const data = new Uint8Array(texelCount * 4);
  for (let texelIndex = 0; texelIndex < texelCount; texelIndex++) {
    data.set(pixel, texelIndex * 4);
  }
  return data;
}

function normalizeTextureReadOptionsForTest(
  texture: Texture,
  options: TextureReadOptions
): Required<TextureReadOptions> {
  const mipLevel = options.mipLevel ?? 0;
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  const z = options.z ?? 0;
  const mipWidth = Math.max(1, texture.width >> mipLevel);
  const mipHeight = texture.baseDimension === '1d' ? 1 : Math.max(1, texture.height >> mipLevel);
  const mipDepthOrArrayLayers =
    texture.dimension === '3d' ? Math.max(1, texture.depth >> mipLevel) : texture.depth;

  return {
    x,
    y,
    z,
    width: Math.min(options.width ?? mipWidth, mipWidth - x),
    height: Math.min(options.height ?? mipHeight, mipHeight - y),
    depthOrArrayLayers: Math.min(options.depthOrArrayLayers ?? 1, mipDepthOrArrayLayers - z),
    mipLevel,
    aspect: options.aspect ?? 'all'
  };
}

function compactTextureBytes(
  texture: Texture,
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  options: TextureReadOptions
): Uint8Array {
  const layout = texture.computeMemoryLayout(options);
  const normalizedOptions = normalizeTextureReadOptionsForTest(texture, options);
  const {width, height, depthOrArrayLayers} = normalizedOptions;
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

async function readTexturePixels(
  texture: Texture,
  options: TextureReadOptions
): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout(options);
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  // Browser CI runs with coverage and a software GPU can make async texture readback noticeably
  // slower, especially for WebGPU 3d textures. Keep the helper timeout comfortably below the
  // enclosing test timeout, but high enough to avoid false negatives from backend latency.
  try {
    texture.readBuffer(options, buffer);
    const arrayBufferView = await withTimeout(
      buffer.readAsync(0, layout.byteLength),
      15000,
      `${texture.device.type} ${texture.format} readBuffer timed out`,
      () => getTextureReadbackError(texture)
    );
    return compactTextureBytes(texture, arrayBufferView, options);
  } finally {
    buffer.destroy();
  }
}

async function readTextureBufferPixels(
  texture: Texture,
  options: TextureReadOptions
): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout(options);
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(options, buffer);
    const arrayBufferView = await buffer.readAsync();
    return compactTextureBytes(texture, arrayBufferView, options);
  } finally {
    buffer.destroy();
  }
}

function readTexturePixelsSyncWebGL(texture: Texture, options: TextureReadOptions): Uint8Array {
  return compactTextureBytes(texture, texture.readDataSyncWebGL(options), options);
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

function createPackedTextureData(
  ArrayType: typeof Uint8Array | typeof Uint16Array | typeof Uint32Array | typeof Float32Array,
  options: {
    width: number;
    height: number;
    depthOrArrayLayers?: number;
    componentCount: number;
  }
): TypedArray {
  const {width, height, depthOrArrayLayers = 1, componentCount} = options;
  const texelCount = width * height * depthOrArrayLayers;
  const elementCount = texelCount * componentCount;
  const data = new ArrayType(elementCount);

  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    data[elementIndex] =
      ArrayType === Float32Array ? ((elementIndex % 23) + 1) / 32 : (elementIndex * 17 + 3) % 251;
  }

  return data;
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

it('Texture#copyImageData handles padded rows on WebGL', async () => {
  const device = await getWebGLTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(result, 'webgl: copyImageData uploads data with padded rows correctly').toEqual(expected);

  texture.destroy();
  void 0;
});

it('Texture#writeData & readDataAsync round-trip', async () => {
  for (const device of await getTestDevices()) {
    void 0;

    const tex = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });

    tex.writeData(RGBA8_DATA);
    const result = await readTexturePixels(tex, {});

    expect(
      result.slice(0, RGBA8_DATA.length),
      `${device.type}: writeData + readBuffer returns same pixels`
    ).toEqual(RGBA8_DATA);
    tex.destroy();
  }
  void 0;
});

it('Texture color read APIs support subresources and mip levels', async () => {
  for (const device of await getTestDevices()) {
    const twoDimensionalTexture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    twoDimensionalTexture.writeData(
      createRgbaUploadData({
        width: 2,
        height: 2,
        bytesPerRow: 256,
        rowsPerImage: 2,
        pixel: [1, 2, 3, 255]
      }),
      {width: 2, height: 2, bytesPerRow: 256, rowsPerImage: 2}
    );
    expect(
      await readTexturePixels(twoDimensionalTexture, {width: 2, height: 2}),
      `${device.type}: readDataAsync reads 2d base level texels`
    ).toEqual(repeatRgbaPixel([1, 2, 3, 255], 4));
    expect(
      await readTextureBufferPixels(twoDimensionalTexture, {width: 2, height: 2}),
      `${device.type}: readBuffer matches 2d base level texels`
    ).toEqual(repeatRgbaPixel([1, 2, 3, 255], 4));
    twoDimensionalTexture.destroy();

    const mipTexture = device.createTexture({
      width: 4,
      height: 4,
      mipLevels: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    mipTexture.writeData(
      createRgbaUploadData({
        width: 2,
        height: 2,
        bytesPerRow: 256,
        rowsPerImage: 2,
        pixel: [4, 5, 6, 255]
      }),
      {width: 2, height: 2, mipLevel: 1, bytesPerRow: 256, rowsPerImage: 2}
    );
    expect(
      await readTexturePixels(mipTexture, {mipLevel: 1, width: 2, height: 2}),
      `${device.type}: readDataAsync reads nonzero mip texels`
    ).toEqual(repeatRgbaPixel([4, 5, 6, 255], 4));
    mipTexture.destroy();

    const cubeTexture = device.createTexture({
      dimension: 'cube',
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    cubeTexture.writeData(
      createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [7, 8, 9, 255]
      }),
      {width: 1, height: 1, z: 5, bytesPerRow: 256}
    );
    expect(
      await readTexturePixels(cubeTexture, {width: 1, height: 1, z: 5}),
      `${device.type}: readDataAsync reads cube face texels`
    ).toEqual(new Uint8Array([7, 8, 9, 255]));
    cubeTexture.destroy();

    const arrayTexture = device.createTexture({
      dimension: '2d-array',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    arrayTexture.writeData(
      createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [10, 11, 12, 255]
      }),
      {
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1,
        bytesPerRow: 256,
        rowsPerImage: 1
      }
    );
    expect(
      await readTexturePixels(arrayTexture, {width: 1, height: 1, z: 1, depthOrArrayLayers: 1}),
      `${device.type}: readDataAsync reads array layer texels`
    ).toEqual(new Uint8Array([10, 11, 12, 255]));
    arrayTexture.destroy();

    const threeDimensionalTexture = device.createTexture({
      dimension: '3d',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    threeDimensionalTexture.writeData(
      createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [13, 14, 15, 255]
      }),
      {
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1,
        bytesPerRow: 256,
        rowsPerImage: 1
      }
    );
    expect(
      await readTexturePixels(threeDimensionalTexture, {
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1
      }),
      `${device.type}: readDataAsync reads 3d slice texels`
    ).toEqual(new Uint8Array([13, 14, 15, 255]));
    threeDimensionalTexture.destroy();
  }

  void 0;
});

it('Texture color read APIs pack multi-layer and multi-slice reads consistently', async () => {
  for (const device of await getTestDevices()) {
    const arrayTexture = device.createTexture({
      dimension: '2d-array',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    arrayTexture.writeData(
      createLayeredRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        rowsPerImage: 1,
        pixels: [
          [1, 10, 20, 255],
          [2, 11, 21, 255]
        ]
      }),
      {width: 1, height: 1, depthOrArrayLayers: 2, bytesPerRow: 256, rowsPerImage: 1}
    );

    expect(
      await readTexturePixels(arrayTexture, {width: 1, height: 1, depthOrArrayLayers: 2}),
      `${device.type}: multi-layer reads pack consecutive array layers`
    ).toEqual(new Uint8Array([1, 10, 20, 255, 2, 11, 21, 255]));
    arrayTexture.destroy();

    const threeDimensionalTexture = device.createTexture({
      dimension: '3d',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    threeDimensionalTexture.writeData(
      createLayeredRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        rowsPerImage: 1,
        pixels: [
          [3, 12, 22, 255],
          [4, 13, 23, 255]
        ]
      }),
      {width: 1, height: 1, depthOrArrayLayers: 2, bytesPerRow: 256, rowsPerImage: 1}
    );

    expect(
      await readTexturePixels(threeDimensionalTexture, {
        width: 1,
        height: 1,
        depthOrArrayLayers: 2
      }),
      `${device.type}: multi-slice reads pack consecutive 3d slices`
    ).toEqual(new Uint8Array([3, 12, 22, 255, 4, 13, 23, 255]));
    threeDimensionalTexture.destroy();
  }

  void 0;
});

it('Texture color read APIs keep readBuffer and readDataAsync in parity', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      dimension: '2d-array',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    texture.writeData(
      createLayeredRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        rowsPerImage: 1,
        pixels: [
          [30, 31, 32, 255],
          [40, 41, 42, 255]
        ]
      }),
      {width: 1, height: 1, depthOrArrayLayers: 2, bytesPerRow: 256, rowsPerImage: 1}
    );

    const options = {width: 1, height: 1, depthOrArrayLayers: 2};
    expect(
      await readTextureBufferPixels(texture, options),
      `${device.type}: readBuffer and readDataAsync return the same texel bytes`
    ).toEqual(await readTexturePixels(texture, options));
    texture.destroy();
  }

  void 0;
});

it('Texture#readDataSyncWebGL matches async color reads on WebGL subresources', async () => {
  for (const device of await getTestDevices()) {
    if (!(device instanceof WebGLDevice)) {
      continue;
    }

    const mipTexture = device.createTexture({
      width: 4,
      height: 4,
      mipLevels: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    mipTexture.writeData(
      createRgbaUploadData({
        width: 2,
        height: 2,
        bytesPerRow: 256,
        rowsPerImage: 2,
        pixel: [50, 51, 52, 255]
      }),
      {width: 2, height: 2, mipLevel: 1, bytesPerRow: 256, rowsPerImage: 2}
    );
    expect(
      readTexturePixelsSyncWebGL(mipTexture, {mipLevel: 1, width: 2, height: 2}),
      'webgl: readDataSyncWebGL matches readDataAsync for lower mip reads'
    ).toEqual(await readTexturePixels(mipTexture, {mipLevel: 1, width: 2, height: 2}));
    mipTexture.destroy();

    const arrayTexture = device.createTexture({
      dimension: '2d-array',
      width: 1,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });
    arrayTexture.writeData(
      createLayeredRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        rowsPerImage: 1,
        pixels: [
          [60, 61, 62, 255],
          [70, 71, 72, 255]
        ]
      }),
      {width: 1, height: 1, depthOrArrayLayers: 2, bytesPerRow: 256, rowsPerImage: 1}
    );
    expect(
      readTexturePixelsSyncWebGL(arrayTexture, {width: 1, height: 1, depthOrArrayLayers: 2}),
      'webgl: readDataSyncWebGL matches readDataAsync for multi-layer reads'
    ).toEqual(await readTexturePixels(arrayTexture, {width: 1, height: 1, depthOrArrayLayers: 2}));
    arrayTexture.destroy();
  }

  void 0;
});

it('Texture upload methods round-trip through full-level uploads', async () => {
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

      expect(
        result,
        `${device.type}: ${method} round-trips tightly packed full-level uploads`
      ).toEqual(expected);

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  void 0;
});

it('Texture upload methods support lower mip uploads', async () => {
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

      const uploadBuffer = uploadTexture(device, texture, method, expected, options);
      const result = await readTexturePixels(texture, {width: 2, height: 2, mipLevel: 1});

      expect(
        result,
        `${device.type}: ${method} uploads lower mip subresources using mip-sized extents`
      ).toEqual(repeatRgbaPixel([90, 80, 70, 255], 4));

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  void 0;
});

it('Texture upload methods honor explicit byteOffset and bytesPerRow', async () => {
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

      expect(result, `${device.type}: ${method} honors byteOffset and padded rows`).toEqual(
        new Uint8Array([11, 22, 33, 255, 11, 22, 33, 255, 11, 22, 33, 255, 11, 22, 33, 255])
      );

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  void 0;
});

it('Texture upload methods interpret byteOffset as bytes for typed array uploads', async () => {
  for (const device of await getTestDevices()) {
    if (!device.isTextureFormatSupported('rgba16uint')) {
      void 0;
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

      expect(
        pixel,
        `${device.type}: ${method} converts byteOffset to typed-array element offset`
      ).toEqual([20, 0, 0, 65535]);

      uploadBuffer?.destroy();
      texture.destroy();
    }
  }

  void 0;
});

it('Texture upload methods target cube faces, array layers, and 3d slices consistently', async () => {
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

      const cubeUploadBuffer = uploadTexture(device, cubeTexture, method, cubeData, cubeOptions);
      const cubePixels = await readTexturePixels(cubeTexture, {
        width: 1,
        height: 1,
        z: 5,
        depthOrArrayLayers: 1
      });

      expect(cubePixels, `${device.type}: ${method} targets the requested cube face`).toEqual(
        new Uint8Array([7, 8, 9, 255])
      );

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

      const arrayUploadBuffer = uploadTexture(
        device,
        arrayTexture,
        method,
        arrayData,
        arrayOptions
      );
      const arrayPixels = await readTexturePixels(arrayTexture, {
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1
      });

      expect(arrayPixels, `${device.type}: ${method} targets the requested array layer`).toEqual(
        new Uint8Array([21, 22, 23, 255])
      );

      arrayUploadBuffer?.destroy();
      arrayTexture.destroy();

      const threeDimensionalTexture = device.createTexture({
        dimension: '3d',
        width: 1,
        height: 1,
        depth: 2,
        format: 'rgba8unorm',
        usage: Texture.COPY_DST | Texture.COPY_SRC
      });
      const threeDimensionalData = createRgbaUploadData({
        width: 1,
        height: 1,
        bytesPerRow: 256,
        pixel: [31, 32, 33, 255]
      });
      const threeDimensionalOptions = createTextureWriteOptions({
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1,
        bytesPerRow: 256
      });

      const threeDimensionalUploadBuffer = uploadTexture(
        device,
        threeDimensionalTexture,
        method,
        threeDimensionalData,
        threeDimensionalOptions
      );
      const threeDimensionalPixels = await readTexturePixels(threeDimensionalTexture, {
        width: 1,
        height: 1,
        z: 1,
        depthOrArrayLayers: 1
      });

      expect(
        threeDimensionalPixels,
        `${device.type}: ${method} targets the requested 3d slice`
      ).toEqual(new Uint8Array([31, 32, 33, 255]));

      threeDimensionalUploadBuffer?.destroy();
      threeDimensionalTexture.destroy();
    }
  }

  void 0;
});

it('Texture#copyExternalImage uploads image data on both backends', async () => {
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

    expect(result, `${device.type}: copyExternalImage uploads pixel data`).toEqual(
      new Uint8Array([1, 2, 3, 255, 5, 6, 7, 255])
    );

    texture.destroy();
  }

  void 0;
});

it('WebGPUTexture#copyExternalImage falls back to a CPU upload', async () => {
  const device = await getWebGPUTestDevice();
  const texture = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.COPY_DST | Texture.COPY_SRC | Texture.RENDER
  });
  const image = await createImageBitmap(
    new ImageData(new Uint8ClampedArray([11, 12, 13, 255, 21, 22, 23, 255]), 2, 1)
  );
  const queue = (device as Device & {handle: GPUDevice}).handle.queue;
  const queuePrototype = Object.getPrototypeOf(queue) as GPUQueue;
  const descriptor = Object.getOwnPropertyDescriptor(queuePrototype, 'copyExternalImageToTexture');
  const gpuType = device.info.gpuType;
  let nativeCopyCallCount = 0;

  Object.defineProperty(queuePrototype, 'copyExternalImageToTexture', {
    configurable: true,
    value: () => {
      nativeCopyCallCount++;
      throw new TypeError('Failed to copy content from external image.');
    }
  });
  device.info.gpuType = 'unknown';
  try {
    texture.copyExternalImage({image});
  } finally {
    device.info.gpuType = gpuType;
    if (descriptor) {
      Object.defineProperty(queuePrototype, 'copyExternalImageToTexture', descriptor);
    } else {
      Reflect.deleteProperty(queuePrototype, 'copyExternalImageToTexture');
    }
  }

  const result = await readTexturePixels(texture, {width: 2, height: 1});
  expect(result, 'WebGPU CPU fallback uploads pixel data').toEqual(
    new Uint8Array([11, 12, 13, 255, 21, 22, 23, 255])
  );
  expect(nativeCopyCallCount, 'native TypeError path was attempted once').toBe(1);

  image.close();
  texture.destroy();
  void 0;
});

it('WebGPUTexture#copyExternalImage proactively uses CPU upload on CPU adapters', async () => {
  const device = await getWebGPUTestDevice();
  const texture = device.createTexture({
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.COPY_DST | Texture.COPY_SRC | Texture.RENDER
  });
  const image = new ImageData(new Uint8ClampedArray([31, 32, 33, 255, 41, 42, 43, 255]), 2, 1);
  const queue = (device as Device & {handle: GPUDevice}).handle.queue;
  const queuePrototype = Object.getPrototypeOf(queue) as GPUQueue;
  const descriptor = Object.getOwnPropertyDescriptor(queuePrototype, 'copyExternalImageToTexture');
  const gpuType = device.info.gpuType;
  let nativeCopyCallCount = 0;

  Object.defineProperty(queuePrototype, 'copyExternalImageToTexture', {
    configurable: true,
    value: () => {
      nativeCopyCallCount++;
    }
  });
  device.info.gpuType = 'cpu';
  try {
    texture.copyExternalImage({image});
  } finally {
    device.info.gpuType = gpuType;
    if (descriptor) {
      Object.defineProperty(queuePrototype, 'copyExternalImageToTexture', descriptor);
    } else {
      Reflect.deleteProperty(queuePrototype, 'copyExternalImageToTexture');
    }
  }

  const result = await readTexturePixels(texture, {width: 2, height: 1});
  expect(result, 'CPU adapter fallback uploads pixel data').toEqual(
    new Uint8Array([31, 32, 33, 255, 41, 42, 43, 255])
  );
  expect(nativeCopyCallCount, 'unstable native external-image copy was bypassed').toBe(0);

  texture.destroy();
  void 0;
});

it('Texture#copyImageData is a compatibility wrapper over writeData', async () => {
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

    expect(
      copyImageDataPixels,
      `${device.type}: copyImageData matches writeData for equivalent uploads`
    ).toEqual(writeDataPixels);

    writeDataTexture.destroy();
    copyImageDataTexture.destroy();
  }

  void 0;
});

it('Texture#createTexture uploads tightly packed 3d texture data', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      dimension: '3d',
      width: 2,
      height: 1,
      depth: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC,
      data: createLayeredRgbaUploadData({
        width: 2,
        height: 1,
        pixels: [
          [11, 12, 13, 255],
          [21, 22, 23, 255]
        ]
      })
    });

    expect(
      await readTexturePixels(texture, {width: 2, height: 1, depthOrArrayLayers: 2}),
      `${device.type}: createTexture accepts tightly packed 3d upload data`
    ).toEqual(new Uint8Array([11, 12, 13, 255, 11, 12, 13, 255, 21, 22, 23, 255, 21, 22, 23, 255]));

    texture.destroy();
  }

  void 0;
});

it('Texture#writeData rejects invalid row layout', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 2,
      format: 'rgba8unorm',
      usage: Texture.COPY_DST | Texture.COPY_SRC
    });

    expect(
      () =>
        texture.writeData(new Uint8Array(8), {
          width: 2,
          height: 2,
          bytesPerRow: 4,
          rowsPerImage: 2
        }),
      `${device.type}: writeData rejects bytesPerRow smaller than the write width`
    ).toThrow(/bytesPerRow/);

    texture.destroy();
  }

  void 0;
});

it('Texture#writeData & readDataAsync round-trip for all formats and dimensions', async () => {
  void 0;

  for (const device of await getTestDevices()) {
    void 0;
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

      if (device.type === 'webgpu' && isSoftwareBackedDevice(device)) {
        continue;
      }

      if (!device.isTextureFormatRenderable(format)) {
        void 0;
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
          '3d': {width: 2, height: 2, depth: 2}
        }[dimension];
        const depthOrArrayLayers = 'depth' in texSize ? texSize.depth : 1;

        const tex = device.createTexture({
          ...texSize,
          dimension,
          format,
          usage: Texture.COPY_SRC | Texture.COPY_DST
        });

        const ArrayType = getTypedArrayConstructor(info.dataType);
        const input = createPackedTextureData(ArrayType, {
          width: texSize.width,
          height: texSize.height,
          depthOrArrayLayers,
          componentCount: info.components
        });

        try {
          tex.writeData(input);
          const outputBytes = await readTexturePixels(tex, {
            width: texSize.width,
            height: texSize.height,
            depthOrArrayLayers
          });
          const output = new ArrayType(
            outputBytes.buffer,
            outputBytes.byteOffset,
            outputBytes.byteLength / ArrayType.BYTES_PER_ELEMENT
          );

          const match =
            ArrayType === Float32Array ? almostEqual(output, input) : deepEqual(output, input);
          expect(Boolean(match), `${device.type} ${format} ${dimension} round-trip succeeded`).toBe(
            true
          );
        } catch (err) {
          expect(
            false,
            `${device.type} ${format} ${dimension} round-trip failed: ${err.message}`
          ).toBe(true);
        }

        tex.destroy();
      }
    }
  }

  void 0;
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

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  errorMessage: string,
  getPendingError: (() => string | null) | null = null
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let slowReadbackTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let errorPollTimeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        if (getPendingError) {
          slowReadbackTimeoutId = setTimeout(() => {
            const pollForPendingError = () => {
              const pendingError = getPendingError();
              if (pendingError) {
                reject(new Error(pendingError));
                return;
              }
              errorPollTimeoutId = setTimeout(pollForPendingError, 100);
            };

            pollForPendingError();
          }, 2000);
        }
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), milliseconds);
      })
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (slowReadbackTimeoutId !== undefined) {
      clearTimeout(slowReadbackTimeoutId);
    }
    if (errorPollTimeoutId !== undefined) {
      clearTimeout(errorPollTimeoutId);
    }
  }
}

function getTextureReadbackError(texture: Texture): string | null {
  if (!(texture.device instanceof WebGLDevice)) {
    return null;
  }

  const gl = texture.device.gl;
  if (gl.isContextLost()) {
    return `${texture.device.type} ${texture.format} readDataAsync failed: WebGL context lost`;
  }

  const glError = gl.getError();
  if (glError !== GL.NO_ERROR) {
    return `${texture.device.type} ${texture.format} readDataAsync failed: gl.getError() -> ${glError}`;
  }

  return null;
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

it.skip('Texture#copyImageData & readDataAsync round-trip', async () => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
    tex.copyImageData({data: RGBA8_DATA});
    const result = await readTexturePixels(tex, {});
    expect(
      result.slice(0, RGBA8_DATA.length),
      `${device.type}: copyImageData + readBuffer returns same pixels`
    ).toEqual(RGBA8_DATA);
    tex.destroy();
  }
  void 0;
});

it.skip('Texture#writeBuffer & readBuffer round-trip', async () => {
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
    const result = await readTexturePixels(tex, {});
    expect(result, `${device.type}: writeBuffer + readBuffer returns same pixels`).toEqual(
      RGBA8_DATA
    );
    upload.destroy();
    tex.destroy();
  }
  void 0;
});

it.skip('Texture#readBuffer & Buffer.readAsync round-trip', async () => {
  for (const device of await getTestDevices()) {
    const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
    // initialize via writeData
    tex.writeData(RGBA8_DATA, {});
    const layout = tex.computeMemoryLayout({});
    const buf = device.createBuffer({byteLength: layout.byteLength});
    tex.readBuffer({}, buf);
    const arr = await buf.readAsync();
    const result = toUint8(arr);
    expect(result, `${device.type}: readBuffer + Buffer.readAsync returns same pixels`).toEqual(
      RGBA8_DATA
    );
    tex.destroy();
  }
  void 0;
});

it('Texture#readBuffer requires explicit destination buffer', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
    expect(
      () => texture.readBuffer({}),
      `${device.type}: readBuffer requires a caller-supplied destination buffer`
    ).toThrow(/requires a destination buffer/);
    texture.destroy();
  }

  void 0;
});

it('Texture#readDataSyncWebGL returns correct data on WebGL', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device instanceof WebGLDevice) {
      const tex = device.createTexture({width: 2, height: 1, format: 'rgba8unorm'});
      tex.writeData(RGBA8_DATA, {});
      const syncData = tex.readDataSyncWebGL({});
      const result = toUint8(syncData);
      expect(result, `webgl: readDataSyncWebGL returns same pixels`).toEqual(RGBA8_DATA);
      tex.destroy();
    }
  }
  void 0;
});

it('Texture color read APIs reject unsupported formats and aspects', async () => {
  const compressedFormats: TextureFormat[] = [
    'bc1-rgba-unorm',
    'etc2-rgba8unorm',
    'astc-4x4-unorm',
    'bc1-rgb-unorm-webgl'
  ];

  for (const device of await getTestDevices()) {
    const readBuffer = device.createBuffer({
      byteLength: 4,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const colorTexture = device.createTexture({width: 1, height: 1, format: 'rgba8unorm'});
    expect(
      () => colorTexture.readBuffer({aspect: 'depth-only'}, readBuffer),
      `${device.type}: color reads reject non-all aspects`
    ).toThrow(/aspect 'all'/);
    colorTexture.destroy();

    const depthTexture = device.createTexture({width: 1, height: 1, format: 'depth16unorm'});
    expect(
      () => depthTexture.readBuffer({}, readBuffer),
      `${device.type}: color reads reject depth formats`
    ).toThrow(/depth formats/);
    depthTexture.destroy();

    if (device.isTextureFormatSupported('stencil8')) {
      try {
        const stencilTexture = device.createTexture({width: 1, height: 1, format: 'stencil8'});
        expect(
          () => stencilTexture.readBuffer({}, readBuffer),
          `${device.type}: color reads reject stencil formats`
        ).toThrow(/stencil formats/);
        stencilTexture.destroy();
      } catch (_error) {
        void 0;
      }
    }

    const depthStencilTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'depth24plus-stencil8'
    });
    expect(
      () => depthStencilTexture.readBuffer({}, readBuffer),
      `${device.type}: color reads reject depth-stencil formats`
    ).toThrow(/depth-stencil formats/);
    depthStencilTexture.destroy();

    const compressedFormat = compressedFormats.find(format =>
      device.isTextureFormatSupported(format)
    );
    if (compressedFormat) {
      const compressedTexture = device.createTexture({
        width: 4,
        height: 4,
        format: compressedFormat
      });
      expect(
        () => compressedTexture.readBuffer({}, readBuffer),
        `${device.type}: color reads reject compressed formats`
      ).toThrow(/compressed formats/);
      compressedTexture.destroy();
    } else {
      void 0;
    }

    readBuffer.destroy();
  }

  void 0;
});

it('Texture#readBuffer reuses the cached WebGL read framebuffer', async () => {
  const device = await getWebGLTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const texture = device.createTexture({
    dimension: '2d-array',
    width: 1,
    height: 1,
    depth: 2,
    format: 'rgba8unorm',
    usage: Texture.COPY_DST | Texture.COPY_SRC
  });
  texture.writeData(
    createLayeredRgbaUploadData({
      width: 1,
      height: 1,
      bytesPerRow: 256,
      rowsPerImage: 1,
      pixels: [
        [80, 81, 82, 255],
        [90, 91, 92, 255]
      ]
    }),
    {width: 1, height: 1, depthOrArrayLayers: 2, bytesPerRow: 256, rowsPerImage: 1}
  );

  const firstReadBuffer = device.createBuffer({
    byteLength: texture.computeMemoryLayout({width: 1, height: 1, z: 0, depthOrArrayLayers: 1})
      .byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  texture.readBuffer({width: 1, height: 1, z: 0, depthOrArrayLayers: 1}, firstReadBuffer);
  const firstFramebuffer = (texture as any)._framebuffer;
  const secondReadBuffer = device.createBuffer({
    byteLength: texture.computeMemoryLayout({width: 1, height: 1, z: 1, depthOrArrayLayers: 1})
      .byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  texture.readBuffer({width: 1, height: 1, z: 1, depthOrArrayLayers: 1}, secondReadBuffer);
  const secondFramebuffer = (texture as any)._framebuffer;

  expect(Boolean(firstFramebuffer), 'webgl: first read creates a cached read framebuffer').toBe(
    true
  );
  expect(secondFramebuffer, 'webgl: subsequent reads reuse the cached read framebuffer').toBe(
    firstFramebuffer
  );

  firstReadBuffer.destroy();
  secondReadBuffer.destroy();

  texture.destroy();
  void 0;
});

// //////////////////////////////

it('Device#isTextureFormatSupported()', async () => {
  const UNSUPPORTED_FORMATS: Record<string, TextureFormat[]> = {
    webgl: ['stencil8'],
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
    expect(
      Boolean(unSupportedFormats.every(format => expected.includes(format))),
      `${device.type}: unsupported formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    ).toBe(true);
  }

  void 0;
});

it('Device#isTextureFormatFilterable()', async () => {
  const UNSUPPORTED_FORMATS: Record<Device['type'], TextureFormat[]> = {
    webgl: [
      'rgba8unorm',
      'rgb16unorm-webgl',
      'rgb16snorm-webgl',
      'r32float',
      'rg32float',
      'rgb32float-webgl',
      'rgba32float'
    ],
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
    expect(
      Boolean(unSupportedFormats.every(format => expected.includes(format))),
      `${device.type}: Unfilterable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    ).toBe(true);
  }

  void 0;
});

it('Device#isTextureFormatRenderable()', async () => {
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
    expect(
      Boolean(unSupportedFormats.every(format => expected.includes(format))),
      `${device.type}: Unrenderable formats ${unSupportedFormats.join(',') in [expected.join(',')]}`
    ).toBe(true);
  }

  void 0;
});

it('Texture#construct/delete', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({width: 1, height: 1});
    expect(Boolean(texture instanceof Texture), 'Texture construction successful').toBe(true);
    texture.destroy();
    expect(Boolean(texture instanceof Texture), 'Texture delete successful').toBe(true);
    texture.destroy();
    expect(Boolean(texture instanceof Texture), 'Texture repeated delete successful').toBe(true);
  }
  void 0;
});

it('Texture#depth/stencil formats', async () => {
  const DEPTH_STENCIL_FORMATS = ['depth16unorm', 'depth24plus', 'depth24plus-stencil8'];
  for (const device of await getTestDevices()) {
    for (const key of DEPTH_STENCIL_FORMATS) {
      const format = key as TextureFormat;
      expect(
        Boolean(device.isTextureFormatSupported(format)),
        `${device.type} ${format} is supported`
      ).toBe(true);
      expect(
        Boolean(device.isTextureFormatFilterable(format)),
        `${device.type} ${format} is not filterable`
      ).toBe(false);
      const texture = device.createTexture({format, width: 1, height: 1});
      expect(Boolean(texture instanceof Texture), `Texture ${format} construction successful`).toBe(
        true
      );
    }
  }
  void 0;
});

it('Texture#format simple creation', async () => {
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
        expect(() => {
          texture = device.createTexture({
            format: formatName,
            height,
            width
          });
        }, `Texture(${device.type},${formatName}) creation OK`).not.toThrow();

        expect(texture.format, `Texture(${device.type},${formatName}).format OK`).toBe(formatName);
        texture.destroy();
      }
    }
  }
  void 0;
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

function testFormatCreation(device: Device, withData: boolean = false) {
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
        expect(
          texture.props.format,
          `Texture(${device.type},${format}) created with mipmaps=${mipmaps}`
        ).toBe(format);
        texture.destroy();
      } catch (_error) {
        void 0;
      }
    } else {
      void 0;
    }
  }
}

// test.skip('Texture#format creation', async t => {
//   for (const device of await getTestDevices()) {
//     testFormatCreation(t, device);
//   }
//   t.end();
// });

it('Texture#format creation with data', async () => {
  for (const device of await getTestDevices()) {
    testFormatCreation(device, true);
  }
  void 0;
});

it('Texture#dimension=3d,format=r32float', async () => {
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
    expect(Boolean(texture), `${device.type}: Texture(dimension=3d,format=r32float) created`).toBe(
      true
    );
    void 0;
  }
});

it('Texture#copyExternalImage', async () => {
  for (const device of await getTestDevices()) {
    const texture = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm'
    });

    if (device.info.type === 'webgl') {
      const webglDevice = device as WebGLDevice;
      expect(
        webglDevice.readPixelsToArrayWebGL(texture),
        `${device.info.type} Pixels are initially empty`
      ).toEqual(new Uint8Array(8));
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
        expect(
          device.readPixelsToArrayWebGL(texture),
          `${device.info.type} Pixels were set correctly (full image)`
        ).toEqual(new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255]));
      }

      // Subimage copy
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 2, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        expect(
          device.readPixelsToArrayWebGL(texture),
          `${device.info.type} Pixels were set correctly (sub image)`
        ).toEqual(new Uint8Array([255, 0, 0, 255, 0, 0, 0, 255]));
      }

      // Subimage copy (smaller canvas)
      canvas.width = 1;
      canvas.height = 1;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, 1, 1);

      texture.copyExternalImage({image: canvas, x: 1});

      if (device.info.type === 'webgl') {
        expect(
          device.readPixelsToArrayWebGL(texture),
          `${device.info.type} Pixels were set correctly (sub image small canvas)`
        ).toEqual(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]));
      }
    }

    if (device.info.type !== 'webgl') {
      expect(Boolean('WebGPU copyExternalImage test cannot yet read pixels'), '').toBe(true);
    }
  }

  void 0;
});

it.skip('Texture#setImageData', async () => {
  const webglDevice = await getWebGLTestDevice();

  const texture = webglDevice.createTexture({
    width: 2,
    height: 1,
    format: GL.RGBA32F,
    type: GL.FLOAT,
    mipmaps: false
  });
  expect(readPixelsToArray(texture), 'Pixels are empty').toEqual(new Float32Array(8));

  // data: typed array
  const data = new Float32Array([0.1, 0.2, -3, -2, 0, 0.5, 128, 255]);
  texture.copyExternalImage({data});
  expect(readPixelsToArray(texture), 'Pixels are set correctly').toEqual(data);
  void 0;
});

it.skip('WebGL2#Texture setSubImageData', async () => {
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
  expect(readPixelsToArray(texture), 'Pixels are empty').toEqual(new Float32Array(8));

  // data: typed array
  data = new Float32Array([0.1, 0.2, -3, -2]);
  texture.setSubImageData({data, x: 0, y: 0, width: 1, height: 1});
  expect(readPixelsToArray(texture), 'Pixels are set correctly').toEqual(
    new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 0])
  );

  // data: buffer
  data = new Float32Array([-3, 255, 128, 3.333]);
  const buffer = webglDevice.createByffer({data, accessor: {size: 4, type: GL.FLOAT}});
  texture.setSubImageData({data: buffer, x: 1, y: 0, width: 1, height: 1});
  expect(readPixelsToArray(texture), 'Pixels are set correctly').toEqual(
    new Float32Array([0.1, 0.2, -3, -2, -3, 255, 128, 3.333])
  );

  // data: canvas
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 1, 1);
    texture.setSubImageData({data: canvas, x: 1, y: 0, width: 1, height: 1});
    expect(readPixelsToArray(texture), 'Pixels are set correctly').toEqual(
      new Float32Array([0.1, 0.2, -3, -2, 0, 0, 0, 1])
    );
  }

  void 0;
});

// NON-2D TEXTURES

it('Texture(dimension)#construct/delete', async () => {
  for (const device of await getTestDevices()) {
    for (const dimension of ['3d', '2d-array', 'cube']) {
      const texture = device.createTexture({dimension, width: 1, height: 1});
      expect(texture.dimension, `${device.info.type} Texture construction successful`).toBe(
        dimension
      );
      expect(
        texture.view.props.dimension,
        `${device.info.type} Texture view construction successful`
      ).toBe(dimension);
      texture.destroy();
    }
  }

  void 0;
});

it.skip('Texture#buffer update', async () => {
  let texture = webglDevice.createTexture({width: 1, height: 1});
  expect(Boolean(texture instanceof Texture), 'Texture construction successful').toBe(true);

  texture = texture.destroy();
  expect(Boolean(texture instanceof Texture), 'Texture delete successful').toBe(true);

  void 0;
});

// CUBE TEXTURES

it.skip('WebGL#TextureCube construct/delete', async () => {
  expect(() => new TextureCube(), 'TextureCube throws on missing gl context').toThrow(
    /.*WebGLRenderingContext.*/
  );

  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  expect(Boolean(texture instanceof Texture), 'TextureCube construction successful').toBe(true);

  // t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  expect(Boolean(texture instanceof Texture), 'TextureCube delete successful').toBe(true);

  texture.destroy();
  expect(Boolean(texture instanceof Texture), 'TextureCube repeated delete successful').toBe(true);

  void 0;
});

it.skip('WebGL#TextureCube buffer update', async () => {
  const texture = webglDevice.createTexture({dimension: 'cube', width: 1, height: 1});
  expect(Boolean(texture instanceof Texture), 'TextureCube construction successful').toBe(true);

  texture.destroy();
  expect(Boolean(texture instanceof Texture), 'TextureCube delete successful').toBe(true);

  void 0;
});

it.skip('WebGL#TextureCube multiple LODs', async () => {
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
  expect(Boolean(texture instanceof Texture), 'TextureCube construction successful').toBe(true);

  void 0;
});

// 3D TEXTURES

it.skip('WebGL#Texture3D construct/delete', async () => {
  expect(
    () => webglDevice.createTexture({dimension: '3d', width: 1, height: 1}),
    'Texture3D throws on missing gl context'
  ).toThrow();

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

  void 0;
});

it.skip('Texture#setParameters', async () => {
  const texture = webglDevice.createTexture({width: 1, height: 1});
  expect(Boolean(texture instanceof Texture), 'Texture construction successful').toBe(true);

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
  expect(Boolean(texture instanceof Texture), 'Texture delete successful').toBe(true);

  void 0;
});

// Move to engine

it.skip('WebGL2#Texture generateMipmap', async () => {
  let texture = webglDevice.createTexture({
    data: null,
    width: 3,
    height: 3,
    mipmaps: false
  });

  texture.generateMipmap();
  expect(Boolean(texture.mipmaps), 'Should not turn on mipmaps for NPOT.').toBe(false);

  texture = webglDevice.createTexture({
    data: null,
    width: 2,
    height: 2,
    mipmaps: false
  });

  texture.generateMipmap();
  expect(Boolean(texture.mipmaps), 'Should turn on mipmaps for POT.').toBe(true);

  void 0;
});
