// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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
  scaleEncoding?: 'linear' | 'log';
  scaleEncodings?: readonly ('linear' | 'log' | undefined)[];
  opacityEncoding?: 'linear' | 'logit';
  omit?: readonly string[];
};

test('makeGPUSplatDataFromArrow decodes default GraphDECO Gaussian splat encodings', t => {
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

  t.equal(batches.length, 1, 'creates one independently owned GPU batch');
  t.equal(batch?.rowCount, 2, 'preserves the source row count');
  t.equal(batch?.positions.format, 'float32x3', 'declares XYZ position storage');
  t.equal(batch?.scales.format, 'float32x3', 'declares XYZ scale storage');
  t.equal(batch?.rotations.format, 'float32x4', 'declares quaternion storage');
  t.equal(batch?.colors.format, 'float32x4', 'declares linear floating-point RGBA storage');
  t.equal(batch?.opacities.format, 'float32', 'declares separate linear opacity storage');
  t.equal(batch?.rowIndices.format, 'uint32', 'declares stable global source-row indices');
  t.deepEqual(Array.from(batch?.source.positions ?? []), [1, 2, 3, 4, 5, 6], 'retains XYZ centers');
  assertApproximatelyEqual(t, batch?.source.scales, [2, 3, 4, 5, 6, 7], 'decodes log scales');
  t.deepEqual(
    Array.from(batch?.source.rotations ?? []),
    [1, 0, 0, 0, 0, 0, 1, 0],
    'preserves [w, x, y, z] quaternion ordering'
  );
  assertApproximatelyEqual(t, batch?.source.opacities, [0.5, 0.75], 'decodes logit opacity');
  t.ok(batch?.source.colors instanceof Float32Array, 'retains linear floating-point source colors');
  assertApproximatelyEqual(
    t,
    batch?.source.colors,
    [1, 0, 128 / 255, 1, 10 / 255, 20 / 255, 30 / 255, 1],
    'decodes SH DC RGB without quantization or duplicating opacity into color alpha'
  );
  t.deepEqual(
    batch?.sourceInfo,
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
    'records stable source metadata'
  );

  const positionBuffer = batch?.positions.data[0]?.buffer;
  batch?.destroy();
  batch?.destroy();
  t.ok(positionBuffer?.destroyed, 'caller-owned GPU buffer destruction is idempotent');
  t.end();
});

test('makeGPUSplatDataFromArrow preserves real GraphDECO Train HDR and negative SH DC radiance', async t => {
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

  t.equal(batch.colors.format, 'float32x4', 'retains HDR-compatible GPU color storage');
  assertApproximatelyEqual(
    t,
    batch.source.colors,
    expectedColors,
    'preserves highlights above one and negative reconstructed linear radiance'
  );

  const gpuData = batch.colors.data[0]!;
  const bytes = await gpuData.buffer.readAsync(gpuData.byteOffset, gpuData.byteLength);
  const uploadedColors = new Float32Array(bytes.buffer, bytes.byteOffset, batch.rowCount * 4);
  assertApproximatelyEqual(
    t,
    uploadedColors,
    expectedColors,
    'uploads unquantized SH DC radiance without clamping or losing precision'
  );

  batch.destroy();
  t.end();
});

test('makeGPUSplatDataFromArrow honors linear field metadata and independent scale encodings', t => {
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

  assertApproximatelyEqual(t, batch?.source.scales, [0, 8, 3], 'decodes each scale field metadata');
  assertApproximatelyEqual(
    t,
    batch?.source.opacities,
    [1.5],
    'preserves linear LoD opacity above 1'
  );
  t.deepEqual(
    Array.from(batch?.source.rotations ?? []),
    [0.5, 0.25, 0.125, 0.75],
    'does not reorder or overwrite the quaternion'
  );

  batch?.destroy();
  t.end();
});

test('makeGPUSplatDataFromArrow uses fallback RGBA and full opacity for missing optional columns', t => {
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
    t,
    defaultBatch?.source.colors,
    [1, 1, 1, 1],
    'uses linear opaque white when color coefficients are absent'
  );
  assertApproximatelyEqual(
    t,
    customBatch?.source.colors,
    [12 / 255, 34 / 255, 56 / 255, 128 / 255],
    'normalizes caller-provided RGBA fallback color bytes into linear floats'
  );
  t.deepEqual(
    Array.from(customBatch?.source.opacities ?? []),
    [1],
    'does not sigmoid or duplicate fallback alpha when opacity is absent'
  );

  defaultBatch?.destroy();
  customBatch?.destroy();
  t.end();
});

test('makeGPUSplatDataFromArrow preserves Arrow record batches, global rows, and ownership', async t => {
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

  t.equal(batches.length, 2, 'retains each Arrow record batch independently');
  t.deepEqual(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    [
      [3, 11, 2],
      [4, 13, 1]
    ],
    'preserves stable source batch indices and global row offsets'
  );
  t.deepEqual(
    batches.map(batch => batch.table.batches.length),
    [1, 1],
    'never combines source batches into one GPU table'
  );

  const firstPositionBuffer = batches[0]?.positions.data[0]?.buffer;
  const secondPositionBuffer = batches[1]?.positions.data[0]?.buffer;
  t.notEqual(
    firstPositionBuffer,
    secondPositionBuffer,
    'allocates independent batch-local buffers'
  );
  t.deepEqual(
    Array.from(await readUint32GPUVector(batches[0]!)),
    [11, 12],
    'uploads stable global indices for the first record batch'
  );
  t.deepEqual(
    Array.from(await readUint32GPUVector(batches[1]!)),
    [13],
    'continues source indices across record batch boundaries'
  );

  batches[0]?.destroy();
  t.ok(firstPositionBuffer?.destroyed, 'destroying a prepared batch releases its owned buffer');
  t.notOk(
    secondPositionBuffer?.destroyed,
    'destroying one batch preserves other caller-owned data'
  );
  batches[1]?.destroy();
  t.end();
});

test('makeGPUSplatDataFromArrow accepts structural Arrow tables and batches from another realm', t => {
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

  t.notOk(foreignRecordBatch instanceof arrow.RecordBatch, 'record batch has a foreign prototype');
  t.notOk(foreignTable instanceof arrow.Table, 'table has a foreign prototype');

  const directRecordBatch = makeGPUSplatDataFromArrow(device, foreignRecordBatch);
  const wrappedRecordBatch = makeGPUSplatDataFromArrow(device, {data: foreignRecordBatch});
  const directTable = makeGPUSplatDataFromArrow(device, foreignTable);
  const wrappedTable = makeGPUSplatDataFromArrow(device, {
    shape: 'arrow-table',
    data: foreignTable
  });

  t.deepEqual(
    directRecordBatch.map(batch => batch.rowCount),
    [2],
    'accepts a direct foreign Arrow record batch'
  );
  t.deepEqual(
    wrappedRecordBatch.map(batch => batch.rowCount),
    [2],
    'accepts a wrapped foreign Arrow record batch'
  );
  t.deepEqual(
    directTable.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    [
      [0, 0, 2],
      [1, 2, 1]
    ],
    'preserves the independent record batches of a direct foreign Arrow table'
  );
  t.deepEqual(
    wrappedTable.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    [
      [0, 0, 2],
      [1, 2, 1]
    ],
    'preserves the independent record batches of a wrapped foreign Arrow table'
  );
  assertApproximatelyEqual(
    t,
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
  t.end();
});

test('makeGPUSplatDataFromArrowStream preserves mixed sources and progressive source offsets', async t => {
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

  t.equal(batches.length, 3, 'yields each nonempty Arrow record batch exactly once');
  t.deepEqual(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    [
      [5, 20, 2],
      [6, 22, 1],
      [8, 23, 1]
    ],
    'preserves batch identity across nested tables, empty batches, and wrappers'
  );
  t.deepEqual(
    batches.map(batch => batch.sourceInfo.sourceRowCount),
    [2, 1, 1],
    'retains source row metadata on independently prepared streaming batches'
  );

  for (const batch of batches) {
    batch.destroy();
  }
  t.end();
});

test('makeGPUSplatDataFromArrowStream preserves structural cross-realm Arrow batch boundaries', async t => {
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

  t.deepEqual(
    batches.map(batch => [batch.sourceBatchIndex, batch.rowIndexBase, batch.rowCount]),
    [
      [2, 7, 2],
      [3, 9, 1],
      [4, 10, 1]
    ],
    'recognizes streamed foreign tables and batches without collapsing source boundaries'
  );

  for (const batch of batches) {
    batch.destroy();
  }
  t.end();
});

test('makeGPUSplatDataFromArrow rejects missing required position, scale, and rotation columns', t => {
  const device = new NullDevice({});
  for (const columnName of ['POSITION', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_3']) {
    const recordBatch = makeSplatRecordBatch({
      positions: [0, 0, 0],
      scaleEncoding: 'linear',
      omit: [columnName]
    });
    t.throws(
      () => makeGPUSplatDataFromArrow(device, recordBatch),
      new RegExp(columnName),
      `rejects a missing ${columnName} column`
    );
  }
  t.end();
});

test('makeGPUSplatDataFromArrow honors sliced FixedSizeList position offsets', t => {
  const device = new NullDevice({});
  const source = makeSplatRecordBatch({
    positions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    scaleEncoding: 'linear'
  }).slice(1, 3);
  const batch = makeGPUSplatDataFromArrow(device, source)[0];

  t.equal(batch?.rowCount, 2, 'retains the sliced record-batch row count');
  t.deepEqual(
    Array.from(batch?.source.positions ?? []),
    [3, 4, 5, 6, 7, 8],
    'uploads exactly the sliced FixedSizeList position rows'
  );

  batch?.destroy();
  t.end();
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
  addColumn('opacity', arrow.makeVector(Float32Array.from(opacities)), options.opacityEncoding);

  const recordBatch = new arrow.Table(new arrow.Schema(fields), columns).batches[0];
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
  assertion: {
    ok: (value: boolean, description: string) => void;
  },
  actual: ArrayLike<number> | undefined,
  expected: readonly number[],
  description: string
): void {
  assertion.ok(
    Boolean(
      actual &&
        actual.length === expected.length &&
        expected.every((value, valueIndex) => Math.abs(actual[valueIndex]! - value) < 0.00001)
    ),
    description
  );
}
