// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {parse} from 'yaml';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

type ExampleCatalogMetadata = {
  backends?: string[];
  difficulty?: string;
  display?: string;
  maturity?: string;
  topics?: string[];
};

type LiveExample = {
  id: string;
  categories: string[];
  metadata?: ExampleCatalogMetadata;
};

const EXAMPLES_DIRECTORY = path.join(process.cwd(), 'website/content/examples');
const WEBGPU_ONLY_EXAMPLES = new Set([
  'api/render-bundles',
  'experimental/advanced-effects',
  'experimental/deferred-rendering',
  'experimental/shadow-map',
  'experimental/spectral-caustics',
  'experimental/volumetric-fire-forge'
]);
const WEBGL_ONLY_EXAMPLES = new Set([
  'integrations/external-context',
  'integrations/react-strict-mode',
  'tutorials/transform-feedback',
  'tutorials/transform'
]);
const HIDDEN_EXAMPLES = new Set([
  'experimental/gpu-sort',
  'experimental/gpu-data-analysis',
  'showcase/million-row-crossfilter',
  'showcase/raster-lab',
  'showcase/billion-point-spatial-atlas',
  'experimental/lucim-volume-lab',
  'experimental/gpu-trace-scene',
  'showcase/packet-spraying'
]);
const LIVE_EXAMPLES = readLiveExamples();
const requireCommonJSModule = createRequire(import.meta.url);

describe('live example catalog metadata', () => {
  test('discovers Triangle Geometry immediately after Hello Triangle with a real thumbnail', () => {
    const tutorialExamples = LIVE_EXAMPLES.filter(({categories}) => categories[0] === 'Tutorials');
    const helloTriangleIndex = tutorialExamples.findIndex(
      ({id}) => id === 'tutorials/hello-triangle'
    );
    const triangleGeometryExample = tutorialExamples[helloTriangleIndex + 1];

    expect(helloTriangleIndex).toBeGreaterThanOrEqual(0);
    expect(triangleGeometryExample).toEqual({
      id: 'tutorials/hello-triangle-geometry',
      categories: ['Tutorials'],
      metadata: {
        backends: ['webgpu', 'webgl2'],
        difficulty: 'tutorial',
        maturity: 'stable',
        topics: ['fundamentals', 'rendering', 'geometry', 'shaders']
      }
    });
    expect(
      existsSync(
        path.join(
          process.cwd(),
          'website/static/images/examples/tutorials/hello-triangle-geometry.jpg'
        )
      )
    ).toBe(true);
  });

  test('keeps the legacy sidebar synchronized with the authoritative example catalog', () => {
    const tableOfContents = JSON.parse(
      readFileSync(path.join(EXAMPLES_DIRECTORY, 'table-of-contents.json'), 'utf8')
    ) as ExampleSidebarEntry[];
    const legacySidebar = requireCommonJSModule(
      path.join(process.cwd(), 'website/content/sidebar-examples.js')
    ) as {examplesSidebar: ExampleSidebarEntry[]};

    expect(legacySidebar.examplesSidebar).toEqual(tableOfContents);
  });

  test('keeps the instancing showcase without a duplicate Arrow instancing example', () => {
    const exampleIdentifiers = new Set(LIVE_EXAMPLES.map(({id}) => id));
    const websiteExamples = readFileSync(
      path.join(process.cwd(), 'website/src/examples.tsx'),
      'utf8'
    );
    const websiteConfiguration = readFileSync(
      path.join(process.cwd(), 'website/docusaurus.config.js'),
      'utf8'
    );

    expect(exampleIdentifiers.has('showcase/instancing')).toBe(true);
    expect(exampleIdentifiers.has('arrow/arrow-instancing')).toBe(false);
    expect(existsSync(path.join(EXAMPLES_DIRECTORY, 'arrow/arrow-instancing.mdx'))).toBe(false);
    expect(websiteExamples).not.toContain('ArrowInstancingExample');
    expect(websiteExamples).not.toContain("from '../../examples/arrow/arrow-instancing/app'");
    expect(websiteConfiguration).toMatch(
      /from:\s*\[['"]\/examples\/arrow\/arrow-instancing['"]\],\s*to:\s*['"]\/examples\/showcase\/instancing['"]/
    );
  });

  test('provides complete, curated filters for every sidebar example', () => {
    expect(LIVE_EXAMPLES.length).toBeGreaterThan(0);

    for (const {id, metadata} of LIVE_EXAMPLES) {
      expect(metadata, `${id} requires sidebar_custom_props`).toBeDefined();
      expect(metadata?.backends, `${id} requires at least one supported backend`).not.toHaveLength(
        0
      );
      expect(
        metadata?.backends?.every(backend => backend === 'webgpu' || backend === 'webgl2'),
        `${id} has an unsupported backend`
      ).toBe(true);
      expect(
        ['tutorial', 'intermediate', 'advanced'].includes(metadata?.difficulty || ''),
        `${id} has an invalid difficulty`
      ).toBe(true);
      expect(
        ['stable', 'experimental'].includes(metadata?.maturity || ''),
        `${id} has an invalid maturity`
      ).toBe(true);
      expect(metadata?.topics?.length, `${id} requires at least two topics`).toBeGreaterThanOrEqual(
        2
      );
      expect(metadata?.topics?.length, `${id} allows at most five topics`).toBeLessThanOrEqual(5);
      expect(new Set(metadata?.topics).size, `${id} has duplicate topics`).toBe(
        metadata?.topics?.length
      );
    }
  });

  test('matches WebGPU-only and WebGL2-only examples to their website device wrappers', () => {
    for (const {id, categories, metadata} of LIVE_EXAMPLES) {
      const expectedBackends = WEBGL_ONLY_EXAMPLES.has(id)
        ? ['webgl2']
        : ['WebGPU', 'Compute and analytics', 'Simulation and data'].includes(categories[0]) ||
            WEBGPU_ONLY_EXAMPLES.has(id)
          ? ['webgpu']
          : ['webgpu', 'webgl2'];

      expect(metadata?.backends, `${id} has inaccurate backend metadata`).toEqual(expectedBackends);
    }
  });

  test('labels tutorials and experimental compute tracks consistently', () => {
    for (const {id, categories, metadata} of LIVE_EXAMPLES) {
      if (categories[0] === 'Tutorials') {
        expect(metadata?.difficulty, `${id} must use the tutorial difficulty`).toBe('tutorial');
      }

      if (categories[0] === 'Compute and analytics') {
        expect(metadata?.difficulty, `${id} is an advanced GPU-data example`).toBe('advanced');
        expect(metadata?.maturity, `${id} demonstrates experimental APIs`).toBe('experimental');
      }
    }
  });

  test('marks every high-dynamic-range website canvas as HDR capable', () => {
    const websiteExamples = readFileSync(
      path.join(process.cwd(), 'website/src/examples.tsx'),
      'utf8'
    );
    const catalogById = new Map(LIVE_EXAMPLES.map(example => [example.id, example]));
    const highDynamicRangeExampleIds: string[] = [];

    for (const match of websiteExamples.matchAll(/<LumaExample\b([\s\S]*?)(?:\/>|>)/g)) {
      const attributes = match[1];
      if (!attributes.includes('canvasContextProfile="high-dynamic-range"')) {
        continue;
      }

      const exampleId = attributes.match(/\bid="([^"]+)"/)?.[1];
      const exampleDirectory = attributes.match(/\bdirectory="([^"]+)"/)?.[1];
      expect(exampleId, 'HDR examples require a stable example ID').toBeDefined();
      expect(exampleDirectory, 'HDR examples require a stable example directory').toBeDefined();
      highDynamicRangeExampleIds.push(`${exampleDirectory}/${exampleId}`);
    }

    const highDynamicRangeCanvasCount = [
      ...websiteExamples.matchAll(/canvasContextProfile="high-dynamic-range"/g)
    ].length;
    expect(highDynamicRangeExampleIds).toHaveLength(highDynamicRangeCanvasCount);
    expect(catalogById.has('showcase/billion-point-spatial-atlas')).toBe(false);
    for (const exampleId of highDynamicRangeExampleIds) {
      if (!catalogById.has(exampleId)) {
        expect(
          HIDDEN_EXAMPLES.has(exampleId),
          `${exampleId} is not an approved hidden example`
        ).toBe(true);
        continue;
      }
      expect(
        catalogById.get(exampleId),
        `${exampleId} is missing from the live sidebar`
      ).toBeDefined();
      expect(
        catalogById.get(exampleId)?.metadata?.display,
        `${exampleId} requires an HDR catalog tag`
      ).toBe('hdr-capable');
    }
  });
});

function readLiveExamples(): LiveExample[] {
  const tableOfContents = JSON.parse(
    readFileSync(path.join(EXAMPLES_DIRECTORY, 'table-of-contents.json'), 'utf8')
  ) as ExampleSidebarEntry[];
  const liveExamples: LiveExample[] = [];

  const visit = (entries: ExampleSidebarEntry[], categories: string[]): void => {
    for (const entry of entries) {
      if (typeof entry === 'string') {
        liveExamples.push(readLiveExample(entry, categories));
      } else if (entry.type === 'category') {
        visit(entry.items, [...categories, entry.label]);
      } else if (entry.id !== 'index') {
        liveExamples.push(readLiveExample(entry.id, categories));
      }
    }
  };

  visit(tableOfContents, []);
  return liveExamples;
}

function readLiveExample(id: string, categories: string[]): LiveExample {
  const exampleSource = readFileSync(path.join(EXAMPLES_DIRECTORY, `${id}.mdx`), 'utf8');
  const frontmatter = exampleSource.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    throw new Error(`Example ${id} must declare YAML frontmatter`);
  }

  const metadata = parse(frontmatter[1]) as {sidebar_custom_props?: ExampleCatalogMetadata};
  return {id, categories, metadata: metadata.sidebar_custom_props};
}
