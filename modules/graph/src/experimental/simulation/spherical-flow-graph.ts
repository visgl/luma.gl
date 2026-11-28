// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert, Buffer, Texture, type Device, type CommandEncoder} from '@luma.gl/core';
import {Kernel} from '../../execution/compute/kernel';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '../../gpu-core/index';
import {SphericalFlowField, type SphericalVectorFieldInput} from './spherical-flow-field';
import {SPHERICAL_FLOW_SHADER} from './spherical-flow-shaders';

/** Dense global sphere transport; positions are unit directions and velocities use radius distance units. */
export type SphericalFlowGraphProps = {
  /** Initial global world-vector snapshot. */
  input: SphericalVectorFieldInput;
  /** Following snapshot, paired with timeRange. */
  nextInput?: SphericalVectorFieldInput;
  /** Resident physical-time interval in seconds. */
  timeRange?: readonly [number, number];
  /** Interleaved Cartesian directions; normalized once during upload. Identity is the particle index. */
  positions: Float32Array;
  /** Sphere radius in the same distance units as input velocities. */
  radius: number;
  /** Fixed-step midpoint or classical RK4. */
  integrator?: 'rk2' | 'rk4';
  /** Required physical accuracy cap in seconds, additionally bounded by angular grid spacing and speed. */
  maximumTimeStep: number;
};

/** GPU-resident sphere transport without longitude state, pole clamps, respawn or implicit readback. */
export class SphericalFlowGraph {
  /** Stable particle slots. */
  readonly particleCount: number;
  /** Physical sphere radius. */
  readonly radius: number;
  /** Fixed-step integration method. */
  readonly integrator: 'rk2' | 'rk4';
  /** Actual command graph, available for inspection and profiling. */
  readonly commandGraph: CompiledGPUCommandGraph;
  /** Device receiving owned allocations and submissions. */
  private readonly device: Device;
  /** Alternating stable-particle buffers. */
  private readonly states: readonly [Buffer, Buffer];
  /** Parameters for the next submitted batch. */
  private readonly uniforms: Buffer;
  /** Spherical integration kernel. */
  private readonly kernel: Kernel;
  /** Explicit physical timestep accuracy cap supplied by the caller. */
  private readonly stepLimit: number;
  /** Start of the resident snapshot interval. */
  private currentField: SphericalFlowField;
  /** End of the resident snapshot interval. */
  private nextField: SphericalFlowField;
  /** Index of the current state buffer. */
  private current = 0;
  /** Physical start and end times, omitted for steady fields. */
  private interval: readonly [number, number] | undefined;
  /** Elapsed time within the resident interval. */
  private elapsed = 0;
  /** Compensated summation residual for the clock. */
  private compensation = 0;

  /** Upload a stable release and own its state, snapshots and execution resources. */
  constructor(device: Device, props: SphericalFlowGraphProps) {
    assert(device.type === 'webgpu');
    assert(Number.isFinite(props.radius) && props.radius > 0);
    assert(props.positions.length > 0 && props.positions.length % 3 === 0);
    assert(Boolean(props.nextInput) === Boolean(props.timeRange));
    if (props.timeRange)
      assert(props.timeRange.every(Number.isFinite) && props.timeRange[1] > props.timeRange[0]);
    this.device = device;
    this.radius = props.radius;
    this.particleCount = props.positions.length / 3;
    this.integrator = props.integrator ?? 'rk4';
    this.stepLimit = props.maximumTimeStep;
    // Require a physical timestep rather than silently using a rendering-frame duration.
    assert(Number.isFinite(this.stepLimit) && this.stepLimit > 0);
    assert(
      this.particleCount <= 1048576 &&
        this.particleCount * 16 <= device.limits.maxStorageBufferBindingSize
    );
    this.interval = props.timeRange ? [...props.timeRange] : undefined;
    const initial = new Float32Array(this.particleCount * 4);
    for (let index = 0; index < this.particleCount; index++) {
      const horizontal = props.positions[index * 3];
      const vertical = props.positions[index * 3 + 1];
      const polar = props.positions[index * 3 + 2];
      const length = Math.hypot(horizontal, vertical, polar);
      assert(Number.isFinite(length) && length > 0);
      initial.set([horizontal / length, vertical / length, polar / length, 0], index * 4);
    }
    const resources: {destroy(): void}[] = [];
    /** Track successful allocations for constructor failure cleanup. */
    const own = <Resource extends {destroy(): void}>(resource: Resource): Resource => {
      resources.push(resource);
      return resource;
    };
    try {
      this.currentField = own(new SphericalFlowField(device, props.input));
      this.nextField = props.nextInput
        ? own(new SphericalFlowField(device, props.nextInput))
        : this.currentField;
      assert(
        this.currentField.texture.width === this.nextField.texture.width &&
          this.currentField.texture.height === this.nextField.texture.height
      );
      this.states = [0, 1].map(index =>
        own(
          device.createBuffer({
            id: `spherical-particles-${index}`,
            data: initial,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        )
      ) as [Buffer, Buffer];
      this.uniforms = own(
        device.createBuffer({
          id: 'spherical-parameters',
          byteLength: 32,
          usage: Buffer.UNIFORM | Buffer.COPY_DST
        })
      );
      this.kernel = own(
        new Kernel(device, {
          id: 'spherical-advection',
          source: SPHERICAL_FLOW_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'parameters', type: 'uniform', group: 0, location: 0},
              {name: 'previous', type: 'read-only-storage', group: 0, location: 1},
              {name: 'next', type: 'storage', group: 0, location: 2},
              {
                name: 'velocityField',
                type: 'texture',
                group: 0,
                location: 3,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'nextVelocityField',
                type: 'texture',
                group: 0,
                location: 4,
                sampleType: 'unfilterable-float'
              }
            ]
          }
        })
      );
      const graph = new GPUCommandGraph(device, {id: 'spherical-flow'});
      const previous = graph.importBuffer({
        id: 'sphere-previous',
        byteLength: initial.byteLength,
        usage: Buffer.STORAGE
      });
      const next = graph.importBuffer({
        id: 'sphere-next',
        byteLength: initial.byteLength,
        usage: Buffer.STORAGE
      });
      const uniforms = graph.importBuffer(
        {id: 'sphere-uniforms', byteLength: 32, usage: Buffer.UNIFORM},
        this.uniforms
      );
      const texture = {
        width: this.currentField.texture.width,
        height: this.currentField.texture.height,
        format: 'rgba32float' as const,
        usage: Texture.SAMPLE
      };
      const currentField = graph.importTexture({id: 'sphere-field', ...texture});
      const nextField = graph.importTexture({id: 'sphere-next-field', ...texture});
      graph.addComputePass({
        id: 'advect-sphere',
        resources: [
          {buffer: previous, usage: 'storage-read'},
          {buffer: next, usage: 'storage-write'},
          {buffer: uniforms, usage: 'uniform'},
          {texture: currentField, usage: 'sampled'},
          {texture: nextField, usage: 'sampled'}
        ],
        workload: {
          operation: 'SphericalRungeKutta',
          commandCount: 1,
          maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
          maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128,
          readByteLength: initial.byteLength,
          writeByteLength: initial.byteLength
        },
        compile: () => ({
          encode: ({computePass}) =>
            this.kernel.dispatch(computePass, {
              x: Math.ceil(this.particleCount / 128),
              bindings: {
                parameters: this.uniforms,
                previous: this.output,
                next: this.previous,
                velocityField: this.currentField.texture,
                nextVelocityField: this.nextField.texture
              }
            })
        })
      });
      this.commandGraph = own(graph.compile());
    } catch (error) {
      for (const resource of resources.reverse()) resource.destroy();
      throw error;
    }
  }

  /** Unit Cartesian x/y/z and age in seconds, four float32 values per stable particle slot. */
  get output(): Buffer {
    return this.states[this.current];
  }
  /** State preceding the last encoded batch. */
  get previous(): Buffer {
    return this.states[1 - this.current];
  }
  /** Physical clock initialized from the resident interval. */
  get time(): number {
    return (this.interval?.[0] ?? 0) + this.elapsed;
  }
  /** Remaining resident time; steady fields have no endpoint. */
  get remainingTime(): number {
    return this.interval ? this.interval[1] - this.interval[0] - this.elapsed : Infinity;
  }
  /** Angular-grid travel cap; trajectory accuracy still requires timestep/grid refinement. */
  get maximumTimeStep(): number {
    const spacing = Math.min(
      Math.PI / (this.currentField.texture.height - 1),
      (2 * Math.PI) / (this.currentField.texture.width - 1)
    );
    return Math.min(
      this.stepLimit,
      (0.5 * spacing * this.radius) /
        Math.max(this.currentField.maximumSpeed, this.nextField.maximumSpeed)
    );
  }

  /** Encode at most 4096 substeps into one dispatch. Submit before recording again or rotating snapshots. */
  record(encoder: CommandEncoder, deltaTime: number, substeps = 1): GPUCommandGraphEncoding {
    // Dividing a horizon into equal steps can round one ulp above the requested cap.
    assert(
      Number.isFinite(deltaTime) &&
        deltaTime >= 0 &&
        deltaTime <= this.maximumTimeStep * (1 + 1e-12)
    );
    assert(Number.isInteger(substeps) && substeps >= 1 && substeps <= 4096);
    const duration = deltaTime * substeps;
    assert(Number.isFinite(duration) && duration <= this.remainingTime * (1 + 1e-12));
    const intervalDuration = this.interval ? this.interval[1] - this.interval[0] : 1;
    const bytes = new ArrayBuffer(32);
    const view = new DataView(bytes);
    [
      deltaTime,
      1 / this.radius,
      this.interval ? this.elapsed / intervalDuration : 0,
      this.interval ? Math.min(1, (this.elapsed + duration) / intervalDuration) : 0
    ].forEach((value, index) => view.setFloat32(index * 4, value, true));
    [this.particleCount, substeps, this.integrator === 'rk4' ? 4 : 2, 0].forEach((value, index) =>
      view.setUint32(16 + index * 4, value, true)
    );
    this.uniforms.write(new Uint8Array(bytes));
    const encoding = this.commandGraph.encode(encoder, {
      parameters: undefined,
      buffers: {'sphere-previous': this.output, 'sphere-next': this.previous},
      textures: {
        'sphere-field': this.currentField.texture,
        'sphere-next-field': this.nextField.texture
      }
    });
    this.current = 1 - this.current;
    const increment = duration - this.compensation;
    const elapsed = this.elapsed + increment;
    this.compensation = elapsed - this.elapsed - increment;
    this.elapsed = elapsed;
    if (this.interval && Math.abs(this.elapsed - intervalDuration) <= 1e-12 * intervalDuration) {
      this.elapsed = intervalDuration;
      this.compensation = 0;
    }
    return encoding;
  }

  /** Submit an interval in batches of at most 4096 substeps, without CPU readback. */
  advance(duration: number): Buffer {
    // Validate the complete horizon before submitting any work.
    assert(
      Number.isFinite(duration) && duration >= 0 && duration <= this.remainingTime * (1 + 1e-12)
    );
    // Accepted horizon roundoff must not be amplified by a small final batch.
    const boundedDuration = Math.min(duration, this.remainingTime);
    const substeps = Math.max(1, Math.ceil(boundedDuration / this.maximumTimeStep));
    // A safe integer keeps the bounded-dispatch loop progressing exactly.
    assert(Number.isSafeInteger(substeps));
    const deltaTime = boundedDuration / substeps;
    for (let completed = 0; completed < substeps; ) {
      const batchSteps = Math.min(4096, substeps - completed);
      const encoder = this.device.createCommandEncoder();
      // Clock subtraction can round the last remainder below its nominal duration.
      this.record(encoder, Math.min(deltaTime, this.remainingTime / batchSteps), batchSteps);
      this.device.submit(encoder.finish());
      completed += batchSteps;
    }
    return this.output;
  }

  /** Rotate a completed snapshot interval, preserving its endpoint field. */
  setNextSnapshot(input: SphericalVectorFieldInput, endTime: number): void {
    assert(
      this.interval && this.remainingTime === 0 && Number.isFinite(endTime) && endTime > this.time
    );
    const next = new SphericalFlowField(this.device, input);
    if (
      next.texture.width !== this.currentField.texture.width ||
      next.texture.height !== this.currentField.texture.height
    ) {
      next.destroy();
      assert(false);
    }
    const startTime = this.time;
    this.currentField.destroy();
    this.currentField = this.nextField;
    this.nextField = next;
    this.interval = [startTime, endTime];
    this.elapsed = 0;
    this.compensation = 0;
  }

  /** Release all owned resources; callers must finish using recorded commands first. */
  destroy(): void {
    this.commandGraph.destroy();
    this.kernel.destroy();
    this.uniforms.destroy();
    for (const state of this.states) state.destroy();
    this.currentField.destroy();
    if (this.nextField !== this.currentField) this.nextField.destroy();
  }
}
