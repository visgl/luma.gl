// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Number of invocations along each dimension of a spectral-ocean workgroup. */
export const SPECTRAL_OCEAN_WORKGROUP_DIMENSION = 8;

/** Byte length of the shared per-encoding uniform block. */
export const SPECTRAL_OCEAN_UNIFORM_BYTE_LENGTH = 48;

const SPECTRAL_OCEAN_PARAMETERS = /* wgsl */ `\
struct SpectralOceanParameters {
  resolution: u32,
  resetFoamHistory: u32,
  padding0: u32,
  padding1: u32,
  patchSize: f32,
  gravity: f32,
  choppiness: f32,
  time: f32,
  deltaTime: f32,
  foamDecay: f32,
  foamThreshold: f32,
  foamGain: f32,
};
`;

/** Evolves h0 into Hermitian height and horizontal-displacement spectra. */
export const SPECTRAL_OCEAN_EVOLUTION_SHADER = /* wgsl */ `\
${SPECTRAL_OCEAN_PARAMETERS}

@group(0) @binding(0) var<storage, read> initialSpectrum: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> heightSpectrum: array<vec2f>;
@group(0) @binding(2) var<storage, read_write> displacementXSpectrum: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> displacementZSpectrum: array<vec2f>;
@group(0) @binding(4) var<uniform> parameters: SpectralOceanParameters;

const SPECTRAL_OCEAN_PI: f32 = 3.14159265358979323846;

fn multiplyComplex(left: vec2f, right: vec2f) -> vec2f {
  return vec2f(
    left.x * right.x - left.y * right.y,
    left.x * right.y + left.y * right.x
  );
}

fn getLinearIndex(coordinate: vec2u) -> u32 {
  return coordinate.y * parameters.resolution + coordinate.x;
}

@compute @workgroup_size(${SPECTRAL_OCEAN_WORKGROUP_DIMENSION}, ${SPECTRAL_OCEAN_WORKGROUP_DIMENSION}, 1)
fn main(@builtin(global_invocation_id) globalIdentifier: vec3u) {
  if (globalIdentifier.x >= parameters.resolution || globalIdentifier.y >= parameters.resolution) {
    return;
  }

  let coordinate = globalIdentifier.xy;
  let linearIndex = getLinearIndex(coordinate);
  let partnerCoordinate = vec2u(
    (parameters.resolution - coordinate.x) % parameters.resolution,
    (parameters.resolution - coordinate.y) % parameters.resolution
  );
  let halfResolution = parameters.resolution / 2u;
  let signedX = select(
    f32(coordinate.x),
    f32(i32(coordinate.x) - i32(parameters.resolution)),
    coordinate.x > halfResolution
  );
  let signedZ = select(
    f32(coordinate.y),
    f32(i32(coordinate.y) - i32(parameters.resolution)),
    coordinate.y > halfResolution
  );
  let waveNumberScale = 2.0 * SPECTRAL_OCEAN_PI / parameters.patchSize;
  let waveVector = vec2f(signedX, signedZ) * waveNumberScale;
  let waveNumber = length(waveVector);

  if (waveNumber < 0.000001) {
    heightSpectrum[linearIndex] = vec2f(0.0);
    displacementXSpectrum[linearIndex] = vec2f(0.0);
    displacementZSpectrum[linearIndex] = vec2f(0.0);
    return;
  }

  let angularFrequency = sqrt(parameters.gravity * waveNumber);
  let phaseAngle = angularFrequency * parameters.time;
  let positivePhase = vec2f(cos(phaseAngle), sin(phaseAngle));
  let negativePhase = vec2f(positivePhase.x, -positivePhase.y);
  let initialValue = initialSpectrum[linearIndex];
  let partnerValue = initialSpectrum[getLinearIndex(partnerCoordinate)];
  let conjugatePartner = vec2f(partnerValue.x, -partnerValue.y);
  let heightValue = multiplyComplex(initialValue, positivePhase) +
    multiplyComplex(conjugatePartner, negativePhase);
  let waveDirection = waveVector / waveNumber;

  heightSpectrum[linearIndex] = heightValue;
  displacementXSpectrum[linearIndex] = multiplyComplex(
    heightValue,
    vec2f(0.0, -waveDirection.x * parameters.choppiness)
  );
  displacementZSpectrum[linearIndex] = multiplyComplex(
    heightValue,
    vec2f(0.0, -waveDirection.y * parameters.choppiness)
  );
}
`;

/** Assembles renderable displacement, normal, and temporally stable foam records. */
export const SPECTRAL_OCEAN_ASSEMBLY_SHADER = /* wgsl */ `\
${SPECTRAL_OCEAN_PARAMETERS}

@group(0) @binding(0) var<storage, read> heightField: array<vec2f>;
@group(0) @binding(1) var<storage, read> displacementXField: array<vec2f>;
@group(0) @binding(2) var<storage, read> displacementZField: array<vec2f>;
@group(0) @binding(3) var<storage, read_write> displacements: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> normalFoam: array<vec4f>;
@group(0) @binding(5) var<uniform> parameters: SpectralOceanParameters;

fn getLinearIndex(coordinate: vec2u) -> u32 {
  return coordinate.y * parameters.resolution + coordinate.x;
}

fn getWrappedCoordinate(coordinate: vec2i) -> vec2u {
  let resolution = i32(parameters.resolution);
  return vec2u(vec2i(
    (coordinate.x + resolution) % resolution,
    (coordinate.y + resolution) % resolution
  ));
}

fn getDisplacement(coordinate: vec2u) -> vec3f {
  let linearIndex = getLinearIndex(coordinate);
  return vec3f(
    displacementXField[linearIndex].x,
    heightField[linearIndex].x,
    displacementZField[linearIndex].x
  );
}

@compute @workgroup_size(${SPECTRAL_OCEAN_WORKGROUP_DIMENSION}, ${SPECTRAL_OCEAN_WORKGROUP_DIMENSION}, 1)
fn main(@builtin(global_invocation_id) globalIdentifier: vec3u) {
  if (globalIdentifier.x >= parameters.resolution || globalIdentifier.y >= parameters.resolution) {
    return;
  }

  let coordinate = vec2u(globalIdentifier.xy);
  let signedCoordinate = vec2i(coordinate);
  let left = getDisplacement(getWrappedCoordinate(signedCoordinate + vec2i(-1, 0)));
  let right = getDisplacement(getWrappedCoordinate(signedCoordinate + vec2i(1, 0)));
  let back = getDisplacement(getWrappedCoordinate(signedCoordinate + vec2i(0, -1)));
  let front = getDisplacement(getWrappedCoordinate(signedCoordinate + vec2i(0, 1)));
  let center = getDisplacement(coordinate);
  let cellSize = parameters.patchSize / f32(parameters.resolution);
  let inverseDiameter = 0.5 / cellSize;
  let tangentX = vec3f(
    2.0 * cellSize + right.x - left.x,
    right.y - left.y,
    right.z - left.z
  );
  let tangentZ = vec3f(
    front.x - back.x,
    front.y - back.y,
    2.0 * cellSize + front.z - back.z
  );
  let normal = normalize(cross(tangentZ, tangentX));

  let displacementXX = (right.x - left.x) * inverseDiameter;
  let displacementXZ = (front.x - back.x) * inverseDiameter;
  let displacementZX = (right.z - left.z) * inverseDiameter;
  let displacementZZ = (front.z - back.z) * inverseDiameter;
  let jacobian = (1.0 + displacementXX) * (1.0 + displacementZZ) -
    displacementXZ * displacementZX;
  let generatedFoam = clamp((parameters.foamThreshold - jacobian) * parameters.foamGain, 0.0, 1.0);
  let linearIndex = getLinearIndex(coordinate);
  let previousFoam = select(normalFoam[linearIndex].w, 0.0, parameters.resetFoamHistory != 0u);
  let retainedFoam = previousFoam * exp(-parameters.foamDecay * parameters.deltaTime);
  let foam = max(generatedFoam, retainedFoam);

  displacements[linearIndex] = vec4f(center, 0.0);
  normalFoam[linearIndex] = vec4f(normal, foam);
}
`;
