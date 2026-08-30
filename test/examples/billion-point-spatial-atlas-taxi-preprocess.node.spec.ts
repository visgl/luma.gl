// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

const PREPROCESSOR_PATH = fileURLToPath(
  new URL(
    '../../examples/showcase/billion-point-spatial-atlas/scripts/preprocess-paul-taxi.mjs',
    import.meta.url
  )
);

test('taxi preprocessing preserves invalid rows, stored bounds, and little-endian bytes', async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'luma-taxi-preprocess-test-'));
  try {
    const inputPath = join(temporaryDirectory, 'points.arrow');
    const outputDirectory = join(temporaryDirectory, 'output');
    const table = arrow.tableFromArrays({
      x: arrow.vectorFromArray([0.1, null, -0.1], new arrow.Float64()),
      y: arrow.vectorFromArray([0.2, 3, -0.2], new arrow.Float64())
    });
    await writeFile(inputPath, arrow.tableToIPC(table, 'file'));

    await runPreprocessor(inputPath, outputDirectory, ['--crs', 'OGC:CRS84']);

    const manifest: {
      version: number;
      coordinateColumns: string[];
      coordinateSpace: {kind: string; crs: string | null};
      shards: Array<{bounds: number[] | null}>;
    } = JSON.parse(await readFile(join(outputDirectory, 'manifest.json'), 'utf8'));
    expect(manifest).toMatchObject({
      version: 2,
      coordinateColumns: ['x', 'y'],
      coordinateSpace: {kind: 'source-xy', crs: 'OGC:CRS84'}
    });
    expect(manifest.shards[0]?.bounds).toEqual([
      Math.fround(-0.1),
      Math.fround(-0.2),
      Math.fround(0.1),
      Math.fround(0.2)
    ]);

    const bytes = await readFile(join(outputDirectory, 'points-0000.f32'));
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(dataView.getFloat32(0, true)).toBe(Math.fround(0.1));
    expect(dataView.getFloat32(4, true)).toBe(Math.fround(0.2));
    expect(Number.isNaN(dataView.getFloat32(8, true))).toBe(true);
    expect(dataView.getFloat32(12, true)).toBe(3);
    expect(dataView.getFloat32(16, true)).toBe(Math.fround(-0.1));
    expect(dataView.getFloat32(20, true)).toBe(Math.fround(-0.2));
    expect(Array.from(bytes.subarray(0, 8))).toEqual([205, 204, 204, 61, 205, 204, 76, 62]);
    expect(Array.from(bytes.subarray(12, 24))).toEqual([
      0, 0, 64, 64, 205, 204, 204, 189, 205, 204, 76, 190
    ]);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
}, 10_000);

test('taxi preprocessing selects complete coordinate pairs without mixing aliases', async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'luma-taxi-coordinate-pair-test-'));
  try {
    const inputPath = join(temporaryDirectory, 'points.arrow');
    const outputDirectory = join(temporaryDirectory, 'output');
    const table = arrow.tableFromArrays({
      x: arrow.vectorFromArray([999], new arrow.Float64()),
      longitude: arrow.vectorFromArray([-73], new arrow.Float64()),
      latitude: arrow.vectorFromArray([40], new arrow.Float64())
    });
    await writeFile(inputPath, arrow.tableToIPC(table, 'file'));

    await runPreprocessor(inputPath, outputDirectory);

    const manifest: {
      coordinateColumns: string[];
      coordinateSpace: {kind: string; crs: string | null};
    } = JSON.parse(await readFile(join(outputDirectory, 'manifest.json'), 'utf8'));
    expect(manifest.coordinateColumns).toEqual(['longitude', 'latitude']);
    expect(manifest.coordinateSpace).toEqual({kind: 'source-xy', crs: null});
    const bytes = await readFile(join(outputDirectory, 'points-0000.f32'));
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect([dataView.getFloat32(0, true), dataView.getFloat32(4, true)]).toEqual([-73, 40]);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

async function runPreprocessor(
  inputPath: string,
  outputDirectory: string,
  extraArguments: string[] = []
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    execFile(
      process.execPath,
      [
        PREPROCESSOR_PATH,
        '--input',
        inputPath,
        '--output',
        outputDirectory,
        '--shard-points',
        '3',
        ...extraArguments
      ],
      error => (error ? reject(error) : resolve())
    );
  });
}
