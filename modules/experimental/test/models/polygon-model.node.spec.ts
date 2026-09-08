// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getIndexPickingModule} from '@luma.gl/engine';
import {GPUVector, type VertexList} from '@luma.gl/gpgpu/gpu-data';
import {
  PolygonAttributeModel,
  createPolygonShaderInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  PolygonStorageModel,
  type PolygonGPUVectors
} from '@luma.gl/experimental/models';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {ShaderModule} from '@luma.gl/shadertools';

it('filled polygon models declare generated row-preserving GPU inputs', () => {
  expect(POLYGON_GPU_INPUT_SCHEMA, '').toEqual([
    {
      columnName: 'positions',
      attributeName: 'positions',
      storageBindingName: 'polygonPositions',
      kind: 'positions',
      required: true,
      formats: ['vertex-list<float32x4>'],
      internal: true
    },
    {
      columnName: 'colors',
      attributeName: 'colors',
      storageBindingName: 'polygonColors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4', 'vertex-list<unorm8x4>'],
      internal: true
    },
    {
      columnName: 'rowIndices',
      attributeName: 'rowIndices',
      storageBindingName: 'polygonRowIndices',
      kind: 'scalars',
      required: true,
      formats: ['vertex-list<uint32>'],
      internal: true
    },
    {
      columnName: 'indices',
      kind: 'scalars',
      required: true,
      formats: ['vertex-list<uint32>'],
      internal: true
    }
  ]);
  expect(PolygonAttributeModel.gpuInputSchema, '').toBe(POLYGON_GPU_INPUT_SCHEMA);
  expect(PolygonStorageModel.gpuInputSchema, '').toBe(POLYGON_GPU_INPUT_SCHEMA);
  void 0;
});

it('PolygonAttributeModel consumes flattened vertex-list values through explicit table layout', () => {
  const device = new NullDevice({});
  const vectors = makePolygonGPUVectors(device);
  const model = new PolygonAttributeModel(device, {
    id: 'polygon-attribute-model-test',
    ...vectors,
    shaderInputs: createPolygonShaderInputs(device)
  });

  expect(model.table?.numRows, 'keeps one logical source polygon row').toBe(1);
  expect(model.table?.batches[0]?.gpuData.positions.format, '').toBe('vertex-list<float32x4>');
  expect(
    model.vertexCount,
    'uses flattened reserved index valueLength for indexed draw count'
  ).toBe(3);
  expect(
    model.table?.bufferLayout.map(layout => layout.name),
    'keeps reserved indices out of shader attributes'
  ).toEqual(['positions', 'colors', 'rowIndices']);

  model.destroy();
  destroyPolygonGPUVectors(vectors);
  void 0;
});

it('PolygonAttributeModel validates prepared GPUVector formats', () => {
  const device = new NullDevice({});
  const vectors = makePolygonGPUVectors(device);
  const invalidPositions = makePolygonGPUVector(
    device,
    'positions',
    'vertex-list<float32x3>',
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    1,
    3
  );

  expect(
    () =>
      new PolygonAttributeModel(device, {
        id: 'polygon-attribute-model-invalid-format',
        ...vectors,
        positions: invalidPositions as unknown as PolygonGPUVectors['positions'],
        shaderInputs: createPolygonShaderInputs(device)
      }),
    ''
  ).toThrow(
    /positions GPUVector\.format "vertex-list<float32x3>" must be one of vertex-list<float32x4>/
  );

  invalidPositions.destroy();
  destroyPolygonGPUVectors(vectors);
  void 0;
});

it('PolygonAttributeModel appends retained indexed polygon batches', () => {
  const device = new NullDevice({});
  const firstVectors = makePolygonGPUVectors(device);
  const secondVectors = makePolygonGPUVectors(device, 1);
  const model = new PolygonAttributeModel(device, {
    id: 'polygon-attribute-model-streaming',
    ...firstVectors,
    sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 1},
    shaderInputs: createPolygonShaderInputs(device)
  });

  model.addBatch({
    ...secondVectors,
    sourceInfo: {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
  });

  expect(model.table?.batches.length, 'retains appended polygon GPU batches').toBe(2);
  expect(model.table?.numRows, 'aggregates logical source polygon rows').toBe(2);
  expect(
    model.table?.batches.map(batch => batch.sourceInfo),
    'retains source row identity on model-owned GPU table batches'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 1},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
  ]);
  expect(() => model.needsRedraw(), 'does not bind aggregate local index buffers').not.toThrow();

  model.destroy();
  destroyPolygonGPUVectors(firstVectors);
  destroyPolygonGPUVectors(secondVectors);
  void 0;
});

it('PolygonStorageModel rejects non-WebGPU devices', () => {
  const device = new NullDevice({});
  const vectors = makePolygonGPUVectors(device, 0, Buffer.VERTEX | Buffer.STORAGE);

  expect(
    () =>
      new PolygonStorageModel(device, {
        id: 'polygon-storage-model-test',
        ...vectors,
        shaderInputs: createPolygonShaderInputs(device)
      }),
    'storage polygon model reports its backend contract'
  ).toThrow(/WebGPU-only/);

  destroyPolygonGPUVectors(vectors);
  void 0;
});

it('PolygonStorageModel binds flattened polygon vectors as storage', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const vectors = makePolygonGPUVectors(device, 0, Buffer.VERTEX | Buffer.STORAGE);
  const secondVectors = makePolygonGPUVectors(device, 1, Buffer.VERTEX | Buffer.STORAGE);
  const customModule = {name: 'polygonStorageCustomModule'} satisfies ShaderModule;
  const model = new PolygonStorageModel(device, {
    id: 'polygon-storage-model-test',
    ...vectors,
    shaderInputs: createPolygonShaderInputs(device),
    modules: [customModule]
  });

  expect(model.table?.numRows, 'keeps one logical source polygon row').toBe(1);
  expect(model.table?.bufferLayout, 'does not synthesize vertex attributes').toEqual([]);
  expect(model.vertexCount, 'uses flattened reserved index valueLength for indexed draws').toBe(3);
  expect(model.indexCount, 'plumbs flattened reserved index valueLength to Model.draw').toBe(3);
  expect(Boolean('bindings' in model.table!), 'does not cache model bindings on the table').toBe(
    false
  );
  expect(Boolean(model.bindings.polygonPositions), 'binds prepared positions as storage').toBe(
    true
  );
  expect(Boolean(model.bindings.polygonColors), 'binds prepared colors as storage').toBe(true);
  expect(Boolean(model.bindings.polygonRowIndices), 'binds prepared row indices as storage').toBe(
    true
  );
  expect(
    Boolean(
      model.props.modules?.some(module => module.name === getIndexPickingModule(device).name)
    ),
    'keeps the required picking shader module'
  ).toBe(true);
  expect(
    Boolean(model.props.modules?.some(module => module.name === customModule.name)),
    'keeps the caller shader module'
  ).toBe(true);

  model.addBatch({
    ...secondVectors,
    sourceInfo: {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
  });
  expect(model.table?.batches.length, 'prepares bindings for appended storage batches').toBe(2);

  model.destroy();
  destroyPolygonGPUVectors(vectors);
  destroyPolygonGPUVectors(secondVectors);
  void 0;
});

function makePolygonGPUVectors(
  device: Device,
  rowIndex = 0,
  attributeUsage = Buffer.VERTEX
): PolygonGPUVectors {
  return {
    positions: makePolygonGPUVector(
      device,
      'positions',
      'vertex-list<float32x4>',
      new Float32Array([0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1]),
      1,
      3,
      attributeUsage
    ),
    colors: makePolygonGPUVector(
      device,
      'colors',
      'vertex-list<unorm8x4>',
      new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]),
      1,
      3,
      attributeUsage
    ),
    rowIndices: makePolygonGPUVector(
      device,
      'rowIndices',
      'vertex-list<uint32>',
      new Uint32Array([rowIndex, rowIndex, rowIndex]),
      1,
      3,
      attributeUsage
    ),
    indices: makePolygonGPUVector(
      device,
      'indices',
      'vertex-list<uint32>',
      new Uint32Array([0, 1, 2]),
      1,
      3,
      Buffer.INDEX
    )
  };
}

function makePolygonGPUVector<FormatT extends VertexList>(
  device: Device,
  name: string,
  format: FormatT,
  data: Float32Array | Uint8Array | Uint32Array,
  length: number,
  valueLength: number,
  usage?: number
): GPUVector<FormatT> {
  return new GPUVector({
    type: 'buffer',
    name,
    buffer: device.createBuffer({data, ...(usage === undefined ? {} : {usage})}),
    format,
    length,
    valueLength,
    ownsBuffer: true
  });
}

function destroyPolygonGPUVectors(vectors: PolygonGPUVectors): void {
  vectors.positions.destroy();
  if ('destroy' in vectors.colors) vectors.colors.destroy();
  vectors.rowIndices.destroy();
  vectors.indices.destroy();
}
