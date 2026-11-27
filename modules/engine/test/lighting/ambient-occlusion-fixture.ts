// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {ClipSpace} from '@luma.gl/engine';
import {PBRSurfacePass} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core/matrix';

/** Two parallel planes with a foreground rectangle and a flat, unoccluded border. */
export function createOcclusionFixture(device: Device, width: number, height: number) {
  const surface = new PBRSurfacePass(device, {width, height});
  const model = new ClipSpace(device, {
    parameters: {depthWriteEnabled: true, depthCompare: 'less', depthFormat: 'depth32float'},
    source: /* wgsl */ `
struct Output {
  @location(0) normal: vec4f,
  @builtin(frag_depth) depth: f32,
};
@fragment
fn fragmentMain(inputs: FragmentInputs) -> Output {
  let foreground = all(abs(inputs.uv - vec2f(0.5)) < vec2f(0.15));
  return Output(vec4f(0.5, 0.5, 1.0, 1.0), select(0.985, 0.982, foreground));
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
in vec2 uv;
out vec4 normal;
void main() {
  bool foreground = all(lessThan(abs(uv - vec2(0.5)), vec2(0.15)));
  gl_FragDepth = foreground ? 0.982 : 0.985;
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
  surface.render({drawSurfaces: ({renderPass}) => model.draw(renderPass)});
  device.submit();
  return {
    depthTexture: surface.depthTexture,
    normalTexture: surface.normalTexture,
    projectionMatrix,
    near,
    far,
    camera: {projectionMatrix, nearPlane: near, farPlane: far},
    destroy() {
      model.destroy();
      surface.destroy();
    }
  };
}
