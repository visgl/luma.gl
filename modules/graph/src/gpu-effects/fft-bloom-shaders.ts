// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const FFT_BLOOM_WORKGROUP_DIMENSION = 8;
export const FFT_BLOOM_MULTIPLY_WORKGROUP_SIZE = 64;
export const FFT_BLOOM_MULTIPLY_WORKGROUPS_PER_ROW = 1024;
export const FFT_BLOOM_PARAMETER_BYTE_LENGTH = 96;

const FFT_BLOOM_PARAMETER_STRUCT = /* wgsl */ `
struct FFTBloomParameters {
  sourceDimensions: vec2u,
  contentDimensions: vec2u,
  transformDimensions: vec2u,
  contentOffset: vec2u,
  threshold: f32,
  intensity: f32,
  exposure: f32,
  exposureCompensation: f32,
  energyConserving: f32,
  useExposureTexture: f32,
  temporalStability: f32,
  exposureScale: f32,
  ghostIntensity: f32,
  ghostSpacing: f32,
  haloIntensity: f32,
  haloRadius: f32,
  chromaticAberration: f32,
  dirtIntensity: f32,
  ghostCount: f32,
  historyValid: f32,
};
`;

export const FFT_BLOOM_EXTRACT_SHADER = /* wgsl */ `
${FFT_BLOOM_PARAMETER_STRUCT}

@group(0) @binding(0) var<uniform> parameters: FFTBloomParameters;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var exposureTexture: texture_2d<f32>;
@group(0) @binding(3) var<storage, read_write> spatialChannels: array<vec2f>;

fn extractHighlight(sourceColor: vec3f) -> vec3f {
  let luminance = dot(sourceColor, vec3f(0.2126, 0.7152, 0.0722));
  let adaptedExposure = select(
    parameters.exposure,
    textureLoad(exposureTexture, vec2i(0), 0).r,
    parameters.useExposureTexture > 0.5
  );
  let exposure = max(adaptedExposure * exp2(parameters.exposureCompensation), 0.0001);
  let threshold = select(parameters.threshold / exposure, 0.0, parameters.energyConserving > 0.5);
  let contribution = max(luminance - threshold, 0.0) / max(luminance, 0.00001);
  return sourceColor * contribution;
}

fn filterSourcePixel(contentCoordinate: vec2u) -> vec3f {
  let sourceStart = vec2f(contentCoordinate) * vec2f(parameters.sourceDimensions) /
    vec2f(parameters.contentDimensions);
  let sourceEnd = vec2f(contentCoordinate + vec2u(1)) * vec2f(parameters.sourceDimensions) /
    vec2f(parameters.contentDimensions);
  let minimumCoordinate = vec2u(floor(sourceStart));
  let maximumCoordinate = min(
    vec2u(ceil(sourceEnd)),
    parameters.sourceDimensions
  );
  var filteredColor = vec3f(0.0);
  var totalWeight = 0.0;

  for (var sampleY = minimumCoordinate.y; sampleY < maximumCoordinate.y; sampleY++) {
    let weightY = min(f32(sampleY + 1u), sourceEnd.y) - max(f32(sampleY), sourceStart.y);
    for (var sampleX = minimumCoordinate.x; sampleX < maximumCoordinate.x; sampleX++) {
      let weightX = min(f32(sampleX + 1u), sourceEnd.x) - max(f32(sampleX), sourceStart.x);
      let sampleWeight = max(weightX * weightY, 0.0);
      let sourceColor = textureLoad(sourceTexture, vec2i(vec2u(sampleX, sampleY)), 0).rgb;
      filteredColor += extractHighlight(sourceColor) * sampleWeight;
      totalWeight += sampleWeight;
    }
  }

  return filteredColor / max(totalWeight, 0.00001);
}

@compute @workgroup_size(${FFT_BLOOM_WORKGROUP_DIMENSION}, ${FFT_BLOOM_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalInvocation: vec3u) {
  let coordinate = globalInvocation.xy;
  if (any(coordinate >= parameters.transformDimensions)) {
    return;
  }

  let index = coordinate.y * parameters.transformDimensions.x + coordinate.x;
  let elementCount = parameters.transformDimensions.x * parameters.transformDimensions.y;
  var sourceColor = vec3f(0.0);
  if (all(coordinate >= parameters.contentOffset) &&
      all(coordinate < parameters.contentOffset + parameters.contentDimensions)) {
    sourceColor = filterSourcePixel(coordinate - parameters.contentOffset);
  }
  spatialChannels[index] = vec2f(sourceColor.r, 0.0);
  spatialChannels[index + elementCount] = vec2f(sourceColor.g, 0.0);
  spatialChannels[index + elementCount * 2u] = vec2f(sourceColor.b, 0.0);
}
`;

export const FFT_BLOOM_MULTIPLY_SHADER = /* wgsl */ `
@group(0) @binding(0) var<storage, read> sourceSpectrum: array<vec2f>;
@group(0) @binding(1) var<storage, read> kernelSpectrum: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> filteredChannels: array<vec2f>;

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

  filteredChannels[index] = multiplyComplex(sourceSpectrum[index], kernelSpectrum[index]);
}
`;

/** Builds the final optical resolve while keeping persistent history strictly optional. */
export function makeFFTBloomCompositeShader(temporalStability: boolean): string {
  const historyBindings = temporalStability
    ? `
@group(0) @binding(6) var historyTexture: texture_2d<f32>;
@group(0) @binding(7) var historyOutput: texture_storage_2d<rgba16float, write>;`
    : '';
  const historyResolve = temporalStability
    ? `
  let historyState = textureLoad(historyTexture, vec2i(coordinate), 0);
  let adaptedExposure = select(
    parameters.exposure,
    textureLoad(exposureTexture, vec2i(0), 0).r,
    parameters.useExposureTexture > 0.5
  );
  let exposureScale = select(
    parameters.exposureScale,
    adaptedExposure / max(historyState.a, 0.0001),
    parameters.useExposureTexture > 0.5
  );
  let previousGlow = historyState.rgb * exposureScale;
  let previousWeight = select(
    0.0,
    clamp(parameters.temporalStability, 0.0, 0.95),
    parameters.historyValid > 0.5
  );
  let leftGlow = sampleConvolvedColor(vec2u(max(vec2i(coordinate) - vec2i(1, 0), vec2i(0))));
  let rightGlow = sampleConvolvedColor(min(coordinate + vec2u(1, 0), parameters.sourceDimensions - vec2u(1)));
  let topGlow = sampleConvolvedColor(vec2u(max(vec2i(coordinate) - vec2i(0, 1), vec2i(0))));
  let bottomGlow = sampleConvolvedColor(min(coordinate + vec2u(0, 1), parameters.sourceDimensions - vec2u(1)));
  let minimumGlow = min(glowColor, min(min(leftGlow, rightGlow), min(topGlow, bottomGlow)));
  let maximumGlow = max(glowColor, max(max(leftGlow, rightGlow), max(topGlow, bottomGlow)));
  glowColor = mix(glowColor, clamp(previousGlow, minimumGlow, maximumGlow), previousWeight);
  textureStore(historyOutput, vec2i(coordinate), vec4f(glowColor, adaptedExposure));`
    : '';

  return /* wgsl */ `
${FFT_BLOOM_PARAMETER_STRUCT}

@group(0) @binding(0) var<uniform> parameters: FFTBloomParameters;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<storage, read> convolvedChannels: array<vec2f>;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var lensDirtTexture: texture_2d<f32>;
@group(0) @binding(5) var exposureTexture: texture_2d<f32>;${historyBindings}

fn loadConvolvedColor(coordinate: vec2i) -> vec3f {
  let contentMaximum = vec2i(parameters.contentOffset + parameters.contentDimensions) - vec2i(1);
  let clampedCoordinate = vec2u(clamp(coordinate, vec2i(parameters.contentOffset), contentMaximum));
  let index = clampedCoordinate.y * parameters.transformDimensions.x + clampedCoordinate.x;
  let elementCount = parameters.transformDimensions.x * parameters.transformDimensions.y;
  return max(
    vec3f(
      convolvedChannels[index].x,
      convolvedChannels[index + elementCount].x,
      convolvedChannels[index + elementCount * 2u].x
    ),
    vec3f(0.0)
  );
}

fn sampleConvolvedColor(sourceCoordinate: vec2u) -> vec3f {
  let transformCoordinate = vec2f(parameters.contentOffset) +
    (vec2f(sourceCoordinate) + vec2f(0.5)) * vec2f(parameters.contentDimensions) /
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

fn loadLensSource(coordinate: vec2f) -> vec3f {
  if (any(coordinate < vec2f(0.0)) || any(coordinate > vec2f(1.0))) {
    return vec3f(0.0);
  }
  let sourceCoordinate = min(
    vec2u(coordinate * vec2f(parameters.sourceDimensions)),
    parameters.sourceDimensions - vec2u(1)
  );
  let color = textureLoad(sourceTexture, vec2i(sourceCoordinate), 0).rgb;
  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let adaptedExposure = select(
    parameters.exposure,
    textureLoad(exposureTexture, vec2i(0), 0).r,
    parameters.useExposureTexture > 0.5
  );
  let exposure = max(adaptedExposure * exp2(parameters.exposureCompensation), 0.0001);
  let threshold = select(parameters.threshold / exposure, 0.0, parameters.energyConserving > 0.5);
  return color * max(luminance - threshold, 0.0) / max(luminance, 0.00001);
}

fn sampleSpectralLens(coordinate: vec2f, direction: vec2f) -> vec3f {
  let spectralOffset = direction * parameters.chromaticAberration * 0.018;
  return vec3f(
    loadLensSource(coordinate + spectralOffset).r,
    loadLensSource(coordinate).g,
    loadLensSource(coordinate - spectralOffset).b
  );
}

fn sampleLensArtifacts(coordinate: vec2u) -> vec3f {
  let uv = (vec2f(coordinate) + vec2f(0.5)) / vec2f(parameters.sourceDimensions);
  let centerDirection = vec2f(0.5) - uv;
  var artifacts = vec3f(0.0);
  if (parameters.ghostIntensity > 0.0) {
    for (var ghostIndex = 1u; ghostIndex <= 6u; ghostIndex++) {
      if (f32(ghostIndex) > parameters.ghostCount) {
        break;
      }
      let ghostCoordinate = uv + centerDirection * parameters.ghostSpacing * f32(ghostIndex);
      artifacts += sampleSpectralLens(ghostCoordinate, centerDirection) *
        parameters.ghostIntensity / max(parameters.ghostCount, 1.0);
    }
  }
  if (parameters.haloIntensity > 0.0) {
    let radialLength = max(length(centerDirection), 0.00001);
    let radialDirection = centerDirection / radialLength;
    let haloCoordinate = vec2f(0.5) - radialDirection * parameters.haloRadius;
    artifacts += sampleSpectralLens(haloCoordinate, radialDirection) *
      parameters.haloIntensity *
        (1.0 - smoothstep(0.05, 0.75, abs(radialLength - parameters.haloRadius)));
  }
  return artifacts;
}

@compute @workgroup_size(${FFT_BLOOM_WORKGROUP_DIMENSION}, ${FFT_BLOOM_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalInvocation: vec3u) {
  let coordinate = globalInvocation.xy;
  if (any(coordinate >= parameters.sourceDimensions)) {
    return;
  }

  let sourceColor = textureLoad(sourceTexture, vec2i(coordinate), 0);
  var glowColor = sampleConvolvedColor(coordinate);${historyResolve}
  let artifactColor = sampleLensArtifacts(coordinate);
  var opticalColor = glowColor + artifactColor;
  if (parameters.dirtIntensity > 0.0) {
    let dirtDimensions = textureDimensions(lensDirtTexture);
    let dirtCoordinate = min(
      vec2u((vec2f(coordinate) + vec2f(0.5)) * vec2f(dirtDimensions) /
        vec2f(parameters.sourceDimensions)),
      dirtDimensions - vec2u(1)
    );
    let dirtMask = textureLoad(lensDirtTexture, vec2i(dirtCoordinate), 0).rgb;
    opticalColor *= vec3f(1.0) + dirtMask * parameters.dirtIntensity;
  }
  let additiveColor = sourceColor.rgb + opticalColor * parameters.intensity;
  let physicalColor = mix(sourceColor.rgb, opticalColor, clamp(parameters.intensity, 0.0, 1.0));
  let finalColor = select(additiveColor, physicalColor, parameters.energyConserving > 0.5);
  textureStore(outputTexture, vec2i(coordinate), vec4f(finalColor, sourceColor.a));
}
`;
}

export const FFT_BLOOM_COMPOSITE_SHADER = makeFFTBloomCompositeShader(false);
