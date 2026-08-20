// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  GPUFiniteDifference2D
} from '@luma.gl/gpgpu/gpu-core';
import {sampleVectorFieldPreset, type VectorFieldPreset} from './vector-field-presets';

export type VectorFieldBuffers = {
  scalar: Buffer;
  vector: Buffer;
  gradient: Buffer;
  laplacian: Buffer;
  divergence: Buffer;
  curl: Buffer;
};

/** Owns sampled fields and one immutable four-node differential-operator command graph. */
export class VectorFieldEngine {
  readonly device: Device;
  readonly resolution: number;
  readonly spacing: number;
  readonly buffers: VectorFieldBuffers;
  readonly graph: CompiledGPUCommandGraph<void>;

  private lastPresetId = '';
  private lastSampleTime = Number.NaN;

  constructor(device: Device, resolution = 128) {
    if (device.type !== 'webgpu') throw new Error('Vector Field Lab requires WebGPU.');
    this.device = device;
    this.resolution = resolution;
    this.spacing = 2 / (resolution - 1);
    const scalarBytes = resolution * resolution * 4;
    const vectorBytes = scalarBytes * 2;
    this.buffers = {
      scalar: device.createBuffer({
        id: 'vector-field-scalar',
        byteLength: scalarBytes,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      vector: device.createBuffer({
        id: 'vector-field-vector',
        byteLength: vectorBytes,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      }),
      gradient: device.createBuffer({
        id: 'vector-field-gradient',
        byteLength: vectorBytes,
        usage: Buffer.STORAGE
      }),
      laplacian: device.createBuffer({
        id: 'vector-field-laplacian',
        byteLength: scalarBytes,
        usage: Buffer.STORAGE
      }),
      divergence: device.createBuffer({
        id: 'vector-field-divergence',
        byteLength: scalarBytes,
        usage: Buffer.STORAGE
      }),
      curl: device.createBuffer({
        id: 'vector-field-curl',
        byteLength: scalarBytes,
        usage: Buffer.STORAGE
      })
    };
    this.graph = this.createGraph();
  }

  /** Uploads a sampled field and encodes all four operators when the sample changes. */
  update(preset: VectorFieldPreset, time: number, force = false): boolean {
    const sampleTime = preset.id === 'taylor-green' || preset.id === 'multi-well' ? time : 0;
    if (
      !force &&
      preset.id === this.lastPresetId &&
      Math.abs(sampleTime - this.lastSampleTime) < 1 / 30
    ) {
      return false;
    }
    const samples = sampleVectorFieldPreset(preset, this.resolution, sampleTime);
    this.buffers.scalar.write(samples.scalar);
    this.buffers.vector.write(samples.vector);
    this.graph.encode(this.device.commandEncoder, {parameters: undefined});
    this.lastPresetId = preset.id;
    this.lastSampleTime = sampleTime;
    return true;
  }

  destroy(): void {
    this.graph.destroy();
    for (const buffer of Object.values(this.buffers)) buffer.destroy();
  }

  private createGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'vector-field-operators'});
    const length = this.resolution * this.resolution;
    const scalar = importView(graph, this.buffers.scalar, 'scalar', 'float32', length);
    const vector = importView(graph, this.buffers.vector, 'vector', 'float32x2', length);
    const gradient = importView(graph, this.buffers.gradient, 'gradient', 'float32x2', length);
    const laplacian = importView(graph, this.buffers.laplacian, 'laplacian', 'float32', length);
    const divergence = importView(graph, this.buffers.divergence, 'divergence', 'float32', length);
    const curl = importView(graph, this.buffers.curl, 'curl', 'float32', length);
    const common = {
      width: this.resolution,
      height: this.resolution,
      spacing: [this.spacing, this.spacing] as const,
      boundary: 'one-sided' as const
    };
    new GPUFiniteDifference2D({
      id: 'field-gradient',
      ...common,
      operator: 'gradient',
      input: scalar,
      output: gradient
    }).addToGraph(graph);
    new GPUFiniteDifference2D({
      id: 'field-laplacian',
      ...common,
      operator: 'laplacian',
      input: scalar,
      output: laplacian
    }).addToGraph(graph);
    new GPUFiniteDifference2D({
      id: 'field-divergence',
      ...common,
      operator: 'divergence',
      input: vector,
      output: divergence
    }).addToGraph(graph);
    new GPUFiniteDifference2D({
      id: 'field-curl',
      ...common,
      operator: 'curl',
      input: vector,
      output: curl
    }).addToGraph(graph);
    return graph.compile();
  }
}

function importView(
  graph: GPUCommandGraph,
  buffer: Buffer,
  id: string,
  format: 'float32' | 'float32x2',
  length: number
) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}
