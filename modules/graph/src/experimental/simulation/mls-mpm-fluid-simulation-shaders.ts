// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ComputeShaderLayout} from '@luma.gl/core';

export const MLS_MPM_FLUID_WORKGROUP_SIZE = 64;
export const MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT = 12;
export const MLS_MPM_FLUID_PARTICLE_BYTE_LENGTH =
  MLS_MPM_FLUID_PARTICLE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
export const MLS_MPM_FLUID_GRID_CELL_BYTE_LENGTH = 3 * Int32Array.BYTES_PER_ELEMENT;
export const MLS_MPM_FLUID_MAX_FIXED_POINT_SCALE = 1_048_576;
export const MLS_MPM_FLUID_MINIMUM_DEFORMATION = 0.6;
export const MLS_MPM_FLUID_MAXIMUM_DEFORMATION = 1.4;
export const MLS_MPM_FLUID_UNIFORM_FLOAT_COUNT = 20;
export const MLS_MPM_FLUID_UNIFORM_BYTE_LENGTH =
  MLS_MPM_FLUID_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

export const MLS_MPM_FLUID_UNIFORM_OFFSETS = {
  gridSizeDeltaTime: 0,
  material: 4,
  gravityBoundary: 8,
  forcePositionRadius: 12,
  forceVectorScales: 16
} as const;

const MLS_MPM_FLUID_TYPES_WGSL = /* wgsl */ `\
struct MLSMPMParticleState {
  position: vec2f,
  velocity: vec2f,
  affineColumn0: vec2f,
  affineColumn1: vec2f,
  deformationPadding: vec4f,
};

struct MLSMPMGridCell {
  mass: atomic<i32>,
  velocityOrMomentumX: atomic<i32>,
  velocityOrMomentumY: atomic<i32>,
};

struct MLSMPMFluidUniforms {
  gridSizeDeltaTime: vec4f,
  material: vec4f,
  gravityBoundary: vec4f,
  forcePositionRadius: vec4f,
  forceVectorScales: vec4f,
};
`;

const MLS_MPM_FLUID_FUNCTIONS_WGSL = /* wgsl */ `\
fn getGridSize() -> vec2u {
  return vec2u(uniforms.gridSizeDeltaTime.xy);
}

fn getGridIndex(gridCoordinate: vec2i, gridSize: vec2u) -> u32 {
  return u32(gridCoordinate.y) * gridSize.x + u32(gridCoordinate.x);
}

fn isGridCoordinateInside(gridCoordinate: vec2i, gridSize: vec2u) -> bool {
  return all(gridCoordinate >= vec2i(0)) && all(gridCoordinate < vec2i(gridSize));
}

fn getQuadraticWeights(fraction: f32) -> array<f32, 3> {
  return array<f32, 3>(
    0.5 * (1.5 - fraction) * (1.5 - fraction),
    0.75 - (fraction - 1.0) * (fraction - 1.0),
    0.5 * (fraction - 0.5) * (fraction - 0.5)
  );
}

fn clampVectorLength(value: vec2f, maximumLength: f32) -> vec2f {
  let valueLength = length(value);
  if (valueLength <= maximumLength || valueLength <= 0.000001) {
    return value;
  }
  return value * (maximumLength / valueLength);
}
`;

export const MLS_MPM_FLUID_CLEAR_GRID_SHADER = /* wgsl */ `\
struct MLSMPMGridCell {
  mass: atomic<i32>,
  velocityOrMomentumX: atomic<i32>,
  velocityOrMomentumY: atomic<i32>,
};

@group(0) @binding(0) var<storage, read_write> grid: array<MLSMPMGridCell>;

@compute @workgroup_size(${MLS_MPM_FLUID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let gridIndex = globalInvocationId.x;
  if (gridIndex >= arrayLength(&grid)) {
    return;
  }
  atomicStore(&grid[gridIndex].mass, 0);
  atomicStore(&grid[gridIndex].velocityOrMomentumX, 0);
  atomicStore(&grid[gridIndex].velocityOrMomentumY, 0);
}
`;

export const MLS_MPM_FLUID_PARTICLE_TO_GRID_SHADER = /* wgsl */ `\
${MLS_MPM_FLUID_TYPES_WGSL}

@group(0) @binding(0) var<storage, read> particlesInput: array<MLSMPMParticleState>;
@group(0) @binding(1) var<storage, read_write> grid: array<MLSMPMGridCell>;
@group(0) @binding(2) var<uniform> uniforms: MLSMPMFluidUniforms;

${MLS_MPM_FLUID_FUNCTIONS_WGSL}

@compute @workgroup_size(${MLS_MPM_FLUID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let particleIndex = globalInvocationId.x;
  let particleCount = u32(uniforms.gridSizeDeltaTime.w);
  if (particleIndex >= particleCount) {
    return;
  }

  let particle = particlesInput[particleIndex];
  let gridSize = getGridSize();
  let gridExtent = vec2f(gridSize - vec2u(1));
  let cellSize = vec2f(1.0) / gridExtent;
  let inverseCellSizeSquared = gridExtent * gridExtent;
  let gridPosition = clamp(particle.position, vec2f(0.0), vec2f(1.0)) * gridExtent;
  let baseCoordinate = vec2i(floor(gridPosition - vec2f(0.5)));
  let fraction = gridPosition - vec2f(baseCoordinate);
  let weightsX = getQuadraticWeights(fraction.x);
  let weightsY = getQuadraticWeights(fraction.y);
  let particleMass = uniforms.material.x;
  let restDensity = uniforms.material.y;
  let stiffness = uniforms.material.z;
  let maximumVelocity = uniforms.gravityBoundary.w;
  let massScale = uniforms.forceVectorScales.z;
  let velocityScale = uniforms.forceVectorScales.w;
  let deformation = clamp(
    particle.deformationPadding.x,
    ${MLS_MPM_FLUID_MINIMUM_DEFORMATION},
    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}
  );
  let pressure = stiffness * (1.0 - deformation);
  let particleVolume = particleMass * deformation / restDensity;
  let timeStep = uniforms.gridSizeDeltaTime.z;
  let stressCoefficient = 4.0 * timeStep * particleVolume * pressure;
  let affine = mat2x2f(particle.affineColumn0, particle.affineColumn1);

  for (var yOffset = 0i; yOffset < 3i; yOffset++) {
    for (var xOffset = 0i; xOffset < 3i; xOffset++) {
      let gridCoordinate = baseCoordinate + vec2i(xOffset, yOffset);
      if (!isGridCoordinateInside(gridCoordinate, gridSize)) {
        continue;
      }
      let weight = weightsX[u32(xOffset)] * weightsY[u32(yOffset)];
      let gridDisplacement = vec2f(gridCoordinate) - gridPosition;
      let normalizedDisplacement = gridDisplacement * cellSize;
      let stressMomentum = stressCoefficient * normalizedDisplacement * inverseCellSizeSquared;
      let apicMomentum = particleMass * (affine * normalizedDisplacement);
      let transferredMomentum = weight *
        (particleMass * particle.velocity + apicMomentum + stressMomentum);
      let boundedMomentum = clamp(
        transferredMomentum,
        vec2f(-particleMass * maximumVelocity),
        vec2f(particleMass * maximumVelocity)
      );
      let gridIndex = getGridIndex(gridCoordinate, gridSize);
      atomicAdd(
        &grid[gridIndex].mass,
        max(0, i32(round(weight * particleMass * massScale)))
      );
      atomicAdd(
        &grid[gridIndex].velocityOrMomentumX,
        i32(round(boundedMomentum.x * velocityScale))
      );
      atomicAdd(
        &grid[gridIndex].velocityOrMomentumY,
        i32(round(boundedMomentum.y * velocityScale))
      );
    }
  }
}
`;

export const MLS_MPM_FLUID_UPDATE_GRID_SHADER = /* wgsl */ `\
${MLS_MPM_FLUID_TYPES_WGSL}

@group(0) @binding(0) var<storage, read_write> grid: array<MLSMPMGridCell>;
@group(0) @binding(1) var<uniform> uniforms: MLSMPMFluidUniforms;

${MLS_MPM_FLUID_FUNCTIONS_WGSL}

@compute @workgroup_size(${MLS_MPM_FLUID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let gridIndex = globalInvocationId.x;
  let gridSize = getGridSize();
  let gridCellCount = gridSize.x * gridSize.y;
  if (gridIndex >= gridCellCount) {
    return;
  }

  let massFixedPoint = atomicLoad(&grid[gridIndex].mass);
  if (massFixedPoint <= 0) {
    atomicStore(&grid[gridIndex].velocityOrMomentumX, 0);
    atomicStore(&grid[gridIndex].velocityOrMomentumY, 0);
    return;
  }

  let massScale = uniforms.forceVectorScales.z;
  let velocityScale = uniforms.forceVectorScales.w;
  let mass = f32(massFixedPoint) / massScale;
  let momentum = vec2f(
    f32(atomicLoad(&grid[gridIndex].velocityOrMomentumX)),
    f32(atomicLoad(&grid[gridIndex].velocityOrMomentumY))
  ) / velocityScale;
  let timeStep = uniforms.gridSizeDeltaTime.z;
  var velocity = momentum / max(mass, 0.000001);
  velocity += uniforms.gravityBoundary.xy * timeStep;

  if (uniforms.forcePositionRadius.w >= 0.5) {
    let gridCoordinate = vec2u(gridIndex % gridSize.x, gridIndex / gridSize.x);
    let gridPosition = vec2f(gridCoordinate) / vec2f(gridSize - vec2u(1));
    let forceRadius = max(uniforms.forcePositionRadius.z, 0.000001);
    let normalizedForceDistance = distance(gridPosition, uniforms.forcePositionRadius.xy) /
      forceRadius;
    let forceWeight = 1.0 - smoothstep(0.0, 1.0, normalizedForceDistance);
    velocity += uniforms.forceVectorScales.xy * forceWeight * timeStep;
  }

  let velocityDamping = uniforms.material.w;
  velocity *= 1.0 / (1.0 + velocityDamping * timeStep);
  let gridCoordinate = vec2u(gridIndex % gridSize.x, gridIndex / gridSize.x);
  let boundaryCells = u32(uniforms.gravityBoundary.z);
  if (gridCoordinate.x < boundaryCells && velocity.x < 0.0) {
    velocity.x = 0.0;
  }
  if (gridCoordinate.x + boundaryCells >= gridSize.x && velocity.x > 0.0) {
    velocity.x = 0.0;
  }
  if (gridCoordinate.y < boundaryCells && velocity.y < 0.0) {
    velocity.y = 0.0;
  }
  if (gridCoordinate.y + boundaryCells >= gridSize.y && velocity.y > 0.0) {
    velocity.y = 0.0;
  }
  velocity = clampVectorLength(velocity, uniforms.gravityBoundary.w);
  atomicStore(
    &grid[gridIndex].velocityOrMomentumX,
    i32(round(velocity.x * velocityScale))
  );
  atomicStore(
    &grid[gridIndex].velocityOrMomentumY,
    i32(round(velocity.y * velocityScale))
  );
}
`;

export const MLS_MPM_FLUID_GRID_TO_PARTICLE_SHADER = /* wgsl */ `\
${MLS_MPM_FLUID_TYPES_WGSL}

@group(0) @binding(0) var<storage, read> particlesInput: array<MLSMPMParticleState>;
@group(0) @binding(1) var<storage, read_write> grid: array<MLSMPMGridCell>;
@group(0) @binding(2) var<storage, read_write> particlesOutput: array<MLSMPMParticleState>;
@group(0) @binding(3) var<uniform> uniforms: MLSMPMFluidUniforms;

${MLS_MPM_FLUID_FUNCTIONS_WGSL}

@compute @workgroup_size(${MLS_MPM_FLUID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  let particleIndex = globalInvocationId.x;
  let particleCount = u32(uniforms.gridSizeDeltaTime.w);
  if (particleIndex >= particleCount) {
    return;
  }

  let particle = particlesInput[particleIndex];
  let gridSize = getGridSize();
  let gridExtent = vec2f(gridSize - vec2u(1));
  let cellSize = vec2f(1.0) / gridExtent;
  let inverseCellSizeSquared = gridExtent * gridExtent;
  let gridPosition = clamp(particle.position, vec2f(0.0), vec2f(1.0)) * gridExtent;
  let baseCoordinate = vec2i(floor(gridPosition - vec2f(0.5)));
  let fraction = gridPosition - vec2f(baseCoordinate);
  let weightsX = getQuadraticWeights(fraction.x);
  let weightsY = getQuadraticWeights(fraction.y);
  let velocityScale = uniforms.forceVectorScales.w;
  var velocity = vec2f(0.0);
  var affine = mat2x2f(vec2f(0.0), vec2f(0.0));

  for (var yOffset = 0i; yOffset < 3i; yOffset++) {
    for (var xOffset = 0i; xOffset < 3i; xOffset++) {
      let gridCoordinate = baseCoordinate + vec2i(xOffset, yOffset);
      if (!isGridCoordinateInside(gridCoordinate, gridSize)) {
        continue;
      }
      let weight = weightsX[u32(xOffset)] * weightsY[u32(yOffset)];
      let gridIndex = getGridIndex(gridCoordinate, gridSize);
      let gridVelocity = vec2f(
        f32(atomicLoad(&grid[gridIndex].velocityOrMomentumX)),
        f32(atomicLoad(&grid[gridIndex].velocityOrMomentumY))
      ) / velocityScale;
      let normalizedDisplacement = (vec2f(gridCoordinate) - gridPosition) * cellSize;
      velocity += weight * gridVelocity;
      affine += 4.0 * weight * mat2x2f(
        gridVelocity * normalizedDisplacement.x * inverseCellSizeSquared.x,
        gridVelocity * normalizedDisplacement.y * inverseCellSizeSquared.y
      );
    }
  }

  let maximumVelocity = uniforms.gravityBoundary.w;
  velocity = clampVectorLength(velocity, maximumVelocity);
  let timeStep = uniforms.gridSizeDeltaTime.z;
  let boundaryCells = uniforms.gravityBoundary.z;
  let minimumPosition = vec2f(boundaryCells) / gridExtent;
  let maximumPosition = vec2f(1.0) - minimumPosition;
  var position = particle.position + velocity * timeStep;
  if (position.x < minimumPosition.x && velocity.x < 0.0) {
    velocity.x = 0.0;
  }
  if (position.x > maximumPosition.x && velocity.x > 0.0) {
    velocity.x = 0.0;
  }
  if (position.y < minimumPosition.y && velocity.y < 0.0) {
    velocity.y = 0.0;
  }
  if (position.y > maximumPosition.y && velocity.y > 0.0) {
    velocity.y = 0.0;
  }
  position = clamp(position, minimumPosition, maximumPosition);
  let velocityDivergence = affine[0].x + affine[1].y;
  let deformation = clamp(
    particle.deformationPadding.x * (1.0 + timeStep * velocityDivergence),
    ${MLS_MPM_FLUID_MINIMUM_DEFORMATION},
    ${MLS_MPM_FLUID_MAXIMUM_DEFORMATION}
  );

  var outputParticle: MLSMPMParticleState;
  outputParticle.position = position;
  outputParticle.velocity = velocity;
  outputParticle.affineColumn0 = affine[0];
  outputParticle.affineColumn1 = affine[1];
  outputParticle.deformationPadding = vec4f(deformation, 0.0, 0.0, 0.0);
  particlesOutput[particleIndex] = outputParticle;
}
`;

export const MLS_MPM_FLUID_CLEAR_GRID_BINDINGS: ComputeShaderLayout['bindings'] = [
  {type: 'storage', name: 'grid', group: 0, location: 0}
];

export const MLS_MPM_FLUID_PARTICLE_TO_GRID_BINDINGS: ComputeShaderLayout['bindings'] = [
  {type: 'read-only-storage', name: 'particlesInput', group: 0, location: 0},
  {type: 'storage', name: 'grid', group: 0, location: 1},
  {type: 'uniform', name: 'uniforms', group: 0, location: 2}
];

export const MLS_MPM_FLUID_UPDATE_GRID_BINDINGS: ComputeShaderLayout['bindings'] = [
  {type: 'storage', name: 'grid', group: 0, location: 0},
  {type: 'uniform', name: 'uniforms', group: 0, location: 1}
];

export const MLS_MPM_FLUID_GRID_TO_PARTICLE_BINDINGS: ComputeShaderLayout['bindings'] = [
  {type: 'read-only-storage', name: 'particlesInput', group: 0, location: 0},
  {type: 'storage', name: 'grid', group: 0, location: 1},
  {type: 'storage', name: 'particlesOutput', group: 0, location: 2},
  {type: 'uniform', name: 'uniforms', group: 0, location: 3}
];
