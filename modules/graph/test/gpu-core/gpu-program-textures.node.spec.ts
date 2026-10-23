// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture} from '@luma.gl/core';
import {
  GPUProgram,
  GPUProgramCompiler,
  GPUProgramTexture,
  GPUConditionalOperation,
  type GraphTextureView
} from '@luma.gl/graph/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

function createDevice() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  return device;
}

test('program textures preserve full graph descriptors and concrete format typing', () => {
  const device = createDevice();
  const program = new GPUProgram();
  const array = program.texture('array', {
    format: 'rgba16float',
    width: 16,
    height: 8,
    dimension: '2d-array',
    depth: 4,
    mipLevels: 3,
    usage: Texture.SAMPLE | Texture.STORAGE
  });
  program.texture('depth', {
    format: 'depth24plus',
    width: 16,
    height: 8,
    samples: 4,
    usage: Texture.RENDER
  });
  const selection = program.textureView(array, {
    dimension: '2d',
    baseMipLevel: 1,
    mipLevelCount: 1,
    baseArrayLayer: 2,
    arrayLayerCount: 1
  });
  const compiler = new GPUProgramCompiler(device);
  let resolved: GraphTextureView<'rgba16float'> | undefined;
  compiler.lowerings.register('inspect', (_operation, context) => {
    resolved = context.resolveTextureView(selection);
    expect(context.resolveTexture(array)).toBe(resolved.texture);
  });
  program.add({id: 'inspect', type: 'inspect'});
  try {
    const compilation = compiler.compile(program);
    expect(compilation.textures.get('array')).toMatchObject({
      dimension: '2d-array',
      depth: 4,
      mipLevels: 3
    });
    expect(compilation.textures.get('depth')).toMatchObject({format: 'depth24plus', samples: 4});
    expect(resolved).toMatchObject({width: 8, height: 4, baseArrayLayer: 2, arrayLayerCount: 1});
  } finally {
    device.destroy();
  }
});

test('program texture imports can be bound at encoding and remain borrowed', () => {
  const device = createDevice();
  const program = new GPUProgram();
  const source = program.texture('source', {
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.COPY_SRC,
    external: true
  });
  const compiler = new GPUProgramCompiler(device);
  let seen: Texture | undefined;
  compiler.lowerings.register('read', (_operation, context) => {
    const texture = context.resolveTexture(source);
    context.graph.addCopyPass({
      id: 'read',
      resources: [{texture, usage: 'copy-source'}],
      compile: () => ({
        encode: encoding => {
          seen = encoding.getTexture(texture);
        }
      })
    });
  });
  program.add({id: 'read', type: 'read'});
  const compilation = compiler.compile(program);
  const compiled = compilation.graph.compile();
  const texture = device.createTexture({
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.COPY_SRC
  });
  const encoder = device.createCommandEncoder();
  try {
    expect(() => compiled.encode(encoder, {parameters: undefined})).toThrow();
    compiled.encode(encoder, {parameters: undefined, textures: {source: texture}});
    expect(seen).toBe(texture);
    compiled.destroy();
    expect(texture.destroyed).toBe(false);
  } finally {
    compiled.destroy();
    encoder.destroy();
    texture.destroy();
    device.destroy();
  }
});

test('program texture views reject foreign identity and invalid subresources', () => {
  const device = createDevice();
  const program = new GPUProgram();
  const texture = program.texture('image', {
    format: 'rgba8unorm',
    width: 4,
    height: 4,
    usage: Texture.SAMPLE
  });
  const foreign = new GPUProgramTexture({...texture});
  expect(() => program.textureView(foreign)).toThrow(/Undeclared/);
  expect(() => program.scalar('image', 'float32')).toThrow(/already exists/);
  const compiler = new GPUProgramCompiler(device);
  compiler.lowerings.register('foreign', (_operation, context) => {
    context.resolveTexture(foreign);
  });
  program.add({id: 'foreign', type: 'foreign'});
  expect(() => compiler.compile(program)).toThrow(/Undeclared/);
  const invalid = new GPUProgram();
  const small = invalid.texture('small', {...texture});
  const view = invalid.textureView(small, {baseMipLevel: 2});
  compiler.lowerings.register('invalid-view', (_operation, context) => {
    context.resolveTextureView(view);
  });
  invalid.add({id: 'invalid-view', type: 'invalid-view'});
  expect(() => compiler.compile(invalid)).toThrow();
  device.destroy();
});

test('render and copy lowering preserves operation attribution and rejects GPU predicates', () => {
  const device = createDevice();
  const compiler = new GPUProgramCompiler(device);
  compiler.lowerings.register('render', (_operation, context) => {
    context.graph.addRenderPass({id: 'draw', resources: [], compile: () => ({encode: () => {}})});
    context.graph.addCopyPass({id: 'copy', resources: [], compile: () => ({encode: () => {}})});
  });
  const program = new GPUProgram();
  program.add({id: 'image-operation', type: 'render'});
  expect(compiler.compile(program).lowering.nodes).toEqual([
    {nodeId: 'draw', nodeType: 'render', operationPath: ['image-operation']},
    {nodeId: 'copy', nodeType: 'copy', operationPath: ['image-operation']}
  ]);
  const conditional = new GPUProgram();
  const predicate = conditional.scalar('predicate', 'uint32');
  conditional.add(
    new GPUConditionalOperation({
      predicate: {id: 'active', source: 'gpu', value: predicate},
      body: {id: 'conditional-render', type: 'render'}
    })
  );
  expect(() => compiler.compile(conditional)).toThrow(/GPU predicates do not support render/);
  device.destroy();
});

test('array layers do not increase the valid mip count', () => {
  const device = createDevice();
  const program = new GPUProgram();
  program.texture('layers', {
    format: 'rgba8unorm',
    width: 1,
    height: 1,
    dimension: '2d-array',
    depth: 8,
    mipLevels: 2,
    usage: Texture.SAMPLE
  });
  expect(() => new GPUProgramCompiler(device).compile(program)).toThrow(/too many mip levels/);
  device.destroy();
});

test('delegating lowerers decorate copy dependencies exactly once', () => {
  const device = createDevice();
  const compiler = new GPUProgramCompiler(device);
  compiler.lowerings.register('delegate', (_operation, context) => {
    context.lower({id: 'child', type: 'copies'});
  });
  compiler.lowerings.register('copies', (_operation, context) => {
    context.graph.addCopyPass({id: 'first', resources: [], compile: () => ({encode: () => {}})});
    context.graph.addCopyPass({
      id: 'second',
      dependsOn: ['first'],
      resources: [],
      compile: () => ({encode: () => {}})
    });
  });
  const program = new GPUProgram();
  program.add({id: 'parent', type: 'delegate'});
  const compilation = compiler.compile(program);
  expect(compilation.lowering.nodes).toEqual([
    {nodeId: 'first', nodeType: 'copy', operationPath: ['parent', 'child']},
    {nodeId: 'second', nodeType: 'copy', operationPath: ['parent', 'child']}
  ]);
  const compiled = compilation.graph.compile();
  compiled.destroy();
  device.destroy();
});
