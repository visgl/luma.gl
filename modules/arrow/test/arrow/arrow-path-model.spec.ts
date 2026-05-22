// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowPathModel,
  ArrowStoragePathModel,
  ArrowStorageTripsPathModel,
  buildArrowPathSegmentTable,
  createArrowStoragePathState,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector,
  readArrowGPUVectorAsync,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors
} from '@luma.gl/arrow';
import type {Device, ShaderLayout} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/tables';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type Float64PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
type ColorListArrowType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;

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
    Array.from(result.segmentLayout.segmentStartColors),
    [
      packColor([255, 0, 0, 255]),
      packColor([255, 0, 0, 255]),
      packColor([0, 255, 0, 255]),
      packColor([0, 255, 0, 255]),
      packColor([0, 255, 0, 255])
    ],
    'generated segment starts retain row colors'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentEndColors),
    [
      packColor([255, 0, 0, 255]),
      packColor([255, 0, 0, 255]),
      packColor([0, 255, 0, 255]),
      packColor([0, 255, 0, 255]),
      packColor([0, 255, 0, 255])
    ],
    'generated segment ends retain row colors'
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

test('buildArrowPathSegmentTable expands path-aligned color lists', t => {
  const sourceVectors = makeArrowPathSourceVectors();
  const colors = makeColorListVector(
    new Int32Array([0, 3, 7]),
    new Uint8Array([
      255, 0, 0, 255, 255, 128, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0, 0,
      255, 255, 255, 0, 255, 255
    ])
  );
  const result = buildArrowPathSegmentTable({
    rowTable: new arrow.Table({colors, widths: sourceVectors.widths}),
    paths: sourceVectors.paths
  });

  t.deepEqual(
    Array.from(result.segmentLayout.segmentStartColors),
    [
      packColor([255, 0, 0, 255]),
      packColor([255, 128, 0, 255]),
      packColor([0, 255, 0, 255]),
      packColor([0, 255, 255, 255]),
      packColor([0, 0, 255, 255])
    ],
    'segment start colors use each segment start vertex'
  );
  t.deepEqual(
    Array.from(result.segmentLayout.segmentEndColors),
    [
      packColor([255, 128, 0, 255]),
      packColor([255, 255, 0, 255]),
      packColor([0, 255, 255, 255]),
      packColor([0, 0, 255, 255]),
      packColor([255, 0, 255, 255])
    ],
    'segment end colors use each segment end vertex'
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
  const pathProps = await makeGpuArrowPathProps(device);
  const model = new ArrowPathModel(device, {
    id: 'arrow-path-model-test',
    ...pathProps.pathProps
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
  const firstSegmentColors = new Uint32Array(
    expandedPathBytes.buffer,
    expandedPathBytes.byteOffset +
      Float32Array.BYTES_PER_ELEMENT * 16 +
      Uint32Array.BYTES_PER_ELEMENT * 2,
    2
  );
  const expandedPathLayout = model.bufferLayout.find(
    layout => layout.name === 'expandedPathVertexData'
  );
  const pathViewOriginLayout = model.bufferLayout.find(
    layout => layout.name === 'pathViewOriginData'
  );

  t.equal(model.instanceCount, 5, 'instance count uses generated segment rows');
  t.deepEqual(model.segmentLayout.startIndices, [0, 2, 5], 'model exposes segment offsets');
  t.equal(expandedPathLayout?.byteStride, 80, 'expanded segment records use an 80-byte stride');
  t.equal(pathViewOriginLayout?.byteStride, 16, 'view-origin records use a 16-byte stride');
  t.deepEqual(
    expandedPathLayout?.attributes,
    [
      {attribute: 'segmentStartPositions', format: 'float32x4', byteOffset: 0},
      {attribute: 'segmentEndPositions', format: 'float32x4', byteOffset: 16},
      {attribute: 'segmentStartColors', format: 'uint32', byteOffset: 72},
      {attribute: 'segmentEndColors', format: 'uint32', byteOffset: 76}
    ],
    'default generated vertex data exposes segment endpoints and packed colors'
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
  t.deepEqual(
    Array.from(firstSegmentColors),
    [packColor([255, 0, 0, 255]), packColor([255, 0, 0, 255])],
    'packed record stores generated segment endpoint colors'
  );

  model.destroy();
  pathProps.destroy();
  t.end();
});

test('ArrowPathModel requires prepared path state', t => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowPathSourceVectors();
  const paths = makeGpuArrowPathVector(device, 'paths', sourceVectors.paths);

  t.throws(
    () =>
      new ArrowPathModel(device, {
        id: 'arrow-path-model-missing-sources-test',
        paths
      } as never),
    /pathState/,
    'prepared path state is visible at the path model boundary'
  );

  paths.destroy();
  t.end();
});

test('ArrowPathModel rejects prepared state row mismatches', async t => {
  const device = new NullDevice({});
  const pathProps = await makeGpuArrowPathProps(device);
  const sourceVectors = makeArrowPathSourceVectors();
  const mismatchedPaths = makeGpuArrowPathVector(device, 'paths', sourceVectors.paths.slice(0, 1));

  t.throws(
    () =>
      new ArrowPathModel(device, {
        id: 'arrow-path-model-source-batch-alignment-test',
        ...pathProps.pathProps,
        colors: undefined,
        widths: undefined,
        paths: mismatchedPaths
      }),
    /prepared path rows must match path GPU rows/,
    'prepared state rows stay aligned with path GPU rows'
  );

  mismatchedPaths.destroy();
  pathProps.destroy();
  t.end();
});

test('ArrowPathModel splits generated path buffers by source-row boundaries', async t => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 300});
  const pathProps = await makeGpuArrowPathProps(device);
  const model = new ArrowPathModel(device, {
    id: 'arrow-path-model-buffer-batching-test',
    ...pathProps.pathProps
  });

  t.equal(model.renderBatches.length, 2, 'generated path output splits into two render batches');
  t.deepEqual(
    model.renderBatches.map(batch => batch.segmentCount),
    [2, 3],
    'batching preserves whole source-path rows'
  );
  t.equal(model.instanceCount, 5, 'aggregate segment count remains unchanged');

  model.destroy();
  pathProps.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors keeps Float32 paths unchanged without closure', async t => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowPathSourceVectors();
  const prepared = await ArrowPathModel.prepareGPUVectors(device, sourceVectors);
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  t.equal(prepared.sourceOrigins, undefined, 'Float32 preparation does not create source origins');
  t.equal(
    prepared.viewOrigins,
    undefined,
    'Float32 preparation does not create view-origin vectors'
  );
  t.deepEqual(
    Array.from(getPathValues(preparedPaths)),
    Array.from(getPathValues(sourceVectors.paths)),
    'Float32 coordinate payload is uploaded unchanged'
  );
  t.deepEqual(
    Array.from(getPathOffsets(preparedPaths)),
    Array.from(getPathOffsets(sourceVectors.paths)),
    'Float32 path offsets are preserved'
  );

  prepared.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors converts Float64 paths to per-row Float32 deltas', async t => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3, 5]),
    new Float64Array([
      1_000_000_000, -1_000_000_000, 1_000_000_000.5, -999_999_999.75, 1_000_000_002, -999_999_997,
      20_000_000_000, 10, 19_999_999_999.75, 10.75
    ])
  );
  const prepared = await ArrowPathModel.prepareGPUVectors(device, {paths});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  t.deepEqual(
    Array.from(getPathValues(preparedPaths)),
    [0, 0, 0.5, 0.25, 2, 3, 0, 0, -0.25, 0.75],
    'Float64 coordinates become Float32 deltas from each path origin'
  );
  t.deepEqual(
    Array.from(prepared.sourceOrigins || []),
    [1_000_000_000, -1_000_000_000, 0, 0, 20_000_000_000, 10, 0, 0],
    'per-row Float64 origins are retained on CPU'
  );
  t.ok(prepared.viewOrigins, 'Float64 preparation creates view-origin GPU storage');

  prepared.destroy();
  t.end();
});

test('ArrowStoragePathModel.prepareGPUVectors converts Float64 paths to per-row Float32 deltas on WebGPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const paths = makeFloat64PathVector(
    new Int32Array([0, 3, 5]),
    new Float64Array([
      1_000_000_000, -1_000_000_000, 1_000_000_000.5, -999_999_999.75, 1_000_000_002, -999_999_997,
      20_000_000_000, 10, 19_999_999_999.75, 10.75
    ])
  );
  const prepared = await ArrowStoragePathModel.prepareGPUVectors(device, {paths});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  t.deepEqual(
    Array.from(getPathValues(preparedPaths)),
    [0, 0, 0.5, 0.25, 2, 3, 0, 0, -0.25, 0.75],
    'storage preparation converts Float64 coordinates into Float32 deltas on the GPU'
  );
  t.deepEqual(
    Array.from(prepared.sourceOrigins || []),
    [1_000_000_000, -1_000_000_000, 0, 0, 20_000_000_000, 10, 0, 0],
    'storage preparation retains only compact per-row Float64 origins on CPU'
  );
  t.ok(prepared.viewOrigins, 'storage preparation creates view-origin GPU storage');

  prepared.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors closes Float64 delta paths by appending the first delta', async t => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3]),
    new Float64Array([10_000_000, -10_000_000, 10_000_001, -10_000_000, 10_000_001, -9_999_999])
  );
  const closed = arrow.vectorFromArray([true], new arrow.Bool());
  const prepared = await ArrowPathModel.prepareGPUVectors(device, {paths, closed});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  t.deepEqual(Array.from(getPathOffsets(preparedPaths)), [0, 4], 'closure appends one delta point');
  t.deepEqual(
    Array.from(getPathValues(preparedPaths)),
    [0, 0, 1, 0, 1, 1, 0, 0],
    'the injected closing point is the first delta, usually zero'
  );
  t.deepEqual(
    Array.from(prepared.sourceOrigins || []),
    [10_000_000, -10_000_000, 0, 0],
    'closing delta paths does not change the per-row origin'
  );

  prepared.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors updates view origins without rewriting path deltas', async t => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3]),
    new Float64Array([100, 200, 101, 200, 102, 201])
  );
  const prepared = await ArrowPathModel.prepareGPUVectors(device, {paths});
  const pathBytesBefore = await prepared.paths.buffer.readAsync();
  const deltaSegmentBytesBefore =
    await prepared.pathProps.pathState.expandedPathVertexData.readAsync();
  const viewOriginBytesBefore = await prepared.pathProps.pathState.pathViewOriginData.readAsync();

  prepared.updateViewOrigins({
    modelViewMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 10, 20, 30, 1]
  });

  const pathBytesAfter = await prepared.paths.buffer.readAsync();
  const deltaSegmentBytesAfter =
    await prepared.pathProps.pathState.expandedPathVertexData.readAsync();
  const viewOriginBytesAfter = await prepared.pathProps.pathState.pathViewOriginData.readAsync();
  const updatedOrigins = new Float32Array(
    viewOriginBytesAfter.buffer,
    viewOriginBytesAfter.byteOffset,
    viewOriginBytesAfter.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  t.deepEqual(
    Array.from(
      new Uint8Array(pathBytesAfter.buffer, pathBytesAfter.byteOffset, pathBytesAfter.byteLength)
    ),
    Array.from(
      new Uint8Array(pathBytesBefore.buffer, pathBytesBefore.byteOffset, pathBytesBefore.byteLength)
    ),
    'path delta GPU buffer is stable across view updates'
  );
  t.deepEqual(
    Array.from(
      new Uint8Array(
        deltaSegmentBytesAfter.buffer,
        deltaSegmentBytesAfter.byteOffset,
        deltaSegmentBytesAfter.byteLength
      )
    ),
    Array.from(
      new Uint8Array(
        deltaSegmentBytesBefore.buffer,
        deltaSegmentBytesBefore.byteOffset,
        deltaSegmentBytesBefore.byteLength
      )
    ),
    'expanded delta segment buffer is stable across view updates'
  );
  t.notDeepEqual(
    Array.from(
      new Uint8Array(
        viewOriginBytesAfter.buffer,
        viewOriginBytesAfter.byteOffset,
        viewOriginBytesAfter.byteLength
      )
    ),
    Array.from(
      new Uint8Array(
        viewOriginBytesBefore.buffer,
        viewOriginBytesBefore.byteOffset,
        viewOriginBytesBefore.byteLength
      )
    ),
    'view-origin buffer is rewritten across view updates'
  );
  t.deepEqual(
    Array.from(updatedOrigins.subarray(0, 8)),
    [210, 620, 30, 0, 210, 620, 30, 0],
    'updated view origins repeat once per generated segment'
  );

  prepared.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors split Float64 transform matches CPU full transform', async t => {
  const device = new NullDevice({});
  const sourceOrigin = [1_000_000_000, -1_000_000_000, 100];
  const deltas = [
    [0, 0, 0],
    [0.5, 0.25, -1],
    [-0.125, 2, 4]
  ];
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3]),
    new Float64Array(
      deltas.flatMap(delta => sourceOrigin.map((origin, index) => origin + (delta[index] ?? 0)))
    ),
    3
  );
  const prepared = await ArrowPathModel.prepareGPUVectors(device, {paths});
  const modelViewMatrix = makeOriginRelativeModelViewMatrix(sourceOrigin);

  prepared.updateViewOrigins({modelViewMatrix});

  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);
  const preparedDeltas = getPathValues(preparedPaths);
  const viewOriginBytes = await prepared.pathProps.pathState.pathViewOriginData.readAsync();
  const viewOrigins = new Float32Array(
    viewOriginBytes.buffer,
    viewOriginBytes.byteOffset,
    viewOriginBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  const originView = Array.from(viewOrigins.subarray(0, 4));

  for (const [pointIndex, delta] of deltas.entries()) {
    const sourcePoint = sourceOrigin.map((origin, index) => origin + (delta[index] ?? 0));
    const fullTransform = transformPoint(modelViewMatrix, sourcePoint);
    const deltaOffset = pointIndex * 3;
    const splitTransform = addVectors(
      originView,
      transformVector(modelViewMatrix, [
        preparedDeltas[deltaOffset] ?? 0,
        preparedDeltas[deltaOffset + 1] ?? 0,
        preparedDeltas[deltaOffset + 2] ?? 0
      ])
    );
    assertApproxArray(
      t,
      splitTransform,
      fullTransform,
      1e-3,
      `point ${pointIndex} split transform`
    );
  }

  prepared.destroy();
  t.end();
});

test('ArrowPathModel.prepareGPUVectors rejects unsupported path inputs', async t => {
  const device = new NullDevice({});
  const invalidDimensionPaths = makeFloat64PathVector(
    new Int32Array([0, 1]),
    new Float64Array([0, 0, 0, 0, 0]),
    5
  );
  const sourceVectors = makeArrowPathSourceVectors();
  const mismatchedClosed = arrow.vectorFromArray([true], new arrow.Bool());

  try {
    await ArrowPathModel.prepareGPUVectors(device, {paths: invalidDimensionPaths});
    t.fail('invalid path dimensions should be rejected');
  } catch (error) {
    t.ok(
      /FixedSizeList<Float32\|Float64>\[2\.\.4\]/.test((error as Error).message),
      'coordinate dimensions outside 2..4 are rejected'
    );
  }

  try {
    await ArrowPathModel.prepareGPUVectors(device, {...sourceVectors, closed: mismatchedClosed});
    t.fail('closed flag row mismatches should be rejected');
  } catch (error) {
    t.ok(
      /closed rows must match paths rows/.test((error as Error).message),
      'closed rows must align'
    );
  }

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
  t.equal(model.pathRangeByteLength, 32, 'storage paths retain one 16-byte path range per row');
  t.equal(model.pathRecordByteStride, 12, 'default storage path records use three u32 words');
  t.equal(
    model.generatedRenderBufferByteLength,
    60,
    'five generated segment records keep the compact 12-byte indexed stride'
  );
  t.equal(compactPathLayout?.byteStride, 12, 'generated storage path records use a 12-byte stride');
  t.deepEqual(
    compactPathLayout?.attributes,
    [
      {attribute: 'segmentStartPointIndices', format: 'uint32', byteOffset: 0},
      {attribute: 'segmentFlags', format: 'uint32', byteOffset: 4},
      {attribute: 'rowIndices', format: 'uint32', byteOffset: 8}
    ],
    'default storage rendering exposes compact segment records plus source row indices'
  );
  t.deepEqual(
    Array.from(generatedPathWords.subarray(0, 3)),
    [0, 1, 0],
    'compute output stores start point index, flags, and row index'
  );
  t.deepEqual(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 3 + 1]),
    [1, 2, 5, 4, 6],
    'compute output preserves first, last, and closed path flags'
  );
  t.deepEqual(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 3 + 2]),
    [0, 0, 1, 1, 1],
    'compute output preserves source path row indices'
  );

  model.destroy();
  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel binds path-aligned vertex colors', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const sourceVectors = makeArrowPathSourceVectors();
  const pathProps = makeStorageGpuArrowPathProps(device, {
    ...sourceVectors,
    colors: makeColorListVector(
      new Int32Array([0, 3, 7]),
      new Uint8Array([
        255, 0, 0, 255, 255, 128, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0, 0,
        255, 255, 255, 0, 255, 255
      ])
    )
  });
  const model = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-vertex-color-test',
    ...pathProps
  });
  const bindings = (model as any)._getBindings();
  const styleConfigBytes = await model.styleConfigBuffer.readAsync();
  const styleConfigWords = new Uint32Array(
    styleConfigBytes.buffer,
    styleConfigBytes.byteOffset,
    styleConfigBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  t.ok(bindings.pathVertexColors, 'binds a flattened path vertex color storage buffer');
  t.equal(styleConfigWords[5], 0, 'row color storage is disabled for color lists');
  t.equal(styleConfigWords[10], 1, 'vertex color storage is enabled for color lists');

  model.destroy();
  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel preserves legacy segment records when requested by shader layout', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const legacyShaderLayout = makeLegacyStoragePathShaderLayout();
  const pathProps = makeStorageGpuArrowPathProps(device);
  const model = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-legacy-generated-segments-test',
    ...pathProps,
    shaderLayout: legacyShaderLayout
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

  t.equal(model.pathRecordByteStride, 24, 'legacy shader layouts keep six u32 words');
  t.equal(
    model.generatedRenderBufferByteLength,
    120,
    'legacy segment records keep the 24-byte indexed stride'
  );
  t.equal(compactPathLayout?.byteStride, 24, 'legacy buffer layout uses a 24-byte stride');
  t.deepEqual(
    compactPathLayout?.attributes,
    [
      {attribute: 'segmentStartPointIndices', format: 'uint32', byteOffset: 0},
      {attribute: 'segmentEndPointIndices', format: 'uint32', byteOffset: 4},
      {attribute: 'segmentPreviousPointIndices', format: 'uint32', byteOffset: 8},
      {attribute: 'segmentNextPointIndices', format: 'uint32', byteOffset: 12},
      {attribute: 'segmentFlags', format: 'uint32', byteOffset: 16},
      {attribute: 'rowIndices', format: 'uint32', byteOffset: 20}
    ],
    'legacy storage rendering exposes all precomputed neighbor indices'
  );
  t.deepEqual(
    Array.from(generatedPathWords.subarray(0, 6)),
    [0, 1, 0, 2, 1, 0],
    'legacy compute output stores start, end, previous, next point indices, flags, and row index'
  );

  model.destroy();
  destroyStorageGpuArrowPathProps(pathProps);
  t.end();
});

test('ArrowStoragePathModel compact records derive the same neighbors as legacy records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const legacyShaderLayout = makeLegacyStoragePathShaderLayout();
  const compactPathProps = makeStorageGpuArrowPathProps(device);
  const legacyPathProps = makeStorageGpuArrowPathProps(device);
  const sourceVectors = makeArrowPathSourceVectors();
  const pathOffsets = getPathOffsets(sourceVectors.paths);
  const compactModel = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-compact-neighbor-parity-test',
    ...compactPathProps
  });
  const legacyModel = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-legacy-neighbor-parity-test',
    ...legacyPathProps,
    shaderLayout: legacyShaderLayout
  });
  const compactPathBytes = await compactModel.compactPathVertexData.readAsync();
  const legacyPathBytes = await legacyModel.compactPathVertexData.readAsync();
  const compactPathWords = new Uint32Array(
    compactPathBytes.buffer,
    compactPathBytes.byteOffset,
    compactModel.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const legacyPathWords = new Uint32Array(
    legacyPathBytes.buffer,
    legacyPathBytes.byteOffset,
    legacyModel.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  t.deepEqual(
    Array.from({length: compactModel.segmentCount}, (_, segmentIndex) =>
      deriveLegacyStoragePathRecord(compactPathWords, segmentIndex, pathOffsets)
    ),
    Array.from({length: legacyModel.segmentCount}, (_, segmentIndex) =>
      Array.from(legacyPathWords.subarray(segmentIndex * 6, segmentIndex * 6 + 6))
    ),
    'compact start/flags/row records derive the same open and closed neighbor indices'
  );

  compactModel.destroy();
  legacyModel.destroy();
  destroyStorageGpuArrowPathProps(compactPathProps);
  destroyStorageGpuArrowPathProps(legacyPathProps);
  t.end();
});

test('ArrowStoragePathModel uses a shared zero origin when view origins are absent', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const pathProps = makeStorageGpuArrowPathProps(device);
  const model = new ArrowStoragePathModel(device, {
    id: 'arrow-storage-path-default-origin-test',
    ...pathProps
  });

  t.equal(model.rowStorageByteLength, 72, 'default row storage does not allocate origins per row');
  t.equal(model.pathRangeByteLength, 32, 'path ranges account for per-row storage separately');

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

test('ArrowStorageTripsPathModel binds prepared path-aligned timestamps', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const sourceVectors = {
    ...makeArrowPathSourceVectors(),
    timestamps: makeTemporalListVector(
      new arrow.TimestampMillisecond(),
      new BigInt64Array([1000n, 1010n, 1025n, 2000n, 2010n, 2020n, 2030n]),
      new Int32Array([0, 3, 7])
    )
  };
  const prepared = await ArrowStoragePathModel.prepareGPUVectors(device, sourceVectors);
  const model = new ArrowStorageTripsPathModel(device, {
    ...prepared.storagePathProps,
    timestamps: prepared.timestamps!,
    currentTime: 25,
    trailLength: 10
  });
  const bindings = (model as any)._getBindings();

  t.ok(bindings.pathTimestamps, 'binds the prepared temporal path stream');
  t.ok(bindings.tripPathConfig, 'binds Trips-style temporal uniforms');
  t.equal(model.segmentCount, 5, 'reuses the storage-backed path segment layout');

  model.destroy();
  prepared.destroy();
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
    value: 40,
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
      60,
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

async function makeGpuArrowPathProps(device: Device): Promise<PreparedArrowPathGPUVectors> {
  const sourceVectors = makeArrowPathSourceVectors();
  return ArrowPathModel.prepareGPUVectors(device, sourceVectors);
}

function makeStorageGpuArrowPathProps(
  device: Device,
  sourceVectors: ArrowPathSourceVectors = makeArrowPathSourceVectors()
) {
  return {
    paths: makeGpuArrowPathVector(device, 'paths', sourceVectors.paths),
    colors: makeGpuArrowPathVector(device, 'colors', sourceVectors.colors),
    widths: makeGpuArrowPathVector(device, 'widths', sourceVectors.widths)
  };
}

function makeGpuArrowPathVector<TypeT extends arrow.DataType>(
  device: Device,
  name: string,
  vector: arrow.Vector<TypeT>
): GPUVector<TypeT> {
  return makeArrowGPUVector(device, vector, {name});
}

function destroyStorageGpuArrowPathProps(
  pathProps: ReturnType<typeof makeStorageGpuArrowPathProps>
): void {
  pathProps.paths.destroy();
  pathProps.colors.destroy();
  pathProps.widths.destroy();
}

function makeLegacyStoragePathShaderLayout(): ShaderLayout {
  return {
    attributes: [
      {name: 'segmentStartPointIndices', location: 0, type: 'u32', stepMode: 'instance'},
      {name: 'segmentEndPointIndices', location: 1, type: 'u32', stepMode: 'instance'},
      {name: 'segmentPreviousPointIndices', location: 2, type: 'u32', stepMode: 'instance'},
      {name: 'segmentNextPointIndices', location: 3, type: 'u32', stepMode: 'instance'},
      {name: 'segmentFlags', location: 4, type: 'u32', stepMode: 'instance'},
      {name: 'rowIndices', location: 5, type: 'u32', stepMode: 'instance'}
    ],
    bindings: []
  };
}

function deriveLegacyStoragePathRecord(
  compactPathWords: Uint32Array,
  segmentIndex: number,
  pathOffsets: Int32Array
): number[] {
  const PATH_SEGMENT_FIRST = 1;
  const PATH_SEGMENT_LAST = 2;
  const PATH_SEGMENT_CLOSED = 4;
  const compactRecordOffset = segmentIndex * 3;
  const segmentStartPointIndex = compactPathWords[compactRecordOffset] ?? 0;
  const segmentFlags = compactPathWords[compactRecordOffset + 1] ?? 0;
  const rowIndex = compactPathWords[compactRecordOffset + 2] ?? 0;
  const segmentEndPointIndex = segmentStartPointIndex + 1;
  const pathStart = pathOffsets[rowIndex] ?? 0;
  const pathEnd = pathOffsets[rowIndex + 1] ?? pathStart;
  const isFirst = (segmentFlags & PATH_SEGMENT_FIRST) !== 0;
  const isLast = (segmentFlags & PATH_SEGMENT_LAST) !== 0;
  const isClosed = (segmentFlags & PATH_SEGMENT_CLOSED) !== 0;
  const segmentPreviousPointIndex = isFirst
    ? isClosed
      ? pathEnd - 2
      : segmentStartPointIndex
    : Math.max(pathStart, segmentStartPointIndex - 1);
  const segmentNextPointIndex = isLast
    ? isClosed
      ? pathStart + 1
      : segmentEndPointIndex
    : segmentEndPointIndex + 1;
  return [
    segmentStartPointIndex,
    segmentEndPointIndex,
    segmentPreviousPointIndex,
    segmentNextPointIndex,
    segmentFlags,
    rowIndex
  ];
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
  dimension: number = 2
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

function makeFloat64PathVector(
  valueOffsets: Int32Array,
  values: Float64Array,
  dimension: number = 2
): arrow.Vector<Float64PathArrowType> {
  const coordinateType = new arrow.FixedSizeList(
    dimension,
    new arrow.Field('values', new arrow.Float64(), false)
  );
  const pathType = new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as Float64PathArrowType;
  const coordinateValueData = new arrow.Data<arrow.Float64>(
    new arrow.Float64(),
    0,
    values.length,
    0,
    {[arrow.BufferType.DATA]: values}
  );
  const coordinateData = new arrow.Data<arrow.FixedSizeList<arrow.Float64>>(
    coordinateType,
    0,
    values.length / dimension,
    0,
    {},
    [coordinateValueData]
  );
  const pathData = new arrow.Data<Float64PathArrowType>(
    pathType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
  return new arrow.Vector<Float64PathArrowType>([pathData]);
}

function makeColorListVector(
  valueOffsets: Int32Array,
  values: Uint8Array
): arrow.Vector<ColorListArrowType> {
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const pathColorType = new arrow.List(
    new arrow.Field('colors', colorType, false)
  ) as ColorListArrowType;
  const colorValueData = new arrow.Data<arrow.Uint8>(new arrow.Uint8(), 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const colorData = new arrow.Data<arrow.FixedSizeList<arrow.Uint8>>(
    colorType,
    0,
    values.length / 4,
    0,
    {},
    [colorValueData]
  );
  const pathColorData = new arrow.Data<ColorListArrowType>(
    pathColorType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [colorData]
  );
  return new arrow.Vector<ColorListArrowType>([pathColorData]);
}

function makeTemporalListVector<
  T extends arrow.Date_ | arrow.Time | arrow.Timestamp | arrow.Duration
>(
  childType: T,
  values: Int32Array | BigInt64Array,
  valueOffsets: Int32Array
): arrow.Vector<arrow.List<T>> {
  const childData = arrow.makeData({
    type: childType,
    length: values.length,
    data: values
  }) as arrow.Data<T>;
  const listType = new arrow.List(new arrow.Field('values', childType, false));
  const listData = arrow.makeData({
    type: listType,
    length: valueOffsets.length - 1,
    nullCount: 0,
    nullBitmap: null,
    valueOffsets,
    child: childData
  }) as arrow.Data<arrow.List<T>>;
  return new arrow.Vector([listData]);
}

function getPathOffsets(vector: arrow.Vector<PathArrowType>): Int32Array {
  return vector.data[0]!.valueOffsets as Int32Array;
}

function getPathValues(vector: arrow.Vector<PathArrowType>): Float32Array {
  const coordinateData = vector.data[0]!.children[0]!;
  const valueData = coordinateData.children[0] as arrow.Data<arrow.Float32>;
  return valueData.values as Float32Array;
}

function getFixedSizeListValues(vector: arrow.Vector): Uint8Array {
  const childData = vector.data[0]!.children[0] as arrow.Data<arrow.Uint8>;
  return childData.values as Uint8Array;
}

function makeOriginRelativeModelViewMatrix(sourceOrigin: number[]): number[] {
  const scaleX = 0.5;
  const scaleY = -0.25;
  const scaleZ = 2;
  const originView = [12.5, -7.25, 3.75];
  return [
    scaleX,
    0,
    0,
    0,
    0,
    scaleY,
    0,
    0,
    0,
    0,
    scaleZ,
    0,
    originView[0] - scaleX * (sourceOrigin[0] ?? 0),
    originView[1] - scaleY * (sourceOrigin[1] ?? 0),
    originView[2] - scaleZ * (sourceOrigin[2] ?? 0),
    1
  ];
}

function transformPoint(modelViewMatrix: readonly number[], point: readonly number[]): number[] {
  return [
    (modelViewMatrix[0] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[4] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[8] ?? 0) * (point[2] ?? 0) +
      (modelViewMatrix[12] ?? 0),
    (modelViewMatrix[1] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[5] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[9] ?? 0) * (point[2] ?? 0) +
      (modelViewMatrix[13] ?? 0),
    (modelViewMatrix[2] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[6] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[10] ?? 0) * (point[2] ?? 0) +
      (modelViewMatrix[14] ?? 0),
    0
  ];
}

function transformVector(modelViewMatrix: readonly number[], point: readonly number[]): number[] {
  return [
    (modelViewMatrix[0] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[4] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[8] ?? 0) * (point[2] ?? 0),
    (modelViewMatrix[1] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[5] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[9] ?? 0) * (point[2] ?? 0),
    (modelViewMatrix[2] ?? 0) * (point[0] ?? 0) +
      (modelViewMatrix[6] ?? 0) * (point[1] ?? 0) +
      (modelViewMatrix[10] ?? 0) * (point[2] ?? 0),
    0
  ];
}

function addVectors(left: readonly number[], right: readonly number[]): number[] {
  return [
    (left[0] ?? 0) + (right[0] ?? 0),
    (left[1] ?? 0) + (right[1] ?? 0),
    (left[2] ?? 0) + (right[2] ?? 0),
    (left[3] ?? 0) + (right[3] ?? 0)
  ];
}

function packColor(color: readonly number[]): number {
  return (
    ((color[0] ?? 255) |
      ((color[1] ?? 255) << 8) |
      ((color[2] ?? 255) << 16) |
      ((color[3] ?? 255) << 24)) >>>
    0
  );
}

function assertApproxArray(
  t: {ok: (value: boolean, message?: string) => void},
  actual: readonly number[],
  expected: readonly number[],
  epsilon: number,
  label: string
): void {
  t.ok(
    actual.every((value, index) => Math.abs(value - (expected[index] ?? 0)) <= epsilon),
    `${label}: ${actual.join(', ')} ~= ${expected.join(', ')}`
  );
}
