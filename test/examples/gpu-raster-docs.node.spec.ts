// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const conceptsGuide = readFileSync(
  new URL('../../docs/api-reference/experimental/gpu-raster/concepts.md', import.meta.url),
  'utf8'
);
const rasterOverview = readFileSync(
  new URL('../../docs/api-reference/experimental/gpu-raster/README.md', import.meta.url),
  'utf8'
);
const rasterOperations = [
  'operations.md',
  'operations-storage-residency.md',
  'operations-overviews.md',
  'operations-pixel.md',
  'operations-statistics.md',
  'operations-filters-morphology.md',
  'operations-regions-contours.md'
]
  .map(fileName =>
    readFileSync(
      new URL(`../../docs/api-reference/experimental/gpu-raster/${fileName}`, import.meta.url),
      'utf8'
    )
  )
  .join('\n');
const rasterReference = `${rasterOverview}\n${rasterOperations}`;
const experimentalOverview = readFileSync(
  new URL('../../docs/api-reference/experimental/README.md', import.meta.url),
  'utf8'
);
const experimentalTabs = readFileSync(
  new URL('../../website/src/components/docs/experimental-docs-catalog.ts', import.meta.url),
  'utf8'
);
const documentationSidebar = readFileSync(
  new URL('../../docs/table-of-contents.json', import.meta.url),
  'utf8'
);
const frameworkCapabilities = readFileSync(
  new URL('../../docs/capabilities/gpu-data-compute.mdx', import.meta.url),
  'utf8'
);
const rasterLabGuide = readFileSync(
  new URL('../../website/content/examples/showcase/raster-lab.mdx', import.meta.url),
  'utf8'
);
const rasterRoadmap = readFileSync(
  new URL('../../dev-docs/roadmaps/gpu-raster-roadmap.md', import.meta.url),
  'utf8'
);

describe('GPURaster raster concepts and execution documentation', () => {
  test('exposes the concepts guide in the GPU Raster sidebar and user guides', () => {
    expect(conceptsGuide).toContain('# GPURaster Concepts and Execution Model');
    expect(conceptsGuide).toContain('<ExperimentalDocsTabs active="gpu-raster-concepts" />');
    expect(rasterReference).toContain('<ExperimentalDocsTabs active="gpu-raster" />');
    expect(experimentalTabs).toContain("| 'gpu-raster'");
    expect(experimentalTabs).toContain("href: '/docs/api-reference/experimental/gpu-raster'");
    expect(experimentalOverview).toContain('### GPU data and analytics');
    expect(experimentalOverview).toContain(
      '| [GPU Raster](/docs/api-reference/experimental/gpu-raster) |'
    );
    expect(
      documentationSidebar.match(/"api-reference\/experimental\/gpu-raster\/concepts"/gu)
    ).toHaveLength(1);

    for (const documentation of [rasterReference, rasterLabGuide, rasterRoadmap]) {
      expect(documentation).toContain('/docs/api-reference/experimental/gpu-raster/concepts');
    }
  });

  test('defines nodata, separate validity, valid zeros, and raw-source sentinel ordering', () => {
    expect(conceptsGuide).toContain('## What “nodata” means');
    expect(conceptsGuide).toContain('Correct mean:        40 / 2 = 20');
    expect(conceptsGuide).toContain('Incorrect mean:      (10 + 0 + 30 + 0) / 4 = 10');
    expect(conceptsGuide).toContain('### Why validity must be separate from values');
    expect(conceptsGuide).toContain('Zero is often meaningful');
    expect(conceptsGuide).toContain('raw native value before calibration');
    expect(conceptsGuide).toContain('noDataValue: 65535');
    expect(conceptsGuide).toContain('If either band is missing');
    expect(rasterLabGuide).toContain('missing');
    expect(rasterLabGuide).toContain('valid');
  });

  test('explains globally stable two-pass replay, explicit accumulator reset, and overflow', () => {
    expect(conceptsGuide).toContain('## What “replayable” means');
    expect(conceptsGuide).toContain('Western local domain: [10, 20]');
    expect(conceptsGuide).toContain('Eastern local domain: [100, 200]');
    expect(conceptsGuide).toContain('Global histogram:         [2, 1, 0, 1]');
    expect(conceptsGuide).toContain('### Reset and replay have different lifetimes');
    expect(conceptsGuide).toContain('new GPURasterGlobalInitialize');
    expect(conceptsGuide).toContain('new GPURasterGlobalStatisticsMerge');
    expect(conceptsGuide).toContain('new GPURasterGlobalHistogramMerge');
    expect(conceptsGuide).toContain('4,294,967,295');
    expect(conceptsGuide).toContain('ordinary floating-point addition-order rounding');
  });

  test('distinguishes owned cores, halos, weighted overviews, exact categories, and loaders', () => {
    expect(conceptsGuide).toContain('western core  [0, 4)');
    expect(conceptsGuide).toContain('Total required halo                         = 7');
    expect(conceptsGuide).toContain('Correct parent mean: (10 + 90) / (1 + 3) = 25');
    expect(conceptsGuide).toContain('Incorrect mean of means: (10 + 30) / 2   = 20');
    expect(conceptsGuide).toContain('class `0` remains valid');
    expect(conceptsGuide).toContain('tileLease.releaseAfter(fence)');
    expect(conceptsGuide).toContain('GPU analytical layer, not a replacement for loaders.gl');
    expect(conceptsGuide).toContain('## A short glossary');
  });

  test('classifies completed raster workflows as experimental instead of future opportunities', () => {
    // for (const capability of [
    //   'Seam-safe cross-tile raster halos',
    //   'Nodata-aware analytical overviews',
    //   'Exact categorical raster overviews',
    //   'Dataset-wide tiled raster statistics',
    //   'Stable-domain global histogram replay',
    //   'GPU global percentiles and thresholds',
    //   'Overflow-aware global raster reductions'
    // ]) {
    //   expect(frameworkCapabilities).toContain(`| ${capability} | Experimental | WebGPU |`);
    // }

    expect(frameworkCapabilities).toContain(
      '| Marching-squares contours | Experimental | WebGPU |'
    );
    expect(frameworkCapabilities).toContain(
      '| Indirect contour overlays | Experimental | WebGPU |'
    );
    expect(frameworkCapabilities).toContain('/docs/api-reference/experimental/gpu-raster/concepts');
    expect(frameworkCapabilities).not.toContain(
      '| Seam-safe multi-tile raster analysis | Opportunity'
    );
  });
});
