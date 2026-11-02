// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture} from '@luma.gl/core';
import {
  GPUGraph,
  GPUEffect,
  type GPUEffectBinding,
  GPUShaderPassOperation,
  appendEffects,
  gpuGraph
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

/** A small illustrative bloom fragment; use scale=0.5 for half-resolution scratch. */
export function createBloomEffect(scale = 1): GPUEffect {
  const sampler = {imageSampler: {minFilter: 'linear', magFilter: 'linear'} as const};
  return new GPUEffect({
    id: 'bloom',
    input: 'color',
    output: 'result',
    parameters: ['strength'],
    operations: [
      new GPUShaderPassOperation({
        inputs: {image: 'color'},
        samplers: sampler,
        output: 'bright',
        outputDescriptor: gpuGraph.texture({
          format: 'rgba8unorm',
          extent: {like: 'color', scale: [scale, scale]}
        }),
        fragmentSource:
          'fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {let color = textureSample(image, imageSampler, textureCoordinates); return vec4<f32>(max(color.rgb - vec3<f32>(0.5), vec3<f32>(0.0)), 1.0);}'
      }),
      new GPUShaderPassOperation({
        inputs: {image: 'bright'},
        samplers: sampler,
        output: 'blurred',
        outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'bright'}}),
        fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
          let step = 1.0 / vec2<f32>(textureDimensions(image));
          return (textureSample(image, imageSampler, textureCoordinates + vec2<f32>(step.x, 0.0)) +
                  textureSample(image, imageSampler, textureCoordinates - vec2<f32>(step.x, 0.0)) +
                  textureSample(image, imageSampler, textureCoordinates + vec2<f32>(0.0, step.y)) +
                  textureSample(image, imageSampler, textureCoordinates - vec2<f32>(0.0, step.y))) * 0.25;
        }`
      }),
      new GPUShaderPassOperation({
        inputs: {image: 'color', bloom: 'blurred'},
        samplers: sampler,
        parameters: {strength: 'strength'},
        output: 'result',
        outputDescriptor: gpuGraph.texture({format: 'rgba8unorm', extent: {like: 'color'}}),
        fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
          let color = textureSample(image, imageSampler, textureCoordinates);
          return vec4<f32>(color.rgb + textureSample(bloom, imageSampler, textureCoordinates).rgb * parameters.strength, color.a);
        }`
      })
    ]
  });
}

/** Independently authored exposure and contrast passes, with private intermediate storage. */
export function createColorEffect(): GPUEffect {
  return new GPUEffect({
    id: 'color-adjustment',
    input: 'color',
    output: 'result',
    parameters: ['exposure', 'contrast'],
    operations: ['exposure', 'contrast'].map(
      (parameter, index) =>
        new GPUShaderPassOperation({
          inputs: {image: index ? 'exposed' : 'color'},
          samplers: {imageSampler: {}},
          parameters: {[parameter]: parameter},
          output: index ? 'result' : 'exposed',
          outputDescriptor: gpuGraph.texture({
            format: 'rgba8unorm',
            extent: {like: index ? 'exposed' : 'color'}
          }),
          fragmentSource: `fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {
        let color = textureSample(image, imageSampler, textureCoordinates);
        return vec4<f32>(${index ? '(color.rgb - vec3<f32>(0.5)) * parameters.contrast + vec3<f32>(0.5)' : 'color.rgb * parameters.exposure'}, color.a);
      }`
        })
    )
  });
}

export function compileEffects(device: Device, simple = false, scale = 1) {
  const graph = simple ? new GPUSimpleGraph() : new GPUGraph();
  graph.addInput('color', gpuGraph.texture({format: 'rgba8unorm'}));
  for (const name of ['strength', 'exposure', 'contrast'])
    graph.addInput(name, gpuGraph.scalar('float32'));
  // These can arrive separately from application configuration. Link once, then compile once.
  const effects: GPUEffectBinding[] = [
    {effect: createBloomEffect(scale), parameters: {strength: 'strength'}},
    {effect: createColorEffect(), parameters: {exposure: 'exposure', contrast: 'contrast'}}
  ];
  const output = appendEffects(graph, {input: 'color', output: 'result', effects});
  return graph.compile<{result: Texture}>(device, {outputs: [output]});
}
