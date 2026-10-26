// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import * as engine from '@luma.gl/engine';
import * as execution from '@luma.gl/gpgpu';
import {GPUVectorModel as DataGPUVectorModel} from '@luma.gl/gpgpu/gpu-data';

it('engine compatibility exports share execution constructors with gpgpu', () => {
  for (const name of [
    'Computation',
    'GPUVectorModel',
    'GPUVectorGeometry',
    'DynamicBuffer',
    'DynamicTexture',
    'ShaderInputs'
  ] as const) {
    expect(engine[name]).toBe(execution[name]);
  }
  for (const name of ['Kernel', 'RenderKernel'] as const) {
    expect(execution[name]).toBeTypeOf('function');
    expect(name in engine).toBe(false);
  }
  expect(DataGPUVectorModel).toBe(execution.GPUVectorModel);
  expect(engine.Model.prototype).toBeInstanceOf(execution.GPUVectorModel);
});

it('TableTransform belongs to engine/tables without a graph re-export', async () => {
  const tables = await import('@luma.gl/engine/tables');
  const graphTables = await import('@luma.gl/graph/gpu-tables');
  expect(tables.TableTransform.prototype).toBeInstanceOf(engine.BufferTransform);
  expect('TableTransform' in graphTables).toBe(false);
});

it('model-based transform adapters belong to engine', () => {
  for (const name of ['BufferTransform', 'TextureTransform'] as const) {
    expect(engine[name]).toBeTypeOf('function');
    expect(name in execution).toBe(false);
  }
});
