// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const SPLATS_DOCUMENTATION_PATH = path.join(process.cwd(), 'docs/api-reference/splats/README.md');
const CAPABILITIES_PATH = path.join(process.cwd(), 'docs/capabilities.mdx');
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
  test('embeds the live Coit Tower viewer directly in the splats API documentation', () => {
    const documentation = readFileSync(SPLATS_DOCUMENTATION_PATH, 'utf8');

    expect(documentation).toContain(
      "import {GaussianSplatViewerExample} from '@site/src/examples';"
    );
    expect(documentation).toContain('## Interactive Coit Tower showcase');
    expect(documentation).toContain('50,937,127-splat Coit Tower capture');
    expect(documentation).toMatch(
      /<GaussianSplatViewerExample\b(?=[^>]*\bembedded\b)(?=[^>]*\bembeddedHeight=\{640\})(?=[^>]*\bdefaultScene="coit")(?=[^>]*\bshowStats=\{false\})[^>]*\/>/
    );
    expect(documentation).toContain(
      '[Open the full Coit Tower viewer](/examples/showcase/gaussian-splat-viewer?scene=coit)'
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
    expect(viewer).toContain('const animationTemplate = useMemo(() => {');
    expect(viewer).toContain('if (!defaultScene)');
    expect(viewer).toContain('return GaussianSplatsApp;');
    expect(viewer).toContain('extends GaussianSplatsApp');
    expect(viewer).toContain('super({...animationProps, defaultScene});');
    expect(viewer).toContain('template={animationTemplate}');
    expect(viewer).not.toContain('__lumaGaussianSplatsDefaultScene');
    expect(viewerDocumentation).toContain('<GaussianSplatViewerExample />');
    expect(viewerDocumentation).toContain('741,883-splat Train');
  });

  test('distinguishes implemented Gaussian splat tranches from remaining opportunities', () => {
    const documentation = readFileSync(SPLATS_DOCUMENTATION_PATH, 'utf8');
    const capabilities = readFileSync(CAPABILITIES_PATH, 'utf8');
    const roadmap = documentation.match(
      /## Gaussian splat implementation roadmap\n([\s\S]*?)\n## Rendering prepared splats/
    );

    expect(roadmap).not.toBeNull();
    expect(roadmap![1]).toContain('### Current supremacy-track status');
    expect(roadmap![1]).toContain('| GPU graph feature parity | Implemented');
    expect(roadmap![1]).toContain('| Out-of-core RAD rendering | Implemented');
    expect(roadmap![1]).toContain('| 50-million-splat Spark parity | In progress');
    expect(roadmap![1]).toContain('| 3D Tiles integration | Partial');
    expect(roadmap![1]).toContain('https://github.com/visgl/loaders.gl/pull/3431');
    expect(roadmap![1]).toContain('https://github.com/visgl/loaders.gl/issues/1245');
    expect(roadmap![1]).toContain('`Tileset3D` and `Tiles3DSource` traversal');
    expect(roadmap![1]).toContain('loaders.gl has SPZ v4 decoding, but not SPZ v2');
    expect(roadmap![1]).toContain('existing `SplatLayer`');
    expect(roadmap![1]).toContain('loader-computed transforms per tile/page in the renderer');
    expect(roadmap![1]).toContain('per-tile/page renderer transforms');
    expect(roadmap![1]).not.toContain('Add actual tileset traversal');
    const trancheRows = roadmap![1].split('\n').filter(row => /^\| T\d/.test(row));
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
      expect(roadmap![1]).toContain(`https://github.com/visgl/luma.gl/pull/${pullRequest}`);
    }
    expect(roadmap![1]).toContain('Implemented in this follow-up');
    expect(roadmap![1]).toContain('33,554,432 active four-byte references');
    expect(roadmap![1]).toContain('128 MiB storage-binding limit');
    expect(roadmap![1]).toContain('near-linear routing');
    expect(roadmap![1]).toContain('no measured visual or performance parity is claimed');

    expect(capabilities).toContain('| Globally sorted WebGL splat runs | Experimental | WebGL2 |');
    expect(capabilities).toContain('| Unclamped WebGL harmonic radiance | Experimental | WebGL2 |');
    expect(capabilities).toMatch(/Background RAD page decoding[^\n]*automatically fall back/);
    expect(capabilities).toContain('Reuse existing `Tileset3D` traversal');
    expect(capabilities).toContain(
      'apply loader-computed transforms per tile/page in the renderer'
    );
    expect(capabilities).toContain(
      '[Gaussian splat implementation roadmap](/docs/api-reference/splats#gaussian-splat-implementation-roadmap)'
    );
    for (const opportunity of [
      'Incremental GPU splat hierarchy scheduling',
      'Segmented splat picking and mesh composition',
      'Partitioned splat sorting and scatter',
      'Streamed 3D Tiles and glTF splat transport',
      'Measured captured-scene visual and performance parity'
    ]) {
      expect(capabilities).toContain(`| ${opportunity} | Opportunity |`);
    }
  });

  test('preserves the public examples catalog and the instancing homepage hero', () => {
    const exampleCatalog = JSON.parse(readFileSync(WEBSITE_EXAMPLE_CATALOG_PATH, 'utf8')) as Array<{
      label?: string;
      items?: unknown[];
    }>;
    const showcaseEntries = exampleCatalog.find(category => category.label === 'Showcase')?.items;
    const homepage = readFileSync(HOMEPAGE_PATH, 'utf8');
    const homepageScene = readFileSync(HOMEPAGE_GPU_SCENE_PATH, 'utf8');

    expect(showcaseEntries).toContain('showcase/gaussian-splat-viewer');
    expect(showcaseEntries).toContain('showcase/gaussian-splats');
    expect(homepage).toContain("React.lazy(() => import('../components/homepage-gpu-scene'))");
    expect(homepageScene).toContain(
      "import InstancingApp from '../../../examples/showcase/instancing/app';"
    );
    expect(homepageScene).toContain('id="instancing"');
    expect(homepageScene).toContain('template={InstancingApp}');
    expect(homepageScene).not.toContain('GaussianSplatsApp');
  });
});
