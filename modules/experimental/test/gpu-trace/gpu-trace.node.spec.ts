// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as gpuCoreModule from '@luma.gl/gpgpu/gpu-core';
import {GraphBufferHandle, GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import * as traceModule from '@luma.gl/experimental/gpu-trace';
import {
  GPUTraceAnalyticsOutputLayout,
  GPUTraceTimeBuckets,
  GPU_TRACE_LINK_RECORD_WORD_LENGTH,
  GPU_TRACE_SPAN_RECORD_WORD_LENGTH,
  getGPUTracePickingShader
} from '@luma.gl/experimental/gpu-trace';
import {describe, expect, test} from 'vitest';

const TRACE_RUNTIME_EXPORTS = [
  'GPUTraceScene',
  'GPUTraceInteraction',
  'GPUTraceLaneIndexBuilder',
  'GPUTraceMipmapBoundaries',
  'GPUTracePixelMipmap',
  'GPUTraceRangeMaximumIndexBuilder',
  'GPUTraceAggregation',
  'GPUTraceAnalyticsOutputLayout',
  'GPUTraceAnomalyScoring',
  'GPUTraceComparison',
  'GPUTraceCriticalPath',
  'GPUTraceTemporalIndex',
  'GPUTraceTemporalIndexBuilder',
  'GPUTraceTimeBuckets',
  'GPU_TRACE_ANOMALY_INVALID_BASELINE',
  'GPU_TRACE_ANOMALY_INVALID_DURATION',
  'GPU_TRACE_ANOMALY_INVALID_GROUP',
  'GPU_TRACE_ANOMALY_NUMERIC_OVERFLOW',
  'GPU_TRACE_COMPARISON_INVALID_BASELINE',
  'GPU_TRACE_COMPARISON_INVALID_CURRENT',
  'GPU_TRACE_COMPARISON_NUMERIC_OVERFLOW',
  'GPU_TRACE_CRITICAL_PATH_CYCLE',
  'GPU_TRACE_CRITICAL_PATH_INVALID_DURATION',
  'GPU_TRACE_CRITICAL_PATH_INVALID_PARENT',
  'GPU_TRACE_CRITICAL_PATH_LIMIT_EXCEEDED',
  'GPU_TRACE_CRITICAL_PATH_NUMERIC_OVERFLOW',
  'GPU_TRACE_LANE_INDEX_INVALID_DURATION',
  'GPU_TRACE_LANE_INDEX_INVALID_LANE',
  'GPU_TRACE_LANE_INDEX_INVALID_START_TIME',
  'GPU_TRACE_LANE_INDEX_OVERLAPPING_SPANS',
  'GPU_TRACE_RANGE_MAXIMUM_INVALID_DURATION',
  'GPU_TRACE_RANGE_MAXIMUM_INVALID_RANGE',
  'GPU_TRACE_RANGE_MAXIMUM_INVALID_ROW',
  'GPU_TRACE_SPAN_RECORD_WORD_LENGTH',
  'GPU_TRACE_LINK_RECORD_WORD_LENGTH',
  'getGPUTracePickingShader'
] as const;

describe('@luma.gl/experimental/gpu-trace package boundary', () => {
  test('publishes one side-effect-free conditional trace subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
    };

    expect(packageJson.name).toBe('@luma.gl/experimental');
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./gpu-trace']).toEqual({
      import: './dist/gpu-trace/index.js',
      require: './dist/gpu-trace/index.cjs',
      types: './dist/gpu-trace/index.d.ts'
    });
  });

  test('keeps trace-specific runtime APIs exclusively on the trace subpath', () => {
    expect(Object.keys(traceModule).sort()).toEqual([...TRACE_RUNTIME_EXPORTS].sort());

    for (const exportName of TRACE_RUNTIME_EXPORTS) {
      expect(traceModule[exportName]).toBeDefined();
      expect(exportName in experimentalModule).toBe(false);
    }

    expect(gpuCoreModule.GPUCommandGraph).toBeTypeOf('function');
    expect(gpuCoreModule.GPUHierarchyLayout).toBeTypeOf('function');
    expect(gpuCoreModule.GPUGraphTraversal).toBeTypeOf('function');
    expect(gpuCoreModule.GPUGallopingSearch).toBeTypeOf('function');
    expect(gpuCoreModule.GPUIndexPickingTarget).toBeTypeOf('function');
    expect('GPUCommandGraph' in experimentalModule).toBe(false);
  });

  test('does not leave trace implementations or reverse imports in generic graph primitives', () => {
    const primitiveExports = readFileSync(
      new URL('../../../gpgpu/src/gpu-core/index.ts', import.meta.url),
      'utf8'
    );

    expect(primitiveExports).not.toContain('/gpu-trace');
    expect(primitiveExports).not.toContain('GPUTraceScene');
    expect(primitiveExports).not.toContain('GPUTraceInteraction');
    expect(primitiveExports).not.toContain('GPUTraceAggregation');
    expect(primitiveExports).not.toContain('GPUTraceCriticalPath');
    expect(primitiveExports).not.toContain('GPUTraceTemporalIndex');
    expect(primitiveExports).not.toContain('GPUTraceTemporalIndexBuilder');
    expect(primitiveExports).not.toContain('GPUTraceTimeBuckets');
    expect(existsSync(new URL('../../src/gpu-core', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../src/gpu-graph', import.meta.url))).toBe(false);
  });

  test('publishes canonical span and dependency schemas without example-specific constants', () => {
    expect(GPU_TRACE_SPAN_RECORD_WORD_LENGTH).toBe(8);
    expect(GPU_TRACE_LINK_RECORD_WORD_LENGTH).toBe(4);
  });

  test('packs and decodes reusable compact analytics outputs', () => {
    const layout = new GPUTraceAnalyticsOutputLayout([
      {id: 'counts', format: 'uint32', length: 3},
      {id: 'durations', format: 'float32', length: 2}
    ]);
    const bytes = new Uint8Array(layout.byteLength);
    new Uint32Array(bytes.buffer, 0, 3).set([4, 8, 15]);
    new Float32Array(bytes.buffer, 12, 2).set([16.5, 23.25]);

    expect(layout.wordLength).toBe(5);
    expect(layout.byteLength).toBe(20);
    expect(layout.getSeries('durations')).toMatchObject({wordOffset: 3, byteOffset: 12});
    expect([...layout.decodeUint32(bytes, 'counts')]).toEqual([4, 8, 15]);
    expect([...layout.decodeFloat32(bytes, 'durations')]).toEqual([16.5, 23.25]);
    expect(() => layout.decodeFloat32(bytes, 'counts')).toThrow();
    expect(() => layout.decodeUint32(bytes.subarray(0, 8), 'counts')).toThrow();
    expect(
      () =>
        new GPUTraceAnalyticsOutputLayout([
          {id: 'duplicate', format: 'uint32', length: 1},
          {id: 'duplicate', format: 'float32', length: 1}
        ])
    ).toThrow();
  });

  test('rejects occupancy output ranges that overlap the count output', () => {
    const owner = {id: 'time-bucket-overlap-test'};
    const sourceHandle = new GraphBufferHandle(
      owner,
      {id: 'time-bucket-source', byteLength: 16, usage: 0},
      false
    );
    const outputHandle = new GraphBufferHandle(
      owner,
      {id: 'time-bucket-output', byteLength: 32, usage: 0},
      false
    );
    const makeView = <Format extends 'float32' | 'uint32'>(
      buffer: GraphBufferHandle,
      format: Format,
      byteOffset: number
    ): GraphDataView<Format> =>
      new GraphDataView(buffer, {
        format,
        length: 2,
        byteOffset,
        byteStride: 4,
        rowByteLength: 4
      });
    const countOutput = makeView(outputHandle, 'uint32', 0);

    expect(
      () =>
        new GPUTraceTimeBuckets({
          trace: {
            startTimes: makeView(sourceHandle, 'float32', 0),
            durations: makeView(sourceHandle, 'float32', 8)
          },
          domain: [0, 1],
          countOutput,
          durationOutput: makeView(outputHandle, 'float32', 8),
          occupancy: {
            laneCount: 1,
            averageConcurrencyOutput: makeView(outputHandle, 'float32', 0),
            laneUtilizationOutput: makeView(outputHandle, 'float32', 16),
            idleLaneTimeOutput: makeView(outputHandle, 'float32', 24)
          }
        })
    ).toThrow(/outputs must not overlap/);
  });

  test('generates visible-row picking with caller-defined capacities and lane topology', () => {
    const shader = getGPUTracePickingShader(384, 6);

    expect(shader).toContain('sourceIndex >= 384u');
    expect(shader).toContain('request.enabled == 0u');
    expect(shader).not.toContain('active: u32');
    expect(shader).toContain('visibleMask[sourceIndex] == 0u');
    expect(shader).toContain('timing.z % 6u');
    expect(shader).toContain('atomicMin(&result, sourceIndex)');
    expect(() => getGPUTracePickingShader(-1, 6)).toThrow();
    expect(() => getGPUTracePickingShader(384, 0)).toThrow();
    expect(() => getGPUTracePickingShader(384, 1.5)).toThrow();
  });

  test('preserves the documented trace picking storage-binding and dispatch contracts', () => {
    const shader = getGPUTracePickingShader(256, 4);

    expect(shader).toContain('@binding(0) var<storage, read> spans');
    expect(shader).toContain('@binding(1) var<storage, read> threadOffsets');
    expect(shader).toContain('@binding(2) var<storage, read> visibleMask');
    expect(shader).toContain('@binding(3) var<storage, read> request');
    expect(shader).toContain('@binding(4) var<storage, read_write> result');
    expect(shader).toContain('@workgroup_size(256)');
    expect(shader).toContain('threadOffsets[ownership.y] + timing.z % 4u');
  });
});
