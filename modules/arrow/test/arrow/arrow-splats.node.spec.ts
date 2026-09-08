// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeArrowFixedSizeListVector,
  makeGPUSplatDataFromArrow,
  makeGPUSplatDataFromArrowStream,
  type GPUSplatArrowRecordBatchLike,
  type GPUSplatArrowSource,
  type GPUSplatArrowTableLike
} from '@luma.gl/arrow';
import type {GPUSplatData} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

const SPHERICAL_HARMONIC_DC = 0.28209479177387814;
const ENCODING_METADATA_KEY = 'loaders_gl.gaussian_splats.encoding';

type SplatRecordBatchOptions = {
  positions: readonly number[];
  scales?: readonly number[];
  rotations?: readonly number[];
  opacities?: readonly number[];
  colors?: readonly number[];
  sphericalHarmonicCoefficients?: readonly number[];
  higherOrderSphericalHarmonicCoefficients?: readonly number[];
  semanticIds?: readonly number[];
  semanticColumnName?: string;
  scaleEncoding?: 'linear' | 'log';
  scaleEncodings?: readonly ('linear' | 'log' | undefined)[];
  opacityEncoding?: 'linear' | 'logit';
  sourceFormat?: 'ply' | 'spz' | 'rad' | 'ksplat';
  omit?: readonly string[];
};

it('makeGPUSplatDataFromArrow decodes default GraphDECO Gaussian splat encodings', () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({
    positions: [1, 2, 3, 4, 5, 6],
    scales: [Math.log(2), Math.log(3), Math.log(4), Math.log(5), Math.log(6), Math.log(7)],
    rotations: [1, 0, 0, 0, 0, 0, 1, 0],
    opacities: [0, Math.log(3)],
    colors: [255, 0, 128, 10, 20, 30]
  });
  const batches = makeGPUSplatDataFromArrow(device, recordBatch);
  const batch = batches[0];

  expect(batches.length, 'creates one independently owned GPU batch').toBe(1);
  expect(batch?.rowCount, 'preserves the source row count').toBe(2);
  expect(batch?.positions.format, 'declares XYZ position storage').toBe('float32x3');
  expect(batch?.scales.format, 'declares XYZ scale storage').toBe('float32x3');
  expect(batch?.rotations.format, 'declares quaternion storage').toBe('float32x4');
  expect(batch?.colors.format, 'declares linear floating-point RGBA storage').toBe('float32x4');
  expect(batch?.opacities.format, 'declares separate linear opacity storage').toBe('float32');
  expect(batch?.rowIndices.format, 'declares stable global source-row indices').toBe('uint32');
  expect(Array.from(batch?.source.positions ?? []), 'retains XYZ centers').toEqual([
    1, 2, 3, 4, 5, 6
  ]);
  assertApproximatelyEqual(batch?.source.scales, [2, 3, 4, 5, 6, 7], 'decodes log scales');
  expect(
    Array.from(batch?.source.rotations ?? []),
    'preserves [w, x, y, z] quaternion ordering'
  ).toEqual([1, 0, 0, 0, 0, 0, 1, 0]);
  assertApproximatelyEqual(batch?.source.opacities, [0.5, 0.75], 'decodes logit opacity');
  expect(
    Boolean(batch?.source.colors instanceof Float32Array),
    'retains linear floating-point source colors'
  ).toBe(true);
  assertApproximatelyEqual(
    batch?.source.colors,
    [1, 0, 128 / 255, 1, 10 / 255, 20 / 255, 30 / 255, 1],
    'decodes SH DC RGB without quantization or duplicating opacity into color alpha'
  );
  expect(batch?.sourceInfo, 'records stable source metadata').toEqual({
    sourceBatchIndex: 0,
    sourceRowIndexOffset: 0,
    sourceRowCount: 2
  });

  const positionBuffer = batch?.positions.data[0]?.buffer;
  batch?.destroy();
  batch?.destroy();
  expect(
    Boolean(positionBuffer?.destroyed),
    'caller-owned GPU buffer destruction is idempotent'
  ).toBe(true);
  void 0;
});

it('makeGPUSplatDataFromArrow preserves real GraphDECO Train HDR and negative SH DC radiance', async () => {
  const device = new NullDevice({});
  // Unmodified f_dc coefficients from rows 6 and 8 of the Voxel51 Train PLY fixture.
  const sphericalHarmonicCoefficients = [
    2.570492744445801, 2.6299448013305664, 2.5203464031219482, -1.778012752532959,
    -1.7773926258087158, -1.7927855253219604
  ];
  const expectedColors = [
    1.2251226155007027, 1.2418937311081395, 1.2109765937867287, 1, -0.00156813719708504,
    -0.0013932026779361895, -0.005735459460921133, 1
  ];
  const recordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    sphericalHarmonicCoefficients
  });
  const batch = makeGPUSplatDataFromArrow(device, recordBatch)[0]!;

  expect(batch.colors.format, 'retains HDR-compatible GPU color storage').toBe('float32x4');
  assertApproximatelyEqual(
    batch.source.colors,
    expectedColors,
    'preserves highlights above one and negative reconstructed linear radiance'
  );

  const gpuData = batch.colors.data[0]!;
  const bytes = await gpuData.buffer.readAsync(gpuData.byteOffset, gpuData.byteLength);
  const uploadedColors = new Float32Array(bytes.buffer, bytes.byteOffset, batch.rowCount * 4);
  assertApproximatelyEqual(
    uploadedColors,
    expectedColors,
    'uploads unquantized SH DC radiance without clamping or losing precision'
  );

  batch.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow preserves higher spherical harmonics and semantic source rows', async () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    higherOrderSphericalHarmonicCoefficients: [
      1, 2, 3, 10, 20, 30, 100, 200, 300, -1, -2, -3, -10, -20, -30, -100, -200, -300
    ],
    semanticIds: [7, 42]
  });
  const prepared = makeGPUSplatDataFromArrow(device, recordBatch)[0]!;
  const expectedCoefficients = [
    1, 10, 100, 2, 20, 200, 3, 30, 300, -1, -10, -100, -2, -20, -200, -3, -30, -300
  ];

  expect(prepared.sphericalHarmonicsDegree, 'infers complete first-order spherical harmonics').toBe(
    1
  );
  expect(prepared.sphericalHarmonics?.format, 'retains independently owned coefficients').toBe(
    'float32'
  );
  expect(
    Array.from(prepared.source.sphericalHarmonics ?? []),
    'reorders channel-major GraphDECO columns into basis-major RGB source rows'
  ).toEqual(expectedCoefficients);
  expect(
    Array.from(prepared.source.semanticIds ?? []),
    'preserves compact semantic class identifiers'
  ).toEqual([7, 42]);
  const coefficientBytes = await prepared.sphericalHarmonics?.data[0].buffer.readAsync();
  if (coefficientBytes) {
    expect(
      Array.from(
        new Float32Array(
          coefficientBytes.buffer,
          coefficientBytes.byteOffset,
          coefficientBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
        )
      ),
      'uploads directional radiance without collapsing Arrow source boundaries'
    ).toEqual(expectedCoefficients);
  }

  prepared.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow caps higher-order bands and honors explicit semantic columns', () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0],
    higherOrderSphericalHarmonicCoefficients: Array.from(
      {length: 24},
      (_, coefficientIndex) => coefficientIndex + 1
    ),
    semanticIds: [13],
    semanticColumnName: 'custom_category'
  });
  const prepared = makeGPUSplatDataFromArrow(device, recordBatch, {
    maxSphericalHarmonicsDegree: 1,
    semanticColumn: 'custom_category'
  })[0]!;

  expect(prepared.sphericalHarmonicsDegree, 'caps second-order source coefficients on upload').toBe(
    1
  );
  expect(
    Array.from(prepared.source.sphericalHarmonics ?? []),
    'retains first-order RGB basis triples from each original channel block'
  ).toEqual([1, 9, 17, 2, 10, 18, 3, 11, 19]);
  expect(
    Array.from(prepared.source.semanticIds ?? []),
    'reads an explicitly named semantic class column'
  ).toEqual([13]);

  const dcOnly = makeGPUSplatDataFromArrow(device, recordBatch, {
    maxSphericalHarmonicsDegree: 0
  })[0]!;
  expect(dcOnly.sphericalHarmonicsDegree, 'supports an explicit DC-only memory budget').toBe(0);
  expect(
    Boolean(dcOnly.sphericalHarmonics),
    'avoids allocating excluded higher-order coefficients'
  ).toBe(false);

  prepared.destroy();
  dcOnly.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow preserves basis-major RGB coefficients from RAD and SPZ', () => {
  const device = new NullDevice({});
  const sourceCoefficients = [
    1, 10, 100, 2, 20, 200, 3, 30, 300, 4, 40, 400, 5, 50, 500, 6, 60, 600, 7, 70, 700, 8, 80, 800
  ];

  for (const sourceFormat of ['rad', 'spz'] as const) {
    const recordBatch = makeSplatRecordBatch({
      positions: [0, 0, 0],
      higherOrderSphericalHarmonicCoefficients: sourceCoefficients,
      sourceFormat
    });
    const prepared = makeGPUSplatDataFromArrow(device, recordBatch)[0]!;
    const firstDegree = makeGPUSplatDataFromArrow(device, recordBatch, {
      maxSphericalHarmonicsDegree: 1
    })[0]!;

    expect(
      Array.from(prepared.source.sphericalHarmonics!),
      `preserves native basis-major RGB ordering for ${sourceFormat.toUpperCase()} sources`
    ).toEqual(sourceCoefficients);
    expect(
      Array.from(firstDegree.source.sphericalHarmonics!),
      `caps ${sourceFormat.toUpperCase()} bands without scrambling the retained RGB triplets`
    ).toEqual(sourceCoefficients.slice(0, 9));
    prepared.destroy();
    firstDegree.destroy();
  }
  void 0;
});

it('makeGPUSplatDataFromArrow safely caps valid degree-four SPZ coefficients', () => {
  const device = new NullDevice({});
  const sourceCoefficients = Array.from(
    {length: 72},
    (_, coefficientIndex) => coefficientIndex + 1
  );
  const recordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0],
    higherOrderSphericalHarmonicCoefficients: sourceCoefficients,
    sourceFormat: 'spz'
  });

  const supportedBands = makeGPUSplatDataFromArrow(device, recordBatch)[0]!;
  const requestedBands = makeGPUSplatDataFromArrow(device, recordBatch, {
    maxSphericalHarmonicsDegree: 2
  })[0]!;

  expect(
    supportedBands.sphericalHarmonicsDegree,
    'caps valid degree-four SPZ at degree three'
  ).toBe(3);
  expect(
    Array.from(supportedBands.source.sphericalHarmonics!),
    'retains all supported RGB basis coefficients without scrambling the native source layout'
  ).toEqual(sourceCoefficients.slice(0, 45));
  expect(
    requestedBands.sphericalHarmonicsDegree,
    'honors a narrower caller-selected band cap'
  ).toBe(2);
  expect(
    Array.from(requestedBands.source.sphericalHarmonics!),
    'drops unsupported and unrequested higher-order SPZ coefficients'
  ).toEqual(sourceCoefficients.slice(0, 24));

  supportedBands.destroy();
  requestedBands.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow normalizes band-major KSPLAT spherical harmonics', () => {
  const device = new NullDevice({});
  const sourceCoefficients = [
    1, 2, 3, 10, 20, 30, 100, 200, 300, 4, 5, 6, 7, 8, 40, 50, 60, 70, 80, 400, 500, 600, 700, 800
  ];
  const expectedCoefficients = [
    1, 10, 100, 2, 20, 200, 3, 30, 300, 4, 40, 400, 5, 50, 500, 6, 60, 600, 7, 70, 700, 8, 80, 800
  ];
  const recordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0],
    higherOrderSphericalHarmonicCoefficients: sourceCoefficients,
    sourceFormat: 'ksplat'
  });

  const prepared = makeGPUSplatDataFromArrow(device, recordBatch)[0]!;
  const firstDegree = makeGPUSplatDataFromArrow(device, recordBatch, {
    maxSphericalHarmonicsDegree: 1
  })[0]!;

  expect(prepared.sphericalHarmonicsDegree, 'preserves both authored KSPLAT bands').toBe(2);
  expect(
    Array.from(prepared.source.sphericalHarmonics!),
    'reorders each source band from channel-major components into RGB basis triplets'
  ).toEqual(expectedCoefficients);
  expect(
    Array.from(firstDegree.source.sphericalHarmonics!),
    'caps the source without interpreting its first band as global channel-major coefficients'
  ).toEqual(expectedCoefficients.slice(0, 9));

  prepared.destroy();
  firstDegree.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow rejects nullable semantic identifiers', () => {
  const device = new NullDevice({});
  const source = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    semanticIds: [7, 0]
  });
  const semanticIds = arrow.vectorFromArray([7, null], new arrow.Uint32());
  const recordBatch: GPUSplatArrowRecordBatchLike = {
    numRows: source.numRows,
    schema: source.schema,
    getChild: columnName =>
      columnName === 'semantic_id' ? semanticIds : source.getChild(columnName)
  };

  expect(
    () => makeGPUSplatDataFromArrow(device, recordBatch),
    'never fabricates class zero for an unlabeled Arrow source row'
  ).toThrow(/semantic identifiers cannot be null/);
  void 0;
});

it('makeGPUSplatDataFromArrow rejects invalid unsigned semantic identifiers', () => {
  const device = new NullDevice({});
  const source = makeSplatRecordBatch({positions: [0, 0, 0]});

  for (const semanticId of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    0.5,
    0x1_0000_0000
  ]) {
    const semanticIds = arrow.vectorFromArray([semanticId], new arrow.Float64());
    const recordBatch: GPUSplatArrowRecordBatchLike = {
      numRows: source.numRows,
      schema: source.schema,
      getChild: columnName =>
        columnName === 'custom_category' ? semanticIds : source.getChild(columnName)
    };

    expect(
      () => makeGPUSplatDataFromArrow(device, recordBatch, {semanticColumn: 'custom_category'}),
      `rejects invalid numeric semantic identifier ${String(semanticId)}`
    ).toThrow(/semantic identifiers must be unsigned 32-bit integers/);
  }

  for (const semanticId of ['building', '7']) {
    const semanticIds = arrow.vectorFromArray([semanticId], new arrow.Utf8());
    const recordBatch: GPUSplatArrowRecordBatchLike = {
      numRows: source.numRows,
      schema: source.schema,
      getChild: columnName => (columnName === 'label' ? semanticIds : source.getChild(columnName))
    };

    expect(
      () => makeGPUSplatDataFromArrow(device, recordBatch),
      `never coerces automatically detected string label ${semanticId} into a class identifier`
    ).toThrow(/semantic identifiers must be unsigned 32-bit integers/);
  }

  for (const {semanticId, semanticIds} of [
    {semanticId: -1n, semanticIds: arrow.vectorFromArray([-1n], new arrow.Int64())},
    {
      semanticId: 0x1_0000_0000n,
      semanticIds: arrow.vectorFromArray([0x1_0000_0000n], new arrow.Uint64())
    }
  ]) {
    const recordBatch: GPUSplatArrowRecordBatchLike = {
      numRows: source.numRows,
      schema: source.schema,
      getChild: columnName =>
        columnName === 'semantic_id' ? semanticIds : source.getChild(columnName)
    };

    expect(
      () => makeGPUSplatDataFromArrow(device, recordBatch),
      `rejects out-of-range 64-bit semantic identifier ${String(semanticId)}`
    ).toThrow(/semantic identifiers must be unsigned 32-bit integers/);
  }

  const validSource = makeSplatRecordBatch({positions: [0, 0, 0, 1, 1, 1]});
  const validSemanticIds = arrow.vectorFromArray([0n, 0xffff_ffffn], new arrow.Uint64());
  const validRecordBatch: GPUSplatArrowRecordBatchLike = {
    numRows: validSource.numRows,
    schema: validSource.schema,
    getChild: columnName =>
      columnName === 'semantic_id' ? validSemanticIds : validSource.getChild(columnName)
  };
  const prepared = makeGPUSplatDataFromArrow(device, validRecordBatch)[0]!;

  expect(
    Array.from(prepared.source.semanticIds ?? []),
    'preserves both unsigned 32-bit bounds from numeric Arrow columns'
  ).toEqual([0, 0xffff_ffff]);
  prepared.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow honors linear field metadata and independent scale encodings', () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({
    positions: [3, 4, 5],
    scales: [-2, Math.log(8), 3],
    rotations: [0.5, 0.25, 0.125, 0.75],
    opacities: [1.5],
    colors: [70, 80, 90],
    scaleEncodings: ['linear', 'log', 'linear'],
    opacityEncoding: 'linear'
  });
  const batch = makeGPUSplatDataFromArrow(device, {data: recordBatch})[0];

  assertApproximatelyEqual(batch?.source.scales, [0, 8, 3], 'decodes each scale field metadata');
  assertApproximatelyEqual(batch?.source.opacities, [1.5], 'preserves linear LoD opacity above 1');
  expect(
    Array.from(batch?.source.rotations ?? []),
    'does not reorder or overwrite the quaternion'
  ).toEqual([0.5, 0.25, 0.125, 0.75]);

  batch?.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow uses fallback RGBA and full opacity for missing optional columns', () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({
    positions: [1, 2, 3],
    scales: [2, 3, 4],
    rotations: [1, 0, 0, 0],
    scaleEncoding: 'linear',
    omit: ['f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity']
  });
  const defaultBatch = makeGPUSplatDataFromArrow(device, recordBatch)[0];
  const customBatch = makeGPUSplatDataFromArrow(
    device,
    {shape: 'arrow-table', data: new arrow.Table([recordBatch])},
    {fallbackColor: [12, 34, 56, 128]}
  )[0];

  assertApproximatelyEqual(
    defaultBatch?.source.colors,
    [1, 1, 1, 1],
    'uses linear opaque white when color coefficients are absent'
  );
  assertApproximatelyEqual(
    customBatch?.source.colors,
    [12 / 255, 34 / 255, 56 / 255, 128 / 255],
    'normalizes caller-provided RGBA fallback color bytes into linear floats'
  );
  expect(
    Array.from(customBatch?.source.opacities ?? []),
    'does not sigmoid or duplicate fallback alpha when opacity is absent'
  ).toEqual([1]);

  defaultBatch?.destroy();
  customBatch?.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow preserves Arrow record batches, global rows, and ownership', async () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    scaleEncoding: 'linear',
    opacityEncoding: 'linear'
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [2, 2, 2],
    scaleEncoding: 'linear',
    opacityEncoding: 'linear'
  });
  const batches = makeGPUSplatDataFromArrow(
    device,
    new arrow.Table([firstRecordBatch, secondRecordBatch]),
    {sourceBatchIndex: 3, rowIndexBase: 11}
  );

  expect(batches.length, 'retains each Arrow record batch independently').toBe(2);
  expect(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'preserves stable source batch indices and global row offsets'
  ).toEqual([
    [3, 11, 2],
    [4, 13, 1]
  ]);
  expect(
    batches.map(batch => batch.table.batches.length),
    'never combines source batches into one GPU table'
  ).toEqual([1, 1]);

  const firstPositionBuffer = batches[0]?.positions.data[0]?.buffer;
  const secondPositionBuffer = batches[1]?.positions.data[0]?.buffer;
  expect(firstPositionBuffer, 'allocates independent batch-local buffers').not.toBe(
    secondPositionBuffer
  );
  expect(
    Array.from(await readUint32GPUVector(batches[0]!)),
    'uploads stable global indices for the first record batch'
  ).toEqual([11, 12]);
  expect(
    Array.from(await readUint32GPUVector(batches[1]!)),
    'continues source indices across record batch boundaries'
  ).toEqual([13]);

  batches[0]?.destroy();
  expect(
    Boolean(firstPositionBuffer?.destroyed),
    'destroying a prepared batch releases its owned buffer'
  ).toBe(true);
  expect(
    Boolean(secondPositionBuffer?.destroyed),
    'destroying one batch preserves other caller-owned data'
  ).toBe(false);
  batches[1]?.destroy();
  void 0;
});

it('makeGPUSplatDataFromArrow accepts structural Arrow tables and batches from another realm', () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 1, 2, 3, 4, 5],
    scaleEncoding: 'linear',
    sphericalHarmonicCoefficients: [2.570492744445801, 2.6299448013305664, 2.5203464031219482]
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [6, 7, 8],
    scaleEncoding: 'linear'
  });
  const foreignRecordBatch = makeForeignArrowRecordBatch(firstRecordBatch);
  const foreignTable = makeForeignArrowTable([firstRecordBatch, secondRecordBatch]);

  expect(
    Boolean(foreignRecordBatch instanceof arrow.RecordBatch),
    'record batch has a foreign prototype'
  ).toBe(false);
  expect(Boolean(foreignTable instanceof arrow.Table), 'table has a foreign prototype').toBe(false);

  const directRecordBatch = makeGPUSplatDataFromArrow(device, foreignRecordBatch);
  const wrappedRecordBatch = makeGPUSplatDataFromArrow(device, {data: foreignRecordBatch});
  const directTable = makeGPUSplatDataFromArrow(device, foreignTable);
  const wrappedTable = makeGPUSplatDataFromArrow(device, {
    shape: 'arrow-table',
    data: foreignTable
  });

  expect(
    directRecordBatch.map(batch => batch.rowCount),
    'accepts a direct foreign Arrow record batch'
  ).toEqual([2]);
  expect(
    wrappedRecordBatch.map(batch => batch.rowCount),
    'accepts a wrapped foreign Arrow record batch'
  ).toEqual([2]);
  expect(
    directTable.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'preserves the independent record batches of a direct foreign Arrow table'
  ).toEqual([
    [0, 0, 2],
    [1, 2, 1]
  ]);
  expect(
    wrappedTable.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'preserves the independent record batches of a wrapped foreign Arrow table'
  ).toEqual([
    [0, 0, 2],
    [1, 2, 1]
  ]);
  assertApproximatelyEqual(
    directRecordBatch[0]?.source.colors.subarray(0, 4),
    [1.2251226155007027, 1.2418937311081395, 1.2109765937867287, 1],
    'preserves HDR spherical-harmonic color from a foreign Arrow record batch'
  );

  for (const batch of [
    ...directRecordBatch,
    ...wrappedRecordBatch,
    ...directTable,
    ...wrappedTable
  ]) {
    batch.destroy();
  }
  void 0;
});

it('makeGPUSplatDataFromArrowStream preserves mixed sources and progressive source offsets', async () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    scaleEncoding: 'linear'
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [2, 2, 2],
    scaleEncoding: 'linear'
  });
  const thirdRecordBatch = makeSplatRecordBatch({
    positions: [3, 3, 3],
    scaleEncoding: 'linear'
  });
  const emptyRecordBatch = firstRecordBatch.slice(0, 0);
  const batches: GPUSplatData[] = [];

  async function* makeArrowSources(): AsyncIterable<GPUSplatArrowSource> {
    yield {shape: 'arrow-table', data: new arrow.Table([firstRecordBatch, secondRecordBatch])};
    yield emptyRecordBatch;
    yield {data: thirdRecordBatch};
  }

  for await (const batch of makeGPUSplatDataFromArrowStream(device, makeArrowSources(), {
    sourceBatchIndex: 5,
    rowIndexBase: 20
  })) {
    batches.push(batch);
  }

  expect(batches.length, 'yields each nonempty Arrow record batch exactly once').toBe(3);
  expect(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'preserves batch identity across nested tables, empty batches, and wrappers'
  ).toEqual([
    [5, 20, 2],
    [6, 22, 1],
    [8, 23, 1]
  ]);
  expect(
    batches.map(batch => batch.sourceInfo.sourceRowCount),
    'retains source row metadata on independently prepared streaming batches'
  ).toEqual([2, 1, 1]);

  for (const batch of batches) {
    batch.destroy();
  }
  void 0;
});

it('Arrow Gaussian paging preserves authored RAD identities across out-of-order chunks', async () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0, 1, 1, 1],
    scaleEncoding: 'linear'
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [2, 2, 2],
    scaleEncoding: 'linear'
  });
  const sources: GPUSplatArrowSource[] = [
    {data: firstRecordBatch, loaderData: {format: 'rad', base: 512, chunkIndex: 8}},
    {data: secondRecordBatch, loaderData: {format: 'rad', base: 12, chunkIndex: 1}}
  ];
  const batches: GPUSplatData[] = [];

  for await (const batch of makeGPUSplatDataFromArrowStream(device, sources, {
    sourceBatchIndex: 20,
    rowIndexBase: 1_000
  })) {
    batches.push(batch);
  }

  expect(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'retains authored chunk/global-row identity independently of page request order'
  ).toEqual([
    [28, 1_512, 2],
    [21, 1_012, 1]
  ]);
  expect(
    Array.from(await readUint32GPUVector(batches[0]!)),
    'uploads source-global RAD row IDs instead of sequential admission-order rows'
  ).toEqual([1_512, 1_513]);

  const eagerBatch = makeGPUSplatDataFromArrow(device, sources[1]!, {
    sourceBatchIndex: 2,
    rowIndexBase: 100
  })[0]!;
  expect(eagerBatch.sourceBatchIndex, 'preserves eager source chunk identity').toBe(3);
  expect(eagerBatch.rowIndexBase, 'preserves eager source-global RAD row identity').toBe(112);

  for (const batch of [...batches, eagerBatch]) {
    batch.destroy();
  }
  void 0;
});

it('Arrow Gaussian paging rejects malformed loader-owned source identities', () => {
  const device = new NullDevice({});
  const recordBatch = makeSplatRecordBatch({positions: [0, 0, 0], scaleEncoding: 'linear'});

  for (const loaderData of [{base: -1}, {base: Number.NaN}, {chunkIndex: -1}]) {
    expect(
      () => makeGPUSplatDataFromArrow(device, {data: recordBatch, loaderData}),
      'rejects invalid stable paged Gaussian source identities'
    ).toThrow(/nonnegative safe integers/);
  }
  void 0;
});

it('makeGPUSplatDataFromArrowStream allocates record batches lazily and honors early cancellation', async () => {
  const device = new NullDevice({});
  const allocatedBuffers: Array<ReturnType<typeof device.createBuffer>> = [];
  const createBuffer = device.createBuffer.bind(device);
  device.createBuffer = properties => {
    const buffer = createBuffer(properties);
    allocatedBuffers.push(buffer);
    return buffer;
  };
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 0, 0],
    scaleEncoding: 'linear'
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [1, 1, 1, 2, 2, 2],
    scaleEncoding: 'linear'
  });
  const source = new arrow.Table([firstRecordBatch, secondRecordBatch]);
  const yieldedBatches: GPUSplatData[] = [];

  for await (const batch of makeGPUSplatDataFromArrowStream(device, [source], {
    sourceBatchIndex: 6,
    rowIndexBase: 12
  })) {
    yieldedBatches.push(batch);
    break;
  }

  expect(
    yieldedBatches.length,
    'cancels the stream after transferring one caller-owned batch'
  ).toBe(1);
  expect(
    [yieldedBatches[0]?.sourceBatchIndex, yieldedBatches[0]?.rowIndexBase],
    'preserves source identity before the consumer cancels'
  ).toEqual([6, 12]);
  expect(
    allocatedBuffers.length,
    'does not allocate unrequested record-batch GPU buffers before yielding'
  ).toBe(Object.keys(yieldedBatches[0]?.table.batches[0].gpuData ?? {}).length);
  yieldedBatches[0]?.destroy();
  expect(
    Boolean(allocatedBuffers.every(buffer => buffer.destroyed)),
    'early cancellation leaves no inaccessible or leaked prepared-batch allocations'
  ).toBe(true);
  void 0;
});

it('makeGPUSplatDataFromArrowStream preserves structural cross-realm Arrow batch boundaries', async () => {
  const device = new NullDevice({});
  const firstRecordBatch = makeSplatRecordBatch({
    positions: [0, 1, 2, 3, 4, 5],
    scaleEncoding: 'linear'
  });
  const secondRecordBatch = makeSplatRecordBatch({
    positions: [6, 7, 8],
    scaleEncoding: 'linear'
  });
  const thirdRecordBatch = makeSplatRecordBatch({
    positions: [9, 10, 11],
    scaleEncoding: 'linear'
  });
  const sources: GPUSplatArrowSource[] = [
    makeForeignArrowTable([firstRecordBatch, secondRecordBatch]),
    {data: makeForeignArrowRecordBatch(thirdRecordBatch)}
  ];
  const batches: GPUSplatData[] = [];

  for await (const batch of makeGPUSplatDataFromArrowStream(device, sources, {
    sourceBatchIndex: 2,
    rowIndexBase: 7
  })) {
    batches.push(batch);
  }

  expect(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    'recognizes streamed foreign tables and batches without collapsing source boundaries'
  ).toEqual([
    [2, 7, 2],
    [3, 9, 1],
    [4, 10, 1]
  ]);

  for (const batch of batches) {
    batch.destroy();
  }
  void 0;
});

it('makeGPUSplatDataFromArrow rejects missing required position, scale, and rotation columns', () => {
  const device = new NullDevice({});
  for (const columnName of ['POSITION', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_3']) {
    const recordBatch = makeSplatRecordBatch({
      positions: [0, 0, 0],
      scaleEncoding: 'linear',
      omit: [columnName]
    });
    expect(
      () => makeGPUSplatDataFromArrow(device, recordBatch),
      `rejects a missing ${columnName} column`
    ).toThrow(new RegExp(columnName));
  }
  void 0;
});

it('makeGPUSplatDataFromArrow honors sliced FixedSizeList position offsets', () => {
  const device = new NullDevice({});
  const source = makeSplatRecordBatch({
    positions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    scaleEncoding: 'linear'
  }).slice(1, 3);
  const batch = makeGPUSplatDataFromArrow(device, source)[0];

  expect(batch?.rowCount, 'retains the sliced record-batch row count').toBe(2);
  expect(
    Array.from(batch?.source.positions ?? []),
    'uploads exactly the sliced FixedSizeList position rows'
  ).toEqual([3, 4, 5, 6, 7, 8]);

  batch?.destroy();
  void 0;
});

function makeSplatRecordBatch(options: SplatRecordBatchOptions): arrow.RecordBatch {
  const rowCount = options.positions.length / 3;
  const omitted = new Set(options.omit ?? []);
  const columns: Record<string, arrow.Vector> = {};
  const fields: arrow.Field[] = [];
  const scales = options.scales ?? new Array(rowCount * 3).fill(1);
  const rotations =
    options.rotations ??
    Array.from({length: rowCount * 4}, (_, componentIndex) => (componentIndex % 4 === 0 ? 1 : 0));
  const opacities = options.opacities ?? new Array(rowCount).fill(1);
  const colors = options.colors ?? new Array(rowCount * 3).fill(255);

  addColumn(
    'POSITION',
    makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array(options.positions))
  );
  for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
    addColumn(
      `scale_${componentIndex}`,
      makeScalarVector(scales, componentIndex, 3, rowCount),
      options.scaleEncodings?.[componentIndex] ?? options.scaleEncoding
    );
    addColumn(
      `f_dc_${componentIndex}`,
      arrow.makeVector(
        Float32Array.from({length: rowCount}, (_, rowIndex) => {
          const coefficient =
            options.sphericalHarmonicCoefficients?.[rowIndex * 3 + componentIndex];
          if (coefficient !== undefined) {
            return coefficient;
          }
          const color = colors[rowIndex * 3 + componentIndex] ?? 255;
          return (color / 255 - 0.5) / SPHERICAL_HARMONIC_DC;
        })
      ),
      'coefficient'
    );
  }
  for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
    addColumn(`rot_${componentIndex}`, makeScalarVector(rotations, componentIndex, 4, rowCount));
  }
  const higherOrderCoefficients = options.higherOrderSphericalHarmonicCoefficients;
  if (higherOrderCoefficients) {
    const coefficientCount = higherOrderCoefficients.length / rowCount;
    for (let coefficientIndex = 0; coefficientIndex < coefficientCount; coefficientIndex++) {
      addColumn(
        `f_rest_${coefficientIndex}`,
        makeScalarVector(higherOrderCoefficients, coefficientIndex, coefficientCount, rowCount),
        'coefficient'
      );
    }
  }
  addColumn('opacity', arrow.makeVector(Float32Array.from(opacities)), options.opacityEncoding);
  if (options.semanticIds) {
    addColumn(
      options.semanticColumnName ?? 'semantic_id',
      arrow.makeVector(Uint32Array.from(options.semanticIds))
    );
  }

  const schemaMetadata = options.sourceFormat
    ? new Map([['loaders_gl.gaussian_splats.source_format', options.sourceFormat]])
    : undefined;
  const recordBatch = new arrow.Table(new arrow.Schema(fields, schemaMetadata), columns).batches[0];
  if (!recordBatch) {
    throw new Error('Expected an Arrow Gaussian splat record batch');
  }
  return recordBatch;

  function addColumn(name: string, vector: arrow.Vector, encoding?: string): void {
    if (omitted.has(name)) {
      return;
    }
    const metadata = encoding ? new Map([[ENCODING_METADATA_KEY, encoding]]) : undefined;
    columns[name] = vector;
    fields.push(new arrow.Field(name, vector.type, false, metadata));
  }
}

function makeScalarVector(
  values: readonly number[],
  componentIndex: number,
  componentCount: number,
  rowCount: number
): arrow.Vector {
  return arrow.makeVector(
    Float32Array.from(
      {length: rowCount},
      (_, rowIndex) => values[rowIndex * componentCount + componentIndex] ?? 0
    )
  );
}

function makeForeignArrowRecordBatch(recordBatch: arrow.RecordBatch): GPUSplatArrowRecordBatchLike {
  const foreignRecordBatch = {
    data: recordBatch.data,
    getChild: recordBatch.getChild.bind(recordBatch),
    numRows: recordBatch.numRows,
    schema: recordBatch.schema
  };
  return foreignRecordBatch;
}

function makeForeignArrowTable(recordBatches: arrow.RecordBatch[]): GPUSplatArrowTableLike {
  const table = new arrow.Table(recordBatches);
  const foreignTable = {
    batches: recordBatches.map(makeForeignArrowRecordBatch),
    data: table.data,
    getChild: table.getChild.bind(table),
    numRows: table.numRows,
    schema: table.schema
  };
  return foreignTable;
}

async function readUint32GPUVector(data: GPUSplatData): Promise<Uint32Array> {
  const gpuData = data.rowIndices.data[0]!;
  const bytes = await gpuData.buffer.readAsync(gpuData.byteOffset, gpuData.byteLength);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, data.rowCount);
}

function assertApproximatelyEqual(
  actual: ArrayLike<number> | undefined,
  expected: readonly number[],
  description: string
): void {
  expect(
    Boolean(
      actual &&
        actual.length === expected.length &&
        expected.every((value, valueIndex) => Math.abs(actual[valueIndex]! - value) < 0.00001)
    ),
    description
  ).toBe(true);
}
