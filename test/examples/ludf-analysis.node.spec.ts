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
const LUDF_DOCUMENT_IDENTIFIER = 'api-reference/experimental/ludf';
const LUDF_DOCUMENT_PATH = '/docs/api-reference/experimental/ludf';
const LUDF_EXAMPLE_PATH = '/examples/experimental/gpu-data-analysis';

describe('luDF dataframe documentation and opt-in Arrow benchmark integration', () => {
  test('registers the dedicated luDF reference throughout both experimental navigation trees', () => {
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

    expect(experimentalCategories).toHaveLength(2);
    for (const category of experimentalCategories) {
      expect(category.items).toContain(LUDF_DOCUMENT_IDENTIFIER);
    }

    const documentation = readRepositoryFile('docs/api-reference/experimental/ludf.md');
    const overview = readRepositoryFile('docs/api-reference/experimental/README.md');
    const releaseNotes = readRepositoryFile('docs/whats-new.md');
    const experimentalTabs = readRepositoryFile(
      'website/src/components/docs/experimental-docs-tabs.tsx'
    );

    expect(documentation).toContain('<ExperimentalDocsTabs active="ludf" />');
    expect(overview).toContain(LUDF_DOCUMENT_PATH);
    expect(releaseNotes).toContain(LUDF_DOCUMENT_PATH);
    expect(experimentalTabs).toMatch(
      /id:\s*['"]ludf['"][^}]*href:\s*['"]\/docs\/api-reference\/experimental\/ludf['"]/
    );
  });

  test('documents real Arrow ingestion, owned GPU work, supported joins, and accurate limitations', () => {
    const documentation = readRepositoryFile('docs/api-reference/experimental/ludf.md');

    expect(documentation).toContain("from '@luma.gl/arrow'");
    expect(documentation).toContain("from '@luma.gl/experimental/ludf'");
    expect(documentation).toContain('makeGPUAnalyticsTableFromArrowTable');
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
    expect(documentation).toContain(LUDF_EXAMPLE_PATH);
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
    expect(example).toContain("from './ludf-benchmark'");
    expect(exampleShell).toContain('analysis-ludf-benchmark-run');
    expect(exampleShell).toContain('analysis-ludf-benchmark-status');
    expect(exampleShell).toContain('analysis-ludf-benchmark-results');
    expect(exampleShell).toContain('data-ludf-benchmark');
    expect(exampleShell).toContain('data-ludf-benchmark-phases');
    expect(exampleShell).toContain('data-state="idle"');
    expect(exampleShell).toContain('data-validated="false"');
    expect(example).toContain("addEventListener('click', this.handleLuDataFrameBenchmark)");
    expect(example).toContain('this.benchmarkController?.abort()');
    expect(exampleShell).toContain('data-ludf-benchmark-rows');
    expect(exampleShell).toContain('data-ludf-benchmark-iterations');
    expect(exampleShell).toContain('1,048,576 rows');
    expect(example).toContain('warmupIterations: 1');
    expect(example).toContain('MEDIAN OPERATION COMPARISONS');
    expect(example).toContain('data-ludf-crossover');

    for (const phase of ['upload', 'compile', 'index', 'execution', 'readback', 'cpu']) {
      expect(example).toContain(`['${phase}',`);
    }
  });

  test('keeps Arrow conversion in its adapter and explicitly fences bounded CPU/GPU comparisons', () => {
    const benchmark = readRepositoryFile(
      'examples/experimental/gpu-data-analysis/src/ludf-benchmark.ts'
    );
    const tablesPackage = JSON.parse(readRepositoryFile('modules/tables/package.json')) as {
      dependencies?: Record<string, string>;
    };
    const gpuPackage = JSON.parse(readRepositoryFile('modules/gpgpu/package.json')) as {
      dependencies?: Record<string, string>;
    };

    expect(benchmark).toContain("from '@luma.gl/arrow'");
    expect(benchmark).toContain("from '@luma.gl/experimental/ludf'");
    expect(benchmark).toContain("from 'apache-arrow'");
    expect(benchmark).toContain('makeGPUAnalyticsTableFromArrowTable');
    expect(benchmark).toContain('runLuDataFrameBenchmark');
    expect(benchmark).toContain('createFence');
    expect(benchmark).toContain('readbackBytes');
    expect(benchmark).toContain('signal');
    expect(benchmark).toContain('MAXIMUM_ROW_COUNT = 1_048_576');
    expect(benchmark).toContain('summarizeLuDataFrameBenchmarkSamples');
    expect(benchmark).not.toContain('BenchmarkSourceRow[]');
    expect(tablesPackage.dependencies?.['apache-arrow']).toBeUndefined();
    expect(gpuPackage.dependencies?.['apache-arrow']).toBeUndefined();
  });
});

function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(REPOSITORY_DIRECTORY, relativePath), 'utf8');
}
