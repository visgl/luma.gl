// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {RenderPassProps} from '@luma.gl/core';
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
