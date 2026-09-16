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
  makeWebMercatorCRS,
  makeTransverseMercatorCRS
} from './projection-crs-fixtures';

const radius = 6378137;
const program: ProjectionProgram = {
  precision: 'double-single',
  operations: [{type: 'web-mercator', arithmetic: 'float32', radius}]
};

describe('native Web Mercator', () => {
  it('matches the independent provider across the square-world interior in both directions', () => {
    const provider = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
    const inverse = invertProjectionProgram(program);
    for (const longitude of [-179.999, -123, -1, 0, 1, 123, 179.999]) {
      for (const latitude of [-85.05, -80, -45, -1e-8, 0, 1e-8, 45, 80, 85.05]) {
        const input = [(longitude * Math.PI) / 180, (latitude * Math.PI) / 180] as const;
        const projected = evaluateProjectionProgram(program, input);
        const expected = provider.project([longitude, latitude]);
        expect(projected.valid).toBe(true);
        expect(
          Math.hypot(projected.position[0] - expected[0], projected.position[1] - expected[1])
        ).toBeLessThan(1e-6);
        const restored = evaluateProjectionProgram(inverse, projected.position);
        expect(restored.valid).toBe(true);
        expect(
          Math.hypot(restored.position[0] - input[0], restored.position[1] - input[1])
        ).toBeLessThan(1e-14);
      }
    }
    expect(evaluateProjectionProgram(program, [0, 0])).toEqual({position: [0, 0], valid: true});
  });

  it('declines non-finite and out-of-domain coordinates instead of clamping or wrapping', () => {
    const maximumLatitude = Math.atan(Math.sinh(Math.PI));
    for (const point of [
      [Math.PI + 1e-10, 0],
      [-Math.PI - 1e-10, 0],
      [0, maximumLatitude + 1e-10],
      [0, -maximumLatitude - 1e-10],
      [0, Math.PI / 2],
      [NaN, 0],
      [0, Infinity]
    ] as const) {
      expect(evaluateProjectionProgram(program, point)).toEqual({position: [0, 0], valid: false});
    }
    const inverse = invertProjectionProgram(program);
    for (const point of [
      [radius * Math.PI + 1e-5, 0],
      [0, -radius * Math.PI - 1e-5]
    ] as const) {
      expect(evaluateProjectionProgram(inverse, point).valid).toBe(false);
    }
    const metadata = compileProjectionProgram(program).metadata;
    expect(metadata.stages[0].inputBounds).toEqual([
      -Math.PI,
      -maximumLatitude,
      Math.PI,
      maximumLatitude
    ]);
    expect(compileProjectionProgram(inverse).metadata.stages[0].inputBounds).toEqual([
      -radius * Math.PI,
      -radius * Math.PI,
      radius * Math.PI,
      radius * Math.PI
    ]);
  });

  it('never labels float32 formulas as double-single arithmetic, regardless of transport', () => {
    const compiled = compileProjectionProgram(program, {inputFormat: 'uint32x4'});
    expect(compiled.metadata).toMatchObject({
      inputEncoding: 'binary64',
      arithmetic: 'mixed',
      outputPrecision: 'double-single',
      invertible: true
    });
    expect(compiled.metadata.stages[0]).toMatchObject({
      arithmetic: 'float32',
      errorAmplification: null,
      approximationError: {kind: 'none', guaranteed: false}
    });
    const plan = compileProjectionPlan({
      projection: position => position,
      bounds: [-1, -1, 1, 1],
      precision: 'double-single'
    });
    const composed = compileProjectionProgram({
      ...program,
      operations: [
        {type: 'adaptive', plan: {...plan, doubleSingleMaxError: 0.1}},
        ...program.operations,
        {type: 'unit', factor: 2}
      ]
    });
    expect(composed.metadata.approximationError).toMatchObject({kind: 'unknown', maximum: null});
    expect(Object.isFrozen(compiled.metadata.stages[0].inputBounds)).toBe(true);
  });

  it('packs radius and domains as updateable parameters, with direction in the static shader', () => {
    const first = compileProjectionProgram(program);
    const second = compileProjectionProgram({
      ...program,
      operations: [{type: 'web-mercator', arithmetic: 'float32', radius: 6000000}]
    });
    expect(first.isCompatible(second)).toBe(true);
    expect(first.packParameters()).not.toEqual(second.packParameters());
    expect(first.isCompatible(compileProjectionProgram(invertProjectionProgram(program)))).toBe(
      false
    );
    expect(first.getShader().source).not.toContain(String(radius));
    for (const invalidRadius of [0, -1, NaN, Infinity, 2e38, Number.MIN_VALUE]) {
      expect(() =>
        compileProjectionProgram({
          ...program,
          operations: [{type: 'web-mercator', arithmetic: 'float32', radius: invalidRadius}]
        })
      ).toThrow();
    }
    // Runtime callers cannot bypass the arithmetic opt-in merely by choosing a storage format.
    expect(() =>
      compileProjectionProgram({
        ...program,
        operations: [JSON.parse('{"type":"web-mercator","radius":6378137}')]
      })
    ).toThrow(/explicit float32/);
  });
});

describe('Web Mercator planning', () => {
  it('fits an independent inverse and rejects unsupported Pseudo Mercator provider routes', () => {
    const provider = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
    const result = planCRSProjection({
      from: geographicCRS,
      to: makeWebMercatorCRS(),
      bounds: [-1, -1, 1, 1],
      tolerance: 0.001,
      inverse: {bounds: [-100000, -100000, 100000, 100000], tolerance: 1e-8}
    });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const projected = provider.project([0.123, -0.456]);
    const restored = evaluateProjectionProgram(invertProjectionProgram(result.program), [
      projected[0],
      projected[1]
    ]);
    expect(restored.valid).toBe(true);
    expect(restored.position[0]).toBeCloseTo(0.123, 8);
    expect(restored.position[1]).toBeCloseTo(-0.456, 8);
    expect(
      evaluateProjectionProgram(invertProjectionProgram(result.program), [200000, 0]).valid
    ).toBe(false);
    for (const reverse of [false, true]) {
      const declined = planCRSProjection({
        from: reverse ? makeTransverseMercatorCRS() : makeWebMercatorCRS(),
        to: reverse ? makeWebMercatorCRS() : makeTransverseMercatorCRS(),
        bounds: [-1, -1, 1, 1],
        projectionArithmetic: 'float32'
      });
      expect(declined).toMatchObject({
        status: 'unsupported',
        reasons: [{code: 'crs-requires-provider'}, {code: 'unsupported-conversion'}]
      });
    }
  });

  it('preserves double-single adaptive defaults, including local-f32 output requests', () => {
    for (const precision of ['double-single', 'local-f32'] as const) {
      const result = planCRSProjection({
        from: geographicCRS,
        to: makeWebMercatorCRS(),
        precision,
        bounds: [-122.5, 37.7, -122.3, 37.9],
        tolerance: 1e-5
      });
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.strategy).toBe('adaptive');
      expect(result.compiled.metadata.arithmetic).toBe('double-single');
      expect(result.reasons[0].code).toBe('unsupported-arithmetic');
      const expected = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:3857'}).project([
        -122.4, 37.8
      ]);
      const actual = evaluateProjectionProgram(result.program, [-122.4, 37.8]);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-5);
    }
    const declined = planCRSProjection({
      from: geographicCRS,
      to: makeWebMercatorCRS(),
      allowAdaptive: false
    });
    expect(declined).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'unsupported-arithmetic'}]
    });
  });

  it('lowers explicit PROJJSON in both directions without sampling or fitting bounds', () => {
    const projected = makeWebMercatorCRS();
    for (const reverse of [false, true]) {
      const from = reverse ? projected : geographicCRS;
      const to = reverse ? geographicCRS : projected;
      const result = planCRSProjection({
        from,
        to,
        projectionArithmetic: 'float32',
        allowAdaptive: false
      });
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.strategy).toBe('native');
      expect(result.program.operations.some(operation => operation.type === 'adaptive')).toBe(
        false
      );
      // Use the verified EPSG definition: the current provider misreads Pseudo Mercator PROJJSON.
      const provider = new Proj4Projection({
        from: reverse ? 'EPSG:3857' : 'EPSG:4326',
        to: reverse ? 'EPSG:4326' : 'EPSG:3857'
      });
      const input = reverse ? ([-13627665, 4547675] as const) : ([-122.4194, 37.7749] as const);
      const actual = evaluateProjectionProgram(result.program, input);
      const expected = provider.project([...input]);
      expect(actual.valid).toBe(true);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-6);
    }
  });

  it('retains signed axes, per-axis units, prime meridians, false origins and EPSG identifiers', () => {
    const projected = makeWebMercatorCRS();
    const target = {
      ...projected,
      base_crs: {
        ...geographicCRS,
        datum: {
          ...geographicCRS.datum,
          prime_meridian: {name: 'Paris', longitude: {value: 2, unit: 'degree' as const}}
        }
      },
      conversion: {
        ...projected.conversion,
        method: {...projected.conversion.method, name: 'localized method'},
        parameters: projected.conversion.parameters.map(parameter => ({
          ...parameter,
          name: 'localized parameter',
          value:
            parameter.id.code === 8802
              ? 3
              : parameter.id.code === 8806
                ? 100000000.125
                : parameter.id.code === 8807
                  ? -200000000.25
                  : 0
        }))
      },
      coordinate_system: {
        ...projected.coordinate_system,
        axis: [
          {
            ...projected.coordinate_system.axis[1],
            direction: 'south' as const,
            unit: {type: 'LinearUnit' as const, name: 'kilometre', conversion_factor: 1000}
          },
          {
            ...projected.coordinate_system.axis[0],
            direction: 'west' as const,
            unit: 'metre' as const
          }
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
    const actual = evaluateProjectionProgram(result.program, [45, 20]);
    expect(actual.valid).toBe(true);
    expect(actual.position[0]).toBeCloseTo(-(radius * Math.asinh(1) - 200000000.25) / 1000, 8);
    expect(actual.position[1]).toBeCloseTo(-((radius * 15 * Math.PI) / 180 + 100000000.125), 6);
    const restored = evaluateProjectionProgram(
      invertProjectionProgram(result.program),
      actual.position
    );
    expect(restored.valid).toBe(true);
    expect(restored.position[0]).toBeCloseTo(45, 10);
    expect(restored.position[1]).toBeCloseTo(20, 10);
  });

  it('lowers different Web Mercator central meridians and cancels equivalent formulas', () => {
    const source = makeWebMercatorCRS();
    const target = {
      ...source,
      conversion: {
        ...source.conversion,
        parameters: source.conversion.parameters.map(parameter => ({
          ...parameter,
          value: parameter.id.code === 8802 ? 10 : 0
        }))
      }
    };
    const changed = planCRSProjection({
      from: source,
      to: target,
      projectionArithmetic: 'float32',
      allowAdaptive: false
    });
    expect(changed.status).toBe('ready');
    if (changed.status !== 'ready') return;
    expect(
      changed.program.operations.filter(operation => operation.type === 'web-mercator')
    ).toHaveLength(2);
    const actual = evaluateProjectionProgram(changed.program, [1000000, 2000000]);
    expect(actual.position[0]).toBeCloseTo(1000000 - (radius * 10 * Math.PI) / 180, 7);
    expect(actual.position[1]).toBeCloseTo(2000000, 7);
    const equivalent = planCRSProjection({
      from: source,
      to: source,
      projectionArithmetic: 'float32'
    });
    expect(equivalent.status === 'ready' && equivalent.compiled.metadata.arithmetic).toBe(
      'double-single'
    );
  });

  it('does not broaden the native datum, ellipsoidal Mercator or UTM contract', () => {
    const projected = makeWebMercatorCRS();
    for (const target of [
      makeTransverseMercatorCRS(),
      {
        ...projected,
        base_crs: {...geographicCRS, datum: {...geographicCRS.datum, name: 'different datum'}}
      },
      {
        ...projected,
        conversion: {
          ...projected.conversion,
          method: {name: 'Mercator (variant A)', id: {authority: 'EPSG', code: 9804}}
        }
      },
      {
        ...projected,
        conversion: {
          ...projected.conversion,
          parameters: [
            ...projected.conversion.parameters,
            {
              name: 'Scale factor at natural origin',
              id: {authority: 'EPSG', code: 8805},
              value: 1,
              unit: 'unity' as const
            }
          ]
        }
      }
    ]) {
      expect(
        planCRSProjection({
          from: geographicCRS,
          to: target,
          projectionArithmetic: 'float32',
          allowAdaptive: false
        }).status
      ).toBe('unsupported');
    }
  });

  it('lowers explicit webmerc pipelines with degree/radian units and inverse steps', () => {
    const pipeline =
      '+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step +proj=webmerc +ellps=WGS84 +lon_0=5 +x_0=100 +y_0=-200';
    const result = planProjectionPipeline({pipeline, projectionArithmetic: 'float32'});
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const projected = evaluateProjectionProgram(result.program, [20, 45]);
    expect(projected.position[0]).toBeCloseTo((radius * 15 * Math.PI) / 180 + 100, 7);
    const inverse = planProjectionPipeline({
      pipeline:
        '+proj=pipeline +step +inv +proj=webmerc +a=6378137 +lon_0=5 +x_0=100 +y_0=-200 +step +proj=unitconvert +xy_in=rad +xy_out=deg',
      projectionArithmetic: 'float32'
    });
    expect(inverse.status).toBe('ready');
    if (inverse.status !== 'ready') return;
    const restored = evaluateProjectionProgram(inverse.program, projected.position);
    expect(restored.position[0]).toBeCloseTo(20, 10);
    expect(restored.position[1]).toBeCloseTo(45, 10);
    expect(planProjectionPipeline({pipeline})).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'unsupported-arithmetic'}]
    });
  });

  it.each([
    '+datum=WGS84',
    '+ellps=GRS80',
    '+a=6378137 +ellps=WGS84',
    '+a=0',
    '+a=NaN',
    '+a=6378137 +k=2',
    '+a=6378137 +lat_0=10',
    '+a=6378137 +over',
    '+a=6378137 +lon_0=1r',
    '+a=6378137 +b=6370000'
  ])('declines unimplemented or invalid webmerc semantics: %s', parameters => {
    expect(
      planProjectionPipeline({
        pipeline: `+proj=pipeline +step +proj=webmerc ${parameters}`,
        projectionArithmetic: 'float32'
      }).status
    ).toBe('unsupported');
  });

  it.each([
    '+step +proj=unitconvert +xy_in=rad +xy_out=deg +step +proj=webmerc +a=6378137',
    '+step +proj=webmerc +a=6378137 +step +proj=unitconvert +xy_in=rad +xy_out=deg',
    '+step +inv +proj=webmerc +a=6378137 +step +proj=unitconvert +xy_in=m +xy_out=km'
  ])('rejects inconsistent pipeline units: %s', steps => {
    expect(
      planProjectionPipeline({pipeline: `+proj=pipeline ${steps}`, projectionArithmetic: 'float32'})
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'incompatible-units'}]});
  });
});
