// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {describe, expect, test} from 'vitest';
import * as experimentalModule from '@luma.gl/experimental';
import * as lurasterModule from '@luma.gl/experimental/luraster';

describe('@luma.gl/experimental/luraster package boundary', () => {
  test('declares an isolated side-effect-free ESM, CommonJS, and types subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      private?: boolean;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
    };

    expect(packageJson.name).toBe('@luma.gl/experimental');
    expect(packageJson.private).toBe(true);
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./luraster']).toEqual({
      import: './dist/luraster/index.js',
      require: './dist/luraster/index.cjs',
      types: './dist/luraster/index.d.ts'
    });
    expect(packageJson.exports?.['./geospatial']).toBeDefined();
    expect(packageJson.exports?.['./luxfilter']).toBeDefined();
  });

  test('keeps every LuRaster runtime export outside the experimental root', () => {
    for (const exportName of Object.keys(lurasterModule)) {
      expect(exportName in experimentalModule).toBe(false);
    }
  });

  test('keeps external tile decoding, transport, and GPU ownership in the application', () => {
    const tileSourceImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-tile-source.ts', import.meta.url),
      'utf8'
    );

    expect(tileSourceImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(tileSourceImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(tileSourceImplementation).not.toMatch(
      /\b(?:createBuffer|createTexture|submit|mapAsync)\s*\(/
    );
  });

  test('keeps tile-cache transport, submission, synchronization, and readback explicit', () => {
    const tileCacheImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-tile-cache.ts', import.meta.url),
      'utf8'
    );

    expect(tileCacheImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(tileCacheImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(tileCacheImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps halo assembly transport, submission, synchronization, and readback explicit', () => {
    const tileHaloImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-tile-halo.ts', import.meta.url),
      'utf8'
    );

    expect(tileHaloImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(tileHaloImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(tileHaloImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps analytical overview decoding, submission, synchronization, and readback explicit', () => {
    const overviewImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-overview.ts', import.meta.url),
      'utf8'
    );

    expect(overviewImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(overviewImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(overviewImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps global tile replay, command submission, and analytical readback application-owned', () => {
    const globalStatisticsImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-global-statistics.ts', import.meta.url),
      'utf8'
    );

    expect(globalStatisticsImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(globalStatisticsImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(globalStatisticsImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps component convergence, transport, submission, and synchronization graph-native', () => {
    const connectedComponentsImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-connected-components.ts', import.meta.url),
      'utf8'
    );

    expect(connectedComponentsImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(connectedComponentsImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(connectedComponentsImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps dense relabeling, component counts, and capacity status graph-native', () => {
    const denseComponentsImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-dense-components.ts', import.meta.url),
      'utf8'
    );

    expect(denseComponentsImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(denseComponentsImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(denseComponentsImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps region measurements, transport, submission, and synchronization application-owned', () => {
    const regionMeasurementsImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-region-measurements.ts', import.meta.url),
      'utf8'
    );

    expect(regionMeasurementsImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(regionMeasurementsImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(regionMeasurementsImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('keeps cross-tile identity, region merging, and execution graph-native', () => {
    const crossTileComponentsImplementation = readFileSync(
      new URL('../../src/luraster/gpu-raster-cross-tile-components.ts', import.meta.url),
      'utf8'
    );

    expect(crossTileComponentsImplementation).not.toMatch(
      /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/
    );
    expect(crossTileComponentsImplementation).not.toMatch(/\bfetch\s*\(/);
    expect(crossTileComponentsImplementation).not.toMatch(
      /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/
    );
  });

  test('exposes source, tile, global, component, neighborhood, morphology, and contour APIs', () => {
    expect(lurasterModule.GPURaster).toBeTypeOf('function');
    expect(lurasterModule.GPURasterBandMath).toBeTypeOf('function');
    expect(lurasterModule.GPURasterBoxBlur).toBeTypeOf('function');
    expect(lurasterModule.GPURasterBufferToTexture).toBeTypeOf('function');
    expect(lurasterModule.GPURasterCategoricalOverview).toBeTypeOf('function');
    expect(lurasterModule.GPURasterCategoricalOverview.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterClosing).toBeTypeOf('function');
    expect(lurasterModule.GPURasterConnectedComponents).toBeTypeOf('function');
    expect(lurasterModule.GPURasterConnectedComponents.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterCrossTileComponents).toBeTypeOf('function');
    expect(lurasterModule.GPURasterCrossTileComponents.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterDenseComponents).toBeTypeOf('function');
    expect(lurasterModule.GPURasterDenseComponents.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterRegionMeasurements).toBeTypeOf('function');
    expect(lurasterModule.GPURasterRegionMeasurements.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.getRasterRegionWorldCentroid).toBeTypeOf('function');
    expect(lurasterModule.GPURasterContrast).toBeTypeOf('function');
    expect(lurasterModule.GPURasterContourClassifier).toBeTypeOf('function');
    expect(lurasterModule.GPURasterContours).toBeTypeOf('function');
    expect(lurasterModule.GPURasterConvolution).toBeTypeOf('function');
    expect(lurasterModule.GPURasterDilation).toBeTypeOf('function');
    expect(lurasterModule.GPURasterErosion).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGaussianBlur).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalHistogramMerge).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalHistogramMerge.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(lurasterModule.GPURasterGlobalInitialize).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalInitialize.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalPercentile).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalPercentile.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalStatisticsMerge).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGlobalStatisticsMerge.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(lurasterModule.GPURasterGradient).toBeTypeOf('function');
    expect(lurasterModule.GPURasterGradientMagnitude).toBeTypeOf('function');
    expect(lurasterModule.GPURasterHistogram).toBeTypeOf('function');
    expect(lurasterModule.GPURasterLaplacian).toBeTypeOf('function');
    expect(lurasterModule.GPURasterMorphology).toBeTypeOf('function');
    expect(lurasterModule.GPURasterNDVI).toBeTypeOf('function');
    expect(lurasterModule.GPURasterNeighborhood).toBeTypeOf('function');
    expect(lurasterModule.GPURasterOtsuThreshold).toBeTypeOf('function');
    expect(lurasterModule.GPURasterOpening).toBeTypeOf('function');
    expect(lurasterModule.GPURasterOverview).toBeTypeOf('function');
    expect(lurasterModule.GPURasterOverview.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterScharr).toBeTypeOf('function');
    expect(lurasterModule.GPURasterSobel).toBeTypeOf('function');
    expect(lurasterModule.GPURasterStatistics).toBeTypeOf('function');
    expect(lurasterModule.GPURasterThreshold).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileCache).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileCoreExtract).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileGraphLease).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloAssembler).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloAssembler.prototype.plan).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloAssembler.prototype.acquire).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloFill).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloFill.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloLease).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileHaloLease.prototype.releaseAfter).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileCoreExtract.prototype.addToGraph).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileLease).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileReader).toBeTypeOf('function');
    expect(lurasterModule.GPURasterTileReader.prototype.normalizeTileRequest).toBeTypeOf(
      'function'
    );
    expect(lurasterModule.GPURasterTextureToBuffer).toBeTypeOf('function');
    expect(lurasterModule.getRasterDeviceLimits).toBeTypeOf('function');
    expect(lurasterModule.makeRasterOverviewMetadata).toBeTypeOf('function');
    expect(lurasterModule.planRasterDispatchStripes).toBeTypeOf('function');
  });
});
