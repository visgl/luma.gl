// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, Texture, type TextureFormatDepthStencil} from '@luma.gl/core';
import {ClipSpace} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';

/** Two parallel planes with a foreground rectangle and a flat, unoccluded border. */
export function createOcclusionFixture(
  device: Device,
  width: number,
  height: number,
  depthFormat: TextureFormatDepthStencil = 'depth32float',
  fineDetail = false
) {
  const usage = Texture.RENDER_ATTACHMENT | Texture.SAMPLE;
  const sampler = {minFilter: 'nearest', magFilter: 'nearest'} as const;
  const depthTexture = device.createTexture({width, height, format: depthFormat, usage, sampler});
  const normalTexture = device.createTexture({width, height, format: 'rgba8unorm', usage, sampler});
  const framebuffer = device.createFramebuffer({
    width,
    height,
    colorAttachments: [normalTexture],
    depthStencilAttachment: depthTexture
  });
  const model = new ClipSpace(device, {
    parameters: {depthWriteEnabled: true, depthCompare: 'less', depthFormat},
    source: /* wgsl */ `
struct Output {
  @location(0) normal: vec4f,
  @builtin(frag_depth) depth: f32,
};
@fragment
fn fragmentMain(inputs: FragmentInputs) -> Output {
  let offset = inputs.uv - vec2f(0.5);
  let rectangle = all(abs(offset) < vec2f(0.15));
  let diagonal = abs(offset.x + 0.5 * offset.y - 0.19) < 0.001;
  let foreground = rectangle || (${fineDetail} && diagonal && abs(offset.y) < 0.24);
  return Output(vec4f(0.5, 0.5, 1.0, 1.0), select(0.985, ${fineDetail ? 0.984 : 0.982}, foreground));
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
in vec2 uv;
out vec4 normal;
void main() {
  vec2 offset = uv - vec2(0.5);
  bool rectangle = all(lessThan(abs(offset), vec2(0.15)));
  bool diagonal = abs(offset.x + 0.5 * offset.y - 0.19) < 0.001;
  bool foreground = rectangle || (${fineDetail} && diagonal && abs(offset.y) < 0.24);
  gl_FragDepth = foreground ? ${fineDetail ? 0.984 : 0.982} : 0.985;
  normal = vec4(0.5, 0.5, 1.0, 1.0);
}`
  });
  const near = 0.1;
  const far = 10;
  const projectionMatrix = new Matrix4().perspective({
    fovy: Math.PI / 3,
    aspect: width / height,
    near,
    far
  });
  if (device.type === 'webgpu') {
    projectionMatrix.multiplyLeft(
      new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1])
    );
  }
  const renderPass = device.beginRenderPass({framebuffer, clearDepth: 1});
  renderPass.setParameters({viewport: [0, 0, width, height]});
  model.draw(renderPass);
  renderPass.end();
  device.submit();
  return {
    depthTexture,
    normalTexture,
    projectionMatrix,
    near,
    far,
    camera: {projectionMatrix, nearPlane: near, farPlane: far},
    destroy() {
      model.destroy();
      framebuffer.destroy();
      depthTexture.destroy();
      normalTexture.destroy();
    }
  };
}
