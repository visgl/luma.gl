import {expect, test} from 'vitest';
import { Texture, luma } from '@luma.gl/core';
import { getNullTestDevice, getTestDevices, getWebGPUTestDevice, getWebGLTestDevice } from '@luma.gl/test-utils';
import { webgl2Adapter } from '@luma.gl/webgl';
import { _getDefaultDebugValue } from '../../src/adapter/device';

// import {luma} from '@luma.gl/core';

test('Device#info', async () => {
  for (const device of await getTestDevices()) {
    // TODO
    expect(typeof device.info.vendor === 'string', 'info.vendor ok').toBeTruthy();
    expect(typeof device.info.renderer === 'string', 'info.renderer ok').toBeTruthy();
  }
});

// Minimal test, extensive test in texture-formats.spec
test('Device#isTextureFormatCompressed', async () => {
  for (const device of await getTestDevices()) {
    // Just sanity check two types
    expect(device.isTextureFormatCompressed('rgba8unorm')).toBe(false);
    expect(device.isTextureFormatCompressed('bc3-rgba-unorm')).toBe(true);
  }
});
test('Device#getSupportedCompressedTextureFormats', async () => {
  for (const device of await getTestDevices()) {
    const formats = device.getSupportedCompressedTextureFormats();
    expect(Array.isArray(formats), `${device.id} returns an array`).toBeTruthy();
    expect(new Set(formats).size, `${device.id} does not return duplicate formats`).toBe(formats.length);
    for (const format of formats) {
      expect(device.isTextureFormatCompressed(format), `${device.id} returns only compressed formats`).toBe(true);
      expect(device.isTextureFormatSupported(format), `${device.id} returns only supported compressed formats`).toBe(true);
    }
  }
});
test('Device#generateMipmapsWebGPU throws on non-WebGPU devices', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba8unorm',
    mipLevels: 2
  });
  expect(() => device.generateMipmapsWebGPU(texture), 'base Device stub throws on unsupported device types').toThrow(/not implemented/);
  texture.destroy();
});
test('WebGPUDevice#generateMipmapsWebGPU generates a mip chain', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const texture = device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba8unorm',
    mipLevels: 2,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC
  });
  texture.writeData(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]), {
    width: 2,
    height: 2
  });
  device.generateMipmapsWebGPU(texture);
  const mipLevelArrayBuffer = await texture.readDataAsync({
    mipLevel: 1,
    width: 1,
    height: 1
  });
  const mipLevelBytes = new Uint8Array(mipLevelArrayBuffer);
  expect(Array.from(mipLevelBytes.slice(0, 4)), 'WebGPU device method generates level 1 mip data').toEqual([128, 128, 128, 255]);
  texture.destroy();
});
test('Device debug default helper respects log debug before NODE_ENV', () => {
  expect(_getDefaultDebugValue(true, 'production'), 'log debug true overrides production NODE_ENV').toBe(true);
  expect(_getDefaultDebugValue(false, 'development'), 'log debug false overrides development NODE_ENV').toBe(false);
  expect(_getDefaultDebugValue(undefined, 'production'), 'production NODE_ENV defaults debug to false').toBe(false);
  expect(_getDefaultDebugValue(undefined, 'development'), 'non-production NODE_ENV defaults debug to true').toBe(true);
  expect(_getDefaultDebugValue(undefined, undefined), 'missing NODE_ENV defaults debug to false').toBe(false);
});
test('Device manages debug GPU timing through a single API', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  device._disableDebugGPUTime();
  expect(device._isDebugGPUTimeEnabled(), 'GPU timing starts disabled').toBe(false);
  const querySet = device._enableDebugGPUTime();
  const shouldEnable = device._supportsDebugGPUTime();
  expect(device._isDebugGPUTimeEnabled(), 'enableDebugGPUTime follows device policy').toBe(shouldEnable);
  expect(device.commandEncoder.getTimeProfilingQuerySet(), 'command encoder picks up the device-managed timing query set').toBe(querySet);
  device._disableDebugGPUTime();
  expect(device._isDebugGPUTimeEnabled(), 'disableDebugGPUTime clears the device timing query').toBe(false);
  expect(device.commandEncoder.getTimeProfilingQuerySet(), 'disableDebugGPUTime removes the profiling query set from the command encoder').toBe(null);
});
test.skip('WebGLDevice#lost (Promise)', async () => {
  const device = await luma.createDevice({
    id: 'webgl-test-device-lost',
    type: 'webgl',
    adapters: [webgl2Adapter],
    createCanvasContext: {
      width: 1,
      height: 1
    },
    debug: false
  });
  await new Promise<void>(resolve => {
    setTimeout(async () => {
      const cause = await device.lost;
      expect(cause.reason, `Context lost: ${cause.message}`).toBe('destroyed');
      resolve();
    }, 0);
    device.loseDevice();
  });
  device.destroy();
});
