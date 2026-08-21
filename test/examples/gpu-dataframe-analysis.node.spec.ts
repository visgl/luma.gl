// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type DocumentationEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: DocumentationEntry[]};

type DocumentationCategory = Extract<DocumentationEntry, {type: 'category'}>;

const REPOSITORY_DIRECTORY = process.cwd();
const GPU_DATAFRAME_DOCUMENT_IDENTIFIER = 'api-reference/experimental/gpu-dataframe';
const GPU_DATAFRAME_DOCUMENT_PATH = '/docs/api-reference/experimental/gpu-dataframe';
const GPU_DATAFRAME_EXAMPLE_PATH = '/examples/experimental/gpu-data-analysis';
const GPU_DATAFRAME_DOCUMENTATION_FILES = [
  'gpu-dataframe.md',
  'gpu-dataframe-operations.md',
  'gpu-dataframe-expressions.md',
  'gpu-dataframe-aggregation.md',
  'gpu-dataframe-sorting.md',
  'gpu-dataframe-indexes-joins.md'
] as const;

describe('GPU Dataframe documentation and opt-in Arrow benchmark integration', () => {
  test('registers the dedicated GPU Dataframe reference in the GPU Dataframe section', () => {
    const tableOfContents = JSON.parse(
      readFileSync(path.join(REPOSITORY_DIRECTORY, 'docs/table-of-contents.json'), 'utf8')
    ) as DocumentationEntry[];
    const experimentalCategories: DocumentationCategory[] = [];

    const visit = (entries: readonly DocumentationEntry[]): void => {
      for (const entry of entries) {
        if (typeof entry === 'string' || entry.type !== 'category') {
          continue;
        }
        if (entry.label === '@luma.gl/experimental') {
          experimentalCategories.push(entry);
        }
        visit(entry.items);
      }
    };
    visit(tableOfContents);

    expect(experimentalCategories).toHaveLength(1);
    const dataframesCategory = experimentalCategories[0].items.find(
      entry => typeof entry !== 'string' && entry.label === 'GPU Dataframe'
    );
    expect(dataframesCategory).toBeDefined();
    expect(dataframesCategory?.items).toContain(GPU_DATAFRAME_DOCUMENT_IDENTIFIER);

    const documentation = readGPUDataFrameDocumentation();
    const overview = readRepositoryFile('docs/api-reference/experimental/README.md');
    const releaseNotes = readRepositoryFile('docs/whats-new.md');
    const experimentalTabs = readRepositoryFile(
      'website/src/components/docs/experimental-docs-catalog.ts'
    );

    expect(documentation).toContain('<ExperimentalDocsTabs active="gpu-dataframe" />');
    expect(overview).toContain(GPU_DATAFRAME_DOCUMENT_PATH);
    expect(releaseNotes).toContain(GPU_DATAFRAME_DOCUMENT_PATH);
    expect(experimentalTabs).toMatch(
      /id:\s*['"]gpu-dataframe['"][^}]*href:\s*['"]\/docs\/api-reference\/experimental\/gpu-dataframe['"]/
    );
  });

  test('documents caller-owned GPU work, supported joins, and accurate limitations', () => {
    const documentation = readGPUDataFrameDocumentation();

    expect(documentation).not.toContain('@luma.gl/arrow');
    expect(documentation).toContain("from '@luma.gl/experimental/gpu-dataframe'");
    expect(documentation).toContain('GPUCommandGraph');
    expect(documentation).toContain('selectionMask');
    expect(documentation).toContain('rowIndices');
    expect(documentation).toContain('selectedCounts');
    expect(documentation).toContain('innerJoin');
    expect(documentation).toContain('lookup');
    expect(documentation).toContain('float32');
    expect(documentation).toContain('sint32');
    expect(documentation).toContain('uint32');
    expect(documentation).toMatch(/validity/i);
    expect(documentation).toMatch(/readback/i);
    expect(documentation).toContain(GPU_DATAFRAME_EXAMPLE_PATH);
  });

  test('keeps the existing WebGPU example route and benchmark explicitly opt-in', () => {
    const example = readRepositoryFile('examples/experimental/gpu-data-analysis/src/app.ts');
    const exampleShell = readRepositoryFile(
      'examples/experimental/gpu-data-analysis/src/app-shell.ts'
    );
    const websiteExample = readRepositoryFile(
      'website/content/examples/experimental/gpu-data-analysis.mdx'
    );

    expect(websiteExample).toContain('<GPUDataAnalysisExample />');
    expect(example).toContain("from './gpu-dataframe-benchmark'");
    expect(exampleShell).toContain('analysis-gpu-dataframe-benchmark-run');
    expect(exampleShell).toContain('analysis-gpu-dataframe-benchmark-status');
    expect(exampleShell).toContain('analysis-gpu-dataframe-benchmark-results');
    expect(exampleShell).toContain('data-gpu-dataframe-benchmark');
    expect(exampleShell).toContain('data-gpu-dataframe-benchmark-phases');
    expect(exampleShell).toContain('data-state="idle"');
    expect(exampleShell).toContain('data-validated="false"');
    expect(example).toContain("addEventListener('click', this.handleGPUDataFrameBenchmark)");
    expect(example).toContain('this.benchmarkController?.abort()');
    expect(exampleShell).toContain('data-gpu-dataframe-benchmark-rows');
    expect(exampleShell).toContain('data-gpu-dataframe-benchmark-iterations');
    expect(exampleShell).toContain('1,048,576 rows');
    expect(example).toContain('warmupIterations: 1');
    expect(example).toContain('MEDIAN OPERATION COMPARISONS');
    expect(example).toContain('data-gpu-dataframe-crossover');

    for (const phase of ['upload', 'compile', 'index', 'execution', 'readback', 'cpu']) {
      expect(example).toContain(`['${phase}',`);
    }
  });

  test('keeps Arrow conversion in its adapter and explicitly fences bounded CPU/GPU comparisons', () => {
    const benchmark = readRepositoryFile(
      'examples/experimental/gpu-data-analysis/src/gpu-dataframe-benchmark.ts'
    );
    const experimentalPackage = JSON.parse(
      readRepositoryFile('modules/experimental/package.json')
    ) as {
      dependencies?: Record<string, string>;
    };
    const gpuPackage = JSON.parse(readRepositoryFile('modules/gpgpu/package.json')) as {
      dependencies?: Record<string, string>;
    };

    expect(benchmark).toContain("from '@luma.gl/arrow'");
    expect(benchmark).toContain("from '@luma.gl/experimental/gpu-dataframe'");
    expect(benchmark).toContain("from 'apache-arrow'");
    expect(benchmark).toContain('makeGPUAnalyticsTableFromArrowTable');
    expect(benchmark).toContain('runGPUDataFrameBenchmark');
    expect(benchmark).toContain('createFence');
    expect(benchmark).toContain('readbackBytes');
    expect(benchmark).toContain('signal');
    expect(benchmark).toContain('MAXIMUM_ROW_COUNT = 1_048_576');
    expect(benchmark).toContain('summarizeGPUDataFrameBenchmarkSamples');
    expect(benchmark).not.toContain('BenchmarkSourceRow[]');
    expect(experimentalPackage.dependencies?.['apache-arrow']).toBeUndefined();
    expect(gpuPackage.dependencies?.['apache-arrow']).toBeUndefined();
  });
});

function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(REPOSITORY_DIRECTORY, relativePath), 'utf8');
}

function readGPUDataFrameDocumentation(): string {
  return GPU_DATAFRAME_DOCUMENTATION_FILES.map(fileName =>
    readRepositoryFile(`docs/api-reference/experimental/${fileName}`)
  ).join('\n');
}
