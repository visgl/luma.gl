// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const WEBSITE_EXAMPLES_PATH = path.join(process.cwd(), 'website/src/examples.tsx');
const LUMA_EXAMPLE_PATH = path.join(
  process.cwd(),
  'website/src/react-luma/components/luma-example.tsx'
);
const EXAMPLE_CATALOG_PATH = path.join(process.cwd(), 'website/src/components/examples-index.tsx');
const EXAMPLE_CARD_PATH = path.join(process.cwd(), 'website/src/components/example-card.tsx');
const HOMEPAGE_SOURCE_PATH = path.join(process.cwd(), 'website/src/pages/index.jsx');
const HOMEPAGE_GPU_SCENE_PATH = path.join(
  process.cwd(),
  'website/src/components/homepage-gpu-scene.tsx'
);
const DEFERRED_FP64_EXAMPLE_PATH = path.join(
  process.cwd(),
  'website/src/components/docs/deferred-fp64-example.tsx'
);
const GPU_DATA_ANALYSIS_PATH = path.join(
  process.cwd(),
  'examples/experimental/gpu-data-analysis/src/app.ts'
);
const GPU_SORT_PATH = path.join(process.cwd(), 'examples/experimental/gpu-sort/src/app.ts');
const LEGACY_GPGPU_SHOWCASE_PATH = path.join(process.cwd(), 'examples/v10/gpgpu/src/app.ts');

describe('responsive GPGPU website examples', () => {
  test('loads every animation-loop example separately without eager application imports', () => {
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const lifecycleSource = readFileSync(LUMA_EXAMPLE_PATH, 'utf8');

    for (const modulePath of [
      '../../examples/showcase/packet-spraying/app',
      '../../examples/showcase/globe/app',
      '../../examples/showcase/gltf/app',
      '../../examples/experimental/advanced-effects/app',
      '../../examples/tutorials/hello-triangle/app'
    ]) {
      expect(examplesSource, `${modulePath} must load only for its own example`).toContain(
        `import('${modulePath}')`
      );
    }

    expect(examplesSource).not.toMatch(/^import\s+\w+App\s+from\s+['"]\.\.\/\.\.\/examples\//m);
    expect(examplesSource).not.toContain("from '../../examples/arrow/arrow-example-panels'");
    expect(examplesSource).toContain("import('../../examples/arrow/arrow-example-panels')");
    expect(examplesSource).toContain('loadTemplate={loadPacketSprayingApp}');
    expect(lifecycleSource).toContain('deferredTemplate?.loader === props.loadTemplate');
    expect(lifecycleSource).toContain('return sharedDevice');
  });

  test('loads heavyweight compute and precision applications only when their route requests them', () => {
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');

    for (const modulePath of [
      '../../examples/showcase/billion-point-spatial-atlas/app',
      '../../examples/showcase/million-row-crossfilter/app',
      '../../examples/deck/luspatial-taxi/app',
      '../../examples/experimental/fp64/app'
    ]) {
      expect(examplesSource, `${modulePath} must be loaded asynchronously`).toContain(
        `import('${modulePath}')`
      );
    }

    expect(examplesSource).not.toMatch(
      /^import\s+(?:BillionPointSpatialAtlasApp|MillionRowCrossfilterApp|FP64App)\s+from/m
    );
    expect(examplesSource).not.toMatch(/^import\s+\{createGPUSpatialTaxiDeck\}\s+from/m);
    expect(examplesSource).toContain("role={errorMessage ? 'alert' : 'status'}");
    expect(examplesSource).toContain('Preparing GPU experience');
    expect(examplesSource).toContain('window.clearTimeout(loadingTimeout)');
  });

  test('keeps embedded precision benchmarks idle until the reader explicitly launches them', () => {
    const examplesSource = readFileSync(WEBSITE_EXAMPLES_PATH, 'utf8');
    const deferredExampleSource = readFileSync(DEFERRED_FP64_EXAMPLE_PATH, 'utf8');

    expect(examplesSource).toContain('useState(!props.embedded || autoStart)');
    expect(examplesSource).toContain(
      'useDeferredExampleModule(loadFP64Example, isBenchmarkRequested)'
    );
    expect(examplesSource).toContain('if (!isBenchmarkRequested)');
    expect(examplesSource).toContain('Launch precision benchmark');
    expect(deferredExampleSource).toContain("await import('../../examples')");
    expect(deferredExampleSource).toContain('if (isRequested)');

    for (const precisionPage of [
      'docs/api-guide/shaders/gpu-floating-point-precision.md',
      'docs/api-reference/shadertools/shader-modules/fp64.md',
      'docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md'
    ]) {
      const precisionPageSource = readFileSync(path.join(process.cwd(), precisionPage), 'utf8');
      expect(precisionPageSource).toContain('<DeferredFP64Example embeddedHeight={900} />');
      expect(precisionPageSource).not.toMatch(/from ['"]@site\/src\/examples['"]/);
    }
  });

  test('renders the homepage before asynchronously starting its isolated GPU hero', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const homepageSceneSource = readFileSync(HOMEPAGE_GPU_SCENE_PATH, 'utf8');

    expect(homepageSource).toContain(
      "React.lazy(() => import('../components/homepage-gpu-scene'))"
    );
    expect(homepageSource).toContain('window.clearTimeout(sceneStartupTimeout)');
    expect(homepageSource).toContain('radial-gradient');
    expect(homepageSource).not.toContain('/images/examples/showcase/instancing.jpg');
    expect(homepageSource).not.toMatch(/from ['"]\.\.\/examples['"]/);
    expect(homepageSceneSource).not.toMatch(/from ['"]\.\.\/examples['"]/);
    expect(homepageSceneSource).toContain("from '../../../examples/showcase/instancing/app'");
  });

  test('serializes template finalization after asynchronous initialization', () => {
    const lifecycleSource = readFileSync(LUMA_EXAMPLE_PATH, 'utf8');
    const cleanupOffset = lifecycleSource.lastIndexOf('return () => {\n      isCancelled = true;');
    const queuedCleanupOffset = lifecycleSource.indexOf(
      'currentLumaExampleTask = currentLumaExampleTask',
      cleanupOffset
    );
    const serializedDestroyOffset = lifecycleSource.indexOf(
      'animationLoop.destroy()',
      queuedCleanupOffset
    );
    const immediateCleanupSource = lifecycleSource.slice(cleanupOffset, queuedCleanupOffset);

    expect(cleanupOffset).toBeGreaterThan(0);
    expect(queuedCleanupOffset).toBeGreaterThan(cleanupOffset);
    expect(serializedDestroyOffset).toBeGreaterThan(queuedCleanupOffset);
    expect(immediateCleanupSource).not.toContain('animationLoop?.stop()');
    expect(immediateCleanupSource).toContain('canvasContainer.replaceChildren()');
  });

  test('keeps DOM-only compute examples from inserting presentation canvases into the page', () => {
    for (const examplePath of [GPU_DATA_ANALYSIS_PATH, GPU_SORT_PATH]) {
      const exampleSource = readFileSync(examplePath, 'utf8');

      expect(exampleSource).toContain('const device = await luma.createDevice({');
      expect(exampleSource).not.toContain('createCanvasContext');
      expect(exampleSource).not.toContain('new OffscreenCanvas');
      expect(exampleSource).toContain('if (this.destroyed) {\n        device.destroy();');
    }

    const legacyShowcaseSource = readFileSync(LEGACY_GPGPU_SHOWCASE_PATH, 'utf8');
    expect(legacyShowcaseSource).toContain("document.createElement('canvas')");
    expect(legacyShowcaseSource).toContain('new OffscreenCanvas(1, 1)');
    expect(legacyShowcaseSource).not.toMatch(/typeof OffscreenCanvas === 'undefined'\s*\? true/);
  });

  test('gives the dedicated GPGPU collection accurate backend, difficulty, and visual metadata', () => {
    const catalogSource = readFileSync(EXAMPLE_CATALOG_PATH, 'utf8');
    const cardSource = readFileSync(EXAMPLE_CARD_PATH, 'utf8');

    expect(catalogSource).toContain(
      "return category === 'GPGPU' || category.startsWith('GPGPU Graph');"
    );
    expect(catalogSource).toContain("return category.startsWith('GPU Graph Layers');");
    expect(
      catalogSource.match(/isGeneralPurposeGPUCategory\(category\)/g)?.length
    ).toBeGreaterThanOrEqual(4);
    expect(catalogSource).toContain("if (isGeneralPurposeGPUCategory(category)) return 'compute'");
    expect(catalogSource).toContain(
      "if (category === 'GPGPU Graph') return 'GPU data and compute pipelines'"
    );
    expect(catalogSource).toContain('Compute, projections, and GPU-native data');
    expect(catalogSource).toContain('GPU-driven deck.gl integrations');
    expect(cardSource).toContain(
      "if (category === 'GPGPU' || category.startsWith('GPGPU Graph')) return '#a78bfa';"
    );
  });
});
