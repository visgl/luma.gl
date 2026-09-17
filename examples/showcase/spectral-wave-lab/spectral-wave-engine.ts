// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUFFT2D,
  GPUCommandGraph,
  makeGPUFFT2DStats,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';

const WORKGROUP_SIZE = 256;
const TWO_PI = 2 * Math.PI;
export type SpectralWaveLabStats = {
  resolution: number;
  elementCount: number;
  fftPasses: number;
  fftDispatchesPerFrame: number;
  workgroupSize: readonly [number, number, number];
  domainSize: number;
  waveSpeed: number;
};
/** Exact-in-time Fourier evolution of the periodic 2D wave equation. */
export class SpectralWaveEngine {
  readonly device: Device;
  readonly resolution: number;
  readonly domainSize: number;
  readonly waveSpeed: number;
  readonly initialSpatial: Buffer;
  readonly initialSpectrum: Buffer; /** Spectrum at the current displayed time; consumed directly by the Fourier-space view. */
  readonly evolvedSpectrum: Buffer; /** Inverse-FFT real-space field consumed directly by the physical-space view. */
  readonly field: Buffer;
  readonly stats: SpectralWaveLabStats;
  private readonly fft: Record<'forward' | 'inverse', CompiledGPUCommandGraph>;
  private readonly evolve: Computation;
  private readonly parameters: Buffer;
  private initialized = false;
  constructor(
    device: Device,
    props: {resolution?: number; domainSize?: number; waveSpeed?: number} = {}
  ) {
    if (device.type !== 'webgpu') throw new Error('Spectral Lab requires WebGPU.');
    this.device = device;
    this.resolution = props.resolution ?? 256;
    this.domainSize = props.domainSize ?? 12;
    this.waveSpeed = props.waveSpeed ?? 1.35;
    if (
      !Number.isInteger(this.resolution) ||
      this.resolution < 32 ||
      this.resolution > 1024 ||
      (this.resolution & (this.resolution - 1)) !== 0
    )
      throw new Error('Spectral Lab resolution must be a power of two from 32 through 1024.');
    const initial = makeInitialField(this.resolution, this.domainSize),
      byteLength = initial.byteLength;
    this.initialSpatial = device.createBuffer({
      id: 'spectral-initial-spatial',
      data: initial,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.initialSpectrum = device.createBuffer({
      id: 'spectral-initial-spectrum',
      byteLength,
      usage: Buffer.STORAGE
    });
    this.evolvedSpectrum = device.createBuffer({
      id: 'spectral-evolved-spectrum',
      byteLength,
      usage: Buffer.STORAGE
    });
    this.field = device.createBuffer({
      id: 'spectral-field',
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.parameters = device.createBuffer({
      id: 'spectral-parameters',
      byteLength: 16,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const compileTransform = (
      direction: 'forward' | 'inverse',
      inputBuffer: Buffer,
      outputBuffer: Buffer
    ) => {
      const graph = new GPUCommandGraph(device, {id: `spectral-fft-${direction}`});
      const input = graph.importBuffer(
        {id: 'input', byteLength, usage: inputBuffer.usage},
        inputBuffer
      );
      const output = graph.importBuffer(
        {id: 'output', byteLength, usage: outputBuffer.usage},
        outputBuffer
      );
      graph.add(
        new GPUFFT2D({
          width: this.resolution,
          height: this.resolution,
          direction,
          input: graph.createDataView(input, {format: 'float32x2', length: this.resolution ** 2}),
          output: graph.createDataView(output, {format: 'float32x2', length: this.resolution ** 2})
        })
      );
      return graph.compile();
    };
    this.fft = {
      forward: compileTransform('forward', this.initialSpatial, this.initialSpectrum),
      inverse: compileTransform('inverse', this.evolvedSpectrum, this.field)
    };
    const fftStats = makeGPUFFT2DStats(this.resolution, this.resolution);
    this.evolve = new Computation(device, {
      id: 'spectral-evolve',
      source: EVOLVE_SHADER,
      shaderLayout: {
        bindings: [
          {name: 'initialSpectrum', type: 'read-only-storage', group: 0, location: 0},
          {name: 'evolvedSpectrum', type: 'storage', group: 0, location: 1},
          {name: 'parameters', type: 'uniform', group: 0, location: 2}
        ]
      }
    });
    this.stats = Object.freeze({
      resolution: this.resolution,
      elementCount: this.resolution * this.resolution,
      fftPasses: fftStats.passCount,
      fftDispatchesPerFrame: fftStats.dispatchCountPerEncode,
      workgroupSize: fftStats.workgroupSize,
      domainSize: this.domainSize,
      waveSpeed: this.waveSpeed
    });
  }
  /** Updates both synchronized representations: evolvedSpectrum and inverse-FFT field. */
  encode(timeSeconds: number): Buffer {
    if (!Number.isFinite(timeSeconds)) throw new Error('Spectral Lab time must be finite.');
    const encoder = this.device.commandEncoder;
    if (!this.initialized) {
      this.fft.forward.encode(encoder, {parameters: undefined});
      this.initialized = true;
    }
    this.parameters.write(
      makeParameters(timeSeconds, this.waveSpeed, this.domainSize, this.resolution)
    );
    this.evolve.predraw(encoder);
    const pass = encoder.beginComputePass({id: 'spectral-evolve'});
    this.evolve.setBindings({
      initialSpectrum: this.initialSpectrum,
      evolvedSpectrum: this.evolvedSpectrum,
      parameters: this.parameters
    });
    this.evolve.dispatch(pass, Math.ceil(this.stats.elementCount / WORKGROUP_SIZE), 1, 1);
    pass.end();
    this.fft.inverse.encode(encoder, {parameters: undefined});
    return this.field;
  }
  destroy(): void {
    this.fft.forward.destroy();
    this.fft.inverse.destroy();
    this.evolve.destroy();
    this.parameters.destroy();
    this.initialSpatial.destroy();
    this.initialSpectrum.destroy();
    this.evolvedSpectrum.destroy();
    this.field.destroy();
  }
}
function makeInitialField(resolution: number, domainSize: number): Float32Array {
  const complex = new Float32Array(resolution * resolution * 2);
  const disturbances = [
    {x: -2.2, y: -1, amplitude: 1, sigma: 0.72},
    {x: 2.1, y: 1.3, amplitude: -0.82, sigma: 0.9},
    {x: 0.2, y: 2.6, amplitude: 0.58, sigma: 0.55}
  ];
  for (let iy = 0; iy < resolution; iy++) {
    const y = (iy / resolution - 0.5) * domainSize;
    for (let ix = 0; ix < resolution; ix++) {
      const x = (ix / resolution - 0.5) * domainSize;
      let value = 0;
      for (const d of disturbances) {
        const dx = x - d.x,
          dy = y - d.y;
        value += d.amplitude * Math.exp(-(dx * dx + dy * dy) / (2 * d.sigma * d.sigma));
      }
      complex[2 * (iy * resolution + ix)] = value;
    }
  }
  return complex;
}
function makeParameters(
  time: number,
  waveSpeed: number,
  domainSize: number,
  resolution: number
): ArrayBuffer {
  const data = new ArrayBuffer(16),
    f32 = new Float32Array(data),
    u32 = new Uint32Array(data);
  f32[0] = time;
  f32[1] = waveSpeed;
  f32[2] = domainSize;
  u32[3] = resolution;
  return data;
}
const EVOLVE_SHADER = `struct Parameters{time:f32,waveSpeed:f32,domainSize:f32,resolution:u32};@group(0)@binding(0)var<storage,read>initialSpectrum:array<vec2f>;@group(0)@binding(1)var<storage,read_write>evolvedSpectrum:array<vec2f>;@group(0)@binding(2)var<uniform>parameters:Parameters;fn signedFrequency(index:u32,n:u32)->f32{let i=i32(index);let half=i32(n/2u);return f32(select(i,i-i32(n),i>half));}@compute @workgroup_size(${WORKGROUP_SIZE})fn main(@builtin(global_invocation_id)gid:vec3u){let count=parameters.resolution*parameters.resolution;let index=gid.x;if(index>=count){return;}let x=index%parameters.resolution;let y=index/parameters.resolution;let kx=${TWO_PI}*signedFrequency(x,parameters.resolution)/parameters.domainSize;let ky=${TWO_PI}*signedFrequency(y,parameters.resolution)/parameters.domainSize;let omega=parameters.waveSpeed*sqrt(kx*kx+ky*ky);evolvedSpectrum[index]=initialSpectrum[index]*cos(omega*parameters.time);}`;
