// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ReadonlyCRSDefinition} from '@math.gl/crs';
import {getUnitFactor} from './projection-crs-lowering';
import type {ProjectionPlanningReason} from './projection-pipeline';

type Identifier = {readonly authority: string; readonly code: string | number};
type Identified = {
  readonly name: string;
  readonly id?: Identifier;
  readonly ids?: readonly Identifier[];
};
type Parameter = {name: string; unit: 'degree' | 'metre' | 'unity'; value: number};

// EPSG method/parameter semantics; provider names are an adapter detail, not CRS identifiers.
// https://proj.org/en/stable/operations/projections/lcc.html
// https://proj.org/en/stable/operations/projections/aea.html
const METHODS = new Map([
  ['Lambert Conic Conformal (1SP)', 9801],
  ['Lambert Conic Conformal (2SP)', 9802],
  ['Albers Equal Area', 9822],
  ['Transverse Mercator', 9807],
  ['Popular Visualisation Pseudo Mercator', 1024]
]);
const PARAMETERS = new Map<number, Omit<Parameter, 'value'>>([
  [8801, {name: 'Latitude of natural origin', unit: 'degree'}],
  [8802, {name: 'Longitude of natural origin', unit: 'degree'}],
  [8805, {name: 'Scale factor at natural origin', unit: 'unity'}],
  [8806, {name: 'False easting', unit: 'metre'}],
  [8807, {name: 'False northing', unit: 'metre'}],
  [8821, {name: 'Latitude of false origin', unit: 'degree'}],
  [8822, {name: 'Longitude of false origin', unit: 'degree'}],
  [8823, {name: 'Latitude of 1st standard parallel', unit: 'degree'}],
  [8824, {name: 'Latitude of 2nd standard parallel', unit: 'degree'}],
  [8826, {name: 'Easting at false origin', unit: 'metre'}],
  [8827, {name: 'Northing at false origin', unit: 'metre'}]
] as const);
const PARAMETER_NAMES = new Map([...PARAMETERS].map(([code, parameter]) => [parameter.name, code]));

/** Normalize verified provider-only conversions without mutating the caller's definition. */
export function normalizeCRSProviderDefinition(
  definition: ReadonlyCRSDefinition
): {definition: ReadonlyCRSDefinition} | {reason: ProjectionPlanningReason} {
  if (typeof definition === 'string' || definition.type !== 'ProjectedCRS') return {definition};
  const conversion = definition.conversion;
  const method = resolveIdentifier(conversion.method, METHODS);
  if (![9801, 9802, 9822].includes(method ?? -1)) {
    // Never reinterpret a recognized conic label with an unknown/conflicting EPSG identifier.
    if ([9801, 9802, 9822].includes(METHODS.get(conversion.method.name) ?? -1))
      return decline('unsupported-conversion', 'conflicting or unknown conic method identifier');
    return {definition};
  }
  const required =
    method === 9801 ? [8801, 8802, 8805, 8806, 8807] : [8821, 8822, 8823, 8824, 8826, 8827];
  const parameters = new Map<number, Parameter>();
  for (const parameter of conversion.parameters ?? []) {
    const code = resolveIdentifier(parameter, PARAMETER_NAMES);
    if (code === undefined || !required.includes(code))
      return decline(
        'unsupported-parameter',
        'conic parameter has no unambiguous supported mapping'
      );
    const metadata = PARAMETERS.get(code)!;
    const factor = getUnitFactor(
      parameter.unit,
      metadata.unit === 'degree'
        ? 'AngularUnit'
        : metadata.unit === 'metre'
          ? 'LinearUnit'
          : 'ScaleUnit'
    );
    if (factor === null)
      return decline(
        'unsupported-unit',
        'conic parameter requires explicit units of the correct dimension'
      );
    const value =
      typeof parameter.value === 'number'
        ? (parameter.value * factor) / (metadata.unit === 'degree' ? Math.PI / 180 : 1)
        : NaN;
    if (!Number.isFinite(value) || parameters.has(code))
      return decline('invalid-definition', 'conic parameters must be unique finite quantities');
    parameters.set(code, {...metadata, value});
  }
  if (required.some(code => !parameters.has(code)))
    return decline('invalid-definition', 'conic conversion is missing required parameters');
  const latitude = parameters.get(method === 9801 ? 8801 : 8821)!.value;
  const firstParallel = method === 9801 ? latitude : parameters.get(8823)!.value;
  const secondParallel = method === 9801 ? latitude : parameters.get(8824)!.value;
  if (
    [latitude, firstParallel, secondParallel].some(value => Math.abs(value) >= 90) ||
    (Math.abs(firstParallel + secondParallel) * Math.PI) / 180 < 1e-10 ||
    (method === 9801 && parameters.get(8805)!.value <= 0)
  )
    return decline(
      'invalid-definition',
      'conic latitude, standard parallels or scale are degenerate'
    );
  if (method === 9801) {
    // proj4js needs the tangent parallel explicitly; EPSG 9801 defines it by the natural origin.
    parameters.set(8823, {...PARAMETERS.get(8823)!, value: latitude});
    parameters.set(8824, {...PARAMETERS.get(8824)!, value: latitude});
  } else if (method === 9802 && secondParallel === 0) {
    // The provider treats a zero second parallel as absent. The two parallels are symmetric.
    parameters.set(8823, {...PARAMETERS.get(8823)!, value: secondParallel});
    parameters.set(8824, {...PARAMETERS.get(8824)!, value: firstParallel});
  }
  // Reconstruct in semantic order: the provider visits base CRS before conversion and output axes.
  // CRS registry identifiers must not override the explicit conversion via provider alias shortcuts.
  const {
    base_crs: baseCRS,
    conversion: _conversion,
    coordinate_system: coordinateSystem,
    id: _identifier,
    ids: _identifiers,
    ...description
  } = definition;
  return {
    definition: {
      ...description,
      base_crs: baseCRS,
      conversion: {
        name: conversion.name,
        method: {name: method === 9822 ? 'Albers_Conic_Equal_Area' : 'Lambert_Conformal_Conic'},
        parameters: [...parameters.values()]
      },
      coordinate_system: coordinateSystem
    }
  };
}

function resolveIdentifier(
  object: Identified,
  names: ReadonlyMap<string, number>
): number | undefined {
  const identifiers = [...(object.id ? [object.id] : []), ...(object.ids ?? [])].filter(
    identifier => identifier.authority === 'EPSG'
  );
  const named = names.get(object.name);
  if (!identifiers.length) return named;
  const code = Number(identifiers[0].code);
  return Number.isSafeInteger(code) &&
    identifiers.every(identifier => Number(identifier.code) === code) &&
    (named === undefined || named === code)
    ? code
    : undefined;
}

function decline(
  code: ProjectionPlanningReason['code'],
  message: string
): {reason: ProjectionPlanningReason} {
  return {reason: {code, message}};
}
