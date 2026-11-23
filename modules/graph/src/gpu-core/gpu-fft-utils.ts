// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Smallest bounded radix-2 transform length shared by GPU FFT primitives. */
export const GPU_FFT_MIN_LENGTH = 2;
/** Largest bounded radix-2 transform length shared by GPU FFT primitives. */
export const GPU_FFT_MAX_LENGTH = 2048;

/** Transform sign and normalization convention shared by GPU FFT primitives. */
export type GPUFFTDirection = 'forward' | 'inverse';

/** One immutable radix-2 FFT pass. @internal */
export type GPUFFTPassPlan = {
  kind: 'bit-reversal' | 'butterfly';
  stage: number;
};

/** Shared WGSL helpers used by one- and two-dimensional FFT kernels. @internal */
export const GPU_FFT_COMMON_SHADER_SOURCE = /* wgsl */ `
const GPU_FFT_PI: f32 = 3.14159265358979323846;

fn reverseLowBits(value: u32, bitCount: u32) -> u32 {
  var source = value;
  var reversed = 0u;
  for (var bitIndex = 0u; bitIndex < bitCount; bitIndex++) {
    reversed = (reversed << 1u) | (source & 1u);
    source = source >> 1u;
  }
  return reversed;
}

fn multiplyComplex(left: vec2f, right: vec2f) -> vec2f {
  return vec2f(
    left.x * right.x - left.y * right.y,
    left.x * right.y + left.y * right.x
  );
}
`;

/** Returns a bit-reversal pass followed by every radix-2 butterfly stage. @internal */
export function makeGPUFFTPassPlan(length: number): GPUFFTPassPlan[] {
  const stageCount = Math.log2(length);
  return [
    {kind: 'bit-reversal', stage: stageCount},
    ...Array.from({length: stageCount}, (_, stageIndex) => ({
      kind: 'butterfly' as const,
      stage: stageIndex + 1
    }))
  ];
}

/** Returns a stable validation reason for one bounded radix-2 dimension. @internal */
export function getGPUFFTLengthReason(
  operationName: string,
  dimensionName: string,
  length: number
): string | undefined {
  if (!Number.isInteger(length)) {
    return `${operationName} ${dimensionName} must be an integer.`;
  }
  if (length < GPU_FFT_MIN_LENGTH || length > GPU_FFT_MAX_LENGTH) {
    return `${operationName} ${dimensionName} must be from ${GPU_FFT_MIN_LENGTH} through ${GPU_FFT_MAX_LENGTH}.`;
  }
  if ((length & (length - 1)) !== 0) {
    return `${operationName} ${dimensionName} must be a power of two.`;
  }
  return undefined;
}
