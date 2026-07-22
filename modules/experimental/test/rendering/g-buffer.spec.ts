// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GBuffer} from '@luma.gl/experimental';
import {getTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GBuffer rejects non-WebGPU devices', async t => {
  const device = await getTestDevice('null');
  if (device) {
    t.throws(
      () => new GBuffer(device, {width: 1, height: 1}),
      /WebGPU/,
      'non-WebGPU devices are rejected'
    );
  }
  t.end();
});

test('GBuffer owns semantic MRT attachments and shader-pass bindings', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const gBuffer = new GBuffer(device, {
    id: 'test-g-buffer',
    width: 4,
    height: 2,
    extraColorAttachments: [
      {name: 'emissive', format: 'rgba8unorm'},
      {name: 'objectId', format: 'rgba16float'}
    ]
  });
  t.equal(gBuffer.framebuffer.colorAttachments.length, 5, 'standard and extra MRTs are attached');
  t.equal(
    gBuffer.framebuffer.colorAttachments[0].texture,
    gBuffer.colorTexture,
    'color is location 0'
  );
  t.equal(
    gBuffer.framebuffer.colorAttachments[1].texture,
    gBuffer.normalRoughnessTexture,
    'normal and roughness are location 1'
  );
  t.equal(
    gBuffer.framebuffer.colorAttachments[2].texture,
    gBuffer.velocityTexture,
    'velocity is location 2'
  );
  t.equal(gBuffer.depthTexture.format, 'depth24plus', 'depth uses the default format');
  t.deepEqual(
    gBuffer.getShaderPassBindings(),
    {
      depthTexture: gBuffer.depthTexture,
      normalTexture: gBuffer.normalRoughnessTexture,
      velocityTexture: gBuffer.velocityTexture
    },
    'semantic textures map to existing shader-pass binding names'
  );
  t.equal(
    gBuffer.getExtraColorTexture('emissive'),
    gBuffer.framebuffer.colorAttachments[3].texture,
    'extra channels retain declaration order'
  );
  t.throws(
    () => gBuffer.getExtraColorTexture('missing'),
    /no extra color attachment/,
    'unknown extra channel is rejected'
  );

  const previousColorTexture = gBuffer.colorTexture;
  t.equal(gBuffer.resize({width: 4, height: 2}), false, 'same size preserves targets');
  t.equal(gBuffer.resize({width: 8, height: 6}), true, 'new size recreates targets');
  t.equal(gBuffer.width, 8, 'width updates');
  t.equal(gBuffer.height, 6, 'height updates');
  t.ok(previousColorTexture.destroyed, 'resize destroys superseded attachments');
  gBuffer.destroy();
  t.ok(gBuffer.colorTexture.destroyed, 'destroy releases current attachments');
  t.end();
});

test('GBuffer validates dimensions and extra attachment names', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  t.throws(
    () => new GBuffer(device, {width: 0, height: 1}),
    /positive safe integer/,
    'zero dimensions are rejected'
  );
  t.throws(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        extraColorAttachments: [{name: 'velocity', format: 'rgba8unorm'}]
      }),
    /reserved/,
    'standard semantic names are reserved'
  );
  t.throws(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        extraColorAttachments: [
          {name: 'duplicate', format: 'rgba8unorm'},
          {name: 'duplicate', format: 'rgba8unorm'}
        ]
      }),
    /duplicated/,
    'duplicate extra names are rejected'
  );
  t.end();
});
