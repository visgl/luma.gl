// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {describe, expect, test} from 'vitest';
import {advectOceanRK2, geographicDerivative, sampleOceanVelocity, type OceanVelocityGrid} from './ocean-velocity';

const grid: OceanVelocityGrid = {
  width: 2, height: 2, west: 0, east: 1, south: 0, north: 1,
  eastward: new Float32Array([1, 3, 5, 7]),
  northward: new Float32Array([0, 0, 0, 0])
};

describe('ocean velocity reference', () => {
  test('bilinear interpolation', () => {
    expect(sampleOceanVelocity(grid, 0.5, 0.5)?.eastward).toBe(4);
  });
  test('rejects missing corners', () => {
    expect(sampleOceanVelocity({...grid, valid: new Uint8Array([1, 0, 1, 1])}, 0.5, 0.5)).toBeUndefined();
  });
  test('converts eastward metres per second at equator', () => {
    expect(geographicDerivative({eastward: 1, northward: 0}, 0)?.longitude).toBeCloseTo(0.0000089932, 9);
  });
  test('advects eastward without changing latitude', () => {
    const uniform = {...grid, eastward: new Float32Array([1, 1, 1, 1])};
    const result = advectOceanRK2(uniform, {longitude: 0.5, latitude: 0.5}, 1000);
    expect(result?.longitude).toBeGreaterThan(0.5);
    expect(result?.latitude).toBeCloseTo(0.5);
  });
  test('wraps periodic longitude samples', () => {
    const periodic = {...grid, west: -180, east: 180};
    expect(sampleOceanVelocity(periodic, 180, 0)?.eastward).toBe(1);
    expect(sampleOceanVelocity(periodic, -180, 0)?.eastward).toBe(1);
  });
});
