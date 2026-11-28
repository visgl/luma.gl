// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  makeGfsCsv,
  makeGfsTrajectoryTable
} from '../../examples/experimental/vector-observatory/gfs-export';
import {
  GFS_FIXTURE,
  makeGfsField,
  makeGfsSeeds,
  measureGfsFrames
} from '../../examples/experimental/vector-observatory/gfs-data';

it('preserves geographic bounds and sampled values under grid decimation', () => {
  for (const stride of [1, 2, 3]) {
    const field = makeGfsField(1, stride);
    expect(field.shape).toEqual([30 / stride + 1, 30 / stride + 1]);
    expect(
      field.geographic!.longitudeStart + field.geographic!.longitudeStep * (field.shape[1] - 1)
    ).toBe(-55);
    expect(
      field.geographic!.latitudeStart + field.geographic!.latitudeStep * (field.shape[0] - 1)
    ).toBe(50);
    expect(field.eastward[1]).toBe(Math.fround(GFS_FIXTURE.snapshots[1].eastward[stride]));
    expect(field.northward.at(-1)).toBe(Math.fround(GFS_FIXTURE.snapshots[1].northward.at(-1)!));
  }
});

it('keeps qualification identities first and exports physical coordinates with UTC time', async () => {
  const seeds = makeGfsSeeds(2);
  expect(seeds.length).toBe(16);
  expect(seeds.slice(0, 8)).toEqual(makeGfsSeeds());
  const particles = Float32Array.from(
    Array.from({length: 4}, (_, index) => [seeds[index * 2], seeds[index * 2 + 1], 0, 1]).flat()
  );
  const frames = [{time: 0, sequence: 0, byteOffset: 0, particles}];
  expect(Math.max(...measureGfsFrames(frames))).toBeLessThan(0.001);
  const table = makeGfsTrajectoryTable(frames);
  expect(table).toBeInstanceOf(arrow.Table);
  expect(table.schema.fields.map(field => field.type.toString())).toEqual([
    'Utf8',
    'Float64',
    'Uint32',
    'Float64',
    'Float64',
    'Float64',
    'Uint32',
    'Float64'
  ]);
  const rows = (await makeGfsCsv(frames)).trim().split('\n');
  expect(rows.length).toBe(5);
  expect(rows[1].split(',').slice(0, 6)).toEqual([
    '2016-11-20T00:00:00.000Z',
    '0',
    '1',
    '-70',
    '35',
    '0'
  ]);
  expect((await makeGfsCsv([{...frames[0], time: 300}])).trim().split('\n')[1].endsWith(',')).toBe(
    true
  );
  expect(
    makeGfsTrajectoryTable([{...frames[0], time: 300}])
      .getChild('reference_error_metres')!
      .get(0)
  ).toBeNull();
  expect(particles[0]).toBe(0.5);
});
