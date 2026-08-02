// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const SPECTRAL_CAUSTICS_WAVELENGTH_COUNT = 6;
export const SPECTRAL_CAUSTICS_WORKGROUP_SIZE = 64;
export const SPECTRAL_CAUSTICS_SPLAT_BYTE_LENGTH = 32;
export const SPECTRAL_CAUSTICS_UNIFORM_FLOAT_COUNT = 56;
export const SPECTRAL_CAUSTICS_UNIFORM_BYTE_LENGTH =
  SPECTRAL_CAUSTICS_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

export const SPECTRAL_CAUSTICS_UNIFORM_OFFSETS = {
  inverseLightViewProjection: 0,
  lightViewProjection: 16,
  receiverOriginWidth: 32,
  receiverTangentHeight: 36,
  receiverBitangentIntensity: 40,
  receiverNormalRefractiveIndex: 44,
  absorptionDispersion: 48,
  targetSizes: 52
} as const;

/** Bindings consumed by the photon-tracing compute pass. */
export const SPECTRAL_CAUSTICS_TRACE_BINDINGS = [
  {name: 'frontNormalTexture', type: 'texture', group: 0, location: 0, sampleType: 'float'},
  {name: 'frontDepthTexture', type: 'texture', group: 0, location: 1, sampleType: 'depth'},
  {name: 'backNormalTexture', type: 'texture', group: 0, location: 2, sampleType: 'float'},
  {name: 'backDepthTexture', type: 'texture', group: 0, location: 3, sampleType: 'depth'},
  {name: 'photonSplats', type: 'storage', group: 0, location: 4},
  {name: 'uniforms', type: 'uniform', group: 0, location: 5}
] as const;

/** Bindings consumed by the additive photon-splat render pass. */
export const SPECTRAL_CAUSTICS_SPLAT_BINDINGS = [
  {name: 'photonSplats', type: 'read-only-storage', group: 0, location: 0}
] as const;

/**
 * Traces six wavelength samples through paired front/back refractor captures.
 *
 * Energy is stored as positive CIE XYZ so additive blending stays physically monotonic. The
 * receiver shader performs the signed XYZ-to-linear-RGB conversion after all bands overlap.
 */
export const SPECTRAL_CAUSTICS_TRACE_SHADER = /* wgsl */ `
const WAVELENGTH_COUNT: u32 = ${SPECTRAL_CAUSTICS_WAVELENGTH_COUNT}u;
const MARCH_STEP_COUNT: u32 = 16u;

struct PhotonSplat {
  positionRadius: vec4<f32>,
  xyzEnergy: vec4<f32>,
};

struct SpectralCausticsUniforms {
  inverseLightViewProjection: mat4x4<f32>,
  lightViewProjection: mat4x4<f32>,
  receiverOriginWidth: vec4<f32>,
  receiverTangentHeight: vec4<f32>,
  receiverBitangentIntensity: vec4<f32>,
  receiverNormalRefractiveIndex: vec4<f32>,
  absorptionDispersion: vec4<f32>,
  targetSizes: vec4<f32>,
};

struct ExitHit {
  position: vec3<f32>,
  valid: f32,
  normal: vec3<f32>,
  padding: f32,
};

@group(0) @binding(0) var frontNormalTexture: texture_2d<f32>;
@group(0) @binding(1) var frontDepthTexture: texture_depth_2d;
@group(0) @binding(2) var backNormalTexture: texture_2d<f32>;
@group(0) @binding(3) var backDepthTexture: texture_depth_2d;
@group(0) @binding(4) var<storage, read_write> photonSplats: array<PhotonSplat>;
@group(0) @binding(5) var<uniform> uniforms: SpectralCausticsUniforms;

const WAVELENGTHS_NANOMETERS = array<f32, ${SPECTRAL_CAUSTICS_WAVELENGTH_COUNT}>(
  664.46, 618.64, 574.60, 528.33, 468.28, 434.72
);

// CIE 1931 2-degree CMFs integrated against D65 in six bands and normalized to Y = 1.
const WAVELENGTH_XYZ = array<vec3<f32>, ${SPECTRAL_CAUSTICS_WAVELENGTH_COUNT}>(
  vec3<f32>(0.03671527, 0.01357357, 0.00000000),
  vec3<f32>(0.30218842, 0.14160332, 0.00008598),
  vec3<f32>(0.36062779, 0.40239216, 0.00124922),
  vec3<f32>(0.07092146, 0.36745709, 0.04500246),
  vec3<f32>(0.08806719, 0.06954351, 0.58510595),
  vec3<f32>(0.09195043, 0.00543034, 0.45738513)
);

const WAVELENGTH_ABSORPTION_WEIGHTS = array<vec3<f32>, ${SPECTRAL_CAUSTICS_WAVELENGTH_COUNT}>(
  vec3<f32>(1.0, 0.0, 0.0),
  vec3<f32>(0.78, 0.22, 0.0),
  vec3<f32>(0.28, 0.72, 0.0),
  vec3<f32>(0.0, 0.82, 0.18),
  vec3<f32>(0.0, 0.28, 0.72),
  vec3<f32>(0.12, 0.0, 0.88)
);

fn reconstructWorldPosition(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let clipPosition = vec4<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let worldPosition = uniforms.inverseLightViewProjection * clipPosition;
  return worldPosition.xyz / max(abs(worldPosition.w), 0.000001);
}

fn projectWorldPosition(worldPosition: vec3<f32>) -> vec3<f32> {
  let clipPosition = uniforms.lightViewProjection * vec4<f32>(worldPosition, 1.0);
  let inverseW = 1.0 / max(abs(clipPosition.w), 0.000001);
  let normalized = clipPosition.xyz * inverseW;
  return vec3<f32>(normalized.x * 0.5 + 0.5, 0.5 - normalized.y * 0.5, normalized.z);
}

fn decodeNormal(encodedNormal: vec3<f32>) -> vec3<f32> {
  let normal = encodedNormal * 2.0 - vec3<f32>(1.0);
  return normal * inverseSqrt(max(dot(normal, normal), 0.000001));
}

fn getCapturePixel(uv: vec2<f32>, captureSize: i32) -> vec2<i32> {
  return clamp(
    vec2<i32>(uv * f32(captureSize)),
    vec2<i32>(0),
    vec2<i32>(captureSize - 1)
  );
}

fn findExitSurface(
  entryPosition: vec3<f32>,
  insideDirection: vec3<f32>,
  sourceUv: vec2<f32>,
  captureSize: i32
) -> ExitHit {
  let sourcePixel = getCapturePixel(sourceUv, captureSize);
  let sourceBackDepth = textureLoad(backDepthTexture, sourcePixel, 0);
  if (sourceBackDepth <= 0.000001) {
    return ExitHit(vec3<f32>(0.0), 0.0, vec3<f32>(0.0), 0.0);
  }

  let sourceBackPosition = reconstructWorldPosition(sourceUv, sourceBackDepth);
  let maximumDistance = max(distance(entryPosition, sourceBackPosition) * 1.8, 0.01);
  var previousPosition = entryPosition;

  for (var marchStep = 1u; marchStep <= MARCH_STEP_COUNT; marchStep++) {
    let distanceFraction = f32(marchStep) / f32(MARCH_STEP_COUNT);
    let candidatePosition = entryPosition + insideDirection * maximumDistance * distanceFraction;
    let projected = projectWorldPosition(candidatePosition);
    if (
      projected.x < 0.0 || projected.x > 1.0 ||
      projected.y < 0.0 || projected.y > 1.0 ||
      projected.z < 0.0 || projected.z > 1.0
    ) {
      break;
    }

    let backPixel = getCapturePixel(projected.xy, captureSize);
    let backDepth = textureLoad(backDepthTexture, backPixel, 0);
    if (backDepth > 0.000001 && projected.z >= backDepth - 0.0015) {
      let backUv = (vec2<f32>(backPixel) + vec2<f32>(0.5)) / f32(captureSize);
      let backPosition = reconstructWorldPosition(backUv, backDepth);
      let encodedNormal = textureLoad(backNormalTexture, backPixel, 0).xyz;
      return ExitHit(backPosition, 1.0, decodeNormal(encodedNormal), 0.0);
    }
    previousPosition = candidatePosition;
  }

  // Permit the same-pixel fallback only when it remains close to the refracted ray. This preserves
  // nearly axial rays without turning unrelated silhouette backfaces into long caustic streaks.
  let fallbackOffset = sourceBackPosition - entryPosition;
  let fallbackDistance = dot(fallbackOffset, insideDirection);
  let fallbackLateralError = length(fallbackOffset - insideDirection * fallbackDistance);
  let fallbackTolerance = max(length(fallbackOffset) * 0.12, 0.01);
  let fallbackNormal = decodeNormal(textureLoad(backNormalTexture, sourcePixel, 0).xyz);
  let fallbackValid = fallbackDistance > 0.0 &&
    fallbackLateralError <= fallbackTolerance &&
    distance(previousPosition, entryPosition) > 0.0;
  return ExitHit(sourceBackPosition, select(0.0, 1.0, fallbackValid), fallbackNormal, 0.0);
}

fn getRefractiveIndex(wavelengthNanometers: f32) -> f32 {
  let referenceRatio = 550.0 / wavelengthNanometers;
  return max(
    uniforms.receiverNormalRefractiveIndex.w +
      uniforms.absorptionDispersion.w * (referenceRatio * referenceRatio - 1.0),
    1.0001
  );
}

fn writeInvalidSplats(sampleIndex: u32) {
  for (var wavelengthIndex = 0u; wavelengthIndex < WAVELENGTH_COUNT; wavelengthIndex++) {
    let splatIndex = sampleIndex * WAVELENGTH_COUNT + wavelengthIndex;
    photonSplats[splatIndex].positionRadius = vec4<f32>(-2.0, -2.0, 0.0, 0.0);
    photonSplats[splatIndex].xyzEnergy = vec4<f32>(0.0);
  }
}

@compute @workgroup_size(${SPECTRAL_CAUSTICS_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let captureSize = u32(uniforms.targetSizes.x);
  let sampleCount = captureSize * captureSize;
  let sampleIndex = globalId.x;
  if (sampleIndex >= sampleCount) {
    return;
  }

  let pixel = vec2<i32>(i32(sampleIndex % captureSize), i32(sampleIndex / captureSize));
  let frontDepth = textureLoad(frontDepthTexture, pixel, 0);
  if (frontDepth >= 0.999999) {
    writeInvalidSplats(sampleIndex);
    return;
  }

  let uv = (vec2<f32>(pixel) + vec2<f32>(0.5)) / f32(captureSize);
  let entryPosition = reconstructWorldPosition(uv, frontDepth);
  let rayNear = reconstructWorldPosition(uv, 0.0);
  let rayFar = reconstructWorldPosition(uv, 1.0);
  let incomingDirection = normalize(rayFar - rayNear);
  var entryNormal = decodeNormal(textureLoad(frontNormalTexture, pixel, 0).xyz);
  if (dot(incomingDirection, entryNormal) > 0.0) {
    entryNormal = -entryNormal;
  }

  let receiverOrigin = uniforms.receiverOriginWidth.xyz;
  let receiverWidth = uniforms.receiverOriginWidth.w;
  let receiverTangent = uniforms.receiverTangentHeight.xyz;
  let receiverHeight = uniforms.receiverTangentHeight.w;
  let receiverBitangent = uniforms.receiverBitangentIntensity.xyz;
  let intensity = uniforms.receiverBitangentIntensity.w;
  let receiverNormal = uniforms.receiverNormalRefractiveIndex.xyz;
  let splatRadiusUv = uniforms.targetSizes.z / max(uniforms.targetSizes.y, 1.0);
  let sampleNormalization = 8192.0 / max(f32(sampleCount), 1.0);

  for (var wavelengthIndex = 0u; wavelengthIndex < WAVELENGTH_COUNT; wavelengthIndex++) {
    let splatIndex = sampleIndex * WAVELENGTH_COUNT + wavelengthIndex;
    let refractiveIndex = getRefractiveIndex(WAVELENGTHS_NANOMETERS[wavelengthIndex]);
    let insideDirection = refract(incomingDirection, entryNormal, 1.0 / refractiveIndex);
    if (dot(insideDirection, insideDirection) < 0.000001) {
      photonSplats[splatIndex].positionRadius = vec4<f32>(-2.0, -2.0, 0.0, 0.0);
      photonSplats[splatIndex].xyzEnergy = vec4<f32>(0.0);
      continue;
    }

    let exitHit = findExitSurface(entryPosition, normalize(insideDirection), uv, i32(captureSize));
    var exitNormal = exitHit.normal;
    if (exitHit.valid < 0.5) {
      photonSplats[splatIndex].positionRadius = vec4<f32>(-2.0, -2.0, 0.0, 0.0);
      photonSplats[splatIndex].xyzEnergy = vec4<f32>(0.0);
      continue;
    }
    if (dot(insideDirection, exitNormal) < 0.0) {
      exitNormal = -exitNormal;
    }
    let outgoingDirection = refract(normalize(insideDirection), -exitNormal, refractiveIndex);
    let receiverDenominator = dot(outgoingDirection, receiverNormal);
    if (dot(outgoingDirection, outgoingDirection) < 0.000001 || abs(receiverDenominator) < 0.00001) {
      photonSplats[splatIndex].positionRadius = vec4<f32>(-2.0, -2.0, 0.0, 0.0);
      photonSplats[splatIndex].xyzEnergy = vec4<f32>(0.0);
      continue;
    }

    let receiverDistance = dot(receiverOrigin - exitHit.position, receiverNormal) / receiverDenominator;
    let receiverPosition = exitHit.position + outgoingDirection * receiverDistance;
    let receiverOffset = receiverPosition - receiverOrigin;
    let receiverUv = vec2<f32>(
      dot(receiverOffset, receiverTangent) / receiverWidth + 0.5,
      dot(receiverOffset, receiverBitangent) / receiverHeight + 0.5
    );
    if (
      receiverDistance <= 0.0 || receiverUv.x < 0.0 || receiverUv.x > 1.0 ||
      receiverUv.y < 0.0 || receiverUv.y > 1.0
    ) {
      photonSplats[splatIndex].positionRadius = vec4<f32>(-2.0, -2.0, 0.0, 0.0);
      photonSplats[splatIndex].xyzEnergy = vec4<f32>(0.0);
      continue;
    }

    let opticalThickness = distance(entryPosition, exitHit.position);
    let absorptionCoefficient = dot(
      uniforms.absorptionDispersion.xyz,
      WAVELENGTH_ABSORPTION_WEIGHTS[wavelengthIndex]
    );
    let transmission = exp(-max(absorptionCoefficient, 0.0) * opticalThickness);
    let xyzEnergy = WAVELENGTH_XYZ[wavelengthIndex] *
      intensity * sampleNormalization * transmission;
    let splatRadiusPixels = max(uniforms.targetSizes.z, 0.5);
    let kernelNormalization = 3.5 /
      (3.141592653589793 * splatRadiusPixels * splatRadiusPixels * (1.0 - exp(-3.5)));
    photonSplats[splatIndex].positionRadius = vec4<f32>(
      receiverUv,
      splatRadiusUv,
      kernelNormalization
    );
    photonSplats[splatIndex].xyzEnergy = vec4<f32>(xyzEnergy, transmission);
  }
}`;

/** Rasterizes the GPU-generated photon records as compact additive Gaussian footprints. */
export const SPECTRAL_CAUSTICS_SPLAT_SHADER = /* wgsl */ `
struct PhotonSplat {
  positionRadius: vec4<f32>,
  xyzEnergy: vec4<f32>,
};

struct SplatVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localPosition: vec2<f32>,
  @location(1) @interpolate(flat) xyzEnergy: vec3<f32>,
  @location(2) @interpolate(flat) kernelNormalization: f32,
};

@group(0) @binding(0) var<storage, read> photonSplats: array<PhotonSplat>;

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> SplatVertexOutput {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0)
  );
  let splat = photonSplats[instanceIndex];
  let localPosition = corners[vertexIndex];
  let center = vec2<f32>(
    splat.positionRadius.x * 2.0 - 1.0,
    1.0 - splat.positionRadius.y * 2.0
  );
  let radius = splat.positionRadius.z;
  var output: SplatVertexOutput;
  output.position = vec4<f32>(center + localPosition * radius * 2.0, 0.0, 1.0);
  output.localPosition = localPosition;
  output.xyzEnergy = splat.xyzEnergy.xyz;
  output.kernelNormalization = splat.positionRadius.w;
  return output;
}

@fragment fn fragmentMain(input: SplatVertexOutput) -> @location(0) vec4<f32> {
  let radiusSquared = dot(input.localPosition, input.localPosition);
  if (radiusSquared > 1.0) {
    discard;
  }
  let weight = exp(-radiusSquared * 3.5) * input.kernelNormalization;
  return vec4<f32>(input.xyzEnergy * weight, weight);
}`;
