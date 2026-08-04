// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {parse} from 'yaml';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

type ExampleCategory = Extract<ExampleSidebarEntry, {type: 'category'}>;

const EXAMPLES_DIRECTORY = path.join(process.cwd(), 'website/content/examples');
const DOCUMENTATION_DIRECTORY = path.join(process.cwd(), 'docs');
const GENERAL_PURPOSE_GPU_EXAMPLE_IDENTIFIERS = [
  'showcase/crossfilter-supremacy',
  'showcase/billion-point-spatial-atlas',
  'deck/luspatial-taxi',
  'experimental/gpt-2',
  'v10/gpgpu',
  'experimental/gpu-frustum-culling',
  'experimental/gpu-trace-viewer',
  'experimental/gpu-trace-scene',
  'experimental/gpu-scene-graph',
  'experimental/gpu-sort',
  'experimental/gpu-data-analysis'
] as const;

describe('GPGPU example catalog navigation', () => {
  test('places a dedicated GPGPU section immediately after WebGPU', () => {
    const tableOfContents = readTableOfContents();
    const webGPUCategoryIndex = tableOfContents.findIndex(
      entry => typeof entry !== 'string' && entry.type === 'category' && entry.label === 'WebGPU'
    );
    const generalPurposeGPUCategory = tableOfContents[webGPUCategoryIndex + 1];

    expect(webGPUCategoryIndex).toBeGreaterThanOrEqual(0);
    expect(generalPurposeGPUCategory).toMatchObject({type: 'category', label: 'GPGPU'});
    expect(
      tableOfContents.filter(
        entry => typeof entry !== 'string' && entry.type === 'category' && entry.label === 'GPGPU'
      )
    ).toHaveLength(1);
    expect(readCategoryIdentifiers(generalPurposeGPUCategory as ExampleCategory)).toEqual(
      expect.arrayContaining([...GENERAL_PURPOSE_GPU_EXAMPLE_IDENTIFIERS])
    );
  });

  test('keeps LuxFilter, luProj, and luSpatial discoverable through their real integrations', () => {
    const category = getCategory('GPGPU');
    const crossfilterExample = category.items[0];
    const spatialAtlasExample = category.items[1];
    const taxiExample = category.items[2];
    const spatialAtlasSource = readFileSync(
      path.join(process.cwd(), 'examples/showcase/billion-point-spatial-atlas/app.ts'),
      'utf8'
    );
    const taxiExampleSource = readFileSync(
      path.join(EXAMPLES_DIRECTORY, 'deck/luspatial-taxi.mdx'),
      'utf8'
    );

    expect(crossfilterExample).toEqual({
      type: 'doc',
      id: 'showcase/crossfilter-supremacy',
      label: 'LuxFilter: Million-Point Crossfilter'
    });
    expect(spatialAtlasExample).toBe('showcase/billion-point-spatial-atlas');
    expect(taxiExample).toEqual({
      type: 'doc',
      id: 'deck/luspatial-taxi',
      label: 'luProj + luSpatial: Taxi Explorer'
    });
    expect(spatialAtlasSource).toContain("from '@luma.gl/experimental/geospatial'");
    expect(spatialAtlasSource).not.toContain("from '@luma.gl/experimental/luproj'");
    expect(taxiExampleSource).toContain('@luma.gl/experimental/luproj');
    expect(taxiExampleSource).toContain('@luma.gl/experimental/geospatial');
  });

  test('preserves every compute example route and WebGPU capability metadata', () => {
    const generalPurposeGPUCategory = getCategory('GPGPU');
    const webGPUCategory = getCategory('WebGPU');
    const webGPUExampleIdentifiers = new Set(readCategoryIdentifiers(webGPUCategory));

    for (const exampleIdentifier of readCategoryIdentifiers(generalPurposeGPUCategory)) {
      const examplePath = path.join(EXAMPLES_DIRECTORY, `${exampleIdentifier}.mdx`);

      expect(existsSync(examplePath), `${exampleIdentifier} must preserve its existing route`).toBe(
        true
      );
      expect(
        webGPUExampleIdentifiers.has(exampleIdentifier),
        `${exampleIdentifier} must not remain duplicated in WebGPU`
      ).toBe(false);

      const frontmatter = readFileSync(examplePath, 'utf8').match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatter, `${exampleIdentifier} must declare example metadata`).not.toBeNull();

      const metadata = parse(frontmatter![1]) as {
        sidebar_custom_props?: {backends?: string[]; topics?: string[]};
      };

      expect(
        metadata.sidebar_custom_props?.backends,
        `${exampleIdentifier} requires a WebGPU device`
      ).toEqual(['webgpu']);
      expect(
        metadata.sidebar_custom_props?.topics,
        `${exampleIdentifier} must remain discoverable as GPU compute`
      ).toContain('compute');
    }
  });

  test('keeps the GPU data and command-graph learning tracks beneath GPGPU', () => {
    const category = getCategory('GPGPU');
    const nestedCategories = category.items.filter(
      (entry): entry is ExampleCategory => typeof entry !== 'string' && entry.type === 'category'
    );

    expect(nestedCategories.map(({label}) => label)).toEqual([
      'GPU Data - luma v10',
      'GPU Command Graph - luma v10'
    ]);
    expect(readCategoryIdentifiers(nestedCategories[0])).toEqual(['v10/gpgpu']);
    expect(readCategoryIdentifiers(nestedCategories[1])).toEqual(
      expect.arrayContaining([
        'experimental/gpu-frustum-culling',
        'experimental/gpu-trace-viewer',
        'experimental/gpu-trace-scene',
        'experimental/gpu-scene-graph',
        'experimental/gpu-sort',
        'experimental/gpu-data-analysis'
      ])
    );
  });

  test('groups floating-point precision with GPGPU guides while preserving its canonical URL', () => {
    const documentationTableOfContents = JSON.parse(
      readFileSync(path.join(DOCUMENTATION_DIRECTORY, 'table-of-contents.json'), 'utf8')
    ) as ExampleSidebarEntry[];
    const applicationProgrammingInterfaceGuide = documentationTableOfContents.find(
      (entry): entry is ExampleCategory =>
        typeof entry !== 'string' && entry.type === 'category' && entry.label === 'API Guide'
    );
    const generalPurposeGPUProgramming = applicationProgrammingInterfaceGuide?.items.find(
      (entry): entry is ExampleCategory =>
        typeof entry !== 'string' &&
        entry.type === 'category' &&
        entry.label === 'GPGPU Programming'
    );
    const shaderProgramming = applicationProgrammingInterfaceGuide?.items.find(
      (entry): entry is ExampleCategory =>
        typeof entry !== 'string' &&
        entry.type === 'category' &&
        entry.label === 'Shader-Level Programming'
    );
    const precisionGuideIdentifier = 'api-guide/shaders/gpu-floating-point-precision';

    expect(applicationProgrammingInterfaceGuide).toBeDefined();
    expect(generalPurposeGPUProgramming).toBeDefined();
    expect(shaderProgramming).toBeDefined();
    expect(generalPurposeGPUProgramming?.items).toContain(precisionGuideIdentifier);
    expect(shaderProgramming?.items).not.toContain(precisionGuideIdentifier);
    expect(existsSync(path.join(DOCUMENTATION_DIRECTORY, `${precisionGuideIdentifier}.md`))).toBe(
      true
    );
  });

  test('shares GPGPU documentation tabs across precision guides and fp64 shader modules', () => {
    const precisionDocuments = [
      [
        'api-guide/shaders/gpu-floating-point-precision.md',
        'precision-guide',
        '/docs/api-guide/shaders/gpu-floating-point-precision'
      ],
      [
        'api-reference/shadertools/shader-modules/fp64.md',
        'fp64',
        '/docs/api-reference/shadertools/shader-modules/fp64'
      ],
      [
        'api-reference/shadertools/shader-modules/fp64-arithmetic.md',
        'fp64-arithmetic',
        '/docs/api-reference/shadertools/shader-modules/fp64-arithmetic'
      ]
    ] as const;
    const generalPurposeGPUTabs = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/gpgpu-docs-tabs.tsx'),
      'utf8'
    );

    for (const [documentPath, tabIdentifier, expectedRoute] of precisionDocuments) {
      const documentSource = readFileSync(path.join(DOCUMENTATION_DIRECTORY, documentPath), 'utf8');

      expect(documentSource).toContain(
        "import {GPGPUDocsTabs} from '@site/src/components/docs/gpgpu-docs-tabs';"
      );
      expect(documentSource).toContain(`<GPGPUDocsTabs active="${tabIdentifier}" />`);
      expect(documentSource).toContain(
        `<ShaderModuleDocsTabs group="precision" active="${tabIdentifier}" />`
      );
      expect(generalPurposeGPUTabs).toMatch(
        new RegExp(`id:\\s*['"]${tabIdentifier}['"][^}]*href:\\s*['"]${expectedRoute}['"]`)
      );
    }
  });
});

function readTableOfContents(): ExampleSidebarEntry[] {
  return JSON.parse(
    readFileSync(path.join(EXAMPLES_DIRECTORY, 'table-of-contents.json'), 'utf8')
  ) as ExampleSidebarEntry[];
}

function getCategory(categoryLabel: string): ExampleCategory {
  const category = readTableOfContents().find(
    (entry): entry is ExampleCategory =>
      typeof entry !== 'string' && entry.type === 'category' && entry.label === categoryLabel
  );

  if (!category) {
    throw new Error(`The ${categoryLabel} example category must exist`);
  }

  return category;
}

function readCategoryIdentifiers(category: ExampleCategory): string[] {
  const exampleIdentifiers: string[] = [];

  for (const entry of category.items) {
    if (typeof entry === 'string') {
      exampleIdentifiers.push(entry);
    } else if (entry.type === 'category') {
      exampleIdentifiers.push(...readCategoryIdentifiers(entry));
    } else {
      exampleIdentifiers.push(entry.id);
    }
  }

  return exampleIdentifiers;
}
