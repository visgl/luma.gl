// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GBuffer} from '@luma.gl/experimental';
import {getTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GBuffer rejects non-WebGPU devices', async () => {
  const device = await getTestDevice('null');
  if (device) {
    expect(
      () => new GBuffer(device, {width: 1, height: 1}),
      'non-WebGPU devices are rejected'
    ).toThrow(/WebGPU/);
  }
  void 0;
});

it('GBuffer owns semantic MRT attachments and shader-pass bindings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
  expect(gBuffer.framebuffer.colorAttachments.length, 'standard and extra MRTs are attached').toBe(
    5
  );
  expect(gBuffer.framebuffer.colorAttachments[0].texture, 'color is location 0').toBe(
    gBuffer.colorTexture
  );
  expect(
    gBuffer.framebuffer.colorAttachments[1].texture,
    'normal and roughness are location 1'
  ).toBe(gBuffer.normalRoughnessTexture);
  expect(gBuffer.framebuffer.colorAttachments[2].texture, 'velocity is location 2').toBe(
    gBuffer.velocityTexture
  );
  expect(gBuffer.depthTexture.format, 'depth uses the default format').toBe('depth24plus');
  expect(
    gBuffer.getShaderPassBindings(),
    'semantic textures map to existing shader-pass binding names'
  ).toEqual({
    depthTexture: gBuffer.depthTexture,
    normalTexture: gBuffer.normalRoughnessTexture,
    velocityTexture: gBuffer.velocityTexture
  });
  expect(gBuffer.getExtraColorTexture('emissive'), 'extra channels retain declaration order').toBe(
    gBuffer.framebuffer.colorAttachments[3].texture
  );
  expect(
    () => gBuffer.getExtraColorTexture('missing'),
    'unknown extra channel is rejected'
  ).toThrow(/no extra color attachment/);

  const previousColorTexture = gBuffer.colorTexture;
  expect(gBuffer.resize({width: 4, height: 2}), 'same size preserves targets').toBe(false);
  expect(gBuffer.resize({width: 8, height: 6}), 'new size recreates targets').toBe(true);
  expect(gBuffer.width, 'width updates').toBe(8);
  expect(gBuffer.height, 'height updates').toBe(6);
  expect(Boolean(previousColorTexture.destroyed), 'resize destroys superseded attachments').toBe(
    true
  );
  gBuffer.destroy();
  expect(Boolean(gBuffer.colorTexture.destroyed), 'destroy releases current attachments').toBe(
    true
  );
  void 0;
});

it('GBuffer omits unused velocity attachments on portable WebGPU devices', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  expect(
    device.limits.maxColorAttachmentBytesPerSample,
    'core WebGPU exposes its portable color-attachment limit'
  ).toBe(32);

  const gBuffer = new GBuffer(device, {
    id: 'test-compact-g-buffer',
    width: 4,
    height: 2,
    colorFormat: 'rgba16float',
    normalRoughnessFormat: 'rgba8unorm',
    velocity: false,
    extraColorAttachments: [
      {name: 'baseColorMetallic', format: 'rgba8unorm'},
      {name: 'emissiveOcclusion', format: 'rgba16float'}
    ]
  });

  expect(gBuffer.framebuffer.colorAttachments.length, 'unused velocity does not allocate MRT').toBe(
    4
  );
  expect(
    gBuffer.getExtraColorTexture('baseColorMetallic'),
    'the first extra attachment moves to location 2'
  ).toBe(gBuffer.framebuffer.colorAttachments[2].texture);
  expect(
    gBuffer.getExtraColorTexture('emissiveOcclusion'),
    'the second extra attachment moves to location 3'
  ).toBe(gBuffer.framebuffer.colorAttachments[3].texture);
  expect(() => gBuffer.velocityTexture, 'the velocity getter rejects disabled attachments').toThrow(
    /velocity attachment is disabled/
  );
  expect(
    () => gBuffer.getShaderPassBindings(),
    'velocity-aware shader-pass bindings reject disabled attachments'
  ).toThrow(/velocity attachment is disabled/);

  const previousColorTexture = gBuffer.colorTexture;
  const previousExtraTexture = gBuffer.getExtraColorTexture('baseColorMetallic');
  expect(gBuffer.resize({width: 4, height: 2}), 'same size preserves compact targets').toBe(false);
  expect(gBuffer.resize({width: 8, height: 6}), 'new size recreates compact targets').toBe(true);
  expect(
    Boolean(previousColorTexture.destroyed),
    'resize destroys the previous color attachment'
  ).toBe(true);
  expect(
    Boolean(previousExtraTexture.destroyed),
    'resize destroys the previous extra attachment'
  ).toBe(true);
  expect(gBuffer.framebuffer.colorAttachments.length, 'resized targets remain compact').toBe(4);

  const currentColorTexture = gBuffer.colorTexture;
  const currentExtraTexture = gBuffer.getExtraColorTexture('emissiveOcclusion');
  gBuffer.destroy();
  expect(
    Boolean(currentColorTexture.destroyed),
    'destroy releases the current color attachment'
  ).toBe(true);
  expect(
    Boolean(currentExtraTexture.destroyed),
    'destroy releases the current extra attachment'
  ).toBe(true);
  void 0;
});

it('GBuffer validates dimensions and extra attachment names', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  expect(() => new GBuffer(device, {width: 0, height: 1}), 'zero dimensions are rejected').toThrow(
    /positive safe integer/
  );
  expect(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        extraColorAttachments: [{name: 'velocity', format: 'rgba8unorm'}]
      }),
    'standard semantic names are reserved'
  ).toThrow(/reserved/);
  expect(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        extraColorAttachments: [
          {name: 'duplicate', format: 'rgba8unorm'},
          {name: 'duplicate', format: 'rgba8unorm'}
        ]
      }),
    'duplicate extra names are rejected'
  ).toThrow(/duplicated/);
  void 0;
});

it('GBuffer validates WebGPU color attachment byte cost', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const deferredGBuffer = new GBuffer(device, {
    width: 1,
    height: 1,
    colorFormat: 'rgba16float',
    normalRoughnessFormat: 'rgba8unorm',
    velocityFormat: 'rg16float',
    extraColorAttachments: [
      {name: 'emissive', format: 'rgba8unorm'},
      {name: 'objectId', format: 'rgba8uint'}
    ]
  });
  expect(
    deferredGBuffer.framebuffer.colorAttachments.length,
    'the deferred layout fits the core 32-byte attachment limit exactly'
  ).toBe(5);
  deferredGBuffer.destroy();

  expect(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        colorFormat: 'rgba8unorm',
        normalRoughnessFormat: 'rgba8unorm',
        velocityFormat: 'rg16float',
        extraColorAttachments: [
          {name: 'unshadowedColor', format: 'rgba8unorm'},
          {name: 'directionalDirect', format: 'rgba16float'},
          {name: 'shadowDebug', format: 'rgba16float'}
        ]
      }),
    'unsupported MRT byte cost fails before WebGPU enters a validation-error render loop'
  ).toThrow(/require 44 bytes per sample, but the device supports 32/);
  expect(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        colorFormat: 'rgb10a2unorm',
        normalRoughnessFormat: 'rgb10a2unorm',
        velocityFormat: 'rgb10a2unorm',
        extraColorAttachments: [
          {name: 'packed', format: 'rgb10a2unorm'},
          {name: 'flag', format: 'r8uint'}
        ]
      }),
    "packed 32-bit formats use WebGPU's eight-byte render-target cost"
  ).toThrow(/require 33 bytes per sample, but the device supports 32/);
  expect(
    () =>
      new GBuffer(device, {
        width: 1,
        height: 1,
        colorFormat: 'rgba16float',
        normalRoughnessFormat: 'r8uint',
        velocityFormat: 'rgba16float',
        extraColorAttachments: [
          {name: 'wide', format: 'rgba16float'},
          {name: 'firstFlag', format: 'r8uint'},
          {name: 'scalar', format: 'r32float'},
          {name: 'secondFlag', format: 'r8uint'}
        ]
      }),
    'mixed formats include WebGPU component-alignment padding'
  ).toThrow(/require 33 bytes per sample, but the device supports 32/);
  void 0;
});
