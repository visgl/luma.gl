// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {ThreeBufferBridge} from '@luma.gl/three/interop';
import {
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  Scene,
  type WebGPURenderer
} from 'three/webgpu';
import {attribute, positionLocal, uniform, vec3, sin, cos} from 'three/tsl';

const GRID_SIZE = 65;
const VERTEX_COUNT = GRID_SIZE * GRID_SIZE;
const INDEX_COUNT = (GRID_SIZE - 1) * (GRID_SIZE - 1) * 6;
const INSTANCE_COUNT = 3;

// Packed scalar storage deliberately matches a Float32x3 vertex attribute (12-byte stride).
export const WAVE_COMPUTE_SHADER = `
struct Parameters { phase: f32 }
@group(0) @binding(0) var<storage, read_write> positions: array<f32>;
@group(0) @binding(1) var<uniform> parameters: Parameters;
@group(0) @binding(2) var<storage, read_write> indices: array<u32>;
@group(0) @binding(3) var<storage, read_write> offsets: array<f32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let index = invocation.x;
  if (index < ${INSTANCE_COUNT}u) {
    offsets[index * 3u] = (f32(index) - 1.0) * 4.5;
    offsets[index * 3u + 1u] = 0.0;
    offsets[index * 3u + 2u] = 0.0;
  }
  if (index < ${(GRID_SIZE - 1) * (GRID_SIZE - 1)}u) {
    let vertex = index / ${GRID_SIZE - 1}u * ${GRID_SIZE}u + index % ${GRID_SIZE - 1}u;
    indices[index * 6u] = vertex;
    indices[index * 6u + 1u] = vertex + ${GRID_SIZE}u;
    indices[index * 6u + 2u] = vertex + 1u;
    indices[index * 6u + 3u] = vertex + 1u;
    indices[index * 6u + 4u] = vertex + ${GRID_SIZE}u;
    indices[index * 6u + 5u] = vertex + ${GRID_SIZE + 1}u;
  }
  if (index >= ${VERTEX_COUNT}u) { return; }
  let x = f32(index % ${GRID_SIZE}u) / ${GRID_SIZE - 1}.0 * 4.0 - 2.0;
  let z = f32(index / ${GRID_SIZE}u) / ${GRID_SIZE - 1}.0 * 4.0 - 2.0;
  let height = sin(x * 3.0 + parameters.phase) * cos(z * 2.0 - parameters.phase) * 0.45;
  positions[index * 3u] = x;
  positions[index * 3u + 1u] = height;
  positions[index * 3u + 2u] = z;
}`;

/** Upstream rendering in both views; only the left view uses luma compute. */
export function createComputeScene(device?: Device, renderer?: WebGPURenderer) {
  const scene = new Scene();
  scene.background = new Color(0.04, 0.06, 0.08);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(8, 7, 12);
  camera.lookAt(0, 0, 0);
  const geometry = new InstancedBufferGeometry();
  geometry.instanceCount = INSTANCE_COUNT;
  const phase = uniform(0);
  const material = new MeshBasicNodeMaterial({color: '#32b6dc', side: DoubleSide});
  const instanceOffset = attribute<'vec3'>('instanceOffset', 'vec3');
  material.positionNode = positionLocal.add(instanceOffset);
  let bridge: ThreeBufferBridge | undefined;
  const positions = device?.createBuffer({
    id: 'shared-wave-positions',
    byteLength: VERTEX_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const indexBuffer = device?.createBuffer({
    id: 'shared-wave-indices',
    indexType: 'uint32',
    byteLength: INDEX_COUNT * 4,
    usage: Buffer.STORAGE | Buffer.INDEX
  });
  const offsets = device?.createBuffer({
    id: 'shared-wave-instance-offsets',
    byteLength: INSTANCE_COUNT * 12,
    usage: Buffer.STORAGE | Buffer.VERTEX
  });
  const parameters = device?.createBuffer({
    id: 'wave-parameters',
    byteLength: 16,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const shader = device?.createShader({stage: 'compute', source: WAVE_COMPUTE_SHADER});
  const pipeline =
    device && shader
      ? device.createComputePipeline({
          shader,
          shaderLayout: {
            bindings: [
              {name: 'positions', type: 'storage', group: 0, location: 0},
              {name: 'parameters', type: 'uniform', group: 0, location: 1},
              {name: 'indices', type: 'storage', group: 0, location: 2},
              {name: 'offsets', type: 'storage', group: 0, location: 3}
            ]
          }
        })
      : undefined;
  if (device && renderer && positions && indexBuffer && offsets) {
    bridge = new ThreeBufferBridge(device, renderer);
    geometry.setAttribute('position', bridge.createAttribute(positions, 3, VERTEX_COUNT));
    geometry.setIndex(bridge.createIndexAttribute(indexBuffer, INDEX_COUNT));
    geometry.setAttribute(
      'instanceOffset',
      bridge.createInstancedAttribute(offsets, 3, INSTANCE_COUNT)
    );
  } else {
    const indices: number[] = [];
    for (let row = 0; row < GRID_SIZE - 1; row++) {
      for (let column = 0; column < GRID_SIZE - 1; column++) {
        const vertex = row * GRID_SIZE + column;
        indices.push(
          vertex,
          vertex + GRID_SIZE,
          vertex + 1,
          vertex + 1,
          vertex + GRID_SIZE,
          vertex + GRID_SIZE + 1
        );
      }
    }
    geometry.setIndex(indices);
    const instanceOffsets = new Float32Array(INSTANCE_COUNT * 3);
    for (let instance = 0; instance < INSTANCE_COUNT; instance++)
      instanceOffsets[instance * 3] = (instance - 1) * 4.5;
    geometry.setAttribute('instanceOffset', new InstancedBufferAttribute(instanceOffsets, 3));
    const values = new Float32Array(VERTEX_COUNT * 3);
    for (let vertex = 0; vertex < VERTEX_COUNT; vertex++) {
      values[vertex * 3] = ((vertex % GRID_SIZE) / (GRID_SIZE - 1)) * 4 - 2;
      values[vertex * 3 + 2] = (Math.floor(vertex / GRID_SIZE) / (GRID_SIZE - 1)) * 4 - 2;
    }
    geometry.setAttribute('position', new BufferAttribute(values, 3));
    material.positionNode = vec3(
      positionLocal.x,
      sin(positionLocal.x.mul(3).add(phase))
        .mul(cos(positionLocal.z.mul(2).sub(phase)))
        .mul(0.45),
      positionLocal.z
    ).add(instanceOffset);
  }
  const mesh = new Mesh(geometry, material);
  // CPU metadata is intentionally stale: do not infer bounds from the placeholder array.
  mesh.frustumCulled = false;
  scene.add(mesh);
  let disposed = false;
  return {
    scene,
    camera,
    geometry,
    positions,
    indexBuffer,
    offsets,
    update(time: number) {
      phase.value = Math.fround(time);
      if (device && pipeline && positions && parameters && indexBuffer && offsets) {
        parameters.write(new Float32Array([phase.value, 0, 0, 0]));
        const pass = device.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindings({positions, parameters, indices: indexBuffer, offsets});
        pass.dispatch(Math.ceil(VERTEX_COUNT / 64));
        pass.end();
        // Both engines submit to the same GPUQueue. Compute precedes Three's draw.
        device.submit();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      material.dispose();
      bridge?.dispose();
      pipeline?.destroy();
      shader?.destroy();
      parameters?.destroy();
      positions?.destroy();
      indexBuffer?.destroy();
      offsets?.destroy();
    }
  };
}
