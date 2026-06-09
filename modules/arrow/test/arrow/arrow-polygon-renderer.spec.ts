// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowPolygonRenderer, prepareArrowPolygonInput, resolveArrowPickInfo} from '@luma.gl/arrow';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type PolygonArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('prepareArrowPolygonInput preserves rows, batch layout, row offsets, and ownership', async t => {
  const device = new NullDevice({});
  const polygons = makePolygonVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 0, 1]));
  const prepared = await prepareArrowPolygonInput(
    device,
    {polygons, colors: null, tessellated: true},
    {rowIndexOffset: 9, sourceBatchIndex: 4, id: 'polygon-conversion-test'}
  );
  const positionsBuffer = prepared.positions.data[0].buffer;
  const colorsBuffer = prepared.colors.data[0].buffer;
  const rowIndicesBuffer = prepared.rowIndices.data[0].buffer;
  const indexVector = prepared.indices;
  const indexBuffer = indexVector.data[0].buffer;

  t.equal(prepared.tessellation.rowCount, 1, 'keeps one polygon row');
  t.equal(prepared.tessellation.vertexCount, 3, 'keeps tessellated triangle vertices');
  t.equal(prepared.positions.format, 'vertex-list<float32x4>', 'stores row-preserving positions');
  t.equal(prepared.positions.length, 1, 'keeps source polygon rows on prepared positions');
  t.equal(prepared.positions.valueLength, 3, 'stores flattened tessellated position values');
  t.ok(positionsBuffer.usage & Buffer.STORAGE, 'creates polygon positions for storage draws');
  t.ok(colorsBuffer.usage & Buffer.STORAGE, 'creates polygon colors for storage draws');
  t.ok(rowIndicesBuffer.usage & Buffer.STORAGE, 'creates polygon row indices for storage draws');
  t.equal(indexVector.format, 'vertex-list<uint32>', 'stores polygon indices as a list vector');
  t.equal(indexVector.valueLength, 3, 'stores the flattened triangle index count');
  t.ok(indexBuffer.usage & Buffer.INDEX, 'creates the polygon index column with INDEX usage');
  t.deepEqual(
    prepared.sourceInfo,
    {sourceBatchIndex: 4, sourceRowIndexOffset: 9, sourceRowCount: 1},
    'records polygon source row metadata'
  );
  t.deepEqual(
    Array.from(prepared.tessellation.rowIndices),
    [9, 9, 9],
    'applies the row index offset to tessellated vertices'
  );

  prepared.destroy();
  t.ok(positionsBuffer.destroyed, 'destroy releases owned polygon attribute buffers');
  t.ok(indexBuffer.destroyed, 'destroy releases the polygon index buffer');
  t.end();
});

test('ArrowPolygonRenderer streaming uses one model over retained indexed batches', async t => {
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

  t.equal(renderer.preparedBatches.length, 2, 'retains both streamed polygon batches');
  t.equal(renderer.model?.table?.batches.length, 2, 'uses one render model over both batches');
  t.equal(
    renderer.pickingModel?.table?.batches.length,
    2,
    'uses one picking model over both batches'
  );
  t.equal(renderer.getMetrics().rowCount, 2, 'tracks aggregate polygon rows');
  t.deepEqual(
    renderer.preparedBatches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 1},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 1, sourceRowCount: 1}
    ],
    'retains polygon streaming source metadata on prepared batches'
  );
  t.deepEqual(
    resolveArrowPickInfo(
      {batchIndex: 1, objectIndex: 1},
      renderer.preparedBatches.map(batch => batch.sourceInfo)
    ),
    {batchIndex: 1, rowIndex: 1, batchRowIndex: 0},
    'resolves polygon pick info to a source batch row'
  );
  t.ok(renderer.model, 'keeps one render model');
  t.ok(renderer.pickingModel, 'keeps one picking model');
  t.equal(renderModels[0], renderModels[1], 'reuses the render model across appended batches');
  t.equal(pickingModels[0], pickingModels[1], 'reuses the picking model across appended batches');
  if (!firstPositionsBuffer || !secondPositionsBuffer || !firstIndexBuffer || !secondIndexBuffer) {
    renderer.destroy();
    t.fail('expected retained polygon GPU buffers');
    t.end();
    return;
  }
  t.notOk(firstPositionsBuffer.destroyed, 'first retained polygon batch remains alive');
  t.notOk(secondPositionsBuffer.destroyed, 'second retained polygon batch remains alive');
  t.notOk(firstIndexBuffer.destroyed, 'first retained polygon index buffer remains alive');
  t.notOk(secondIndexBuffer.destroyed, 'second retained polygon index buffer remains alive');

  renderer.destroy();
  t.ok(firstPositionsBuffer.destroyed, 'destroy releases the first polygon attribute buffer');
  t.ok(secondPositionsBuffer.destroyed, 'destroy releases the second polygon attribute buffer');
  t.ok(firstIndexBuffer.destroyed, 'destroy releases the first polygon index buffer');
  t.ok(secondIndexBuffer.destroyed, 'destroy releases the second polygon index buffer');
  t.end();
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
