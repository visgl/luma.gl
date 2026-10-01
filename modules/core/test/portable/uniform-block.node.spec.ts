// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {UniformBlock, UniformStore} from '../../src';
import type {Device} from '../../src';

test('unchanged scalar, vector and matrix values do not dirty a consumed uniform block', () => {
  const block = new UniformBlock({name: 'test'});
  const uniforms = {scale: 1, color: [1, 0, 0, 1], matrix: new Float32Array([1, 0, 0, 1])};
  block.setUniforms(uniforms);
  block.getAllUniforms();
  block.setUniforms({
    ...uniforms,
    color: [...uniforms.color],
    matrix: new Float32Array(uniforms.matrix)
  });
  expect(block.needsRedraw).toBe(false);
  expect(block.modifiedUniforms).toEqual({});

  uniforms.matrix[2] = 2;
  block.setUniforms(uniforms);
  expect(block.needsRedraw).toBeTruthy();
  expect(block.modifiedUniforms).toEqual({matrix: true});
});

test('unchanged values preserve explicit invalidation', () => {
  const block = new UniformBlock();
  block.setUniforms({scale: 0});
  block.getAllUniforms();
  block.setNeedsRedraw('explicit update');
  block.setUniforms({scale: 0});
  expect(block.needsRedraw).toBe('explicit update');
});

test('repeated values do not upload managed GPU uniform buffers', () => {
  const write = vi.fn();
  const device = {
    type: 'webgl',
    createBuffer: () => ({write, destroy: vi.fn()})
  } as unknown as Device;
  const store = new UniformStore(device, {
    scene: {
      uniformTypes: {scale: 'f32', color: 'vec4<f32>'},
      defaultUniforms: {scale: 1, color: [1, 0, 0, 1]}
    }
  });
  store.getManagedUniformBuffer('scene');
  store.setUniforms({scene: {scale: 1, color: [1, 0, 0, 1]}});
  write.mockClear();
  for (let draw = 0; draw < 100; draw++) {
    store.setUniforms({scene: {scale: 1, color: [1, 0, 0, 1]}});
  }
  expect(write).not.toHaveBeenCalled();
  store.setUniforms({scene: {scale: 2}});
  expect(write).toHaveBeenCalledOnce();
  store.destroy();
});
