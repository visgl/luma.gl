// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {parsePROJString, type CRSDefinition} from '@math.gl/crs';
import {Proj4Projection} from '@math.gl/proj4';
import {describe, expect, it, vi} from 'vitest';
import {
  planCRSProjection,
  planProjectionPipeline,
  type ProjectionPlanningResult
} from '@luma.gl/experimental/gpu-project/crs';
import {
  evaluateProjectionProgram,
  invertProjectionProgram
} from '@luma.gl/experimental/gpu-project';

function requireReady(result: ProjectionPlanningResult) {
  if (result.status !== 'ready') {
    throw new Error(JSON.stringify(result.reasons));
  }
  return result;
}

const geographic = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    type: 'GeodeticReferenceFrame',
    name: 'World Geodetic System 1984',
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {name: 'Latitude', abbreviation: 'lat', direction: 'north', unit: 'degree'},
      {name: 'Longitude', abbreviation: 'lon', direction: 'east', unit: 'degree'}
    ]
  }
} as const satisfies CRSDefinition;

describe('optional CRS planner', () => {
  it('keeps math.gl and proj4 out of the execution entry point bundle', async () => {
    const result = await build({
      stdin: {
        contents:
          "import {compileProjectionProgram} from './modules/experimental/src/gpu-project/index'; export {compileProjectionProgram};",
        resolveDir: process.cwd()
      },
      bundle: true,
      write: false,
      metafile: true,
      format: 'esm',
      platform: 'browser',
      external: ['@luma.gl/*']
    });
    expect(Object.keys(result.metafile!.inputs).some(path => /@math.gl|proj4/.test(path))).toBe(
      false
    );
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    );
    expect(packageJson.exports['./gpu-project/crs'].types).toBe('./dist/gpu-project/crs.d.ts');
    expect(packageJson.peerDependenciesMeta['@math.gl/proj4'].optional).toBe(true);
  });

  it('lowers a public math.gl AST with signed axes, unit changes, and inverse affine stages', () => {
    const result = requireReady(
      planProjectionPipeline({
        pipeline: parsePROJString(
          '+proj=pipeline +step +proj=axisswap +order=-2,1 +step +proj=unitconvert +xy_in=deg +xy_out=rad +step +inv +proj=affine +s11=2 +s22=-3 +xoff=10 +yoff=20'
        )
      })
    );
    expect(result.strategy).toBe('native');
    expect(result.compiled.inputFormat).toBe('uint32x4');
    expect(result.compiled.precision).toBe('double-single');
    const coordinate = [30, 60] as const;
    const transformed = evaluateProjectionProgram(result.program, coordinate);
    expect(transformed.position[0]).toBeCloseTo((-Math.PI / 3 - 10) / 2, 12);
    expect(transformed.position[1]).toBeCloseTo((Math.PI / 6 - 20) / -3, 12);
    const restored = evaluateProjectionProgram(
      invertProjectionProgram(result.program),
      transformed.position
    );
    expect(restored.position[0]).toBeCloseTo(coordinate[0], 11);
    expect(restored.position[1]).toBeCloseTo(coordinate[1], 11);
  });

  it('inverts signed axis permutations in the correct order', () => {
    const result = requireReady(
      planProjectionPipeline({pipeline: '+proj=pipeline +step +inv +proj=axisswap +order=-2,1'})
    );
    expect(evaluateProjectionProgram(result.program, [7, 11]).position).toEqual([11, -7]);
  });

  it.each([
    ['+xy_out=us-ft', 3937 / 1200],
    ['+xy_in=ft', 0.3048],
    ['+xy_in=0.001 +xy_out=km', 1e-6],
    ['+xy_in=grad +xy_out=deg', 0.9],
    ['+inv +xy_in=km +xy_out=m', 0.001]
  ])('normalizes units with defaults: %s', (parameters, expected) => {
    const result = requireReady(
      planProjectionPipeline({pipeline: `+proj=pipeline +step +proj=unitconvert ${parameters}`})
    );
    expect(evaluateProjectionProgram(result.program, [1, 1]).position[0]).toBeCloseTo(expected, 12);
  });

  it.each([
    ['+proj=pipeline', 'invalid-definition'],
    ['+proj=pipeline +step', 'invalid-definition'],
    ['+proj=pipeline +ellps=WGS84 +step +proj=affine', 'unsupported-parameter'],
    ['+proj=pipeline +step +proj=utm +zone=10', 'unsupported-operation'],
    ['+proj=pipeline +step +proj=affine +s12=1', 'unsupported-parameter'],
    ['+proj=pipeline +step +proj=affine +omit_inv', 'unsupported-parameter'],
    ['+proj=pipeline +step +proj=affine +inv=true', 'invalid-definition'],
    ['+proj=pipeline +step +proj=affine +s11', 'invalid-definition'],
    ['+proj=pipeline +step +proj=affine +s11=1 +s11=2', 'invalid-definition'],
    ['+proj=pipeline +step +proj=affine +s11=0', 'invalid-definition'],
    ['+proj=pipeline +step +proj=affine +s11=1e400', 'invalid-definition'],
    ['+proj=pipeline +step +proj=affine +xoff=0xff', 'invalid-definition'],
    ['+proj=pipeline +step +proj=axisswap +order=1,2,3', 'unsupported-dimensions'],
    ['+proj=pipeline +step +proj=axisswap +order=1,1', 'invalid-definition'],
    ['+proj=pipeline +step +proj=axisswap', 'invalid-definition'],
    ['+proj=pipeline +step +proj=axisswap +order=0x1,2', 'invalid-definition'],
    ['+proj=pipeline +step +xoff=5', 'invalid-definition'],
    ['+proj=pipeline +step +proj=unitconvert +xy_out=deg', 'incompatible-units'],
    ['+proj=pipeline +step +proj=unitconvert +xy_out=made-up', 'unsupported-unit'],
    [
      '+proj=pipeline +step +proj=unitconvert +xy_out=km +step +proj=unitconvert +xy_in=m',
      'incompatible-units'
    ],
    ['+proj=pipeline +step +proj=affine +xoff="', 'invalid-definition']
  ])('declines unsupported or ambiguous semantics: %s', (pipeline, code) => {
    const result = planProjectionPipeline({pipeline});
    expect(result.status).toBe('unsupported');
    expect(result.reasons[0].code).toBe(code);
  });

  it('uses a whole-pipeline oracle only when native lowering is unavailable', () => {
    const project = vi.fn((coordinates: number[]) => [coordinates[0] + 100, coordinates[1] * 2]);
    const fallback = {projection: project, bounds: [-1, -1, 1, 1] as const, tolerance: 1e-6};
    const native = requireReady(
      planProjectionPipeline({pipeline: '+proj=pipeline +step +proj=affine', fallback})
    );
    expect(native.strategy).toBe('native');
    expect(project).not.toHaveBeenCalled();
    const adaptive = requireReady(
      planProjectionPipeline({pipeline: '+proj=pipeline +step +proj=custom', fallback})
    );
    expect(adaptive.strategy).toBe('adaptive');
    expect(adaptive.reasons[0].code).toBe('unsupported-operation');
    expect(evaluateProjectionProgram(adaptive.program, [0.25, -0.5]).position[0]).toBeCloseTo(
      100.25,
      8
    );
    expect(evaluateProjectionProgram(adaptive.program, [2, 0]).valid).toBe(false);
  });

  it('does not hide invalid semantics behind fallback or discard extra coordinates', () => {
    const projection = vi.fn((coordinates: number[]) => coordinates);
    const fallback = {projection, bounds: [-1, -1, 1, 1] as const};
    for (const pipeline of [
      '+proj=pipeline +step +proj=affine +s11=0',
      '+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=m',
      '+proj=pipeline +step +proj=axisswap +order=1,1'
    ]) {
      expect(planProjectionPipeline({pipeline, fallback}).status).toBe('unsupported');
    }
    expect(projection).not.toHaveBeenCalled();
    const extraDimensions = planProjectionPipeline({
      pipeline: '+proj=pipeline +step +proj=custom',
      fallback: {...fallback, projection: coordinates => [...coordinates, 100]}
    });
    expect(extraDimensions.status).toBe('unsupported');
    expect(extraDimensions.reasons.at(-1)?.code).toBe('approximation-failed');
    const missingInverse = planProjectionPipeline({
      pipeline: '+proj=pipeline +step +proj=custom',
      fallback: {...fallback, inverse: {bounds: [-1, -1, 1, 1], tolerance: 1e-5}}
    });
    expect(missingInverse).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'provider-unavailable'}]
    });
  });

  it('plans a real UTM CRS and an independently fitted inverse', () => {
    const from = 'EPSG:4326';
    const to = '+proj=utm +zone=10 +datum=WGS84 +units=m +no_defs';
    const result = requireReady(
      planCRSProjection({
        from,
        to,
        bounds: [-122.5, 37.7, -122.3, 37.9],
        tolerance: 1e-4,
        inverse: {bounds: [544000, 4172000, 562000, 4194000], tolerance: 1e-8}
      })
    );
    const coordinate = [-122.4194, 37.7749] as const;
    const expected = new Proj4Projection({from, to}).project([...coordinate]);
    const actual = evaluateProjectionProgram(result.program, coordinate);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-4);
    const restored = evaluateProjectionProgram(
      invertProjectionProgram(result.program),
      actual.position
    );
    expect(restored.valid).toBe(true);
    expect(
      Math.hypot(restored.position[0] - coordinate[0], restored.position[1] - coordinate[1])
    ).toBeLessThan(1e-8);
    expect(result.compiled.metadata.invertible).toBe(true);
    expect(result.compiled.metadata.approximationError.kind).toBe('sampled-estimate');
  });

  it('honors explicit PROJJSON axis order when requested', () => {
    const result = requireReady(
      planCRSProjection({
        from: geographic,
        to: 'EPSG:3857',
        enforceAxis: true,
        bounds: [37.7, -122.5, 37.9, -122.3],
        tolerance: 1e-4
      })
    );
    const actual = evaluateProjectionProgram(result.program, [37.7749, -122.4194]);
    const expected = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:3857'}).project([
      -122.4194, 37.7749
    ]);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-4);
  });

  it('reports disabled fallback, unsupported dimensions, missing providers, and exhausted fitting', () => {
    const options = {from: 'EPSG:4326', to: 'EPSG:3857', bounds: [-1, -1, 1, 1] as const};
    expect(planCRSProjection({...options, allowAdaptive: false})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'crs-requires-provider'}]
    });
    expect(planCRSProjection({...options, from: 'NOT_A_REGISTERED_CRS'})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'provider-unavailable'}]
    });
    expect(
      planCRSProjection({
        ...options,
        from: {
          ...geographic,
          coordinate_system: {
            ...geographic.coordinate_system,
            axis: [
              ...geographic.coordinate_system.axis,
              {name: 'Height', abbreviation: 'h', direction: 'up', unit: 'metre'}
            ]
          }
        }
      })
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'unsupported-dimensions'}]});
    const failure = planCRSProjection({
      ...options,
      bounds: [-170, -80, 170, 80],
      maxDepth: 0,
      tolerance: 1e-10
    });
    expect(failure.status).toBe('unsupported');
    expect(failure.reasons.at(-1)?.code).toBe('approximation-failed');
  });
});
