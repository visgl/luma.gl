// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {createSpatialReference, type SpatialReference} from '@math.gl/crs';
import {projectionEngine} from '@math.gl/projection';
import {createProjectionDescriptor, createProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {
  prepareCRSProjection,
  prepareCRSProjectionAsync,
  planCRSProjection,
  ProjectionPlanningError
} from '@luma.gl/experimental/gpu-project/crs';
import {
  evaluateProjectionProgram,
  invertProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {geographicCRS, makeWebMercatorCRS} from './projection-crs-fixtures';

const options = {
  from: 'EPSG:4326',
  to: 'EPSG:3857',
  bounds: [-1, -1, 1, 1] as const,
  tolerance: 0.001
};
function requireReady(result: ReturnType<typeof prepareCRSProjection>) {
  if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
  return result;
}

describe('ProjectionEngine preparation', () => {
  it('retains the exact CPU transform, its reusable outputs and independently bounded inverse', () => {
    const projection = projectionEngine.createProjection(options);
    const engine = {
      createProjection: vi.fn(() => projection),
      createProjectionAsync: vi.fn(async () => projection)
    };
    const result = requireReady(
      prepareCRSProjection({
        ...options,
        engine,
        inverse: {bounds: [-100000, -100000, 100000, 100000], tolerance: 1e-8}
      })
    );
    expect(result.projection).toBe(projection);
    expect(result.strategy).toBe('adaptive');
    expect(engine.createProjection).toHaveBeenCalledOnce();
    expect(engine.createProjectionAsync).not.toHaveBeenCalled();
    const expected = projection.projectToSync([0.3, 0.4], new Float64Array(2));
    const actual = evaluateProjectionProgram(result.program, [0.3, 0.4]);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(0.001);
    const inverse = evaluateProjectionProgram(invertProjectionProgram(result.program), [
      expected[0],
      expected[1]
    ]);
    expect(Math.hypot(inverse.position[0] - 0.3, inverse.position[1] - 0.4)).toBeLessThan(1e-8);
  });

  it('never replaces custom engine semantics with native formulas inferred from labels', () => {
    const projection = projectionEngine.createProjection(options);
    projection.projectSync = coordinate => [coordinate[0] * 3 + 7, coordinate[1] * 5 - 11];
    const engine = {
      createProjection: () => projection,
      createProjectionAsync: async () => projection
    };
    const result = requireReady(prepareCRSProjection({...options, engine}));
    const actual = evaluateProjectionProgram(result.program, [0.5, 0.5]);
    expect(actual.position[0]).toBeCloseTo(8.5, 10);
    expect(actual.position[1]).toBeCloseTo(-8.5, 10);
  });

  it('does not load in sync preparation; explicit async preparation retries failed loads', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('retry load')).mockResolvedValue(mercator);
    const descriptor = createProjectionDescriptor(mercator, load);
    const engine = createProjectionEngine({projections: [descriptor]});
    expect(prepareCRSProjection({...options, engine}).status).toBe('unsupported');
    expect(load).not.toHaveBeenCalled();
    expect(await prepareCRSProjectionAsync({...options, engine})).toMatchObject({
      status: 'unsupported',
      reasons: [{message: 'retry load'}]
    });
    const result = requireReady(await prepareCRSProjectionAsync({...options, engine}));
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.projection.projectSync([0, 0])).toEqual([0, 0]);
    expect(prepareCRSProjection({...options, engine}).status).toBe('ready');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('supports selective engines and explicitly matched alias normalization', () => {
    const aliases = {source: '+proj=longlat +datum=WGS84', target: '+proj=merc +datum=WGS84'};
    const engine = createProjectionEngine({projections: [mercator], aliases});
    expect(prepareCRSProjection({...options, from: 'source', to: 'target', engine}).status).toBe(
      'unsupported'
    );
    requireReady(
      prepareCRSProjection({
        ...options,
        from: 'source',
        to: 'target',
        engine,
        normalization: {aliases}
      })
    );
  });

  it('returns failures or throws the same structured error, including async failures', async () => {
    const engine = {
      createProjection: () => {
        throw new Error('unavailable');
      },
      createProjectionAsync: async () => {
        throw new Error('unavailable');
      }
    };
    expect(prepareCRSProjection({...options, engine})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'provider-unavailable', message: 'unavailable'}]
    });
    expect(() => prepareCRSProjection({...options, engine, onUnsupported: 'throw'})).toThrow(
      ProjectionPlanningError
    );
    await expect(
      prepareCRSProjectionAsync({...options, engine, onUnsupported: 'throw'})
    ).rejects.toThrow(ProjectionPlanningError);
  });
});

describe('spatial-reference semantics', () => {
  it('accepts horizontal WKT and rejects WKT height before constructing a transform', () => {
    const horizontal =
      'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]]';
    requireReady(prepareCRSProjection({...options, from: horizontal}));
    const spatial =
      'GEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],CS[ellipsoidal,3],AXIS["Latitude",north,ANGLEUNIT["degree",0.0174532925199433]],AXIS["Longitude",east,ANGLEUNIT["degree",0.0174532925199433]],AXIS["Height",up,LENGTHUNIT["metre",1]]]';
    const engine = {createProjection: vi.fn(), createProjectionAsync: vi.fn()};
    expect(prepareCRSProjection({...options, from: spatial, engine})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'unsupported-dimensions'}]
    });
    expect(engine.createProjection).not.toHaveBeenCalled();
  });

  it('rejects lossy custom transforms without sampling them', () => {
    const projection = projectionEngine.createProjection(options);
    const projectSync = vi.fn(projection.projectSync);
    Object.defineProperty(projection, 'lossy', {value: true});
    projection.projectSync = projectSync;
    const engine = {
      createProjection: () => projection,
      createProjectionAsync: async () => projection
    };
    expect(prepareCRSProjection({...options, engine})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'unsupported-dimensions'}]
    });
    expect(projectSync).not.toHaveBeenCalled();
  });

  const source = createSpatialReference({
    crs: {
      state: 'default',
      definition: geographicCRS,
      representation: 'projjson',
      provenance: 'format-default'
    },
    coordinateFrame: 'geographic',
    coordinateOrder: ['latitude', 'longitude'],
    units: ['degree', 'degree']
  });
  const target = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: 'EPSG:3857',
      representation: 'identifier',
      provenance: 'metadata'
    },
    coordinateFrame: 'projected',
    coordinateOrder: ['northing', 'easting'],
    units: ['m', 'm']
  });
  it.each([
    false,
    true
  ])('honors stored order independently of enforceAxis=%s and preserves provenance', enforceAxis => {
    const result = requireReady(
      prepareCRSProjection({...options, from: source, to: target, enforceAxis})
    );
    const expected = projectionEngine.createProjection(options).projectSync([0.4, 0.3]);
    const actual = evaluateProjectionProgram(result.program, [0.3, 0.4]);
    expect(
      Math.hypot(actual.position[0] - expected[1], actual.position[1] - expected[0])
    ).toBeLessThan(0.001);
    expect(result.spatialReferences.from).toEqual(source);
    expect(Object.isFrozen(result.spatialReferences.from.crs)).toBe(true);
    expect(Object.isFrozen(result.spatialReferences.from.coordinateOrder)).toBe(true);
    expect(planCRSProjection({...options, from: source, to: target, enforceAxis}).status).toBe(
      'ready'
    );
  });

  const invalid: Partial<SpatialReference>[] = [
    {crs: {state: 'unknown', provenance: 'metadata'}},
    {crs: {state: 'absent', provenance: 'unknown'}},
    {coordinateEpoch: 2020},
    {vertical: {state: 'unknown', provenance: 'metadata'}},
    {units: ['m', 'm']},
    {units: ['degree']},
    {coordinateOrder: ['longitude', 'longitude']},
    {coordinateOrder: ['longitude', 'latitude', 'height']},
    {coordinateFrame: 'projected'},
    {coordinateFrame: 'geocentric'}
  ];
  it.each(
    invalid
  )('rejects unsupported metadata before constructing or loading an engine: %j', async metadata => {
    const engine = {createProjection: vi.fn(), createProjectionAsync: vi.fn()};
    const from = createSpatialReference({...source, ...metadata});
    expect(prepareCRSProjection({...options, from, engine}).status).toBe('unsupported');
    expect((await prepareCRSProjectionAsync({...options, from, engine})).status).toBe(
      'unsupported'
    );
    expect(engine.createProjection).not.toHaveBeenCalled();
    expect(engine.createProjectionAsync).not.toHaveBeenCalled();
  });

  it.each([
    'EPSG:4979',
    '+proj=geocent +datum=WGS84',
    '+proj=longlat +datum=WGS84 +towgs84=1,2,3',
    '+proj=longlat +datum=WGS84 +nadgrids=@missing',
    '+proj=longlat +datum=WGS84 +geoidgrids=missing'
  ])('declines nonhorizontal or datum/resource semantics: %s', from => {
    expect(prepareCRSProjection({...options, from}).status).toBe('unsupported');
  });

  it('validates alias dimensionality before normalization can discard height', () => {
    const aliases = {threeDimensional: 'EPSG:4979'};
    expect(
      prepareCRSProjection({...options, from: 'threeDimensional', normalization: {aliases}})
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'unsupported-dimensions'}]});
  });

  it('uses public angular units and corrected Pseudo Mercator semantics', () => {
    const radians = {
      ...geographicCRS,
      coordinate_system: {
        ...geographicCRS.coordinate_system,
        axis: geographicCRS.coordinate_system.axis.map(axis => ({
          ...axis,
          unit: {type: 'AngularUnit' as const, name: 'radian', conversion_factor: 1}
        }))
      }
    };
    const result = requireReady(
      prepareCRSProjection({
        ...options,
        from: radians,
        to: makeWebMercatorCRS(),
        bounds: [-0.01, -0.01, 0.01, 0.01]
      })
    );
    const actual = evaluateProjectionProgram(result.program, [0.003, 0.004]);
    expect(Math.abs(actual.position[0] - 6378137 * 0.003)).toBeLessThan(0.001);
    expect(
      Math.abs(actual.position[1] - 6378137 * Math.log(Math.tan(Math.PI / 4 + 0.004 / 2)))
    ).toBeLessThan(0.001);
  });
});
