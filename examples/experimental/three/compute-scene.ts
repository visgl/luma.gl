// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {ThreeBufferBridge} from '@luma.gl/three/interop';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  Scene,
  type WebGPURenderer
} from 'three/webgpu';
import {positionLocal, uniform, vec3, sin, cos} from 'three/tsl';

const GRID_SIZE = 65;
const VERTEX_COUNT = GRID_SIZE * GRID_SIZE;

// Packed scalar storage deliberately matches a Float32x3 vertex attribute (12-byte stride).
export const WAVE_COMPUTE_SHADER = `
struct Parameters { phase: f32 }
@group(0) @binding(0) var<storage, read_write> positions: array<f32>;
@group(0) @binding(1) var<uniform> parameters: Parameters;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let index = invocation.x;
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
  camera.position.set(4, 3.5, 5);
  camera.lookAt(0, 0, 0);
  const geometry = new BufferGeometry();
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
  const phase = uniform(0);
  const material = new MeshBasicNodeMaterial({color: '#32b6dc', side: DoubleSide, wireframe: true});
  let bridge: ThreeBufferBridge | undefined;
  const positions = device?.createBuffer({
    id: 'shared-wave-positions',
    byteLength: VERTEX_COUNT * 12,
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
              {name: 'parameters', type: 'uniform', group: 0, location: 1}
            ]
          }
        })
      : undefined;
  if (device && renderer && positions) {
    bridge = new ThreeBufferBridge(device, renderer);
    geometry.setAttribute('position', bridge.createAttribute(positions, 3, VERTEX_COUNT));
  } else {
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
    );
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
    update(time: number) {
      phase.value = Math.fround(time);
      if (device && pipeline && positions && parameters) {
        parameters.write(new Float32Array([phase.value, 0, 0, 0]));
        const pass = device.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindings({positions, parameters});
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
    }
  };
}
