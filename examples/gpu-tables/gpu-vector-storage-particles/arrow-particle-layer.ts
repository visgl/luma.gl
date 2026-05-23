// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowFixedSizeListValues,
  isArrowFixedSizeListVector,
  makeArrowFixedSizeListVector,
  makeArrowGPUVector
} from '@luma.gl/arrow';
import type {ComputeShaderLayout, Device, RenderPass, ShaderLayout} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {GPUVector, TableComputation, TableTransform} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';

const DEFAULT_PARTICLE_COUNT = 4096;
const WORKGROUP_SIZE = 64;
const PARTICLE_SIZE = 0.014;
const DEFAULT_RESET_INTERVAL_MILLISECONDS = 8_000;

export type ArrowParticleLayerColumns = {
  positions?: string;
  velocities?: string;
};

export type ArrowParticleLayerProps = {
  data?: arrow.Table;
  columns?: ArrowParticleLayerColumns;
  resetIntervalMilliseconds?: number;
};

type ArrowParticleVectorType = arrow.FixedSizeList<arrow.Float32>;
type ArrowParticleLayerResolvedProps = {
  data: arrow.Table;
  columns: Required<ArrowParticleLayerColumns>;
  resetIntervalMilliseconds: number;
};

const DEFAULT_COLUMNS: Required<ArrowParticleLayerColumns> = {
  positions: 'positions',
  velocities: 'velocities'
};

const WEBGPU_RENDER_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read> particlePositions : array<vec2<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec3<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let particlePosition = particlePositions[inputs.instanceIndex];
  let corner = getQuadCorner(inputs.vertexIndex % 6u) * ${PARTICLE_SIZE};
  let colorPhase = f32(inputs.instanceIndex % 11u) / 10.0;

  outputs.Position = vec4<f32>(particlePosition + corner, 0.0, 1.0);
  outputs.color = vec3<f32>(0.25 + colorPhase * 0.7, 0.92 - colorPhase * 0.48, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.color, 1.0);
}
`;

const WEBGL_TRANSFORM_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 particlePositions;
in vec2 particleVelocities;
out vec2 nextParticlePositions;
out vec2 nextParticleVelocities;

void main() {
  vec2 position = particlePositions + particleVelocities;
  vec2 velocity = particleVelocities;

  if (position.x < -0.98 || position.x > 0.98) {
    velocity.x = -velocity.x;
    position.x = clamp(position.x, -0.98, 0.98);
  }

  if (position.y < -0.98 || position.y > 0.98) {
    velocity.y = -velocity.y;
    position.y = clamp(position.y, -0.98, 0.98);
  }

  nextParticlePositions = position;
  nextParticleVelocities = velocity;
}
`;

const WEBGL_RENDER_VERTEX_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 particlePositions;
out vec3 vColor;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6) * ${PARTICLE_SIZE};
  float colorPhase = float(gl_InstanceID % 11) / 10.0;
  gl_Position = vec4(particlePositions + corner, 0.0, 1.0);
  vColor = vec3(0.25 + colorPhase * 0.7, 0.92 - colorPhase * 0.48, 1.0);
}
`;

const WEBGL_RENDER_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

const COMPUTE_SHADER_LAYOUT = {
  bindings: [
    {name: 'particlePositions', type: 'storage', group: 0, location: 0},
    {name: 'particleVelocities', type: 'storage', group: 0, location: 1}
  ]
} satisfies ComputeShaderLayout;

const RENDER_SHADER_LAYOUT = {
  attributes: [],
  bindings: [{name: 'particlePositions', type: 'read-only-storage', group: 0, location: 0}]
} satisfies ShaderLayout;

const WEBGL_TRANSFORM_SHADER_LAYOUT = {
  attributes: [
    {name: 'particlePositions', location: 0, type: 'vec2<f32>'},
    {name: 'particleVelocities', location: 1, type: 'vec2<f32>'}
  ],
  bindings: []
} satisfies ShaderLayout;

const WEBGL_RENDER_SHADER_LAYOUT = {
  attributes: [{name: 'particlePositions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: []
} satisfies ShaderLayout;

export class ArrowParticleLayer {
  readonly device: Device;
  props: ArrowParticleLayerResolvedProps;
  positionVector!: GPUVector<ArrowParticleVectorType>;
  velocityVector!: GPUVector<ArrowParticleVectorType>;
  initialPositions!: Float32Array;
  initialVelocities!: Float32Array;
  computation?: TableComputation;
  transform?: TableTransform;
  model!: Model;
  particleCount = 0;
  private lastResetTime = 0;

  constructor(device: Device, props: ArrowParticleLayerProps = {}) {
    if (device.type !== 'webgpu' && device.type !== 'webgl') {
      throw new Error('Particles: FixedSizeList<Float32, 2> requires WebGPU or WebGL2');
    }

    this.device = device;
    this.props = {
      data: props.data ?? makeArrowParticleTable(),
      columns: {...DEFAULT_COLUMNS, ...props.columns},
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? DEFAULT_RESET_INTERVAL_MILLISECONDS
    };
    this.initialize();
  }

  setProps(props: ArrowParticleLayerProps): void {
    const shouldRecreate = props.data !== undefined || props.columns !== undefined;
    this.props = {
      data: props.data ?? this.props.data,
      columns: {...this.props.columns, ...props.columns},
      resetIntervalMilliseconds:
        props.resetIntervalMilliseconds ?? this.props.resetIntervalMilliseconds
    };

    if (shouldRecreate) {
      this.destroyResources();
      this.initialize();
    }
  }

  update(time: number): void {
    if (time - this.lastResetTime >= this.props.resetIntervalMilliseconds) {
      this.positionVector.buffer.write(this.initialPositions);
      this.velocityVector.buffer.write(this.initialVelocities);
      this.lastResetTime = time;
    }

    if (this.computation) {
      const computePass = this.device.beginComputePass({});
      this.computation.dispatchBatches(computePass, batch =>
        Math.ceil(batch.numRows / WORKGROUP_SIZE)
      );
      computePass.end();
      return;
    }

    this.transform?.run();
  }

  draw(renderPass: RenderPass): void {
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.destroyResources();
  }

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }

  private initialize(): void {
    const sourceVectors = getArrowParticleSourceVectors(this.props.data, this.props.columns);
    this.particleCount = sourceVectors.positions.length;
    if (sourceVectors.velocities.length !== this.particleCount) {
      throw new Error(
        `ArrowParticleLayer positions and velocities rows must match (${this.particleCount} !== ${sourceVectors.velocities.length})`
      );
    }

    this.initialPositions = getInitialParticleValues(sourceVectors.positions);
    this.initialVelocities = getInitialParticleValues(sourceVectors.velocities);
    this.positionVector = makeArrowGPUVector(this.device, sourceVectors.positions, {
      name: 'particlePositions'
    });
    this.velocityVector = makeArrowGPUVector(this.device, sourceVectors.velocities, {
      name: 'particleVelocities'
    });

    if (this.device.type === 'webgpu') {
      this.computation = new TableComputation(this.device, {
        id: 'gpu-vector-storage-particles-compute',
        source: makeComputeShader(this.particleCount),
        shaderLayout: COMPUTE_SHADER_LAYOUT,
        inputVectors: {
          particlePositions: this.positionVector,
          particleVelocities: this.velocityVector
        }
      });

      this.model = new Model(this.device, {
        id: 'gpu-vector-storage-particles-render',
        source: WEBGPU_RENDER_SHADER,
        shaderLayout: RENDER_SHADER_LAYOUT,
        bindings: {
          particlePositions: this.positionVector.buffer
        },
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: this.particleCount
      });
      return;
    }

    this.transform = new TableTransform(this.device, {
      id: 'gpu-vector-storage-particles-transform',
      vs: WEBGL_TRANSFORM_SHADER,
      shaderLayout: WEBGL_TRANSFORM_SHADER_LAYOUT,
      inputVectors: {
        particlePositions: this.positionVector,
        particleVelocities: this.velocityVector
      },
      copyOutputToInputVectors: {
        nextParticlePositions: 'particlePositions',
        nextParticleVelocities: 'particleVelocities'
      }
    });

    this.model = new Model(this.device, {
      id: 'gpu-vector-storage-particles-render',
      vs: WEBGL_RENDER_VERTEX_SHADER,
      fs: WEBGL_RENDER_FRAGMENT_SHADER,
      shaderLayout: WEBGL_RENDER_SHADER_LAYOUT,
      attributes: {
        particlePositions: this.positionVector.buffer
      },
      bufferLayout: [{name: 'particlePositions', format: 'float32x2', stepMode: 'instance'}],
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.particleCount
    });
  }

  private destroyResources(): void {
    this.model?.destroy();
    this.computation?.destroy();
    this.transform?.destroy();
    this.positionVector?.destroy();
    this.velocityVector?.destroy();
    this.computation = undefined;
    this.transform = undefined;
  }
}

export function makeArrowParticleTable(particleCount = DEFAULT_PARTICLE_COUNT): arrow.Table {
  const positions = new Float32Array(particleCount * 2);
  const velocities = new Float32Array(particleCount * 2);

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) {
    const angle = particleIndex * 2.399963229728653;
    const radius = 0.12 + ((particleIndex % 257) / 256) * 0.74;
    const velocityScale = 0.0016 + ((particleIndex % 13) / 12) * 0.0018;

    positions[particleIndex * 2] = Math.cos(angle) * radius;
    positions[particleIndex * 2 + 1] = Math.sin(angle) * radius;
    velocities[particleIndex * 2] = Math.cos(angle + Math.PI / 2) * velocityScale;
    velocities[particleIndex * 2 + 1] = Math.sin(angle + Math.PI / 2) * velocityScale;
  }

  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    velocities: makeArrowFixedSizeListVector(new arrow.Float32(), 2, velocities)
  });
}

function makeComputeShader(particleCount: number): string {
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> particlePositions : array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> particleVelocities : array<vec2<f32>>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let particleIndex = globalInvocationId.x;
  if (particleIndex >= ${particleCount}u) {
    return;
  }

  var position = particlePositions[particleIndex];
  var velocity = particleVelocities[particleIndex];
  position = position + velocity;

  if (position.x < -0.98 || position.x > 0.98) {
    velocity.x = -velocity.x;
    position.x = clamp(position.x, -0.98, 0.98);
  }

  if (position.y < -0.98 || position.y > 0.98) {
    velocity.y = -velocity.y;
    position.y = clamp(position.y, -0.98, 0.98);
  }

  particlePositions[particleIndex] = position;
  particleVelocities[particleIndex] = velocity;
}
`;
}

function getArrowParticleSourceVectors(
  data: arrow.Table,
  columns: Required<ArrowParticleLayerColumns>
): {
  positions: arrow.Vector<ArrowParticleVectorType>;
  velocities: arrow.Vector<ArrowParticleVectorType>;
} {
  return {
    positions: getRequiredParticleVector(data, columns.positions),
    velocities: getRequiredParticleVector(data, columns.velocities)
  };
}

function getRequiredParticleVector(
  table: arrow.Table,
  columnName: string
): arrow.Vector<ArrowParticleVectorType> {
  const vector = table.getChild(columnName);
  if (!vector) {
    throw new Error(`ArrowParticleLayer data is missing Arrow column "${columnName}"`);
  }
  if (!isArrowFixedSizeListVector(vector, new arrow.Float32(), 2)) {
    throw new Error(`ArrowParticleLayer column "${columnName}" must be FixedSizeList<Float32, 2>`);
  }
  return vector;
}

function getInitialParticleValues(vector: arrow.Vector<ArrowParticleVectorType>): Float32Array {
  return new Float32Array(getArrowFixedSizeListValues(vector));
}
