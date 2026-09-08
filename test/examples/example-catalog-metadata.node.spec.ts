// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {parse} from 'yaml';
import {EXAMPLE_SUPPORT_REGISTRY} from '../../examples/example-support-registry';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

type ExampleCatalogMetadata = {
  backends?: string[];
  difficulty?: string;
  display?: string;
  maturity?: string;
  mobile?: string;
  mobileProfile?: string;
  mobileUnsupportedReason?: string;
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
  'experimental/gpu-trace-scene'
]);
const LIVE_EXAMPLES = readLiveExamples();
const requireCommonJSModule = createRequire(import.meta.url);

describe('live example catalog metadata', () => {
  test('features MRC packet spraying in the visible showcase gallery', () => {
    expect(LIVE_EXAMPLES.find(({id}) => id === 'showcase/packet-spraying')).toMatchObject({
      id: 'showcase/packet-spraying',
      categories: ['Showcase'],
      metadata: {
        backends: ['webgpu', 'webgl2'],
        display: 'hdr-capable',
        difficulty: 'intermediate',
        maturity: 'stable'
      }
    });
    expect(
      existsSync(
        path.join(process.cwd(), 'website/static/images/examples/showcase/packet-spraying.jpg')
      )
    ).toBe(true);
  });

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
        mobile: 'full',
        mobileProfile: 'standard',
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

  test('keeps the instancing showcase without Arrow example routes', () => {
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
    expect(websiteConfiguration).not.toContain('/examples/arrow');
  });

  test('provides complete, curated filters for every sidebar example', () => {
    expect(LIVE_EXAMPLES).toHaveLength(54);

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
      expect(
        ['full', 'reduced', 'unsupported'].includes(metadata?.mobile || ''),
        `${id} has an invalid mobile mode`
      ).toBe(true);
      expect(
        ['standard', 'effects', 'large-data', 'simulation', 'dense'].includes(
          metadata?.mobileProfile || ''
        ),
        `${id} has an invalid mobile quality profile`
      ).toBe(true);
      if (metadata?.mobile === 'full') {
        expect(metadata.mobileProfile, `${id} full mobile support uses standard quality`).toBe(
          'standard'
        );
      }
      if (metadata?.mobile === 'reduced') {
        expect(metadata.mobileProfile, `${id} reduced mode requires a reduced profile`).not.toBe(
          'standard'
        );
      }
      if (metadata?.mobile === 'unsupported') {
        expect(
          metadata.mobileUnsupportedReason?.trim(),
          `${id} desktop-only mode requires a user-facing reason`
        ).toBeTruthy();
      }
      expect(metadata?.topics?.length, `${id} requires at least two topics`).toBeGreaterThanOrEqual(
        2
      );
      expect(metadata?.topics?.length, `${id} allows at most five topics`).toBeLessThanOrEqual(5);
      expect(new Set(metadata?.topics).size, `${id} has duplicate topics`).toBe(
        metadata?.topics?.length
      );
    }
  });

  test('keeps mobile support metadata local and the runtime policy free of application imports', () => {
    const supportPolicy = readFileSync(
      path.join(process.cwd(), 'examples/example-support.ts'),
      'utf8'
    );
    const supportRegistry = readFileSync(
      path.join(process.cwd(), 'examples/example-support-registry.ts'),
      'utf8'
    );
    expect(supportPolicy).not.toMatch(/(?:import|export).*\/app['"]/);
    expect(supportPolicy).not.toContain('website/src/examples');
    expect(supportRegistry).not.toMatch(/(?:import|export).*\/app['"]/);

    expect(Object.keys(EXAMPLE_SUPPORT_REGISTRY)).toHaveLength(81);
    for (const example of LIVE_EXAMPLES) {
      expect(
        EXAMPLE_SUPPORT_REGISTRY[example.id],
        `${example.id} requires a sidecar`
      ).toBeDefined();
      expect(
        existsSync(path.join(process.cwd(), 'examples', example.id, 'mobile-support.ts')),
        `${example.id} requires a local mobile-support.ts sidecar`
      ).toBe(true);
    }

    const standaloneFiles = findStandaloneHtmlFiles(path.join(process.cwd(), 'examples'));
    expect(standaloneFiles).toHaveLength(75);
    for (const relativeFile of standaloneFiles) {
      const standaloneId = relativeFile.replace(/\/(?:index|playground)\.html$/, match =>
        match === '/index.html' ? '' : '/playground'
      );
      const canonicalId =
        new Map([
          ['arrow/arrow-instancing', 'showcase/instancing'],
          ['showcase/scene', 'experimental/scene-playground'],
          ['showcase/scene/playground', 'experimental/scene-playground'],
          ['tutorials/hello-instanced-cubes', 'tutorials/instanced-cubes'],
          ['tutorials/hello-two-cubes', 'tutorials/two-cubes']
        ]).get(standaloneId) || standaloneId;
      expect(
        EXAMPLE_SUPPORT_REGISTRY[canonicalId],
        `${relativeFile} requires a sidecar support definition`
      ).toBeDefined();
    }
  });

  test('resolves standalone aliases to the same canonical support definitions', () => {
    const aliases = new Map([
      ['arrow/arrow-instancing/index.html', 'showcase/instancing'],
      ['showcase/scene/index.html', 'experimental/scene-playground'],
      ['showcase/scene/playground.html', 'experimental/scene-playground'],
      ['tutorials/hello-instanced-cubes/index.html', 'tutorials/instanced-cubes'],
      ['tutorials/hello-two-cubes/index.html', 'tutorials/two-cubes']
    ]);

    for (const [relativeFile, canonicalId] of aliases) {
      const catalog = LIVE_EXAMPLES.find(example => example.id === canonicalId);
      expect(catalog, `${canonicalId} must exist in the catalog`).toBeDefined();
      expect(
        existsSync(
          path.join(
            process.cwd(),
            'examples',
            relativeFile.replace(/\/[^/]+$/, ''),
            'mobile-support.ts'
          )
        ),
        `${relativeFile} requires a local sidecar`
      ).toBe(true);
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

function findStandaloneHtmlFiles(directory: string, relativeDirectory = ''): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue;
    const entryPath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findStandaloneHtmlFiles(entryPath, relativePath));
    } else if (entry.name === 'index.html' || entry.name === 'playground.html') {
      files.push(relativePath);
    }
  }
  return files;
}

function readLiveExample(id: string, categories: string[]): LiveExample {
  const exampleSource = readFileSync(path.join(EXAMPLES_DIRECTORY, `${id}.mdx`), 'utf8');
  const frontmatter = exampleSource.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    throw new Error(`Example ${id} must declare YAML frontmatter`);
  }

  const metadata = parse(frontmatter[1]) as {sidebar_custom_props?: ExampleCatalogMetadata};
  const supportDefinition = EXAMPLE_SUPPORT_REGISTRY[id];
  return {
    id,
    categories,
    metadata: {
      ...metadata.sidebar_custom_props,
      backends: supportDefinition?.requirements?.backends.slice(),
      mobile: supportDefinition?.mobileMode,
      mobileProfile: supportDefinition?.mobileProfile,
      mobileUnsupportedReason: supportDefinition?.unsupportedReason
    }
  };
}
