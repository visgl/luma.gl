// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {GPURasterTileReader} from '../../modules/experimental/src/gpu-raster/gpu-raster-tile-source';
import {
  makeRasterLabDataset,
  RASTER_LAB_NO_DATA_VALUE
} from '../../examples/showcase/raster-lab/raster-data';
import {
  makeRasterLabGeneratedOverviewDataset,
  makeRasterLabTileDataset,
  RasterLabTileSource
} from '../../examples/showcase/raster-lab/raster-tile-source';

describe('GPURaster Satellite Raster Lab synthetic imagery', () => {
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
    expect(decoded.bands[0]?.validity).toBe(decoded.bands[1]?.validity);
    expect(source.readCount).toBe(1);
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

  test('provides exact adjacent native and overview samples across a ragged owned seam', async () => {
    const reader = new GPURasterTileReader(new RasterLabTileSource(97, 65));

    for (const level of [0, 1]) {
      const full = await reader.readTile({level});
      const western = await reader.readTile({level, column: 0, row: 0});
      const eastern = await reader.readTile({level, column: 1, row: 0});

      expect(western.pixelBounds[2]).toBe(eastern.pixelBounds[0]);
      expect(western.metadata.width + eastern.metadata.width).toBe(full.metadata.width);
      expect(western.metadata.height).toBe(full.metadata.height);
      expect(eastern.metadata.height).toBe(full.metadata.height);

      for (const [bandIndex, fullBand] of full.bands.entries()) {
        const westernBand = western.bands[bandIndex]!;
        const easternBand = eastern.bands[bandIndex]!;
        for (let row = 0; row < full.metadata.height; row++) {
          const westernSeamIndex = row * western.metadata.width + western.metadata.width - 1;
          const easternSeamIndex = row * eastern.metadata.width;
          const fullSeamIndex = row * full.metadata.width + western.metadata.width;

          expect(westernBand.values[westernSeamIndex]).toBe(fullBand.values[fullSeamIndex - 1]);
          expect(easternBand.values[easternSeamIndex]).toBe(fullBand.values[fullSeamIndex]);
          expect(westernBand.validity?.[westernSeamIndex]).toBe(
            fullBand.validity?.[fullSeamIndex - 1]
          );
          expect(easternBand.validity?.[easternSeamIndex]).toBe(fullBand.validity?.[fullSeamIndex]);
        }
      }
    }
  });

  test('derives ragged generated overview metadata without retaining native sample allocations', async () => {
    const reader = new GPURasterTileReader(new RasterLabTileSource(97, 65));
    const native = await reader.readTile({level: 0});
    const generated = makeRasterLabGeneratedOverviewDataset(native, 'full');

    expect(generated.width).toBe(49);
    expect(generated.height).toBe(33);
    expect(generated.pixelCount).toBe(49 * 33);
    expect(generated.overviewLevel).toBe(1);
    expect(generated.levelZeroOrigin).toEqual([0, 0]);
    expect(generated.coordinateReferenceSystem).toBe('EPSG:32610');
    expect(generated.metadata?.affine).toEqual([20, 0, 552400, 0, -20, 4187600]);
    expect(generated.red).toHaveLength(0);
    expect(generated.nearInfrared).toHaveLength(0);
    expect(generated.validity).toHaveLength(0);
    expect(generated.red.buffer).not.toBe(native.bands[0]?.values.buffer);
    expect(generated.validity.buffer).not.toBe(native.bands[0]?.validity?.buffer);
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
    expect(rasterApplication).toContain('const engine = new RasterLabEngine(');
    expect(rasterApplication).toContain('replacement = replacementGraphLease.value');
    expect(rasterEngine).toContain('{metadata: this.dataset.metadata}');
    expect(rasterInterface).toContain('data-raster-source-tile="west"');
    expect(rasterInterface).toContain('data-raster-source-tile="east"');
    expect(rasterInterface).toContain('data-raster-source-overview="1"');
    expect(rasterInterface).toContain('single tile · no halo');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });

  test('enforces explicit decoded/GPU tile budgets and publishes actual cache telemetry', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
    const rasterInterface = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-interface.ts', import.meta.url),
      'utf8'
    );
    const rasterSource = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-tile-source.ts', import.meta.url),
      'utf8'
    );

    expect(rasterApplication).toContain('new GPURasterTileCache({');
    expect(rasterApplication).toContain('reader: this.tileReader');
    expect(rasterApplication).toContain('this.tileCache.acquire(request, controller.signal)');
    expect(rasterApplication).toContain('this.tileCache.setBudgets(');
    expect(rasterApplication).toContain('maxTiles: capacity');
    expect(rasterApplication).toContain('maxGraphs: 2');
    expect(rasterApplication).toContain('maxCpuBytes:');
    expect(rasterApplication).toContain('maxGpuBytes:');
    expect(rasterApplication).toContain('const stats = this.tileCache.stats');
    expect(rasterApplication).toContain('const budgets = this.tileCache.budgets');
    expect(rasterApplication).toContain('tileHits: stats.tileHits');
    expect(rasterApplication).toContain('tileMisses: stats.tileMisses');
    expect(rasterApplication).toContain('tileEvictions: stats.tileEvictions');
    expect(rasterApplication).toContain('graphHits: stats.graphHits');
    expect(rasterApplication).toContain('graphCompilations: stats.graphCompilations');
    expect(rasterApplication).toContain('pinnedTiles: stats.pinnedTiles');
    expect(rasterApplication).toContain('pinnedGraphs: stats.pinnedGraphs');
    expect(rasterSource).toContain('this.readCount++');
    expect(rasterInterface).toContain('data-raster-control="cache-capacity"');
    expect(rasterInterface).toContain('data-raster-cache-cpu');
    expect(rasterInterface).toContain('data-raster-cache-gpu');
    expect(rasterInterface).toContain('data-raster-cache-activity');
    expect(rasterInterface).toContain('data-raster-cache-graphs');
    expect(rasterInterface).toContain('data-raster-cache-pins');
  });

  test('reuses compiled graphs through borrowed tile-buffer replacement and owner accounting', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
    const rasterEngine = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-engine.ts', import.meta.url),
      'utf8'
    );
    const rasterRenderer = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-renderer.ts', import.meta.url),
      'utf8'
    );

    expect(rasterApplication).toContain('this.tileCache.acquireGraph(tileLease, {');
    expect(rasterApplication).toContain('pipelineKey,');
    expect(rasterApplication).toContain('halo: halo?.plan.requiredHalo ?? 0,');
    expect(rasterApplication).toContain('estimatedByteLength: estimateRasterGraphBytes(');
    expect(rasterApplication).toContain('graph: engine.commandGraph');
    expect(rasterApplication).toContain('byteLength: engine.ownedByteLength');
    expect(rasterApplication).toContain('destroy: () => engine.destroy()');
    expect(rasterEngine).toContain('this.compiledGraph.encode(encoder, {');
    expect(rasterEngine).toContain('red: this.buffers.red');
    expect(rasterEngine).toContain("'near-infrared': this.buffers.nearInfrared");
    expect(rasterEngine).toContain("'source-validity': this.buffers.sourceValidity");
    expect(rasterEngine).toContain(
      'this.renderer.setSourceBuffers(sources.red, sources.nearInfrared)'
    );
    expect(rasterEngine).toContain("name === 'sourceValidity'");
    expect(rasterRenderer).toContain(
      'this.model.setBindings({redValues: red, nearInfraredValues: nearInfrared})'
    );
  });

  test('assembles resident neighbor halos, publishes only owned cores, and fences every lease', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
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
    const analysisSubmission = rasterEngine.indexOf('this.device.submit(encoder.finish());');
    const summaryReadback = rasterEngine.indexOf('await this.buffers.summaryReadback.readAsync()');
    const haloAssembly = rasterEngine.indexOf('new GPURasterTileHaloFill({');
    const coreExtraction = rasterEngine.indexOf('new GPURasterTileCoreExtract({');
    const ownedStatistics = rasterEngine.indexOf('new GPURasterStatistics({');
    const shutdownStart = rasterApplication.indexOf('override onFinalize(): void {');
    const shutdownEnd = rasterApplication.indexOf('private setSourceTile(', shutdownStart);
    const shutdown = rasterApplication.slice(shutdownStart, shutdownEnd);

    expect(analysisSubmission).toBeGreaterThan(0);
    expect(summaryReadback).toBeGreaterThan(analysisSubmission);
    expect(haloAssembly).toBeGreaterThan(0);
    expect(coreExtraction).toBeGreaterThan(haloAssembly);
    expect(ownedStatistics).toBeGreaterThan(coreExtraction);
    expect(rasterRenderer).toContain('this.device.submit(encoder.finish());');
    expect(rasterApplication).toContain('new GPURasterTileHaloAssembler(this.tileCache)');
    expect(rasterApplication).toContain('this.haloAssembler.acquire(');
    expect(rasterApplication).toContain('stages: this.getHaloStages()');
    expect(rasterApplication).toContain('replacementHaloLease.core');
    expect(rasterApplication).toContain('halo: halo?.plan.requiredHalo ?? 0');
    expect(rasterApplication).toContain('this.display.morphologyRadius * (composed ? 2 : 1)');
    expect(rasterApplication).toContain("this.haloMode === 'seamless' && requestedCapacity < 2");
    expect(rasterApplication).toContain('const fence = this.device.createFence();');
    expect(rasterApplication).toContain('graphLease.releaseAfter(fence)');
    expect(rasterApplication).toContain('tileLease.releaseAfter(fence)');
    expect(rasterApplication).toContain('haloLease.releaseAfter(fence)');
    expect(shutdown).toMatch(/(?:releaseAfterSubmittedWork\(|\.releaseAfter\()/);
    expect(shutdown).not.toContain('this.activeGraphLease?.release()');
    expect(shutdown).not.toContain('this.activeTileLease?.release()');
    expect(shutdown).toContain('this.tileCache.destroy()');
    expect(rasterEngine).toContain('pixelBounds: this.halo.plan.availablePixelBounds');
    expect(rasterEngine).toContain('corePixelBounds: this.halo.plan.corePixelBounds');
    expect(rasterEngine).toContain('input: coreProcessingBand');
    expect(rasterEngine).toContain('paddedBinarySeed');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
    expect(rasterInterface).toContain('data-raster-halo-mode="seamless"');
    expect(rasterInterface).toContain('data-raster-halo-radius');
    expect(rasterInterface).toContain('data-raster-halo-core');
    expect(rasterInterface).toContain('data-raster-halo-sources');
    expect(rasterInterface).toContain('single tile · no halo');
  });

  test('generates analytical float and categorical overviews directly from native resident buffers', () => {
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
    const rasterSource = readFileSync(
      new URL('../../examples/showcase/raster-lab/raster-tile-source.ts', import.meta.url),
      'utf8'
    );
    const generatedDataset = rasterSource.slice(
      rasterSource.indexOf('export function makeRasterLabGeneratedOverviewDataset('),
      rasterSource.indexOf('function waitForSourceAdapter(')
    );
    const cloudCategory = rasterEngine.slice(
      rasterEngine.indexOf("const nativeCloudCategories: GPURasterBufferBand<'uint32'>"),
      rasterEngine.indexOf('new GPURasterCategoricalOverview({')
    );

    expect(rasterApplication).toContain('const sourceLevel = generatesOverview ? 0 : level');
    expect(rasterApplication).toContain('categoryPolicy: overview.categoryPolicy');
    expect(rasterApplication).toContain("this.overviewPolicy = 'source'");
    expect(rasterApplication).toContain("this.haloMode = 'off'");
    expect(rasterEngine.match(/new GPURasterOverview\(\{/g)).toHaveLength(2);
    expect(rasterEngine).toContain('new GPURasterCategoricalOverview({');
    expect(rasterEngine).toContain('sum: redSum');
    expect(rasterEngine).toContain('validCount: redValidCount');
    expect(rasterEngine).toContain('policy: this.overview.categoryPolicy');
    expect(cloudCategory).not.toContain('validity:');
    expect(rasterEngine.indexOf('new GPURasterOverview({')).toBeLessThan(
      rasterEngine.indexOf('new GPURasterNDVI({')
    );
    expect(generatedDataset).toContain('makeRasterOverviewMetadata(tile.metadata, 2');
    expect(generatedDataset).toContain('EMPTY_RASTER_FLOAT_VALUES');
    expect(generatedDataset).toContain('EMPTY_RASTER_VALIDITY_VALUES');
    expect(generatedDataset).not.toMatch(/\bfor\s*\(/);
    expect(generatedDataset).not.toContain('.subarray(');
    expect(rasterInterface).toContain('data-raster-overview-policy="source"');
    expect(rasterInterface).toContain('data-raster-overview-policy="mean"');
    expect(rasterInterface).toContain('data-raster-category-policy="nearest"');
    expect(rasterInterface).toContain('data-raster-category-policy="mode"');
    expect(rasterInterface).toContain('Excluded observations');
    expect(rasterInterface).toContain('displayed valid');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });

  test('globally replays fenced bounded source cores without expanding the fixed aggregate transfer', () => {
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
    const accumulation = rasterEngine.slice(
      rasterEngine.indexOf('private addGlobalAccumulator('),
      rasterEngine.indexOf(
        'private importView<',
        rasterEngine.indexOf('private addGlobalAccumulator(')
      )
    );

    expect(rasterApplication).toContain(
      'this.tileCache.acquire(secondaryRequest, controller.signal)'
    );
    expect(rasterApplication).toContain('this.activeGlobalLeases = replacementGlobalLeases ?? []');
    expect(rasterApplication).toContain('lease.releaseAfter(fence)');
    expect(rasterApplication).toContain("this.analysisScope === 'global' && requestedCapacity < 2");
    expect(rasterApplication).toContain('this.resetGlobalAnalysis()');
    expect(rasterEngine).toContain('this.createGlobalBands(graph, contrastOptions)');
    expect(rasterEngine).toContain('new GPURasterGlobalInitialize({');
    expect(rasterEngine).toContain('new GPURasterGlobalStatisticsMerge({');
    expect(rasterEngine).toContain('new GPURasterGlobalHistogramMerge({');
    expect(rasterEngine).toContain('new GPURasterGlobalPercentile({');
    expect(rasterEngine).toContain("this.addGlobalAccumulator(graph, 'baseline'");
    expect(rasterEngine).toContain("this.addGlobalAccumulator(graph, 'output'");
    expect(accumulation.indexOf('new GPURasterGlobalInitialize({')).toBeLessThan(
      accumulation.indexOf('new GPURasterGlobalStatisticsMerge({')
    );
    expect(accumulation.indexOf('new GPURasterGlobalStatisticsMerge({')).toBeLessThan(
      accumulation.indexOf('new GPURasterGlobalHistogramMerge({')
    );
    expect(rasterEngine.match(/\.readAsync\(/g)).toHaveLength(1);
    expect(rasterEngine).toContain('destinationOffset: THRESHOLD_BYTE_OFFSET');
    expect(rasterEngine).toContain('globalMedian:');
    expect(rasterInterface).toContain('data-raster-analysis-scope="global"');
    expect(rasterInterface).toContain('data-raster-replay-order="reverse"');
    expect(rasterInterface).toContain('data-raster-global-median');
    expect(rasterInterface).toContain('this.globalPixelCount');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });

  test('renders sparse classified foreground roots with explicit connectivity and convergence', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
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
    const components = rasterEngine.slice(
      rasterEngine.indexOf("const componentInput: GPURasterBufferBand<'uint32'>"),
      rasterEngine.indexOf(
        'if (this.settings.contoursEnabled)',
        rasterEngine.indexOf('const componentInput:')
      )
    );

    expect(components).toContain("storage: {kind: 'buffer', values: thresholdValidity}");
    expect(components).toContain(
      'validity: binaryMorphologyEnabled ? binaryMorphologyValidity : analyzedValidity'
    );
    expect(components).toContain('new GPURasterConnectedComponents({');
    expect(components).toContain('output: sparseComponentLabels');
    expect(components).toContain('outputValidity: sparseComponentValidity');
    expect(components).toContain('converged: contourOverflow');
    expect(components).toContain('iterationCount: contourRequiredSegmentCount');
    expect(rasterEngine.match(/\.readAsync\(/g)).toHaveLength(1);
    expect(rasterApplication).toContain('this.display.contoursEnabled = false');
    expect(rasterApplication).toContain(
      'this.display.contoursEnabled = this.previousComponentContours'
    );
    expect(rasterApplication).toContain('this.resetGlobalAnalysis()');
    expect(rasterApplication).toContain('this.latestSummary.componentsEnabled &&');
    expect(rasterApplication).toContain('this.latestSummary.componentConverged &&');
    expect(rasterRenderer).toContain('componentLabelValues[pixelIndex]');
    expect(rasterRenderer).toContain('if (label == 0u)');
    expect(rasterInterface).toContain('data-raster-component-mode="on"');
    expect(rasterInterface).toContain('data-raster-component-connectivity="4"');
    expect(rasterInterface).toContain('data-raster-component-connectivity="8"');
    expect(rasterInterface).toContain('data-raster-control="component-iterations"');
    expect(rasterInterface).toContain('unresolved · labels cleared');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
    expect(rasterInterface).not.toContain('data-raster-largest-component');
  });

  test('compacts sparse roots into bounded dense identifiers without expanding readback', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
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
    const denseComponents = rasterEngine.slice(
      rasterEngine.indexOf('const denseComponentLabels ='),
      rasterEngine.indexOf(
        'if (this.settings.contoursEnabled)',
        rasterEngine.indexOf('new GPURasterDenseComponents({')
      )
    );

    expect(denseComponents).toContain('input: sparseComponentLabels');
    expect(denseComponents).toContain('inputValidity: sparseComponentValidity');
    expect(denseComponents).toContain('converged: contourOverflow');
    expect(denseComponents).toContain('requiredComponentCount: contourSegmentCount');
    expect(denseComponents).toContain("'raster-lab-bounded-component-count'");
    expect(denseComponents).toContain("'raster-lab-component-overflow'");
    expect(denseComponents).toContain('const componentCapacity = Math.min(');
    expect(denseComponents).toContain('capacity: componentCapacity');
    expect(rasterEngine).toContain('aggregateView.getUint32(CONTOUR_COUNT_BYTE_OFFSET, true)');
    expect(rasterEngine).toContain('Math.min(componentCount, this.settings.componentCapacity)');
    expect(rasterEngine.match(/\.readAsync\(/g)).toHaveLength(1);
    expect(rasterApplication).toContain("this.display.componentLabelMode === 'sparse'");
    expect(rasterApplication).toContain('!this.latestSummary.componentOverflow');
    expect(rasterRenderer).toContain('@group(0) @binding(7)');
    expect(rasterRenderer).not.toContain('@binding(8) var<storage');
    expect(rasterInterface).toContain('data-raster-component-labels="sparse"');
    expect(rasterInterface).toContain('data-raster-component-labels="dense"');
    expect(rasterInterface).toContain('data-raster-control="component-capacity"');
    expect(rasterInterface).toContain('data-raster-component-count');
    expect(rasterInterface).toContain('data-raster-component-published');
    expect(rasterInterface).toContain('capacity exceeded · dense labels hidden');
    expect(rasterInterface).toContain('capacity exceeded · sparse roots visible');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
    expect(rasterInterface).not.toContain('data-raster-largest-component');
  });

  test('inspects one GPU-measured dense region inside the existing 228-byte boundary', () => {
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

    expect(rasterEngine).toContain('const HISTOGRAM_BIN_COUNT = 48');
    expect(rasterEngine).toContain('const REGION_MEASUREMENT_SCALAR_COUNT = 8');
    expect(rasterEngine).toContain('HISTOGRAM_BIN_COUNT - REGION_MEASUREMENT_SCALAR_COUNT');
    expect(rasterEngine).toContain('const REGION_RESULT_CAPACITY = 2048');
    expect(rasterEngine).toContain('new GPURasterRegionMeasurements({');
    expect(rasterEngine).toContain('intensity: analyzedBand');
    expect(rasterEngine).toContain('pixelCounts: this.importView(');
    expect(rasterEngine).toContain('intensityCounts: this.importView(');
    expect(rasterEngine).toContain('columnSums: this.importView(');
    expect(rasterEngine).toContain('centroidColumns: this.importView(');
    expect(rasterEngine).toContain('areas: this.importView(');
    expect(rasterEngine).toContain('const sourceOffset =');
    expect(rasterEngine).toContain('REGION_MEASUREMENT_BYTE_OFFSET + scalarIndex');
    expect(rasterEngine).toContain('getRasterRegionWorldCentroid(');
    expect(rasterEngine).toContain("? 'm²'");
    expect(rasterEngine).toContain(": 'coordinate units²'");
    expect(rasterEngine.match(/\.readAsync\(/g)).toHaveLength(1);
    expect(rasterApplication).toContain('await engine.update(this.selectedRegionId)');
    expect(rasterInterface).toContain('data-raster-region-metrics="on"');
    expect(rasterInterface).toContain('data-raster-control="region-id"');
    expect(rasterInterface).toContain('data-raster-region-pixels');
    expect(rasterInterface).toContain('data-raster-region-intensity-mean');
    expect(rasterInterface).toContain('data-raster-region-centroid');
    expect(rasterInterface).toContain('data-raster-region-area');
    expect(rasterInterface).toContain('40 bins · 8 region scalars · 228 bytes');
    expect(rasterInterface).toContain('48 bins · region inspection off');
    expect(rasterInterface).toContain('data-raster-histogram-bin-count');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
    expect(rasterInterface).not.toContain('data-raster-region-table');
  });

  test('stitches pinned tile-local regions and measurements without downloading any labels', () => {
    const rasterApplication = readFileSync(
      new URL('../../examples/showcase/raster-lab/app.ts', import.meta.url),
      'utf8'
    );
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
    const crossTileComponents = rasterEngine.slice(
      rasterEngine.indexOf('private addCrossTileComponents('),
      rasterEngine.indexOf('private importRegionOutputs(')
    );

    expect(crossTileComponents).toContain('new GPURasterThreshold({');
    expect(crossTileComponents).toContain('new GPURasterConnectedComponents({');
    expect(crossTileComponents).toContain('new GPURasterDenseComponents({');
    expect(crossTileComponents).toContain('new GPURasterRegionMeasurements({');
    expect(crossTileComponents).toContain('new GPURasterCrossTileComponents({');
    expect(crossTileComponents).toContain('metadata: global.metadata');
    expect(crossTileComponents).toContain('pixelBounds: tile.pixelBounds');
    expect(crossTileComponents).toContain('capacity: REGION_RESULT_CAPACITY');
    expect(crossTileComponents).toContain(
      'capacity: Math.min(this.settings.componentCapacity, REGION_RESULT_CAPACITY)'
    );
    expect(crossTileComponents).toContain('requiredComponentCount: published.requiredCount');
    expect(crossTileComponents).toContain('output: this.importRegionOutputs(graph)');
    expect(rasterEngine.match(/\.readAsync\(/g)).toHaveLength(1);
    expect(rasterApplication).toContain("this.display.componentScope === 'stitched'");
    expect(rasterApplication).toContain("kind: statistics ? 'statistics' : 'components'");
    expect(rasterApplication).toContain(
      'Cross-tile segmentation requires two resident source tiles'
    );
    expect(rasterApplication).toContain('this.resetStitchedComponents()');
    expect(rasterApplication).toContain('lease.releaseAfter(fence)');
    expect(rasterRenderer).toContain('@group(0) @binding(7)');
    expect(rasterRenderer).not.toContain('@binding(8) var<storage');
    expect(rasterInterface).toContain('data-raster-component-scope="local"');
    expect(rasterInterface).toContain('data-raster-component-scope="stitched"');
    expect(rasterInterface).toContain('LOCAL TILE');
    expect(rasterInterface).toContain('STITCHED DATASET');
    expect(rasterInterface).toContain('40 bins · 8 region scalars · 228 bytes');
    expect(rasterInterface).toContain('only 228 summary bytes are read');
  });
});
