// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ComputeShaderLayout} from '@luma.gl/core';

export const VOLUMETRIC_FIRE_WORKGROUP_SIZE = 4;
export const VOLUMETRIC_FIRE_MAX_EMITTERS = 4;

/** Float offsets into the packed simulation uniform buffer. */
export const VOLUMETRIC_FIRE_SIMULATION_UNIFORM_OFFSETS = {
  gridSizeDeltaTime: 0,
  timeCounts: 4,
  forces: 8,
  dissipation: 12,
  reaction: 16,
  boundary: 20,
  emitters: 24,
  emitterStride: 12,
  emitterPositionRadius: 0,
  emitterSource: 4,
  emitterVelocityImpulse: 8
} as const;

export const VOLUMETRIC_FIRE_SIMULATION_UNIFORM_FLOAT_COUNT = 72;
export const VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH =
  VOLUMETRIC_FIRE_SIMULATION_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

/**
 * Shared WGSL uniform declaration. The velocity field stores xyz velocity in `rgba16float`.
 * The combustion field stores density, temperature, fuel, and age in `rgba16float`.
 * The obstacle mask is `r8unorm`, with zero meaning fluid and one meaning solid.
 */
export const VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL = /* wgsl */ `\
struct VolumetricFireEmitterUniforms {
  positionRadius: vec4f,
  source: vec4f,
  velocityImpulse: vec4f,
};

struct VolumetricFireSimulationUniforms {
  gridSizeDeltaTime: vec4f,
  timeCounts: vec4f,
  forces: vec4f,
  dissipation: vec4f,
  reaction: vec4f,
  boundary: vec4f,
  emitters: array<VolumetricFireEmitterUniforms, 4>,
};
`;

const VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL = /* wgsl */ `\
fn isVoxelInside(voxelCoordinate: vec3i, volumeDimensions: vec3u) -> bool {
  return all(voxelCoordinate >= vec3i(0)) &&
    all(voxelCoordinate < vec3i(volumeDimensions));
}

fn getVoxelTextureCoordinate(
  voxelCoordinate: vec3u,
  volumeDimensions: vec3u
) -> vec3f {
  return (vec3f(voxelCoordinate) + vec3f(0.5)) / vec3f(volumeDimensions);
}

fn clampVolumeTextureCoordinate(
  textureCoordinate: vec3f,
  volumeDimensions: vec3u
) -> vec3f {
  let halfVoxel = vec3f(0.5) / vec3f(volumeDimensions);
  return clamp(textureCoordinate, halfVoxel, vec3f(1.0) - halfVoxel);
}

fn getSimulationPosition(textureCoordinate: vec3f) -> vec3f {
  return (textureCoordinate - vec3f(0.5)) * uniforms.gridSizeDeltaTime.xyz;
}

fn getCellSize() -> vec3f {
  return vec3f(1.0);
}
`;

const VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL = /* wgsl */ `\
fn loadObstacleMask(voxelCoordinate: vec3i, volumeDimensions: vec3u) -> f32 {
  if (!isVoxelInside(voxelCoordinate, volumeDimensions)) {
    return 1.0;
  }
  return textureLoad(obstacleTexture, voxelCoordinate, 0).r;
}

fn isObstacleVoxel(voxelCoordinate: vec3i, volumeDimensions: vec3u) -> bool {
  return loadObstacleMask(voxelCoordinate, volumeDimensions) >=
    uniforms.boundary.y;
}

fn traceBackThroughFluid(
  textureCoordinate: vec3f,
  requestedPreviousTextureCoordinate: vec3f,
  volumeDimensions: vec3u
) -> vec3f {
  let clampedPreviousTextureCoordinate = clampVolumeTextureCoordinate(
    requestedPreviousTextureCoordinate,
    volumeDimensions
  );
  let characteristic = clampedPreviousTextureCoordinate - textureCoordinate;
  let characteristicInCells = characteristic * vec3f(volumeDimensions);
  let characteristicLengthInCells = max(
    max(abs(characteristicInCells.x), abs(characteristicInCells.y)),
    abs(characteristicInCells.z)
  );
  if (characteristicLengthInCells <= 0.000001) {
    return textureCoordinate;
  }

  let maximumTraceDistanceInCells = 8.0;
  let boundedTraceDistanceInCells = min(
    characteristicLengthInCells,
    maximumTraceDistanceInCells
  );
  let boundedCharacteristic = characteristic *
    (boundedTraceDistanceInCells / characteristicLengthInCells);
  let traceStepCount = max(1u, u32(ceil(boundedTraceDistanceInCells * 2.0)));
  var safeTextureCoordinate = textureCoordinate;

  for (var traceStep = 1u; traceStep <= 16u; traceStep++) {
    if (traceStep > traceStepCount) {
      break;
    }
    let traceProgress = f32(traceStep) / f32(traceStepCount);
    let candidateTextureCoordinate = textureCoordinate + boundedCharacteristic * traceProgress;
    let candidateVoxelCoordinate = vec3i(
      floor(candidateTextureCoordinate * vec3f(volumeDimensions))
    );
    if (isObstacleVoxel(candidateVoxelCoordinate, volumeDimensions)) {
      break;
    }
    safeTextureCoordinate = candidateTextureCoordinate;
  }

  return safeTextureCoordinate;
}

fn constrainVelocityAtObstacle(
  velocity: vec3f,
  voxelCoordinate: vec3i,
  volumeDimensions: vec3u,
  applyBoundaryDamping: bool
) -> vec3f {
  var constrainedVelocity = velocity;
  if (isObstacleVoxel(voxelCoordinate + vec3i(1, 0, 0), volumeDimensions)) {
    constrainedVelocity.x = 0.0;
  }
  if (isObstacleVoxel(voxelCoordinate + vec3i(0, 1, 0), volumeDimensions)) {
    constrainedVelocity.y = 0.0;
  }
  if (isObstacleVoxel(voxelCoordinate + vec3i(0, 0, 1), volumeDimensions)) {
    constrainedVelocity.z = 0.0;
  }

  if (applyBoundaryDamping) {
    let neighboringOccupancy = max(
      max(
        loadObstacleMask(voxelCoordinate + vec3i(1, 0, 0), volumeDimensions),
        loadObstacleMask(voxelCoordinate - vec3i(1, 0, 0), volumeDimensions)
      ),
      max(
        max(
          loadObstacleMask(voxelCoordinate + vec3i(0, 1, 0), volumeDimensions),
          loadObstacleMask(voxelCoordinate - vec3i(0, 1, 0), volumeDimensions)
        ),
        max(
          loadObstacleMask(voxelCoordinate + vec3i(0, 0, 1), volumeDimensions),
          loadObstacleMask(voxelCoordinate - vec3i(0, 0, 1), volumeDimensions)
        )
      )
    );
    let boundaryWeight = smoothstep(
      uniforms.boundary.y * 0.5,
      uniforms.boundary.y,
      neighboringOccupancy
    );
    constrainedVelocity *= mix(
      1.0,
      uniforms.boundary.x,
      boundaryWeight
    );
  }
  return constrainedVelocity;
}
`;

const VOLUMETRIC_FIRE_EMITTER_FUNCTIONS_WGSL = /* wgsl */ `\
fn getEmitterWeight(simulationPosition: vec3f, emitterIndex: u32) -> f32 {
  let positionRadius = uniforms.emitters[emitterIndex].positionRadius;
  let radiusInCells = max(positionRadius.w, 0.0001);
  let normalizedDistance = distance(simulationPosition, positionRadius.xyz) / radiusInCells;
  let sphericalWeight = 1.0 - smoothstep(0.35, 1.0, normalizedDistance);
  let sourcePhase = uniforms.timeCounts.x *
    (2.7 + f32(emitterIndex) * 0.41) + f32(emitterIndex) * 1.73;
  let temporalFlicker = 0.82 + 0.18 * sin(sourcePhase) * sin(sourcePhase * 0.61 + 0.8);
  return sphericalWeight * temporalFlicker;
}

fn getActiveEmitterCount() -> u32 {
  return min(
    u32(max(uniforms.timeCounts.z, 0.0)),
    ${VOLUMETRIC_FIRE_MAX_EMITTERS}u
  );
}
`;

const VOLUMETRIC_FIRE_TURBULENCE_FUNCTIONS_WGSL = /* wgsl */ `\
fn getDivergenceFreeTurbulence(simulationPosition: vec3f) -> vec3f {
  let frequency = max(uniforms.boundary.z, 0.0001);
  let animatedTime = uniforms.timeCounts.x;
  let normalizedPosition = simulationPosition /
    max(uniforms.gridSizeDeltaTime.xyz, vec3f(1.0));
  let phase = normalizedPosition * frequency + vec3f(
    animatedTime * 0.83,
    animatedTime * 1.17,
    animatedTime * 0.69
  );
  let primaryField = vec3f(
    sin(phase.y) + cos(phase.z),
    sin(phase.z) + cos(phase.x),
    sin(phase.x) + cos(phase.y)
  );
  let secondaryPhase = phase * 1.93 + vec3f(1.7, 4.1, 2.9);
  let secondaryField = vec3f(
    sin(secondaryPhase.y) + cos(secondaryPhase.z),
    sin(secondaryPhase.z) + cos(secondaryPhase.x),
    sin(secondaryPhase.x) + cos(secondaryPhase.y)
  );
  let turbulence = primaryField + secondaryField * 0.35;
  return turbulence * 0.5;
}
`;

/** Semi-Lagrangian velocity advection with buoyancy, curl turbulence, and emitter momentum. */
export const VOLUMETRIC_FIRE_VELOCITY_ADVECTION_SHADER = /* wgsl */ `\
${VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL}

@group(0) @binding(0) var velocityInput: texture_3d<f32>;
@group(0) @binding(1) var combustionInput: texture_3d<f32>;
@group(0) @binding(2) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(3) var volumeSampler: sampler;
@group(0) @binding(4) var velocityOutput: texture_storage_3d<rgba16float, write>;
@group(0) @binding(5) var<uniform> uniforms: VolumetricFireSimulationUniforms;

${VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_EMITTER_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_TURBULENCE_FUNCTIONS_WGSL}

fn loadVelocityForVorticity(
  voxelCoordinate: vec3i,
  volumeDimensions: vec3u
) -> vec3f {
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    return vec3f(0.0);
  }
  return textureLoad(velocityInput, voxelCoordinate, 0).xyz;
}

fn getVorticity(voxelCoordinate: vec3i, volumeDimensions: vec3u) -> vec3f {
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    return vec3f(0.0);
  }
  let velocityNegativeX = loadVelocityForVorticity(
    voxelCoordinate - vec3i(1, 0, 0),
    volumeDimensions
  );
  let velocityPositiveX = loadVelocityForVorticity(
    voxelCoordinate + vec3i(1, 0, 0),
    volumeDimensions
  );
  let velocityNegativeY = loadVelocityForVorticity(
    voxelCoordinate - vec3i(0, 1, 0),
    volumeDimensions
  );
  let velocityPositiveY = loadVelocityForVorticity(
    voxelCoordinate + vec3i(0, 1, 0),
    volumeDimensions
  );
  let velocityNegativeZ = loadVelocityForVorticity(
    voxelCoordinate - vec3i(0, 0, 1),
    volumeDimensions
  );
  let velocityPositiveZ = loadVelocityForVorticity(
    voxelCoordinate + vec3i(0, 0, 1),
    volumeDimensions
  );
  let cellSize = getCellSize();
  return vec3f(
    (velocityPositiveY.z - velocityNegativeY.z) / (2.0 * cellSize.y) -
      (velocityPositiveZ.y - velocityNegativeZ.y) / (2.0 * cellSize.z),
    (velocityPositiveZ.x - velocityNegativeZ.x) / (2.0 * cellSize.z) -
      (velocityPositiveX.z - velocityNegativeX.z) / (2.0 * cellSize.x),
    (velocityPositiveX.y - velocityNegativeX.y) / (2.0 * cellSize.x) -
      (velocityPositiveY.x - velocityNegativeY.x) / (2.0 * cellSize.y)
  );
}

fn getVorticityConfinement(
  voxelCoordinate: vec3i,
  volumeDimensions: vec3u
) -> vec3f {
  let centerVorticity = getVorticity(voxelCoordinate, volumeDimensions);
  let cellSize = getCellSize();
  let vorticityMagnitudeGradient = vec3f(
    (
      length(getVorticity(voxelCoordinate + vec3i(1, 0, 0), volumeDimensions)) -
      length(getVorticity(voxelCoordinate - vec3i(1, 0, 0), volumeDimensions))
    ) / (2.0 * cellSize.x),
    (
      length(getVorticity(voxelCoordinate + vec3i(0, 1, 0), volumeDimensions)) -
      length(getVorticity(voxelCoordinate - vec3i(0, 1, 0), volumeDimensions))
    ) / (2.0 * cellSize.y),
    (
      length(getVorticity(voxelCoordinate + vec3i(0, 0, 1), volumeDimensions)) -
      length(getVorticity(voxelCoordinate - vec3i(0, 0, 1), volumeDimensions))
    ) / (2.0 * cellSize.z)
  );
  let gradientLengthSquared = dot(vorticityMagnitudeGradient, vorticityMagnitudeGradient);
  if (gradientLengthSquared <= 0.000001) {
    return vec3f(0.0);
  }
  let confinementNormal = vorticityMagnitudeGradient * inverseSqrt(gradientLengthSquared);
  return cross(confinementNormal, centerVorticity);
}

@compute @workgroup_size(${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let volumeDimensions = textureDimensions(velocityInput);
  if (any(globalInvocationId >= volumeDimensions)) {
    return;
  }

  let voxelCoordinate = vec3i(globalInvocationId);
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    textureStore(velocityOutput, voxelCoordinate, vec4f(0.0));
    return;
  }

  let textureCoordinate = getVoxelTextureCoordinate(globalInvocationId, volumeDimensions);
  let deltaTime = max(uniforms.gridSizeDeltaTime.w, 0.000001);
  let resetSimulation = uniforms.timeCounts.y >= 0.5;
  let sampledVelocityAtVoxel = textureSampleLevel(
    velocityInput,
    volumeSampler,
    textureCoordinate,
    0.0
  ).xyz;
  let velocityAtVoxel = select(sampledVelocityAtVoxel, vec3f(0.0), resetSimulation);
  let requestedPreviousTextureCoordinate = textureCoordinate -
    velocityAtVoxel * deltaTime / max(uniforms.gridSizeDeltaTime.xyz, vec3f(1.0));
  let previousTextureCoordinate = traceBackThroughFluid(
    textureCoordinate,
    requestedPreviousTextureCoordinate,
    volumeDimensions
  );

  let advectedVelocity = textureSampleLevel(
    velocityInput,
    volumeSampler,
    previousTextureCoordinate,
    0.0
  ).xyz;
  var velocity = select(advectedVelocity, vec3f(0.0), resetSimulation);
  let sampledCombustion = textureSampleLevel(
    combustionInput,
    volumeSampler,
    textureCoordinate,
    0.0
  );
  let combustion = select(sampledCombustion, vec4f(0.0), resetSimulation);
  let buoyancy = uniforms.forces.x * max(combustion.y, 0.0);
  let smokeWeight = uniforms.forces.y * combustion.x;
  velocity.y += (buoyancy - smokeWeight) * deltaTime;

  let simulationPosition = getSimulationPosition(textureCoordinate);
  let turbulenceWeight = clamp(
    combustion.x + max(combustion.y, 0.0) * 0.25,
    0.0,
    1.0
  );
  velocity += getDivergenceFreeTurbulence(simulationPosition) *
    uniforms.forces.z * turbulenceWeight * deltaTime;
  velocity += getVorticityConfinement(voxelCoordinate, volumeDimensions) *
    uniforms.forces.w * deltaTime * select(1.0, 0.0, resetSimulation);

  let activeEmitterCount = getActiveEmitterCount();
  for (var emitterIndex = 0u; emitterIndex < activeEmitterCount; emitterIndex++) {
    let velocityImpulse = uniforms.emitters[emitterIndex].velocityImpulse;
    let sourceRate = max(uniforms.emitters[emitterIndex].source.w, 0.0);
    let emitterWeight = getEmitterWeight(simulationPosition, emitterIndex) * sourceRate;
    velocity += velocityImpulse.xyz * velocityImpulse.w * emitterWeight * deltaTime;
  }

  velocity *= pow(clamp(uniforms.dissipation.x, 0.0, 1.0), deltaTime * 60.0);
  velocity = constrainVelocityAtObstacle(velocity, voxelCoordinate, volumeDimensions, true);
  textureStore(velocityOutput, voxelCoordinate, vec4f(velocity, 0.0));
}
`;

/** Explicit WebGPU bindings for {@link VOLUMETRIC_FIRE_VELOCITY_ADVECTION_SHADER}. */
export const VOLUMETRIC_FIRE_VELOCITY_ADVECTION_BINDINGS: ComputeShaderLayout['bindings'] = [
  {
    type: 'texture',
    name: 'velocityInput',
    group: 0,
    location: 0,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'combustionInput',
    group: 0,
    location: 1,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'obstacleTexture',
    group: 0,
    location: 2,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'sampler',
    name: 'volumeSampler',
    group: 0,
    location: 3,
    samplerType: 'filtering'
  },
  {
    type: 'storage',
    name: 'velocityOutput',
    group: 0,
    location: 4,
    format: 'rgba16float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 5,
    minBindingSize: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH
  }
];

/** Computes velocity divergence and clears the pressure seed in one dispatch. */
export const VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_SHADER = /* wgsl */ `\
${VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL}

@group(0) @binding(0) var velocityInput: texture_3d<f32>;
@group(0) @binding(1) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(2) var divergenceOutput: texture_storage_3d<r32float, write>;
@group(0) @binding(3) var pressureOutput: texture_storage_3d<r32float, write>;
@group(0) @binding(4) var<uniform> uniforms: VolumetricFireSimulationUniforms;

${VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL}

fn loadBoundaryVelocity(
  voxelCoordinate: vec3i,
  volumeDimensions: vec3u
) -> vec3f {
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    return vec3f(0.0);
  }
  return textureLoad(velocityInput, voxelCoordinate, 0).xyz;
}

@compute @workgroup_size(${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let volumeDimensions = textureDimensions(velocityInput);
  if (any(globalInvocationId >= volumeDimensions)) {
    return;
  }

  let voxelCoordinate = vec3i(globalInvocationId);
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    textureStore(divergenceOutput, voxelCoordinate, vec4f(0.0));
    textureStore(pressureOutput, voxelCoordinate, vec4f(0.0));
    return;
  }

  let centerVelocity = textureLoad(velocityInput, voxelCoordinate, 0).xyz;
  let velocityNegativeX = loadBoundaryVelocity(
    voxelCoordinate - vec3i(1, 0, 0),
    volumeDimensions
  );
  let velocityNegativeY = loadBoundaryVelocity(
    voxelCoordinate - vec3i(0, 1, 0),
    volumeDimensions
  );
  let velocityNegativeZ = loadBoundaryVelocity(
    voxelCoordinate - vec3i(0, 0, 1),
    volumeDimensions
  );
  let cellSize = getCellSize();
  let divergence =
    (centerVelocity.x - velocityNegativeX.x) / cellSize.x +
    (centerVelocity.y - velocityNegativeY.y) / cellSize.y +
    (centerVelocity.z - velocityNegativeZ.z) / cellSize.z;

  textureStore(divergenceOutput, voxelCoordinate, vec4f(divergence, 0.0, 0.0, 0.0));
  textureStore(pressureOutput, voxelCoordinate, vec4f(0.0));
}
`;

/** Explicit WebGPU bindings for the combined divergence and pressure-clear pass. */
export const VOLUMETRIC_FIRE_DIVERGENCE_PRESSURE_CLEAR_BINDINGS: ComputeShaderLayout['bindings'] = [
  {
    type: 'texture',
    name: 'velocityInput',
    group: 0,
    location: 0,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'obstacleTexture',
    group: 0,
    location: 1,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'storage',
    name: 'divergenceOutput',
    group: 0,
    location: 2,
    format: 'r32float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'storage',
    name: 'pressureOutput',
    group: 0,
    location: 3,
    format: 'r32float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 4,
    minBindingSize: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH
  }
];

/** One obstacle-aware Jacobi iteration. Alternate pressure source and destination textures. */
export const VOLUMETRIC_FIRE_PRESSURE_JACOBI_SHADER = /* wgsl */ `\
${VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL}

@group(0) @binding(0) var pressureInput: texture_3d<f32>;
@group(0) @binding(1) var divergenceInput: texture_3d<f32>;
@group(0) @binding(2) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(3) var pressureOutput: texture_storage_3d<r32float, write>;
@group(0) @binding(4) var<uniform> uniforms: VolumetricFireSimulationUniforms;

${VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL}

fn loadBoundaryPressure(
  voxelCoordinate: vec3i,
  centerPressure: f32,
  volumeDimensions: vec3u
) -> f32 {
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    return centerPressure;
  }
  return textureLoad(pressureInput, voxelCoordinate, 0).r;
}

@compute @workgroup_size(${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let volumeDimensions = textureDimensions(pressureInput);
  if (any(globalInvocationId >= volumeDimensions)) {
    return;
  }

  let voxelCoordinate = vec3i(globalInvocationId);
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    textureStore(pressureOutput, voxelCoordinate, vec4f(0.0));
    return;
  }

  let centerPressure = textureLoad(pressureInput, voxelCoordinate, 0).r;
  let pressureNegativeX = loadBoundaryPressure(
    voxelCoordinate - vec3i(1, 0, 0),
    centerPressure,
    volumeDimensions
  );
  let pressurePositiveX = loadBoundaryPressure(
    voxelCoordinate + vec3i(1, 0, 0),
    centerPressure,
    volumeDimensions
  );
  let pressureNegativeY = loadBoundaryPressure(
    voxelCoordinate - vec3i(0, 1, 0),
    centerPressure,
    volumeDimensions
  );
  let pressurePositiveY = loadBoundaryPressure(
    voxelCoordinate + vec3i(0, 1, 0),
    centerPressure,
    volumeDimensions
  );
  let pressureNegativeZ = loadBoundaryPressure(
    voxelCoordinate - vec3i(0, 0, 1),
    centerPressure,
    volumeDimensions
  );
  let pressurePositiveZ = loadBoundaryPressure(
    voxelCoordinate + vec3i(0, 0, 1),
    centerPressure,
    volumeDimensions
  );

  let cellSize = getCellSize();
  let inverseCellSizeSquared = vec3f(1.0) / (cellSize * cellSize);
  let neighborPressure =
    (pressureNegativeX + pressurePositiveX) * inverseCellSizeSquared.x +
    (pressureNegativeY + pressurePositiveY) * inverseCellSizeSquared.y +
    (pressureNegativeZ + pressurePositiveZ) * inverseCellSizeSquared.z;
  let coefficientSum = 2.0 * (
    inverseCellSizeSquared.x +
    inverseCellSizeSquared.y +
    inverseCellSizeSquared.z
  );
  let deltaTime = max(uniforms.gridSizeDeltaTime.w, 0.000001);
  let divergence = textureLoad(divergenceInput, voxelCoordinate, 0).r;
  let pressure = (neighborPressure - divergence / deltaTime) / coefficientSum;
  textureStore(pressureOutput, voxelCoordinate, vec4f(pressure, 0.0, 0.0, 0.0));
}
`;

/** Explicit WebGPU bindings for one Jacobi pressure iteration. */
export const VOLUMETRIC_FIRE_PRESSURE_JACOBI_BINDINGS: ComputeShaderLayout['bindings'] = [
  {
    type: 'texture',
    name: 'pressureInput',
    group: 0,
    location: 0,
    viewDimension: '3d',
    sampleType: 'unfilterable-float'
  },
  {
    type: 'texture',
    name: 'divergenceInput',
    group: 0,
    location: 1,
    viewDimension: '3d',
    sampleType: 'unfilterable-float'
  },
  {
    type: 'texture',
    name: 'obstacleTexture',
    group: 0,
    location: 2,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'storage',
    name: 'pressureOutput',
    group: 0,
    location: 3,
    format: 'r32float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 4,
    minBindingSize: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH
  }
];

/** Subtracts the solved pressure gradient and reapplies solid-boundary constraints. */
export const VOLUMETRIC_FIRE_PRESSURE_PROJECTION_SHADER = /* wgsl */ `\
${VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL}

@group(0) @binding(0) var velocityInput: texture_3d<f32>;
@group(0) @binding(1) var pressureInput: texture_3d<f32>;
@group(0) @binding(2) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(3) var velocityOutput: texture_storage_3d<rgba16float, write>;
@group(0) @binding(4) var<uniform> uniforms: VolumetricFireSimulationUniforms;

${VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL}

fn loadBoundaryPressure(
  voxelCoordinate: vec3i,
  centerPressure: f32,
  volumeDimensions: vec3u
) -> f32 {
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    return centerPressure;
  }
  return textureLoad(pressureInput, voxelCoordinate, 0).r;
}

@compute @workgroup_size(${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let volumeDimensions = textureDimensions(velocityInput);
  if (any(globalInvocationId >= volumeDimensions)) {
    return;
  }

  let voxelCoordinate = vec3i(globalInvocationId);
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    textureStore(velocityOutput, voxelCoordinate, vec4f(0.0));
    return;
  }

  let centerPressure = textureLoad(pressureInput, voxelCoordinate, 0).r;
  let pressurePositiveX = loadBoundaryPressure(
    voxelCoordinate + vec3i(1, 0, 0),
    centerPressure,
    volumeDimensions
  );
  let pressurePositiveY = loadBoundaryPressure(
    voxelCoordinate + vec3i(0, 1, 0),
    centerPressure,
    volumeDimensions
  );
  let pressurePositiveZ = loadBoundaryPressure(
    voxelCoordinate + vec3i(0, 0, 1),
    centerPressure,
    volumeDimensions
  );

  let cellSize = getCellSize();
  let pressureGradient = vec3f(
    (pressurePositiveX - centerPressure) / cellSize.x,
    (pressurePositiveY - centerPressure) / cellSize.y,
    (pressurePositiveZ - centerPressure) / cellSize.z
  );
  let deltaTime = max(uniforms.gridSizeDeltaTime.w, 0.000001);
  var velocity = textureLoad(velocityInput, voxelCoordinate, 0).xyz -
    pressureGradient * deltaTime;
  velocity = constrainVelocityAtObstacle(velocity, voxelCoordinate, volumeDimensions, false);
  textureStore(velocityOutput, voxelCoordinate, vec4f(velocity, 0.0));
}
`;

/** Explicit WebGPU bindings for pressure projection. */
export const VOLUMETRIC_FIRE_PRESSURE_PROJECTION_BINDINGS: ComputeShaderLayout['bindings'] = [
  {
    type: 'texture',
    name: 'velocityInput',
    group: 0,
    location: 0,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'pressureInput',
    group: 0,
    location: 1,
    viewDimension: '3d',
    sampleType: 'unfilterable-float'
  },
  {
    type: 'texture',
    name: 'obstacleTexture',
    group: 0,
    location: 2,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'storage',
    name: 'velocityOutput',
    group: 0,
    location: 3,
    format: 'rgba16float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 4,
    minBindingSize: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH
  }
];

/** Semi-Lagrangian state advection, fuel reaction, cooling, dissipation, and source injection. */
export const VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_SHADER = /* wgsl */ `\
${VOLUMETRIC_FIRE_SIMULATION_UNIFORM_WGSL}

@group(0) @binding(0) var combustionInput: texture_3d<f32>;
@group(0) @binding(1) var velocityInput: texture_3d<f32>;
@group(0) @binding(2) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(3) var volumeSampler: sampler;
@group(0) @binding(4) var combustionOutput: texture_storage_3d<rgba16float, write>;
@group(0) @binding(5) var<uniform> uniforms: VolumetricFireSimulationUniforms;

${VOLUMETRIC_FIRE_COORDINATE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_OBSTACLE_FUNCTIONS_WGSL}
${VOLUMETRIC_FIRE_EMITTER_FUNCTIONS_WGSL}

@compute @workgroup_size(${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE}, ${VOLUMETRIC_FIRE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let volumeDimensions = textureDimensions(combustionInput);
  if (any(globalInvocationId >= volumeDimensions)) {
    return;
  }

  let voxelCoordinate = vec3i(globalInvocationId);
  if (isObstacleVoxel(voxelCoordinate, volumeDimensions)) {
    textureStore(combustionOutput, voxelCoordinate, vec4f(0.0));
    return;
  }

  let textureCoordinate = getVoxelTextureCoordinate(globalInvocationId, volumeDimensions);
  let deltaTime = max(uniforms.gridSizeDeltaTime.w, 0.000001);
  let velocity = textureSampleLevel(
    velocityInput,
    volumeSampler,
    textureCoordinate,
    0.0
  ).xyz;
  let requestedPreviousTextureCoordinate = textureCoordinate -
    velocity * deltaTime / max(uniforms.gridSizeDeltaTime.xyz, vec3f(1.0));
  let previousTextureCoordinate = traceBackThroughFluid(
    textureCoordinate,
    requestedPreviousTextureCoordinate,
    volumeDimensions
  );

  let sampledPreviousCombustion = textureSampleLevel(
    combustionInput,
    volumeSampler,
    previousTextureCoordinate,
    0.0
  );
  let previousCombustion = select(
    sampledPreviousCombustion,
    vec4f(0.0),
    uniforms.timeCounts.y >= 0.5
  );
  var density = max(previousCombustion.x, 0.0);
  var temperature = max(previousCombustion.y, 0.0);
  var fuel = max(previousCombustion.z, 0.0);
  var age = max(previousCombustion.w, 0.0);

  let ignition = smoothstep(0.08, 0.25, temperature);
  let burnedFuel = min(
    fuel,
    fuel * ignition * max(uniforms.reaction.x, 0.0) * deltaTime
  );
  fuel -= burnedFuel;
  temperature += burnedFuel * uniforms.reaction.y;
  density += burnedFuel * uniforms.reaction.z;

  density *= pow(clamp(uniforms.dissipation.y, 0.0, 1.0), deltaTime * 60.0);
  temperature *= pow(clamp(uniforms.dissipation.z, 0.0, 1.0), deltaTime * 60.0);
  temperature = max(temperature - max(uniforms.reaction.w, 0.0) * deltaTime, 0.0);
  fuel *= pow(clamp(uniforms.dissipation.w, 0.0, 1.0), deltaTime * 60.0);

  let simulationPosition = getSimulationPosition(textureCoordinate);
  let activeEmitterCount = getActiveEmitterCount();
  var injectionWeight = 0.0;
  for (var emitterIndex = 0u; emitterIndex < activeEmitterCount; emitterIndex++) {
    let source = uniforms.emitters[emitterIndex].source;
    let emitterWeight = getEmitterWeight(simulationPosition, emitterIndex) *
      max(source.w, 0.0);
    density += source.x * emitterWeight * deltaTime;
    temperature += source.y * emitterWeight * deltaTime;
    fuel += source.z * emitterWeight * deltaTime;
    injectionWeight = max(injectionWeight, emitterWeight);
  }

  if (injectionWeight > 0.001) {
    age = mix(age, 0.0, clamp(injectionWeight * deltaTime * 4.0, 0.0, 1.0));
  } else if (density > 0.0001 || fuel > 0.0001) {
    age += deltaTime;
  } else {
    age = 0.0;
  }

  density = clamp(density, 0.0, 64.0);
  temperature = clamp(temperature, 0.0, 64.0);
  fuel = clamp(fuel, 0.0, 64.0);
  age = clamp(age, 0.0, 64.0);
  textureStore(
    combustionOutput,
    voxelCoordinate,
    vec4f(density, temperature, fuel, age)
  );
}
`;

/** Explicit WebGPU bindings for combustion-state advection and reaction. */
export const VOLUMETRIC_FIRE_COMBUSTION_ADVECTION_BINDINGS: ComputeShaderLayout['bindings'] = [
  {
    type: 'texture',
    name: 'combustionInput',
    group: 0,
    location: 0,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'velocityInput',
    group: 0,
    location: 1,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'texture',
    name: 'obstacleTexture',
    group: 0,
    location: 2,
    viewDimension: '3d',
    sampleType: 'float'
  },
  {
    type: 'sampler',
    name: 'volumeSampler',
    group: 0,
    location: 3,
    samplerType: 'filtering'
  },
  {
    type: 'storage',
    name: 'combustionOutput',
    group: 0,
    location: 4,
    format: 'rgba16float',
    viewDimension: '3d',
    access: 'write-only'
  },
  {
    type: 'uniform',
    name: 'uniforms',
    group: 0,
    location: 5,
    minBindingSize: VOLUMETRIC_FIRE_SIMULATION_UNIFORM_BYTE_LENGTH
  }
];
