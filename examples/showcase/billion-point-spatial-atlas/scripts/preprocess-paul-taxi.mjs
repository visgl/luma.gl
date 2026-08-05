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
const coordinateReferenceSystem = parseCoordinateReferenceSystem(argumentsByName.crs);

if (!inputPath) {
  printUsage();
  process.exitCode = 1;
} else {
  await preprocess(
    resolve(inputPath),
    outputDirectory,
    shardPointCount,
    coordinateReferenceSystem
  );
}

async function preprocess(sourcePath, targetDirectory, pointsPerShard, crs) {
  await mkdir(targetDirectory, {recursive: true});
  const temporaryDirectory = extname(sourcePath) === '.gz'
    ? await mkdtemp(join(tmpdir(), 'luma-spatial-atlas-'))
    : null;
  try {
    const arrowPath = await maybeDecompress(sourcePath, temporaryDirectory ?? targetDirectory);
    process.stdout.write(`Reading Arrow IPC file ${arrowPath}\n`);
    const table = tableFromIPC(await readFile(arrowPath));
    const [xField, yField] = findCoordinateFields(table.schema.fields);
    const xVector = table.getChild(xField.name);
    const yVector = table.getChild(yField.name);
    if (!xVector || !yVector) {
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
        const x = getCoordinateValue(xVector.get(rowIndex));
        const y = getCoordinateValue(yVector.get(rowIndex));
        positions[localIndex * 2] = x;
        positions[localIndex * 2 + 1] = y;
        const storedX = positions[localIndex * 2];
        const storedY = positions[localIndex * 2 + 1];
        if (Number.isFinite(storedX) && Number.isFinite(storedY)) {
          bounds[0] = Math.min(bounds[0], storedX);
          bounds[1] = Math.min(bounds[1], storedY);
          bounds[2] = Math.max(bounds[2], storedX);
          bounds[3] = Math.max(bounds[3], storedY);
        }
      }
      const file = `points-${String(shardIndex).padStart(4, '0')}.f32`;
      await writeFile(join(targetDirectory, file), encodeLittleEndianFloat32(positions));
      shards.push({file, firstRow, pointCount, bounds: normalizeBounds(bounds)});
      process.stdout.write(`Wrote ${file} (${pointCount.toLocaleString()} rows)\n`);
    }

    const manifest = {
      version: 2,
      source: DEFAULT_SOURCE_URL,
      sourceFile: basename(sourcePath),
      coordinateColumns: [xField.name, yField.name],
      coordinateSpace: {kind: 'source-xy', crs},
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
  const coordinatePairs = [
    ['x', 'y'],
    ['longitude', 'latitude'],
    ['lon', 'lat'],
    ['lng', 'lat'],
    ['pickup_longitude', 'pickup_latitude']
  ];
  for (const [xName, yName] of coordinatePairs) {
    const x = byLowercaseName.get(xName);
    const y = byLowercaseName.get(yName);
    if (x && y) return [x, y];
  }
  throw new Error(
    `Could not identify a complete source X/Y coordinate pair. Available columns: ${fields
      .map(field => field.name)
      .join(', ')}`
  );
}

function normalizeBounds(bounds) {
  return bounds.every(Number.isFinite) ? bounds : null;
}

function getCoordinateValue(value) {
  return value === null || value === undefined ? Number.NaN : Number(value);
}

function encodeLittleEndianFloat32(values) {
  const bytes = new Uint8Array(values.byteLength);
  const dataView = new DataView(bytes.buffer);
  for (let index = 0; index < values.length; index++) {
    dataView.setFloat32(index * Float32Array.BYTES_PER_ELEMENT, values[index], true);
  }
  return bytes;
}

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseCoordinateReferenceSystem(value) {
  if (value === undefined) return null;
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error('--crs must be a non-empty coordinate reference system identifier');
  }
  return normalized;
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
  yarn preprocess:taxi --input /path/to/168898952_points.arrow.gz [--output ./public/taxi-atlas] [--shard-points 1000000] [--crs OGC:CRS84]

The original 859 MB object does not expose browser CORS. Download it once, then run this command
to emit streamable packed float32 shards and manifest.json. The conversion needs enough memory to
open the decompressed Arrow IPC file; it never runs in the browser. Coordinates remain in the
source X/Y space. The optional --crs value records an explicit coordinate reference system without
transforming those values; omit it when the source coordinate system is unknown.

Source:
  ${DEFAULT_SOURCE_URL}
`);
}
