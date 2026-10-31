// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
import {GPUGraph, GPUGraphCompiler, GPUConditionalOperation} from '@luma.gl/graph/gpu-core';
import {GPUShaderPipeline, registerShaderPipelineOperations} from '@luma.gl/engine/shader-pipeline';
import {NullDevice} from '@luma.gl/core/test-utils';
import {expect, test} from 'vitest';

const pass = {name: 'identity', source: '', passes: [{filter: true}]};
function setup() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const program = new GPUGraph();
  const input = program.texture('input', {
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.SAMPLE,
    external: true
  });
  const output = program.texture('output', {
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const texture = device.createTexture({
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.SAMPLE
  });
  const compiler = new GPUGraphCompiler(device);
  registerShaderPipelineOperations(compiler);
  return {device, program, input, output, texture, compiler};
}

test('shader pipelines lower into individually tracked program render nodes', () => {
  const {device, program, input, output, texture, compiler} = setup();
  try {
    program.add(new GPUShaderPipeline({id: 'effects', input, output, shaderPasses: [pass, pass]}));
    const result = compiler.compile(program, {textures: {input: texture}});
    expect(result.lowering.nodes).toHaveLength(4);
    expect(result.lowering.nodes.every(node => node.nodeType === 'render')).toBe(true);
    expect(result.lowering.nodes.every(node => node.operationPath.join('/') === 'effects')).toBe(
      true
    );
    expect(new Set(result.lowering.nodes.map(node => node.nodeId)).size).toBe(4);
    expect(result.textures.get('output')?.width).toBe(4);
  } finally {
    texture.destroy();
    device.destroy();
  }
});

test('program textures allow deferred bindings and use the shared value namespace', () => {
  const {device, program, compiler, texture} = setup();
  try {
    expect(() => compiler.compile(program)).not.toThrow();
    expect(() => program.scalar('input', 'float32')).toThrow(/already exists/);
  } finally {
    texture.destroy();
    device.destroy();
  }
});

test('shader pipelines reject history targets and unknown routing at compilation', () => {
  const {device, program, input, output, texture, compiler} = setup();
  try {
    program.add(
      new GPUShaderPipeline({
        id: 'history',
        input,
        output,
        shaderPasses: [
          {
            name: 'temporal',
            renderTargets: {history: {lifetime: 'history'}},
            steps: [{shaderPass: pass}]
          }
        ]
      })
    );
    expect(() => compiler.compile(program, {textures: {input: texture}})).toThrow(
      /history targets/
    );
  } finally {
    texture.destroy();
    device.destroy();
  }
  const next = setup();
  try {
    next.program.add(
      new GPUShaderPipeline({
        id: 'bad-route',
        input: next.input,
        output: next.output,
        shaderPasses: [
          {name: 'bad', steps: [{shaderPass: pass, inputs: {sourceTexture: 'missing'}}]}
        ]
      })
    );
    expect(() => next.compiler.compile(next.program, {textures: {input: next.texture}})).toThrow(
      /unknown texture source/
    );
  } finally {
    next.texture.destroy();
    next.device.destroy();
  }
});

test('render operations under GPU predicates are rejected instead of executing unconditionally', () => {
  const {device, program, input, output, texture, compiler} = setup();
  try {
    const predicate = program.scalar('predicate', 'uint32');
    program.add(
      new GPUConditionalOperation({
        predicate: {id: 'enabled', source: 'gpu', value: predicate},
        body: new GPUShaderPipeline({
          id: 'conditional-effects',
          input,
          output,
          shaderPasses: [pass]
        })
      })
    );
    expect(() => compiler.compile(program, {textures: {input: texture}})).toThrow(
      /GPU predicates do not support render/
    );
  } finally {
    texture.destroy();
    device.destroy();
  }
});

test('target aliases compare sampler values independently of property order', () => {
  for (const matches of [true, false]) {
    const {device, program, input, output, texture, compiler} = setup();
    try {
      program.add(
        new GPUShaderPipeline({
          id: 'sampler-alias',
          input,
          output,
          shaderPasses: [
            {
              name: 'aliased',
              renderTargets: {
                first: {sampler: {minFilter: 'linear', magFilter: 'nearest'}},
                alias: {
                  aliasFor: 'first',
                  sampler: {
                    magFilter: 'nearest',
                    minFilter: matches ? 'linear' : 'nearest'
                  }
                }
              },
              steps: [{shaderPass: pass}]
            }
          ]
        })
      );
      const compile = () => compiler.compile(program, {textures: {input: texture}});
      if (matches) expect(compile).not.toThrow();
      else expect(compile).toThrow(/must match an earlier transient target/);
    } finally {
      texture.destroy();
      device.destroy();
    }
  }
});

test('chained aliases inherit storage from the original target', () => {
  for (const storage of [true, false]) {
    const {device, program, input, output, texture, compiler} = setup();
    try {
      program.add(
        new GPUShaderPipeline({
          id: 'alias-chain',
          input,
          output,
          shaderPasses: [
            {
              name: 'aliased',
              renderTargets: {
                first: {storage},
                second: {aliasFor: 'first'},
                third: {aliasFor: 'second', storage: true}
              },
              steps: [{shaderPass: pass}]
            }
          ]
        })
      );
      const compile = () => compiler.compile(program, {textures: {input: texture}});
      if (storage) expect(compile).not.toThrow();
      else expect(compile).toThrow(/must match an earlier transient target/);
    } finally {
      texture.destroy();
      device.destroy();
    }
  }
});
