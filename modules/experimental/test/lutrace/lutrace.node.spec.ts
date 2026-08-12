// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as traceModule from '@luma.gl/experimental/lutrace';
import {
  GPU_TRACE_LINK_RECORD_WORD_LENGTH,
  GPU_TRACE_SPAN_RECORD_WORD_LENGTH,
  getGPUTracePickingShader
} from '@luma.gl/experimental/lutrace';
import {describe, expect, test} from 'vitest';

const TRACE_RUNTIME_EXPORTS = [
  'GPUTraceScene',
  'GPUTraceInteraction',
  'GPU_TRACE_SPAN_RECORD_WORD_LENGTH',
  'GPU_TRACE_LINK_RECORD_WORD_LENGTH',
  'getGPUTracePickingShader'
] as const;

describe('@luma.gl/experimental/lutrace package boundary', () => {
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
    expect(packageJson.exports?.['./lutrace']).toEqual({
      import: './dist/lutrace/index.js',
      require: './dist/lutrace/index.cjs',
      types: './dist/lutrace/index.d.ts'
    });
  });

  test('keeps trace-specific runtime APIs exclusively on the trace subpath', () => {
    expect(Object.keys(traceModule).sort()).toEqual([...TRACE_RUNTIME_EXPORTS].sort());

    for (const exportName of TRACE_RUNTIME_EXPORTS) {
      expect(traceModule[exportName]).toBeDefined();
      expect(exportName in experimentalModule).toBe(false);
    }

    expect(experimentalModule.GPUCommandGraph).toBeTypeOf('function');
    expect(experimentalModule.GPUHierarchyLayout).toBeTypeOf('function');
    expect(experimentalModule.GPUGraphTraversal).toBeTypeOf('function');
    expect(experimentalModule.GPUIndexPickingTarget).toBeTypeOf('function');
  });

  test('does not leave trace implementations or reverse imports in generic graph primitives', () => {
    const primitiveExports = readFileSync(
      new URL('../../src/gpu-primitives/index.ts', import.meta.url),
      'utf8'
    );

    expect(primitiveExports).not.toContain('/lutrace');
    expect(primitiveExports).not.toContain('GPUTraceScene');
    expect(primitiveExports).not.toContain('GPUTraceInteraction');
    expect(
      existsSync(new URL('../../src/gpu-primitives/gpu-trace-scene.ts', import.meta.url))
    ).toBe(false);
    expect(
      existsSync(new URL('../../src/gpu-primitives/gpu-trace-interaction.ts', import.meta.url))
    ).toBe(false);
  });

  test('publishes canonical span and dependency schemas without example-specific constants', () => {
    expect(GPU_TRACE_SPAN_RECORD_WORD_LENGTH).toBe(8);
    expect(GPU_TRACE_LINK_RECORD_WORD_LENGTH).toBe(4);
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
