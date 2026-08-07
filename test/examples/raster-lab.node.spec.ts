// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {
  makeRasterLabDataset,
  RASTER_LAB_NO_DATA_VALUE
} from '../../examples/showcase/raster-lab/raster-data';

describe('LuRaster Satellite Raster Lab synthetic imagery', () => {
  test('creates deterministic, source-aligned red, infrared, and validity bands', () => {
    const firstDataset = makeRasterLabDataset(96, 64);
    const secondDataset = makeRasterLabDataset(96, 64);

    expect(firstDataset).toEqual(secondDataset);
    expect(firstDataset.pixelCount).toBe(96 * 64);
    expect(firstDataset.red).toHaveLength(firstDataset.pixelCount);
    expect(firstDataset.nearInfrared).toHaveLength(firstDataset.pixelCount);
    expect(firstDataset.validity).toHaveLength(firstDataset.pixelCount);
    expect(firstDataset.cloudPixelCount).toBeGreaterThan(0);
    expect(firstDataset.noDataPixelCount).toBeGreaterThan(0);
    expect(firstDataset.waterPixelCount).toBeGreaterThan(0);
  });

  test('distinguishes explicit cloud masks from raw nodata and spans water and vegetation', () => {
    const dataset = makeRasterLabDataset(128, 96);
    let observedCloudPixelCount = 0;
    let observedNoDataPixelCount = 0;
    let minimumVegetationIndex = Number.POSITIVE_INFINITY;
    let maximumVegetationIndex = Number.NEGATIVE_INFINITY;
    let noDataMasksRemainExplicitlyValid = true;
    let reflectanceIsPositive = true;
    let validityIsCanonical = true;

    for (let pixelIndex = 0; pixelIndex < dataset.pixelCount; pixelIndex++) {
      const red = dataset.red[pixelIndex]!;
      const nearInfrared = dataset.nearInfrared[pixelIndex]!;
      const validity = dataset.validity[pixelIndex]!;

      if (red === RASTER_LAB_NO_DATA_VALUE) {
        noDataMasksRemainExplicitlyValid &&=
          nearInfrared === RASTER_LAB_NO_DATA_VALUE && validity === 1;
        observedNoDataPixelCount++;
        continue;
      }

      reflectanceIsPositive &&= red > 0 && nearInfrared > 0;

      if (validity === 0) {
        observedCloudPixelCount++;
        continue;
      }

      validityIsCanonical &&= validity === 1;
      const vegetationIndex = (nearInfrared - red) / (nearInfrared + red);
      minimumVegetationIndex = Math.min(minimumVegetationIndex, vegetationIndex);
      maximumVegetationIndex = Math.max(maximumVegetationIndex, vegetationIndex);
    }

    expect(observedCloudPixelCount).toBe(dataset.cloudPixelCount);
    expect(observedNoDataPixelCount).toBe(dataset.noDataPixelCount);
    expect(noDataMasksRemainExplicitlyValid).toBe(true);
    expect(reflectanceIsPositive).toBe(true);
    expect(validityIsCanonical).toBe(true);
    expect(minimumVegetationIndex).toBeLessThan(0);
    expect(maximumVegetationIndex).toBeGreaterThan(0.5);
  });

  test('registers the interactive raster lab in the website example catalog', () => {
    const exampleCatalog = readFileSync(
      new URL('../../website/content/examples/table-of-contents.json', import.meta.url),
      'utf8'
    );
    const websiteExamples = readFileSync(
      new URL('../../website/src/examples.tsx', import.meta.url),
      'utf8'
    );
    const examplePage = readFileSync(
      new URL('../../website/content/examples/showcase/raster-lab.mdx', import.meta.url),
      'utf8'
    );
    const exampleTypecheck = readFileSync(
      new URL('../../scripts/examples-typecheck.mjs', import.meta.url),
      'utf8'
    );

    expect(JSON.parse(exampleCatalog)).toBeDefined();
    expect(exampleCatalog).toContain('"id": "showcase/raster-lab"');
    expect(websiteExamples).toContain("import('../../examples/showcase/raster-lab/app')");
    expect(examplePage).toContain('<RasterLabExample />');
    expect(exampleTypecheck).toContain("'showcase/raster-lab'");
    expect(
      existsSync(new URL('../../examples/showcase/raster-lab/package.json', import.meta.url))
    ).toBe(false);
  });

  test('keeps contour extraction and indirect presentation inside the raster lab', () => {
    const rasterEngine = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-engine.ts', import.meta.url),
      'utf8'
    );
    const rasterRenderer = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-renderer.ts', import.meta.url),
      'utf8'
    );
    const rasterInterface = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-interface.ts', import.meta.url),
      'utf8'
    );

    expect(rasterEngine).toContain('new GPURasterContours(');
    expect(rasterEngine).toContain('this.contourCommands.importToGraph(graph)');
    expect(rasterRenderer).toContain('this.contourCommands.draw(renderPass, 0)');
    expect(rasterInterface).toContain('data-raster-control="contours-enabled"');
    expect(rasterInterface).toContain('data-raster-control="contour-level"');
  });

  test('keeps spatial derivatives, masks, and contour composition GPU-resident', () => {
    const rasterEngine = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-engine.ts', import.meta.url),
      'utf8'
    );
    const rasterRenderer = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-renderer.ts', import.meta.url),
      'utf8'
    );
    const rasterInterface = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-interface.ts', import.meta.url),
      'utf8'
    );

    expect(rasterEngine).toContain('new GPURasterGradientMagnitude(');
    expect(rasterEngine).toContain('new GPURasterSobel(');
    expect(rasterEngine).toContain('new GPURasterScharr(');
    expect(rasterEngine).toContain('new GPURasterLaplacian(');
    expect(rasterEngine).toContain('validity: this.buffers.analyzedValidity');
    expect(rasterRenderer).toContain('uniforms.presentation.z > 0.5');
    expect(rasterInterface).toContain('data-raster-edge="sobel"');
    expect(rasterInterface).toContain('data-raster-edge="scharr"');
    expect(rasterInterface).toContain('data-raster-edge="laplacian"');
    expect(rasterInterface).toContain('data-raster-edge-direction="magnitude"');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });

  test('composes grayscale and binary morphology without reading raster pixels', () => {
    const rasterEngine = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-engine.ts', import.meta.url),
      'utf8'
    );
    const rasterRenderer = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-renderer.ts', import.meta.url),
      'utf8'
    );
    const rasterInterface = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-interface.ts', import.meta.url),
      'utf8'
    );

    expect(rasterEngine).toContain('GPURasterDilation');
    expect(rasterEngine).toContain('GPURasterErosion');
    expect(rasterEngine).toContain('GPURasterOpening');
    expect(rasterEngine).toContain('GPURasterClosing');
    expect(rasterEngine).toContain("storage: {kind: 'buffer', values: thresholdSeed}");
    expect(rasterEngine).toContain('validity: analyzedValidity');
    expect(rasterEngine).toContain('outputValidity: binaryMorphologyValidity');
    expect(rasterEngine).toContain('level: binaryMorphologyEnabled ? 0.5');
    expect(rasterRenderer).toContain('morphologyValidityValues[pixelIndex] == 0u');
    expect(rasterInterface).toContain('data-raster-morphology="dilate"');
    expect(rasterInterface).toContain('data-raster-morphology="erode"');
    expect(rasterInterface).toContain('data-raster-morphology="open"');
    expect(rasterInterface).toContain('data-raster-morphology="close"');
    expect(rasterInterface).toContain('data-raster-morphology-mode="binary"');
    expect(rasterInterface).toContain('data-raster-morphology-shape="cross"');
    expect(rasterInterface).toContain('data-raster-morphology-shape="square"');
    expect(rasterInterface).toContain('data-raster-morphology-nodata="propagate"');
    expect(rasterInterface).toContain('data-raster-morphology-border="constant"');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });
});
