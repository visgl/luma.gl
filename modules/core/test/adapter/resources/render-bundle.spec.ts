// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {getTestDevices, getWebGPUTestDevice} from '@luma.gl/test-utils';

function getResourceCount(device: Device, resourceType: string): number {
  return device.statsManager.getStats('Resource Counts').get(`${resourceType} Active`).count;
}

test('Render bundles record reusable WebGPU commands', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
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
  t.equal(
    getResourceCount(webgpuDevice, 'RenderBundleEncoders'),
    renderBundleEncodersActive + 1,
    'createRenderBundleEncoder tracks an active encoder'
  );

  const renderBundle = renderBundleEncoder.finish();
  t.equal(renderBundle.id, renderBundleEncoder.id, 'bundle inherits the encoder id');
  t.equal(
    renderBundle.userData,
    renderBundleEncoder.userData,
    'bundle inherits the encoder userData'
  );
  t.equal(
    getResourceCount(webgpuDevice, 'RenderBundleEncoders'),
    renderBundleEncodersActive,
    'finish releases the active encoder'
  );
  t.equal(
    getResourceCount(webgpuDevice, 'RenderBundles'),
    renderBundlesActive + 1,
    'finish tracks an active bundle'
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

  t.equal(
    getResourceCount(webgpuDevice, 'RenderBundles'),
    renderBundlesActive,
    'destroy releases the active bundle'
  );
  t.throws(
    // @ts-expect-error RenderPass setup properties are not valid for a RenderBundleEncoder.
    () => webgpuDevice.createRenderBundleEncoder({clearColor: [0, 0, 0, 0]}),
    /RenderBundleEncoder does not support render pass props/,
    'render bundle encoder rejects render-pass setup props'
  );
  t.throws(
    () => webgpuDevice.createRenderBundleEncoder({sampleCount: 4}),
    /RenderBundleEncoder currently only supports sampleCount 1/,
    'render bundle encoder rejects unsupported multisampling'
  );

  t.end();
});

test('Render bundles are WebGPU only', async t => {
  for (const device of await getTestDevices(['webgl', 'null'])) {
    t.throws(
      () => device.createRenderBundleEncoder(),
      /Render bundles are only supported in WebGPU/,
      `${device.type} cannot create render bundles`
    );

    const renderPass = device.beginRenderPass({
      clearColor: false,
      clearDepth: false,
      clearStencil: false
    });
    t.throws(
      () => renderPass.executeBundles([]),
      /Render bundles are only supported in WebGPU/,
      `${device.type} cannot execute render bundles`
    );
    const indirectBuffer = device.createBuffer({byteLength: 20, usage: Buffer.INDIRECT});
    t.throws(
      () => renderPass.drawIndirect(indirectBuffer),
      /Indirect drawing is only supported in WebGPU/,
      `${device.type} cannot draw indirectly`
    );
    t.throws(
      () => renderPass.drawIndexedIndirect(indirectBuffer),
      /Indirect drawing is only supported in WebGPU/,
      `${device.type} cannot draw indexed indirectly`
    );
    indirectBuffer.destroy();
    renderPass.end();
  }

  t.end();
});
