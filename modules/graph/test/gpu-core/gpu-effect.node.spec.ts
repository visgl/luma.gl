// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {GPUEffect, GPUGraph, GPUShaderPassOperation, appendEffects, gpuGraph} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';

function pass(input = 'color', output = 'result') {
  return new GPUShaderPassOperation({
    inputs: {image: input},
    output,
    parameters: {gain: 'gain'},
    fragmentSource:
      'fn shade(textureCoordinates: vec2<f32>) -> vec4<f32> {return vec4<f32>(parameters.gain);}',
    outputDescriptor: gpuGraph.texture({
      format: 'rgba8unorm',
      extent: {like: input, scale: [0.5, 0.5]}
    })
  });
}

test('effect links snapshot descriptions, scalar ports and relative extents without device work', () => {
  const operations = [pass()];
  const effect = new GPUEffect({
    input: 'color',
    output: 'result',
    parameters: ['gain'],
    operations
  });
  operations.length = 0;
  expect(effect.operations).toHaveLength(1);
  expect(Object.isFrozen(effect.operations[0])).toBe(true);
  const graph = new GPUGraph();
  graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
  graph.addInput('scale', gpuGraph.scalar('float32'));
  const output = appendEffects(graph, {
    input: 'image',
    output: 'final',
    effects: [
      {effect, parameters: {gain: 'scale'}},
      {effect, parameters: {gain: 'scale'}}
    ]
  });
  const program = new GPUExpressionProgram(graph, {outputs: [output]});
  expect(program.outputs).toEqual(['final']);
  expect(program.textures.map(texture => texture.id)).toEqual([
    'image',
    'final/effect-0/result',
    'final'
  ]);
  expect(program.textures[2].descriptor?.extent).toEqual({
    like: 'final/effect-0/result',
    scale: [0.5, 0.5]
  });
  expect(effect.operations[0].inputs.image).toBe('color');
});

test('invalid fragments and missing bindings fail before graph mutation', () => {
  expect(() => new GPUEffect({input: 'color', output: 'result', operations: [pass()]})).toThrow();
  expect(
    () =>
      new GPUEffect({
        input: 'color',
        output: 'result',
        parameters: ['gain'],
        operations: [pass('unknown')]
      })
  ).toThrow();
  expect(
    () =>
      new GPUEffect({
        input: 'color',
        output: 'result',
        parameters: ['gain'],
        operations: [pass(), pass()]
      })
  ).toThrow();
  const effect = new GPUEffect({
    input: 'color',
    output: 'result',
    parameters: ['gain'],
    operations: [pass()]
  });
  const graph = {add: vi.fn()};
  expect(() =>
    appendEffects(graph, {input: 'image', output: 'result', effects: [{effect}]})
  ).toThrow();
  expect(graph.add).not.toHaveBeenCalled();
  expect(() =>
    appendEffects(graph, {
      input: 'image',
      output: 'result',
      effects: [{effect, parameters: Object.create({gain: 'scale'})}]
    })
  ).toThrow();
  expect(graph.add).not.toHaveBeenCalled();
  expect(appendEffects(graph, {input: 'image', output: 'result', effects: []})).toBe('image');
  expect(graph.add).not.toHaveBeenCalled();
});
