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
    const computeCategory = getCategory('Compute and analytics');
    const nestedCategories = computeCategory.items.filter(
      (entry): entry is ExampleCategory => typeof entry !== 'string' && entry.type === 'category'
    );

    expect(nestedCategories.map(({label}) => label)).toEqual([
      'Rendering and inspection',
      'Simulation and data'
    ]);
    expect(readCategoryIdentifiers(nestedCategories[0])).toEqual(
      expect.arrayContaining([
        'experimental/gpu-frustum-culling',
        'experimental/gpu-trace-viewer',
        'experimental/gpu-trace-scene',
        'experimental/gpu-scene-graph'
      ])
    );
    expect(readCategoryIdentifiers(nestedCategories[1])).toEqual(
      expect.arrayContaining([
        'showcase/million-row-crossfilter',
        'showcase/raster-lab',
        'showcase/billion-point-spatial-atlas',
        'experimental/gpu-sort',
        'experimental/gpu-data-analysis'
      ])
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
