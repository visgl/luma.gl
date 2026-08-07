// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';

import {describe, expect, test} from 'vitest';

const SOURCE_DIRECTORY = new URL('../../modules/experimental/src/luvs/', import.meta.url);
const DOCUMENTATION_URL = new URL('../../docs/api-reference/experimental/luvs.md', import.meta.url);

describe('luVS upstream attribution', () => {
  test('keeps every independently implemented production source MIT-licensed', () => {
    const sourceFileNames = readdirSync(SOURCE_DIRECTORY)
      .filter(sourceFileName => sourceFileName.endsWith('.ts'))
      .sort();

    expect(sourceFileNames).toEqual([
      'embedding-matrix.ts',
      'gpu-clustering-utils.ts',
      'gpu-ivf-flat-index.ts',
      'gpu-k-means.ts',
      'gpu-similarity-search.ts',
      'index.ts',
      'types.ts'
    ]);

    for (const sourceFileName of sourceFileNames) {
      const source = readFileSync(new URL(sourceFileName, SOURCE_DIRECTORY), 'utf8');

      expect(source.split('\n').slice(0, 4)).toEqual([
        '// luma.gl',
        '// SPDX-License-Identifier: MIT',
        '// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors',
        '// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.'
      ]);
    }
  });

  test('documents cuVS inspiration without asserting copied source, affiliation, or parity', () => {
    const documentation = readFileSync(DOCUMENTATION_URL, 'utf8');
    const attribution = documentation.match(/(?:^|\n)## Attribution\n([\s\S]*?)(?=\n## |$)/)?.[1];

    expect(attribution).toBeDefined();
    expect(attribution).toContain('[NVIDIA RAPIDS cuVS](https://github.com/NVIDIA/cuvs)');
    expect(attribution).toContain(
      '[Apache License 2.0](https://github.com/NVIDIA/cuvs/blob/main/LICENSE)'
    );
    expect(attribution).toContain('independently implemented');
    expect(attribution).toContain('MIT-licensed');
    expect(attribution).toContain('No cuVS source code, CUDA');
    expect(attribution).toContain('FAISS implementations are copied');
    expect(attribution).toContain('not affiliated with or endorsed');
    expect(attribution).toContain('neither implements a compatible cuVS API');
    expect(attribution).toContain('nor claims feature');
    expect(attribution).toContain('parity.');
  });

  test('explains table ownership, deterministic clustering, indexed identity, and search tradeoffs', () => {
    const documentation = readFileSync(DOCUMENTATION_URL, 'utf8');

    expect(documentation).toContain('## Overview');
    expect(documentation).toContain('## Concepts');
    expect(documentation).toContain(
      '### Why embeddings are table columns rather than a second matrix owner'
    );
    expect(documentation).toContain('### Why deterministic k-means precedes an inverted index');
    expect(documentation).toContain('### What an IVF-flat index actually stores');
    expect(documentation).toContain('### Probes exchange recall for bounded candidate work');
    expect(documentation).toContain('### Lifecycle, ownership, and current limits');
    expect(documentation).toContain('### Device loss invalidates compiled graphs and indexes');
    expect(documentation).toContain('listOffsets:');
    expect(documentation).toContain('listSourceIds:');
    expect(documentation).toContain('listRowIndices:');
    expect(documentation).toContain("fallback: 'expand'");
    expect(documentation).toContain('recall@K');
    expect(documentation).toContain('maximum storage-buffer binding size');
    expect(documentation).toContain('Float32 atomic addition');
    expect(documentation).toContain('device.lost');
    expect(documentation).toContain('every encoding of that graph reruns all declared build');
    expect(documentation).toMatch(/a\s+separate search-only graph/u);
    expect(documentation).toContain('additional exact-only constraints');
  });
});
