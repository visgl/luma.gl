// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {writeFile} from 'node:fs/promises';
import * as arrow from 'apache-arrow';
import {
  Compression,
  Encoding,
  Table,
  WriterPropertiesBuilder,
  WriterVersion,
  writeParquet
} from 'parquet-wasm/node';
import {makeParquetConstellationData} from './parquet-constellation-data.ts';

const ROW_COUNT = 600_000;
const PAGE_SIZE = 65_536;
const data = makeParquetConstellationData(ROW_COUNT);
const arrowTable = arrow.tableFromArrays(data);
const arrowIPC = arrow.tableToIPC(arrowTable, 'stream');
const variants = [
  {name: 'UNCOMPRESSED', compression: Compression.UNCOMPRESSED, file: 'constellation.parquet'},
  {name: 'SNAPPY', compression: Compression.SNAPPY, file: 'constellation-snappy.parquet'},
  {name: 'LZ4_RAW', compression: Compression.LZ4_RAW, file: 'constellation-lz4-raw.parquet'}
];

for (const variant of variants) {
  const wasmTable = Table.fromIPCStream(arrowIPC);
  const writerProperties = new WriterPropertiesBuilder()
    .setWriterVersion(WriterVersion.V2)
    .setCompression(variant.compression)
    .setDictionaryEnabled(false)
    .setMaxRowGroupSize(ROW_COUNT)
    .setWriteBatchSize(PAGE_SIZE)
    .setDataPageSizeLimit(PAGE_SIZE * Float32Array.BYTES_PER_ELEMENT)
    .setColumnEncoding('positionX', Encoding.BYTE_STREAM_SPLIT)
    .setColumnEncoding('positionY', Encoding.BYTE_STREAM_SPLIT)
    .setColumnEncoding('radius', Encoding.BYTE_STREAM_SPLIT)
    .setColumnEncoding('temperature', Encoding.BYTE_STREAM_SPLIT)
    .setColumnEncoding('sequence', Encoding.DELTA_BINARY_PACKED)
    // Its packed control headers must remain visible to the CPU-side graph planner.
    .setColumnCompression('sequence', Compression.UNCOMPRESSED)
    .build();
  const parquetBytes = writeParquet(wasmTable, writerProperties);
  await writeFile(new URL(`./data/${variant.file}`, import.meta.url), parquetBytes);
  console.log(
    `Wrote ${ROW_COUNT.toLocaleString()} ${variant.name} rows (${parquetBytes.byteLength.toLocaleString()} bytes)`
  );
}
