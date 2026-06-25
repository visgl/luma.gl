// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {
  PolygonAttributeModel,
  createPolygonShaderInputs,
  GPUVector,
  POLYGON_GPU_INPUT_SCHEMA,
  PolygonStorageModel,
  type PolygonGPUVectors,
  type VertexList
} from '@luma.gl/tables';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

test('filled polygon models declare generated row-preserving GPU inputs', t => {
  t.deepEqual(POLYGON_GPU_INPUT_SCHEMA, [
    {
      columnName: 'positions',
      attributeName: 'positions',
      bindingName: 'polygonPositions',
      kind: 'positions',
      required: true,
      formats: ['vertex-list<float32x4>'],
      internal: true
    },
    {
      columnName: 'colors',
      attributeName: 'colors',
      bindingName: 'polygonColors',
      kind: 'colors',
      required: true,
      formats: ['vertex-list<unorm8x4>'],
      internal: true
    },
    {
      columnName: 'rowIndices',
      attributeName: 'rowIndices',
      bindingName: 'polygonRowIndices',
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
  t.equal(PolygonAttributeModel.gpuInputSchema, POLYGON_GPU_INPUT_SCHEMA);
  t.equal(PolygonStorageModel.gpuInputSchema, POLYGON_GPU_INPUT_SCHEMA);
  t.end();
});

test('PolygonAttributeModel consumes flattened vertex-list values through explicit table layout', t => {
  const device = new NullDevice({});
  const vectors = makePolygonGPUVectors(device);
  const model = new PolygonAttributeModel(device, {
    id: 'polygon-attribute-model-test',
    ...vectors,
    shaderInputs: createPolygonShaderInputs(device)
  });

  t.equal(model.table?.numRows, 1, 'keeps one logical source polygon row');
  t.equal(model.table?.batches[0]?.gpuData.positions.format, 'vertex-list<float32x4>');
  t.equal(model.vertexCount, 3, 'uses flattened reserved index valueLength for indexed draw count');
  t.deepEqual(
    model.table?.bufferLayout.map(layout => layout.name),
    ['positions', 'colors', 'rowIndices'],
    'keeps reserved indices out of shader attributes'
  );

  model.destroy();
  destroyPolygonGPUVectors(vectors);
  t.end();
});

test('PolygonAttributeModel validates prepared GPUVector formats', t => {
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

  t.throws(
    () =>
      new PolygonAttributeModel(device, {
        id: 'polygon-attribute-model-invalid-format',
        ...vectors,
        positions: invalidPositions as unknown as PolygonGPUVectors['positions'],
        shaderInputs: createPolygonShaderInputs(device)
      }),
    /positions GPUVector\.format "vertex-list<float32x3>" must be one of vertex-list<float32x4>/
  );

  invalidPositions.destroy();
  destroyPolygonGPUVectors(vectors);
  t.end();
});

test('PolygonAttributeModel appends retained indexed polygon batches', t => {
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

  t.equal(model.table?.batches.length, 2, 'retains appended polygon GPU batches');
  t.equal(model.table?.numRows, 2, 'aggregates logical source polygon rows');
  t.deepEqual(
    model.table?.batches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 1},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
    ],
    'retains source row identity on model-owned GPU table batches'
  );
  t.doesNotThrow(() => model.needsRedraw(), 'does not bind aggregate local index buffers');

  model.destroy();
  destroyPolygonGPUVectors(firstVectors);
  destroyPolygonGPUVectors(secondVectors);
  t.end();
});

test('PolygonStorageModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const vectors = makePolygonGPUVectors(device, 0, Buffer.VERTEX | Buffer.STORAGE);

  t.throws(
    () =>
      new PolygonStorageModel(device, {
        id: 'polygon-storage-model-test',
        ...vectors,
        shaderInputs: createPolygonShaderInputs(device)
      }),
    /WebGPU-only/,
    'storage polygon model reports its backend contract'
  );

  destroyPolygonGPUVectors(vectors);
  t.end();
});

test('PolygonStorageModel binds flattened polygon vectors as storage', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('Skipping PolygonStorageModel storage test without WebGPU');
    t.end();
    return;
  }
  const vectors = makePolygonGPUVectors(device, 0, Buffer.VERTEX | Buffer.STORAGE);
  const model = new PolygonStorageModel(device, {
    id: 'polygon-storage-model-test',
    ...vectors,
    shaderInputs: createPolygonShaderInputs(device)
  });

  t.equal(model.table?.numRows, 1, 'keeps one logical source polygon row');
  t.deepEqual(model.table?.bufferLayout, [], 'does not synthesize vertex attributes');
  t.equal(model.vertexCount, 3, 'uses flattened reserved index valueLength for indexed draws');
  t.equal(model.indexCount, 3, 'plumbs flattened reserved index valueLength to Model.draw');
  t.notOk('bindings' in model.table!, 'does not cache model bindings on the table');
  t.ok(model.bindings.polygonPositions, 'binds prepared positions as storage');
  t.ok(model.bindings.polygonColors, 'binds prepared colors as storage');
  t.ok(model.bindings.polygonRowIndices, 'binds prepared row indices as storage');

  model.destroy();
  destroyPolygonGPUVectors(vectors);
  t.end();
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
  vectors.colors.destroy();
  vectors.rowIndices.destroy();
  vectors.indices.destroy();
}
