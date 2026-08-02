// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

const GPU_FFT2D_PI: f32 = 3.14159265358979323846;

fn reverseLowBits(value: u32, bitCount: u32) -> u32 {
  var source = value;
  var reversed = 0u;
  for (var bitIndex = 0u; bitIndex < bitCount; bitIndex++) {
    reversed = (reversed << 1u) | (source & 1u);
    source = source >> 1u;
  }
  return reversed;
}

fn getLinearIndex(xCoordinate: u32, yCoordinate: u32) -> u32 {
  return yCoordinate * parameters.width + xCoordinate;
}

fn multiplyComplex(left: vec2f, right: vec2f) -> vec2f {
  return vec2f(
    left.x * right.x - left.y * right.y,
    left.x * right.y + left.y * right.x
  );
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
    let firstValue = inputValues[getLinearIndex(firstX, firstY)];
    let secondValue = inputValues[getLinearIndex(secondX, secondY)];
    let angle = parameters.directionSign * 2.0 * GPU_FFT2D_PI *
      f32(twiddleIndex) / f32(butterflySpan);
    let twiddle = vec2f(cos(angle), sin(angle));
    let rotatedSecondValue = multiplyComplex(secondValue, twiddle);
    let butterflyValue = select(
      firstValue + rotatedSecondValue,
      firstValue - rotatedSecondValue,
      butterflyOffset >= butterflyHalfSpan
    );
    outputValues[getLinearIndex(globalIdentifier.x, globalIdentifier.y)] =
      butterflyValue * parameters.normalizationScale;
    return;
  }

  let sourceX = select(globalIdentifier.x, sourceCoordinate, horizontal);
  let sourceY = select(sourceCoordinate, globalIdentifier.y, horizontal);
  outputValues[getLinearIndex(globalIdentifier.x, globalIdentifier.y)] =
    inputValues[getLinearIndex(sourceX, sourceY)] * parameters.normalizationScale;
}
`;
