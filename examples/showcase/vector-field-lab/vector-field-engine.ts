// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  type CompiledGPUCommandGraph,
  type GraphDataView,
  GPUCommandGraph,
  GPUFiniteDifference3D
} from '@luma.gl/gpgpu/gpu-core';
import type {VectorFieldPreset} from './vector-field-presets';
import {
  GPUVectorFieldSampler3D,
  type VectorFieldGraphParameters
} from './vector-field-sampling-operation';

export type VectorFieldBuffers = {
  scalar: Buffer;
  vector: Buffer;
  gradient: Buffer;
  laplacian: Buffer;
  divergence: Buffer;
  curl: Buffer;
};

/** Owns a sampled 3D volume and one immutable five-node differential-operator command graph. */
export class VectorFieldEngine {
  readonly device: Device;
  readonly resolution: number;
  readonly spacing: number;
  readonly buffers: VectorFieldBuffers;
  readonly graph: CompiledGPUCommandGraph<VectorFieldGraphParameters>;

  private lastPresetId = '';
  private lastSampleTime = Number.NaN;

  constructor(device: Device, resolution = 40) {
    if (device.type !== 'webgpu') throw new Error('Vector Field Lab requires WebGPU.');
    this.device = device;
    this.resolution = resolution;
    this.spacing = 2 / (resolution - 1);
    const scalarBytes = resolution ** 3 * 4;
    const vectorBytes = scalarBytes * 4;
    this.buffers = {
      scalar: device.createBuffer({
        id: 'vector-field-scalar',
        byteLength: scalarBytes,
        usage: Buffer.STORAGE
      }),
      vector: device.createBuffer({
        id: 'vector-field-vector',
        byteLength: vectorBytes,
        usage: Buffer.STORAGE
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
        byteLength: vectorBytes,
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
    this.graph.encode(this.device.commandEncoder, {
      parameters: {presetIndex: getPresetIndex(preset.id), time: sampleTime}
    });
    this.lastPresetId = preset.id;
    this.lastSampleTime = sampleTime;
    return true;
  }

  destroy(): void {
    this.graph.destroy();
    for (const buffer of Object.values(this.buffers)) buffer.destroy();
  }

  private createGraph(): CompiledGPUCommandGraph<VectorFieldGraphParameters> {
    const graph = new GPUCommandGraph<VectorFieldGraphParameters>(this.device, {
      id: 'vector-field-operators'
    });
    const length = this.resolution ** 3;
    const scalar = importView(graph, this.buffers.scalar, 'scalar', 'float32', length);
    const vector = importView(graph, this.buffers.vector, 'vector', 'float32x4', length);
    const gradient = importView(graph, this.buffers.gradient, 'gradient', 'float32x4', length);
    const laplacian = importView(graph, this.buffers.laplacian, 'laplacian', 'float32', length);
    const divergence = importView(graph, this.buffers.divergence, 'divergence', 'float32', length);
    const curl = importView(graph, this.buffers.curl, 'curl', 'float32x4', length);
    const common = {
      width: this.resolution,
      height: this.resolution,
      depth: this.resolution,
      spacing: [this.spacing, this.spacing, this.spacing] as const,
      boundary: 'one-sided' as const
    };
    new GPUVectorFieldSampler3D({scalar, vector, resolution: this.resolution}).addToGraph(graph);
    new GPUFiniteDifference3D({
      id: 'field-gradient',
      ...common,
      operator: 'gradient',
      input: scalar,
      output: gradient
    }).addToGraph(graph);
    new GPUFiniteDifference3D({
      id: 'field-laplacian',
      ...common,
      operator: 'laplacian',
      input: scalar,
      output: laplacian
    }).addToGraph(graph);
    new GPUFiniteDifference3D({
      id: 'field-divergence',
      ...common,
      operator: 'divergence',
      input: vector,
      output: divergence
    }).addToGraph(graph);
    new GPUFiniteDifference3D({
      id: 'field-curl',
      ...common,
      operator: 'curl',
      input: vector,
      output: curl
    }).addToGraph(graph);
    return graph.compile();
  }
}

function getPresetIndex(id: string): number {
  return [
    'radial-source',
    'rigid-vortex',
    'saddle',
    'taylor-green',
    'gaussian',
    'multi-well'
  ].indexOf(id);
}

function importView<Format extends 'float32' | 'float32x4', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  buffer: Buffer,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}
