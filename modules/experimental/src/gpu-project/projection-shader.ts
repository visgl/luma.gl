// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {GEOSPATIAL_WORKGROUP_SIZE, RAW_POINT_WGSL} from '../geospatial/geospatial-utils';
import {PROJECTION_PATCH_WORD_LENGTH} from './projection-plan';

export function getProjectionShaderSource(options: {
  precise: boolean;
  doubleSingle: boolean;
  inputDeclaration: string;
  readPosition: string;
  elementCount: number;
  patchCount: number;
  outputOffset: number;
  planOffset: number;
  patchIdOffset?: number;
  validityOffset?: number;
  invocationIndexSource: string;
}): string {
  const {doubleSingle, patchIdOffset, validityOffset} = options;
  return `
${options.inputDeclaration}
${getProjectionShaderFunctions(options)}
@group(0) @binding(auto) var<storage, read_write> outputPositions: array<${doubleSingle ? 'vec4f' : 'vec2f'}>;
${patchIdOffset === undefined ? '' : '@group(0) @binding(auto) var<storage, read> projectionPatchIds: array<u32>;'}
${validityOffset === undefined ? '' : '@group(0) @binding(auto) var<storage, read_write> projectionValidity: array<u32>;'}
@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_id) localId: vec3u) {
  ${options.invocationIndexSource}
  if (index >= ${options.elementCount}u) { return; }
  ${
    patchIdOffset === undefined
      ? ''
      : `if (projectionPatchIds[${patchIdOffset}u + index] >= PATCH_COUNT) {
    outputPositions[${options.outputOffset}u + index] = ${doubleSingle ? 'vec4f(0.0)' : 'vec2f(0.0)'};
    ${validityOffset === undefined ? '' : `projectionValidity[${validityOffset}u + index] = 0u;`}
    return;
  }`
  }
  let result = project(${options.readPosition}, ${patchIdOffset === undefined ? 'INVALID_PATCH' : `projectionPatchIds[${patchIdOffset}u + index]`});
  outputPositions[${options.outputOffset}u + index] = result.position;
  ${validityOffset === undefined ? '' : `projectionValidity[${validityOffset}u + index] = result.valid;`}
}`;
}

/** Shared evaluator used by the legacy contributor and statically composed programs. @internal */
export function getProjectionShaderFunctions(options: {
  precise: boolean;
  doubleSingle: boolean;
  patchCount: number;
  planOffset: number;
  doubleSingleInput?: boolean;
  inputBoundsOffset?: number;
}): string {
  const {precise, doubleSingle, patchCount, planOffset, doubleSingleInput, inputBoundsOffset} =
    options;
  const positionType = precise ? 'RawPoint' : doubleSingleInput ? 'vec4f' : 'vec2f';
  const sourceOffset = doubleSingleInput
    ? `let offset = projectionSourceOffsetFP64(position, patchIndex);
  return vec2f(offset.x.x + offset.x.y, offset.y.x + offset.y.y);`
    : precise
      ? `let originX = vec2u(projectionPlanWord(patchIndex, 1u), projectionPlanWord(patchIndex, 0u));
  let originY = vec2u(projectionPlanWord(patchIndex, 3u), projectionPlanWord(patchIndex, 2u));
  return vec2f(
    sub_fp64u32_to_f32(position.x, originX),
    sub_fp64u32_to_f32(position.y, originY)
  );`
      : `let sourceOriginHigh = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 13u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 14u))
  );
  let sourceOriginLow = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 10u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 11u))
  );
  // Route the rounded high-limb subtraction through an opaque runtime-zero integer operation.
  // Metal otherwise reassociates these subtractions and silently drops the low origin limb.
  let highOffsetBits = bitcast<vec2u>(position - sourceOriginHigh) ^
    vec2u(projectionPlanWord(patchIndex, 15u));
  let highOffset = bitcast<vec2f>(highOffsetBits);
  return highOffset - sourceOriginLow;`;
  const finitePosition = doubleSingleInput
    ? 'is_finite_fp64(position.xy) && is_finite_fp64(position.zw)'
    : precise
      ? 'rawPointIsFinite(position)'
      : `all((bitcast<vec2u>(position) & vec2u(0x7f800000u)) != vec2u(0x7f800000u))`;
  const planContains = doubleSingleInput
    ? `return compare_fp64(position.xy, projectionInputBound(0u)) >= 0 &&
    compare_fp64(position.zw, projectionInputBound(1u)) >= 0 &&
    compare_fp64(position.xy, projectionInputBound(2u)) <= 0 &&
    compare_fp64(position.zw, projectionInputBound(3u)) <= 0;`
    : precise
      ? `let minimumX = projectionPlanRawBound(0u);
  let minimumY = projectionPlanRawBound(1u);
  let maximumX = projectionPlanRawBound(2u);
  let maximumY = projectionPlanRawBound(3u);
  return compareFiniteBinary64(position.x, minimumX) >= 0 &&
    compareFiniteBinary64(position.y, minimumY) >= 0 &&
    compareFiniteBinary64(position.x, maximumX) <= 0 &&
    compareFiniteBinary64(position.y, maximumY) <= 0;`
      : `let minimum = vec2f(
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 8u]),
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 9u])
  );
  let maximum = vec2f(
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 10u]),
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 11u])
  );
  return all(position >= minimum) && all(position <= maximum);`;
  const precisePlanBoundsFunctions = precise
    ? `fn projectionPlanRawBound(boundIndex: u32) -> vec2u {
  let wordOffset = PLAN_BOUNDS_OFFSET + boundIndex * 2u;
  return vec2u(
    projectionPlans[wordOffset + 1u],
    projectionPlans[wordOffset]
  );
}

fn compareFiniteBinary64(firstBits: vec2u, secondBits: vec2u) -> i32 {
  let first = fp64_decode_bits(firstBits);
  let second = fp64_decode_bits(secondBits);
  if (first.isZero && second.isZero) {
    return 0;
  }
  if (first.sign != second.sign) {
    return select(1, -1, first.sign == 1u);
  }
  let magnitudeComparison = fp64_finite_magnitude_compare(first, second);
  return select(magnitudeComparison, -magnitudeComparison, first.sign == 1u);
}`
    : '';
  const doubleSingleSourceOffset = doubleSingleInput
    ? `return ProjectionPointFP64(
    sub_fp64(position.xy, vec2f(
      bitcast<f32>(projectionPlanWord(patchIndex, 13u)),
      bitcast<f32>(projectionPlanWord(patchIndex, 10u))
    )),
    sub_fp64(position.zw, vec2f(
      bitcast<f32>(projectionPlanWord(patchIndex, 14u)),
      bitcast<f32>(projectionPlanWord(patchIndex, 11u))
    ))
  );`
    : precise
      ? `let originX = vec2u(projectionPlanWord(patchIndex, 1u), projectionPlanWord(patchIndex, 0u));
  let originY = vec2u(projectionPlanWord(patchIndex, 3u), projectionPlanWord(patchIndex, 2u));
  return ProjectionPointFP64(
    sub_fp64u32_to_fp64(position.x, originX),
    sub_fp64u32_to_fp64(position.y, originY)
  );`
      : `let sourceOriginX = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 13u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 10u))
  );
  let sourceOriginY = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 14u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 11u))
  );
  return ProjectionPointFP64(
    sub_fp64(vec2f(position.x, 0.0), sourceOriginX),
    sub_fp64(vec2f(position.y, 0.0), sourceOriginY)
  );`;
  const doubleSingleFunctions = doubleSingle
    ? `struct ProjectionPointFP64 { x: vec2f, y: vec2f }

fn projectionSourceOffsetFP64(
  position: ${positionType},
  patchIndex: u32
) -> ProjectionPointFP64 {
  ${doubleSingleSourceOffset}
}

fn normalizeProjectionPositionFP64(
  position: ${positionType},
  patchIndex: u32
) -> ProjectionPointFP64 {
  let sourceOffset = projectionSourceOffsetFP64(position, patchIndex);
  let sourceScaleX = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 4u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 60u))
  );
  let sourceScaleY = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 5u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 61u))
  );
  return ProjectionPointFP64(
    div_fp64(sourceOffset.x, sourceScaleX),
    div_fp64(sourceOffset.y, sourceScaleY)
  );
}

fn projectionCoefficientFP64(
  patchIndex: u32,
  highOffset: u32,
  lowOffset: u32,
  coefficientIndex: u32
) -> vec2f {
  return vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, highOffset + coefficientIndex)),
    bitcast<f32>(projectionPlanWord(patchIndex, lowOffset + coefficientIndex))
  );
}

fn projectionMultiplyAddFP64(multiplier: vec2f, multiplicand: vec2f, addend: vec2f) -> vec2f {
  return sum_fp64(addend, mul_fp64(multiplier, multiplicand));
}

fn evaluateProjectionPolynomialFP64(
  patchIndex: u32,
  highOffset: u32,
  lowOffset: u32,
  normalized: ProjectionPointFP64
) -> vec2f {
  let coefficient0 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 0u);
  let coefficient1 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 1u);
  let coefficient2 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 2u);
  let coefficient3 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 3u);
  let coefficient4 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 4u);
  let coefficient5 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 5u);
  let coefficient6 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 6u);
  let coefficient7 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 7u);
  let coefficient8 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 8u);
  let coefficient9 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 9u);

  let xQuadratic = projectionMultiplyAddFP64(normalized.x, coefficient6, coefficient3);
  let xLinear = projectionMultiplyAddFP64(normalized.x, xQuadratic, coefficient1);
  let mixedLinear = projectionMultiplyAddFP64(normalized.x, coefficient7, coefficient4);
  let yQuadraticX = projectionMultiplyAddFP64(normalized.x, coefficient8, coefficient5);
  let yQuadratic = projectionMultiplyAddFP64(normalized.y, coefficient9, yQuadraticX);
  let yLinearX = projectionMultiplyAddFP64(normalized.x, mixedLinear, coefficient2);
  let yLinear = projectionMultiplyAddFP64(normalized.y, yQuadratic, yLinearX);
  let xContribution = projectionMultiplyAddFP64(normalized.x, xLinear, coefficient0);
  return projectionMultiplyAddFP64(normalized.y, yLinear, xContribution);
}

fn projectionDestinationOriginFP64(patchIndex: u32, wordOffset: u32) -> vec2f {
  let value = vec2u(
    projectionPlanWord(patchIndex, wordOffset + 1u),
    projectionPlanWord(patchIndex, wordOffset)
  );
  return sub_fp64u32_to_fp64(value, vec2u(0u));
}`
    : '';
  const writeResult = doubleSingle
    ? `let normalizedFP64 = normalizeProjectionPositionFP64(position, patchIndex);
  let projectedX = sum_fp64(
    projectionDestinationOriginFP64(patchIndex, 16u),
    evaluateProjectionPolynomialFP64(patchIndex, 20u, 40u, normalizedFP64)
  );
  let projectedY = sum_fp64(
    projectionDestinationOriginFP64(patchIndex, 18u),
    evaluateProjectionPolynomialFP64(patchIndex, 30u, 50u, normalizedFP64)
  );
  let projected = vec4f(
    projectedX.x,
    projectedX.y,
    projectedY.x,
    projectedY.y
  );`
    : `let normalized = normalizeProjectionPosition(position, patchIndex);
  let destinationOffset = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 6u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 7u))
  );
  let projected = destinationOffset + vec2f(
    evaluateProjectionPolynomial(patchIndex, 20u, normalized),
    evaluateProjectionPolynomial(patchIndex, 30u, normalized)
  );`;

  return /* wgsl */ `
${precise ? RAW_POINT_WGSL : ''}
const PATCH_COUNT: u32 = ${patchCount}u;
const PATCH_WORD_LENGTH: u32 = ${PROJECTION_PATCH_WORD_LENGTH}u;
const PLAN_OFFSET: u32 = ${planOffset}u;
const PLAN_BOUNDS_OFFSET: u32 = PLAN_OFFSET + PATCH_COUNT * PATCH_WORD_LENGTH;
const INVALID_PATCH: u32 = 0xffffffffu;

@group(0) @binding(auto) var<storage, read> projectionPlans: array<u32>;
struct ProjectionResult { position: ${doubleSingle ? 'vec4f' : 'vec2f'}, valid: u32 }
${
  doubleSingleInput
    ? `fn projectionInputBound(boundIndex: u32) -> vec2f {
  let offset = ${inputBoundsOffset}u + boundIndex * 2u;
  return vec2f(bitcast<f32>(projectionPlans[offset]), bitcast<f32>(projectionPlans[offset + 1u]));
}`
    : ''
}

fn projectionPlanWord(patchIndex: u32, wordIndex: u32) -> u32 {
  return projectionPlans[PLAN_OFFSET + patchIndex * PATCH_WORD_LENGTH + wordIndex];
}

${precisePlanBoundsFunctions}

fn projectionPlanContains(position: ${positionType}) -> bool {
  ${planContains}
}

fn projectionSourceOffset(position: ${positionType}, patchIndex: u32) -> vec2f {
  ${sourceOffset}
}

fn normalizeProjectionPosition(position: ${positionType}, patchIndex: u32) -> vec2f {
  let sourceScale = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 4u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 5u))
  );
  return projectionSourceOffset(position, patchIndex) / sourceScale;
}

fn projectionPatchContains(position: ${positionType}, patchIndex: u32) -> bool {
  let normalized = normalizeProjectionPosition(position, patchIndex);
  let minimum = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 8u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 9u))
  );
  // Source scales are half-extents, so the opposite boundary is exactly two normalized units
  // away. Two float32 ULPs keep legitimate binary64 endpoints from falling through a seam.
  let maximum = minimum + vec2f(2.0);
  let boundaryTolerance = vec2f(2.384185791015625e-7);
  return all(normalized >= minimum - boundaryTolerance) &&
    all(normalized <= maximum + boundaryTolerance);
}

fn findProjectionPatch(position: ${positionType}) -> u32 {
  for (var patchIndex: u32 = 0u; patchIndex < PATCH_COUNT; patchIndex += 1u) {
    if (projectionPatchContains(position, patchIndex)) {
      return patchIndex;
    }
  }
  return INVALID_PATCH;
}

fn evaluateProjectionPolynomial(
  patchIndex: u32,
  coefficientOffset: u32,
  normalized: vec2f
) -> f32 {
  // Lower-degree records are zero-padded, so one branch-free Horner expression handles every
  // supported degree without dynamically indexed temporary arrays or nested shader loops.
  let coefficient0 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 0u));
  let coefficient1 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 1u));
  let coefficient2 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 2u));
  let coefficient3 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 3u));
  let coefficient4 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 4u));
  let coefficient5 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 5u));
  let coefficient6 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 6u));
  let coefficient7 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 7u));
  let coefficient8 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 8u));
  let coefficient9 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 9u));

  let xQuadratic = coefficient3 + normalized.x * coefficient6;
  let xLinear = coefficient1 + normalized.x * xQuadratic;
  let mixedLinear = coefficient4 + normalized.x * coefficient7;
  let yQuadraticX = coefficient5 + normalized.x * coefficient8;
  let yQuadratic = yQuadraticX + normalized.y * coefficient9;
  let yLinearX = coefficient2 + normalized.x * mixedLinear;
  let yLinear = yLinearX + normalized.y * yQuadratic;
  let xContribution = coefficient0 + normalized.x * xLinear;
  return xContribution + normalized.y * yLinear;
}

${doubleSingleFunctions}

fn project(position: ${positionType}, assignedPatch: u32) -> ProjectionResult {
  let invalid = ProjectionResult(${doubleSingle ? 'vec4f(0.0)' : 'vec2f(0.0)'}, 0u);
  if (!(${finitePosition}) || !projectionPlanContains(position)) { return invalid; }
  var patchIndex = assignedPatch;
  if (patchIndex == INVALID_PATCH) { patchIndex = findProjectionPatch(position); }
  if (patchIndex >= PATCH_COUNT || !projectionPatchContains(position, patchIndex)) {
    return invalid;
  }
  ${writeResult}
  if (!all((bitcast<${doubleSingle ? 'vec4u' : 'vec2u'}>(projected) &
    ${doubleSingle ? 'vec4u' : 'vec2u'}(0x7f800000u)) != ${doubleSingle ? 'vec4u' : 'vec2u'}(0x7f800000u))) {
    return invalid;
  }
  return ProjectionResult(projected, 1u);
}`;
}
