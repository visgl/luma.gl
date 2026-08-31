// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {getNullTestDevice, getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {webgl2Adapter} from '@luma.gl/webgl';
import {_getDefaultDebugValue} from '../../src/adapter/device';

// import {luma} from '@luma.gl/core';

it('Device#info', async () => {
  for (const device of await getTestDevices()) {
    // TODO
    expect(Boolean(typeof device.info.vendor === 'string'), 'info.vendor ok').toBe(true);
    expect(Boolean(typeof device.info.renderer === 'string'), 'info.renderer ok').toBe(true);
  }
  void 0;
});

it('Device and Resource JSON debug output stays compact', async () => {
  const device = await getNullTestDevice();
  const buffer = device.createBuffer({
    id: 'compact-json-buffer',
    byteLength: 4,
    usage: Buffer.VERTEX
  });

  expect(JSON.stringify(device), 'device JSON uses toString()').toBe(
    JSON.stringify(device.toString())
  );
  expect(JSON.stringify(buffer), 'resource JSON uses toString()').toBe(
    JSON.stringify(buffer.toString())
  );

  buffer.destroy();
  void 0;
});

// Minimal test, extensive test in texture-formats.spec
it('Device#isTextureFormatCompressed', async () => {
  for (const device of await getTestDevices()) {
    // Just sanity check two types
    expect(device.isTextureFormatCompressed('rgba8unorm'), '').toBe(false);
    expect(device.isTextureFormatCompressed('bc3-rgba-unorm'), '').toBe(true);
  }
  void 0;
});

it('WebGPUDevice reports baseline rgba16float capabilities', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const capabilities = device.getTextureFormatCapabilities('rgba16float');
  expect(capabilities.render, 'rgba16float is renderable').toBe(true);
  expect(capabilities.filter, 'rgba16float is filterable').toBe(true);
  void 0;
});

it('Device#getSupportedCompressedTextureFormats', async () => {
  for (const device of await getTestDevices()) {
    const formats = device.getSupportedCompressedTextureFormats();

    expect(Boolean(Array.isArray(formats)), `${device.id} returns an array`).toBe(true);
    expect(new Set(formats).size, `${device.id} does not return duplicate formats`).toBe(
      formats.length
    );

    for (const format of formats) {
      expect(
        device.isTextureFormatCompressed(format),
        `${device.id} returns only compressed formats`
      ).toBe(true);
      expect(
        device.isTextureFormatSupported(format),
        `${device.id} returns only supported compressed formats`
      ).toBe(true);
    }
  }
  void 0;
});

it('Device#generateMipmapsWebGPU throws on non-WebGPU devices', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba8unorm',
    mipLevels: 2
  });

  expect(
    () => device.generateMipmapsWebGPU(texture),
    'base Device stub throws on unsupported device types'
  ).toThrow(/not implemented/);

  texture.destroy();
  void 0;
});

it('WebGPUDevice#generateMipmapsWebGPU generates a mip chain', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const texture = device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba8unorm',
    mipLevels: 2,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST | Texture.COPY_SRC
  });
  texture.writeData(
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]),
    {width: 2, height: 2}
  );

  device.generateMipmapsWebGPU(texture);

  const layout = texture.computeMemoryLayout({mipLevel: 1, width: 1, height: 1});
  const readBuffer = device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  texture.readBuffer({mipLevel: 1, width: 1, height: 1}, readBuffer);
  const mipLevelBytes = new Uint8Array(await readBuffer.readAsync(0, layout.byteLength));
  expect(
    Array.from(mipLevelBytes.slice(0, 4)),
    'WebGPU device method generates level 1 mip data'
  ).toEqual([128, 128, 128, 255]);

  readBuffer.destroy();
  texture.destroy();
  void 0;
});

it('Device debug default helper respects log debug before NODE_ENV', () => {
  expect(
    _getDefaultDebugValue(true, 'production'),
    'log debug true overrides production NODE_ENV'
  ).toBe(true);
  expect(
    _getDefaultDebugValue(false, 'development'),
    'log debug false overrides development NODE_ENV'
  ).toBe(false);
  expect(
    _getDefaultDebugValue(undefined, 'production'),
    'production NODE_ENV defaults debug to false'
  ).toBe(false);
  expect(
    _getDefaultDebugValue(undefined, 'development'),
    'non-production NODE_ENV defaults debug to true'
  ).toBe(true);
  expect(
    _getDefaultDebugValue(undefined, undefined),
    'missing NODE_ENV defaults debug to false'
  ).toBe(false);
  void 0;
});

it('Device manages debug GPU timing through a single API', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  device._disableDebugGPUTime();
  expect(device._isDebugGPUTimeEnabled(), 'GPU timing starts disabled').toBe(false);

  const querySet = device._enableDebugGPUTime();
  const shouldEnable = device._supportsDebugGPUTime();
  expect(device._isDebugGPUTimeEnabled(), 'enableDebugGPUTime follows device policy').toBe(
    shouldEnable
  );
  expect(
    device.commandEncoder.getTimeProfilingQuerySet(),
    'command encoder picks up the device-managed timing query set'
  ).toBe(querySet);

  device._disableDebugGPUTime();
  expect(
    device._isDebugGPUTimeEnabled(),
    'disableDebugGPUTime clears the device timing query'
  ).toBe(false);
  expect(
    device.commandEncoder.getTimeProfilingQuerySet(),
    'disableDebugGPUTime removes the profiling query set from the command encoder'
  ).toBe(null);

  void 0;
});

it.skip('WebGLDevice#lost (Promise)', async () => {
  const device = await luma.createDevice({
    id: 'webgl-test-device-lost',
    type: 'webgl',
    adapters: [webgl2Adapter],
    createCanvasContext: {width: 1, height: 1},
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
  void 0;
});
