// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {GPURasterTileReader} from '../../modules/experimental/src/luraster/gpu-raster-tile-source';
import {
  makeRasterLabDataset,
  RASTER_LAB_NO_DATA_VALUE
} from '../../examples/showcase/raster-lab/raster-data';
import {
  makeRasterLabTileDataset,
  RasterLabTileSource
} from '../../examples/showcase/raster-lab/raster-tile-source';

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

  test('exposes the original scene as an explicit, decoded, georeferenced source tile', async () => {
    const expected = makeRasterLabDataset(96, 64);
    const source = new RasterLabTileSource(96, 64);
    const reader = new GPURasterTileReader(source);
    const decoded = await reader.readTile({level: 0});
    const dataset = makeRasterLabTileDataset(decoded, 'full');

    expect(decoded.pixelBounds).toEqual([0, 0, 96, 64]);
    expect(decoded.levelZeroBounds).toEqual([0, 0, 96, 64]);
    expect(decoded.metadata.affine).toEqual([10, 0, 552400, 0, -10, 4187600]);
    expect(decoded.metadata.coordinateReferenceSystem).toEqual({authority: 'EPSG:32610'});
    expect(decoded.metadata.levelZeroOrigin).toEqual([0, 0]);
    expect(decoded.bands.map(band => band.id)).toEqual(['red', 'near-infrared']);
    expect(dataset.red).toEqual(expected.red);
    expect(dataset.nearInfrared).toEqual(expected.nearInfrared);
    expect(dataset.validity).toEqual(expected.validity);
    expect(dataset.cloudPixelCount).toBe(expected.cloudPixelCount);
    expect(dataset.noDataPixelCount).toBe(expected.noDataPixelCount);
    expect(dataset.metadata).toEqual(decoded.metadata);
  });

  test('clips odd-width tiles and uses exact source-provided overview sampling', async () => {
    const source = new RasterLabTileSource(97, 65);
    const reader = new GPURasterTileReader(source);
    const native = makeRasterLabDataset(97, 65);
    const western = await reader.readTile({level: 0, column: 0, row: 0});
    const eastern = await reader.readTile({level: 0, column: 1, row: 0});
    const overview = await reader.readTile({level: 1, column: 1, row: 0});

    expect(western.metadata.width).toBe(49);
    expect(eastern.metadata.width).toBe(48);
    expect(eastern.metadata.levelZeroOrigin).toEqual([49, 0]);
    expect(overview.metadata.width).toBe(24);
    expect(overview.metadata.height).toBe(33);
    expect(overview.pixelBounds).toEqual([25, 0, 49, 33]);
    expect(overview.levelZeroBounds).toEqual([50, 0, 97, 65]);
    expect(overview.metadata.levelZeroOrigin).toEqual([50, 0]);
    expect(overview.metadata.affine).toEqual([20, 0, 552900, 0, -20, 4187600]);
    expect(overview.bands[0]?.values[0]).toBe(native.red[50]);
    expect(overview.bands[0]?.values[1]).toBe(native.red[52]);
    expect(overview.bands[0]?.values[24]).toBe(native.red[2 * 97 + 50]);
    expect(overview.bands[0]?.validity).toBeInstanceOf(Uint32Array);
  });

  test('honors source band selection, normalized windows, and in-flight cancellation', async () => {
    const source = new RasterLabTileSource(97, 65);
    const reader = new GPURasterTileReader(source);
    const window = await reader.readTile({
      level: 1,
      column: 1,
      row: 0,
      bandIds: ['near-infrared'],
      pixelBounds: [51, 3, 87, 45],
      coordinateSpace: 'level-zero'
    });

    expect(window.pixelBounds).toEqual([25, 1, 44, 23]);
    expect(window.levelZeroBounds).toEqual([50, 2, 88, 46]);
    expect(window.metadata.levelZeroOrigin).toEqual([50, 2]);
    expect(window.metadata.affine).toEqual([20, 0, 552900, 0, -20, 4187580]);
    expect(window.bands.map(band => band.id)).toEqual(['near-infrared']);

    const controller = new AbortController();
    const request = reader.readTile({level: 0, column: 0, row: 0}, controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({name: 'AbortError'});
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

  test('keeps source windows cancellable and preserves decoded metadata in contour analysis', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
    const rasterEngine = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-engine.ts', import.meta.url),
      'utf8'
    );
    const rasterInterface = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-interface.ts', import.meta.url),
      'utf8'
    );

    expect(rasterApplication).toContain('new GPURasterTileReader(');
    expect(rasterApplication).toContain('this.sourceAbortController.abort()');
    expect(rasterApplication).toContain('replacement = new RasterLabEngine');
    expect(rasterEngine).toContain('{metadata: this.dataset.metadata}');
    expect(rasterInterface).toContain('data-raster-source-tile="west"');
    expect(rasterInterface).toContain('data-raster-source-tile="east"');
    expect(rasterInterface).toContain('data-raster-source-overview="1"');
    expect(rasterInterface).toContain('single tile · no halo');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });
});
