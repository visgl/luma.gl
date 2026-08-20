// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPU_FFT_COMMON_SHADER_SOURCE} from './gpu-fft-utils';

/** Number of invocations along each dimension of one GPUFFT2D workgroup. */
export const GPU_FFT2D_WORKGROUP_DIMENSION = 8;

/** Byte length of the uniform block consumed by every GPUFFT2D pass. */
export const GPU_FFT2D_PARAMETER_BYTE_LENGTH = 32;

/** Shared bit-reversal and butterfly kernel used by every GPUFFT2D pass. */
export const GPU_FFT2D_SHADER = /* wgsl */ `\
struct GPUFFT2DParameters {
  width: u32,
  height: u32,
  axis: u32,
  passKind: u32,
  transformSize: u32,
  stage: u32,
  directionSign: f32,
  normalizationScale: f32,
};

@group(0) @binding(0) var<storage, read> inputValues: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<vec2f>;
@group(0) @binding(2) var<uniform> parameters: GPUFFT2DParameters;

${GPU_FFT_COMMON_SHADER_SOURCE}

fn getLinearIndex(xCoordinate: u32, yCoordinate: u32, batchIndex: u32) -> u32 {
  return batchIndex * parameters.width * parameters.height +
    yCoordinate * parameters.width + xCoordinate;
}

@compute @workgroup_size(${GPU_FFT2D_WORKGROUP_DIMENSION}, ${GPU_FFT2D_WORKGROUP_DIMENSION}, 1)
fn main(@builtin(global_invocation_id) globalIdentifier: vec3u) {
  if (globalIdentifier.x >= parameters.width || globalIdentifier.y >= parameters.height) {
    return;
  }

  let horizontal = parameters.axis == 0u;
  let coordinate = select(globalIdentifier.y, globalIdentifier.x, horizontal);
  var sourceCoordinate = coordinate;

  if (parameters.passKind == 0u) {
    sourceCoordinate = reverseLowBits(coordinate, parameters.stage);
  } else {
    let butterflySpan = 1u << parameters.stage;
    let butterflyHalfSpan = butterflySpan >> 1u;
    let butterflyOffset = coordinate & (butterflySpan - 1u);
    let twiddleIndex = butterflyOffset & (butterflyHalfSpan - 1u);
    let butterflyStart = coordinate - butterflyOffset;
    let firstCoordinate = butterflyStart + twiddleIndex;
    let secondCoordinate = firstCoordinate + butterflyHalfSpan;

    let firstX = select(globalIdentifier.x, firstCoordinate, horizontal);
    let firstY = select(firstCoordinate, globalIdentifier.y, horizontal);
    let secondX = select(globalIdentifier.x, secondCoordinate, horizontal);
    let secondY = select(secondCoordinate, globalIdentifier.y, horizontal);
    let firstValue = inputValues[getLinearIndex(firstX, firstY, globalIdentifier.z)];
    let secondValue = inputValues[getLinearIndex(secondX, secondY, globalIdentifier.z)];
    let angle = parameters.directionSign * 2.0 * GPU_FFT_PI *
      f32(twiddleIndex) / f32(butterflySpan);
    let twiddle = vec2f(cos(angle), sin(angle));
    let rotatedSecondValue = multiplyComplex(secondValue, twiddle);
    let butterflyValue = select(
      firstValue + rotatedSecondValue,
      firstValue - rotatedSecondValue,
      butterflyOffset >= butterflyHalfSpan
    );
    outputValues[getLinearIndex(globalIdentifier.x, globalIdentifier.y, globalIdentifier.z)] =
      butterflyValue * parameters.normalizationScale;
    return;
  }

  let sourceX = select(globalIdentifier.x, sourceCoordinate, horizontal);
  let sourceY = select(sourceCoordinate, globalIdentifier.y, horizontal);
  outputValues[getLinearIndex(globalIdentifier.x, globalIdentifier.y, globalIdentifier.z)] =
    inputValues[getLinearIndex(sourceX, sourceY, globalIdentifier.z)] *
      parameters.normalizationScale;
}
`;
