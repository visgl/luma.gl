// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUSplatData, SplatRenderer, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUSplatData preserves optional semantic and spherical-harmonic GPU storage', async () => {
  const device = new NullDevice({});
  const source = makeDynamicSplatSource();
  source.semanticIds = new Uint32Array([4, 9]);
  source.sphericalHarmonics = Float32Array.from({length: 18}, (_, index) => index / 10);
  const prepared = makeGPUSplatData(device, source);

  expect(prepared.sphericalHarmonicsDegree, 'infers the first non-DC spherical-harmonic band').toBe(
    1
  );
  expect(prepared.semanticIds?.format, 'retains compact GPU semantic identifiers').toBe('uint32');
  expect(prepared.sphericalHarmonics?.format, 'retains flattened Float32 coefficients').toBe(
    'float32'
  );
  expect(prepared.sphericalHarmonics?.length, 'preserves every source coefficient').toBe(18);
  expect(
    Boolean(prepared.table.gpuVectors['semanticIds']),
    'keeps optional semantic storage outside the fixed source-batch render schema'
  ).toBe(false);
  expect(
    Boolean(prepared.table.gpuVectors['sphericalHarmonics']),
    'keeps flattened spherical harmonics outside the fixed-row source table'
  ).toBe(false);

  const tableByteLength = Object.values(prepared.table.batches[0].gpuData).reduce(
    (byteLength, data) => byteLength + data.buffer.byteLength,
    0
  );
  expect(
    prepared.byteLength,
    'includes independently owned optional GPU storage in residency accounting'
  ).toBe(tableByteLength + source.semanticIds.byteLength + source.sphericalHarmonics.byteLength);

  const semanticBuffer = prepared.semanticIds!.data[0].buffer;
  const sphericalHarmonicsBuffer = prepared.sphericalHarmonics!.data[0].buffer;
  const semanticBytes = await semanticBuffer.readAsync();
  expect(
    Array.from(new Uint32Array(semanticBytes.buffer)),
    'uploads stable source semantic identifiers'
  ).toEqual([4, 9]);

  prepared.destroy();
  expect(Boolean(semanticBuffer.destroyed), 'releases independently owned semantic GPU data').toBe(
    true
  );
  expect(
    Boolean(sphericalHarmonicsBuffer.destroyed),
    'releases independently owned spherical harmonics'
  ).toBe(true);
  void 0;
});

it('GPUSplatData updates source rows and GPU buffers in place', async () => {
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

  expect(prepared.revision, 'increments the source revision once per atomic row update').toBe(1);
  expect(prepared.positions.data[0].buffer, 'preserves existing GPU allocations').toBe(
    positionBuffer
  );
  expect(Array.from(source.positions), 'updates only the selected packed CPU source rows').toEqual([
    0, 0, 0.20000000298023224, 3, 4, 0.8999999761581421
  ]);
  expect(Array.from(source.semanticIds), 'updates source semantic class metadata').toEqual([4, 17]);
  expect(
    Array.from(source.sphericalHarmonics.subarray(9)),
    'updates complete per-row spherical-harmonic coefficient sets'
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const positionBytes = await positionBuffer.readAsync();
  const semanticBytes = await semanticBuffer.readAsync();
  const sphericalHarmonicsBytes = await sphericalHarmonicsBuffer.readAsync();
  expect(
    Array.from(new Float32Array(positionBytes.buffer)),
    'uploads changed source positions to their original GPU byte offsets'
  ).toEqual(Array.from(source.positions));
  expect(
    Array.from(new Uint32Array(semanticBytes.buffer)),
    'updates semantic GPU storage without reallocating it'
  ).toEqual([4, 17]);
  expect(
    Array.from(new Float32Array(sphericalHarmonicsBytes.buffer).subarray(9)),
    'updates flattened coefficient GPU storage at the selected row boundary'
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  prepared.update({opacities: new Float32Array([0.75, 0.5])});
  expect(prepared.revision, 'accepts full-column updates without an explicit row offset').toBe(2);
  prepared.update({rowOffset: 1});
  expect(prepared.revision, 'does not invalidate renderers for an empty update').toBe(2);

  prepared.destroy();
  void 0;
});

it('GPUSplatData validates dynamic updates before changing source rows', () => {
  const device = new NullDevice({});
  const source = makeDynamicSplatSource();
  const prepared = makeGPUSplatData(device, source);
  const originalPositions = source.positions.slice();

  expect(
    () => prepared.updateRows(1, {positions: new Float32Array([1, 2])}),
    'rejects incomplete packed row updates'
  ).toThrow(/complete rows/);
  expect(
    () =>
      prepared.update({
        positions: new Float32Array([1, 2, 3]),
        opacities: new Float32Array([1, 0.5])
      }),
    'requires all updated source columns to target the same rows'
  ).toThrow(/matching row counts/);
  expect(
    () => prepared.updateRows(2, {opacities: new Float32Array([1])}),
    'rejects writes beyond the existing source batch'
  ).toThrow(/exceed/);
  expect(
    () => prepared.update({colors: new Float32Array([1, 1, 1, 1])}),
    'retains the original normalized or Float32 source color format'
  ).toThrow(/source column types/);
  expect(
    () => prepared.update({semanticIds: new Uint32Array([1])}),
    'rejects updates for optional columns that were never allocated'
  ).toThrow(/existing prepared source column/);
  expect(Array.from(source.positions), 'preserves failed rows').toEqual(
    Array.from(originalPositions)
  );
  expect(prepared.revision, 'does not invalidate borrowing renderers after a failed update').toBe(
    0
  );

  prepared.destroy();
  expect(
    () => prepared.update({opacities: new Float32Array([1])}),
    'rejects changes after releasing owned GPU resources'
  ).toThrow(/destroyed/);
  void 0;
});

it('GPUSplatData keeps overlapping source-backed updates consistent on the CPU and GPU', async () => {
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

  expect(
    Array.from(source.positions),
    'copies overlapping source rows with typed-array copy semantics'
  ).toEqual([1, 2, 3, 1, 2, 3, 4, 5, 6]);
  expect(
    Array.from(new Float32Array(uploadedPositions.buffer)),
    'uploads the original overlapping values before the source-backed view changes'
  ).toEqual(Array.from(source.positions));

  prepared.destroy();
  void 0;
});

it('GPUSplatData validates optional semantic and spherical-harmonic source rows', () => {
  const device = new NullDevice({});

  expect(
    () => makeGPUSplatData(device, {...makeDynamicSplatSource(), semanticIds: new Uint32Array(1)}),
    'requires semantic identifiers for every source row'
  ).toThrow(/matching Gaussian splat rows/);
  expect(
    () =>
      makeGPUSplatData(device, {
        ...makeDynamicSplatSource(),
        sphericalHarmonics: new Float32Array(16)
      }),
    'rejects partial or unsupported spherical-harmonic coefficient bands'
  ).toThrow(/coefficient count/);
  expect(
    () =>
      makeGPUSplatData(device, {
        ...makeDynamicSplatSource(),
        sphericalHarmonics: new Float32Array(18),
        sphericalHarmonicsDegree: 2
      }),
    'rejects coefficient counts that disagree with the explicit source degree'
  ).toThrow(/degree/);
  expect(
    () => makeGPUSplatData(device, {...makeDynamicSplatSource(), sphericalHarmonicsDegree: 1}),
    'requires coefficients when a non-DC source degree is declared'
  ).toThrow(/coefficient data/);
  void 0;
});

it('GPUSplatData rejects global rows outside the GPU picking index range', () => {
  const device = new NullDevice({});

  for (const rowIndexBase of [-1, Number.NaN, 2_147_483_647, 4_294_967_296]) {
    expect(
      () => makeGPUSplatData(device, {...makeDynamicSplatSource(), rowIndexBase}),
      `rejects an unsupported stable source-row base of ${rowIndexBase}`
    ).toThrow(/signed 32-bit GPU indices/);
  }

  const prepared = makeGPUSplatData(device, {
    ...makeDynamicSplatSource(),
    rowIndexBase: 2_147_483_646
  });
  expect(
    prepared.rowIndexBase,
    'accepts a source batch ending at the largest signed GPU picking index'
  ).toBe(2_147_483_646);

  prepared.destroy();
  void 0;
});

it('SplatRenderer refreshes visibility and depth ordering after dynamic source updates', () => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeDynamicSplatSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [100, 100]});

  expect(Array.from(renderer.getSortedIndices()), 'sorts original source rows').toEqual([6, 5]);
  prepared.updateRows(0, {positions: new Float32Array([0, 0, 0.95])});
  expect(
    Array.from(renderer.getSortedIndices()),
    'refreshes camera-dependent ordering after source positions move'
  ).toEqual([5, 6]);

  prepared.updateRows(0, {opacities: new Float32Array([0])});
  expect(
    Array.from(renderer.getSortedIndices()),
    'refreshes source opacity visibility without replacing existing GPU batches'
  ).toEqual([6]);
  expect(renderer.table?.batches.length, 'preserves the original source-batch boundary').toBe(1);

  renderer.destroy();
  prepared.destroy();
  void 0;
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
