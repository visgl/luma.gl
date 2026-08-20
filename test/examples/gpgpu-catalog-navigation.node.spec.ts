// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
  'showcase/million-row-crossfilter',
  'showcase/raster-lab',
  'showcase/billion-point-spatial-atlas',
  'experimental/gpt-2',
  'v10/gpgpu',
  'experimental/gpu-frustum-culling',
  'experimental/gpu-trace-viewer',
  'experimental/gpu-trace-scene',
  'experimental/gpu-scene-graph',
  'showcase/vector-field-lab',
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

  test('keeps GPUCrossfilter, GPURaster, luProj, and luSpatial discoverable through their real integrations', () => {
    const category = getCategory('GPGPU');
    const graphModulesCategory = category.items.find(
      (entry): entry is ExampleCategory =>
        typeof entry !== 'string' &&
        entry.type === 'category' &&
        entry.label === 'GPGPU Graph Modules'
    );
    const getGraphModuleExample = (identifier: string): ExampleSidebarEntry | undefined =>
      graphModulesCategory?.items.find(entry =>
        typeof entry === 'string'
          ? entry === identifier
          : entry.type === 'doc' && entry.id === identifier
      );
    const crossfilterExample = getGraphModuleExample('showcase/million-row-crossfilter');
    const rasterLabExample = getGraphModuleExample('showcase/raster-lab');
    const spatialAtlasExample = getGraphModuleExample('showcase/billion-point-spatial-atlas');
    const graphLayersCategory = getCategory('GPU Graph Layers - deck.gl v10');
    const taxiExample = graphLayersCategory.items.find(
      entry => typeof entry !== 'string' && entry.id === 'deck/luspatial-taxi'
    );
    const crossfilterExampleSource = readFileSync(
      path.join(EXAMPLES_DIRECTORY, 'showcase/million-row-crossfilter.mdx'),
      'utf8'
    );
    const rasterLabExampleSource = readFileSync(
      path.join(EXAMPLES_DIRECTORY, 'showcase/raster-lab.mdx'),
      'utf8'
    );
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
      id: 'showcase/million-row-crossfilter',
      label: 'GPUCrossfilter: Million-Row Crossfilter Explorer'
    });
    expect(crossfilterExampleSource).toContain("title: 'Million-Row Crossfilter Explorer'");
    expect(crossfilterExampleSource).toContain('<MillionRowCrossfilterExample />');
    expect(
      existsSync(
        path.join(
          process.cwd(),
          'website/static/images/examples/showcase/million-row-crossfilter.jpg'
        )
      )
    ).toBe(true);
    expect(rasterLabExample).toEqual({
      type: 'doc',
      id: 'showcase/raster-lab',
      label: 'GPURaster: Satellite Raster Lab'
    });
    expect(rasterLabExampleSource).toContain('<RasterLabExample />');
    expect(rasterLabExampleSource).toContain('@luma.gl/experimental/gpu-raster');
    expect(spatialAtlasExample).toBe('showcase/billion-point-spatial-atlas');
    expect(taxiExample).toEqual({
      type: 'doc',
      id: 'deck/luspatial-taxi',
      label: 'luProj + luSpatial: Taxi Explorer'
    });
    expect(spatialAtlasSource).toContain("from '@luma.gl/experimental/geospatial'");
    expect(spatialAtlasSource).not.toContain("from '@luma.gl/experimental/gpu-project'");
    expect(taxiExampleSource).toContain('@luma.gl/experimental/gpu-project');
    expect(taxiExampleSource).toContain('@luma.gl/experimental/geospatial');
  });

  test('registers GPUCrossfilter throughout experimental API navigation', () => {
    const documentationTableOfContents = JSON.parse(
      readFileSync(path.join(DOCUMENTATION_DIRECTORY, 'table-of-contents.json'), 'utf8')
    ) as ExampleSidebarEntry[];
    const experimentalCategories: ExampleCategory[] = [];

    const collectExperimentalCategories = (entries: ExampleSidebarEntry[]): void => {
      for (const entry of entries) {
        if (typeof entry === 'string' || entry.type !== 'category') continue;
        if (entry.label === '@luma.gl/experimental') experimentalCategories.push(entry);
        collectExperimentalCategories(entry.items);
      }
    };

    collectExperimentalCategories(documentationTableOfContents);
    expect(experimentalCategories).toHaveLength(1);
    const crossfilterCategory = experimentalCategories[0].items.find(
      entry => typeof entry !== 'string' && entry.label === 'GPU Crossfilter'
    );
    expect(crossfilterCategory).toBeDefined();
    expect(crossfilterCategory?.items).toContain('api-reference/experimental/gpu-crossfilter');

    const documentationSource = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'api-reference/experimental/gpu-crossfilter.md'),
      'utf8'
    );
    const experimentalOverviewSource = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'api-reference/experimental/README.md'),
      'utf8'
    );
    const experimentalTabsSource = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/experimental-docs-catalog.ts'),
      'utf8'
    );

    expect(documentationSource).toContain('<ExperimentalDocsTabs active="gpu-crossfilter" />');
    expect(experimentalOverviewSource).toContain(
      '/docs/api-reference/experimental/gpu-crossfilter'
    );
    expect(experimentalTabsSource).toMatch(
      /id:\s*['"]gpu-crossfilter['"][^}]*href:\s*['"]\/docs\/api-reference\/experimental\/gpu-crossfilter['"]/
    );
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

  test('orders the GPGPU graph before its modules and folds GPU data into the graph', () => {
    const category = getCategory('GPGPU');
    const nestedCategories = category.items.filter(
      (entry): entry is ExampleCategory => typeof entry !== 'string' && entry.type === 'category'
    );

    expect(nestedCategories.map(({label}) => label)).toEqual([
      'GPGPU Graph',
      'GPGPU Graph Modules'
    ]);
    expect(readCategoryIdentifiers(nestedCategories[0])).toEqual([
      'v10/gpgpu',
      'experimental/gpu-frustum-culling',
      'experimental/gpu-trace-viewer',
      'experimental/gpu-graph-explorer',
      'experimental/gpu-trace-scene',
      'experimental/gpu-scene-graph',
      'showcase/vector-field-lab',
      'experimental/gpu-sort',
      'experimental/gpu-data-analysis'
    ]);
    expect(readCategoryIdentifiers(nestedCategories[1])).toEqual([
      'showcase/million-row-crossfilter',
      'showcase/raster-lab',
      'showcase/billion-point-spatial-atlas',
      'experimental/gpt-2'
    ]);
  });

  test('ends with focused GPUGraph deck.gl integrations', () => {
    const tableOfContents = readTableOfContents();
    const finalEntry = tableOfContents.at(-1);

    expect(finalEntry).toMatchObject({
      type: 'category',
      label: 'GPU Graph Layers - deck.gl v10'
    });
    expect(readCategoryIdentifiers(finalEntry as ExampleCategory)).toEqual([
      'deck/luspatial-taxi',
      'deck/gpu-graph-explorer',
      'deck/gpu-culled-trace'
    ]);
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
