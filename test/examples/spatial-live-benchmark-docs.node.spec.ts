// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const componentSource = readFileSync(
  new URL('../../website/src/components/docs/spatial-benchmark.tsx', import.meta.url),
  'utf8'
);
const geospatialDocumentation = readFileSync(
  new URL('../../docs/api-reference/experimental/geospatial.md', import.meta.url),
  'utf8'
);
const benchmarkDocumentation = readFileSync(
  new URL(
    '../../docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md',
    import.meta.url
  ),
  'utf8'
);

describe('live spatial benchmark documentation', () => {
  test('embeds the same interactive benchmark in both spatial documentation pages', () => {
    for (const documentation of [geospatialDocumentation, benchmarkDocumentation]) {
      expect(documentation).toContain(
        "import {SpatialBenchmark} from '@site/src/components/docs/spatial-benchmark';"
      );
      expect(documentation).toContain('<SpatialBenchmark />');
    }
  });

  test('compares a genuine CPU predicate against unindexed and indexed WebGPU queries', () => {
    expect(componentSource).toContain('runCPUSpatialQuery(positions, bounds, output)');
    expect(componentSource).toContain('new GPUPointSpatialQuery({');
    expect(componentSource).toContain('new GPUGridIndex({');
    expect(componentSource).toContain(
      'await verifySpatialOutput(output, expectedIds, props.label)'
    );
    expect(componentSource).toContain('CPU point scan');
    expect(componentSource).toContain('WebGPU point scan');
    expect(componentSource).toContain('WebGPU reusable grid');
  });

  test('waits for completed GPU execution and reports grid construction separately', () => {
    expect(componentSource).toContain('device.submit(commandEncoder.finish())');
    expect(componentSource).toContain('const fence = device.createFence()');
    expect(componentSource).toContain('await fence.signaled');
    expect(componentSource).toContain('indexBuildMilliseconds');
    expect(componentSource).toMatch(/Query timings exclude this\s+build/);
    expect(geospatialDocumentation).toContain('construction cost separately');
    expect(benchmarkDocumentation).toContain('Grid construction is reported separately');
  });

  test('keeps browser work opt-in and provides explicit device and dataset controls', () => {
    expect(componentSource).toContain('<LiveBenchmarkPanel');
    expect(componentSource).toContain('onRun={async () => {');
    expect(componentSource).toContain('Run live CPU and WebGPU spatial benchmark');
    expect(componentSource).toContain("await createDevice('webgpu-core')");
    expect(componentSource).toContain('POINT_COUNTS.map(count =>');
    expect(benchmarkDocumentation).toContain('opt-in benchmark');
  });
});
