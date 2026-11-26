// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {ThreeBufferBridge} from '@luma.gl/three/interop';
import {BufferGeometry, Points, PointsMaterial, Scene, type WebGPURenderer} from 'three/webgpu';

/** Each incoming batch is uploaded once; its plotted positions are produced only on the GPU. */
export function createStreamedLayout(device: Device, renderer: WebGPURenderer) {
  const bridge = new ThreeBufferBridge(device, renderer);
  const scene = new Scene();
  const material = new PointsMaterial({color: '#32b6dc', size: 0.08});
  const shader = device.createShader({
    stage: 'compute',
    source: `
@group(0) @binding(0) var<storage, read> values: array<f32>;
@group(0) @binding(1) var<storage, read_write> positions: array<f32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let row = invocation.x;
  if (row >= arrayLength(&values) / 2u) { return; }
  positions[row * 3u] = values[row * 2u];
  positions[row * 3u + 1u] = log(1.0 + abs(values[row * 2u + 1u]));
  positions[row * 3u + 2u] = 0.0;
}`
  });
  const pipeline = device.createComputePipeline({
    shader,
    shaderLayout: {
      bindings: [
        {name: 'values', type: 'read-only-storage', group: 0, location: 0},
        {name: 'positions', type: 'storage', group: 0, location: 1}
      ]
    }
  });
  const batches = new Set<{
    geometry: BufferGeometry;
    points: Points;
    values: Buffer;
    positions: Buffer;
  }>();
  let disposed = false;
  function remove(batch: {
    geometry: BufferGeometry;
    points: Points;
    values: Buffer;
    positions: Buffer;
  }) {
    if (!batches.delete(batch)) return;
    scene.remove(batch.points);
    batch.geometry.dispose();
    batch.values.destroy();
    batch.positions.destroy();
  }
  return {
    scene,
    /** Packed x/value pairs. Append preserves batches; replacement is explicit remove + append. */
    append(data: Float32Array) {
      if (disposed || !data.length || data.length % 2)
        throw new Error('Expected live layout and x/value pairs');
      const count = data.length / 2;
      const values = device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
      const positions = device.createBuffer({
        byteLength: count * 12,
        usage: Buffer.STORAGE | Buffer.VERTEX
      });
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', bridge.createAttribute(positions, 3, count));
      const points = new Points(geometry, material);
      // The CPU attribute is metadata only; bounds cannot be inferred from it.
      points.frustumCulled = false;
      const batch = {geometry, points, values, positions};
      batches.add(batch);
      const pass = device.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindings({values, positions});
      pass.dispatch(Math.ceil(count / 64));
      pass.end();
      device.submit();
      scene.add(points);
      return {geometry, positions, remove: () => remove(batch)};
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const batch of batches) remove(batch);
      bridge.dispose();
      material.dispose();
      pipeline.destroy();
      shader.destroy();
    }
  };
}
