// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export const DEFAULT_PARTICLE_COUNT = 4096;
export const STREAMING_PARTICLE_BATCH_COUNT = 8;
export const STREAMING_PARTICLE_BATCH_INTERVAL_MS = 2_000;
export const STREAMING_PARTICLE_ROWS_PER_BATCH =
  DEFAULT_PARTICLE_COUNT / STREAMING_PARTICLE_BATCH_COUNT;

export function makeArrowParticleTable(particleCount = DEFAULT_PARTICLE_COUNT): arrow.Table {
  return makeArrowParticleTableRange(0, particleCount);
}

export function makeArrowParticleRecordBatches(
  particleCount = DEFAULT_PARTICLE_COUNT,
  rowsPerBatch = STREAMING_PARTICLE_ROWS_PER_BATCH
): arrow.RecordBatch[] {
  const recordBatches: arrow.RecordBatch[] = [];
  for (let particleStart = 0; particleStart < particleCount; particleStart += rowsPerBatch) {
    const batchParticleCount = Math.min(rowsPerBatch, particleCount - particleStart);
    const recordBatch = makeArrowParticleTableRange(particleStart, batchParticleCount).batches[0];
    if (recordBatch) {
      recordBatches.push(recordBatch);
    }
  }
  return recordBatches;
}

export async function* createStreamingParticleRecordBatchIterator(
  recordBatches: arrow.RecordBatch[]
): AsyncGenerator<arrow.RecordBatch> {
  for (let batchIndex = 0; batchIndex < recordBatches.length; batchIndex++) {
    if (batchIndex > 0) {
      await waitForStreamingBatchDelay();
    }
    const recordBatch = recordBatches[batchIndex];
    if (recordBatch) {
      yield recordBatch;
    }
  }
}

function makeArrowParticleTableRange(particleStart: number, particleCount: number): arrow.Table {
  const positions = new Float32Array(particleCount * 2);
  const velocities = new Float32Array(particleCount * 2);

  for (let localParticleIndex = 0; localParticleIndex < particleCount; localParticleIndex++) {
    const particleIndex = particleStart + localParticleIndex;
    const angle = particleIndex * 2.399963229728653;
    const radius = 0.12 + ((particleIndex % 257) / 256) * 0.74;
    const velocityScale = 0.0016 + ((particleIndex % 13) / 12) * 0.0018;

    positions[localParticleIndex * 2] = Math.cos(angle) * radius;
    positions[localParticleIndex * 2 + 1] = Math.sin(angle) * radius;
    velocities[localParticleIndex * 2] = Math.cos(angle + Math.PI / 2) * velocityScale;
    velocities[localParticleIndex * 2 + 1] = Math.sin(angle + Math.PI / 2) * velocityScale;
  }

  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    velocities: makeArrowFixedSizeListVector(new arrow.Float32(), 2, velocities)
  });
}

function waitForStreamingBatchDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, STREAMING_PARTICLE_BATCH_INTERVAL_MS);
  });
}
