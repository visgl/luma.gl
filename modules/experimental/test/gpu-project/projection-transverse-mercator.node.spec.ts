// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Proj4Projection} from '@math.gl/proj4';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  evaluateProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {planCRSProjection, planProjectionPipeline} from '@luma.gl/experimental/gpu-project/crs';
import {
  geographicCRS,
  makeTransverseMercatorCRS,
  makeWebMercatorCRS
} from './projection-crs-fixtures';

const operation = {
  type: 'transverse-mercator',
  arithmetic: 'float32',
  semiMajorAxis: 6378137,
  semiMinorAxis: 6378137 * (1 - 1 / 298.257223563),
  scaleFactor: 0.9996,
  latitudeOrigin: 0
} as const;
const program: ProjectionProgram = {precision: 'double-single', operations: [operation]};

describe('sixth-order Transverse Mercator', () => {
  for (let zone = 1; zone <= 60; zone++) {
    for (const south of [false, true]) {
      it(`matches UTM zone ${zone}${south ? 'S' : 'N'} in both directions`, () => {
        const result = planCRSProjection({
          from: geographicCRS,
          to: makeTransverseMercatorCRS(zone, south),
          projectionArithmetic: 'float32',
          allowAdaptive: false
        });
        expect(result.status).toBe('ready');
        if (result.status !== 'ready') return;
        expect(result.strategy).toBe('native');
        const inverse = invertProjectionProgram(result.program);
        const provider = new Proj4Projection({
          from: 'EPSG:4326',
          to: `+proj=utm +zone=${zone} ${south ? '+south' : ''} +datum=WGS84 +units=m`
        });
        const center = zone * 6 - 183;
        for (const offset of [-3, -0.001, 0, 0.001, 3]) {
          for (const latitude of south ? [-80, -45, -1e-8, 0] : [0, 1e-8, 45, 84]) {
            const source = [center + offset, latitude] as const;
            const expected = provider.project([...source]);
            const projected = evaluateProjectionProgram(result.program, source);
            expect(projected.valid).toBe(true);
            expect(
              Math.hypot(projected.position[0] - expected[0], projected.position[1] - expected[1])
            ).toBeLessThan(1e-6);
            const restored = evaluateProjectionProgram(inverse, [expected[0], expected[1]]);
            expect(restored.valid).toBe(true);
            expect(
              Math.hypot(restored.position[0] - source[0], restored.position[1] - source[1])
            ).toBeLessThan(1e-10);
          }
        }
      });
    }
  }

  it.each([
    0, 100, 150, 298.257223563
  ])('handles a sphere or oblate ellipsoid with inverse flattening %s and a nonzero origin', inverseFlattening => {
    const definition: ProjectionProgram = {
      ...program,
      operations: [
        {
          ...operation,
          semiMinorAxis: 6378137 * (inverseFlattening === 0 ? 1 : 1 - 1 / inverseFlattening),
          latitudeOrigin: (30 * Math.PI) / 180,
          scaleFactor: 1.2
        }
      ]
    };
    const provider = new Proj4Projection({
      from: `+proj=longlat +a=6378137 +${inverseFlattening === 0 ? 'b=6378137' : `rf=${inverseFlattening}`}`,
      to: `+proj=tmerc +a=6378137 +${inverseFlattening === 0 ? 'b=6378137 +approx' : `rf=${inverseFlattening}`} +lon_0=0 +lat_0=30 +k_0=1.2 +units=m`
    });
    for (const longitude of [-11.999, -6, 0, 6, 11.999]) {
      for (const latitude of [-84.99, -30, 0, 30, 84.99]) {
        const input = [(longitude * Math.PI) / 180, (latitude * Math.PI) / 180] as const;
        const actual = evaluateProjectionProgram(definition, input);
        // The provider's approximate spherical route is not an accurate oracle here.
        // Use the independent closed-form spherical TM identity when flattening is zero.
        const expected =
          inverseFlattening === 0
            ? [
                6378137 * 1.2 * Math.atanh(Math.cos(input[1]) * Math.sin(input[0])),
                6378137 * 1.2 * (Math.atan(Math.tan(input[1]) / Math.cos(input[0])) - Math.PI / 6)
              ]
            : provider.project([longitude, latitude]);
        expect(actual.valid).toBe(true);
        expect(
          Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
        ).toBeLessThan(1e-4);
        const inverse = evaluateProjectionProgram(
          invertProjectionProgram(definition),
          actual.position
        );
        expect(inverse.valid).toBe(true);
        expect(
          Math.hypot(inverse.position[0] - input[0], inverse.position[1] - input[1])
        ).toBeLessThan(1e-10);
      }
    }
  });

  it('rejects poles, other branches and inverse envelope points outside the geographic footprint', () => {
    for (const position of [
      [0.21, 0],
      [0, (86 * Math.PI) / 180],
      [Math.PI, 0],
      [NaN, 0],
      [0, Infinity]
    ] as const) {
      expect(evaluateProjectionProgram(program, position)).toEqual({
        position: [0, 0],
        valid: false
      });
    }
    const inverse = invertProjectionProgram(program);
    // Inside the broad inverse rectangle, but longitude would be outside +/-12 degrees.
    expect(evaluateProjectionProgram(inverse, [1500000, 0]).valid).toBe(false);
    expect(evaluateProjectionProgram(inverse, [0, 10000000]).valid).toBe(false);
    expect(evaluateProjectionProgram(program, [0, 0])).toEqual({position: [0, 0], valid: true});
  });

  it('has stable parameter updates, explicit arithmetic metadata and unknown nonlinear error propagation', () => {
    const first = compileProjectionProgram(program, {inputFormat: 'uint32x4'});
    const second = compileProjectionProgram(
      {...program, operations: [{...operation, latitudeOrigin: 0.2, scaleFactor: 1}]},
      {inputFormat: 'uint32x4'}
    );
    expect(first.isCompatible(second)).toBe(true);
    expect(first.packParameters()).not.toEqual(second.packParameters());
    expect(first.metadata).toMatchObject({
      arithmetic: 'mixed',
      inputEncoding: 'binary64',
      outputPrecision: 'double-single',
      invertible: true
    });
    expect(first.metadata.stages[0]).toMatchObject({
      arithmetic: 'float32',
      errorAmplification: null
    });
    expect(Object.isFrozen(first.metadata.stages[0].inputBounds)).toBe(true);
    const plan = compileProjectionPlan({
      projection: position => position,
      bounds: [-0.1, -0.1, 0.1, 0.1],
      precision: 'double-single'
    });
    expect(
      compileProjectionProgram({
        ...program,
        operations: [{type: 'adaptive', plan: {...plan, doubleSingleMaxError: 0.1}}, operation]
      }).metadata.approximationError.kind
    ).toBe('unknown');
    expect(
      first.isCompatible(
        compileProjectionProgram(invertProjectionProgram(program), {inputFormat: 'uint32x4'})
      )
    ).toBe(false);
    const repeated = compileProjectionProgram({
      ...program,
      operations: [operation, {...operation, inverse: true}]
    }).getShader().source;
    expect(repeated.match(/fn projection_projection_transverseSinh/g)).toHaveLength(1);
  });

  it.each([
    {semiMajorAxis: 0},
    {semiMinorAxis: 1},
    {semiMinorAxis: 7000000},
    {scaleFactor: -1},
    {latitudeOrigin: Math.PI / 2},
    {semiMajorAxis: NaN},
    {scaleFactor: 1e40},
    {scaleFactor: 1e-50},
    {arithmetic: undefined}
  ])('rejects unsupported parameters before GPU work: %j', invalid => {
    expect(() =>
      compileProjectionProgram({
        ...program,
        operations: [JSON.parse(JSON.stringify({...operation, ...invalid}))]
      })
    ).toThrow();
  });
});

describe('TM/UTM planner integration', () => {
  it('retains default double-single accuracy and independent inverse fitting', () => {
    const result = planCRSProjection({
      from: geographicCRS,
      to: makeTransverseMercatorCRS(),
      bounds: [-123.1, 37.7, -122.9, 37.9],
      tolerance: 1e-5,
      inverse: {bounds: [490000, 4180000, 510000, 4200000], tolerance: 1e-9}
    });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.strategy).toBe('adaptive');
    expect(result.compiled.metadata.arithmetic).toBe('double-single');
    const provider = new Proj4Projection({
      from: 'EPSG:4326',
      to: '+proj=utm +zone=10 +datum=WGS84'
    });
    const expected = provider.project([-123.012345678, 37.812345678]);
    const actual = evaluateProjectionProgram(result.program, [-123.012345678, 37.812345678]);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-5);
    const restored = evaluateProjectionProgram(
      invertProjectionProgram(result.program),
      actual.position
    );
    expect(restored.valid).toBe(true);
    expect(restored.position[0]).toBeCloseTo(-123.012345678, 9);
    expect(restored.position[1]).toBeCloseTo(37.812345678, 9);
    expect(
      planCRSProjection({
        from: geographicCRS,
        to: makeTransverseMercatorCRS(),
        allowAdaptive: false
      })
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'unsupported-arithmetic'}]});
  });

  it('composes different UTM zones and Web Mercator without datum shortcuts', () => {
    const source = makeTransverseMercatorCRS(10);
    const point = new Proj4Projection({
      from: 'EPSG:4326',
      to: '+proj=utm +zone=10 +datum=WGS84'
    }).project([-120, 37]);
    for (const to of [makeTransverseMercatorCRS(11), makeWebMercatorCRS()]) {
      const result = planCRSProjection({
        from: source,
        to,
        projectionArithmetic: 'float32',
        allowAdaptive: false
      });
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      const expected = new Proj4Projection({
        from: 'EPSG:4326',
        to: to.conversion.method.id.code === 9807 ? '+proj=utm +zone=11 +datum=WGS84' : 'EPSG:3857'
      }).project([-120, 37]);
      const actual = evaluateProjectionProgram(result.program, [point[0], point[1]]);
      expect(actual.valid).toBe(true);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-6);
    }
    expect(
      planCRSProjection({
        from: geographicCRS,
        to: {
          ...source,
          base_crs: {...geographicCRS, datum: {...geographicCRS.datum, name: 'Different datum'}}
        },
        projectionArithmetic: 'float32',
        allowAdaptive: false
      }).status
    ).toBe('unsupported');
  });

  it('handles latitude origins, signed axes, unequal units, prime meridians and localized IDs', () => {
    const source = makeTransverseMercatorCRS();
    const target = {
      ...source,
      base_crs: {
        ...geographicCRS,
        datum: {...geographicCRS.datum, prime_meridian: {name: 'Custom', longitude: 2}}
      },
      conversion: {
        ...source.conversion,
        method: {...source.conversion.method, name: 'Localized'},
        parameters: source.conversion.parameters.map(parameter => ({
          ...parameter,
          name: 'Localized',
          value: parameter.id.code === 8801 ? 20 : parameter.id.code === 8802 ? 3 : parameter.value
        }))
      },
      coordinate_system: {
        ...source.coordinate_system,
        axis: [
          {
            ...source.coordinate_system.axis[1],
            direction: 'south' as const,
            unit: {type: 'LinearUnit' as const, name: 'km', conversion_factor: 1000}
          },
          {...source.coordinate_system.axis[0], direction: 'west' as const}
        ]
      }
    };
    const result = planCRSProjection({
      from: geographicCRS,
      to: target,
      enforceAxis: true,
      projectionArithmetic: 'float32',
      allowAdaptive: false
    });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const expected = new Proj4Projection({
      from: 'EPSG:4326',
      to: '+proj=tmerc +datum=WGS84 +lon_0=5 +lat_0=20 +k_0=0.9996 +x_0=500000'
    }).project([6, 30]);
    const actual = evaluateProjectionProgram(result.program, [30, 6]);
    expect(actual.valid).toBe(true);
    expect(actual.position[0]).toBeCloseTo(-expected[1] / 1000, 7);
    expect(actual.position[1]).toBeCloseTo(-expected[0], 6);
  });

  it('lowers explicit UTM and general TM pipelines, including inversion', () => {
    for (const parameters of [
      '+proj=utm +ellps=WGS84 +zone=56 +south',
      '+proj=tmerc +a=6378137 +rf=298.257223563 +lon_0=153 +k_0=0.9996 +x_0=500000 +y_0=10000000'
    ]) {
      const result = planProjectionPipeline({
        pipeline: `+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step ${parameters}`,
        projectionArithmetic: 'float32'
      });
      const inverse = planProjectionPipeline({
        pipeline: `+proj=pipeline +step ${parameters} +inv +step +proj=unitconvert +xy_in=rad +xy_out=deg`,
        projectionArithmetic: 'float32'
      });
      expect(result.status).toBe('ready');
      expect(inverse.status).toBe('ready');
      if (result.status !== 'ready' || inverse.status !== 'ready') return;
      const expected = new Proj4Projection({
        from: 'EPSG:4326',
        to: '+proj=utm +zone=56 +south +datum=WGS84'
      }).project([151, -33]);
      const actual = evaluateProjectionProgram(result.program, [151, -33]);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-6);
      const restored = evaluateProjectionProgram(inverse.program, actual.position);
      expect(restored.position[0]).toBeCloseTo(151, 10);
      expect(restored.position[1]).toBeCloseTo(-33, 10);
      expect(
        planProjectionPipeline({pipeline: `+proj=pipeline +step ${parameters}`})
      ).toMatchObject({status: 'unsupported', reasons: [{code: 'unsupported-arithmetic'}]});
    }
  });

  it.each([
    '+proj=utm +ellps=WGS84 +zone=0',
    '+proj=utm +ellps=WGS84 +zone=61',
    '+proj=utm +ellps=WGS84 +zone=10.5',
    '+proj=utm +ellps=WGS84',
    '+proj=utm +datum=WGS84 +zone=10',
    '+proj=utm +ellps=WGS84 +zone=10 +south=true',
    '+proj=utm +ellps=WGS84 +zone=10 +x_0=0',
    '+proj=tmerc +ellps=WGS84 +approx',
    '+proj=tmerc +ellps=WGS84 +algo=auto',
    '+proj=tmerc +ellps=WGS84 +over',
    '+proj=tmerc +a=6378137',
    '+proj=tmerc +a=6378137 +rf=2',
    '+proj=tmerc +ellps=WGS84 +rf=300',
    '+proj=tmerc +ellps=WGS84 +lat_0=90',
    '+proj=tmerc +ellps=WGS84 +k_0=0'
  ])('declines unsupported or malformed pipeline semantics: %s', parameters => {
    expect(
      planProjectionPipeline({
        pipeline: `+proj=pipeline +step ${parameters}`,
        projectionArithmetic: 'float32'
      }).status
    ).toBe('unsupported');
  });

  it('checks projected/angular units at native formula boundaries', () => {
    expect(
      planProjectionPipeline({
        pipeline:
          '+proj=pipeline +step +proj=unitconvert +xy_in=m +xy_out=km +step +inv +proj=utm +zone=10 +ellps=WGS84',
        projectionArithmetic: 'float32'
      })
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'incompatible-units'}]});
  });
});
