// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as projectionModule from '@luma.gl/experimental/luproj';
import {
  compileProjectionPlan,
  createWebMercatorProjection,
  evaluateProjectionPlan,
  findProjectionPatch,
  packProjectionPlan,
  PROJECTION_PLAN_BOUNDS_WORD_LENGTH,
  PROJECTION_PATCH_WORD_LENGTH,
  WEB_MERCATOR_EARTH_RADIUS,
  WEB_MERCATOR_MAX_LATITUDE
} from '@luma.gl/experimental/luproj';
import {describe, expect, test} from 'vitest';

const LUPROJ_RUNTIME_EXPORTS = [
  'GPUProjection',
  'compileProjectionPlan',
  'createWebMercatorProjection',
  'evaluateProjectionPlan',
  'findProjectionPatch',
  'packProjectionPlan',
  'PROJECTION_PLAN_BOUNDS_WORD_LENGTH',
  'PROJECTION_PATCH_WORD_LENGTH',
  'WEB_MERCATOR_EARTH_RADIUS',
  'WEB_MERCATOR_MAX_LATITUDE'
] as const;

const EARTH_RADIUS_METERS = 6_378_137;
const DEGREES_TO_RADIANS = Math.PI / 180;

describe('@luma.gl/experimental/luproj package boundary', () => {
  test('publishes an optional, side-effect-free projection subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
      dependencies?: Record<string, string>;
    };

    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./luproj']).toEqual({
      import: './dist/luproj/index.js',
      require: './dist/luproj/index.cjs',
      types: './dist/luproj/index.d.ts'
    });
    expect(packageJson.dependencies?.['@math.gl/proj4']).toBeUndefined();
    expect(packageJson.dependencies?.proj4).toBeUndefined();
  });

  test('keeps projection execution exports off the root experimental entry point', () => {
    for (const exportName of LUPROJ_RUNTIME_EXPORTS) {
      expect(projectionModule[exportName]).toBeDefined();
      expect(exportName in experimentalModule).toBe(false);
    }
  });
});

describe('dependency-free Web Mercator projection provider', () => {
  test('matches known EPSG:3857 coordinates and inverse round-trips', () => {
    const projection = createWebMercatorProjection();
    const equator = projection.project([0, 0]);
    const worldEdge = projection.project([180, 0]);
    const sanFrancisco = projection.project([-122.4194, 37.7749]);
    const expectedSanFrancisco = projectWebMercator([-122.4194, 37.7749]);
    const roundTrip = projection.unproject?.(sanFrancisco);

    expect(WEB_MERCATOR_EARTH_RADIUS).toBe(6_378_137);
    expect(WEB_MERCATOR_MAX_LATITUDE).toBeCloseTo(85.05112877980659, 13);
    expect(equator[0]).toBe(0);
    expect(equator[1]).toBeCloseTo(0, 8);
    expect(worldEdge[0]).toBeCloseTo(Math.PI * WEB_MERCATOR_EARTH_RADIUS, 7);
    expect(worldEdge[1]).toBeCloseTo(0, 8);
    expect(sanFrancisco[0]).toBeCloseTo(expectedSanFrancisco[0], 7);
    expect(sanFrancisco[1]).toBeCloseTo(expectedSanFrancisco[1], 7);
    expect(roundTrip?.[0]).toBeCloseTo(-122.4194, 12);
    expect(roundTrip?.[1]).toBeCloseTo(37.7749, 12);
  });

  test('clamps both polar limits and rejects non-finite input', () => {
    const projection = createWebMercatorProjection();
    const northernBoundary = projection.project([0, WEB_MERCATOR_MAX_LATITUDE]);
    const southernBoundary = projection.project([0, -WEB_MERCATOR_MAX_LATITUDE]);

    expect(projection.project([0, 90])).toEqual(northernBoundary);
    expect(projection.project([0, -90])).toEqual(southernBoundary);
    expect(northernBoundary[1]).toBeCloseTo(Math.PI * WEB_MERCATOR_EARTH_RADIUS, 5);
    expect(southernBoundary[1]).toBeCloseTo(-Math.PI * WEB_MERCATOR_EARTH_RADIUS, 5);
    expect(() => projection.project([Number.NaN, 0])).toThrow();
    expect(() => projection.project([0, Number.POSITIVE_INFINITY])).toThrow();
    expect(() => projection.unproject?.([Number.NEGATIVE_INFINITY, 0])).toThrow();
    expect(() => projection.unproject?.([0, Number.NaN])).toThrow();
  });

  test('compiles directly as a provider without loading proj4', () => {
    const projection = createWebMercatorProjection();
    const plan = compileProjectionPlan({
      projection,
      bounds: [-122.45, 37.75, -122.4, 37.8],
      degree: 3,
      tolerance: 0.01
    });
    const coordinate = [-122.4194, 37.7749] as const;
    const expected = projection.project([...coordinate]);
    const actual = evaluateProjectionPlan(plan, coordinate);

    expect(plan.maxError).toBeLessThanOrEqual(plan.tolerance);
    expect(Math.hypot(actual[0] - expected[0], actual[1] - expected[1])).toBeLessThanOrEqual(
      plan.tolerance
    );
  });
});

describe('CPU projection plan compilation', () => {
  test('accepts object projection providers and preserves their receiver', () => {
    class AffineProjection {
      readonly translation: readonly [number, number] = [12_345, -67_890];

      project(coordinates: number[]): number[] {
        return [coordinates[0] * 2 + this.translation[0], coordinates[1] * 3 + this.translation[1]];
      }
    }

    const projection = new AffineProjection();
    const plan = compileProjectionPlan({
      projection,
      bounds: [99, 199, 101, 201],
      degree: 1,
      tolerance: 1e-5
    });

    expect(plan.bounds).toEqual([99, 199, 101, 201]);
    expect(plan.degree).toBe(1);
    expect(plan.patches).toHaveLength(1);
    expect(plan.destinationOrigin).toEqual(projection.project([100, 200]));
    expect(plan.maxError).toBeLessThanOrEqual(plan.tolerance);

    for (const coordinate of [
      [99, 199],
      [99.25, 200.75],
      [100, 200],
      [101, 201]
    ] as const) {
      expect(findProjectionPatch(plan, coordinate)).toBe(0);
      expect(evaluateProjectionPlan(plan, coordinate)).toEqual(projection.project([...coordinate]));
      expect(evaluateProjectionPlan(plan, coordinate, 0)).toEqual(
        projection.project([...coordinate])
      );
    }
  });

  test('accepts standalone providers and approximates projected-to-projected transforms', () => {
    const projection = (coordinates: number[]): number[] => {
      const easting = coordinates[0] - 500_000;
      const northing = coordinates[1] - 4_100_000;
      return [
        -13_500_000 + easting * 1.001 + northing * 0.003 + easting * northing * 2e-9,
        4_500_000 + northing * 1.003 - easting * 0.002 + easting * easting * 3e-9
      ];
    };
    const plan = compileProjectionPlan({
      projection,
      bounds: [499_000, 4_099_000, 501_000, 4_101_000],
      degree: 2,
      tolerance: 0.001
    });

    expect(plan.degree).toBe(2);
    expect(plan.maxError).toBeLessThanOrEqual(plan.tolerance);

    for (let horizontalIndex = 0; horizontalIndex <= 8; horizontalIndex++) {
      for (let verticalIndex = 0; verticalIndex <= 8; verticalIndex++) {
        const coordinate = [
          499_000 + horizontalIndex * 250,
          4_099_000 + verticalIndex * 250
        ] as const;
        const actual = evaluateProjectionPlan(plan, coordinate);
        const expected = projection([...coordinate]);
        expect(Math.hypot(actual[0] - expected[0], actual[1] - expected[1])).toBeLessThanOrEqual(
          plan.tolerance + 1e-5
        );
      }
    }
  });

  test('retains the documented triangular coefficient order through cubic mixed terms', () => {
    const projection = (coordinates: number[]): number[] => {
      const horizontal = coordinates[0];
      const vertical = coordinates[1];
      const horizontalSquared = horizontal * horizontal;
      const verticalSquared = vertical * vertical;
      return [
        1_000 +
          horizontal +
          vertical * 2 +
          horizontalSquared * 3 +
          horizontal * vertical * 4 +
          verticalSquared * 5 +
          horizontalSquared * horizontal * 6 +
          horizontalSquared * vertical * 7 +
          horizontal * verticalSquared * 8 +
          verticalSquared * vertical * 9,
        2_000 +
          horizontal * 9 +
          vertical * 8 +
          horizontalSquared * 7 +
          horizontal * vertical * 6 +
          verticalSquared * 5 +
          horizontalSquared * horizontal * 4 +
          horizontalSquared * vertical * 3 +
          horizontal * verticalSquared * 2 +
          verticalSquared * vertical
      ];
    };
    const plan = compileProjectionPlan({
      projection,
      bounds: [-1, -1, 1, 1],
      degree: 3,
      tolerance: 1e-5
    });
    const patch = plan.patches[0];

    expect(plan.patches).toHaveLength(1);
    expect(patch.coefficientsX).toBeInstanceOf(Float32Array);
    expect(patch.coefficientsY).toBeInstanceOf(Float32Array);
    expect(patch.coefficientsX).toHaveLength(10);
    expect(patch.coefficientsY).toHaveLength(10);
    for (let coefficientIndex = 0; coefficientIndex < 10; coefficientIndex++) {
      expect(patch.coefficientsX[coefficientIndex]).toBeCloseTo(coefficientIndex, 5);
      expect(patch.coefficientsY[coefficientIndex]).toBeCloseTo(
        coefficientIndex === 0 ? 0 : 10 - coefficientIndex,
        5
      );
    }

    for (const coordinate of [
      [-0.75, -0.25],
      [0.125, 0.875],
      [1, -1]
    ] as const) {
      const actual = evaluateProjectionPlan(plan, coordinate);
      const expected = projection([...coordinate]);
      expect(Math.hypot(actual[0] - expected[0], actual[1] - expected[1])).toBeLessThanOrEqual(
        plan.tolerance
      );
    }
  });

  test('adaptively subdivides Web Mercator curvature to satisfy the error budget', () => {
    const bounds = [-122.6, 37.5, -122.1, 38] as const;
    const plan = compileProjectionPlan({
      projection: projectWebMercator,
      bounds,
      degree: 2,
      tolerance: 0.03,
      maxDepth: 6
    });

    expect(plan.patches.length).toBeGreaterThan(1);
    expect(plan.maxError).toBeLessThanOrEqual(plan.tolerance);

    for (const patch of plan.patches) {
      expect(patch.maxError).toBeLessThanOrEqual(plan.tolerance);
      expect(findProjectionPatch(plan, patch.sourceOrigin)).toBe(patch.id);
      const actual = evaluateProjectionPlan(plan, patch.sourceOrigin, patch.id);
      const expected = projectWebMercator([...patch.sourceOrigin]);
      expect(Math.hypot(actual[0] - expected[0], actual[1] - expected[1])).toBeLessThanOrEqual(
        plan.tolerance + 1e-5
      );
    }

    expect(findProjectionPatch(plan, [-123, 37.75])).toBe(-1);
    expect(findProjectionPatch(plan, [-122.35, 39])).toBe(-1);
    expect(findProjectionPatch(plan, [Number.NaN, 37.75])).toBe(-1);
    expect(findProjectionPatch(plan, [-122.35, Number.POSITIVE_INFINITY])).toBe(-1);
    expect(() => evaluateProjectionPlan(plan, [-123, 37.75])).toThrow();
    expect(() => evaluateProjectionPlan(plan, plan.patches[0].sourceOrigin, -1)).toThrow();
    expect(() =>
      evaluateProjectionPlan(plan, plan.patches[0].sourceOrigin, plan.patches.length)
    ).toThrow();
  });

  test('rejects invalid bounds, invalid tolerances, and unsatisfied subdivision limits', () => {
    expect(() =>
      compileProjectionPlan({projection: projectWebMercator, bounds: [1, 0, 0, 1]})
    ).toThrow();
    expect(() =>
      compileProjectionPlan({projection: projectWebMercator, bounds: [0, 0, 1, Number.NaN]})
    ).toThrow();
    expect(() =>
      compileProjectionPlan({
        projection: projectWebMercator,
        bounds: [-123, 37, -122, 38],
        tolerance: 0
      })
    ).toThrow();
    expect(() =>
      compileProjectionPlan({
        projection: projectWebMercator,
        bounds: [-123, 37, -122, 38],
        degree: 1,
        tolerance: 1e-6,
        maxDepth: 0
      })
    ).toThrow();
  });

  test('rejects non-finite providers, unsupported sampling, and bounded patch exhaustion', () => {
    expect(() =>
      compileProjectionPlan({projection: () => [Number.NaN, 0], bounds: [0, 0, 1, 1]})
    ).toThrow();
    expect(() =>
      compileProjectionPlan({
        projection: projectWebMercator,
        bounds: [-123, 37, -122, 38],
        degree: 3,
        sampleCount: 3
      })
    ).toThrow();
    expect(() =>
      compileProjectionPlan({
        projection: (coordinates: number[]): number[] => [
          coordinates[0] + coordinates[0] * coordinates[0],
          coordinates[1] + coordinates[1] * coordinates[1]
        ],
        bounds: [0, 0, 2, 2],
        degree: 1,
        tolerance: 0.1,
        maxDepth: 5,
        maxPatches: 1
      })
    ).toThrow(/patch count/);
  });

  test('accounts for the Float32 precision floor of a shared destination origin', () => {
    expect(() =>
      compileProjectionPlan({
        projection: (coordinates: number[]): number[] => [...coordinates],
        bounds: [0, 0, 1_000_000, 1],
        degree: 1,
        tolerance: 1e-4,
        maxDepth: 2
      })
    ).toThrow(/tolerance/);
  });

  test('packs canonical binary64 origins, stable patch records, and exact plan bounds', () => {
    const sourceOrigin = [20_000_000.125, 30_000_000.375] as const;
    const projection = (coordinates: number[]): number[] => [
      coordinates[0] * 0.5 - 13_000_000,
      coordinates[1] * 0.25 + 4_000_000
    ];
    const plan = compileProjectionPlan({
      projection,
      bounds: [sourceOrigin[0] - 2, sourceOrigin[1] - 2, sourceOrigin[0] + 2, sourceOrigin[1] + 2],
      degree: 1,
      tolerance: 1e-5
    });
    const packed = packProjectionPlan(plan);
    const packedAgain = packProjectionPlan(plan);
    const bytes = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
    const patch = plan.patches[0];
    const boundsWordOffset = plan.patches.length * PROJECTION_PATCH_WORD_LENGTH;

    expect(PROJECTION_PATCH_WORD_LENGTH).toBe(40);
    expect(PROJECTION_PLAN_BOUNDS_WORD_LENGTH).toBe(12);
    expect(packed).toBeInstanceOf(Uint32Array);
    expect(packed.length).toBe(boundsWordOffset + PROJECTION_PLAN_BOUNDS_WORD_LENGTH);
    expect(packedAgain).toEqual(packed);
    expect(bytes.getFloat64(0, true)).toBe(patch.sourceOrigin[0]);
    expect(bytes.getFloat64(8, true)).toBe(patch.sourceOrigin[1]);
    expect(bytes.getFloat32(4 * 4, true)).toBe(Math.fround(patch.sourceScale[0]));
    expect(bytes.getFloat32(5 * 4, true)).toBe(Math.fround(patch.sourceScale[1]));
    expect(bytes.getFloat32(6 * 4, true)).toBe(
      Math.fround(patch.destinationOrigin[0] - plan.destinationOrigin[0])
    );
    expect(bytes.getFloat32(7 * 4, true)).toBe(
      Math.fround(patch.destinationOrigin[1] - plan.destinationOrigin[1])
    );
    expect(bytes.getFloat32(10 * 4, true)).toBe(
      Math.fround(patch.sourceOrigin[0] - Math.fround(patch.sourceOrigin[0]))
    );
    expect(bytes.getFloat32(11 * 4, true)).toBe(
      Math.fround(patch.sourceOrigin[1] - Math.fround(patch.sourceOrigin[1]))
    );
    expect(packed[12]).toBe(patch.degree);
    expect(bytes.getFloat32(13 * 4, true)).toBe(Math.fround(patch.sourceOrigin[0]));
    expect(bytes.getFloat32(14 * 4, true)).toBe(Math.fround(patch.sourceOrigin[1]));
    expect(bytes.getFloat64(16 * 4, true)).toBe(patch.destinationOrigin[0]);
    expect(bytes.getFloat64(18 * 4, true)).toBe(patch.destinationOrigin[1]);
    for (let boundIndex = 0; boundIndex < plan.bounds.length; boundIndex++) {
      expect(bytes.getFloat64((boundsWordOffset + boundIndex * 2) * 4, true)).toBe(
        plan.bounds[boundIndex]
      );
    }
    const float32MinimumX = bytes.getFloat32((boundsWordOffset + 8) * 4, true);
    const float32MinimumY = bytes.getFloat32((boundsWordOffset + 9) * 4, true);
    const float32MaximumX = bytes.getFloat32((boundsWordOffset + 10) * 4, true);
    const float32MaximumY = bytes.getFloat32((boundsWordOffset + 11) * 4, true);
    expect(float32MinimumX).toBeGreaterThanOrEqual(plan.bounds[0]);
    expect(float32MinimumY).toBeGreaterThanOrEqual(plan.bounds[1]);
    expect(float32MaximumX).toBeLessThanOrEqual(plan.bounds[2]);
    expect(float32MaximumY).toBeLessThanOrEqual(plan.bounds[3]);
  });
});

function projectWebMercator(coordinates: number[]): number[] {
  const longitudeRadians = coordinates[0] * DEGREES_TO_RADIANS;
  const latitudeRadians = coordinates[1] * DEGREES_TO_RADIANS;
  return [
    EARTH_RADIUS_METERS * longitudeRadians,
    EARTH_RADIUS_METERS * Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2))
  ];
}
