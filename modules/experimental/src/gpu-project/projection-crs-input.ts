// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {
  createSpatialReference,
  inferCRSRepresentation,
  parseWKTCRS,
  type ReadonlyCRSDefinition,
  type CRSReference,
  type SpatialReference,
  type WKTCRSNode
} from '@math.gl/crs';
import {
  normalizeCRS,
  type CRSNormalizationOptions,
  type NormalizedCRS,
  type TypeScriptCRSInput
} from '@math.gl/projection/core';
import {projJSONCRSParser} from '@math.gl/projection/parsers/projjson';
import {wktCRSParser} from '@math.gl/projection/parsers/wkt';
import {datumCatalog} from '@math.gl/projection/datums';
import {normalizeCRSProviderDefinition} from './projection-crs-provider';
import {
  lowerCRSProjection,
  canUseCRSProvider,
  getCRSProviderReason
} from './projection-crs-lowering';
import {ProjectionPlanningError, type ProjectionPlanningReason} from './projection-planning';

export type ProjectionReference = {
  readonly reference: SpatialReference;
  readonly definition: ReadonlyCRSDefinition;
  readonly input: TypeScriptCRSInput;
};

/** Retain immutable source metadata separately from the provider's canonical definition. */
export function resolveProjectionReference(input: TypeScriptCRSInput): ProjectionReference {
  const reference = createSpatialReference(
    typeof input === 'string' || 'type' in input
      ? {
          crs: {
            state: 'explicit',
            definition: input,
            representation: inferCRSRepresentation(input),
            provenance: 'caller-override'
          }
        }
      : 'crs' in input
        ? (input as SpatialReference)
        : {crs: input as CRSReference}
  );
  if (reference.crs.state !== 'explicit' && reference.crs.state !== 'default')
    declineProjection('invalid-definition', 'projection requires a known CRS reference');
  if (reference.coordinateEpoch !== undefined)
    declineProjection('unsupported-datum', 'coordinate epochs require a temporal GPU contract');
  if (reference.vertical && reference.vertical.state !== 'absent')
    declineProjection('unsupported-dimensions', 'separate vertical CRS metadata is not supported');
  if (reference.coordinateOrder.length && reference.coordinateOrder.length !== 2)
    declineProjection('unsupported-dimensions', 'stored coordinates must be two dimensional');
  if (reference.units && reference.units.length !== 2)
    declineProjection('unsupported-unit', 'stored units must describe both horizontal coordinates');
  if (!['unknown', 'geographic', 'projected'].includes(reference.coordinateFrame))
    declineProjection(
      'unsupported-coordinate-system',
      'only geographic and projected frames are supported'
    );
  const definition = reference.crs.definition;
  validateProjectionDefinition(definition);
  const canonical = normalizeCRSProviderDefinition(definition);
  if ('reason' in canonical) throw new ProjectionPlanningError([canonical.reason]);
  const providerReason = getCRSProviderReason(canonical.definition);
  if (providerReason) throw new ProjectionPlanningError([providerReason]);
  return {
    reference,
    definition,
    input: createSpatialReference({
      ...reference,
      crs: {...reference.crs, definition: canonical.definition}
    })
  };
}

function validateProjectionDefinition(definition: ReadonlyCRSDefinition): void {
  if (typeof definition === 'string') {
    if (definition === 'EPSG:4979')
      declineProjection(
        'unsupported-dimensions',
        'three-dimensional geographic CRS is not supported'
      );
    if (inferCRSRepresentation(definition) === 'wkt')
      validateWKTDimensions(parseWKTCRS(definition).root);
    return;
  }
  const dimensions =
    definition.type === 'ProjectedCRS'
      ? definition.coordinate_system?.axis.length === 2 &&
        definition.base_crs.coordinate_system?.axis.length === 2
      : (definition.type === 'GeographicCRS' || definition.type === 'GeodeticCRS') &&
        definition.coordinate_system?.subtype === 'ellipsoidal' &&
        definition.coordinate_system.axis.length === 2;
  if (!dimensions)
    declineProjection(
      'unsupported-dimensions',
      'only explicit horizontal 2D definitions are supported'
    );
  // Reuse native safety checks even when the conversion needs a provider.
  const frame = lowerCRSProjection(definition, definition, false);
  if ('reason' in frame && !canUseCRSProvider(frame.reason))
    throw new ProjectionPlanningError([frame.reason]);
}

function validateWKTDimensions(node: WKTCRSNode): void {
  const children = node.values.filter((value): value is WKTCRSNode => value.type === 'node');
  const keyword = node.keyword.toUpperCase();
  if (
    [
      'COMPOUNDCRS',
      'COMPD_CS',
      'BOUNDCRS',
      'VERTCRS',
      'VERT_CS',
      'GEOCCS',
      'DYNAMIC',
      'COORDINATEEPOCH'
    ].includes(keyword) ||
    children.filter(child => child.keyword.toUpperCase() === 'AXIS').length > 2 ||
    (keyword === 'CS' && node.values.some(value => value.type === 'number' && value.value !== 2))
  )
    declineProjection(
      'unsupported-dimensions',
      'WKT contains unsupported dimensions or transformation metadata'
    );
  children.forEach(validateWKTDimensions);
}

/** Only use with the default engine or a caller-supplied matching normalization configuration. */
export function normalizeProjectionReferences(
  references: readonly ProjectionReference[],
  options: CRSNormalizationOptions = {}
): readonly NormalizedCRS[] {
  for (const reference of references) {
    let definition = reference.definition;
    const visited = new Set<string>();
    while (typeof definition === 'string' && options.aliases?.[definition]) {
      if (visited.has(definition)) declineProjection('invalid-definition', 'cyclic CRS alias');
      visited.add(definition);
      definition = options.aliases[definition];
    }
    validateProjectionDefinition(definition);
  }
  const normalized = references.map(reference =>
    normalizeCRS(reference.input, {
      parsers: [projJSONCRSParser, wktCRSParser],
      datumCatalogs: [datumCatalog],
      ...options,
      mode: 'strict'
    })
  );
  for (const frame of normalized) {
    if (frame.lossy || !['geographic', 'projected'].includes(frame.kind) || frame.axis[2] !== 'u')
      declineProjection(
        'unsupported-dimensions',
        'projection requires a lossless horizontal frame'
      );
    if (
      frame.parameters['geoidgrids'] ||
      frame.parameters['vunits'] ||
      frame.parameters['vto_meter']
    )
      declineProjection('unsupported-dimensions', 'vertical operations are not supported');
    if (
      frame.datum.grids?.some(grid => grid.name !== 'null') ||
      frame.datum.towgs84?.some(value => value !== 0)
    )
      declineProjection(
        'unsupported-datum',
        'grid and datum operations require a separate GPU contract'
      );
  }
  references.forEach((reference, index) => {
    const declared = reference.reference.coordinateFrame;
    if (declared !== 'unknown' && declared !== normalized[index].kind)
      declineProjection(
        'unsupported-coordinate-system',
        'stored frame conflicts with the normalized CRS'
      );
  });
  const [source, target] = normalized;
  if (
    source &&
    target &&
    (source.datum.ellipsoid.semiMajorAxis !== target.datum.ellipsoid.semiMajorAxis ||
      source.datum.ellipsoid.semiMinorAxis !== target.datum.ellipsoid.semiMinorAxis)
  )
    declineProjection(
      'datum-transformation-required',
      'different datum ellipsoids require an explicit transformation'
    );
  return normalized;
}

export function declineProjection(code: ProjectionPlanningReason['code'], message: string): never {
  throw new ProjectionPlanningError([{code, message}]);
}
