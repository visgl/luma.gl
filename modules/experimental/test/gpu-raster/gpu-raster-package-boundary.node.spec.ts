// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {describe, expect, test} from 'vitest';
import * as experimentalModule from '@luma.gl/experimental';
import * as gpuRasterModule from '@luma.gl/experimental/gpu-raster';

describe('@luma.gl/experimental/gpu-raster package boundary', () => {
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
    expect(packageJson.private).not.toBe(true);
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./gpu-raster']).toEqual({
      import: './dist/gpu-raster/index.js',
      require: './dist/gpu-raster/index.cjs',
      types: './dist/gpu-raster/index.d.ts'
    });
    expect(packageJson.exports?.['./geospatial']).toBeDefined();
    expect(packageJson.exports?.['./gpu-crossfilter']).toBeDefined();
  });

  test('keeps every GPURaster runtime export outside the experimental root', () => {
    for (const exportName of Object.keys(gpuRasterModule)) {
      expect(exportName in experimentalModule).toBe(false);
    }
  });

  test('keeps external tile decoding, transport, and GPU ownership in the application', () => {
    const tileSourceImplementation = readFileSync(
      new URL('../../src/gpu-raster/gpu-raster-tile-source.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-tile-cache.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-tile-halo.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-overview.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-global-statistics.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-connected-components.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-dense-components.ts', import.meta.url),
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
      new URL('../../src/gpu-raster/gpu-raster-region-measurements.ts', import.meta.url),
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

  test('exposes source, tile, global, component, neighborhood, morphology, and contour APIs', () => {
    expect(gpuRasterModule.GPURaster).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterBandMath).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterBoxBlur).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterBufferToTexture).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterCategoricalOverview).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterCategoricalOverview.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.GPURasterClosing).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterConnectedComponents).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterConnectedComponents.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.GPURasterDenseComponents).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterDenseComponents.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterRegionMeasurements).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterRegionMeasurements.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterCrossTileComponents).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterCrossTileComponents.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.getRasterRegionWorldCentroid).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterContrast).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterContourClassifier).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterContours).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterConvolution).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterDilation).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterErosion).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGaussianBlur).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalHistogramMerge).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalHistogramMerge.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.GPURasterGlobalInitialize).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalInitialize.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalPercentile).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalPercentile.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalStatisticsMerge).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGlobalStatisticsMerge.prototype.addToGraph).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.GPURasterGradient).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterGradientMagnitude).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterHistogram).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterLaplacian).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterMorphology).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterNDVI).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterNeighborhood).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterOtsuThreshold).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterOpening).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterOverview).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterOverview.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterScharr).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterSobel).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterStatistics).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterThreshold).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileCache).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileCoreExtract).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileGraphLease).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloAssembler).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloAssembler.prototype.plan).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloAssembler.prototype.acquire).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloFill).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloFill.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloLease).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileHaloLease.prototype.releaseAfter).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileCoreExtract.prototype.addToGraph).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileLease).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileReader).toBeTypeOf('function');
    expect(gpuRasterModule.GPURasterTileReader.prototype.normalizeTileRequest).toBeTypeOf(
      'function'
    );
    expect(gpuRasterModule.GPURasterTextureToBuffer).toBeTypeOf('function');
    expect(gpuRasterModule.getRasterDeviceLimits).toBeTypeOf('function');
    expect(gpuRasterModule.makeRasterOverviewMetadata).toBeTypeOf('function');
    expect(gpuRasterModule.planRasterDispatchStripes).toBeTypeOf('function');
  });
});
