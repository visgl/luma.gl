// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  Texture,
  type Device,
  type RenderPass,
  type RenderPipelineParameters
} from '@luma.gl/core';
import * as wgsl from './shaders.wgsl';
import {triangle, river, canyon, relief, capturedColor} from './shaders';

/** Creates an atlas and owns its GPU resources until destroy is called. */
export function createAtlas(device: Device, kind: 'river' | 'canyon') {
  const resources: {destroy(): void}[] = [];
  const isWebGPU = device.type === 'webgpu';
  /** Allocates a per-draw WebGPU settings buffer. */
  function settingsBuffer() {
    if (!isWebGPU) return null;
    const buffer = device.createBuffer({byteLength: 16, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    resources.push(buffer);
    return buffer;
  }
  /** Gets the current canvas framebuffer with the scene’s depth format. */
  const surface = () =>
    device.getDefaultCanvasContext().getCurrentFramebuffer({
      depthStencilFormat: kind === 'river' ? 'depth24plus-stencil8' : 'depth24plus'
    });
  /** Builds an attribute-free pipeline for the active backend. */
  function pipeline(
    vertex: string,
    fragment: string,
    parameters: RenderPipelineParameters,
    points = false
  ) {
    if (isWebGPU) {
      const source =
        wgsl.header +
        (points || fragment === river ? wgsl.settings : '') +
        (points ? wgsl.points : wgsl.triangle) +
        (fragment === river ? wgsl.river : fragment === canyon ? wgsl.canyon : wgsl.color);
      const shader = device.createShader({source});
      const result = device.createRenderPipeline({
        vs: shader,
        fs: shader,
        vertexEntryPoint: 'vertexMain',
        fragmentEntryPoint: 'fragmentMain',
        colorAttachmentFormats: [fragment === canyon ? 'rgba8unorm' : device.preferredColorFormat],
        depthStencilAttachmentFormat: kind === 'river' ? 'depth24plus-stencil8' : 'depth24plus',
        parameters,
        topology: points ? 'point-list' : 'triangle-list'
      });
      resources.push(shader, result);
      return result;
    }
    const vertexShader = device.createShader({stage: 'vertex', source: vertex});
    const fragmentShader = device.createShader({stage: 'fragment', source: fragment});
    resources.push(vertexShader, fragmentShader);
    const result = device.createRenderPipeline({
      vs: vertexShader,
      fs: fragmentShader,
      parameters,
      topology: points ? 'point-list' : 'triangle-list'
    });
    resources.push(result);
    return result;
  }
  const lenses = [
    [-0.16, 0.03],
    [0.16, -0.03]
  ];
  let angle = 0;
  let render: (time: number) => boolean;
  if (kind === 'river') {
    const writers = [1, 2].map(bit =>
      pipeline(triangle, river, {
        colorMask: 0,
        stencilCompare: 'always',
        stencilWriteMask: bit,
        stencilPassOperation: 'replace'
      })
    );
    const reader = pipeline(triangle, river, {
      stencilCompare: 'equal',
      stencilReadMask: 3,
      stencilWriteMask: 0
    });
    const buffers = Array.from({length: 6}, settingsBuffer);
    render = time => {
      const pass = device.beginRenderPass({framebuffer: surface(), clearStencil: 0});
      for (const [index, writer] of writers.entries()) {
        pass.setPipeline(writer);
        pass.setParameters({stencilReference: index + 1});
        const buffer = buffers[index];
        if (buffer) {
          buffer.write(new Float32Array([...lenses[index], -1, time]));
          pass.setBindings({settings: buffer});
        }
        pass.draw({vertexCount: 3, uniforms: {mode: -1, lens: lenses[index]}});
      }
      pass.setPipeline(reader);
      for (let mode = 0; mode < 4; mode++) {
        pass.setParameters({stencilReference: mode});
        const buffer = buffers[mode + 2];
        if (buffer) {
          buffer.write(new Float32Array([0, 0, mode, time]));
          pass.setBindings({settings: buffer});
        }
        pass.draw({vertexCount: 3, uniforms: {mode, time, lens: [0, 0]}});
      }
      pass.end();
      device.submit();
      return true;
    };
  } else {
    const textureProps = {
      width: 640,
      height: 400,
      usage: Texture.RENDER | Texture.SAMPLE,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'} as const
    };
    const capturedImage = device.createTexture({...textureProps, format: 'rgba8unorm'});
    const capturedDepth = device.createTexture({...textureProps, format: 'depth24plus'});
    const framebuffer = device.createFramebuffer({
      width: 640,
      height: 400,
      colorAttachments: [capturedImage],
      depthStencilAttachment: capturedDepth
    });
    resources.push(capturedImage, capturedDepth, framebuffer);
    const landscape = pipeline(triangle, canyon, {
      depthCompare: 'less-equal',
      depthWriteEnabled: true
    });
    const pointCloud = pipeline(
      relief,
      capturedColor,
      {depthCompare: 'less-equal', depthWriteEnabled: true},
      true
    );
    const rotation = settingsBuffer();
    const photograph = pipeline(triangle, capturedColor, {});
    /** Whether the one-time capture has successfully drawn and been submitted. */
    let captured = false;
    render = () => {
      if (!captured) {
        const capture = device.beginRenderPass({framebuffer, clearDepth: 1});
        capture.setPipeline(landscape);
        captured = capture.draw({vertexCount: 3});
        capture.end();
        device.submit();
        if (landscape.isErrored) throw new Error('Could not link the canyon capture pipeline.');
        if (!captured) return false;
      }
      let drawn: boolean;
      const pass: RenderPass = device.beginRenderPass({
        framebuffer: surface(),
        clearColor: [0.025, 0.038, 0.065, 1],
        clearDepth: 1
      });
      if (angle === 0) {
        pass.setPipeline(photograph);
        pass.setBindings({capturedImage});
        drawn = pass.draw({vertexCount: 3});
      } else {
        pass.setPipeline(pointCloud);
        if (rotation) rotation.write(new Float32Array([angle, 0, 0, 0]));
        pass.setBindings(
          rotation
            ? {capturedImage, capturedDepth, settings: rotation}
            : {capturedImage, capturedDepth}
        );
        drawn = pass.draw({vertexCount: 640 * 400, uniforms: {angle}});
      }
      pass.end();
      device.submit();
      if ((angle === 0 ? photograph : pointCloud).isErrored) {
        throw new Error('Could not link the canyon display pipeline.');
      }
      return drawn;
    };
  }
  return {
    render,
    lenses,
    /** Sets the canyon relief rotation in radians. */
    setAngle(value: number) {
      angle = value;
    },
    /** Releases owned resources in reverse creation order. */
    destroy() {
      for (const resource of resources.reverse()) resource.destroy();
    }
  };
}
