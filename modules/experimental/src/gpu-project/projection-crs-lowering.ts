// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {PROJJSONCRSByType, ReadonlyCRSDefinition, ReadonlyPROJJSONCRS} from '@math.gl/crs';
import {invertProjectionProgram, type ProjectionOperation} from './projection-program';
import type {ProjectionPlanningReason} from './projection-pipeline';

type ProjectedCRS = ReadonlyPROJJSONCRS<PROJJSONCRSByType<'ProjectedCRS'>>;
type HorizontalCRS = ReadonlyPROJJSONCRS<
  PROJJSONCRSByType<'GeographicCRS' | 'GeodeticCRS' | 'ProjectedCRS'>
>;
type GeographicCRS = ProjectedCRS['base_crs'];
type CoordinateSystem = ProjectedCRS['coordinate_system'];
type Unit = NonNullable<CoordinateSystem['axis'][number]['unit']>;
type StaticDatum = Exclude<NonNullable<GeographicCRS['datum']>, {frame_reference_epoch: number}>;
type Ellipsoid = StaticDatum['ellipsoid'];
type Decline = {reason: ProjectionPlanningReason};
type Reference = {identity: string; major: number; minor: number; meridian: number};
type Conversion = {
  method: number;
  latitude: number;
  longitude: number;
  scale: number;
  easting: number;
  northing: number;
};
type Frame = {
  operations: ProjectionOperation[];
  reference: Reference;
  conversion: Conversion | null;
};

const PARAMETER_NAMES = new Map([
  ['Latitude of natural origin', 8801],
  ['Longitude of natural origin', 8802],
  ['Scale factor at natural origin', 8805],
  ['False easting', 8806],
  ['False northing', 8807]
]);

/** Native changes of coordinate frame, not a projection or datum transformation engine. */
export function lowerCRSProjection(
  from: ReadonlyCRSDefinition,
  to: ReadonlyCRSDefinition,
  enforceAxis: boolean
): {operations: ProjectionOperation[]} | Decline {
  const source = normalizeFrame(from, enforceAxis);
  const target = normalizeFrame(to, enforceAxis);
  for (const frame of [source, target]) {
    if ('reason' in frame && !canUseCRSProvider(frame.reason)) {
      return frame;
    }
  }
  if ('reason' in source) return source;
  if ('reason' in target) return target;
  if (
    source.reference.identity !== target.reference.identity ||
    source.reference.major !== target.reference.major ||
    source.reference.minor !== target.reference.minor
  ) {
    return decline(
      'datum-transformation-required',
      'native lowering requires the same explicit reference frame and ellipsoid'
    );
  }
  let translation: readonly [number, number];
  if (!source.conversion && !target.conversion) {
    translation = [source.reference.meridian - target.reference.meridian, 0];
  } else if (
    source.conversion &&
    target.conversion &&
    source.conversion.method === target.conversion.method &&
    source.conversion.latitude === target.conversion.latitude &&
    source.conversion.longitude + source.reference.meridian ===
      target.conversion.longitude + target.reference.meridian &&
    source.conversion.scale === target.conversion.scale
  ) {
    translation = [
      target.conversion.easting - source.conversion.easting,
      target.conversion.northing - source.conversion.northing
    ];
  } else {
    return decline(
      'crs-requires-provider',
      'different projection conversions require a bounded provider plan'
    );
  }
  return {
    operations: [
      ...source.operations,
      {type: 'affine', scale: [1, 1], offset: translation},
      ...invertProjectionProgram({precision: 'double-single', operations: target.operations})
        .operations
    ]
  };
}

/** Do not send semantics known to be invalid or lossy through a permissive provider. */
export function canUseCRSProvider(reason: ProjectionPlanningReason): boolean {
  return [
    'crs-requires-provider',
    'datum-transformation-required',
    'unsupported-conversion'
  ].includes(reason.code);
}

/** The current public provider consumes degrees and one shared projected-coordinate unit. */
export function getCRSProviderReason(
  definition: ReadonlyCRSDefinition
): ProjectionPlanningReason | null {
  if (!isHorizontalCRS(definition)) return null;
  if (definition.type === 'ProjectedCRS') {
    const conversion = definition.conversion;
    const method = getEPSGCode(conversion.method);
    if (
      ((method === 9807 || method === 1024) &&
        conversion.method.name !==
          (method === 9807 ? 'Transverse Mercator' : 'Popular Visualisation Pseudo Mercator')) ||
      conversion.parameters?.some(parameter => {
        const code = getEPSGCode(parameter);
        return (
          code !== undefined &&
          [...PARAMETER_NAMES.values()].includes(code) &&
          PARAMETER_NAMES.get(parameter.name) !== code
        );
      })
    ) {
      return {
        code: 'unsupported-conversion',
        message:
          'adaptive provider requires canonical names for supported EPSG methods and parameters; native lowering can use their identifiers'
      };
    }
  }
  const projected = definition.type === 'ProjectedCRS';
  const factors = definition.coordinate_system?.axis.map(axis =>
    getUnitFactor(axis.unit, projected ? 'LinearUnit' : 'AngularUnit')
  );
  if (
    !factors ||
    (projected ? factors[0] !== factors[1] : factors.some(factor => factor !== Math.PI / 180))
  ) {
    return {
      code: 'unsupported-unit',
      message:
        'adaptive provider requires geographic degrees or one shared projected-axis unit; native frame changes retain explicit per-axis units'
    };
  }
  const geographic = definition.type === 'ProjectedCRS' ? definition.base_crs : definition;
  const longitude = geographic.datum?.prime_meridian;
  if (
    longitude &&
    typeof longitude === 'object' &&
    'longitude' in longitude &&
    typeof longitude.longitude !== 'number'
  ) {
    return {
      code: 'unsupported-unit',
      message: 'adaptive provider requires prime-meridian longitude as numeric degrees'
    };
  }
  return null;
}

function normalizeFrame(definition: ReadonlyCRSDefinition, enforceAxis: boolean): Frame | Decline {
  if (typeof definition === 'string') {
    return decline(
      'crs-requires-provider',
      'serialized CRS definitions require a bounded provider plan'
    );
  }
  if (!isHorizontalCRS(definition)) {
    return decline(
      'unsupported-dimensions',
      'native lowering supports only explicit 2D geographic and projected CRS objects'
    );
  }
  const projected = definition.type === 'ProjectedCRS';
  const geographic = definition.type === 'ProjectedCRS' ? definition.base_crs : definition;
  const reference = normalizeReference(geographic);
  if ('reason' in reference) return reference;
  const operations = normalizeAxes(definition.coordinate_system, projected, enforceAxis);
  if ('reason' in operations) return operations;
  if (projected) {
    const conversion = normalizeConversion(definition.conversion);
    if ('reason' in conversion) return conversion;
    return {operations: operations.operations, reference, conversion};
  }
  return {operations: operations.operations, reference, conversion: null};
}

function isHorizontalCRS(definition: ReadonlyCRSDefinition): definition is HorizontalCRS {
  return (
    typeof definition !== 'string' &&
    (definition.type === 'GeographicCRS' ||
      definition.type === 'GeodeticCRS' ||
      definition.type === 'ProjectedCRS')
  );
}

function normalizeAxes(
  system: CoordinateSystem | undefined,
  projected: boolean,
  enforceAxis: boolean
): {operations: ProjectionOperation[]} | Decline {
  if (
    !system ||
    system.axis.length !== 2 ||
    system.subtype !== (projected ? 'Cartesian' : 'ellipsoidal')
  ) {
    return decline('unsupported-dimensions', 'coordinate system must have two horizontal axes');
  }
  const horizontal = system.axis.findIndex(
    axis => axis.direction === 'east' || axis.direction === 'west'
  );
  const vertical = system.axis.findIndex(
    axis => axis.direction === 'north' || axis.direction === 'south'
  );
  if (
    horizontal < 0 ||
    vertical < 0 ||
    system.axis.some(
      axis =>
        axis.meridian ||
        axis.minimum_value !== undefined ||
        axis.maximum_value !== undefined ||
        axis.range_meaning !== undefined
    )
  ) {
    return decline(
      'unsupported-coordinate-system',
      'only unconstrained cardinal horizontal axes can be lowered natively'
    );
  }
  const axisX = system.axis[horizontal];
  const axisY = system.axis[vertical];
  const factorX = getUnitFactor(axisX.unit, projected ? 'LinearUnit' : 'AngularUnit');
  const factorY = getUnitFactor(axisY.unit, projected ? 'LinearUnit' : 'AngularUnit');
  if (factorX === null || factorY === null) {
    return decline(
      'unsupported-unit',
      'axes require explicit positive units of the appropriate dimension'
    );
  }
  return {
    operations: [
      {type: 'axis', order: enforceAxis && horizontal === 1 ? [1, 0] : [0, 1]},
      {
        type: 'affine',
        scale: [
          factorX * (enforceAxis && axisX.direction === 'west' ? -1 : 1),
          factorY * (enforceAxis && axisY.direction === 'south' ? -1 : 1)
        ],
        offset: [0, 0]
      }
    ]
  };
}

function normalizeReference(
  geographic: Pick<GeographicCRS, 'datum' | 'datum_ensemble' | 'deformation_models'>
): Reference | Decline {
  const datum = geographic.datum;
  const ensemble = geographic.datum_ensemble;
  if (
    geographic.deformation_models?.length ||
    (datum &&
      ('frame_reference_epoch' in datum || (datum.type && datum.type !== 'GeodeticReferenceFrame')))
  ) {
    return decline(
      'unsupported-datum',
      'dynamic reference frames and deformation models require an explicit temporal transformation'
    );
  }
  if (Boolean(datum) === Boolean(ensemble)) {
    return decline('invalid-definition', 'exactly one static datum or datum ensemble is required');
  }
  const staticDatum = datum as StaticDatum | undefined;
  const ellipsoid = staticDatum?.ellipsoid ?? ensemble?.ellipsoid;
  if (!ellipsoid) return decline('invalid-definition', 'an explicit ellipsoid is required');
  const axes = normalizeEllipsoid(ellipsoid);
  if ('reason' in axes) return axes;
  const primeMeridian = staticDatum?.prime_meridian;
  const meridian = primeMeridian ? getMeasuredValue(primeMeridian.longitude, 'AngularUnit') : 0;
  if (meridian === null)
    return decline('invalid-definition', 'prime meridian requires an explicit finite longitude');
  return {
    identity: `${staticDatum ? 'datum' : 'ensemble'}:${referenceIdentity(staticDatum ?? ensemble)}`,
    ...axes,
    meridian
  };
}

function normalizeEllipsoid(ellipsoid: Ellipsoid): {major: number; minor: number} | Decline {
  if (
    'radius' in ellipsoid
      ? 'semi_major_axis' in ellipsoid ||
        'semi_minor_axis' in ellipsoid ||
        'inverse_flattening' in ellipsoid
      : 'semi_minor_axis' in ellipsoid === 'inverse_flattening' in ellipsoid
  ) {
    return decline('invalid-definition', 'ellipsoid must have exactly one shape representation');
  }
  const major = getMeasuredValue(
    'radius' in ellipsoid ? ellipsoid.radius : ellipsoid.semi_major_axis,
    'LinearUnit'
  );
  let minor: number | null = null;
  if ('radius' in ellipsoid) minor = major;
  else if ('semi_minor_axis' in ellipsoid)
    minor = getMeasuredValue(ellipsoid.semi_minor_axis, 'LinearUnit');
  else if (
    Number.isFinite(ellipsoid.inverse_flattening) &&
    (ellipsoid.inverse_flattening === 0 || ellipsoid.inverse_flattening > 1)
  ) {
    minor =
      major === null
        ? null
        : major * (ellipsoid.inverse_flattening === 0 ? 1 : 1 - 1 / ellipsoid.inverse_flattening);
  }
  if (major === null || minor === null || !(major > 0 && minor > 0 && minor <= major)) {
    return decline(
      'invalid-definition',
      'ellipsoid axes must define a finite positive oblate ellipsoid'
    );
  }
  return {major, minor};
}

function normalizeConversion(conversion: ProjectedCRS['conversion']): Conversion | Decline {
  const method =
    getEPSGCode(conversion.method) ??
    (conversion.method.name === 'Transverse Mercator'
      ? 9807
      : conversion.method.name === 'Popular Visualisation Pseudo Mercator'
        ? 1024
        : undefined);
  if (method !== 9807 && method !== 1024) {
    return decline(
      'unsupported-conversion',
      'native frame equivalence supports Transverse Mercator and Popular Visualisation Pseudo Mercator'
    );
  }
  const parameters = new Map<number, number>();
  for (const parameter of conversion.parameters ?? []) {
    const code = getEPSGCode(parameter) ?? PARAMETER_NAMES.get(parameter.name);
    if (
      !code ||
      ![8801, 8802, 8805, 8806, 8807].includes(code) ||
      (method === 1024 && code === 8805)
    ) {
      return decline('unsupported-parameter', 'known conversion includes an unsupported parameter');
    }
    const factor = getUnitFactor(
      parameter.unit,
      code === 8805 ? 'ScaleUnit' : code < 8805 ? 'AngularUnit' : 'LinearUnit'
    );
    const value =
      typeof parameter.value === 'number' && factor !== null ? parameter.value * factor : NaN;
    if (parameters.has(code) || !Number.isFinite(value)) {
      return decline(
        'invalid-definition',
        'conversion parameters must be unique finite quantities with explicit units'
      );
    }
    parameters.set(code, value);
  }
  if (
    ![8801, 8802, 8806, 8807, ...(method === 9807 ? [8805] : [])].every(code =>
      parameters.has(code)
    )
  ) {
    return decline(
      'invalid-definition',
      'conversion is missing required natural-origin parameters'
    );
  }
  const latitude = parameters.get(8801)!;
  const scale = parameters.get(8805) ?? 1;
  if (Math.abs(latitude) >= Math.PI / 2 || scale <= 0 || (method === 1024 && latitude !== 0)) {
    return decline('invalid-definition', 'conversion natural origin or scale is invalid');
  }
  return {
    method,
    latitude,
    longitude: parameters.get(8802)!,
    scale,
    easting: parameters.get(8806)!,
    northing: parameters.get(8807)!
  };
}

function getEPSGCode(object: {
  readonly id?: {readonly authority: string; readonly code: string | number};
  readonly ids?: readonly {readonly authority: string; readonly code: string | number}[];
}): number | undefined {
  const identifier = object.id ?? object.ids?.find(identifier => identifier.authority === 'EPSG');
  return identifier?.authority === 'EPSG' ? Number(identifier.code) : undefined;
}

function getUnitFactor(
  unit: Unit | undefined,
  dimension: 'LinearUnit' | 'AngularUnit' | 'ScaleUnit'
): number | null {
  if (unit === 'metre' && dimension === 'LinearUnit') return 1;
  if (unit === 'degree' && dimension === 'AngularUnit') return Math.PI / 180;
  if (unit === 'unity' && dimension === 'ScaleUnit') return 1;
  if (
    typeof unit === 'object' &&
    unit.type === dimension &&
    Number.isFinite(unit.conversion_factor) &&
    unit.conversion_factor! > 0
  )
    return unit.conversion_factor!;
  return null;
}

function getMeasuredValue(value: unknown, dimension: 'LinearUnit' | 'AngularUnit'): number | null {
  if (typeof value === 'number') {
    const result = value * (dimension === 'LinearUnit' ? 1 : Math.PI / 180);
    return Number.isFinite(result) ? result : null;
  }
  if (
    !value ||
    typeof value !== 'object' ||
    !('value' in value) ||
    typeof value.value !== 'number' ||
    !('unit' in value)
  )
    return null;
  const factor = getUnitFactor(value.unit as Unit, dimension);
  const result = factor === null ? NaN : value.value * factor;
  return Number.isFinite(result) ? result : null;
}

function referenceIdentity(reference: unknown): string {
  // Labels/usage do not alter a frame. Keep names, identifiers, anchors, ensemble members,
  // accuracy and unknown extensions: equal ellipsoids alone never establish datum equivalence.
  const descriptive = new Set([
    'ellipsoid',
    'prime_meridian',
    'type',
    '$schema',
    'remarks',
    'scope',
    'area',
    'bbox',
    'usages',
    'vertical_extent',
    'temporal_extent'
  ]);
  const identity = Object.fromEntries(
    Object.entries(reference as object).filter(([key]) => !descriptive.has(key))
  );
  return JSON.stringify(identity, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([first], [second]) => first.localeCompare(second))
      );
    }
    return value;
  });
}

function decline(code: ProjectionPlanningReason['code'], message: string): Decline {
  return {reason: {code, message}};
}
