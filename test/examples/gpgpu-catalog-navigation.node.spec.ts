// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

type ExampleCategory = Extract<ExampleSidebarEntry, {type: 'category'}>;

const EXAMPLES_DIRECTORY = path.join(process.cwd(), 'website/content/examples');

describe('9.4 compute example catalog navigation', () => {
  test('groups retained showcases by user outcome', () => {
    expect(readCategoryIdentifiers(getCategory('Effects'))).toEqual(
      expect.arrayContaining([
        'showcase/dof',
        'showcase/postprocessing',
        'experimental/bloom',
        'experimental/deferred-rendering',
        'experimental/shadow-map',
        'experimental/a-buffer'
      ])
    );

    expect(readCategoryIdentifiers(getCategory('API'))).toEqual(
      expect.arrayContaining(['experimental/antialiasing'])
    );

    expect(readCategoryIdentifiers(getCategory('GPGPU'))).toEqual(['experimental/gpgpu']);

    expect(readCategoryIdentifiers(getCategory('Experimental'))).toEqual(
      expect.arrayContaining(['showcase/gaussian-splat-viewer'])
    );
    expect(readCategoryIdentifiers(getCategory('Experimental'))).not.toContain(
      'showcase/gaussian-splats'
    );

    expect(readCategoryIdentifiers(getCategory('Simulation and data'))).toEqual(
      expect.arrayContaining([
        'showcase/vector-field-lab',
        'showcase/quantum-state-studio',
        'showcase/llm-network',
        'experimental/gpt-2'
      ])
    );

    const categoryLabels = readTableOfContents()
      .filter(
        (entry): entry is ExampleCategory => typeof entry !== 'string' && entry.type === 'category'
      )
      .map(({label}) => label);
    expect(categoryLabels).not.toContain('Apache Arrow (Experimental)');
    expect(categoryLabels.slice(0, 8)).toEqual([
      'Showcase',
      'API',
      'GPGPU',
      'Effects',
      'Tutorials',
      'Integrations',
      'WebGPU',
      'Experimental'
    ]);
    expect(categoryLabels.indexOf('Simulation and data')).toBeGreaterThan(
      categoryLabels.indexOf('Experimental')
    );
  });

  test('keeps every catalog route live and removes v10, deck, and dedicated graph previews', () => {
    const exampleIdentifiers = readCategoryIdentifiers({
      type: 'category',
      label: 'root',
      items: readTableOfContents()
    });

    for (const exampleIdentifier of exampleIdentifiers) {
      expect(existsSync(path.join(EXAMPLES_DIRECTORY, `${exampleIdentifier}.mdx`))).toBe(true);
      expect(exampleIdentifier).not.toMatch(/^(?:deck|v10)\//);
      expect(exampleIdentifier).not.toBe('experimental/gpu-graph-explorer');
      expect(exampleIdentifier).not.toMatch(/^arrow\/arrow-(?:geoarrow|polygons)$/);
    }

    expect(exampleIdentifiers).not.toEqual(
      expect.arrayContaining([
        'experimental/gpu-sort',
        'experimental/gpu-data-analysis',
        'showcase/million-row-crossfilter',
        'showcase/raster-lab',
        'showcase/billion-point-spatial-atlas',
        'experimental/lucim-volume-lab',
        'experimental/gpu-trace-scene'
      ])
    );

    expect(existsSync(path.join(process.cwd(), 'examples/deck'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'examples/v10'))).toBe(false);
  });
});

function readTableOfContents(): ExampleSidebarEntry[] {
  return JSON.parse(
    readFileSync(path.join(EXAMPLES_DIRECTORY, 'table-of-contents.json'), 'utf8')
  ) as ExampleSidebarEntry[];
}

function getCategory(label: string): ExampleCategory {
  const category = readTableOfContents().find(
    (entry): entry is ExampleCategory =>
      typeof entry !== 'string' && entry.type === 'category' && entry.label === label
  );
  if (!category) {
    throw new Error(`Missing ${label} example category`);
  }
  return category;
}

function readCategoryIdentifiers(category: ExampleCategory): string[] {
  const identifiers: string[] = [];
  for (const entry of category.items) {
    if (typeof entry === 'string') {
      identifiers.push(entry);
    } else if (entry.type === 'doc') {
      identifiers.push(entry.id);
    } else {
      identifiers.push(...readCategoryIdentifiers(entry));
    }
  }
  return identifiers;
}
