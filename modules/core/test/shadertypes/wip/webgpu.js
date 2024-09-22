import { assertTruthy } from './assert.js';

/* global GPUDevice */
/* global GPUBufferUsage */
/* global GPUMapMode */

const deviceToResources = new Map();

function addDeviceResource(device, resource) {
  const resources = deviceToResources.get(device) || [];
  deviceToResources.set(device, resources);
  resources.push(resource);
  return resource;
}

function freeDeviceResources(device) {
  const resources = deviceToResources.get(device) || [];
  resources.forEach(r => r.destroy());
}

GPUDevice.prototype.createTexture = (function (origFn) {
  return function (...args) {
    return addDeviceResource(this, origFn.call(this, ...args));
  };
})(GPUDevice.prototype.createTexture);

GPUDevice.prototype.createBuffer = (function (origFn) {
  return function (...args) {
    return addDeviceResource(this, origFn.call(this, ...args));
  };
})(GPUDevice.prototype.createBuffer);

export function testWithDeviceWithOptions(options, fn, ...args) {
  return async function () {
    const adapter = await globalThis?.navigator?.gpu?.requestAdapter(options);
    const device = await adapter?.requestDevice();
    if (!device) {
      this.skip();
      return;
    }
    device.pushErrorScope('validation');

    let caughtErr;
    try {
      await fn.call(this, device, ...args);
    } catch (e) {
      caughtErr = e;
    } finally {
      const error = await device.popErrorScope();
      freeDeviceResources(device);
      device.destroy();
      assertTruthy(!error, error?.message);
    }
    if (caughtErr) {
      throw caughtErr;
    }
  };
}

export function testWithDevice(fn, ...args) {
  return async function () {
    await testWithDeviceWithOptions({}, fn, ...args).call(this);
  };
}

export function testWithDeviceAndDocument(fn) {
  return async function () {
    if (typeof document === 'undefined') {
      this.skip();
      return;
    }
    await testWithDevice(fn, document).call(this);
  };
}

export const roundUp = (v, r) => Math.ceil(v / r) * r;
export const mipValueSize = (v, mipLevel) => Math.max(1, Math.floor(v / 2 ** mipLevel));
export const mipSize = (texture, mipLevel) => [
  mipValueSize(texture.width, mipLevel),
  mipValueSize(texture.height, mipLevel),
  texture.dimension === '3d'
      ? mipValueSize(texture.depthOrArrayLayers, mipLevel)
      : 1,
];

// assumes rgba8unorm
export async function readTexturePadded(device, texture, mipLevel = 0, layer = 0) {
  const size = mipSize(texture, mipLevel);
  const bytesPerRow = roundUp(size[0] * 4, 256);
  const buffer = device.createBuffer({
    size: bytesPerRow * size[1] * size[2],
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer(
    { texture, mipLevel, origin: [0, 0, layer] },
    { buffer, bytesPerRow, rowsPerImage: size[1] },
    size,
  );
  device.queue.submit([encoder.finish()]);

  await buffer.mapAsync(GPUMapMode.READ);
  // Get a copy of the result because on unmap the view dies.
  const result = new Uint8Array(buffer.getMappedRange()).slice();
  buffer.unmap();
  buffer.destroy();
  return result;
}

export async function readTextureUnpadded(device, texture, mipLevel = 0, layer = 0) {
  const size = mipSize(texture, mipLevel);
  const bytesPerRow = size[0] * 4;
  const paddedBytesPerRow = roundUp(bytesPerRow, 256);
  const bytesPerImage = bytesPerRow * size[1];

  const padded = await readTexturePadded(device, texture, mipLevel, layer);
  const unpadded = new Uint8Array(bytesPerImage * size[2]);
  let paddedOffset = 0;
  let unpaddedOffset = 0;
  for (let z = 0; z < size[2]; ++z) {
    for (let y = 0; y < size[1]; ++y) {
      unpadded.set(padded.subarray(paddedOffset, paddedOffset + bytesPerRow), unpaddedOffset);
      unpaddedOffset += bytesPerRow;
      paddedOffset += paddedBytesPerRow;
    }
  }
  return unpadded;
}

export async function readBuffer(device, srcBuffer) {
  const copyBuffer = device.createBuffer({
    size: srcBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(srcBuffer, 0, copyBuffer, 0, srcBuffer.size);
  device.queue.submit([encoder.finish()]);
  await copyBuffer.mapAsync(GPUMapMode.READ);
  // Get a copy of the result because on unmap the view dies.
  const result = new Uint8Array(copyBuffer.getMappedRange()).slice();
  copyBuffer.unmap();
  copyBuffer.destroy();
  return result;
}