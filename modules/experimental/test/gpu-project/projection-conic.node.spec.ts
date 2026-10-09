// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {Projection} from '@math.gl/projection';
import {
  compileProjectionProgram,
  evaluateProjectionProgram,
  invertProjectionProgram,
  type ConicOperation,
  type ProjectionCoordinates,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {planCRSProjection, planProjectionPipeline} from '@luma.gl/experimental/gpu-project/crs';
import {geographicCRS, makeConicCRS, getConicOracleDefinition} from './projection-crs-fixtures';

const radians = Math.PI / 180;
const shape = {
  arithmetic: 'float32',
  semiMajorAxis: 6378137,
  semiMinorAxis: 6378137 * (1 - 1 / 298.257223563),
  latitudeOrigin: 23 * radians,
  firstStandardParallel: 29.5 * radians,
  secondStandardParallel: 45.5 * radians
} as const;

describe('bounded native conics', () => {
  for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
    for (const southern of [false, true]) {
      it(`matches independent ${method} ${southern ? 'south' : 'north'} definitions in both directions`, () => {
        const original = makeConicCRS(method, southern);
        // No display-name matching: EPSG method/parameter identity carries the semantics.
        const target = {
          ...original,
          conversion: {
            ...original.conversion,
            method: {...original.conversion.method, name: ''},
            parameters: original.conversion.parameters.map(parameter => ({...parameter, name: ''}))
          }
        };
        const result = planCRSProjection({
          from: geographicCRS,
          to: target,
          projectionArithmetic: 'float32',
          allowAdaptive: false
        });
        expect(result.status).toBe('ready');
        if (result.status !== 'ready') return;
        expect(result.strategy).toBe('native');
        expect(result.compiled.metadata.arithmetic).toBe('mixed');
        const provider = new Projection({
          from: 'EPSG:4326',
          to: getConicOracleDefinition(method, southern)
        });
        const inverse = invertProjectionProgram(result.program);
        for (const longitude of [-160, -100, -71.500000001, -71.5, -71.499999999, 0, 18]) {
          for (const latitude of [-79.9, -45, -0.000000001, 0, 0.000000001, 45, 79.9]) {
            const expected = provider.project([longitude, latitude]);
            const actual = evaluateProjectionProgram(result.program, [longitude, latitude]);
            expect(actual.valid).toBe(true);
            expect(
              Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
            ).toBeLessThan(1e-6);
            const restored = evaluateProjectionProgram(inverse, [expected[0], expected[1]]);
            expect(restored.valid).toBe(true);
            expect(
              Math.hypot(restored.position[0] - longitude, restored.position[1] - latitude)
            ).toBeLessThan(1e-9);
          }
        }
      });
    }
    it(`keeps the high-precision provider default for ${method}`, () => {
      const result = planCRSProjection({
        from: geographicCRS,
        to: makeConicCRS(method),
        bounds: [-71.6, 41.7, -71.4, 41.9],
        tolerance: 1e-5
      });
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      expect(result.strategy).toBe('adaptive');
      expect(result.compiled.metadata.arithmetic).toBe('double-single');
      const provider = new Projection({from: 'EPSG:4326', to: getConicOracleDefinition(method)});
      const expected = provider.project([-71.500000001, 41.800000001]);
      const actual = evaluateProjectionProgram(result.program, [-71.500000001, 41.800000001]);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-5);
    });
  }

  for (const type of ['lambert-conformal-conic', 'albers-equal-area'] as const) {
    for (const sphere of [false, true]) {
      for (const parallels of [
        [29.5, 45.5],
        [45.5, 29.5],
        [0, 45.5],
        [45.5, 0],
        [30, 30],
        [-30, -30]
      ]) {
        it(`${type} sphere=${sphere} parallels=${parallels} retains axes, scale and tangent limits`, () => {
          const operation: ConicOperation = {
            ...shape,
            type,
            scaleFactor: 1.2,
            semiMinorAxis: sphere ? shape.semiMajorAxis : shape.semiMinorAxis,
            firstStandardParallel: parallels[0] * radians,
            secondStandardParallel: parallels[1] * radians
          };
          const program: ProjectionProgram = {precision: 'double-single', operations: [operation]};
          const ellipsoid = sphere ? '+a=6378137 +b=6378137' : '+ellps=WGS84';
          const provider = new Projection({
            from: `+proj=longlat ${ellipsoid}`,
            to: `+proj=${type === 'albers-equal-area' ? 'aea' : 'lcc'} ${ellipsoid} +lat_0=23 +lat_1=${parallels[0]} +lat_2=${parallels[1]} ${type === 'lambert-conformal-conic' ? '+k_0=1.2' : ''}`
          });
          for (const position of [
            [0, 0],
            [-45, -70],
            [60, 70],
            [0.00001, 23]
          ] as const) {
            const expected = provider.project([...position]);
            const input: ProjectionCoordinates = [position[0] * radians, position[1] * radians];
            const actual = evaluateProjectionProgram(program, input);
            expect(actual.valid).toBe(true);
            expect(
              Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
            ).toBeLessThan(1e-6);
            const restored = evaluateProjectionProgram(
              invertProjectionProgram(program),
              actual.position
            );
            expect(restored.valid).toBe(true);
            expect(
              Math.hypot(restored.position[0] - input[0], restored.position[1] - input[1])
            ).toBeLessThan(1e-11);
          }
        });
      }
    }
    it(`${type} rejects poles, wrong branches and inverse envelope false positives`, () => {
      const operation: ConicOperation = {...shape, type, scaleFactor: 1};
      const program: ProjectionProgram = {precision: 'double-single', operations: [operation]};
      for (const position of [
        [Math.PI, 0],
        [0, 81 * radians],
        [NaN, 0],
        [0, Infinity]
      ] as const) {
        expect(evaluateProjectionProgram(program, position)).toEqual({
          position: [0, 0],
          valid: false
        });
      }
      const inverse = invertProjectionProgram(program);
      const compiled = compileProjectionProgram(inverse);
      const bounds = compiled.metadata.stages[0].inputBounds!;
      expect(evaluateProjectionProgram(inverse, [bounds[2] * 0.99, bounds[3] * 0.99]).valid).toBe(
        false
      );
      // Just outside longitude/latitude limits must not be rounded onto an accepted footprint.
      const provider = new Projection({
        from: 'EPSG:4326',
        to: `+proj=${type === 'albers-equal-area' ? 'aea' : 'lcc'} +ellps=WGS84 +lat_0=23 +lat_1=29.5 +lat_2=45.5`
      });
      for (const position of [
        [90.000000001, 0],
        [-90.000000001, 0],
        [0, 80.000000001],
        [0, -80.000000001]
      ] as const) {
        const projected = provider.project([...position]);
        expect(evaluateProjectionProgram(inverse, [projected[0], projected[1]]).valid).toBe(false);
      }
    });
    it(`${type} exposes float32 arithmetic and compatible parameter updates`, () => {
      const operation: ConicOperation = {...shape, type, scaleFactor: 1};
      const program: ProjectionProgram = {precision: 'double-single', operations: [operation]};
      const first = compileProjectionProgram(program);
      const second = compileProjectionProgram({
        ...program,
        operations: [{...operation, latitudeOrigin: 0.2}]
      });
      expect(first.isCompatible(second)).toBe(true);
      expect(first.packParameters()).not.toEqual(second.packParameters());
      expect(first.metadata).toMatchObject({arithmetic: 'mixed', outputPrecision: 'double-single'});
      expect(first.metadata.stages[0]).toMatchObject({
        arithmetic: 'float32',
        errorAmplification: null
      });
      expect(first.isCompatible(compileProjectionProgram(invertProjectionProgram(program)))).toBe(
        false
      );
      const source = compileProjectionProgram({
        ...program,
        operations: [operation, {...operation, inverse: true}]
      }).getShader().source;
      expect(source.match(/fn projection_projection_conicQ/g)).toHaveLength(1);
    });
    it.each([
      {semiMajorAxis: 0},
      {semiMinorAxis: 1},
      {latitudeOrigin: Math.PI / 2},
      {firstStandardParallel: 0, secondStandardParallel: 0},
      {firstStandardParallel: 0.3, secondStandardParallel: -0.3},
      {firstStandardParallel: 0.3, secondStandardParallel: 0.3000000001},
      {arithmetic: undefined}
    ])(`${type} declines unsupported shapes: %j`, invalid => {
      expect(() =>
        compileProjectionProgram({
          precision: 'double-single',
          operations: [JSON.parse(JSON.stringify({...shape, type, scaleFactor: 1, ...invalid}))]
        })
      ).toThrow();
    });
  }

  it('preserves ellipsoidal equal area locally for Albers in either hemisphere', () => {
    for (const direction of [-1, 1]) {
      const operation: ConicOperation = {
        ...shape,
        type: 'albers-equal-area',
        firstStandardParallel: shape.firstStandardParallel * direction,
        secondStandardParallel: shape.secondStandardParallel * direction
      };
      const program: ProjectionProgram = {precision: 'double-single', operations: [operation]};
      for (const latitude of [-70, -20, 0, 20, 70]) {
        const delta = 1e-5;
        const project = (longitude: number, offset: number) =>
          evaluateProjectionProgram(program, [longitude, latitude * radians + offset]).position;
        const left = project(0.2 - delta, 0),
          right = project(0.2 + delta, 0);
        const lower = project(0.2, -delta),
          upper = project(0.2, delta);
        const jacobian =
          ((right[0] - left[0]) * (upper[1] - lower[1]) -
            (right[1] - left[1]) * (upper[0] - lower[0])) /
          (4 * delta ** 2);
        const eccentricitySquared = 1 - (shape.semiMinorAxis / shape.semiMajorAxis) ** 2;
        const area =
          (shape.semiMajorAxis ** 2 * (1 - eccentricitySquared) * Math.cos(latitude * radians)) /
          (1 - eccentricitySquared * Math.sin(latitude * radians) ** 2) ** 2;
        expect(Math.abs(jacobian / area - 1)).toBeLessThan(1e-8);
      }
    }
  });
});

describe('conic planner boundaries', () => {
  it('composes distinct conics without cancelling different standard parallels', () => {
    const source = makeConicCRS('lambert-2sp');
    for (const method of ['lambert-2sp', 'albers'] as const) {
      const original = makeConicCRS(method);
      const target = {
        ...original,
        conversion: {
          ...original.conversion,
          parameters: original.conversion.parameters.map(parameter => ({
            ...parameter,
            value: parameter.id.code === 8823 ? 30 : parameter.value
          }))
        }
      };
      const sourceProvider = new Projection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition('lambert-2sp')
      });
      const targetProvider = new Projection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition(method).replace(/\+lat_1=[^ ]+/, '+lat_1=30')
      });
      const input = sourceProvider.project([-70, 40]);
      const expected = targetProvider.project([-70, 40]);
      const result = planCRSProjection({
        from: source,
        to: target,
        projectionArithmetic: 'float32',
        allowAdaptive: false
      });
      if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
      const actual = evaluateProjectionProgram(result.program, [input[0], input[1]]);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-6);
      expect(
        result.program.operations.filter(
          operation =>
            operation.type === 'lambert-conformal-conic' || operation.type === 'albers-equal-area'
        )
      ).toHaveLength(2);
    }
  });
  it('retains prime-meridian translation and declines near-cylindrical native cones without losing adaptive coverage', () => {
    const source = {
      ...geographicCRS,
      datum: {...geographicCRS.datum, prime_meridian: {name: 'custom', longitude: 2}}
    };
    const target = makeConicCRS('albers');
    const native = planCRSProjection({
      from: source,
      to: target,
      projectionArithmetic: 'float32',
      allowAdaptive: false
    });
    if (native.status !== 'ready') throw new Error(JSON.stringify(native.reasons));
    const expected = new Projection({
      from: 'EPSG:4326',
      to: getConicOracleDefinition('albers')
    }).project([-71.5, 41.8]);
    const actual = evaluateProjectionProgram(native.program, [-73.5, 41.8]);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-6);
    const shallow = {
      ...target,
      conversion: {
        ...target.conversion,
        parameters: target.conversion.parameters.map(parameter => ({
          ...parameter,
          value: [8823, 8824].includes(parameter.id.code) ? 1 : parameter.value
        }))
      }
    };
    const options = {
      from: geographicCRS,
      to: shallow,
      bounds: [-71.6, 41.7, -71.4, 41.9] as const,
      tolerance: 0.001
    };
    expect(
      planCRSProjection({...options, projectionArithmetic: 'float32', allowAdaptive: false}).status
    ).toBe('unsupported');
    expect(planCRSProjection(options)).toMatchObject({status: 'ready', strategy: 'adaptive'});
  });
  for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
    it(`${method} handles axes, feet and angular parameter units`, () => {
      const original = makeConicCRS(method);
      const target = {
        ...original,
        coordinate_system: {
          ...original.coordinate_system,
          axis: [...original.coordinate_system.axis].reverse().map(axis => ({
            ...axis,
            unit: {type: 'LinearUnit' as const, name: 'foot', conversion_factor: 0.3048}
          }))
        },
        conversion: {
          ...original.conversion,
          parameters: original.conversion.parameters.map(parameter =>
            parameter.unit === 'degree'
              ? {
                  ...parameter,
                  value: parameter.value * radians,
                  unit: {type: 'AngularUnit' as const, name: 'radian', conversion_factor: 1}
                }
              : parameter
          )
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
      const expected = new Projection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition(method)
      }).project([-71.4, 41.8]);
      const actual = evaluateProjectionProgram(result.program, [41.8, -71.4]);
      expect(actual.position[0]).toBeCloseTo(expected[1] / 0.3048, 6);
      expect(actual.position[1]).toBeCloseTo(expected[0] / 0.3048, 6);
    });
    it(`${method} rejects conflicting identifiers and datum changes`, () => {
      const original = makeConicCRS(method);
      for (const target of [
        {
          ...original,
          conversion: {
            ...original.conversion,
            method: {...original.conversion.method, id: {authority: 'EPSG', code: 9807}}
          }
        },
        {
          ...original,
          base_crs: {
            ...original.base_crs,
            datum: {...original.base_crs.datum, name: 'Another datum'}
          }
        }
      ])
        expect(
          planCRSProjection({
            from: geographicCRS,
            to: target,
            projectionArithmetic: 'float32',
            allowAdaptive: false
          }).status
        ).toBe('unsupported');
    });
    it(`${method} accepts explicit pipelines and requires float32 opt-in`, () => {
      const parameters = getConicOracleDefinition(method).replace(' +units=m', '');
      const pipeline = `+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step ${parameters}`;
      const result = planProjectionPipeline({pipeline, projectionArithmetic: 'float32'});
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') return;
      const expected = new Projection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition(method)
      }).project([-71.4, 41.8]);
      const actual = evaluateProjectionProgram(result.program, [-71.4, 41.8]);
      expect(
        Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
      ).toBeLessThan(1e-7);
      expect(
        evaluateProjectionProgram(invertProjectionProgram(result.program), actual.position)
          .position[0]
      ).toBeCloseTo(-71.4, 9);
      expect(planProjectionPipeline({pipeline})).toMatchObject({
        status: 'unsupported',
        reasons: [{code: 'unsupported-arithmetic'}]
      });
      for (const extra of ['+datum=WGS84', '+over', '+R=6378137', '+lat_1=99']) {
        expect(
          planProjectionPipeline({
            pipeline: `${pipeline} ${extra}`,
            projectionArithmetic: 'float32'
          }).status
        ).toBe('unsupported');
      }
    });
  }
});
