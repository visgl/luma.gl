// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {makeGPUSplatData, SplatRenderer, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUSplatData preserves optional semantic and spherical-harmonic GPU storage', async t => {
  const device = new NullDevice({});
  const source = makeDynamicSplatSource();
  source.semanticIds = new Uint32Array([4, 9]);
  source.sphericalHarmonics = Float32Array.from({length: 18}, (_, index) => index / 10);
  const prepared = makeGPUSplatData(device, source);

  t.equal(prepared.sphericalHarmonicsDegree, 1, 'infers the first non-DC spherical-harmonic band');
  t.equal(prepared.semanticIds?.format, 'uint32', 'retains compact GPU semantic identifiers');
  t.equal(prepared.sphericalHarmonics?.format, 'float32', 'retains flattened Float32 coefficients');
  t.equal(prepared.sphericalHarmonics?.length, 18, 'preserves every source coefficient');
  t.notOk(
    prepared.table.gpuVectors['semanticIds'],
    'keeps optional semantic storage outside the fixed source-batch render schema'
  );
  t.notOk(
    prepared.table.gpuVectors['sphericalHarmonics'],
    'keeps flattened spherical harmonics outside the fixed-row source table'
  );

  const tableByteLength = Object.values(prepared.table.batches[0].gpuData).reduce(
    (byteLength, data) => byteLength + data.buffer.byteLength,
    0
  );
  t.equal(
    prepared.byteLength,
    tableByteLength + source.semanticIds.byteLength + source.sphericalHarmonics.byteLength,
    'includes independently owned optional GPU storage in residency accounting'
  );

  const semanticBuffer = prepared.semanticIds!.data[0].buffer;
  const sphericalHarmonicsBuffer = prepared.sphericalHarmonics!.data[0].buffer;
  const semanticBytes = await semanticBuffer.readAsync();
  t.deepEqual(
    Array.from(new Uint32Array(semanticBytes.buffer)),
    [4, 9],
    'uploads stable source semantic identifiers'
  );

  prepared.destroy();
  t.ok(semanticBuffer.destroyed, 'releases independently owned semantic GPU data');
  t.ok(sphericalHarmonicsBuffer.destroyed, 'releases independently owned spherical harmonics');
  t.end();
});

test('GPUSplatData updates source rows and GPU buffers in place', async t => {
  const device = new NullDevice({});
  const source = makeDynamicSplatSource();
  source.semanticIds = new Uint32Array([4, 9]);
  source.sphericalHarmonics = new Float32Array(18);
  const prepared = makeGPUSplatData(device, source);
  const positionBuffer = prepared.positions.data[0].buffer;
  const semanticBuffer = prepared.semanticIds!.data[0].buffer;
  const sphericalHarmonicsBuffer = prepared.sphericalHarmonics!.data[0].buffer;

  prepared.updateRows(1, {
    positions: new Float32Array([3, 4, 0.9]),
    colors: new Uint8Array([20, 30, 40, 200]),
    opacities: new Float32Array([0.25]),
    semanticIds: new Uint32Array([17]),
    sphericalHarmonics: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
  });

  t.equal(prepared.revision, 1, 'increments the source revision once per atomic row update');
  t.equal(prepared.positions.data[0].buffer, positionBuffer, 'preserves existing GPU allocations');
  t.deepEqual(
    Array.from(source.positions),
    [0, 0, 0.20000000298023224, 3, 4, 0.8999999761581421],
    'updates only the selected packed CPU source rows'
  );
  t.deepEqual(Array.from(source.semanticIds), [4, 17], 'updates source semantic class metadata');
  t.deepEqual(
    Array.from(source.sphericalHarmonics.subarray(9)),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    'updates complete per-row spherical-harmonic coefficient sets'
  );

  const positionBytes = await positionBuffer.readAsync();
  const semanticBytes = await semanticBuffer.readAsync();
  const sphericalHarmonicsBytes = await sphericalHarmonicsBuffer.readAsync();
  t.deepEqual(
    Array.from(new Float32Array(positionBytes.buffer)),
    Array.from(source.positions),
    'uploads changed source positions to their original GPU byte offsets'
  );
  t.deepEqual(
    Array.from(new Uint32Array(semanticBytes.buffer)),
    [4, 17],
    'updates semantic GPU storage without reallocating it'
  );
  t.deepEqual(
    Array.from(new Float32Array(sphericalHarmonicsBytes.buffer).subarray(9)),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    'updates flattened coefficient GPU storage at the selected row boundary'
  );

  prepared.update({opacities: new Float32Array([0.75, 0.5])});
  t.equal(prepared.revision, 2, 'accepts full-column updates without an explicit row offset');
  prepared.update({rowOffset: 1});
  t.equal(prepared.revision, 2, 'does not invalidate renderers for an empty update');

  prepared.destroy();
  t.end();
});

test('GPUSplatData validates dynamic updates before changing source rows', t => {
  const device = new NullDevice({});
  const source = makeDynamicSplatSource();
  const prepared = makeGPUSplatData(device, source);
  const originalPositions = source.positions.slice();

  t.throws(
    () => prepared.updateRows(1, {positions: new Float32Array([1, 2])}),
    /complete rows/,
    'rejects incomplete packed row updates'
  );
  t.throws(
    () =>
      prepared.update({
        positions: new Float32Array([1, 2, 3]),
        opacities: new Float32Array([1, 0.5])
      }),
    /matching row counts/,
    'requires all updated source columns to target the same rows'
  );
  t.throws(
    () => prepared.updateRows(2, {opacities: new Float32Array([1])}),
    /exceed/,
    'rejects writes beyond the existing source batch'
  );
  t.throws(
    () => prepared.update({colors: new Float32Array([1, 1, 1, 1])}),
    /source column types/,
    'retains the original normalized or Float32 source color format'
  );
  t.throws(
    () => prepared.update({semanticIds: new Uint32Array([1])}),
    /existing prepared source column/,
    'rejects updates for optional columns that were never allocated'
  );
  t.deepEqual(Array.from(source.positions), Array.from(originalPositions), 'preserves failed rows');
  t.equal(prepared.revision, 0, 'does not invalidate borrowing renderers after a failed update');

  prepared.destroy();
  t.throws(
    () => prepared.update({opacities: new Float32Array([1])}),
    /destroyed/,
    'rejects changes after releasing owned GPU resources'
  );
  t.end();
});

test('GPUSplatData keeps overlapping source-backed updates consistent on the CPU and GPU', async t => {
  const device = new NullDevice({});
  const source: SplatSource = {
    ...makeDynamicSplatSource(),
    positions: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    scales: new Float32Array(9),
    rotations: new Float32Array(12),
    colors: new Uint8Array(12),
    opacities: new Float32Array(3)
  };
  const prepared = makeGPUSplatData(device, source);

  prepared.updateRows(1, {positions: source.positions.subarray(0, 6)});
  const uploadedPositions = await prepared.positions.data[0].buffer.readAsync();

  t.deepEqual(
    Array.from(source.positions),
    [1, 2, 3, 1, 2, 3, 4, 5, 6],
    'copies overlapping source rows with typed-array copy semantics'
  );
  t.deepEqual(
    Array.from(new Float32Array(uploadedPositions.buffer)),
    Array.from(source.positions),
    'uploads the original overlapping values before the source-backed view changes'
  );

  prepared.destroy();
  t.end();
});

test('GPUSplatData validates optional semantic and spherical-harmonic source rows', t => {
  const device = new NullDevice({});

  t.throws(
    () => makeGPUSplatData(device, {...makeDynamicSplatSource(), semanticIds: new Uint32Array(1)}),
    /matching Gaussian splat rows/,
    'requires semantic identifiers for every source row'
  );
  t.throws(
    () =>
      makeGPUSplatData(device, {
        ...makeDynamicSplatSource(),
        sphericalHarmonics: new Float32Array(16)
      }),
    /coefficient count/,
    'rejects partial or unsupported spherical-harmonic coefficient bands'
  );
  t.throws(
    () =>
      makeGPUSplatData(device, {
        ...makeDynamicSplatSource(),
        sphericalHarmonics: new Float32Array(18),
        sphericalHarmonicsDegree: 2
      }),
    /degree/,
    'rejects coefficient counts that disagree with the explicit source degree'
  );
  t.throws(
    () => makeGPUSplatData(device, {...makeDynamicSplatSource(), sphericalHarmonicsDegree: 1}),
    /coefficient data/,
    'requires coefficients when a non-DC source degree is declared'
  );
  t.end();
});

test('GPUSplatData rejects global rows outside the GPU picking index range', t => {
  const device = new NullDevice({});

  for (const rowIndexBase of [-1, Number.NaN, 2_147_483_647, 4_294_967_296]) {
    t.throws(
      () => makeGPUSplatData(device, {...makeDynamicSplatSource(), rowIndexBase}),
      /signed 32-bit GPU indices/,
      `rejects an unsupported stable source-row base of ${rowIndexBase}`
    );
  }

  const prepared = makeGPUSplatData(device, {
    ...makeDynamicSplatSource(),
    rowIndexBase: 2_147_483_646
  });
  t.equal(
    prepared.rowIndexBase,
    2_147_483_646,
    'accepts a source batch ending at the largest signed GPU picking index'
  );

  prepared.destroy();
  t.end();
});

test('SplatRenderer refreshes visibility and depth ordering after dynamic source updates', t => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeDynamicSplatSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [100, 100]});

  t.deepEqual(Array.from(renderer.getSortedIndices()), [6, 5], 'sorts original source rows');
  prepared.updateRows(0, {positions: new Float32Array([0, 0, 0.95])});
  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [5, 6],
    'refreshes camera-dependent ordering after source positions move'
  );

  prepared.updateRows(0, {opacities: new Float32Array([0])});
  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [6],
    'refreshes source opacity visibility without replacing existing GPU batches'
  );
  t.equal(renderer.table?.batches.length, 1, 'preserves the original source-batch boundary');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

function makeDynamicSplatSource(): SplatSource {
  return {
    positions: new Float32Array([0, 0, 0.2, 0, 0, 0.8]),
    scales: new Float32Array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0]),
    colors: new Uint8Array([255, 128, 32, 255, 255, 128, 32, 255]),
    opacities: new Float32Array([1, 1]),
    sourceBatchIndex: 3,
    rowIndexBase: 5
  };
}
