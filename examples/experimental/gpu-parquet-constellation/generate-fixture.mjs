// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import {ParquetEncoder, ParquetSchema} from '@loaders.gl/parquet';
import {makeParquetConstellationData} from './parquet-constellation-data.ts';

const ROW_COUNT = 600_000;
const PAGE_SIZE = 65_536;
const chunks = [];
const outputStream = {
  write(chunk, callback) {
    chunks.push(chunk.slice());
    callback();
  },
  close(callback) {
    callback();
  }
};
const schema = new ParquetSchema({
  positionX: {type: 'FLOAT', encoding: 'BYTE_STREAM_SPLIT', compression: 'UNCOMPRESSED'},
  positionY: {type: 'FLOAT', encoding: 'BYTE_STREAM_SPLIT', compression: 'UNCOMPRESSED'},
  radius: {type: 'FLOAT', encoding: 'BYTE_STREAM_SPLIT', compression: 'UNCOMPRESSED'},
  temperature: {type: 'FLOAT', encoding: 'BYTE_STREAM_SPLIT', compression: 'UNCOMPRESSED'},
  sequence: {type: 'UINT_32', encoding: 'DELTA_BINARY_PACKED', compression: 'UNCOMPRESSED'}
});
const data = makeParquetConstellationData(ROW_COUNT);
const encoder = await ParquetEncoder.openStream(schema, outputStream, {
  dictionary: false,
  pageSize: PAGE_SIZE,
  rowGroupSize: ROW_COUNT,
  useDataPageV2: true,
  writeStatistics: true
});

for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
  await encoder.appendRow({
    positionX: data.positionX[rowIndex],
    positionY: data.positionY[rowIndex],
    radius: data.radius[rowIndex],
    temperature: data.temperature[rowIndex],
    sequence: data.sequence[rowIndex]
  });
}
await encoder.close();

const byteLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
const parquetBytes = new Uint8Array(byteLength);
let byteOffset = 0;
for (const chunk of chunks) {
  parquetBytes.set(chunk, byteOffset);
  byteOffset += chunk.byteLength;
}
await writeFile(new URL('./data/constellation.parquet', import.meta.url), parquetBytes);
console.log(`Wrote ${ROW_COUNT.toLocaleString()} rows (${byteLength.toLocaleString()} bytes)`);
