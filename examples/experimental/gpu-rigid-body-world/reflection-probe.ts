// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device, type RenderPass} from '@luma.gl/core';
import {ClipSpace} from '@luma.gl/engine';
import {PBREnvironmentGenerator} from '@luma.gl/experimental';
import {Matrix4, type NumberArray3} from '@math.gl/core';

/** Captures static scene surfaces once; all capture and GGX filtering stay on the GPU. */
export function captureReflectionProbe(
  device: Device,
  eye: NumberArray3,
  draw: (pass: RenderPass, view: Matrix4, projection: Matrix4) => void
) {
  const size = 256;
  const cube = device.createTexture({
    id: 'cradle-reflection-capture',
    dimension: 'cube',
    width: size,
    height: size,
    depth: 6,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE,
    sampler: {minFilter: 'linear', magFilter: 'linear'}
  });
  const depth = device.createTexture({
    width: size,
    height: size,
    format: 'depth24plus',
    usage: Texture.RENDER
  });
  // Cube cameras use OpenGL face orientations. Flip clip Y for WebGPU
  // so rendered texels agree with texture_cube sampling at every face edge.
  const projection = new Matrix4([
    1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
  ]).multiplyRight(new Matrix4().perspective({fovy: Math.PI / 2, aspect: 1, near: 0.05, far: 50}));
  const faces: {direction: NumberArray3; up: NumberArray3}[] = [
    {direction: [1, 0, 0], up: [0, -1, 0]},
    {direction: [-1, 0, 0], up: [0, -1, 0]},
    {direction: [0, 1, 0], up: [0, 0, 1]},
    {direction: [0, -1, 0], up: [0, 0, -1]},
    {direction: [0, 0, 1], up: [0, -1, 0]},
    {direction: [0, 0, -1], up: [0, -1, 0]}
  ];
  for (const [index, face] of faces.entries()) {
    const view = new Matrix4().lookAt({
      eye,
      center: [eye[0] + face.direction[0], eye[1] + face.direction[1], eye[2] + face.direction[2]],
      up: face.up
    });
    const target = cube.createView({
      dimension: '2d',
      mipLevelCount: 1,
      baseArrayLayer: index,
      arrayLayerCount: 1
    });
    const framebuffer = device.createFramebuffer({
      width: size,
      height: size,
      colorAttachments: [target],
      depthStencilAttachment: depth
    });
    // Bright studio illumination is independent of the visible charcoal background.
    const pass = device.beginRenderPass({
      framebuffer,
      clearColor: [0.787, 0.828, 0.768, 1],
      clearDepth: 1
    });
    draw(pass, view, projection);
    pass.end();
    device.submit();
    framebuffer.destroy();
    target.destroy();
  }
  const panorama = device.createTexture({
    width: 512,
    height: 256,
    format: 'rgba16float',
    usage: Texture.RENDER | Texture.SAMPLE,
    sampler: {minFilter: 'linear', magFilter: 'linear'}
  });
  const framebuffer = device.createFramebuffer({
    colorAttachments: [panorama],
    depthStencilAttachment: null
  });
  const conversion = new ClipSpace(device, {
    id: 'cradle-reflection-panorama',
    colorAttachmentFormats: ['rgba16float'],
    source: `@group(0) @binding(0) var reflectionCapture:texture_cube<f32>;
@group(0) @binding(1) var reflectionSampler:sampler;
@fragment fn fragmentMain(input:FragmentInputs)->@location(0) vec4f {
 // Fragment position uses the same top-left image origin as the environment integrator.
 let coordinate=input.Position.xy/vec2f(512,256);
 let longitude=(coordinate.x-0.5)*6.283185307;let latitude=coordinate.y*3.141592654;
 let direction=vec3f(cos(longitude)*sin(latitude),cos(latitude),sin(longitude)*sin(latitude));
 return textureSampleLevel(reflectionCapture,reflectionSampler,direction,0);
}`,
    bindings: {reflectionCapture: cube, reflectionSampler: cube.sampler},
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'reflectionCapture', group: 0, location: 0, type: 'texture', viewDimension: 'cube'},
        {name: 'reflectionSampler', group: 0, location: 1, type: 'sampler'}
      ]
    }
  });
  const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1], clearDepth: false});
  conversion.draw(pass);
  pass.end();
  device.submit();
  const generator = new PBREnvironmentGenerator(device);
  const environment = generator.prepare({
    source: panorama,
    sourceEncoding: 'linear',
    size: 128,
    sampleCount: 64
  });
  device.submit();
  generator.destroy();
  conversion.destroy();
  framebuffer.destroy();
  panorama.destroy();
  depth.destroy();
  cube.destroy();
  return environment;
}
