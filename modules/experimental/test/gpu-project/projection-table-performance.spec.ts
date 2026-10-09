// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  prepareCRSProjection,
  ProjectionTableTransform,
  type ProjectionTableBatch
} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionTableBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  makePerformancePositions,
  parsePerformanceSweep,
  performanceFixtures
} from './projection-performance-fixtures';

const largeSweep = import.meta.env.VITE_LUPROJ_TABLE_LARGE === 'true';
const rowCounts = parsePerformanceSweep(
  import.meta.env.VITE_LUPROJ_TABLE_ROWS,
  largeSweep ? [4096, 16384, 65536, 262144, 1048576, 4194304] : [32]
);
const batchSizes = parsePerformanceSweep(
  import.meta.env.VITE_LUPROJ_TABLE_BATCH_ROWS,
  largeSweep ? [65536] : [16, 1024]
);
const measured = largeSweep || import.meta.env.VITE_LUPROJ_TABLE_ROWS !== undefined;

for (const fixture of performanceFixtures) {
  for (const rowCount of rowCounts) {
    for (const batchSize of batchSizes) {
      it(`measures table ${fixture.id}/${rowCount} rows/${batchSize} batch rows`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const preparationStart = performance.now();
        const prepared = prepareCRSProjection({
          from: 'EPSG:4326',
          to: fixture.serialized,
          bounds: fixture.bounds,
          degree: 3,
          tolerance: 0.0005,
          precision: 'double-single'
        });
        if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
        const preparationTimeMilliseconds = performance.now() - preparationStart;
        const positions = makePerformancePositions(fixture.bounds, rowCount);
        const batches: ProjectionTableBatch[] = [];
        for (let offset = 0; offset < positions.length / 2; offset += batchSize) {
          const batchPositions = positions.subarray(offset * 2, (offset + batchSize) * 2);
          batches.push({
            positions: batchPositions,
            sourceInfo: {
              sourceBatchIndex: batches.length,
              sourceRowIndexOffset: offset,
              sourceRowCount: batchPositions.length / 2
            },
            metadata: new Map([['fixture', fixture.id]])
          });
        }
        const report = await runProjectionTableBenchmark(device, {
          transform: new ProjectionTableTransform(prepared),
          batches,
          provider: '@math.gl/projection 5.0.0-alpha.15 TypeScript',
          maximumError: 0.001,
          warmupIterations: measured ? 2 : 0,
          measuredIterations: measured ? 5 : 1
        });
        expect(report.rowCount).toBe(rowCount + 11);
        expect(report.validRows).toBe(rowCount + 9);
        expect(report.dispatchCount).toBe(Math.ceil((rowCount + 11) / batchSize));
        expect(report.maximumObservedError).toBeLessThanOrEqual(0.001);
        const residentMedian = report.paths[0].durationMilliseconds.median;
        expect(report.residentSpeedupOverCPU).toBe(
          residentMedian > 0 && report.cpuTimeMilliseconds.median > 0
            ? report.cpuTimeMilliseconds.median / residentMedian
            : null
        );
        if (measured)
          console.info(
            `PROJECTION_TABLE_PERFORMANCE ${JSON.stringify({schemaVersion: 2, capturedAt: new Date().toISOString(), browser: navigator.userAgent, fixture: fixture.id, rowCount, batchSize, preparationTimeMilliseconds, report})}`
          );
      }, 180000);
    }
  }
}
