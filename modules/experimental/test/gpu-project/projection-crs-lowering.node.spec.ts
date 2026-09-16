// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {Proj4Projection} from '@math.gl/proj4';
import {
  evaluateProjectionProgram,
  invertProjectionProgram
} from '@luma.gl/experimental/gpu-project';
import {
  planCRSProjection,
  type ProjectionPlanningResult
} from '@luma.gl/experimental/gpu-project/crs';
import {
  geographicCRS,
  makeTransverseMercatorCRS,
  makeWebMercatorCRS
} from './projection-crs-fixtures';

const radians = {type: 'AngularUnit', name: 'radian', conversion_factor: 1} as const;
const kilometres = {type: 'LinearUnit', name: 'kilometre', conversion_factor: 1000} as const;
const grads = {type: 'AngularUnit', name: 'grad', conversion_factor: Math.PI / 200} as const;

function requireNative(result: ProjectionPlanningResult) {
  if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
  expect(result.strategy).toBe('native');
  expect(result.reasons).toEqual([]);
  expect(result.compiled.metadata.approximationError.kind).toBe('none');
  expect(result.compiled.metadata.invertible).toBe(true);
  return result;
}

describe('native PROJJSON frame lowering', () => {
  it('plans geographic axes, units and meridians without fitting bounds or an oracle', () => {
    const target = {
      ...geographicCRS,
      datum: {
        ...geographicCRS.datum,
        prime_meridian: {name: 'Custom', longitude: {value: 2, unit: grads}}
      },
      coordinate_system: {
        subtype: 'ellipsoidal',
        axis: [
          {name: 'West longitude', abbreviation: 'W', direction: 'west', unit: radians},
          {name: 'South latitude', abbreviation: 'S', direction: 'south', unit: radians}
        ]
      }
    } as const;
    const project = vi.spyOn(Proj4Projection.prototype, 'project');
    try {
      const result = requireNative(
        planCRSProjection({
          from: geographicCRS,
          to: target,
          enforceAxis: true,
          allowAdaptive: false
        })
      );
      expect(project).not.toHaveBeenCalled();
      const forward = evaluateProjectionProgram(result.program, [40, 3.8]);
      expect(forward.valid).toBe(true);
      expect(forward.position[0]).toBeCloseTo((-2 * Math.PI) / 180, 14);
      expect(forward.position[1]).toBeCloseTo((-40 * Math.PI) / 180, 14);
      const inverse = evaluateProjectionProgram(
        invertProjectionProgram(result.program),
        forward.position
      );
      expect(inverse.position[0]).toBeCloseTo(40, 12);
      expect(inverse.position[1]).toBeCloseTo(3.8, 12);
      expect(evaluateProjectionProgram(result.program, [NaN, 0]).valid).toBe(false);
    } finally {
      project.mockRestore();
    }
  });

  it('defaults to longitude/easting first while retaining declared coordinate units', () => {
    const target = {
      ...geographicCRS,
      coordinate_system: {
        ...geographicCRS.coordinate_system,
        axis: geographicCRS.coordinate_system.axis.map(axis => ({...axis, unit: radians}))
      }
    };
    const result = requireNative(planCRSProjection({from: geographicCRS, to: target}));
    const position = evaluateProjectionProgram(result.program, [30, 60]).position;
    expect(position[0]).toBeCloseTo(Math.PI / 6, 14);
    expect(position[1]).toBeCloseTo(Math.PI / 3, 14);
  });

  it('supports distinct units on the two axes and a local output frame', () => {
    const target = {
      ...geographicCRS,
      coordinate_system: {
        ...geographicCRS.coordinate_system,
        axis: [
          {...geographicCRS.coordinate_system.axis[0], unit: grads},
          {...geographicCRS.coordinate_system.axis[1], unit: radians}
        ]
      }
    };
    const result = requireNative(
      planCRSProjection({
        from: geographicCRS,
        to: target,
        enforceAxis: true,
        precision: 'local-f32',
        destinationOrigin: [40, 1]
      })
    );
    const position = evaluateProjectionProgram(result.program, [36, 90]).position;
    expect(position[0]).toBeCloseTo(40, 12);
    expect(position[1]).toBeCloseTo(Math.PI / 2, 14);
    expect(result.compiled.destinationOrigin).toEqual([40, 1]);
    expect(result.compiled.metadata.outputFrame).toBe('origin-relative');
  });

  it('normalizes ellipsoid quantities without treating ellipsoid names as datum identities', () => {
    const ellipsoid = geographicCRS.datum.ellipsoid;
    const target = {
      ...geographicCRS,
      datum: {
        ...geographicCRS.datum,
        remarks: 'Cosmetic metadata',
        ellipsoid: {
          name: 'Same axes in kilometres',
          semi_major_axis: {value: 6378.137, unit: kilometres},
          semi_minor_axis: ellipsoid.semi_major_axis * (1 - 1 / ellipsoid.inverse_flattening)
        }
      }
    };
    requireNative(planCRSProjection({from: geographicCRS, to: target}));
    const differentDatum = {...target, datum: {...target.datum, name: 'Different realization'}};
    expect(
      planCRSProjection({from: geographicCRS, to: differentDatum, allowAdaptive: false})
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'datum-transformation-required'}]});
  });

  it('recognizes equivalent sphere encodings and static datum ensembles', () => {
    const source = {
      ...geographicCRS,
      datum: {...geographicCRS.datum, ellipsoid: {name: 'Sphere', radius: 6000000}}
    };
    const target = {
      ...source,
      datum: {
        ...source.datum,
        ellipsoid: {name: 'Sphere', semi_major_axis: 6000000, inverse_flattening: 0}
      }
    };
    requireNative(planCRSProjection({from: source, to: target}));
    const {datum, ...frame} = geographicCRS;
    const ensemble = {
      ...frame,
      datum_ensemble: {
        name: 'WGS ensemble',
        ellipsoid: datum.ellipsoid,
        accuracy: '2.0',
        members: [{name: 'Member A'}, {name: 'Member B'}]
      }
    };
    requireNative(planCRSProjection({from: ensemble, to: {...ensemble, name: 'Renamed CRS'}}));
    const other = {
      ...ensemble,
      datum_ensemble: {...ensemble.datum_ensemble, members: [{name: 'Member C'}]}
    };
    expect(
      planCRSProjection({from: ensemble, to: other, allowAdaptive: false}).reasons[0].code
    ).toBe('datum-transformation-required');
  });

  it.each([
    makeTransverseMercatorCRS(),
    makeWebMercatorCRS()
  ])('cancels equivalent conversions with native false-origin, axis and unit changes: $name', source => {
    const target = {
      ...source,
      conversion: {
        ...source.conversion,
        parameters: source.conversion.parameters.map(parameter => ({
          ...parameter,
          value:
            parameter.value +
            (parameter.id.code === 8806 ? 1000 : parameter.id.code === 8807 ? -2000 : 0)
        }))
      },
      coordinate_system: {
        ...source.coordinate_system,
        axis: [
          {...source.coordinate_system.axis[1], direction: 'south' as const, unit: kilometres},
          {...source.coordinate_system.axis[0], direction: 'west' as const, unit: kilometres}
        ]
      }
    };
    const result = requireNative(
      planCRSProjection({from: source, to: target, enforceAxis: true, allowAdaptive: false})
    );
    const coordinate = [500000.125, 4000000.25] as const;
    const actual = evaluateProjectionProgram(result.program, coordinate).position;
    expect(actual[0]).toBeCloseTo(-3998.00025, 10);
    expect(actual[1]).toBeCloseTo(-501.000125, 10);
    const inverse = evaluateProjectionProgram(
      invertProjectionProgram(result.program),
      actual
    ).position;
    expect(inverse[0]).toBeCloseTo(coordinate[0], 8);
    expect(inverse[1]).toBeCloseTo(coordinate[1], 8);
  });

  it('matches the public math.gl oracle in all 60 UTM zones and both hemispheres', () => {
    for (let zone = 1; zone <= 60; zone++) {
      for (const southernHemisphere of [false, true]) {
        const source = makeTransverseMercatorCRS(zone, southernHemisphere);
        const target = {
          ...source,
          conversion: {
            ...source.conversion,
            parameters: source.conversion.parameters.map(parameter => ({
              ...parameter,
              value:
                parameter.value +
                (parameter.id.code === 8806 ? 123.125 : parameter.id.code === 8807 ? -456.25 : 0)
            }))
          }
        };
        const result = requireNative(planCRSProjection({from: source, to: target}));
        const geographic = [zone * 6 - 183 + 1.25, southernHemisphere ? -38 : 38];
        const position = new Proj4Projection({from: 'EPSG:4326', to: source}).project(geographic);
        const expected = new Proj4Projection({from: source, to: target}).project(position);
        const actual = evaluateProjectionProgram(result.program, [
          position[0],
          position[1]
        ]).position;
        expect(Math.hypot(actual[0] - expected[0], actual[1] - expected[1])).toBeLessThan(1e-6);
      }
    }
  });

  it('compares named/EPSG parameters in canonical units and ignores parameter order', () => {
    const source = makeTransverseMercatorCRS();
    const target = {
      ...source,
      conversion: {
        ...source.conversion,
        method: {name: 'Transverse Mercator'},
        parameters: [...source.conversion.parameters].reverse().map(parameter => ({
          name: parameter.name,
          value:
            parameter.value *
            (parameter.unit === 'degree' ? Math.PI / 180 : parameter.unit === 'metre' ? 0.001 : 1),
          unit:
            parameter.unit === 'degree'
              ? radians
              : parameter.unit === 'metre'
                ? kilometres
                : ('unity' as const)
        }))
      }
    };
    requireNative(planCRSProjection({from: source, to: target}));
  });

  it('compares projected central meridians relative to Greenwich', () => {
    const source = makeTransverseMercatorCRS(31);
    const target = {
      ...source,
      base_crs: {
        ...source.base_crs,
        datum: {...source.base_crs.datum, prime_meridian: {name: 'Custom', longitude: 3}}
      },
      conversion: {
        ...source.conversion,
        parameters: source.conversion.parameters.map(parameter => ({
          ...parameter,
          value: parameter.id.code === 8802 ? 0 : parameter.value
        }))
      }
    };
    requireNative(planCRSProjection({from: source, to: target}));
  });

  it('declines different zones, methods, ellipsoids and reference anchors without hiding a transformation', () => {
    const source = makeTransverseMercatorCRS();
    const cases: ReadonlyCRSDefinition[] = [
      makeTransverseMercatorCRS(11),
      makeWebMercatorCRS(),
      geographicCRS,
      {
        ...source,
        base_crs: {...source.base_crs, datum: {...source.base_crs.datum, anchor: 'Another anchor'}}
      },
      {
        ...source,
        base_crs: {
          ...source.base_crs,
          datum: {
            ...source.base_crs.datum,
            ellipsoid: {...source.base_crs.datum.ellipsoid, semi_major_axis: 6378136}
          }
        }
      }
    ];
    for (const target of cases)
      expect(planCRSProjection({from: source, to: target, allowAdaptive: false}).status).toBe(
        'unsupported'
      );
  });

  it('requires bounds only for adaptive routes and preserves provider fallback', () => {
    expect(
      planCRSProjection({from: geographicCRS, to: makeTransverseMercatorCRS()}).reasons.at(-1)?.code
    ).toBe('bounds-required');
    const result = planCRSProjection({
      from: geographicCRS,
      to: makeTransverseMercatorCRS(),
      bounds: [-122.5, 37.7, -122.3, 37.9],
      tolerance: 1e-4
    });
    expect(result).toMatchObject({status: 'ready', strategy: 'adaptive'});
    const native = requireNative(
      planCRSProjection({
        from: geographicCRS,
        to: geographicCRS,
        bounds: [1, 1, -1, -1],
        maxPatches: 0
      })
    );
    expect(native.compiled.metadata.stages.every(stage => stage.inputBounds === null)).toBe(true);
  });

  it.each([
    [
      'wrong axis unit',
      {
        ...geographicCRS,
        coordinate_system: {
          ...geographicCRS.coordinate_system,
          axis: geographicCRS.coordinate_system.axis.map(axis => ({
            ...axis,
            unit: 'metre' as const
          }))
        }
      },
      'unsupported-unit'
    ],
    [
      'zero factor',
      {
        ...geographicCRS,
        coordinate_system: {
          ...geographicCRS.coordinate_system,
          axis: geographicCRS.coordinate_system.axis.map(axis => ({
            ...axis,
            unit: {...radians, conversion_factor: 0}
          }))
        }
      },
      'unsupported-unit'
    ],
    [
      'oblique axis',
      {
        ...geographicCRS,
        coordinate_system: {
          ...geographicCRS.coordinate_system,
          axis: geographicCRS.coordinate_system.axis.map(axis => ({
            ...axis,
            direction: 'northEast' as const
          }))
        }
      },
      'unsupported-coordinate-system'
    ],
    [
      'axis meridian',
      {
        ...geographicCRS,
        coordinate_system: {
          ...geographicCRS.coordinate_system,
          axis: geographicCRS.coordinate_system.axis.map(axis => ({
            ...axis,
            meridian: {longitude: 0}
          }))
        }
      },
      'unsupported-coordinate-system'
    ],
    [
      'axis range',
      {
        ...geographicCRS,
        coordinate_system: {
          ...geographicCRS.coordinate_system,
          axis: geographicCRS.coordinate_system.axis.map(axis => ({...axis, minimum_value: -90}))
        }
      },
      'unsupported-coordinate-system'
    ],
    [
      'dynamic frame',
      {
        ...geographicCRS,
        datum: {
          ...geographicCRS.datum,
          type: 'DynamicGeodeticReferenceFrame' as const,
          frame_reference_epoch: 2020
        }
      },
      'unsupported-datum'
    ],
    [
      'invalid ellipsoid',
      {
        ...geographicCRS,
        datum: {
          ...geographicCRS.datum,
          ellipsoid: {...geographicCRS.datum.ellipsoid, inverse_flattening: NaN}
        }
      },
      'invalid-definition'
    ],
    [
      'missing meridian longitude',
      {...geographicCRS, datum: {...geographicCRS.datum, prime_meridian: {name: 'Not enough'}}},
      'invalid-definition'
    ]
  ] as const)('rejects %s even when adaptive fallback is available', (_name, target, code) => {
    expect(
      planCRSProjection({from: geographicCRS, to: target, bounds: [-1, -1, 1, 1]})
    ).toMatchObject({status: 'unsupported', reasons: [{code}]});
  });

  it('does not let duplicate, incomplete or unsupported conversion parameters cancel', () => {
    const source = makeTransverseMercatorCRS();
    const cases = [
      [...source.conversion.parameters, source.conversion.parameters[0]],
      source.conversion.parameters.slice(1),
      [
        ...source.conversion.parameters,
        {name: 'Unrecognized parameter', value: 10, unit: 'metre' as const}
      ],
      source.conversion.parameters.map(parameter => ({
        ...parameter,
        value: parameter.id.code === 8805 ? 0 : parameter.value
      }))
    ];
    for (const parameters of cases) {
      const definition = {...source, conversion: {...source.conversion, parameters}};
      expect(
        planCRSProjection({from: definition, to: definition, allowAdaptive: false}).status
      ).toBe('unsupported');
    }
  });

  it('does not send unsupported coordinate units through adaptive fallback', () => {
    const angular = {
      ...geographicCRS,
      coordinate_system: {
        ...geographicCRS.coordinate_system,
        axis: geographicCRS.coordinate_system.axis.map(axis => ({...axis, unit: radians}))
      }
    };
    const projected = makeTransverseMercatorCRS();
    const mixed = {
      ...projected,
      coordinate_system: {
        ...projected.coordinate_system,
        axis: [
          projected.coordinate_system.axis[0],
          {...projected.coordinate_system.axis[1], unit: kilometres}
        ]
      }
    };
    for (const from of [
      angular,
      mixed,
      {
        ...geographicCRS,
        datum: {
          ...geographicCRS.datum,
          prime_meridian: {name: 'Custom', longitude: {value: 1, unit: grads}}
        }
      }
    ]) {
      const result = planCRSProjection({from, to: 'EPSG:3857', bounds: [-1, -1, 1, 1]});
      expect(result.status).toBe('unsupported');
      expect(result.reasons.at(-1)?.code).toBe('unsupported-unit');
    }
    const ambiguous = {
      ...geographicCRS,
      datum: {
        ...geographicCRS.datum,
        ellipsoid: {...geographicCRS.datum.ellipsoid, radius: 6378137}
      }
    };
    expect(planCRSProjection({from: ambiguous, to: ambiguous}).reasons[0].code).toBe(
      'invalid-definition'
    );
  });

  it('retains reference identifiers and unknown defining fields while accepting property reordering', () => {
    const source = {
      ...geographicCRS,
      datum: {
        ...geographicCRS.datum,
        id: {authority: 'TEST', code: 1},
        customFrameDefinition: {first: 1, second: 2}
      }
    };
    const reordered = {
      ...source,
      datum: {
        ...source.datum,
        id: {code: 1, authority: 'TEST'},
        customFrameDefinition: {second: 2, first: 1}
      }
    };
    requireNative(planCRSProjection({from: source, to: reordered}));
    for (const datum of [
      {...source.datum, id: {authority: 'TEST', code: 2}},
      {...source.datum, customFrameDefinition: {first: 2, second: 2}}
    ]) {
      expect(
        planCRSProjection({from: source, to: {...source, datum}, allowAdaptive: false}).reasons[0]
          .code
      ).toBe('datum-transformation-required');
    }
  });

  it('never falls back by dropping extra parameters on known methods or misreading EPSG labels', () => {
    const projected = makeTransverseMercatorCRS();
    const extra = {
      ...projected,
      conversion: {
        ...projected.conversion,
        parameters: [
          ...projected.conversion.parameters,
          {name: 'Unknown distortion', value: 1, unit: 'unity' as const}
        ]
      }
    };
    expect(
      planCRSProjection({from: geographicCRS, to: extra, bounds: [-123, 37, -122, 38]})
    ).toMatchObject({status: 'unsupported', reasons: [{code: 'unsupported-parameter'}]});
    const renamed = {
      ...projected,
      conversion: {
        ...projected.conversion,
        parameters: projected.conversion.parameters.map(parameter => ({
          ...parameter,
          name: `Localized ${parameter.id.code}`
        }))
      }
    };
    requireNative(planCRSProjection({from: projected, to: renamed}));
    const adaptive = planCRSProjection({
      from: geographicCRS,
      to: renamed,
      bounds: [-123, 37, -122, 38]
    });
    expect(adaptive.status).toBe('unsupported');
    expect(adaptive.reasons.at(-1)?.code).toBe('unsupported-conversion');
  });
});
