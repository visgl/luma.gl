// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const SPLATS_DOCUMENTATION_PATH = path.join(process.cwd(), 'docs/api-reference/splats/README.md');
const SPLATS_ROADMAP_PATH = path.join(
  process.cwd(),
  'dev-docs/roadmaps/gaussian-splats-roadmap.md'
);
const CAPABILITIES_PATH = path.join(process.cwd(), 'docs/capabilities/rendering-visualization.mdx');
const WEBSITE_EXAMPLES_PATH = path.join(process.cwd(), 'website/src/examples.tsx');
const WEBSITE_EXAMPLE_CATALOG_PATH = path.join(
  process.cwd(),
  'website/content/examples/table-of-contents.json'
);
const GAUSSIAN_SPLAT_VIEWER_PATH = path.join(
  process.cwd(),
  'website/content/examples/showcase/gaussian-splat-viewer.mdx'
);
const HOMEPAGE_PATH = path.join(process.cwd(), 'website/src/pages/index.jsx');
const HOMEPAGE_GPU_SCENE_PATH = path.join(
  process.cwd(),
  'website/src/components/homepage-gpu-scene.tsx'
);

describe('Gaussian splat documentation showcase', () => {
  test('links the captured Train viewer from the API documentation', () => {
    const documentation = readFileSync(SPLATS_DOCUMENTATION_PATH, 'utf8');

    expect(documentation).not.toContain('GaussianSplatsExample');
    expect(documentation).toContain('## Interactive Gaussian splat viewer');
    expect(documentation).toContain('741,883-splat Train capture');
    expect(documentation).toContain(
      '[Open the Gaussian Splat Viewer](/examples/showcase/gaussian-splat-viewer)'
    );
  });

  test('keeps the documentation scene scoped to its own viewer instance', () => {
    const examples = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const viewerStart = examples.indexOf('export const GaussianSplatViewerExample');
    const viewerEnd = examples.indexOf('export const InstancingExample', viewerStart);
    const viewer = examples.slice(viewerStart, viewerEnd);
    const viewerDocumentation = readFileSync(GAUSSIAN_SPLAT_VIEWER_PATH, 'utf8');

    expect(viewerStart).toBeGreaterThan(0);
    expect(viewerEnd).toBeGreaterThan(viewerStart);
    expect(viewer).toContain("defaultScene?: GaussianSplatSourceCatalogEntry['id']");
    expect(viewer).toContain('const loadAnimationTemplate = useMemo(');
    expect(viewer).toContain('await loadGaussianSplatsApp()');
    expect(viewer).toContain('if (!defaultScene)');
    expect(viewer).toContain('return GaussianSplatsApp;');
    expect(viewer).toContain('extends GaussianSplatsApp');
    expect(viewer).toContain('super({...animationProps, defaultScene});');
    expect(viewer).toContain('loadTemplate={loadAnimationTemplate}');
    expect(viewer).not.toContain('__lumaGaussianSplatsDefaultScene');
    expect(viewerDocumentation).toContain('<GaussianSplatViewerExample />');
    expect(viewerDocumentation).toContain('741,883-splat Train');
  });

  test('keeps implementation status in the roadmap and public capabilities factual', () => {
    const roadmap = readFileSync(SPLATS_ROADMAP_PATH, 'utf8');
    const capabilities = readFileSync(CAPABILITIES_PATH, 'utf8');

    expect(roadmap).toContain('## Current implementation status');
    expect(roadmap).toContain('| GPU graph feature parity | Implemented');
    expect(roadmap).toContain('| Out-of-core RAD rendering | Implemented');
    expect(roadmap).toContain('| 50-million-splat Spark parity | In progress');
    expect(roadmap).toContain('| 3D Tiles integration | Partial');
    expect(roadmap).toContain('https://github.com/visgl/loaders.gl/pull/3431');
    expect(roadmap).toContain('https://github.com/visgl/loaders.gl/issues/1245');
    expect(roadmap).toContain('`Tileset3D` and `Tiles3DSource` traversal');
    expect(roadmap).toContain('loaders.gl has SPZ v4 decoding, but not SPZ v2');
    expect(roadmap).toContain('existing `SplatLayer`');
    expect(roadmap).toContain('loader-computed transforms per tile/page in the renderer');
    expect(roadmap).toContain('per-tile/page renderer transforms');
    expect(roadmap).not.toContain('Add actual tileset traversal');
    const trancheRows = roadmap.split('\n').filter(row => /^\| T\d/.test(row));
    expect(trancheRows.map(row => row.match(/^\| (T\d+a?)/)?.[1])).toEqual([
      'T0',
      'T0a',
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
      'T6',
      'T7',
      'T8',
      'T9',
      'T10'
    ]);
    for (const tranche of trancheRows.slice(0, 7)) {
      expect(tranche).toMatch(/\| Implemented/);
    }
    for (const tranche of trancheRows.slice(7)) {
      expect(tranche).toMatch(/\| Planned/);
    }
    for (const pullRequest of [2929, 2932, 2938, 2966, 3035, 3041, 3051, 3057]) {
      expect(roadmap).toContain(`https://github.com/visgl/luma.gl/pull/${pullRequest}`);
    }
    expect(roadmap).toContain('Implemented in this follow-up');
    expect(roadmap).toContain('33,554,432 active four-byte references');
    expect(roadmap).toContain('128 MiB storage-binding limit');
    expect(roadmap).toContain('near-linear routing');
    expect(roadmap).toContain('no measured visual or performance parity is claimed');

    expect(capabilities).toContain('| Globally sorted WebGL splat runs | Experimental | WebGL2 |');
    expect(capabilities).toContain('| Unclamped WebGL harmonic radiance | Experimental | WebGL2 |');
    expect(capabilities).toMatch(/Background RAD page decoding[^\n]*automatically fall back/);
    expect(capabilities).toContain('[`@luma.gl/splats` reference](/docs/api-reference/splats)');
    for (const capability of [
      'Hierarchical splat refinement',
      'Dedicated splat picking',
      'Mixed mesh and splat rendering',
      'Camera-driven RAD page sources'
    ]) {
      expect(capabilities).toContain(`| ${capability} | Experimental |`);
    }
  });

  test('preserves the public examples catalog and the instancing homepage hero', () => {
    const exampleCatalog = JSON.parse(readFileSync(WEBSITE_EXAMPLE_CATALOG_PATH, 'utf8')) as Array<{
      label?: string;
      items?: unknown[];
    }>;
    const experimentalEntries = exampleCatalog.find(
      category => category.label === 'Experimental'
    )?.items;
    const homepage = readFileSync(HOMEPAGE_PATH, 'utf8');
    const homepageScene = readFileSync(HOMEPAGE_GPU_SCENE_PATH, 'utf8');

    expect(experimentalEntries).toContain('showcase/gaussian-splat-viewer');
    expect(experimentalEntries).not.toContain('showcase/gaussian-splats');
    expect(homepage).toContain("React.lazy(() => import('../components/homepage-gpu-scene'))");
    expect(homepageScene).toContain(
      "import InstancingApp from '../../../examples/showcase/instancing/app';"
    );
    expect(homepageScene).toContain('id="instancing"');
    expect(homepageScene).toContain('template={InstancingApp}');
    expect(homepageScene).not.toContain('GaussianSplatsApp');
  });
});
