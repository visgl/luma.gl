// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture} from '@luma.gl/core';
import {GPUGraph, GPUShaderPassOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

/** The same color-adjustment operation runs through either WebGPU graph executor. */
export function compileColorAdjustment(device: Device, useSimpleGraph = false) {
  const graph = useSimpleGraph ? new GPUSimpleGraph() : new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.addInput('gain', gpuGraph.scalar('float32'));
  graph.add(
    new GPUShaderPassOperation({
      inputs: {imageTexture: 'image'},
      samplers: {imageSampler: {minFilter: 'nearest', magFilter: 'nearest'}},
      parameters: {gain: 'gain'},
      output: 'result',
      outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'image'}}),
      fragmentSource: `
fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
  let color = textureSample(imageTexture, imageSampler, textureCoordinates);
  return vec4<f32>(color.rgb * parameters.gain, color.a);
}`
    })
  );
  return graph.compile<{result: Texture}>(device);
}
