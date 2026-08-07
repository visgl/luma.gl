// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const FFT_BLOOM_WORKGROUP_DIMENSION = 8;
export const FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE = 64;
export const FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW = 1024;
export const FFT_BLOOM_PARAMETER_BYTE_LENGTH = 32;

export const FFT_BLOOM_EXTRACT_SHADER = /* wgsl */ `
struct FFTBloomParameters {
  sourceDimensions: vec2u,
  transformDimensions: vec2u,
  threshold: f32,
  intensity: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(0) var<uniform> parameters: FFTBloomParameters;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<storage, read_write> redChannel: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> greenChannel: array<vec2f>;
@group(0) @binding(4) var<storage, read_write> blueChannel: array<vec2f>;

@compute @workgroup_size(${FFT_BLOOM_WORKGROUP_DIMENSION}, ${FFT_BLOOM_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalInvocation: vec3u) {
  let coordinate = globalInvocation.xy;
  if (any(coordinate >= parameters.transformDimensions)) {
    return;
  }

  let sourceCoordinate = min(
    vec2u((vec2f(coordinate) + vec2f(0.5)) * vec2f(parameters.sourceDimensions) /
      vec2f(parameters.transformDimensions)),
    parameters.sourceDimensions - vec2u(1)
  );
  let sourceColor = textureLoad(sourceTexture, vec2i(sourceCoordinate), 0).rgb;
  let luminance = dot(sourceColor, vec3f(0.2126, 0.7152, 0.0722));
  let exposure = max(parameters.exposure * exp2(parameters.exposureCompensation), 0.0001);
  let threshold = parameters.threshold / exposure;
  let contribution = max(luminance - threshold, 0.0) / max(luminance, 0.00001);
  let index = coordinate.y * parameters.transformDimensions.x + coordinate.x;
  redChannel[index] = vec2f(sourceColor.r * contribution, 0.0);
  greenChannel[index] = vec2f(sourceColor.g * contribution, 0.0);
  blueChannel[index] = vec2f(sourceColor.b * contribution, 0.0);
}
`;

export const FFT_BLOOM_MULTIPLY_SHADER = /* wgsl */ `
@group(0) @binding(0) var<storage, read> redSpectrum: array<vec2f>;
@group(0) @binding(1) var<storage, read> greenSpectrum: array<vec2f>;
@group(0) @binding(2) var<storage, read> blueSpectrum: array<vec2f>;
@group(0) @binding(3) var<storage, read> kernelSpectrum: array<vec2f>;
@group(0) @binding(4) var<storage, read_write> filteredRed: array<vec2f>;
@group(0) @binding(5) var<storage, read_write> filteredGreen: array<vec2f>;
@group(0) @binding(6) var<storage, read_write> filteredBlue: array<vec2f>;

fn multiplyComplex(first: vec2f, second: vec2f) -> vec2f {
  return vec2f(
    first.x * second.x - first.y * second.y,
    first.x * second.y + first.y * second.x
  );
}

@compute @workgroup_size(${FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocation: vec3u) {
  let index = globalInvocation.x + globalInvocation.y *
    ${FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE * FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW}u;
  if (index >= arrayLength(&kernelSpectrum)) {
    return;
  }

  let kernel = kernelSpectrum[index];
  filteredRed[index] = multiplyComplex(redSpectrum[index], kernel);
  filteredGreen[index] = multiplyComplex(greenSpectrum[index], kernel);
  filteredBlue[index] = multiplyComplex(blueSpectrum[index], kernel);
}
`;

export const FFT_BLOOM_COMPOSITE_SHADER = /* wgsl */ `
struct FFTBloomParameters {
  sourceDimensions: vec2u,
  transformDimensions: vec2u,
  threshold: f32,
  intensity: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(0) var<uniform> parameters: FFTBloomParameters;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<storage, read> redChannel: array<vec2f>;
@group(0) @binding(3) var<storage, read> greenChannel: array<vec2f>;
@group(0) @binding(4) var<storage, read> blueChannel: array<vec2f>;
@group(0) @binding(5) var outputTexture: texture_storage_2d<rgba16float, write>;

fn loadConvolvedColor(coordinate: vec2i) -> vec3f {
  let clampedCoordinate = vec2u(clamp(
    coordinate,
    vec2i(0),
    vec2i(parameters.transformDimensions) - vec2i(1)
  ));
  let index = clampedCoordinate.y * parameters.transformDimensions.x + clampedCoordinate.x;
  return max(vec3f(redChannel[index].x, greenChannel[index].x, blueChannel[index].x), vec3f(0.0));
}

fn sampleConvolvedColor(sourceCoordinate: vec2u) -> vec3f {
  let transformCoordinate =
    (vec2f(sourceCoordinate) + vec2f(0.5)) * vec2f(parameters.transformDimensions) /
      vec2f(parameters.sourceDimensions) - vec2f(0.5);
  let baseCoordinate = vec2i(floor(transformCoordinate));
  let fraction = fract(transformCoordinate);
  let top = mix(
    loadConvolvedColor(baseCoordinate),
    loadConvolvedColor(baseCoordinate + vec2i(1, 0)),
    fraction.x
  );
  let bottom = mix(
    loadConvolvedColor(baseCoordinate + vec2i(0, 1)),
    loadConvolvedColor(baseCoordinate + vec2i(1, 1)),
    fraction.x
  );
  return mix(top, bottom, fraction.y);
}

@compute @workgroup_size(${FFT_BLOOM_WORKGROUP_DIMENSION}, ${FFT_BLOOM_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalInvocation: vec3u) {
  let coordinate = globalInvocation.xy;
  if (any(coordinate >= parameters.sourceDimensions)) {
    return;
  }

  let sourceColor = textureLoad(sourceTexture, vec2i(coordinate), 0);
  let glowColor = sampleConvolvedColor(coordinate) * parameters.intensity;
  textureStore(outputTexture, vec2i(coordinate), vec4f(sourceColor.rgb + glowColor, sourceColor.a));
}
`;
