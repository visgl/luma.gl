// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';

function getResourceCount(device: Device, resourceType: string): number {
  return device.statsManager.getStats('Resource Counts').get(`${resourceType} Active`).count;
}

it('Render bundles record reusable WebGPU commands', async () => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    void 0;
    void 0;
    return;
  }

  const renderBundleEncodersActive = getResourceCount(webgpuDevice, 'RenderBundleEncoders');
  const renderBundlesActive = getResourceCount(webgpuDevice, 'RenderBundles');
  const framebuffer = webgpuDevice.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm'],
    depthStencilAttachment: 'depth24plus'
  });
  const renderBundleEncoder = webgpuDevice.createRenderBundleEncoder({
    id: 'test-render-bundle',
    userData: {purpose: 'metadata inheritance'},
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth24plus'
  });
  expect(
    getResourceCount(webgpuDevice, 'RenderBundleEncoders'),
    'createRenderBundleEncoder tracks an active encoder'
  ).toBe(renderBundleEncodersActive + 1);

  const renderBundle = renderBundleEncoder.finish();
  expect(renderBundle.id, 'bundle inherits the encoder id').toBe(renderBundleEncoder.id);
  expect(renderBundle.userData, 'bundle inherits the encoder userData').toBe(
    renderBundleEncoder.userData
  );
  expect(
    getResourceCount(webgpuDevice, 'RenderBundleEncoders'),
    'finish releases the active encoder'
  ).toBe(renderBundleEncodersActive);
  expect(getResourceCount(webgpuDevice, 'RenderBundles'), 'finish tracks an active bundle').toBe(
    renderBundlesActive + 1
  );

  const renderPass = webgpuDevice.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 0],
    clearDepth: 1
  });
  renderPass.executeBundles([renderBundle]);
  renderPass.end();
  webgpuDevice.submit();

  renderBundle.destroy();
  framebuffer.destroy();

  expect(
    getResourceCount(webgpuDevice, 'RenderBundles'),
    'destroy releases the active bundle'
  ).toBe(renderBundlesActive);
  expect(
    () => webgpuDevice.createRenderBundleEncoder({clearColor: [0, 0, 0, 0]}),
    'render bundle encoder rejects render-pass setup props'
  ).toThrow(/RenderBundleEncoder does not support render pass props/);
  expect(
    () => webgpuDevice.createRenderBundleEncoder({sampleCount: 4}),
    'render bundle encoder rejects unsupported multisampling'
  ).toThrow(/RenderBundleEncoder currently only supports sampleCount 1/);

  void 0;
});

it('Render bundles are WebGPU only', async () => {
  for (const device of await getTestDevices(['webgl', 'null'])) {
    expect(
      () => device.createRenderBundleEncoder(),
      `${device.type} cannot create render bundles`
    ).toThrow(/Render bundles are only supported in WebGPU/);

    const renderPass = device.beginRenderPass({
      clearColor: false,
      clearDepth: false,
      clearStencil: false
    });
    expect(
      () => renderPass.executeBundles([]),
      `${device.type} cannot execute render bundles`
    ).toThrow(/Render bundles are only supported in WebGPU/);
    const indirectBuffer = device.createBuffer({byteLength: 20, usage: Buffer.INDIRECT});
    expect(
      () => renderPass.drawIndirect(indirectBuffer),
      `${device.type} cannot draw indirectly`
    ).toThrow(/Indirect drawing is only supported in WebGPU/);
    expect(
      () => renderPass.drawIndexedIndirect(indirectBuffer),
      `${device.type} cannot draw indexed indirectly`
    ).toThrow(/Indirect drawing is only supported in WebGPU/);
    indirectBuffer.destroy();
    renderPass.end();
  }

  void 0;
});
