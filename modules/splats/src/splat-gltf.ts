// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {makeGPUSplatData, type GPUSplatData, type SplatSource} from './splat-data';
import {
  getSplatSphericalHarmonicCoefficientCount,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';

const SPHERICAL_HARMONIC_DC = 0.28209479177387814;
const GAUSSIAN_SPLATTING_EXTENSION = 'KHR_gaussian_splatting';
const GAUSSIAN_SPLATTING_SPZ_EXTENSION = 'KHR_gaussian_splatting_compression_spz_2';
const POSITION_ATTRIBUTE = 'POSITION';
const SCALE_ATTRIBUTE = `${GAUSSIAN_SPLATTING_EXTENSION}:SCALE`;
const ROTATION_ATTRIBUTE = `${GAUSSIAN_SPLATTING_EXTENSION}:ROTATION`;
const OPACITY_ATTRIBUTE = `${GAUSSIAN_SPLATTING_EXTENSION}:OPACITY`;
const ZERO_ORDER_ATTRIBUTE = `${GAUSSIAN_SPLATTING_EXTENSION}:SH_DEGREE_0_COEF_0`;

/** Decoded numeric accessor values supplied by a loader, without a glTF package dependency. */
export type GLTFSplatAttributeValues =
  | Float32Array
  | Float64Array
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

/** Structural decoded accessor understood across loaders and independent glTF implementations. */
export type GLTFSplatAttribute =
  | GLTFSplatAttributeValues
  | {
      /** Flattened accessor values after mesh compression and sparse accessors are resolved. */
      readonly value: GLTFSplatAttributeValues;
      /** Scalar components per row; glTF loaders may expose either spelling. */
      readonly size?: number;
      readonly components?: number;
      /** Original accessor row count when supplied by the loader. */
      readonly count?: number;
      /** Whether integer values represent normalized accessor components. */
      readonly normalized?: boolean;
    };

/** Loader-neutral primitive carrying already-decoded Khronos Gaussian-splat attributes. */
export type GLTFSplatPrimitive = {
  /** Khronos Gaussian splats require glTF POINTS mode. */
  readonly mode?: number;
  /** Decoded source accessors under their original, unmodified glTF semantic names. */
  readonly attributes: Readonly<Record<string, GLTFSplatAttribute | undefined>>;
  /** Source glTF extensions, including nested Gaussian compression metadata. */
  readonly extensions?: {
    readonly KHR_gaussian_splatting?: {
      readonly kernel: string;
      readonly colorSpace: string;
      readonly projection?: string;
      readonly sortingMethod?: string;
      readonly extensions?: Readonly<Record<string, unknown>>;
    };
    readonly EXT_mesh_features?: {
      readonly featureIds?: readonly {readonly attribute?: number}[];
    };
  };
};

/** Source identity, retained lighting bands, and semantic-feature selection for one primitive. */
export type MakeGPUSplatDataFromGLTFOptions = {
  /** Stable source batch index preserved for renderer and picking identity. */
  sourceBatchIndex?: number;
  /** Stable global source-row offset assigned to the first decoded primitive row. */
  rowIndexBase?: number;
  /** Highest fully authored higher-order spherical-harmonic band to retain. */
  maxSphericalHarmonicsDegree?: SplatSphericalHarmonicsDegree;
  /** Explicit glTF feature-ID attribute; defaults to the first EXT_mesh_features attribute. */
  featureIdAttribute?: string;
};

/** Caller-owned SPZ decoder kept outside the renderer and invoked only for compressed accessors. */
export type GLTFSplatCompressionDecoder = (
  primitive: GLTFSplatPrimitive,
  options: {compression: unknown; signal?: AbortSignal}
) => GLTFSplatPrimitive | Promise<GLTFSplatPrimitive>;

/** Optional asynchronous compression handoff for loader-owned SPZ v2 decoding. */
export type LoadGPUSplatDataFromGLTFOptions = MakeGPUSplatDataFromGLTFOptions & {
  /** Decodes nested KHR_gaussian_splatting_compression_spz_2 data outside this package. */
  decodeCompressedPrimitive?: GLTFSplatCompressionDecoder;
  /** Cancellation signal forwarded to the caller-owned compression decoder. */
  signal?: AbortSignal;
};

type ResolvedGLTFSplatAttribute = {
  values: GLTFSplatAttributeValues;
  componentCount: number;
  rowCount: number;
  normalized: boolean;
};

/** Identifies a glTF primitive declaring the Khronos Gaussian-splat extension. */
export function isGLTFSplatPrimitive(primitive: GLTFSplatPrimitive): boolean {
  return primitive.extensions?.KHR_gaussian_splatting !== undefined;
}

/**
 * Converts one decoded KHR_gaussian_splatting primitive into framework-independent source columns.
 *
 * Positions and compatible linear Float32 attributes retain their original typed-array identities.
 * glTF XYZW rotations are converted to the renderer's WXYZ convention, and complete SH bands keep
 * the Khronos degree/basis/RGB order without Arrow, loaders.gl, or glTF package dependencies.
 */
export function makeSplatSourceFromGLTF(
  primitive: GLTFSplatPrimitive,
  options: MakeGPUSplatDataFromGLTFOptions = {}
): SplatSource {
  const extension = primitive.extensions?.KHR_gaussian_splatting;
  if (
    !extension ||
    primitive.mode !== 0 ||
    extension.kernel !== 'ellipse' ||
    (extension.projection !== undefined && extension.projection !== 'perspective') ||
    (extension.sortingMethod !== undefined && extension.sortingMethod !== 'cameraDistance') ||
    (extension.colorSpace !== 'lin_rec709_display' &&
      extension.colorSpace !== 'srgb_rec709_display')
  ) {
    throw new Error('Unsupported glTF Gaussian splat primitive');
  }

  const positions = resolveGLTFSplatAttribute(primitive, POSITION_ATTRIBUTE, 3);
  const rowCount = positions.rowCount;
  const scales = resolveGLTFSplatAttribute(primitive, SCALE_ATTRIBUTE, 3, rowCount);
  const rotations = resolveGLTFSplatAttribute(primitive, ROTATION_ATTRIBUTE, 4, rowCount);
  const opacities = resolveGLTFSplatAttribute(primitive, OPACITY_ATTRIBUTE, 1, rowCount);
  const zeroOrder = resolveGLTFSplatAttribute(primitive, ZERO_ORDER_ATTRIBUTE, 3, rowCount);
  const decodedRotations = new Float32Array(rowCount * 4);
  const colors = new Float32Array(rowCount * 4);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rotationOffset = rowIndex * 4;
    decodedRotations[rotationOffset] = getGLTFSplatAttributeValue(rotations, rotationOffset + 3);
    decodedRotations[rotationOffset + 1] = getGLTFSplatAttributeValue(rotations, rotationOffset);
    decodedRotations[rotationOffset + 2] = getGLTFSplatAttributeValue(
      rotations,
      rotationOffset + 1
    );
    decodedRotations[rotationOffset + 3] = getGLTFSplatAttributeValue(
      rotations,
      rotationOffset + 2
    );

    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      const radiance =
        0.5 +
        getGLTFSplatAttributeValue(zeroOrder, rowIndex * 3 + componentIndex) *
          SPHERICAL_HARMONIC_DC;
      colors[rotationOffset + componentIndex] =
        extension.colorSpace === 'srgb_rec709_display'
          ? convertSrgbSplatRadianceToLinear(radiance)
          : radiance;
    }
    colors[rotationOffset + 3] = 1;
  }

  const source: SplatSource = {
    positions: makeFloat32GLTFSplatAttribute(positions),
    scales: makeFloat32GLTFSplatAttribute(scales),
    rotations: decodedRotations,
    colors,
    opacities: makeFloat32GLTFSplatAttribute(opacities),
    ...(options.sourceBatchIndex !== undefined ? {sourceBatchIndex: options.sourceBatchIndex} : {}),
    ...(options.rowIndexBase !== undefined ? {rowIndexBase: options.rowIndexBase} : {})
  };

  const declaredFeatureId = primitive.extensions?.EXT_mesh_features?.featureIds?.find(
    featureId => featureId.attribute !== undefined
  );
  const featureIdAttribute =
    options.featureIdAttribute ?? `_FEATURE_ID_${declaredFeatureId?.attribute ?? 0}`;
  if (
    (options.featureIdAttribute !== undefined || declaredFeatureId !== undefined) &&
    !primitive.attributes[featureIdAttribute]
  ) {
    throw new Error('Missing declared glTF Gaussian splat feature-ID attribute');
  }
  if (primitive.attributes[featureIdAttribute]) {
    const featureIds = resolveGLTFSplatAttribute(primitive, featureIdAttribute, 1, rowCount);
    if (
      featureIds.normalized ||
      !(
        featureIds.values instanceof Uint8Array ||
        featureIds.values instanceof Uint16Array ||
        featureIds.values instanceof Uint32Array
      )
    ) {
      throw new Error('glTF Gaussian splat feature IDs must be unsigned integers');
    }
    source.semanticIds =
      featureIds.values instanceof Uint32Array && !featureIds.normalized
        ? featureIds.values
        : Uint32Array.from(featureIds.values, value => value);
  }

  const {degree, coefficients} = getGLTFSplatSphericalHarmonics(
    primitive,
    rowCount,
    options.maxSphericalHarmonicsDegree ?? 3
  );
  if (coefficients) {
    source.sphericalHarmonics = coefficients;
    source.sphericalHarmonicsDegree = degree;
  }

  return source;
}

/** Uploads one already-decoded glTF Gaussian primitive as independently caller-owned GPU data. */
export function makeGPUSplatDataFromGLTF(
  device: Device,
  primitive: GLTFSplatPrimitive,
  options: MakeGPUSplatDataFromGLTFOptions = {}
): GPUSplatData {
  return makeGPUSplatData(device, makeSplatSourceFromGLTF(primitive, options));
}

/**
 * Hands compressed SPZ v2 payloads to a caller-owned decoder before preparing one GPU batch.
 *
 * Already-decoded primitives never invoke the decoder, including sources that retain their
 * compression extension as metadata. Compression libraries, workers, and network access remain
 * entirely outside @luma.gl/splats.
 */
export async function loadGPUSplatDataFromGLTF(
  device: Device,
  primitive: GLTFSplatPrimitive,
  options: LoadGPUSplatDataFromGLTFOptions = {}
): Promise<GPUSplatData> {
  options.signal?.throwIfAborted();
  const compression =
    primitive.extensions?.KHR_gaussian_splatting?.extensions?.[GAUSSIAN_SPLATTING_SPZ_EXTENSION];
  const needsDecoding =
    compression !== undefined &&
    [
      POSITION_ATTRIBUTE,
      SCALE_ATTRIBUTE,
      ROTATION_ATTRIBUTE,
      OPACITY_ATTRIBUTE,
      ZERO_ORDER_ATTRIBUTE
    ].some(attributeName => !primitive.attributes[attributeName]);

  if (needsDecoding && !options.decodeCompressedPrimitive) {
    throw new Error('Compressed glTF Gaussian splats require an SPZ decoder');
  }

  const decodedPrimitive =
    needsDecoding && options.decodeCompressedPrimitive
      ? await options.decodeCompressedPrimitive(primitive, {
          compression,
          ...(options.signal ? {signal: options.signal} : {})
        })
      : primitive;
  options.signal?.throwIfAborted();
  return makeGPUSplatDataFromGLTF(device, decodedPrimitive, options);
}

function resolveGLTFSplatAttribute(
  primitive: GLTFSplatPrimitive,
  attributeName: string,
  componentCount: number,
  expectedRowCount?: number
): ResolvedGLTFSplatAttribute {
  const attribute = primitive.attributes[attributeName];
  if (!attribute) {
    throw new Error('Missing decoded glTF Gaussian splat attribute');
  }

  const values = ArrayBuffer.isView(attribute) ? attribute : attribute.value;
  const declaredComponentCount = ArrayBuffer.isView(attribute)
    ? componentCount
    : (attribute.size ?? attribute.components ?? componentCount);
  const rowCount = values.length / componentCount;
  const declaredRowCount = ArrayBuffer.isView(attribute) ? rowCount : (attribute.count ?? rowCount);
  if (
    declaredComponentCount !== componentCount ||
    !Number.isInteger(rowCount) ||
    declaredRowCount !== rowCount ||
    (expectedRowCount !== undefined && rowCount !== expectedRowCount)
  ) {
    throw new Error('glTF Gaussian splat attributes must contain matching rows');
  }

  return {
    values,
    componentCount,
    rowCount,
    normalized: !ArrayBuffer.isView(attribute) && Boolean(attribute.normalized)
  };
}

function makeFloat32GLTFSplatAttribute(attribute: ResolvedGLTFSplatAttribute): Float32Array {
  if (attribute.values instanceof Float32Array && !attribute.normalized) {
    return attribute.values;
  }
  return Float32Array.from(attribute.values, (_, index) =>
    getGLTFSplatAttributeValue(attribute, index)
  );
}

function getGLTFSplatAttributeValue(attribute: ResolvedGLTFSplatAttribute, index: number): number {
  const value = attribute.values[index];
  if (!attribute.normalized) {
    return value;
  }
  if (attribute.values instanceof Int8Array) {
    return Math.max(value / 127, -1);
  }
  if (attribute.values instanceof Int16Array) {
    return Math.max(value / 32767, -1);
  }
  if (attribute.values instanceof Uint8Array) {
    return value / 255;
  }
  if (attribute.values instanceof Uint16Array) {
    return value / 65535;
  }
  return value;
}

function getGLTFSplatSphericalHarmonics(
  primitive: GLTFSplatPrimitive,
  rowCount: number,
  maximumDegree: SplatSphericalHarmonicsDegree
): {degree: SplatSphericalHarmonicsDegree; coefficients?: Float32Array} {
  const attributes: ResolvedGLTFSplatAttribute[] = [];
  let degree: SplatSphericalHarmonicsDegree = 0;
  for (const candidateDegree of [1, 2, 3] as const) {
    const coefficientCount = candidateDegree * 2 + 1;
    const degreeAttributes: ResolvedGLTFSplatAttribute[] = [];
    for (let coefficientIndex = 0; coefficientIndex < coefficientCount; coefficientIndex++) {
      const attributeName = `${GAUSSIAN_SPLATTING_EXTENSION}:SH_DEGREE_${candidateDegree}_COEF_${coefficientIndex}`;
      if (primitive.attributes[attributeName]) {
        degreeAttributes.push(resolveGLTFSplatAttribute(primitive, attributeName, 3, rowCount));
      }
    }
    if (degreeAttributes.length !== 0 && degreeAttributes.length !== coefficientCount) {
      throw new Error('glTF Gaussian spherical-harmonic bands must be complete');
    }
    if (degreeAttributes.length === 0) {
      const hasHigherDegree = [2, 3].some(
        higherDegree =>
          higherDegree > candidateDegree &&
          primitive.attributes[`${GAUSSIAN_SPLATTING_EXTENSION}:SH_DEGREE_${higherDegree}_COEF_0`]
      );
      if (hasHigherDegree) {
        throw new Error('glTF Gaussian spherical-harmonic bands must be consecutive');
      }
      break;
    }
    if (candidateDegree <= maximumDegree) {
      attributes.push(...degreeAttributes);
      degree = candidateDegree;
    }
  }

  if (degree === 0) {
    return {degree};
  }

  const rowStride = getSplatSphericalHarmonicCoefficientCount(degree);
  const coefficients = new Float32Array(rowCount * rowStride);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    for (let coefficientIndex = 0; coefficientIndex < attributes.length; coefficientIndex++) {
      const attribute = attributes[coefficientIndex];
      for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
        coefficients[rowIndex * rowStride + coefficientIndex * 3 + componentIndex] =
          getGLTFSplatAttributeValue(attribute, rowIndex * 3 + componentIndex);
      }
    }
  }
  return {degree, coefficients};
}

function convertSrgbSplatRadianceToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return ((value + 0.055) / 1.055) ** 2.4;
}
