// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  buildArrowPathSegmentTable,
  makeArrowFixedSizeListVector,
  makePathAttributeModelProps,
  makeGPUVectorFromArrow,
  convertArrowPathToGPUVectors,
  convertArrowPathStorageToGPUVectors,
  readArrowGPUVectorAsync,
  resolveArrowPathSourceVectors,
  type ArrowPathSourceVectors,
  type PreparedArrowPathGPUVectors
} from '@luma.gl/arrow';
import type {Device, RenderPass, ShaderLayout} from '@luma.gl/core';
import {type GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  PathAttributeModel,
  PathStorageModel,
  PathTripsStorageModel,
  createPathStorageState
} from '@luma.gl/experimental/models';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;
type Float64PathArrowType = arrow.List<arrow.FixedSizeList<arrow.Float64>>;
type ColorListArrowType = arrow.List<arrow.FixedSizeList<arrow.Uint8>>;

it('Arrow path-family models declare prepared GPU input schemas', () => {
  expect(
    PathAttributeModel.gpuInputSchema,
    'attribute paths declare prepared renderer inputs'
  ).toEqual([
    {
      columnName: 'paths',
      kind: 'positions',
      required: true,
      formats: ['vertex-list<float32x2>', 'vertex-list<float32x3>', 'vertex-list<float32x4>']
    },
    {
      columnName: 'colors',
      kind: 'colors',
      required: false,
      formats: ['unorm8x4', 'vertex-list<unorm8x4>']
    },
    {
      columnName: 'widths',
      kind: 'scalars',
      required: false,
      formats: ['float32']
    },
    {
      columnName: 'viewOrigins',
      kind: 'positions',
      required: false,
      formats: ['float32x4'],
      internal: true
    }
  ]);
  expect(PathStorageModel.gpuInputSchema, 'storage paths add optional prepared timestamps').toEqual(
    [
      ...PathAttributeModel.gpuInputSchema.slice(0, 3),
      {
        columnName: 'timestamps',
        kind: 'time',
        required: false,
        formats: ['vertex-list<float32>']
      },
      PathAttributeModel.gpuInputSchema[3]
    ]
  );
  expect(
    PathTripsStorageModel.gpuInputSchema,
    'Trips storage paths require prepared timestamps'
  ).toEqual([
    ...PathAttributeModel.gpuInputSchema.slice(0, 3),
    {
      columnName: 'timestamps',
      kind: 'time',
      required: true,
      formats: ['vertex-list<float32>']
    },
    PathAttributeModel.gpuInputSchema[3]
  ]);
  expect(PathAttributeModel.gpuInputSchema, 'attribute model retains its schema reference').toBe(
    PathAttributeModel.gpuInputSchema
  );
  expect(PathStorageModel.gpuInputSchema, 'storage model retains its schema reference').toBe(
    PathStorageModel.gpuInputSchema
  );
  expect(PathTripsStorageModel.gpuInputSchema, 'Trips model retains its schema reference').toBe(
    PathTripsStorageModel.gpuInputSchema
  );
  void 0;
});

it('resolveArrowPathSourceVectors maps same-name Table and RecordBatch columns', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const table = new arrow.Table(sourceVectors);
  const resolvedFromTable = resolveArrowPathSourceVectors(PathAttributeModel, {data: table});
  const resolvedFromRecordBatch = resolveArrowPathSourceVectors(PathAttributeModel, {
    data: table.batches[0]!
  });

  assertPathVectorEqual(resolvedFromTable.paths, sourceVectors.paths, 'Table paths');
  assertPathVectorEqual(resolvedFromRecordBatch.paths, sourceVectors.paths, 'RecordBatch paths');
  expect(
    Array.from(getFixedSizeListValues(resolvedFromTable.colors!)),
    'same-name colors resolve from Table'
  ).toEqual(Array.from(getFixedSizeListValues(sourceVectors.colors)));
  expect(
    Array.from(resolvedFromTable.widths!.data[0]!.values as Float32Array),
    'same-name widths resolve from Table'
  ).toEqual(Array.from(sourceVectors.widths.data[0]!.values as Float32Array));
  void 0;
});

it('resolveArrowPathSourceVectors maps nested string selectors', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const table = makeNestedArrowPathTable('source', sourceVectors);
  const resolved = resolveArrowPathSourceVectors(PathAttributeModel, {
    data: table,
    selectors: {
      paths: 'source.paths',
      colors: 'source.colors',
      widths: 'source.widths'
    }
  });

  assertPathVectorEqual(resolved.paths, sourceVectors.paths, 'nested paths');
  expect(
    Array.from(getFixedSizeListValues(resolved.colors!)),
    'nested colors resolve from explicit path'
  ).toEqual(Array.from(getFixedSizeListValues(sourceVectors.colors)));
  void 0;
});

it('resolveArrowPathSourceVectors supports direct vectors and optional disable', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const resolved = resolveArrowPathSourceVectors(PathStorageModel, {
    selectors: {
      paths: sourceVectors.paths,
      colors: null,
      widths: sourceVectors.widths
    }
  });

  expect(resolved.paths, 'direct paths do not require a Table').toBe(sourceVectors.paths);
  expect(resolved.colors, 'null disables optional colors').toBe(undefined);
  expect(resolved.widths, 'direct widths do not require a Table').toBe(sourceVectors.widths);
  expect(resolved.timestamps, 'omitted optional timestamps are skipped').toBe(undefined);
  void 0;
});

it('resolveArrowPathSourceVectors rejects internal input selectors', () => {
  const sourceVectors = makeArrowPathSourceVectors();

  expect(
    () =>
      resolveArrowPathSourceVectors(PathAttributeModel, {
        selectors: {
          paths: sourceVectors.paths,
          viewOrigins: sourceVectors.paths
        } as never
      }),
    'internal inputs are unavailable to source mapping'
  ).toThrow(/source selector "viewOrigins" is not declared as source-mappable/);
  void 0;
});

it('resolveArrowPathSourceVectors skips missing optional columns and rejects missing required columns', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const pathsOnlyTable = new arrow.Table({paths: sourceVectors.paths});
  const resolved = resolveArrowPathSourceVectors(PathAttributeModel, {data: pathsOnlyTable});

  expect(resolved.colors, 'missing optional colors are skipped').toBe(undefined);
  expect(resolved.widths, 'missing optional widths are skipped').toBe(undefined);
  expect(
    () =>
      resolveArrowPathSourceVectors(PathAttributeModel, {
        data: new arrow.Table({colors: sourceVectors.colors, widths: sourceVectors.widths})
      }),
    'missing required paths throw'
  ).toThrow(/source column "paths" for "paths" is missing/);
  void 0;
});

it('resolveArrowPathSourceVectors requires Trips timestamps', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const timestamps = makeTemporalListVector(
    new arrow.TimestampMillisecond(),
    new BigInt64Array([1000n, 1010n, 1025n, 2000n, 2010n, 2020n, 2030n]),
    new Int32Array([0, 3, 7])
  );

  expect(
    () =>
      resolveArrowPathSourceVectors(PathTripsStorageModel, {
        data: new arrow.Table(sourceVectors)
      }),
    'Trips source mapping requires timestamps'
  ).toThrow(/source column "timestamps" for "timestamps" is missing/);
  const resolved = resolveArrowPathSourceVectors(PathTripsStorageModel, {
    data: new arrow.Table({...sourceVectors, timestamps})
  });
  expect(resolved.timestamps?.length, 'Trips timestamps resolve by default').toBe(
    timestamps.length
  );
  void 0;
});

it('buildArrowPathSegmentTable expands path rows and repeats row styles', () => {
  const sourceVectors = makeArrowPathSourceVectors();
  const result = buildArrowPathSegmentTable({
    rowTable: new arrow.Table({
      colors: sourceVectors.colors,
      widths: sourceVectors.widths
    }),
    paths: sourceVectors.paths
  });

  expect(result.table.numRows, 'emits one Arrow row per generated segment').toBe(5);
  expect(result.segmentLayout.startIndices, 'retains path segment offsets').toEqual([0, 2, 5]);
  expect(
    Array.from(result.segmentLayout.segmentStartPositions),
    'segment starts preserve open and closed path order'
  ).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 1, 0, 0]);
  expect(
    Array.from(result.segmentLayout.segmentEndPositions),
    'segment ends preserve the source path edge order'
  ).toEqual([1, 0, 0, 0, 1, 1, 0, 0, 3, 0, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0]);
  expect(
    Array.from(result.segmentLayout.segmentPreviousPositions),
    'previous positions preserve open caps and closed joins'
  ).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]);
  expect(
    Array.from(result.segmentLayout.segmentNextPositions),
    'next positions preserve open caps and closed joins'
  ).toEqual([1, 1, 0, 0, 1, 1, 0, 0, 3, 1, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]);
  expect(
    Array.from(result.segmentLayout.segmentFlags),
    'segment flags identify first, last, and closed rows'
  ).toEqual([1, 2, 5, 4, 6]);
  expect(
    Array.from(result.segmentLayout.segmentStartColors),
    'generated segment starts retain row colors'
  ).toEqual([
    packColor([255, 0, 0, 255]),
    packColor([255, 0, 0, 255]),
    packColor([0, 255, 0, 255]),
    packColor([0, 255, 0, 255]),
    packColor([0, 255, 0, 255])
  ]);
  expect(
    Array.from(result.segmentLayout.segmentEndColors),
    'generated segment ends retain row colors'
  ).toEqual([
    packColor([255, 0, 0, 255]),
    packColor([255, 0, 0, 255]),
    packColor([0, 255, 0, 255]),
    packColor([0, 255, 0, 255]),
    packColor([0, 255, 0, 255])
  ]);
  expect(
    Array.from(getFixedSizeListValues(result.table.getChild('colors')!)),
    'RGBA row styles repeat across generated segments'
  ).toEqual([255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255]);
  expect(
    Array.from(result.table.getChild('widths')!.data[0]!.values as Float32Array),
    'scalar row styles repeat across generated segments'
  ).toEqual([2, 2, 4, 4, 4]);
  expect(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    'generated rows retain source path row indices'
  ).toEqual([0, 0, 1, 1, 1]);
  void 0;
});

it('buildArrowPathSegmentTable expands path-aligned color lists', () => {
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

  expect(
    Array.from(result.segmentLayout.segmentStartColors),
    'segment start colors use each segment start vertex'
  ).toEqual([
    packColor([255, 0, 0, 255]),
    packColor([255, 128, 0, 255]),
    packColor([0, 255, 0, 255]),
    packColor([0, 255, 255, 255]),
    packColor([0, 0, 255, 255])
  ]);
  expect(
    Array.from(result.segmentLayout.segmentEndColors),
    'segment end colors use each segment end vertex'
  ).toEqual([
    packColor([255, 128, 0, 255]),
    packColor([255, 255, 0, 255]),
    packColor([0, 255, 255, 255]),
    packColor([0, 0, 255, 255]),
    packColor([255, 0, 255, 255])
  ]);

  void 0;
});

it('buildArrowPathSegmentTable preserves XYZ and XYZM coordinate lanes', () => {
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

    expect(
      Array.from(result.segmentLayout.segmentStartPositions.subarray(0, 4)),
      `vec${dimension} starts preserve source coordinate lanes`
    ).toEqual(dimension === 3 ? [0, 1, 2, 0] : [0, 1, 2, 3]);
    expect(
      Array.from(result.segmentLayout.segmentEndPositions.subarray(0, 4)),
      `vec${dimension} ends preserve source coordinate lanes`
    ).toEqual(dimension === 3 ? [3, 4, 5, 0] : [4, 5, 6, 7]);
  }

  void 0;
});

it('PathAttributeModel derives from GPUTableModel and packs generated segment records', async () => {
  const device = new NullDevice({});
  const pathProps = await makeGpuArrowPathProps(device);
  const model = new PathAttributeModel(
    device,
    makePathAttributeModelProps(device, {
      id: 'arrow-path-model-test',
      ...pathProps
    })
  );
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

  expect(model.instanceCount, 'instance count uses generated segment rows').toBe(5);
  expect(model.segmentLayout.startIndices, 'model exposes segment offsets').toEqual([0, 2, 5]);
  expect(expandedPathLayout?.byteStride, 'expanded segment records use an 80-byte stride').toBe(80);
  expect(pathViewOriginLayout?.byteStride, 'view-origin records use a 16-byte stride').toBe(16);
  expect(
    expandedPathLayout?.attributes,
    'default generated vertex data exposes segment endpoints and packed colors'
  ).toEqual([
    {attribute: 'segmentStartPositions', format: 'float32x4', byteOffset: 0},
    {attribute: 'segmentEndPositions', format: 'float32x4', byteOffset: 16},
    {attribute: 'segmentStartColors', format: 'uint32', byteOffset: 72},
    {attribute: 'segmentEndColors', format: 'uint32', byteOffset: 76}
  ]);
  expect(
    Array.from(firstSegmentPositions),
    'packed record stores start, end, previous, and next positions'
  ).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0]);
  expect(
    Array.from(firstSegmentMetadata),
    'packed record stores generated flags and source row index'
  ).toEqual([1, 0]);
  expect(
    Array.from(firstSegmentColors),
    'packed record stores generated segment endpoint colors'
  ).toEqual([packColor([255, 0, 0, 255]), packColor([255, 0, 0, 255])]);

  model.destroy();
  pathProps.destroy();
  void 0;
});

it('PathAttributeModel requires prepared path state', () => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowPathSourceVectors();
  const paths = makeGpuArrowPathVector(device, 'paths', sourceVectors.paths);

  expect(
    () =>
      new PathAttributeModel(
        device,
        makePathAttributeModelProps(device, {
          id: 'arrow-path-model-missing-sources-test',
          paths
        } as never)
      ),
    'prepared path state is visible at the path model boundary'
  ).toThrow(/pathState/);

  paths.destroy();
  void 0;
});

it('PathAttributeModel validates prepared inputs by GPUVector.format', async () => {
  const device = new NullDevice({});
  const pathProps = await makeGpuArrowPathProps(device);
  const sourceVectors = makeArrowPathSourceVectors();
  const invalidColors = makeGpuArrowPathVector(
    device,
    'invalid-colors',
    sourceVectors.colors,
    'float32x4'
  );

  expect(
    () =>
      new PathAttributeModel(
        device,
        makePathAttributeModelProps(device, {
          id: 'arrow-path-model-invalid-color-format-test',
          ...pathProps,
          colors: invalidColors as unknown as NonNullable<PreparedArrowPathGPUVectors['colors']>
        })
      ),
    'prepared color validation rejects a valid Arrow color vector with the wrong GPU format'
  ).toThrow(/colors GPUVector\.format "float32x4" must be one of unorm8x4, vertex-list<unorm8x4>/);

  invalidColors.destroy();
  pathProps.destroy();
  void 0;
});

it('PathAttributeModel rejects prepared state row mismatches', async () => {
  const device = new NullDevice({});
  const pathProps = await makeGpuArrowPathProps(device);
  const sourceVectors = makeArrowPathSourceVectors();
  const mismatchedPaths = makeGpuArrowPathVector(device, 'paths', sourceVectors.paths.slice(0, 1));

  expect(
    () =>
      new PathAttributeModel(
        device,
        makePathAttributeModelProps(device, {
          id: 'arrow-path-model-source-batch-alignment-test',
          ...pathProps,
          colors: undefined,
          widths: undefined,
          paths: mismatchedPaths
        })
      ),
    'prepared state rows stay aligned with path GPU rows'
  ).toThrow(/prepared path rows must match path GPU rows/);

  mismatchedPaths.destroy();
  pathProps.destroy();
  void 0;
});

it('PathAttributeModel splits generated path buffers by source-row boundaries', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 300});
  const pathProps = await makeGpuArrowPathProps(device);
  const model = new PathAttributeModel(
    device,
    makePathAttributeModelProps(device, {
      id: 'arrow-path-model-buffer-batching-test',
      ...pathProps
    })
  );

  expect(model.renderBatches.length, 'generated path output splits into two render batches').toBe(
    2
  );
  expect(
    model.renderBatches.map(batch => batch.segmentCount),
    'batching preserves whole source-path rows'
  ).toEqual([2, 3]);
  expect(model.instanceCount, 'aggregate segment count remains unchanged').toBe(5);

  model.destroy();
  pathProps.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors keeps Float32 paths unchanged without closure', async () => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowPathSourceVectors();
  const prepared = await convertArrowPathToGPUVectors(device, sourceVectors);
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  expect(prepared.sourceOrigins, 'Float32 conversion does not create source origins').toBe(
    undefined
  );
  expect(prepared.paths.format, 'path coordinates use vertex-list format').toBe(
    'vertex-list<float32x2>'
  );
  expect(prepared.colors?.format, 'row colors use normalized RGBA8 format').toBe('unorm8x4');
  expect(prepared.viewOrigins, 'Float32 conversion does not create view-origin vectors').toBe(
    undefined
  );
  expect(
    Array.from(getPathValues(preparedPaths)),
    'Float32 coordinate payload is uploaded unchanged'
  ).toEqual(Array.from(getPathValues(sourceVectors.paths)));
  expect(Array.from(getPathOffsets(preparedPaths)), 'Float32 path offsets are preserved').toEqual(
    Array.from(getPathOffsets(sourceVectors.paths))
  );

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors tags path-aligned vertex colors', async () => {
  const device = new NullDevice({});
  const sourceVectors = makeArrowPathSourceVectors();
  const prepared = await convertArrowPathToGPUVectors(device, {
    ...sourceVectors,
    colors: makeColorListVector(
      new Int32Array([0, 3, 7]),
      new Uint8Array([
        255, 0, 0, 255, 255, 128, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0, 0,
        255, 255, 255, 0, 255, 255
      ])
    )
  });

  expect(
    prepared.colors?.format,
    'path-aligned colors use vertex-list normalized RGBA8 format'
  ).toBe('vertex-list<unorm8x4>');

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors converts Float64 paths to per-row Float32 deltas', async () => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3, 5]),
    new Float64Array([
      1_000_000_000, -1_000_000_000, 1_000_000_000.5, -999_999_999.75, 1_000_000_002, -999_999_997,
      20_000_000_000, 10, 19_999_999_999.75, 10.75
    ])
  );
  const prepared = await convertArrowPathToGPUVectors(device, {paths});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  expect(
    Array.from(getPathValues(preparedPaths)),
    'Float64 coordinates become Float32 deltas from each path origin'
  ).toEqual([0, 0, 0.5, 0.25, 2, 3, 0, 0, -0.25, 0.75]);
  expect(
    Array.from(prepared.sourceOrigins || []),
    'per-row Float64 origins are retained on CPU'
  ).toEqual([1_000_000_000, -1_000_000_000, 0, 0, 20_000_000_000, 10, 0, 0]);
  expect(Boolean(prepared.viewOrigins), 'Float64 conversion creates view-origin GPU storage').toBe(
    true
  );

  prepared.destroy();
  void 0;
});

it('convertArrowPathStorageToGPUVectors converts Float64 paths to per-row Float32 deltas on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const paths = makeFloat64PathVector(
    new Int32Array([0, 3, 5]),
    new Float64Array([
      1_000_000_000, -1_000_000_000, 1_000_000_000.5, -999_999_999.75, 1_000_000_002, -999_999_997,
      20_000_000_000, 10, 19_999_999_999.75, 10.75
    ])
  );
  const prepared = await convertArrowPathStorageToGPUVectors(device, {paths});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  expect(
    Array.from(getPathValues(preparedPaths)),
    'storage conversion converts Float64 coordinates into Float32 deltas on the GPU'
  ).toEqual([0, 0, 0.5, 0.25, 2, 3, 0, 0, -0.25, 0.75]);
  expect(
    Array.from(prepared.sourceOrigins || []),
    'storage conversion retains only compact per-row Float64 origins on CPU'
  ).toEqual([1_000_000_000, -1_000_000_000, 0, 0, 20_000_000_000, 10, 0, 0]);
  expect(Boolean(prepared.viewOrigins), 'storage conversion creates view-origin GPU storage').toBe(
    true
  );

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors closes Float64 delta paths by appending the first delta', async () => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3]),
    new Float64Array([10_000_000, -10_000_000, 10_000_001, -10_000_000, 10_000_001, -9_999_999])
  );
  const closed = arrow.vectorFromArray([true], new arrow.Bool());
  const prepared = await convertArrowPathToGPUVectors(device, {paths, closed});
  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);

  expect(Array.from(getPathOffsets(preparedPaths)), 'closure appends one delta point').toEqual([
    0, 4
  ]);
  expect(
    Array.from(getPathValues(preparedPaths)),
    'the injected closing point is the first delta, usually zero'
  ).toEqual([0, 0, 1, 0, 1, 1, 0, 0]);
  expect(
    Array.from(prepared.sourceOrigins || []),
    'closing delta paths does not change the per-row origin'
  ).toEqual([10_000_000, -10_000_000, 0, 0]);

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors updates view origins without rewriting path deltas', async () => {
  const device = new NullDevice({});
  const paths = makeFloat64PathVector(
    new Int32Array([0, 3]),
    new Float64Array([100, 200, 101, 200, 102, 201])
  );
  const prepared = await convertArrowPathToGPUVectors(device, {paths});
  const pathBytesBefore = await prepared.paths.data[0].buffer.readAsync();
  const deltaSegmentBytesBefore = await prepared.pathState.expandedPathVertexData.readAsync();
  const viewOriginBytesBefore = await prepared.pathState.pathViewOriginData.readAsync();

  prepared.updateViewOrigins({
    modelViewMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 10, 20, 30, 1]
  });

  const pathBytesAfter = await prepared.paths.data[0].buffer.readAsync();
  const deltaSegmentBytesAfter = await prepared.pathState.expandedPathVertexData.readAsync();
  const viewOriginBytesAfter = await prepared.pathState.pathViewOriginData.readAsync();
  const updatedOrigins = new Float32Array(
    viewOriginBytesAfter.buffer,
    viewOriginBytesAfter.byteOffset,
    viewOriginBytesAfter.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  expect(
    Array.from(
      new Uint8Array(pathBytesAfter.buffer, pathBytesAfter.byteOffset, pathBytesAfter.byteLength)
    ),
    'path delta GPU buffer is stable across view updates'
  ).toEqual(
    Array.from(
      new Uint8Array(pathBytesBefore.buffer, pathBytesBefore.byteOffset, pathBytesBefore.byteLength)
    )
  );
  expect(
    Array.from(
      new Uint8Array(
        deltaSegmentBytesAfter.buffer,
        deltaSegmentBytesAfter.byteOffset,
        deltaSegmentBytesAfter.byteLength
      )
    ),
    'expanded delta segment buffer is stable across view updates'
  ).toEqual(
    Array.from(
      new Uint8Array(
        deltaSegmentBytesBefore.buffer,
        deltaSegmentBytesBefore.byteOffset,
        deltaSegmentBytesBefore.byteLength
      )
    )
  );
  expect(
    Array.from(
      new Uint8Array(
        viewOriginBytesAfter.buffer,
        viewOriginBytesAfter.byteOffset,
        viewOriginBytesAfter.byteLength
      )
    ),
    'view-origin buffer is rewritten across view updates'
  ).not.toEqual(
    Array.from(
      new Uint8Array(
        viewOriginBytesBefore.buffer,
        viewOriginBytesBefore.byteOffset,
        viewOriginBytesBefore.byteLength
      )
    )
  );
  expect(
    Array.from(updatedOrigins.subarray(0, 8)),
    'updated view origins repeat once per generated segment'
  ).toEqual([210, 620, 30, 0, 210, 620, 30, 0]);

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors split Float64 transform matches CPU full transform', async () => {
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
  const prepared = await convertArrowPathToGPUVectors(device, {paths});
  const modelViewMatrix = makeOriginRelativeModelViewMatrix(sourceOrigin);

  prepared.updateViewOrigins({modelViewMatrix});

  const preparedPaths = await readArrowGPUVectorAsync(prepared.paths);
  const preparedDeltas = getPathValues(preparedPaths);
  const viewOriginBytes = await prepared.pathState.pathViewOriginData.readAsync();
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
    assertApproxArray(splitTransform, fullTransform, 1e-3, `point ${pointIndex} split transform`);
  }

  prepared.destroy();
  void 0;
});

it('convertArrowPathToGPUVectors rejects unsupported path inputs', async () => {
  const device = new NullDevice({});
  const invalidDimensionPaths = makeFloat64PathVector(
    new Int32Array([0, 1]),
    new Float64Array([0, 0, 0, 0, 0]),
    5
  );
  const sourceVectors = makeArrowPathSourceVectors();
  const mismatchedClosed = arrow.vectorFromArray([true], new arrow.Bool());

  try {
    await convertArrowPathToGPUVectors(device, {paths: invalidDimensionPaths});
    expect(false, 'invalid path dimensions should be rejected').toBe(true);
  } catch (error) {
    expect(
      Boolean(/FixedSizeList<Float32\|Float64>\[2\.\.4\]/.test((error as Error).message)),
      'coordinate dimensions outside 2..4 are rejected'
    ).toBe(true);
  }

  try {
    await convertArrowPathToGPUVectors(device, {
      ...sourceVectors,
      closed: mismatchedClosed
    });
    expect(false, 'closed flag row mismatches should be rejected').toBe(true);
  } catch (error) {
    expect(
      Boolean(/closed rows must match paths rows/.test((error as Error).message)),
      'closed rows must align'
    ).toBe(true);
  }

  void 0;
});

it('PathStorageModel emits indexed compute-generated segment records', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const pathProps = makePathStorageGpuArrowProps(device);
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-generated-segments-test',
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

  expect(model.segmentCount, 'storage expansion emits one generated row per path segment').toBe(5);
  expect(model.pathRangeByteLength, 'storage paths retain one 16-byte path range per row').toBe(32);
  expect(model.pathRecordByteStride, 'default storage path records use three u32 words').toBe(12);
  expect(
    model.generatedRenderBufferByteLength,
    'five generated segment records keep the compact 12-byte indexed stride'
  ).toBe(60);
  expect(compactPathLayout?.byteStride, 'generated storage path records use a 12-byte stride').toBe(
    12
  );
  expect(
    compactPathLayout?.attributes,
    'default storage rendering exposes compact segment records plus source row indices'
  ).toEqual([
    {attribute: 'segmentStartPointIndices', format: 'uint32', byteOffset: 0},
    {attribute: 'segmentFlags', format: 'uint32', byteOffset: 4},
    {attribute: 'rowIndices', format: 'uint32', byteOffset: 8}
  ]);
  expect(
    Array.from(generatedPathWords.subarray(0, 3)),
    'compute output stores start point index, flags, and row index'
  ).toEqual([0, 1, 0]);
  expect(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 3 + 1]),
    'compute output preserves first, last, and closed path flags'
  ).toEqual([1, 2, 5, 4, 6]);
  expect(
    Array.from({length: 5}, (_, segmentIndex) => generatedPathWords[segmentIndex * 3 + 2]),
    'compute output preserves source path row indices'
  ).toEqual([0, 0, 1, 1, 1]);

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathStorageModel skips zero-segment render batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const pathProps = makePathStorageGpuArrowProps(device, {
    paths: makePathVector(new Int32Array([0, 1]), new Float32Array([0, 0]))
  });
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-zero-segments-test',
    ...pathProps
  });

  expect(
    model.renderBatches.map(batch => batch.segmentCount),
    'one-point paths retain a zero-segment render batch'
  ).toEqual([0]);
  expect(
    () => model.draw({} as RenderPass),
    'zero-segment render batches return without issuing a render pass draw'
  ).not.toThrow();

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathStorageModel binds path-aligned vertex colors', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const sourceVectors = makeArrowPathSourceVectors();
  const pathProps = makePathStorageGpuArrowProps(device, {
    ...sourceVectors,
    colors: makeColorListVector(
      new Int32Array([0, 3, 7]),
      new Uint8Array([
        255, 0, 0, 255, 255, 128, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0, 0,
        255, 255, 255, 0, 255, 255
      ])
    )
  });
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-vertex-color-test',
    ...pathProps
  });
  const bindings = (model as any)._getBindings();
  const styleConfigBytes = await model.styleConfigBuffer.readAsync();
  const styleConfigWords = new Uint32Array(
    styleConfigBytes.buffer,
    styleConfigBytes.byteOffset,
    styleConfigBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  expect(
    Boolean(bindings.pathVertexColors),
    'binds a flattened path vertex color storage buffer'
  ).toBe(true);
  expect(styleConfigWords[5], 'row color storage is disabled for color lists').toBe(0);
  expect(styleConfigWords[10], 'vertex color storage is enabled for color lists').toBe(1);

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathStorageModel preserves legacy segment records when requested by shader layout', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const legacyShaderLayout = makeLegacyPathStorageShaderLayout();
  const pathProps = makePathStorageGpuArrowProps(device);
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-legacy-generated-segments-test',
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

  expect(model.pathRecordByteStride, 'legacy shader layouts keep six u32 words').toBe(24);
  expect(
    model.generatedRenderBufferByteLength,
    'legacy segment records keep the 24-byte indexed stride'
  ).toBe(120);
  expect(compactPathLayout?.byteStride, 'legacy buffer layout uses a 24-byte stride').toBe(24);
  expect(
    compactPathLayout?.attributes,
    'legacy storage rendering exposes all precomputed neighbor indices'
  ).toEqual([
    {attribute: 'segmentStartPointIndices', format: 'uint32', byteOffset: 0},
    {attribute: 'segmentEndPointIndices', format: 'uint32', byteOffset: 4},
    {attribute: 'segmentPreviousPointIndices', format: 'uint32', byteOffset: 8},
    {attribute: 'segmentNextPointIndices', format: 'uint32', byteOffset: 12},
    {attribute: 'segmentFlags', format: 'uint32', byteOffset: 16},
    {attribute: 'rowIndices', format: 'uint32', byteOffset: 20}
  ]);
  expect(
    Array.from(generatedPathWords.subarray(0, 6)),
    'legacy compute output stores start, end, previous, next point indices, flags, and row index'
  ).toEqual([0, 1, 0, 2, 1, 0]);

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathStorageModel compact records derive the same neighbors as legacy records', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const legacyShaderLayout = makeLegacyPathStorageShaderLayout();
  const compactPathProps = makePathStorageGpuArrowProps(device);
  const legacyPathProps = makePathStorageGpuArrowProps(device);
  const sourceVectors = makeArrowPathSourceVectors();
  const pathOffsets = getPathOffsets(sourceVectors.paths);
  const compactModel = new PathStorageModel(device, {
    id: 'arrow-path-storage-compact-neighbor-parity-test',
    ...compactPathProps
  });
  const legacyModel = new PathStorageModel(device, {
    id: 'arrow-path-storage-legacy-neighbor-parity-test',
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

  expect(
    Array.from({length: compactModel.segmentCount}, (_, segmentIndex) =>
      deriveLegacyPathStorageRecord(compactPathWords, segmentIndex, pathOffsets)
    ),
    'compact start/flags/row records derive the same open and closed neighbor indices'
  ).toEqual(
    Array.from({length: legacyModel.segmentCount}, (_, segmentIndex) =>
      Array.from(legacyPathWords.subarray(segmentIndex * 6, segmentIndex * 6 + 6))
    )
  );

  compactModel.destroy();
  legacyModel.destroy();
  destroyPathStorageGpuArrowProps(compactPathProps);
  destroyPathStorageGpuArrowProps(legacyPathProps);
  void 0;
});

it('PathStorageModel uses a shared zero origin when view origins are absent', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const pathProps = makePathStorageGpuArrowProps(device);
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-default-origin-test',
    ...pathProps
  });

  expect(model.rowStorageByteLength, 'default row storage does not allocate origins per row').toBe(
    72
  );
  expect(model.pathRangeByteLength, 'path ranges account for per-row storage separately').toBe(32);

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathStorageModel refreshes row styles without rebuilding segment buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const pathProps = makePathStorageGpuArrowProps(device);
  const model = new PathStorageModel(device, {
    id: 'arrow-path-storage-row-style-refresh-test',
    ...pathProps
  });
  const storageState = model.storageState;
  const compactPathVertexData = model.compactPathVertexData;
  const renderBatches = model.renderBatches;
  const styleConfigBuffer = model.styleConfigBuffer;

  model.setProps({color: [255, 0, 0, 255], width: 4});

  expect(model.storageState, 'row-style updates preserve storage state').toBe(storageState);
  expect(model.compactPathVertexData, 'row-style updates preserve generated segment data').toBe(
    compactPathVertexData
  );
  expect(model.renderBatches, 'row-style updates preserve render batches').toBe(renderBatches);
  expect(
    model.styleConfigBuffer,
    'row-style updates refresh the owned storage style config'
  ).not.toBe(styleConfigBuffer);

  model.destroy();
  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('PathTripsStorageModel binds prepared path-aligned timestamps', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
  const prepared = await convertArrowPathStorageToGPUVectors(device, sourceVectors);
  const model = new PathTripsStorageModel(device, {
    ...prepared,
    timestamps: prepared.timestamps!,
    currentTime: 25,
    trailLength: 10
  });
  const bindings = (model as any)._getBindings();

  expect(Boolean(bindings.pathTimestamps), 'binds the prepared temporal path stream').toBe(true);
  expect(Boolean(bindings.tripPathConfig), 'binds Trips-style temporal uniforms').toBe(true);
  expect(model.segmentCount, 'reuses the storage-backed path segment layout').toBe(5);

  model.destroy();
  prepared.destroy();
  void 0;
});

it('PathStorageModel splits compute-generated segment buffers by storage limits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const originalMaxStorageBufferBindingSize = device.limits.maxStorageBufferBindingSize;
  Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
    value: 40,
    configurable: true
  });

  try {
    const pathProps = makePathStorageGpuArrowProps(device);
    const model = new PathStorageModel(device, {
      id: 'arrow-path-storage-buffer-batching-test',
      ...pathProps
    });

    expect(model.storageState.batches.length, 'row bindings retain the source path batch').toBe(1);
    expect(model.renderBatches.length, 'generated path output splits into render batches').toBe(2);
    expect(
      model.renderBatches.map(batch => batch.segmentCount),
      'storage batching preserves whole source-path rows'
    ).toEqual([2, 3]);
    expect(
      model.generatedRenderBufferByteLength,
      'aggregate generated path byte accounting stays exact'
    ).toBe(60);

    model.destroy();
    destroyPathStorageGpuArrowProps(pathProps);
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
      value: originalMaxStorageBufferBindingSize,
      configurable: true
    });
  }
  void 0;
});

it('PathStorageModel rejects non-WebGPU devices', () => {
  const device = new NullDevice({});
  const pathProps = makePathStorageGpuArrowProps(device);

  expect(
    () =>
      new PathStorageModel(device, {
        id: 'arrow-path-storage-model-test',
        ...pathProps
      }),
    'storage path model reports its backend contract'
  ).toThrow(/WebGPU-only/);

  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

it('createPathStorageState rejects non-WebGPU devices', () => {
  const device = new NullDevice({});
  const pathProps = makePathStorageGpuArrowProps(device);

  expect(
    () =>
      createPathStorageState(device, {
        id: 'arrow-path-storage-state-test',
        ...pathProps
      }),
    'storage-state builder reports its backend contract'
  ).toThrow(/WebGPU device/);

  destroyPathStorageGpuArrowProps(pathProps);
  void 0;
});

async function makeGpuArrowPathProps(device: Device): Promise<PreparedArrowPathGPUVectors> {
  const sourceVectors = makeArrowPathSourceVectors();
  return convertArrowPathToGPUVectors(device, sourceVectors);
}

function makePathStorageGpuArrowProps(
  device: Device,
  sourceVectors: ArrowPathSourceVectors = makeArrowPathSourceVectors()
) {
  const colors = sourceVectors.colors
    ? makeGpuArrowPathVector(
        device,
        'colors',
        sourceVectors.colors,
        sourceVectors.colors.type instanceof arrow.List ? 'vertex-list<unorm8x4>' : 'unorm8x4'
      )
    : undefined;
  const widths = sourceVectors.widths
    ? makeGpuArrowPathVector(device, 'widths', sourceVectors.widths, 'float32')
    : undefined;
  return {
    paths: makeGpuArrowPathVector(device, 'paths', sourceVectors.paths, 'vertex-list<float32x2>'),
    ...(colors ? {colors} : {}),
    ...(widths ? {widths} : {})
  };
}

function makeGpuArrowPathVector<FormatT extends GPUVectorFormat, TypeT extends arrow.DataType>(
  device: Device,
  name: string,
  vector: arrow.Vector<TypeT>,
  format: FormatT
): GPUVector<FormatT> {
  return makeGPUVectorFromArrow(device, vector, {name, format});
}

function destroyPathStorageGpuArrowProps(
  pathProps: ReturnType<typeof makePathStorageGpuArrowProps>
): void {
  pathProps.paths.destroy();
  pathProps.colors?.destroy();
  pathProps.widths?.destroy();
}

function makeLegacyPathStorageShaderLayout(): ShaderLayout {
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

function deriveLegacyPathStorageRecord(
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

function makeNestedArrowPathTable(
  fieldName: string,
  sourceVectors: ReturnType<typeof makeArrowPathSourceVectors>
): arrow.Table {
  const table = new arrow.Table(sourceVectors);
  const innerStructData = table.batches[0]!.data;
  const schema = new arrow.Schema([new arrow.Field(fieldName, innerStructData.type)]);
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: table.numRows,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });
  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
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
    {
      [arrow.BufferType.DATA]: values
    }
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
    {
      [arrow.BufferType.DATA]: values
    }
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

function assertPathVectorEqual(
  actual: arrow.Vector,
  expected: arrow.Vector<PathArrowType>,
  label: string
): void {
  const actualPaths = actual as arrow.Vector<PathArrowType>;
  expect(Array.from(getPathOffsets(actualPaths)), `${label} offsets match`).toEqual(
    Array.from(getPathOffsets(expected))
  );
  expect(Array.from(getPathValues(actualPaths)), `${label} values match`).toEqual(
    Array.from(getPathValues(expected))
  );
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
  actual: readonly number[],
  expected: readonly number[],
  epsilon: number,
  label: string
): void {
  expect(
    Boolean(actual.every((value, index) => Math.abs(value - (expected[index] ?? 0)) <= epsilon)),
    `${label}: ${actual.join(', ')} ~= ${expected.join(', ')}`
  ).toBe(true);
}
