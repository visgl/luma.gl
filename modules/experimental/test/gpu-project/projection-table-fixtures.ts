// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {
  prepareCRSProjection,
  ProjectionTableTransform,
  type ProjectionTableBatch
} from '@luma.gl/experimental/gpu-project/crs';

export function makeTableTransform(precision: 'double-single' | 'local-f32' = 'double-single') {
  const prepared = prepareCRSProjection({
    from: 'EPSG:4326',
    to: '+proj=utm +zone=10 +datum=WGS84',
    bounds: [-122.5, 37.7, -122.3, 37.9],
    tolerance: 0.0001,
    precision,
    destinationOrigin: [550000, 4190000]
  });
  if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
  return new ProjectionTableTransform(prepared);
}

export function makeSourceBatches(): ProjectionTableBatch[] {
  const backing = Float64Array.of(
    999,
    999,
    -122.4,
    37.8,
    -122.4 + 1e-8,
    37.8,
    -122.5,
    37.7,
    NaN,
    37.8,
    -122.4,
    37.8,
    999,
    999
  );
  return [
    {positions: backing.subarray(2, 12), inputValidity: Uint32Array.of(1, 2, 1, 1, 0)},
    {positions: new Float64Array(0), inputValidity: new Uint32Array(0)},
    {positions: Float64Array.of(-122.3, 37.9, -122.2, 37.8), inputValidity: Uint32Array.of(1, 1)}
  ].map((batch, index) => ({
    ...batch,
    sourceInfo: {
      sourceBatchIndex: index + 10,
      sourceRowIndexOffset: index ? 105 : 100,
      sourceRowCount: batch.positions.length / 2
    },
    metadata: new Map([['source', `partition-${index}`]])
  }));
}

/** Explicit test upload, deliberately separate from the production consumer. */
export function uploadSourceTable(device: Device, batches: ProjectionTableBatch[]): GPUTable {
  return new GPUTable({
    batches: batches.map((batch, index) => {
      const length = batch.positions.length / 2;
      const positions = device.createBuffer({
        byteLength: 256 + Math.max(16, batch.positions.byteLength),
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
      const validity = device.createBuffer({
        byteLength: 256 + Math.max(4, length * 4),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      if (length) {
        positions.write(
          new Uint8Array(
            batch.positions.buffer,
            batch.positions.byteOffset,
            batch.positions.byteLength
          ),
          256
        );
        validity.write(batch.inputValidity ?? new Uint32Array(length).fill(1), 256);
      }
      return new GPURecordBatch({
        gpuData: {
          coordinates: new GPUData({
            buffer: positions,
            format: 'uint32x4',
            length,
            byteOffset: 256,
            ownsBuffer: true
          }),
          selected: new GPUData({
            buffer: validity,
            format: 'uint32',
            length,
            byteOffset: 256,
            ownsBuffer: true
          })
        },
        sourceInfo: batch.sourceInfo,
        metadata: new Map(batch.metadata)
      });
    })
  });
}
