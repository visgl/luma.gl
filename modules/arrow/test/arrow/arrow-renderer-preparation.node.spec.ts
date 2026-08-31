// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  addArrowTextGPUTableBatch,
  createArrowTextGPUTable,
  makeArrowFixedSizeListVector,
  resolveArrowPickInfo
} from '@luma.gl/arrow';
import type {GPUData} from '@luma.gl/gpgpu/gpu-data';
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

type PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

it('prepareArrowPointInput preserves rows, batch layout, row offsets, and ownership', async () => {
  const device = new NullDevice({});
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 1])
  );
  const prepared = await prepareArrowPointInput(
    device,
    {positions, colors: null, radii: null},
    {rowIndexOffset: 5, sourceBatchIndex: 3, id: 'point-conversion-test'}
  );
  const rowIndices = await readGPUDataAsUint32Array(prepared.table.gpuVectors.rowIndices.data[0]);
  const positionsBuffer = prepared.table.gpuVectors.positions.data[0].buffer;

  expect(prepared.rowCount, 'keeps one point row per source row').toBe(2);
  expect(prepared.table.batches.length, 'prepares one GPU table batch').toBe(1);
  expect(prepared.table.gpuConstants.colors?.byteLength, 'keeps one constant color payload').toBe(
    4
  );
  expect(prepared.table.gpuConstants.radii?.byteLength, 'keeps one constant radius payload').toBe(
    4
  );
  expect(
    Boolean(prepared.table.gpuVectors.colors),
    'does not materialize repeated constant colors'
  ).toBe(false);
  expect(
    Boolean(prepared.table.gpuVectors.radii),
    'does not materialize repeated constant radii'
  ).toBe(false);
  expect(prepared.stylingGpuByteLength, 'defers constant GPU allocation to shader bindings').toBe(
    0
  );
  expect(prepared.table.batches[0].sourceInfo, 'records point source row metadata').toEqual({
    sourceBatchIndex: 3,
    sourceRowIndexOffset: 5,
    sourceRowCount: 2
  });
  expect(Array.from(rowIndices), 'applies the row index offset').toEqual([5, 6]);

  prepared.destroy();
  expect(Boolean(positionsBuffer.destroyed), 'destroy releases owned point buffers').toBe(true);
});

it('ArrowPointRenderer streaming uses one model over retained GPU batches', async () => {
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

  expect(renderer.preparedBatches.length, 'retains both streamed point batches').toBe(2);
  expect(renderer.model?.table?.batches.length, 'uses one render model over both batches').toBe(2);
  expect(
    renderer.pickingModel?.table?.batches.length,
    'uses one picking model over both batches'
  ).toBe(2);
  expect(renderer.getMetrics().rowCount, 'tracks aggregate point rows').toBe(3);
  if (!firstPositionsBuffer || !secondPositionsBuffer || !firstRowIndices || !secondRowIndices) {
    renderer.destroy();
    throw new Error('expected retained point GPU buffers');
  }
  expect(
    Array.from(await readGPUDataAsUint32Array(firstRowIndices)),
    'first batch row indices start at zero'
  ).toEqual([0, 1]);
  expect(
    Array.from(await readGPUDataAsUint32Array(secondRowIndices)),
    'second batch row indices preserve the global row offset'
  ).toEqual([2]);
  expect(
    renderer.model?.table?.batches.map(batch => batch.sourceInfo),
    'retains point streaming source metadata on render batches'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
  ]);
  expect(
    resolveArrowPickInfo({batchIndex: 1, objectIndex: 2}, renderer.model?.table),
    'resolves point pick info to a source batch row'
  ).toEqual({batchIndex: 1, rowIndex: 2, batchRowIndex: 0});
  expect(Boolean(firstPositionsBuffer.destroyed), 'first retained point batch remains alive').toBe(
    false
  );
  expect(
    Boolean(secondPositionsBuffer.destroyed),
    'second retained point batch remains alive'
  ).toBe(false);

  renderer.destroy();
  expect(
    Boolean(firstPositionsBuffer.destroyed),
    'destroy releases the first retained point batch'
  ).toBe(true);
  expect(
    Boolean(secondPositionsBuffer.destroyed),
    'destroy releases the second retained point batch'
  ).toBe(true);
});

it('ArrowTextRenderer streaming GPU table retains pick source metadata', () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeTextRecordBatch(new Float32Array([0, 0, 1, 1]), ['alpha', 'beta']);
  const secondRecordBatch = makeTextRecordBatch(new Float32Array([2, 2]), ['gamma']);
  const gpuTable = createArrowTextGPUTable(device, firstRecordBatch);

  addArrowTextGPUTableBatch(device, gpuTable, secondRecordBatch);

  expect(
    gpuTable.batches.map(batch => batch.sourceInfo),
    'retains text streaming source metadata on GPU batches'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
  ]);
  expect(
    resolveArrowPickInfo({batchIndex: 1, objectIndex: 2}, gpuTable),
    'resolves text pick info to a source batch row'
  ).toEqual({batchIndex: 1, rowIndex: 2, batchRowIndex: 0});

  gpuTable.destroy();
});

it('ArrowTextRenderer GPU table maps nested source selectors into text input names', () => {
  const device = new NullDevice({});
  const sourceVectors = makeTextSourceVectors();
  const recordBatch = makeNestedTextRecordBatch('source', sourceVectors);
  const gpuTable = createArrowTextGPUTable(device, recordBatch, {
    positions: 'source.positions',
    texts: 'source.texts',
    pixelOffsets: 'source.pixelOffsets',
    textAnchors: 'source.textAnchors',
    alignmentBaselines: 'source.alignmentBaselines'
  });

  expect(gpuTable.gpuVectors.positions?.format, 'maps nested positions').toBe('float32x2');
  expect(gpuTable.gpuVectors.texts?.format, 'maps nested texts').toBe('value-list<uint8>');
  expect(gpuTable.gpuVectors.pixelOffsets?.format, 'maps nested pixel offsets').toBe('float32x2');
  expect(gpuTable.gpuVectors.textAnchors?.format, 'maps nested text anchors').toBe('uint8');
  expect(gpuTable.gpuVectors.alignmentBaselines?.format, 'maps nested alignment baselines').toBe(
    'uint8'
  );

  gpuTable.destroy();
});

it('prepareArrowLineInputFromRecordBatches preserves chunks, row offsets, and ownership', async () => {
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
    id: 'line-conversion-test'
  });
  expect(prepared.model, 'prepares data for the selected renderer model').toBe('attribute');
  if (prepared.model !== 'attribute') {
    prepared.destroy();
    throw new Error('expected attribute-prepared line data');
  }
  const rowIndices = prepared.pathState.segmentTable.table.getChild('rowIndices');
  const pathBuffer = prepared.paths.data[0].buffer;
  const generatedPathBuffer = prepared.pathState.expandedPathVertexData;

  expect(prepared.paths.length, 'keeps one path row per source row').toBe(3);
  expect(prepared.paths.data.length, 'preserves source record-batch path chunks').toBe(2);
  expect(prepared.widths.data.length, 'preserves source record-batch width chunks').toBe(2);
  expect(prepared.rowIndexOffset, 'reports the applied row offset').toBe(20);
  expect(
    Array.from(rowIndices?.data[0]?.values as Uint32Array),
    'applies the row index offset to generated path segments'
  ).toEqual([20, 21, 22]);

  prepared.destroy();
  expect(Boolean(pathBuffer.destroyed), 'destroy releases owned line path buffers').toBe(true);
  expect(Boolean(generatedPathBuffer.destroyed), 'destroy releases generated line buffers').toBe(
    true
  );
});

it('ArrowLineRenderer streaming keeps one active model and retains same-model batches', async () => {
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
    throw new Error('expected two streamed line updates');
  }
  const firstPathBuffer = firstInput.paths.data[0].buffer;
  const secondPathBuffer = secondInput.paths.data[0].buffer;
  const thirdPathBuffer = secondInput.paths.data[1]?.buffer;
  if (!thirdPathBuffer || secondInput.model !== 'attribute') {
    renderer.destroy();
    initialInput.destroy();
    throw new Error('expected an aggregate attribute line update with two path chunks');
  }
  const rowIndices = secondInput.pathState.segmentTable.table.getChild('rowIndices');

  expect(updates.length, 'loads both streamed record batches').toBe(2);
  expect(firstInput.rowIndexOffset, 'first batch starts at row zero').toBe(0);
  expect(secondInput.rowIndexOffset, 'retained input keeps the stream row offset').toBe(0);
  expect(secondInput.paths.length, 'retains rows from all streamed batches').toBe(3);
  expect(secondInput.paths.data.length, 'retains source batch GPU chunks').toBe(2);
  expect(
    readArrowVectorValues(rowIndices),
    'preserves global row indices across retained batches'
  ).toEqual([0, 1, 2]);
  expect(Boolean(renderer.model), 'keeps one active model after streaming').toBe(true);
  expect(
    Boolean(firstPathBuffer.destroyed),
    'same-model streaming retains the previous input'
  ).toBe(false);
  expect(
    Boolean(secondPathBuffer.destroyed),
    'retained aggregate keeps the first path chunk active'
  ).toBe(false);
  expect(
    Boolean(thirdPathBuffer.destroyed),
    'retained aggregate keeps the second path chunk active'
  ).toBe(false);

  renderer.destroy();
  initialInput.destroy();
  expect(
    Boolean(firstPathBuffer.destroyed),
    'destroy releases the first retained streamed input'
  ).toBe(true);
  expect(
    Boolean(thirdPathBuffer.destroyed),
    'destroy releases the second retained streamed input'
  ).toBe(true);
});

it('ArrowLineRenderer model switch clears active prepared streaming input', async () => {
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
    throw new Error('expected a streamed line update');
  }
  const streamedPathBuffer = streamedInput.paths.data[0].buffer;
  const setPropsResult = renderer.setProps({model: 'storage'});

  expect(Boolean(setPropsResult.modelChanged), 'model selection reports a renderer update').toBe(
    true
  );
  expect(renderer.model, 'model switch leaves the renderer empty until new data arrives').toBe(
    null
  );
  expect(
    Boolean(streamedPathBuffer.destroyed),
    'model switch destroys active prepared streaming input'
  ).toBe(true);

  renderer.destroy();
  initialInput.destroy();
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

function makeTextSourceVectors() {
  return {
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1])),
    texts: arrow.vectorFromArray(['alpha', 'beta'], new arrow.Utf8()),
    pixelOffsets: makeArrowFixedSizeListVector(
      new arrow.Float32(),
      2,
      new Float32Array([1, 2, 3, 4])
    ),
    textAnchors: arrow.vectorFromArray([0, 1], new arrow.Uint8()),
    alignmentBaselines: arrow.vectorFromArray([0, 2], new arrow.Uint8())
  };
}

function makeNestedTextRecordBatch(
  fieldName: string,
  sourceVectors: ReturnType<typeof makeTextSourceVectors>
): arrow.RecordBatch {
  const table = new arrow.Table(sourceVectors);
  const innerStructData = table.batches[0]?.data;
  if (!innerStructData) {
    throw new Error('Expected Arrow table to contain a source batch');
  }
  const schema = new arrow.Schema([new arrow.Field(fieldName, innerStructData.type)]);
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: table.numRows,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });
  const recordBatch = new arrow.Table([new arrow.RecordBatch(schema, structData)]).batches[0];
  if (!recordBatch) {
    throw new Error('Expected nested Arrow table to contain a record batch');
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
