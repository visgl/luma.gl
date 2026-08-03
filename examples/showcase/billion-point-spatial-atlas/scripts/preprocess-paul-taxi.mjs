// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createReadStream, createWriteStream} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, extname, join, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {createGunzip} from 'node:zlib';
import {tableFromIPC} from 'apache-arrow';

const DEFAULT_SHARD_POINT_COUNT = 1_000_000;
const DEFAULT_SOURCE_URL =
  'https://node-rapids-data.s3.us-west-2.amazonaws.com/spatial/168898952_points.arrow.gz';

const argumentsByName = parseArguments(process.argv.slice(2));
const inputPath = argumentsByName.input;
const outputDirectory = resolve(argumentsByName.output ?? './public/taxi-atlas');
const shardPointCount = parsePositiveInteger(
  argumentsByName['shard-points'] ?? String(DEFAULT_SHARD_POINT_COUNT),
  '--shard-points'
);

if (!inputPath) {
  printUsage();
  process.exitCode = 1;
} else {
  await preprocess(resolve(inputPath), outputDirectory, shardPointCount);
}

async function preprocess(sourcePath, targetDirectory, pointsPerShard) {
  await mkdir(targetDirectory, {recursive: true});
  const temporaryDirectory = extname(sourcePath) === '.gz'
    ? await mkdtemp(join(tmpdir(), 'luma-spatial-atlas-'))
    : null;
  try {
    const arrowPath = await maybeDecompress(sourcePath, temporaryDirectory ?? targetDirectory);
    process.stdout.write(`Reading Arrow IPC file ${arrowPath}\n`);
    const table = tableFromIPC(await readFile(arrowPath));
    const [longitudeField, latitudeField] = findCoordinateFields(table.schema.fields);
    const longitudeVector = table.getChild(longitudeField.name);
    const latitudeVector = table.getChild(latitudeField.name);
    if (!longitudeVector || !latitudeVector) {
      throw new Error('Unable to read the selected coordinate columns');
    }

    const shardCount = Math.ceil(table.numRows / pointsPerShard);
    const shards = [];
    for (let shardIndex = 0; shardIndex < shardCount; shardIndex++) {
      const firstRow = shardIndex * pointsPerShard;
      const pointCount = Math.min(pointsPerShard, table.numRows - firstRow);
      const positions = new Float32Array(pointCount * 2);
      const bounds = [Infinity, Infinity, -Infinity, -Infinity];
      for (let localIndex = 0; localIndex < pointCount; localIndex++) {
        const rowIndex = firstRow + localIndex;
        const longitude = Number(longitudeVector.get(rowIndex));
        const latitude = Number(latitudeVector.get(rowIndex));
        positions[localIndex * 2] = longitude;
        positions[localIndex * 2 + 1] = latitude;
        if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
          bounds[0] = Math.min(bounds[0], longitude);
          bounds[1] = Math.min(bounds[1], latitude);
          bounds[2] = Math.max(bounds[2], longitude);
          bounds[3] = Math.max(bounds[3], latitude);
        }
      }
      const file = `points-${String(shardIndex).padStart(4, '0')}.f32`;
      await writeFile(join(targetDirectory, file), Buffer.from(positions.buffer));
      shards.push({file, firstRow, pointCount, bounds: normalizeBounds(bounds)});
      process.stdout.write(`Wrote ${file} (${pointCount.toLocaleString()} rows)\n`);
    }

    const manifest = {
      version: 1,
      source: DEFAULT_SOURCE_URL,
      sourceFile: basename(sourcePath),
      coordinateColumns: [longitudeField.name, latitudeField.name],
      format: 'float32x2-little-endian',
      pointCount: table.numRows,
      shardPointCount: pointsPerShard,
      shards
    };
    await writeFile(
      join(targetDirectory, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    process.stdout.write(
      `Wrote ${join(targetDirectory, 'manifest.json')} for ${table.numRows.toLocaleString()} rows\n`
    );
  } finally {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, {recursive: true, force: true});
    }
  }
}

async function maybeDecompress(sourcePath, targetDirectory) {
  if (extname(sourcePath) !== '.gz') {
    return sourcePath;
  }
  const outputPath = join(targetDirectory, basename(sourcePath, '.gz'));
  process.stdout.write(`Decompressing ${sourcePath} to ${outputPath}\n`);
  await pipeline(createReadStream(sourcePath), createGunzip(), createWriteStream(outputPath));
  return outputPath;
}

function findCoordinateFields(fields) {
  const byLowercaseName = new Map(fields.map(field => [field.name.toLowerCase(), field]));
  const longitude = findFirst(byLowercaseName, ['longitude', 'lon', 'lng', 'pickup_longitude', 'x']);
  const latitude = findFirst(byLowercaseName, ['latitude', 'lat', 'pickup_latitude', 'y']);
  if (!longitude || !latitude || longitude === latitude) {
    throw new Error(
      `Could not identify longitude and latitude columns. Available columns: ${fields
        .map(field => field.name)
        .join(', ')}`
    );
  }
  return [longitude, latitude];
}

function findFirst(fields, names) {
  for (const name of names) {
    const field = fields.get(name);
    if (field) return field;
  }
  return undefined;
}

function normalizeBounds(bounds) {
  return bounds.every(Number.isFinite) ? bounds : null;
}

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseArguments(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index++) {
    const argument = values[index];
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const name = argument.slice(2);
    const value = values[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }
    parsed[name] = value;
    index++;
  }
  return parsed;
}

function printUsage() {
  process.stdout.write(`Usage:
  yarn preprocess:taxi --input /path/to/168898952_points.arrow.gz [--output ./public/taxi-atlas] [--shard-points 1000000]

The original 859 MB object does not expose browser CORS. Download it once, then run this command
to emit streamable packed float32 shards and manifest.json. The conversion needs enough memory to
open the decompressed Arrow IPC file; it never runs in the browser.

Source:
  ${DEFAULT_SOURCE_URL}
`);
}
