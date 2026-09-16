// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {Proj4Projection} from '@math.gl/proj4';
import {
  planCRSProjection,
  planProjectionPipeline,
  ProjectionPlanningError
} from '@luma.gl/experimental/gpu-project/crs';
import {
  evaluateProjectionProgram,
  invertProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {normalizeCRSProviderDefinition} from '../../src/gpu-project/projection-crs-provider';
import {geographicCRS, makeConicCRS, getConicOracleDefinition} from './projection-crs-fixtures';

function requireReady(result: ReturnType<typeof planCRSProjection>) {
  if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
  expect(result.strategy).toBe('adaptive');
  expect(result.compiled.metadata.arithmetic).toBe('double-single');
  return result;
}

describe('verified PROJJSON provider coverage', () => {
  it('fits projected-to-projected transformations through the same verified mappings', () => {
    const oracle = new Proj4Projection({
      from: getConicOracleDefinition('lambert-2sp'),
      to: getConicOracleDefinition('albers')
    });
    const result = requireReady(
      planCRSProjection({
        from: makeConicCRS('lambert-2sp'),
        to: makeConicCRS('albers'),
        bounds: [199000, 830000, 201000, 832000],
        tolerance: 1e-5
      })
    );
    const expected = oracle.project([200000.125, 831000.25]);
    const actual = evaluateProjectionProgram(result.program, [200000.125, 831000.25]);
    expect(actual.valid).toBe(true);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-5);
  });

  it('returns malformed JSON failures by default and throws them only when requested', () => {
    const target = JSON.parse(JSON.stringify(makeConicCRS('albers')));
    target.conversion.parameters[0].unit = null;
    const options = {from: geographicCRS, to: target, bounds: [-72, 41, -71, 42] as const};
    expect(planCRSProjection(options)).toMatchObject({
      status: 'unsupported',
      reasons: [{code: 'invalid-definition', message: expect.any(String)}]
    });
    expect(() => planCRSProjection({...options, onUnsupported: 'throw'})).toThrow(
      ProjectionPlanningError
    );
  });

  for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
    for (const southern of [false, true]) {
      it(`fits custom ${method}/${southern ? 'south' : 'north'} forward and inverse without a registered CRS`, () => {
        const target = makeConicCRS(method, southern);
        const bounds = [-71.7, southern ? -41.9 : 41.7, -71.3, southern ? -41.7 : 41.9] as const;
        const oracle = new Proj4Projection({
          from: 'EPSG:4326',
          to: getConicOracleDefinition(method, southern)
        });
        const result = requireReady(
          planCRSProjection({
            from: geographicCRS,
            to: target,
            bounds,
            tolerance: 1e-5,
            inverse: {
              bounds: [190000, southern ? 650000 : 825000, 210000, southern ? 675000 : 850000],
              tolerance: 1e-9
            }
          })
        );
        const inverse = invertProjectionProgram(result.program);
        for (let row = 0; row < 15; row++) {
          const point = [
            bounds[0] + (0.4 * (row + 0.25)) / 15,
            bounds[1] + 0.2 * ((row * 0.61803398875) % 1)
          ] as const;
          const expected = oracle.project([...point]);
          const actual = evaluateProjectionProgram(result.program, point);
          expect(actual.valid).toBe(true);
          expect(
            Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
          ).toBeLessThan(1e-5);
        }
        const projected = [200000.125, southern ? 662500.25 : 837500.25] as const;
        const expected = oracle.unproject([...projected]);
        const actual = evaluateProjectionProgram(inverse, projected);
        expect(actual.valid).toBe(true);
        expect(
          Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
        ).toBeLessThan(1e-9);
        expect(evaluateProjectionProgram(result.program, [0, 0]).valid).toBe(false);
        expect(evaluateProjectionProgram(result.program, [NaN, 0]).valid).toBe(false);
      });
    }

    it(`resolves ${method} by IDs or canonical names, preserving the caller's object`, () => {
      const original = makeConicCRS(method);
      for (const naming of ['identifiers', 'names', 'localized'] as const) {
        const target = {
          ...original,
          conversion: {
            ...original.conversion,
            method:
              naming === 'names'
                ? {name: original.conversion.method.name}
                : {
                    name: naming === 'localized' ? 'Localized method' : '',
                    ids: [original.conversion.method.id]
                  },
            parameters: original.conversion.parameters.map(parameter =>
              naming === 'names'
                ? {name: parameter.name, value: parameter.value, unit: parameter.unit}
                : {
                    ...parameter,
                    name: naming === 'localized' ? `Localized ${parameter.id.code}` : ''
                  }
            )
          }
        };
        const snapshot = JSON.stringify(target);
        const result = requireReady(
          planCRSProjection({
            from: geographicCRS,
            to: target,
            bounds: [-71.6, 41.7, -71.4, 41.9],
            tolerance: 1e-5
          })
        );
        const expected = new Proj4Projection({
          from: 'EPSG:4326',
          to: getConicOracleDefinition(method)
        }).project([-71.5, 41.8]);
        const actual = evaluateProjectionProgram(result.program, [-71.5, 41.8]);
        expect(
          Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
        ).toBeLessThan(1e-5);
        expect(JSON.stringify(target)).toBe(snapshot);
      }
    });
  }

  it('normalizes parameter units independently from projected axis units and JSON property order', () => {
    const original = makeConicCRS('lambert-2sp');
    const target = {
      conversion: {
        ...original.conversion,
        parameters: original.conversion.parameters.map(parameter => ({
          ...parameter,
          value:
            parameter.unit === 'degree'
              ? (parameter.value * Math.PI) / 180
              : parameter.value / 1000,
          unit:
            parameter.unit === 'degree'
              ? ({type: 'AngularUnit', name: 'custom angle', conversion_factor: 1} as const)
              : ({type: 'LinearUnit', name: 'kilometre', conversion_factor: 1000} as const)
        }))
      },
      coordinate_system: {
        ...original.coordinate_system,
        axis: original.coordinate_system.axis.map(axis => ({
          ...axis,
          unit: {type: 'LinearUnit', name: 'kilometre', conversion_factor: 1000} as const
        }))
      },
      base_crs: original.base_crs,
      type: original.type,
      name: original.name
    };
    const result = requireReady(
      planCRSProjection({
        from: geographicCRS,
        to: target,
        bounds: [-71.6, 41.7, -71.4, 41.9],
        tolerance: 1e-8
      })
    );
    const expected = new Proj4Projection({
      from: 'EPSG:4326',
      to: getConicOracleDefinition('lambert-2sp')
    }).project([-71.5, 41.8]);
    const actual = evaluateProjectionProgram(result.program, [-71.5, 41.8]);
    expect(
      Math.hypot(actual.position[0] - expected[0] / 1000, actual.position[1] - expected[1] / 1000)
    ).toBeLessThan(1e-8);
  });

  it('uses declared swapped/west/south axes only when requested', () => {
    const original = makeConicCRS('albers');
    const target = {
      ...original,
      coordinate_system: {
        subtype: 'Cartesian',
        axis: [
          {name: 'South', abbreviation: 'S', direction: 'south', unit: 'metre'},
          {name: 'West', abbreviation: 'W', direction: 'west', unit: 'metre'}
        ]
      }
    } as const;
    for (const enforceAxis of [false, true]) {
      const result = requireReady(
        planCRSProjection({
          from: geographicCRS,
          to: target,
          enforceAxis,
          bounds: enforceAxis ? [41.7, -71.6, 41.9, -71.4] : [-71.6, 41.7, -71.4, 41.9],
          tolerance: 1e-5
        })
      );
      const expected = new Proj4Projection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition('albers')
      }).project([-71.5, 41.8]);
      const actual = evaluateProjectionProgram(
        result.program,
        enforceAxis ? [41.8, -71.5] : [-71.5, 41.8]
      );
      const coordinate = enforceAxis ? [-expected[1], -expected[0]] : expected;
      expect(
        Math.hypot(actual.position[0] - coordinate[0], actual.position[1] - coordinate[1])
      ).toBeLessThan(1e-5);
    }
  });

  it('retains bounds, fitting-budget and native-only requirements', () => {
    const options = {from: geographicCRS, to: makeConicCRS('albers')};
    expect(planCRSProjection(options)).toMatchObject({
      status: 'unsupported',
      reasons: expect.arrayContaining([expect.objectContaining({code: 'bounds-required'})])
    });
    expect(
      planCRSProjection({...options, allowAdaptive: false, bounds: [-72, 41, -71, 42]})
    ).toMatchObject({status: 'unsupported'});
    expect(
      planCRSProjection({...options, bounds: [-72, 41, -71, 42], tolerance: 1e-15, maxDepth: 0})
    ).toMatchObject({
      status: 'unsupported',
      reasons: expect.arrayContaining([expect.objectContaining({code: 'approximation-failed'})])
    });
  });

  it('declines missing, duplicate, unknown, conflicting and invalid parameters before sampling', () => {
    const original = makeConicCRS('lambert-2sp');
    const parameters = original.conversion.parameters;
    const malformed = [
      {...original.conversion, parameters: parameters.slice(1)},
      {...original.conversion, parameters: [...parameters, parameters[0]]},
      {
        ...original.conversion,
        parameters: [
          ...parameters,
          {...parameters[0], name: 'Unknown', id: {authority: 'EPSG', code: 9999}}
        ]
      },
      {
        ...original.conversion,
        parameters: parameters.map((parameter, index) =>
          index ? parameter : {...parameter, name: parameters[1].name}
        )
      },
      {
        ...original.conversion,
        parameters: parameters.map((parameter, index) =>
          index ? parameter : {...parameter, value: Infinity}
        )
      },
      {
        ...original.conversion,
        parameters: parameters.map((parameter, index) =>
          index ? parameter : {...parameter, unit: 'metre' as const}
        )
      },
      {
        ...original.conversion,
        method: {...original.conversion.method, id: {authority: 'EPSG', code: 9999}}
      },
      {
        ...original.conversion,
        method: {...original.conversion.method, ids: [{authority: 'EPSG', code: 9822}]}
      },
      {...original.conversion, method: {name: ''}},
      {
        ...original.conversion,
        parameters: parameters.map(parameter => ({...parameter, name: '', id: undefined}))
      },
      {
        ...original.conversion,
        parameters: parameters.map(parameter =>
          parameter.id.code === 8824 ? {...parameter, value: -42.6833333333} : parameter
        )
      }
    ];
    const project = vi.spyOn(Proj4Projection.prototype, 'project');
    try {
      for (const conversion of malformed) {
        expect(
          planCRSProjection({
            from: geographicCRS,
            to: {...original, conversion},
            bounds: [-72, 41, -71, 42]
          }).status
        ).toBe('unsupported');
      }
      expect(project).not.toHaveBeenCalled();
    } finally {
      project.mockRestore();
    }
  });

  it('preserves custom provider-supported serialized definitions without a CRS catalog', () => {
    requireReady(
      planCRSProjection({
        from: 'EPSG:4326',
        to: getConicOracleDefinition('albers'),
        bounds: [-71.6, 41.7, -71.4, 41.9],
        tolerance: 1e-5
      })
    );
  });

  it('offers throwing failure handling for CRS and pipeline planners with identical reasons', () => {
    const options = {from: geographicCRS, to: makeConicCRS('albers')};
    const result = planCRSProjection(options);
    try {
      planCRSProjection({...options, onUnsupported: 'throw'});
      expect.unreachable('expected planning error');
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionPlanningError);
      expect((error as ProjectionPlanningError).reasons).toEqual(result.reasons);
    }
    expect(() =>
      planProjectionPipeline({pipeline: '+proj=pipeline', onUnsupported: 'throw'})
    ).toThrow(ProjectionPlanningError);
    expect(
      planCRSProjection({from: geographicCRS, to: geographicCRS, onUnsupported: 'throw'}).status
    ).toBe('ready');
  });

  it('avoids the provider zero-second-parallel shortcut without changing LCC semantics', () => {
    const original = makeConicCRS('lambert-2sp');
    const target = {
      ...original,
      conversion: {
        ...original.conversion,
        parameters: original.conversion.parameters.map(parameter =>
          parameter.id.code === 8824 ? {...parameter, value: 0} : parameter
        )
      }
    };
    const normalized = normalizeCRSProviderDefinition(target);
    expect('definition' in normalized).toBe(true);
    const result = requireReady(
      planCRSProjection({
        from: geographicCRS,
        to: target,
        bounds: [-71.6, 41.7, -71.4, 41.9],
        tolerance: 1e-5
      })
    );
    const expected = new Proj4Projection({
      from: 'EPSG:4326',
      to: '+proj=lcc +lat_0=41 +lon_0=-71.5 +lat_1=0 +lat_2=42.6833333333 +x_0=200000 +y_0=750000 +ellps=WGS84'
    }).project([-71.5, 41.8]);
    const actual = evaluateProjectionProgram(result.program, [-71.5, 41.8]);
    expect(
      Math.hypot(actual.position[0] - expected[0], actual.position[1] - expected[1])
    ).toBeLessThan(1e-5);
  });
});
