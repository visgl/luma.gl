// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowGPUVector, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {GPUVector, TableComputation, TableTransform} from '@luma.gl/tables';
import type {ComputeShaderLayout, ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';

export const title = 'Particles: FixedSizeList<Float32, 3>';
export const description =
  'Arrow-created GPUVectors updated through storage compute or transform feedback.';

const PARTICLE_COUNT = 4096;
const WORKGROUP_SIZE = 64;
const PARTICLE_SIZE = 0.014;
const RESET_INTERVAL_MILLISECONDS = 8_000;

const COMPUTE_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> particlePositions : array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> particleVelocities : array<vec2<f32>>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let particleIndex = globalInvocationId.x;
  if (particleIndex >= ${PARTICLE_COUNT}u) {
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

export default class GPUVectorStorageParticlesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Builds Arrow vectors once, uploads them through <code>GPUVector</code>, then updates them with storage compute on WebGPU or transform feedback on WebGL.</p>
`;

  readonly positionVector: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  readonly velocityVector: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  readonly initialPositions: Float32Array;
  readonly initialVelocities: Float32Array;
  readonly computation?: TableComputation;
  readonly transform?: TableTransform;
  readonly model: Model;
  private lastResetTime = 0;

  constructor({device}: AnimationProps) {
    super();

    if (device.type !== 'webgpu' && device.type !== 'webgl') {
      throw new Error('Particles: FixedSizeList<Float32, 3> requires WebGPU or WebGL2');
    }

    const particleVectors = makeParticleVectors(device);
    this.positionVector = particleVectors.positions;
    this.velocityVector = particleVectors.velocities;
    this.initialPositions = particleVectors.initialPositions;
    this.initialVelocities = particleVectors.initialVelocities;

    if (device.type === 'webgpu') {
      this.computation = new TableComputation(device, {
        id: 'gpu-vector-storage-particles-compute',
        source: COMPUTE_SHADER,
        shaderLayout: COMPUTE_SHADER_LAYOUT,
        inputVectors: {
          particlePositions: this.positionVector,
          particleVelocities: this.velocityVector
        }
      });

      this.model = new Model(device, {
        id: 'gpu-vector-storage-particles-render',
        source: WEBGPU_RENDER_SHADER,
        shaderLayout: RENDER_SHADER_LAYOUT,
        bindings: {
          particlePositions: this.positionVector.buffer
        },
        topology: 'triangle-list',
        vertexCount: 6,
        instanceCount: PARTICLE_COUNT
      });
      return;
    }

    this.transform = new TableTransform(device, {
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

    this.model = new Model(device, {
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
      instanceCount: PARTICLE_COUNT
    });
  }

  onRender({device, time}: AnimationProps): void {
    if (time - this.lastResetTime >= RESET_INTERVAL_MILLISECONDS) {
      this.positionVector.buffer.write(this.initialPositions);
      this.velocityVector.buffer.write(this.initialVelocities);
      this.lastResetTime = time;
    }

    if (this.computation) {
      const computePass = device.beginComputePass({});
      this.computation.dispatchBatches(computePass, batch =>
        Math.ceil(batch.numRows / WORKGROUP_SIZE)
      );
      computePass.end();
    } else {
      this.transform?.run();
    }

    const renderPass = device.beginRenderPass({
      clearColor: [0.01, 0.02, 0.05, 1]
    });
    this.model.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.model.destroy();
    this.computation?.destroy();
    this.transform?.destroy();
    this.positionVector.destroy();
    this.velocityVector.destroy();
  }
}

function makeParticleVectors(device: AnimationProps['device']): {
  positions: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  velocities: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  initialPositions: Float32Array;
  initialVelocities: Float32Array;
} {
  const positions = new Float32Array(PARTICLE_COUNT * 2);
  const velocities = new Float32Array(PARTICLE_COUNT * 2);

  for (let particleIndex = 0; particleIndex < PARTICLE_COUNT; particleIndex++) {
    const angle = particleIndex * 2.399963229728653;
    const radius = 0.12 + ((particleIndex % 257) / 256) * 0.74;
    const velocityScale = 0.0016 + ((particleIndex % 13) / 12) * 0.0018;

    positions[particleIndex * 2] = Math.cos(angle) * radius;
    positions[particleIndex * 2 + 1] = Math.sin(angle) * radius;
    velocities[particleIndex * 2] = Math.cos(angle + Math.PI / 2) * velocityScale;
    velocities[particleIndex * 2 + 1] = Math.sin(angle + Math.PI / 2) * velocityScale;
  }

  const arrowPositions = makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions);
  const arrowVelocities = makeArrowFixedSizeListVector(new arrow.Float32(), 2, velocities);

  return {
    positions: makeArrowGPUVector(device, arrowPositions, {name: 'particlePositions'}),
    velocities: makeArrowGPUVector(device, arrowVelocities, {name: 'particleVelocities'}),
    initialPositions: positions,
    initialVelocities: velocities
  };
}
