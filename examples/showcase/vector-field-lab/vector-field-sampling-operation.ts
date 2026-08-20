// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';

export type VectorFieldGraphParameters = {presetIndex: number; time: number};

/** Example-local graph operation that evaluates analytic 3D presets directly into GPU volumes. */
export class GPUVectorFieldSampler3D {
  readonly scalar: GraphDataView<'float32'>;
  readonly vector: GraphDataView<'float32x4'>;
  readonly resolution: number;

  constructor(props: {
    scalar: GraphDataView<'float32'>;
    vector: GraphDataView<'float32x4'>;
    resolution: number;
  }) {
    this.scalar = props.scalar;
    this.vector = props.vector;
    this.resolution = props.resolution;
  }

  addToGraph(graph: GPUCommandGraph<VectorFieldGraphParameters>): void {
    const elementCount = this.resolution ** 3;
    graph.addComputePass({
      id: 'sample-analytic-volume',
      workload: {
        operation: 'GPUVectorFieldSampler3D.sample',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(elementCount / 256),
        maximumInvocationCount: Math.ceil(elementCount / 256) * 256,
        writeByteLength: elementCount * 20
      },
      resources: [
        {buffer: this.scalar, usage: 'storage-write'},
        {buffer: this.vector, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const uniformBuffer = device.createBuffer({
          id: 'vector-field-sampling-uniforms',
          byteLength: 16,
          usage: Buffer.UNIFORM | Buffer.COPY_DST
        });
        const computation = new Computation(device, {
          id: 'sample-analytic-volume',
          source: getSamplingShader(this.resolution),
          shaderLayout: {
            bindings: [
              {name: 'scalarValues', type: 'storage', group: 0, location: 0},
              {name: 'vectorValues', type: 'storage', group: 0, location: 1},
              {name: 'sampling', type: 'uniform', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, parameters}) => {
            uniformBuffer.write(
              new Float32Array([this.resolution, parameters.presetIndex, parameters.time, 0])
            );
            const bindings: Record<string, Binding> = {
              scalarValues: getBuffer(this.scalar),
              vectorValues: getBuffer(this.vector),
              sampling: uniformBuffer
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, Math.ceil(elementCount / 256));
          },
          destroy: () => {
            computation.destroy();
            uniformBuffer.destroy();
          }
        };
      }
    });
  }
}

function getSamplingShader(resolution: number): string {
  return /* wgsl */ `
struct SamplingUniforms { resolution: f32, presetIndex: f32, time: f32, padding: f32 };
@group(0) @binding(0) var<storage, read_write> scalarValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> vectorValues: array<vec4f>;
@group(0) @binding(2) var<uniform> sampling: SamplingUniforms;
const RESOLUTION: u32 = ${resolution}u;
const ELEMENT_COUNT: u32 = ${resolution ** 3}u;

fn gaussian(point: vec3f, center: vec3f, sharpness: f32) -> f32 {
  let offset = point - center;
  return exp(-sharpness * dot(offset, offset));
}

@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= ELEMENT_COUNT) { return; }
  let coordinate = vec3u(index % RESOLUTION, (index / RESOLUTION) % RESOLUTION, index / (RESOLUTION * RESOLUTION));
  let point = vec3f(coordinate) / f32(RESOLUTION - 1u) * 2.0 - 1.0;
  let preset = u32(sampling.presetIndex + 0.5);
  var scalar = 0.0;
  var vector = vec3f(0.0);
  if (preset == 0u) {
    vector = point;
  } else if (preset == 1u) {
    vector = vec3f(-point.y, point.x, 0.0);
  } else if (preset == 2u) {
    vector = vec3f(point.x, -2.0 * point.y, point.z);
  } else if (preset == 3u) {
    let phase = sampling.time * 0.13;
    let angles = 3.14159265 * (point + vec3f(phase, -phase * 0.7, phase * 0.35));
    vector = vec3f(sin(angles.x) * cos(angles.y) * cos(angles.z), -cos(angles.x) * sin(angles.y) * cos(angles.z), 0.0);
  } else if (preset == 4u) {
    scalar = exp(-4.0 * dot(point, point));
  } else {
    let centerA = vec3f(0.34 * cos(sampling.time * 0.35), 0.25 * sin(sampling.time * 0.3), 0.24 * sin(sampling.time * 0.23));
    let centerB = vec3f(-0.4, 0.25 * cos(sampling.time * 0.27), -0.22);
    scalar = gaussian(point, centerA, 8.0) - 0.75 * gaussian(point, centerB, 10.0);
  }
  scalarValues[index] = scalar;
  vectorValues[index] = vec4f(vector, 0.0);
}`;
}
