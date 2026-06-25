// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type RenderPassProps} from '@luma.gl/core';
import {WebGPURenderBundleEncoder} from '../../../src/adapter/resources/webgpu-render-bundle';
import {WebGPURenderPass} from '../../../src/adapter/resources/webgpu-render-pass';

test('WebGPURenderPass omits depth operations for read-only depth attachments', t => {
  const renderPass = makeRenderPass({clearDepth: false, depthReadOnly: true});

  const renderPassDescriptor = renderPass.getRenderPassDescriptor(makeFramebuffer());
  const depthStencilAttachment = renderPassDescriptor.depthStencilAttachment;

  t.equal(depthStencilAttachment?.depthReadOnly, true, 'depth attachment is read only');
  t.notOk(depthStencilAttachment?.depthLoadOp, 'depth load operation is omitted');
  t.notOk(depthStencilAttachment?.depthStoreOp, 'depth store operation is omitted');
  t.notOk(depthStencilAttachment?.depthClearValue, 'depth clear value is omitted');

  t.end();
});

test('WebGPU indirect draw methods forward native buffers and byte offsets', t => {
  const device = {};
  const nativeBuffer = {};
  const indirectBuffer = {
    device,
    destroyed: false,
    usage: Buffer.INDIRECT,
    byteLength: 64,
    handle: nativeBuffer
  } as any;
  const calls: Array<{method: string; buffer: unknown; byteOffset: number}> = [];
  const vertexArrayCalls: string[] = [];
  const handle = {
    drawIndirect: (buffer: unknown, byteOffset: number) =>
      calls.push({method: 'drawIndirect', buffer, byteOffset}),
    drawIndexedIndirect: (buffer: unknown, byteOffset: number) =>
      calls.push({method: 'drawIndexedIndirect', buffer, byteOffset})
  };
  const renderPass = Object.create(WebGPURenderPass.prototype) as WebGPURenderPass;
  const vertexArray = {
    bindBeforeRender: (encoder: unknown) =>
      vertexArrayCalls.push(encoder === renderPass ? 'pass-bind' : 'bundle-bind'),
    unbindAfterRender: (encoder: unknown) =>
      vertexArrayCalls.push(encoder === renderPass ? 'pass-unbind' : 'bundle-unbind')
  };
  Object.assign(renderPass, {device, handle, vertexArray});
  const renderBundleEncoder = Object.create(
    WebGPURenderBundleEncoder.prototype
  ) as WebGPURenderBundleEncoder;
  Object.assign(renderBundleEncoder, {device, handle, vertexArray});

  renderPass.drawIndirect(indirectBuffer, 8);
  renderPass.drawIndexedIndirect(indirectBuffer, 20);
  renderBundleEncoder.drawIndirect(indirectBuffer, 12);
  renderBundleEncoder.drawIndexedIndirect(indirectBuffer, 28);

  t.deepEqual(
    calls,
    [
      {method: 'drawIndirect', buffer: nativeBuffer, byteOffset: 8},
      {method: 'drawIndexedIndirect', buffer: nativeBuffer, byteOffset: 20},
      {method: 'drawIndirect', buffer: nativeBuffer, byteOffset: 12},
      {method: 'drawIndexedIndirect', buffer: nativeBuffer, byteOffset: 28}
    ],
    'both encoders forward the native buffer and exact offset'
  );
  t.deepEqual(
    vertexArrayCalls,
    [
      'pass-bind',
      'pass-unbind',
      'pass-bind',
      'pass-unbind',
      'bundle-bind',
      'bundle-unbind',
      'bundle-bind',
      'bundle-unbind'
    ],
    'indirect draws bind and unbind the selected vertex array'
  );
  t.end();
});

function makeRenderPass(props: RenderPassProps): {
  getRenderPassDescriptor: (framebuffer: any) => GPURenderPassDescriptor;
} {
  const renderPass = Object.create(WebGPURenderPass.prototype) as WebGPURenderPass & {
    props: RenderPassProps;
  };
  renderPass.props = props;
  return renderPass;
}

function makeFramebuffer(): any {
  return {
    colorAttachments: [],
    depthStencilAttachment: {handle: {}}
  };
}
