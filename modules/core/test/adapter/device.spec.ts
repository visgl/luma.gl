// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Texture} from '@luma.gl/core';
import {getNullTestDevice, getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {_getDefaultDebugValue} from '../../src/adapter/device';

// import {luma} from '@luma.gl/core';

test('Device#info', async t => {
  for (const device of await getTestDevices()) {
    // TODO
    t.ok(typeof device.info.vendor === 'string', 'info.vendor ok');
    t.ok(typeof device.info.renderer === 'string', 'info.renderer ok');
  }
  t.end();
});

// Minimal test, extensive test in texture-formats.spec
test('Device#isTextureFormatCompressed', async t => {
  for (const device of await getTestDevices()) {
    // Just sanity check two types
    t.equal(device.isTextureFormatCompressed('rgba8unorm'), false);
    t.equal(device.isTextureFormatCompressed('bc3-rgba-unorm'), true);
  }
  t.end();
});

test('Device#getSupportedCompressedTextureFormats', async t => {
  for (const device of await getTestDevices()) {
    const formats = device.getSupportedCompressedTextureFormats();

    t.ok(Array.isArray(formats), `${device.id} returns an array`);
    t.equal(
      new Set(formats).size,
      formats.length,
      `${device.id} does not return duplicate formats`
    );

    for (const format of formats) {
      t.equal(
        device.isTextureFormatCompressed(format),
        true,
        `${device.id} returns only compressed formats`
      );
      t.equal(
        device.isTextureFormatSupported(format),
        true,
        `${device.id} returns only supported compressed formats`
      );
    }
  }
  t.end();
});

test('Device#generateMipmapsWebGPU throws on non-WebGPU devices', async t => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({
    width: 2,
    height: 2,
    format: 'rgba8unorm',
    mipLevels: 2
  });

  t.throws(
    () => device.generateMipmapsWebGPU(texture),
    /not implemented/,
    'base Device stub throws on unsupported device types'
  );

  texture.destroy();
  t.end();
});

test('WebGPUDevice#generateMipmapsWebGPU generates a mip chain', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
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

  const mipLevelArrayBuffer = await texture.readDataAsync({mipLevel: 1, width: 1, height: 1});
  const mipLevelBytes = new Uint8Array(mipLevelArrayBuffer);
  t.deepEqual(
    Array.from(mipLevelBytes.slice(0, 4)),
    [128, 128, 128, 255],
    'WebGPU device method generates level 1 mip data'
  );

  texture.destroy();
  t.end();
});

test('Device debug default helper respects log debug before NODE_ENV', t => {
  t.equal(
    _getDefaultDebugValue(true, 'production'),
    true,
    'log debug true overrides production NODE_ENV'
  );
  t.equal(
    _getDefaultDebugValue(false, 'development'),
    false,
    'log debug false overrides development NODE_ENV'
  );
  t.equal(
    _getDefaultDebugValue(undefined, 'production'),
    false,
    'production NODE_ENV defaults debug to false'
  );
  t.equal(
    _getDefaultDebugValue(undefined, 'development'),
    true,
    'non-production NODE_ENV defaults debug to true'
  );
  t.equal(
    _getDefaultDebugValue(undefined, undefined),
    false,
    'missing NODE_ENV defaults debug to false'
  );
  t.end();
});

test('Device manages debug GPU timing through a single API', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU device not available');
    t.end();
    return;
  }

  device._disableDebugGPUTime();
  t.equal(device._isDebugGPUTimeEnabled(), false, 'GPU timing starts disabled');

  const querySet = device._enableDebugGPUTime();
  const shouldEnable = device._supportsDebugGPUTime();
  t.equal(
    device._isDebugGPUTimeEnabled(),
    shouldEnable,
    'enableDebugGPUTime follows device policy'
  );
  t.equal(
    device.commandEncoder.getTimeProfilingQuerySet(),
    querySet,
    'command encoder picks up the device-managed timing query set'
  );

  device._disableDebugGPUTime();
  t.equal(
    device._isDebugGPUTimeEnabled(),
    false,
    'disableDebugGPUTime clears the device timing query'
  );
  t.equal(
    device.commandEncoder.getTimeProfilingQuerySet(),
    null,
    'disableDebugGPUTime removes the profiling query set from the command encoder'
  );

  t.end();
});

test.skip('WebGLDevice#lost (Promise)', async t => {
  const device = await luma.createDevice({});

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(async resolve => {
    setTimeout(async () => {
      const cause = await device.lost;
      t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
      t.end();
      resolve();
    }, 0);
    device.loseDevice();
  });

  device.destroy();
  t.end();
});
