// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowPolygonRenderer,
  makeArrowFixedSizeListVector,
  prepareArrowPolygonInput,
  resolveArrowPickInfo
} from '@luma.gl/arrow';
import {Buffer} from '@luma.gl/core';
import type {GPUData} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {
  ArrowLineRenderer,
  prepareArrowLineInputFromRecordBatches,
  type ArrowLineRendererDataBatchUpdate
} from '../../../../examples/arrow/arrow-lines/arrow-line-renderer';
import {
  ArrowPointRenderer,
  prepareArrowPointInput
} from '../../../../examples/arrow/arrow-points/arrow-point-renderer';
import {
  addArrowTextGPUTableBatch,
  createArrowTextGPUTable
} from '../../../../examples/arrow/arrow-text-2d/arrow-text-renderer';

type PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('prepareArrowPointInput preserves rows, batch layout, row offsets, and ownership', async t => {
  const device = new NullDevice({});
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 1])
  );
  const prepared = await prepareArrowPointInput(
    device,
    {positions, colors: null, radii: null},
    {rowIndexOffset: 5, sourceBatchIndex: 3, id: 'point-preparation-test'}
  );
  const rowIndices = await readGPUDataAsUint32Array(prepared.table.gpuVectors.rowIndices.data[0]);
  const positionsBuffer = prepared.table.gpuVectors.positions.data[0].buffer;

  t.equal(prepared.rowCount, 2, 'keeps one point row per source row');
  t.equal(prepared.table.batches.length, 1, 'prepares one GPU table batch');
  t.deepEqual(
    prepared.table.batches[0].sourceInfo,
    {sourceBatchIndex: 3, sourceRowIndexOffset: 5, sourceRowCount: 2},
    'records point source row metadata'
  );
  t.deepEqual(Array.from(rowIndices), [5, 6], 'applies the row index offset');

  prepared.destroy();
  t.ok(positionsBuffer.destroyed, 'destroy releases owned point buffers');
  t.end();
});

test('ArrowPointRenderer streaming uses one model over retained GPU batches', async t => {
  const device = new NullDevice({});
  const renderer = new ArrowPointRenderer(device, {
    positions: 'positions',
    colors: null,
    radii: null
  });

  await waitForPointBatches(renderer, [
    makePointRecordBatch(
      makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
    ),
    makePointRecordBatch(
      makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([2, 2]))
    )
  ]);

  const firstPositionsBuffer =
    renderer.preparedBatches[0]?.table.gpuVectors.positions.data[0].buffer;
  const secondPositionsBuffer =
    renderer.preparedBatches[1]?.table.gpuVectors.positions.data[0].buffer;
  const firstRowIndices = renderer.preparedBatches[0]?.table.gpuVectors.rowIndices.data[0];
  const secondRowIndices = renderer.preparedBatches[1]?.table.gpuVectors.rowIndices.data[0];

  t.equal(renderer.preparedBatches.length, 2, 'retains both streamed point batches');
  t.equal(renderer.model?.table?.batches.length, 2, 'uses one render model over both batches');
  t.equal(
    renderer.pickingModel?.table?.batches.length,
    2,
    'uses one picking model over both batches'
  );
  t.equal(renderer.getMetrics().rowCount, 3, 'tracks aggregate point rows');
  if (!firstPositionsBuffer || !secondPositionsBuffer || !firstRowIndices || !secondRowIndices) {
    renderer.destroy();
    t.fail('expected retained point GPU buffers');
    t.end();
    return;
  }
  t.deepEqual(
    Array.from(await readGPUDataAsUint32Array(firstRowIndices)),
    [0, 1],
    'first batch row indices start at zero'
  );
  t.deepEqual(
    Array.from(await readGPUDataAsUint32Array(secondRowIndices)),
    [2],
    'second batch row indices preserve the global row offset'
  );
  t.deepEqual(
    renderer.model?.table?.batches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
    ],
    'retains point streaming source metadata on render batches'
  );
  t.deepEqual(
    resolveArrowPickInfo({batchIndex: 1, objectIndex: 2}, renderer.model?.table),
    {batchIndex: 1, rowIndex: 2, batchRowIndex: 0},
    'resolves point pick info to a source batch row'
  );
  t.notOk(firstPositionsBuffer.destroyed, 'first retained point batch remains alive');
  t.notOk(secondPositionsBuffer.destroyed, 'second retained point batch remains alive');

  renderer.destroy();
  t.ok(firstPositionsBuffer.destroyed, 'destroy releases the first retained point batch');
  t.ok(secondPositionsBuffer.destroyed, 'destroy releases the second retained point batch');
  t.end();
});

test('prepareArrowPolygonInput preserves rows, batch layout, row offsets, and ownership', async t => {
  const device = new NullDevice({});
  const polygons = makePathVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 0, 1]));
  const prepared = await prepareArrowPolygonInput(
    device,
    {polygons, colors: null, tessellated: true},
    {rowIndexOffset: 9, sourceBatchIndex: 4, id: 'polygon-preparation-test'}
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
        makePathVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 0, 1]))
      ),
      makePolygonRecordBatch(
        makePathVector(new Int32Array([0, 3]), new Float32Array([2, 0, 3, 0, 2, 1]))
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

test('ArrowTextRenderer streaming GPU table retains pick source metadata', t => {
  const device = new NullDevice({});
  const firstRecordBatch = makeTextRecordBatch(new Float32Array([0, 0, 1, 1]), ['alpha', 'beta']);
  const secondRecordBatch = makeTextRecordBatch(new Float32Array([2, 2]), ['gamma']);
  const gpuTable = createArrowTextGPUTable(device, firstRecordBatch);

  addArrowTextGPUTableBatch(device, gpuTable, secondRecordBatch);

  t.deepEqual(
    gpuTable.batches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
    ],
    'retains text streaming source metadata on GPU batches'
  );
  t.deepEqual(
    resolveArrowPickInfo({batchIndex: 1, objectIndex: 2}, gpuTable),
    {batchIndex: 1, rowIndex: 2, batchRowIndex: 0},
    'resolves text pick info to a source batch row'
  );

  gpuTable.destroy();
  t.end();
});

test('prepareArrowLineInputFromRecordBatches preserves chunks, row offsets, and ownership', async t => {
  const device = new NullDevice({});
  const recordBatches = [
    makeLineRecordBatch(
      makePathVector(new Int32Array([0, 2]), new Float32Array([0, 0, 1, 0])),
      arrow.vectorFromArray([1], new arrow.Float32()) as arrow.Vector<arrow.Float32>
    ),
    makeLineRecordBatch(
      makePathVector(new Int32Array([0, 2, 4]), new Float32Array([2, 0, 3, 0, 4, 0, 5, 0])),
      arrow.vectorFromArray([2, 3], new arrow.Float32()) as arrow.Vector<arrow.Float32>
    )
  ];
  const prepared = await prepareArrowLineInputFromRecordBatches(device, recordBatches, {
    model: 'attribute',
    mode: 'lines',
    rowIndexOffset: 20,
    id: 'line-preparation-test'
  });
  t.equal(prepared.model, 'attribute', 'prepares data for the selected renderer model');
  if (prepared.model !== 'attribute') {
    prepared.destroy();
    t.fail('expected attribute-prepared line data');
    t.end();
    return;
  }
  const rowIndices = prepared.pathState.segmentTable.table.getChild('rowIndices');
  const pathBuffer = prepared.paths.data[0].buffer;
  const generatedPathBuffer = prepared.pathState.expandedPathVertexData;

  t.equal(prepared.paths.length, 3, 'keeps one path row per source row');
  t.equal(prepared.paths.data.length, 2, 'preserves source record-batch path chunks');
  t.equal(prepared.widths.data.length, 2, 'preserves source record-batch width chunks');
  t.equal(prepared.rowIndexOffset, 20, 'reports the applied row offset');
  t.deepEqual(
    Array.from(rowIndices?.data[0]?.values as Uint32Array),
    [20, 21, 22],
    'applies the row index offset to generated path segments'
  );

  prepared.destroy();
  t.ok(pathBuffer.destroyed, 'destroy releases owned line path buffers');
  t.ok(generatedPathBuffer.destroyed, 'destroy releases generated line buffers');
  t.end();
});

test('ArrowLineRenderer streaming keeps one active model and retains same-model batches', async t => {
  const device = new NullDevice({});
  const initialInput = await prepareArrowLineInputFromRecordBatches(
    device,
    [
      makeLineRecordBatch(
        makePathVector(new Int32Array([0, 2]), new Float32Array([0, 0, 1, 0])),
        arrow.vectorFromArray([1], new arrow.Float32()) as arrow.Vector<arrow.Float32>
      )
    ],
    {model: 'attribute', mode: 'lines', id: 'line-stream-initial-test'}
  );
  const renderer = new ArrowLineRenderer(device, {
    id: 'line-stream-test',
    model: 'attribute',
    mode: 'lines'
  });
  const updates: ArrowLineRendererDataBatchUpdate[] = [];

  await waitForLineBatches(
    renderer,
    [
      makeLineRecordBatch(
        makePathVector(new Int32Array([0, 2]), new Float32Array([0, 0, 1, 0])),
        arrow.vectorFromArray([2], new arrow.Float32()) as arrow.Vector<arrow.Float32>
      ),
      makeLineRecordBatch(
        makePathVector(new Int32Array([0, 2, 4]), new Float32Array([2, 0, 3, 0, 4, 0, 5, 0])),
        arrow.vectorFromArray([3, 4], new arrow.Float32()) as arrow.Vector<arrow.Float32>
      )
    ],
    update => updates.push(update)
  );

  const firstInput = updates[0]?.pathInput;
  const secondInput = updates[1]?.pathInput;
  if (!firstInput || !secondInput) {
    renderer.destroy();
    initialInput.destroy();
    t.fail('expected two streamed line updates');
    t.end();
    return;
  }
  const firstPathBuffer = firstInput.paths.data[0].buffer;
  const secondPathBuffer = secondInput.paths.data[0].buffer;
  const thirdPathBuffer = secondInput.paths.data[1]?.buffer;
  if (!thirdPathBuffer || secondInput.model !== 'attribute') {
    renderer.destroy();
    initialInput.destroy();
    t.fail('expected an aggregate attribute line update with two path chunks');
    t.end();
    return;
  }
  const rowIndices = secondInput.pathState.segmentTable.table.getChild('rowIndices');

  t.equal(updates.length, 2, 'loads both streamed record batches');
  t.equal(firstInput.rowIndexOffset, 0, 'first batch starts at row zero');
  t.equal(secondInput.rowIndexOffset, 0, 'retained input keeps the stream row offset');
  t.equal(secondInput.paths.length, 3, 'retains rows from all streamed batches');
  t.equal(secondInput.paths.data.length, 2, 'retains source batch GPU chunks');
  t.deepEqual(
    readArrowVectorValues(rowIndices),
    [0, 1, 2],
    'preserves global row indices across retained batches'
  );
  t.ok(renderer.model, 'keeps one active model after streaming');
  t.notOk(firstPathBuffer.destroyed, 'same-model streaming retains the previous input');
  t.notOk(secondPathBuffer.destroyed, 'retained aggregate keeps the first path chunk active');
  t.notOk(thirdPathBuffer.destroyed, 'retained aggregate keeps the second path chunk active');

  renderer.destroy();
  initialInput.destroy();
  t.ok(firstPathBuffer.destroyed, 'destroy releases the first retained streamed input');
  t.ok(thirdPathBuffer.destroyed, 'destroy releases the second retained streamed input');
  t.end();
});

test('ArrowLineRenderer model switch clears active prepared streaming input', async t => {
  const device = new NullDevice({});
  const initialInput = await prepareArrowLineInputFromRecordBatches(
    device,
    [
      makeLineRecordBatch(
        makePathVector(new Int32Array([0, 2]), new Float32Array([0, 0, 1, 0])),
        arrow.vectorFromArray([1], new arrow.Float32()) as arrow.Vector<arrow.Float32>
      )
    ],
    {model: 'attribute', mode: 'lines', id: 'line-model-switch-initial-test'}
  );
  const renderer = new ArrowLineRenderer(device, {
    id: 'line-model-switch-test',
    model: 'attribute',
    mode: 'lines'
  });
  const updates: ArrowLineRendererDataBatchUpdate[] = [];

  await waitForLineBatches(
    renderer,
    [
      makeLineRecordBatch(
        makePathVector(new Int32Array([0, 2]), new Float32Array([2, 0, 3, 0])),
        arrow.vectorFromArray([2], new arrow.Float32()) as arrow.Vector<arrow.Float32>
      )
    ],
    update => updates.push(update)
  );

  const streamedInput = updates[0]?.pathInput;
  if (!streamedInput) {
    renderer.destroy();
    initialInput.destroy();
    t.fail('expected a streamed line update');
    t.end();
    return;
  }
  const streamedPathBuffer = streamedInput.paths.data[0].buffer;
  const setPropsResult = renderer.setProps({model: 'storage'});

  t.ok(setPropsResult.modelChanged, 'model selection reports a renderer update');
  t.equal(renderer.model, null, 'model switch leaves the renderer empty until new data arrives');
  t.ok(streamedPathBuffer.destroyed, 'model switch destroys active prepared streaming input');

  renderer.destroy();
  initialInput.destroy();
  t.end();
});

function makePathVector(
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Vector<PathArrowType> {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('values', new arrow.Float32(), false)
  );
  const pathType = new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as PathArrowType;
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
  const pathData = new arrow.Data<PathArrowType>(
    pathType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
  return new arrow.Vector<PathArrowType>([pathData]);
}

function makeLineRecordBatch(
  paths: arrow.Vector<PathArrowType>,
  widths: arrow.Vector<arrow.Float32>
): arrow.RecordBatch {
  const recordBatch = new arrow.Table({paths, widths}).batches[0];
  if (!recordBatch) {
    throw new Error('Expected Arrow table to contain a record batch');
  }
  return recordBatch;
}

function makePolygonRecordBatch(polygons: arrow.Vector<PathArrowType>): arrow.RecordBatch {
  const recordBatch = new arrow.Table({polygons}).batches[0];
  if (!recordBatch) {
    throw new Error('Expected Arrow table to contain a record batch');
  }
  return recordBatch;
}

function makePointRecordBatch(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): arrow.RecordBatch {
  const recordBatch = new arrow.Table({positions}).batches[0];
  if (!recordBatch) {
    throw new Error('Expected Arrow table to contain a record batch');
  }
  return recordBatch;
}

function makeTextRecordBatch(positions: Float32Array, texts: string[]): arrow.RecordBatch {
  const recordBatch = new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    texts: arrow.vectorFromArray(texts, new arrow.Utf8())
  }).batches[0];
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

function waitForPointBatches(
  renderer: ArrowPointRenderer,
  recordBatches: arrow.RecordBatch[]
): Promise<void> {
  return new Promise(resolve => {
    renderer.setProps({
      data: makeRecordBatchIterator(recordBatches),
      onDataBatch: ({loadedBatchCount}) => {
        if (loadedBatchCount === recordBatches.length) {
          resolve();
        }
      }
    });
  });
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

function waitForLineBatches(
  renderer: ArrowLineRenderer,
  recordBatches: arrow.RecordBatch[],
  onBatch: (update: ArrowLineRendererDataBatchUpdate) => void
): Promise<void> {
  return new Promise(resolve => {
    renderer.setProps({
      data: makeRecordBatchIterator(recordBatches),
      onDataBatch: update => {
        onBatch(update);
        if (update.loadedBatchCount === recordBatches.length) {
          resolve();
        }
      }
    });
  });
}

async function readGPUDataAsUint32Array(data: GPUData<'uint32'>): Promise<Uint32Array> {
  const bytes = await data.buffer.readAsync(data.byteOffset, data.length * data.byteStride);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, data.length);
}

function readArrowVectorValues(vector: arrow.Vector | null): number[] {
  if (!vector) {
    return [];
  }
  return Array.from({length: vector.length}, (_, index) => Number(vector.get(index)));
}
