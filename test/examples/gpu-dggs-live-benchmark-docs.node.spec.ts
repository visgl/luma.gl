// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {describe, expect, test} from 'vitest';

const documentationPages = ['gpu-dggs', 'gpu-h3', 'gpu-a5'].map(page =>
  readFileSync(new URL(`../../docs/api-reference/experimental/${page}.md`, import.meta.url), 'utf8')
);
const benchmarkComponent = readFileSync(
  new URL('../../website/src/components/docs/dggs-cell-projection-benchmark.tsx', import.meta.url),
  'utf8'
);
const packageManifest = readFileSync(
  new URL('../../modules/gpgpu/package.json', import.meta.url),
  'utf8'
);

describe('GPU DGGS documentation', () => {
  test('publishes shared, H3, and A5 pages with one live benchmark', () => {
    for (const documentation of documentationPages) {
      expect(documentation).toContain('<DGGSCellProjectionBenchmark />');
      expect(documentation).toContain(
        "import {DGGSCellProjectionBenchmark} from '@site/src/components/docs/dggs-cell-projection-benchmark';"
      );
    }
    expect(benchmarkComponent).toContain('runGPUDGGSCellProjectionBenchmark');
    expect(benchmarkComponent).toContain('Live DGGS cell-center projection');
    expect(benchmarkComponent).toContain('Correctness checks');
  });

  test('keeps the reusable primitive and optional benchmark in isolated package entry points', () => {
    expect(packageManifest).toContain('"./gpu-dggs"');
    expect(packageManifest).toContain('"./gpu-dggs/benchmarks"');
    expect(documentationPages[0]).toContain('GPUDGGSCellProjection');
    expect(documentationPages[0]).toContain("'@luma.gl/gpgpu/gpu-dggs/benchmarks'");
  });
});
