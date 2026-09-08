// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {ArrowPolygonRenderer, prepareArrowPolygonInput, resolveArrowPickInfo} from '@luma.gl/arrow';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type PolygonArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

it('prepareArrowPolygonInput preserves rows, batch layout, row offsets, and ownership', async () => {
  const device = new NullDevice({});
  const polygons = makePolygonVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 0, 1]));
  const prepared = await prepareArrowPolygonInput(
    device,
    {polygons, colors: null, tessellated: true},
    {rowIndexOffset: 9, sourceBatchIndex: 4, id: 'polygon-conversion-test'}
  );
  const positionsBuffer = prepared.positions.data[0].buffer;
  const rowIndicesBuffer = prepared.rowIndices.data[0].buffer;
  const indexVector = prepared.indices;
  const indexBuffer = indexVector.data[0].buffer;

  expect(prepared.tessellation.rowCount, 'keeps one polygon row').toBe(1);
  expect(prepared.tessellation.vertexCount, 'keeps tessellated triangle vertices').toBe(3);
  expect(prepared.positions.format, 'stores row-preserving positions').toBe(
    'vertex-list<float32x4>'
  );
  expect(prepared.positions.length, 'keeps source polygon rows on prepared positions').toBe(1);
  expect(prepared.positions.valueLength, 'stores flattened tessellated position values').toBe(3);
  expect(
    Boolean(positionsBuffer.usage & Buffer.STORAGE),
    'creates polygon positions for storage draws'
  ).toBe(true);
  expect(prepared.colors.format, 'keeps constant polygon color as a GPUConstant').toBe('unorm8x4');
  expect(Boolean('isConstant' in prepared.colors), 'uses a logical constant polygon color').toBe(
    true
  );
  if ('isConstant' in prepared.colors) {
    expect(prepared.colors.byteLength, 'stores one constant polygon color value').toBe(4);
  }
  expect(
    Boolean(rowIndicesBuffer.usage & Buffer.STORAGE),
    'creates polygon row indices for storage draws'
  ).toBe(true);
  expect(indexVector.format, 'stores polygon indices as a list vector').toBe('vertex-list<uint32>');
  expect(indexVector.valueLength, 'stores the flattened triangle index count').toBe(3);
  expect(
    Boolean(indexBuffer.usage & Buffer.INDEX),
    'creates the polygon index column with INDEX usage'
  ).toBe(true);
  expect(prepared.sourceInfo, 'records polygon source row metadata').toEqual({
    sourceBatchIndex: 4,
    sourceRowIndexOffset: 9,
    sourceRowCount: 1
  });
  expect(
    Array.from(prepared.tessellation.rowIndices),
    'applies the row index offset to tessellated vertices'
  ).toEqual([9, 9, 9]);

  prepared.destroy();
  expect(
    Boolean(positionsBuffer.destroyed),
    'destroy releases owned polygon attribute buffers'
  ).toBe(true);
  expect(Boolean(indexBuffer.destroyed), 'destroy releases the polygon index buffer').toBe(true);
  void 0;
});

it('ArrowPolygonRenderer streaming uses one model over retained indexed batches', async () => {
  const device = new NullDevice({});
  const renderer = new ArrowPolygonRenderer(device, {
    polygons: 'polygons',
    colors: null,
    tessellated: true
  });
  const renderModels: unknown[] = [];
  const pickingModels: unknown[] = [];

  await waitForPolygonBatches(
    renderer,
    [
      makePolygonRecordBatch(
        makePolygonVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 0, 1]))
      ),
      makePolygonRecordBatch(
        makePolygonVector(new Int32Array([0, 3]), new Float32Array([2, 0, 3, 0, 2, 1]))
      )
    ],
    () => {
      renderModels.push(renderer.model);
      pickingModels.push(renderer.pickingModel);
    }
  );

  const firstPositionsBuffer = renderer.preparedBatches[0]?.positions.data[0].buffer;
  const secondPositionsBuffer = renderer.preparedBatches[1]?.positions.data[0].buffer;
  const firstIndexBuffer = renderer.preparedBatches[0]?.indices.data[0].buffer;
  const secondIndexBuffer = renderer.preparedBatches[1]?.indices.data[0].buffer;

  expect(renderer.preparedBatches.length, 'retains both streamed polygon batches').toBe(2);
  expect(renderer.model?.table?.batches.length, 'uses one render model over both batches').toBe(2);
  expect(
    renderer.pickingModel?.table?.batches.length,
    'uses one picking model over both batches'
  ).toBe(2);
  expect(renderer.getMetrics().rowCount, 'tracks aggregate polygon rows').toBe(2);
  expect(
    renderer.preparedBatches.map(batch => batch.sourceInfo),
    'retains polygon streaming source metadata on prepared batches'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 1},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
  ]);
  expect(
    resolveArrowPickInfo(
      {batchIndex: 1, objectIndex: 1},
      renderer.preparedBatches.map(batch => batch.sourceInfo)
    ),
    'resolves polygon pick info to a source batch row'
  ).toEqual({batchIndex: 1, rowIndex: 1, batchRowIndex: 0});
  expect(Boolean(renderer.model), 'keeps one render model').toBe(true);
  expect(Boolean(renderer.pickingModel), 'keeps one picking model').toBe(true);
  expect(renderModels[0], 'reuses the render model across appended batches').toBe(renderModels[1]);
  expect(pickingModels[0], 'reuses the picking model across appended batches').toBe(
    pickingModels[1]
  );
  if (!firstPositionsBuffer || !secondPositionsBuffer || !firstIndexBuffer || !secondIndexBuffer) {
    renderer.destroy();
    expect(false, 'expected retained polygon GPU buffers').toBe(true);
    void 0;
    return;
  }
  expect(
    Boolean(firstPositionsBuffer.destroyed),
    'first retained polygon batch remains alive'
  ).toBe(false);
  expect(
    Boolean(secondPositionsBuffer.destroyed),
    'second retained polygon batch remains alive'
  ).toBe(false);
  expect(
    Boolean(firstIndexBuffer.destroyed),
    'first retained polygon index buffer remains alive'
  ).toBe(false);
  expect(
    Boolean(secondIndexBuffer.destroyed),
    'second retained polygon index buffer remains alive'
  ).toBe(false);

  renderer.destroy();
  expect(
    Boolean(firstPositionsBuffer.destroyed),
    'destroy releases the first polygon attribute buffer'
  ).toBe(true);
  expect(
    Boolean(secondPositionsBuffer.destroyed),
    'destroy releases the second polygon attribute buffer'
  ).toBe(true);
  expect(
    Boolean(firstIndexBuffer.destroyed),
    'destroy releases the first polygon index buffer'
  ).toBe(true);
  expect(
    Boolean(secondIndexBuffer.destroyed),
    'destroy releases the second polygon index buffer'
  ).toBe(true);
  void 0;
});

function makePolygonVector(
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Vector<PolygonArrowType> {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('values', new arrow.Float32(), false)
  );
  const polygonType = new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as PolygonArrowType;
  const coordinateValueData = new arrow.Data<arrow.Float32>(
    new arrow.Float32(),
    0,
    values.length,
    0,
    {
      [arrow.BufferType.DATA]: values
    }
  );
  const coordinateData = new arrow.Data<arrow.FixedSizeList<arrow.Float32>>(
    coordinateType,
    0,
    values.length / 2,
    0,
    {},
    [coordinateValueData]
  );
  const polygonData = new arrow.Data<PolygonArrowType>(
    polygonType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
  return new arrow.Vector<PolygonArrowType>([polygonData]);
}

function makePolygonRecordBatch(polygons: arrow.Vector<PolygonArrowType>): arrow.RecordBatch {
  const recordBatch = new arrow.Table({polygons}).batches[0];
  if (!recordBatch) {
    throw new Error('Expected Arrow table to contain a record batch');
  }
  return recordBatch;
}

function makeRecordBatchIterator(
  recordBatches: arrow.RecordBatch[]
): AsyncIterator<arrow.RecordBatch> {
  let recordBatchIndex = 0;
  return {
    async next(): Promise<IteratorResult<arrow.RecordBatch>> {
      const recordBatch = recordBatches[recordBatchIndex];
      recordBatchIndex++;
      return recordBatch ? {done: false, value: recordBatch} : {done: true, value: undefined};
    }
  };
}

function waitForPolygonBatches(
  renderer: ArrowPolygonRenderer,
  recordBatches: arrow.RecordBatch[],
  onBatch?: () => void
): Promise<void> {
  return new Promise(resolve => {
    renderer.setProps({
      data: makeRecordBatchIterator(recordBatches),
      onDataBatch: ({loadedBatchCount}) => {
        onBatch?.();
        if (loadedBatchCount === recordBatches.length) {
          resolve();
        }
      }
    });
  });
}
