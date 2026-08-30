// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = new URL('../..', import.meta.url);
const BATCH_HASH_INDEX_DOCUMENT = 'api-reference/experimental/gpu-core/gpu-batch-hash-index';

function readRepositoryText(repositoryPath: string): string {
  return readFileSync(fileURLToPath(new URL(repositoryPath, REPOSITORY_ROOT)), 'utf8');
}

function countDocumentReferences(value: unknown, documentIdentifier: string): number {
  if (typeof value === 'string') {
    return Number(value === documentIdentifier);
  }
  if (Array.isArray(value)) {
    return value.reduce<number>(
      (referenceCount, item) => referenceCount + countDocumentReferences(item, documentIdentifier),
      0
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).reduce<number>(
      (referenceCount, item) => referenceCount + countDocumentReferences(item, documentIdentifier),
      0
    );
  }
  return 0;
}

describe('GPU command graph feature documentation', () => {
  test('explains active physical overlap, writable aliases, and every graph command type', () => {
    const documentation = readRepositoryText(
      'docs/api-reference/experimental/gpu-core/gpu-command-graph.md'
    );

    expect(documentation).toContain('Physical buffer overlap and writable aliases');
    expect(documentation).toContain('both are read-only');
    expect(documentation).toContain('storage-read-write');
    expect(documentation).toContain('copy-destination');
    expect(documentation).toContain('DynamicBuffer');
    expect(documentation).toContain('options.buffers');
    expect(documentation).toContain('### `addComputePass(node)`');
    expect(documentation).toContain('### `addRenderPass(node)`');
    expect(documentation).toContain('### `addCopyPass(node)`');
    expect(documentation).toContain('| `GPUBatchHashIndex` |');
    expect(documentation).not.toContain(
      'handles, including their per-encoding overrides, must not resolve to the same physical buffer'
    );
  });

  test('documents preserved-batch hash indexing, composition, diagnostics, and ownership', () => {
    const documentation = readRepositoryText(`docs/${BATCH_HASH_INDEX_DOCUMENT}.md`);

    for (const expectedFeature of [
      'Why this feature exists',
      'firstValues: [100, 400, 900]',
      'GPUHashIndexQuery',
      'GPUBatchHashJoin',
      'outputLeftRows',
      'outputRightRows',
      'silently excludes a row',
      '0xffffffff',
      '[unique keys, duplicate rows, overflow rows, invalid rows, total probes, maximum probes]',
      'Ownership, commands, and repeated execution'
    ]) {
      expect(documentation, expectedFeature).toContain(expectedFeature);
    }
  });

  test('exposes batch hash indexing through the reference navigation and graph tabs', () => {
    const tableOfContents = JSON.parse(readRepositoryText('docs/table-of-contents.json'));
    const tabs = readRepositoryText('website/src/components/docs/experimental-docs-catalog.ts');
    const overview = readRepositoryText('docs/api-reference/experimental/gpu-core/README.md');
    const hashIndex = readRepositoryText(
      'docs/api-reference/experimental/gpu-core/gpu-hash-index.md'
    );

    expect(countDocumentReferences(tableOfContents, BATCH_HASH_INDEX_DOCUMENT)).toBe(1);
    expect(tabs).toContain("id: 'batch-hash-index'");
    expect(tabs).toContain(BATCH_HASH_INDEX_DOCUMENT);
    expect(overview).toContain(`/docs/${BATCH_HASH_INDEX_DOCUMENT}`);
    expect(hashIndex).toContain(BATCH_HASH_INDEX_DOCUMENT);
  });
});
