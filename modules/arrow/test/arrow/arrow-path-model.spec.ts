// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowPathModel,
  ArrowStoragePathModel,
  GPUVector,
  buildArrowPathSegmentTable,
  createArrowStoragePathState,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('buildArrowPathSegmentTable expands path rows and repeats row styles', t => {
  const sourceVectors = makeArrowPathSourceVectors();
  const result = buildArrowPathSegmentTable({
    rowTable: new arrow.Table({
      colors: sourceVectors.colors,
      widths: sourceVectors.widths
    }),
    paths: sourceVectors.paths
  });

  t.equal(result.table.numRows, 5, 'emits one Arrow row per generated segment');
  t.deepEqual(result.segmentLayout.startIndices, [0, 2, 5], 'retains path segment offsets');
  t.deepEqual(
    Array.from(result.segmentLayout.segmentStartPositions),
    [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 1, 0, 0],
    'segment starts preserve open and closed path order'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentEndPositions),
    [1, 0, 0, 0, 1, 1, 0, 0, 3, 0, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0],
    'segment ends preserve the source path edge order'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentPreviousPositions),
    [0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0],
    'previous positions preserve open caps and closed joins'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentNextPositions),
    [1, 1, 0, 0, 1, 1, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0],
    'next positions preserve open caps and closed joins'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentFlags),
    [1, 2, 5, 4, 6],
    'segment flags identify first, last, and closed rows'
  );
  t.deepEqual(
    Array.from(getFixedSizeListValues(result.table.getChild('colors')!)),
    [255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255],
    'RGBA row styles repeat across generated segments'
  );
  t.deepEqual(
    Array.from(result.table.getChild('widths')!.data[0]!.values as Float32Array),
    [2, 2, 4, 4, 4],
    'scalar row styles repeat across generated segments'
  );
  t.deepEqual(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    [0, 0, 1, 1, 1],
    'generated rows retain source path row indices'
  );
  t.end();
});

test('buildArrowPathSegmentTable preserves XYZ and XYZM coordinate lanes', t => {
  for (const dimension of [3, 4] as const) {
    const path = makePathVector(
      new Int32Array([0, 2]),
      new Float32Array(dimension === 3 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7]),
      dimension
    );
    const result = buildArrowPathSegmentTable({
      rowTable: new arrow.Table({}),
      paths: path
    });

    t.deepEqual(
      Array.from(result.segmentLayout.segmentStartPositions.subarray(0, 4)),
      dimension === 3 ? [0, 1, 2, 0] : [0, 1, 2, 3],
      `vec${dimension} starts preserve source coordinate lanes`
    );
    t.deepEqual(
      Array.from(result.segmentLayout.segmentEndPositions.subarray(0, 4)),
      dimension === 3 ? [3, 4, 5, 0] : [4, 5, 6, 7],
      `vec${dimension} ends preserve source coordinate lanes`
    );
  }

  t.end();
});

test('ArrowPathModel derives from ArrowModel and packs generated segment records', async t => {
  const device = new NullDevice({});
  const pathProps = makeGpuArrowPathProps(device);
  const model = new ArrowPathModel(device, {
    id: 'arrow-path-model-test',
    ...pathProps
  });
  const expandedPathBytes = await model.expandedPathVertexData.readAsync();
  const firstSegmentPositions = new Float32Array(
    expandedPathBytes.buffer,
    expandedPathBytes.byteOffset,
    16
  );
  const firstSegmentMetadata = new Uint32Array(
    expandedPathBytes.buffer,
    expandedPathBytes.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16,
    2
  );
  const expandedPathLayout = model.bufferLayout.find(
    layout => layout.name === 'expandedPathVertexData'
  );

  t.equal(model.instanceCount, 5, 'instance count uses generated segment rows');
  t.deepEqual(model.segmentLayout.startIndices, [0, 2, 5], 'model exposes segment offsets');
  t.equal(expandedPathLayout?.byteStride, 72, 'expanded segment records use a 72-byte stride');
  t.deepEqual(
    expandedPathLayout?.attributes,
    [
      {attribute: 'segmentStartPositions', format: 'float32x4', byteOffset: 0},
      {attribute: 'segmentEndPositions', format: 'float32x4', byteOffset: 16}
    ],
    'default generated vertex data exposes segment endpoints'
  );
  t.deepEqual(
    Array.from(firstSegmentPositions),
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    'packed record stores start, end, previous, and next positions'
  );
  t.deepEqual(
    Array.from(firstSegmentMetadata),
    [1, 0],
    'packed record stores generated flags and source row index'
  );

  model.destroy();
  destroyGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowPathModel requires explicit CPU source vectors', t => {
  const device = new NullDevice({});
  const pathProps = makeGpuArrowPathProps(device);
  const {sourceVectors, ...propsWithoutSourceVectors} = pathProps;

  t.throws(
    () =>
      new ArrowPathModel(device, {
        id: 'arrow-path-model-missing-sources-test',
        ...(propsWithoutSourceVectors as Omit<typeof pathProps, 'sourceVectors'>)
      } as never),
    /requires explicit sourceVectors/,
    'CPU source ownership is visible at the path model boundary'
  );

  destroyGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowPathModel rejects source batch alignment mismatches', t => {
  const device = new NullDevice({});
  const pathProps = makeGpuArrowPathProps(device);
  const firstChunk = makePathVector(new Int32Array([0, 3]), new Float32Array([0, 0, 1, 0, 1, 1]));
  const secondChunk = makePathVector(
    new Int32Array([0, 4]),
    new Float32Array([2, 0, 3, 0, 3, 1, 2, 0])
  );

  t.throws(
    () =>
      new ArrowPathModel(device, {
        id: 'arrow-path-model-source-batch-alignment-test',
        ...pathProps,
        sourceVectors: {
          ...pathProps.sourceVectors,
          paths: new arrow.Vector<PathArrowType>([...firstChunk.data, ...secondChunk.data])
        }
      }),
    /batch count must match GPU batches/,
    'path source vector batches stay explicitly aligned with GPU vector batches'
  );

  destroyGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowPathModel splits generated path buffers by source-row boundaries', t => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 300});
  const pathProps = makeGpuArrowPathProps(device);
  const model = new ArrowPathModel(device, {
    id: 'arrow-path-model-buffer-batching-test',
    ...pathProps
  });

  t.equal(model.renderBatches.length, 2, 'generated path output splits into two render batches');
  t.deepEqual(
    model.renderBatches.map(batch => batch.segmentCount),
    [2, 3],
    'batching preserves whole source-path rows'
  );
  t.equal(model.instanceCount, 5, 'aggregate segment count remains unchanged');

  model.destroy();
  destroyGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel emits indexed compute-generated segment records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const pathProps = makeStorageGpuArrowPathProps(device);
  const model = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-generated-segments-test',
    ...pathProps
  });
  const compactPathBytes = await model.compactPathVertexData.readAsync();
  const generatedPathWords = new Uint32Array(
    compactPathBytes.buffer,
    compactPathBytes.byteOffset,
    model.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const compactPathLayout = model.bufferLayout.find(
    layout => layout.name === 'compactPathVertexData'
  );

  t.equal(model.segmentCount, 5, 'storage expansion emits one generated row per path segment');
  t.equal(
    model.generatedRenderBufferByteLength,
    120,
    'five generated segment records keep the 24-byte indexed stride'
  );
  t.equal(compactPathLayout?.byteStride, 24, 'generated storage path records use a 24-byte stride');
  t.deepEqual(
    compactPathLayout?.attributes,
    [
      {attribute: 'segmentStartPointIndices', format: 'uint32', byteOffset: 0},
      {attribute: 'segmentEndPointIndices', format: 'uint32', byteOffset: 4},
      {attribute: 'rowIndices', format: 'uint32', byteOffset: 20}
    ],
    'default storage rendering exposes point indices plus source row indices'
  );
  t.deepEqual(
    Array.from(generatedPathWords.subarray(0, 6)),
    [0, 1, 0, 2, 1, 0],
    'compute output stores start, end, previous, next point indices, flags, and row index'
  );
  t.deepEqual(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 6 + 4]),
    [1, 2, 5, 4, 6],
    'compute output preserves first, last, and closed path flags'
  );
  t.deepEqual(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 6 + 5]),
    [0, 0, 1, 1, 1],
    'compute output preserves source path row indices'
  );

  model.destroy();
  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel refreshes row styles without rebuilding segment buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const pathProps = makeStorageGpuArrowPathProps(device);
  const model = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-row-style-refresh-test',
    ...pathProps
  });
  const storageState = model.storageState;
  const compactPathVertexData = model.compactPathVertexData;
  const renderBatches = model.renderBatches;
  const styleConfigBuffer = model.styleConfigBuffer;

  model.setProps({color: [255, 0, 0, 255], width: 4});

  t.equal(model.storageState, storageState, 'row-style updates preserve storage state');
  t.equal(
    model.compactPathVertexData,
    compactPathVertexData,
    'row-style updates preserve generated segment data'
  );
  t.equal(model.renderBatches, renderBatches, 'row-style updates preserve render batches');
  t.notEqual(
    model.styleConfigBuffer,
    styleConfigBuffer,
    'row-style updates refresh the owned storage style config'
  );

  model.destroy();
  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel splits compute-generated segment buffers by storage limits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const originalMaxStorageBufferBindingSize = device.limits.maxStorageBufferBindingSize;
  Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
    value: 80,
    configurable: true
  });

  try {
    const pathProps = makeStorageGpuArrowPathProps(device);
    const model = new ArrowStoragePathModel(device, {
      id: 'arrow-storage-path-buffer-batching-test',
      ...pathProps
    });

    t.equal(model.storageState.batches.length, 1, 'row bindings retain the source path batch');
    t.equal(model.renderBatches.length, 2, 'generated path output splits into render batches');
    t.deepEqual(
      model.renderBatches.map(batch => batch.segmentCount),
      [2, 3],
      'storage batching preserves whole source-path rows'
    );
    t.equal(
      model.generatedRenderBufferByteLength,
      120,
      'aggregate generated path byte accounting stays exact'
    );

    model.destroy();
    destroyStorageGpuArrowPathProps(pathProps);
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
      value: originalMaxStorageBufferBindingSize,
      configurable: true
    });
  }
  t.end();
});

test('ArrowStoragePathModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const pathProps = makeStorageGpuArrowPathProps(device);

  t.throws(
    () =>
      new ArrowStoragePathModel(device, {
        id: 'arrow-storage-path-model-test',
        ...pathProps
      }),
    /WebGPU-only/,
    'storage path model reports its backend contract'
  );

  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('createArrowStoragePathState rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const pathProps = makeStorageGpuArrowPathProps(device);

  t.throws(
    () =>
      createArrowStoragePathState(device, {
        id: 'arrow-storage-path-state-test',
        ...pathProps
      }),
    /WebGPU device/,
    'storage-state builder reports its backend contract'
  );

  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

function makeGpuArrowPathProps(device: NullDevice) {
  const sourceVectors = makeArrowPathSourceVectors();
  return {
    paths: makeGpuArrowPathVector(device, 'paths', sourceVectors.paths),
    colors: makeGpuArrowPathVector(device, 'colors', sourceVectors.colors),
    widths: makeGpuArrowPathVector(device, 'widths', sourceVectors.widths),
    sourceVectors
  };
}

function makeStorageGpuArrowPathProps(device: NullDevice) {
  const sourceVectors = makeArrowPathSourceVectors();
  return {
    paths: makeGpuArrowPathVector(device, 'paths', sourceVectors.paths),
    colors: makeGpuArrowPathVector(device, 'colors', sourceVectors.colors),
    widths: makeGpuArrowPathVector(device, 'widths', sourceVectors.widths)
  };
}

function makeGpuArrowPathVector<TypeT extends arrow.DataType>(
  device: NullDevice,
  name: string,
  vector: arrow.Vector<TypeT>
): GPUVector<TypeT> {
  return new GPUVector({
    type: 'arrow',
    name,
    device,
    vector
  });
}

function destroyGpuArrowPathProps(pathProps: ReturnType<typeof makeGpuArrowPathProps>): void {
  pathProps.paths.destroy();
  pathProps.colors.destroy();
  pathProps.widths.destroy();
}

function destroyStorageGpuArrowPathProps(
  pathProps: ReturnType<typeof makeStorageGpuArrowPathProps>
): void {
  pathProps.paths.destroy();
  pathProps.colors.destroy();
  pathProps.widths.destroy();
}

function makeArrowPathSourceVectors() {
  return {
    paths: makePathVector(
      new Int32Array([0, 3, 7]),
      new Float32Array([0, 0, 1, 0, 1, 1, 2, 0, 3, 0, 3, 1, 2, 0])
    ),
    colors: makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
    ),
    widths: arrow.vectorFromArray([2, 4], new arrow.Float32())
  };
}

function makePathVector(
  valueOffsets: Int32Array,
  values: Float32Array,
  dimension: 2 | 3 | 4 = 2
): arrow.Vector<PathArrowType> {
  const coordinateType = new arrow.FixedSizeList(
    dimension,
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
    {[arrow.BufferType.DATA]: values}
  );
  const coordinateData = new arrow.Data<arrow.FixedSizeList<arrow.Float32>>(
    coordinateType,
    0,
    values.length / dimension,
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

function getFixedSizeListValues(vector: arrow.Vector): Uint8Array {
  const childData = vector.data[0]!.children[0] as arrow.Data<arrow.Uint8>;
  return childData.values as Uint8Array;
}
