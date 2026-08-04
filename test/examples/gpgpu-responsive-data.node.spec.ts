// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {compileProjectionPlan, evaluateProjectionPlan} from '@luma.gl/experimental/luproj';
import {describe, expect, test} from 'vitest';
import {
  makeLuSpatialTaxiData,
  makeLuSpatialTaxiDataAsync,
  projectTaxiLongitudeLatitude,
  TAXI_PROJECTION_ORIGIN
} from '../../examples/deck/luspatial-taxi/taxi-data';

const TAXI_EFFECT_SOURCE_PATH = path.join(
  process.cwd(),
  'examples/deck/luspatial-taxi/luspatial-query-effect.ts'
);
const TAXI_APP_SOURCE_PATH = path.join(process.cwd(), 'examples/deck/luspatial-taxi/app.ts');
const ATLAS_APP_SOURCE_PATH = path.join(
  process.cwd(),
  'examples/showcase/billion-point-spatial-atlas/app.ts'
);

describe('responsive GPU data examples', () => {
  test('progressively generates the exact deterministic taxi population and reports progress', async () => {
    const pointCount = 257;
    const progress: number[] = [];
    const expected = makeLuSpatialTaxiData(pointCount);
    const actual = await makeLuSpatialTaxiDataAsync(pointCount, {
      chunkSize: 31,
      onProgress: processedPointCount => progress.push(processedPointCount)
    });

    expect(actual.pointCount).toBe(pointCount);
    expect(actual.longitudeLatitudes).toEqual(expected.longitudeLatitudes);
    expect(actual.sourceBounds).toEqual(expected.sourceBounds);
    expect(actual.projectedBounds).toEqual(expected.projectedBounds);
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(pointCount);
    expect(progress.length).toBeGreaterThan(2);
    expect(progress.every((value, index) => index === 0 || value > progress[index - 1])).toBe(true);
  });

  test('cancels dataset generation before subsequent chunks when navigating away', async () => {
    const abortController = new AbortController();
    const progress: number[] = [];
    const generation = makeLuSpatialTaxiDataAsync(512, {
      chunkSize: 32,
      signal: abortController.signal,
      onProgress: processedPointCount => {
        progress.push(processedPointCount);
        if (processedPointCount === 32) abortController.abort();
      }
    });

    await expect(generation).rejects.toMatchObject({name: 'AbortError'});
    expect(progress).toEqual([0, 32]);
  });

  test('compiles a real luProj plan that preserves local taxi-query projection semantics', () => {
    const data = makeLuSpatialTaxiData(128);
    const plan = compileProjectionPlan({
      projection: coordinates => {
        const projected = projectTaxiLongitudeLatitude([coordinates[0], coordinates[1]]);
        return [projected[0], projected[1]];
      },
      bounds: data.sourceBounds,
      degree: 2,
      tolerance: 0.0005,
      maxDepth: 4
    });

    expect(plan.destinationOrigin[0]).toBeCloseTo(0, 10);
    expect(plan.destinationOrigin[1]).toBeCloseTo(0, 10);

    for (let pointIndex = 0; pointIndex < data.pointCount; pointIndex++) {
      const coordinate = [
        data.longitudeLatitudes[pointIndex * 2],
        data.longitudeLatitudes[pointIndex * 2 + 1]
      ] as const;
      const expected = projectTaxiLongitudeLatitude(coordinate);
      const actual = evaluateProjectionPlan(plan, coordinate);

      expect(actual[0] - plan.destinationOrigin[0]).toBeCloseTo(expected[0], 3);
      expect(actual[1] - plan.destinationOrigin[1]).toBeCloseTo(expected[1], 3);
      expect(data.projectedBounds[0]).toBeLessThanOrEqual(expected[0]);
      expect(data.projectedBounds[1]).toBeLessThanOrEqual(expected[1]);
      expect(data.projectedBounds[2]).toBeGreaterThanOrEqual(expected[0]);
      expect(data.projectedBounds[3]).toBeGreaterThanOrEqual(expected[1]);
    }

    expect(data.sourceBounds[0] + data.sourceBounds[2]).toBeCloseTo(
      TAXI_PROJECTION_ORIGIN[0] * 2,
      10
    );
    expect(data.sourceBounds[1] + data.sourceBounds[3]).toBeCloseTo(
      TAXI_PROJECTION_ORIGIN[1] * 2,
      10
    );
  });

  test('composes actual luProj projection with cancellable luSpatial graph execution', () => {
    const effectSource = readFileSync(TAXI_EFFECT_SOURCE_PATH, 'utf8');
    const appSource = readFileSync(TAXI_APP_SOURCE_PATH, 'utf8');

    expect(effectSource).toMatch(/from ['"]@luma\.gl\/experimental\/luproj['"]/);
    expect(effectSource).toMatch(/new GPUProjection\s*\(/);
    expect(effectSource).toMatch(/compileProjectionPlan\s*\(/);
    expect(effectSource).toMatch(/this\.projection\?\.destroy\(\)/);
    expect(effectSource).toMatch(/if\s*\(!viewportBoundsChanged && !this\.queryInputsChanged\)/);
    expect(appSource).toMatch(/makeLuSpatialTaxiDataAsync\s*\(/);
    expect(appSource).toMatch(/generationController\.abort\(\)/);
    expect(appSource).toMatch(/role="progressbar"/);
    expect(appSource).toMatch(/map\.off\('error', handleBasemapError\)/);
  });

  test('preserves the latest taxi selection while GPU data is still initializing', () => {
    const appSource = readFileSync(TAXI_APP_SOURCE_PATH, 'utf8');
    const zoneChangeSource = appSource.match(/onZoneChange: zone => \{([\s\S]*?)\n    \}\n  \}\);/);
    const clickSource = appSource.match(
      /onClick: \(info: PickingInfo\) => \{([\s\S]*?)\n    \},\n    onViewStateChange:/
    );

    expect(appSource).toContain(
      'let latestSelectionCenter: readonly [number, number] = initialZone.center;'
    );
    expect(zoneChangeSource?.[1]).toContain('latestSelectionCenter = zone.center;');
    expect(clickSource?.[1]).toContain('latestSelectionCenter = center;');
    expect(appSource).toContain(
      'queryEffect.setSelection(latestSelectionCenter, queryRadiusKilometres);'
    );
  });

  test('loads the spatial atlas progressively and reuses its GPU index and query results', () => {
    const atlasSource = readFileSync(ATLAS_APP_SOURCE_PATH, 'utf8');
    const constructorSource = atlasSource.match(
      /constructor\(\{device\}: AnimationProps\)\s*\{([\s\S]*?)\n  \}\n\n  override async onInitialize/
    );
    const gridCountSource = atlasSource.match(
      /function makeGridCellCounts\s*\([\s\S]*?\n\}\n\nfunction countCandidates/
    );

    expect(constructorSource).not.toBeNull();
    expect(constructorSource![1]).toMatch(/this\.currentPositions\s*=\s*new Float32Array\(0\)/);
    expect(constructorSource![1]).not.toMatch(/makeSyntheticTaxiPositions\s*\(/);
    expect(atlasSource).toMatch(/await this\.loadSyntheticDataset\(this\.mode, this\.capacity\)/);
    expect(atlasSource).toMatch(/await yieldAtlasGeneration\(generationController\.signal\)/);
    expect(atlasSource).toMatch(/this\.dataGenerationAbortController\?\.abort\(\)/);
    expect(atlasSource).toMatch(/this\.resizeResources\(resources,/);
    expect(atlasSource).toMatch(
      /queryChanged \? this\.getQueryGraph\(resources\) : resources\.renderGraph/
    );
    expect(atlasSource).toMatch(/if\s*\(!graph\)\s*\{\s*graph = this\.createQueryGraph/);
    expect(gridCountSource).not.toBeNull();
    expect(gridCountSource![0]).not.toMatch(/new Array<number>\(dimension\)/);
    expect(atlasSource).toMatch(/resources\.renderGraph\.destroy\(\)/);
  });
});
