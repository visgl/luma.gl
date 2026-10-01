// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type RenderPassProps} from '@luma.gl/core';
import {WebGPURenderBundleEncoder} from '../../../src/adapter/resources/webgpu-render-bundle';
import {WebGPURenderPass} from '../../../src/adapter/resources/webgpu-render-pass';

it('WebGPURenderPass omits depth operations for read-only depth attachments', () => {
  const renderPass = makeRenderPass({clearDepth: false, depthReadOnly: true});

  const renderPassDescriptor = renderPass.getRenderPassDescriptor(makeFramebuffer());
  const depthStencilAttachment = renderPassDescriptor.depthStencilAttachment;

  expect(depthStencilAttachment?.depthReadOnly, 'depth attachment is read only').toBe(true);
  expect(Boolean(depthStencilAttachment?.depthLoadOp), 'depth load operation is omitted').toBe(
    false
  );
  expect(Boolean(depthStencilAttachment?.depthStoreOp), 'depth store operation is omitted').toBe(
    false
  );
  expect(Boolean(depthStencilAttachment?.depthClearValue), 'depth clear value is omitted').toBe(
    false
  );

  void 0;
});

it('WebGPURenderPass sets load and store operations for each depth-stencil aspect', () => {
  const renderPass = makeRenderPass({clearDepth: 1, clearStencil: 0});

  const depthOnly = renderPass.getRenderPassDescriptor(makeFramebuffer('depth24plus'))
    .depthStencilAttachment!;
  expect(depthOnly.depthLoadOp, 'depth format clears depth').toBe('clear');
  expect(depthOnly.stencilLoadOp, 'depth format has no stencil operations').toBeUndefined();

  const depthStencil = renderPass.getRenderPassDescriptor(makeFramebuffer('depth24plus-stencil8'))
    .depthStencilAttachment!;
  expect(depthStencil.depthLoadOp, 'depth-stencil format clears depth').toBe('clear');
  expect(depthStencil.stencilLoadOp, 'depth-stencil format clears stencil').toBe('clear');
  expect(depthStencil.stencilStoreOp, 'depth-stencil format stores stencil').toBe('store');
  expect(depthStencil.stencilClearValue, 'stencil clear value zero is forwarded').toBe(0);

  const stencilOnly = renderPass.getRenderPassDescriptor(makeFramebuffer('stencil8'))
    .depthStencilAttachment!;
  expect(stencilOnly.depthLoadOp, 'stencil format has no depth operations').toBeUndefined();
  expect(stencilOnly.stencilLoadOp, 'stencil format clears stencil').toBe('clear');
});

it('WebGPU indirect draw methods forward native buffers and byte offsets', () => {
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

  expect(calls, 'both encoders forward the native buffer and exact offset').toEqual([
    {method: 'drawIndirect', buffer: nativeBuffer, byteOffset: 8},
    {method: 'drawIndexedIndirect', buffer: nativeBuffer, byteOffset: 20},
    {method: 'drawIndirect', buffer: nativeBuffer, byteOffset: 12},
    {method: 'drawIndexedIndirect', buffer: nativeBuffer, byteOffset: 28}
  ]);
  expect(vertexArrayCalls, 'indirect draws bind and unbind the selected vertex array').toEqual([
    'pass-bind',
    'pass-unbind',
    'pass-bind',
    'pass-unbind',
    'bundle-bind',
    'bundle-unbind',
    'bundle-bind',
    'bundle-unbind'
  ]);
  void 0;
});

it('WebGPU non-indexed draws forward firstVertex', () => {
  const calls: unknown[][] = [];
  const handle = {
    draw: (...args: unknown[]) => calls.push(args)
  };
  const renderPass = Object.create(WebGPURenderPass.prototype) as WebGPURenderPass;
  const pipeline = {shaderLayout: {bindings: []}};
  const vertexArray = {
    bindBeforeRender: () => {},
    unbindAfterRender: () => {}
  };
  Object.assign(renderPass, {handle, pipeline, vertexArray});

  renderPass.draw({vertexCount: 12, instanceCount: 3, firstVertex: 7, firstIndex: 19});

  expect(calls, 'draw() uses firstVertex for non-indexed draws').toEqual([[12, 3, 7, undefined]]);
  void 0;
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

function makeFramebuffer(depthStencilFormat: string = 'depth24plus'): any {
  return {
    colorAttachments: [],
    depthStencilAttachment: {handle: {}, texture: {format: depthStencilFormat}}
  };
}
