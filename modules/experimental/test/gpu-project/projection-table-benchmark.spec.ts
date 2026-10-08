// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import type {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {runProjectionTableBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {makeSourceBatches, makeTableTransform} from './projection-table-fixtures';

for (const precision of ['double-single', 'local-f32'] as const) {
  it(`validates and measures production ${precision} table paths with explicit transfers`, async context => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    )
      context.skip();
    const buffers: Buffer[] = [];
    const createBuffer = device.createBuffer.bind(device);
    const allocate = vi.spyOn(device, 'createBuffer').mockImplementation(props => {
      const buffer = createBuffer(props);
      buffers.push(buffer);
      return buffer;
    });
    const transform = makeTableTransform(precision);
    const batches = makeSourceBatches();
    // Exercise synthesized masks as well as non-binary masks, offset views and empty batches.
    batches[2].inputValidity = undefined;
    try {
      const pending = runProjectionTableBenchmark(device, {
        transform,
        batches,
        provider: '@math.gl/projection test',
        maximumError: precision === 'local-f32' ? 0.002 : 0.001,
        warmupIterations: 0,
        measuredIterations: 1
      });
      // The asynchronous GPU work must use snapshots, not these caller-owned arrays.
      batches[0].positions.fill(0);
      batches[0].inputValidity?.fill(0);
      const report = await pending;
      expect(report.batchRowCounts).toEqual([5, 0, 2]);
      expect(report.rowCount).toBe(7);
      expect(report.validRows).toBe(4);
      expect(report.dispatchCount).toBe(2);
      expect(report.cpuOutputByteLength).toBe(140);
      expect(report.gpuBufferByteLength.input).toBe(160);
      expect(report.gpuBufferByteLength.output).toBe(precision === 'double-single' ? 160 : 96);
      expect(report.gpuBufferByteLength.parameters).toBe(
        transform.prepared.compiled.packParameters().byteLength * 2
      );
      expect(report.gpuBufferByteLength.total).toBe(
        report.gpuBufferByteLength.input +
          report.gpuBufferByteLength.output +
          report.gpuBufferByteLength.parameters
      );
      expect(report.metadata.outputPrecision).toBe(precision);
      expect(report.maximumObservedError).toBeLessThanOrEqual(report.maximumAllowedError);
      expect(report.paths.map(path => path.mode)).toEqual([
        'resident',
        'upload-project',
        'round-trip'
      ]);
      for (const path of report.paths) {
        expect(path.durationMilliseconds.minimum).toBeGreaterThanOrEqual(0);
        expect(path.sourceRowsPerSecond).toBe(
          path.durationMilliseconds.median > 0 ? 7000 / path.durationMilliseconds.median : null
        );
      }
      const roundTrip = report.paths[2].durationMilliseconds.median;
      expect(report.roundTripSpeedupOverCPU).toBe(
        roundTrip > 0 && report.cpuTimeMilliseconds.median > 0
          ? report.cpuTimeMilliseconds.median / roundTrip
          : null
      );
      expect(buffers.length).toBeGreaterThanOrEqual(14);
      expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    } finally {
      allocate.mockRestore();
    }
  });
}

for (const corruption of [
  'coordinate',
  'validity',
  'invalid-payload',
  'readback-failure'
] as const) {
  it(`rejects ${corruption} and releases benchmark resources`, async context => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    )
      context.skip();
    const buffers: Buffer[] = [];
    const createBuffer = device.createBuffer.bind(device);
    const allocate = vi.spyOn(device, 'createBuffer').mockImplementation(props => {
      const buffer = createBuffer(props);
      buffers.push(buffer);
      const selected = corruption === 'validity' ? 'validity-0' : 'positions-0';
      if (props.id === `projection-table-benchmark-${selected}`) {
        const read = buffer.readAsync.bind(buffer);
        vi.spyOn(buffer, 'readAsync').mockImplementation(async (...arguments_) => {
          if (corruption === 'readback-failure') throw new Error('readback failed');
          const bytes = await read(...arguments_);
          if (corruption === 'validity') new Uint32Array(bytes.buffer, bytes.byteOffset)[0] = 0;
          else
            new Float32Array(bytes.buffer, bytes.byteOffset)[corruption === 'coordinate' ? 0 : 12] =
              1;
          return bytes;
        });
      }
      return buffer;
    });
    try {
      await expect(
        runProjectionTableBenchmark(device, {
          transform: makeTableTransform(),
          batches: makeSourceBatches(),
          provider: 'test',
          maximumError: 0.001,
          warmupIterations: 0,
          measuredIterations: 1
        })
      ).rejects.toThrow();
      expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    } finally {
      allocate.mockRestore();
    }
  });
}
