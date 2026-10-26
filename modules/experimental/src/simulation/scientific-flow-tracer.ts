// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, Texture, type Device, type QuerySet} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '@luma.gl/graph/gpu-core';
import {
  ScientificFlowField,
  type ScientificFlowFieldProps,
  type ScientificVectorFieldInput
} from './scientific-flow-field';
import {SCIENTIFIC_FLOW_RK45} from './scientific-flow-rk45.wgsl';

/** Stable values stored in diagnostics.z; particle identity is its buffer index. */
export enum ScientificParticleStatus {
  Active = 0,
  Expired = 1,
  OutsideDomain = 2,
  MissingData = 3,
  ToleranceFailure = 4,
  NumericalFailure = 5
}

export type ScientificFlowTracerProps = ScientificFlowFieldProps & {
  /** Interleaved normalized x/y positions. These are copied, never borrowed. */
  positions: Float32Array;
  nextInput?: ScientificVectorFieldInput;
  timeRange?: readonly [number, number];
  /** Absolute local position-error tolerance: bounds units, or metres for lnglat. */
  tolerance: number;
  minimumTimeStep?: number;
  maximumTimeStep?: number;
  initialTimeStep?: number;
  lifetime?: number;
  /** Maximum trials per particle per dispatch, including rejected trials (1–256). */
  maximumAttempts?: number;
};

export type ScientificFlowTraceResult = {
  /** Submitted encoding; resource previews read current allocations, not historical particles. */
  encoding: GPUCommandGraphEncoding;
  /** One-based dispatch number across all requests on this tracer. */
  dispatchIndex: number;
  isContinuation: boolean;
  /** Requested horizon, including while individual particles are still catching up. */
  targetTime: number;
  complete: boolean;
  /** Committed horizon; unchanged while a request still has unfinished particles. */
  time: number;
  pending: number;
  active: number;
  expired: number;
  outsideDomain: number;
  missingData: number;
  toleranceFailure: number;
  numericalFailure: number;
  /** Work counters for this dispatch only. */
  acceptedSteps: number;
  rejectedSteps: number;
  /** Compute-pass duration, present only when timestamp queries are supported. */
  gpuMilliseconds?: number;
};

/** Adaptive forward scientific tracing. Each advance/continue submits exactly one bounded dispatch. */
export class ScientificFlowTracer {
  readonly particleCount: number;
  /** Execution graph for inspection. Use advance()/continue() to execute it. */
  readonly commandGraph: CompiledGPUCommandGraph;
  /** Normalized x/y, age in seconds, generation (always 1; no implicit respawning). */
  readonly output: Buffer;
  readonly previous: Buffer;
  /** Per particle: elapsed request seconds, proposed dt, status, last accepted dt. */
  readonly diagnostics: Buffer;
  private currentField: ScientificFlowField;
  private nextField: ScientificFlowField;
  private readonly fieldOptions: Pick<ScientificFlowFieldProps, 'bounds' | 'coordinates'>;
  private readonly device: Device;
  private readonly uniforms: Buffer;
  private readonly statistics: Buffer;
  private readonly emptyStatistics: Buffer;
  private dispatchIndex = 0;
  private readonly kernel: Kernel;
  private readonly queries?: QuerySet;
  private readonly tolerance: number;
  private readonly minimumTimeStep: number;
  private readonly maximumTimeStep: number;
  private readonly lifetime: number;
  private readonly maximumAttempts: number;
  private timeRange?: readonly [number, number];
  private elapsedTime = 0;
  private timeCompensation = 0;
  private pendingDuration: number | undefined;
  private busy = false;
  private destroyed = false;
  private failed = false;

  constructor(device: Device, props: ScientificFlowTracerProps) {
    assert(device.type === 'webgpu'); // Adaptive scientific tracing requires WebGPU.
    this.device = device;
    this.fieldOptions = {bounds: props.bounds, coordinates: props.coordinates};
    this.particleCount = props.positions.length / 2;
    this.tolerance = props.tolerance;
    this.minimumTimeStep = props.minimumTimeStep ?? 1e-4;
    this.maximumTimeStep = props.maximumTimeStep ?? 1;
    this.lifetime = props.lifetime ?? 1e30;
    this.maximumAttempts = props.maximumAttempts ?? 32;
    const initialTimeStep = props.initialTimeStep ?? this.maximumTimeStep;
    // Parameters must remain positive finite f32 values in the shader.
    assert(
      [
        this.tolerance,
        this.minimumTimeStep,
        this.maximumTimeStep,
        initialTimeStep,
        this.lifetime
      ].every(value => Number.isFinite(Math.fround(value)) && Math.fround(value) > 0)
    );
    assert(this.minimumTimeStep <= initialTimeStep && initialTimeStep <= this.maximumTimeStep);
    assert(
      Number.isInteger(this.particleCount) &&
        this.particleCount > 0 &&
        this.particleCount <= 1048576
    );
    assert(props.positions.every(Number.isFinite));
    assert(
      Number.isInteger(this.maximumAttempts) &&
        this.maximumAttempts >= 1 &&
        this.maximumAttempts <= 256
    );
    assert(Boolean(props.nextInput) === Boolean(props.timeRange));
    if (props.timeRange) {
      assert(
        props.timeRange.every(Number.isFinite) &&
          props.timeRange[1] > props.timeRange[0] &&
          Number.isFinite(props.timeRange[1] - props.timeRange[0])
      );
      this.timeRange = [props.timeRange[0], props.timeRange[1]];
    }
    const owned: {destroy(): void}[] = [];
    function own<ResourceType extends {destroy(): void}>(resource: ResourceType): ResourceType {
      owned.push(resource);
      return resource;
    }
    try {
      this.currentField = own(new ScientificFlowField(device, props));
      this.nextField = props.nextInput
        ? own(new ScientificFlowField(device, {...props, input: props.nextInput}))
        : this.currentField;
      this.validateField(this.nextField);
      const particles = new Float32Array(this.particleCount * 4);
      const diagnostics = new Float32Array(this.particleCount * 4);
      for (let index = 0; index < this.particleCount; index++) {
        particles.set(
          [props.positions[2 * index], props.positions[2 * index + 1], 0, 1],
          index * 4
        );
        diagnostics[index * 4 + 1] = initialTimeStep;
      }
      const makeBuffer = (id: string, data: Float32Array | Uint32Array) =>
        own(
          device.createBuffer({
            id,
            data,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        );
      this.output = makeBuffer('scientific-tracer-particles', particles);
      this.previous = makeBuffer('scientific-tracer-previous', particles);
      this.diagnostics = makeBuffer('scientific-tracer-diagnostics', diagnostics);
      this.statistics = makeBuffer('scientific-tracer-statistics', new Uint32Array(9));
      this.emptyStatistics = makeBuffer('scientific-tracer-empty-statistics', new Uint32Array(9));
      this.uniforms = own(
        device.createBuffer({
          id: 'scientific-tracer-parameters',
          byteLength: 64,
          usage: Buffer.UNIFORM | Buffer.COPY_SRC | Buffer.COPY_DST
        })
      );
      this.kernel = own(
        new Kernel(device, {
          id: 'scientific-tracer-rk45',
          source: SCIENTIFIC_FLOW_RK45,
          shaderLayout: {
            bindings: [
              {name: 'parameters', type: 'uniform', group: 0, location: 0},
              {name: 'particles', type: 'storage', group: 0, location: 1},
              {name: 'previous', type: 'storage', group: 0, location: 2},
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
              },
              {name: 'diagnostics', type: 'storage', group: 0, location: 5},
              {name: 'statistics', type: 'storage', group: 0, location: 6}
            ]
          }
        })
      );
      this.commandGraph = own(this.makeCommandGraph());
      if (device.features.has('timestamp-query'))
        this.queries = own(device.createQuerySet({type: 'timestamp', count: 2}));
    } catch (error) {
      for (const resource of owned.reverse()) resource.destroy();
      throw error;
    }
  }

  get field(): ScientificFlowField {
    return this.currentField;
  }
  get time(): number {
    return (this.timeRange?.[0] ?? 0) + this.elapsedTime;
  }
  get remainingTime(): number {
    return this.timeRange ? this.timeRange[1] - this.timeRange[0] - this.elapsedTime : Infinity;
  }
  get hasPendingWork(): boolean {
    return this.pendingDuration !== undefined;
  }

  /** Starts one request. Readback is nine counters (36 bytes), never particle positions. */
  async advance(deltaTime: number): Promise<ScientificFlowTraceResult> {
    assert(!this.destroyed && !this.failed && !this.busy && !this.hasPendingWork); // Finish pending work before starting another horizon.
    assert(Number.isFinite(deltaTime) && deltaTime >= 0 && Number.isFinite(Math.fround(deltaTime)));
    assert(deltaTime === 0 || Math.fround(deltaTime) > 0);
    assert(deltaTime <= this.remainingTime); // No extrapolation beyond the resident snapshot pair.
    this.pendingDuration = deltaTime;
    return await this.dispatch(true);
  }

  /** Resume the same horizon after exhausting a dispatch's trial budget. */
  async continue(): Promise<ScientificFlowTraceResult> {
    assert(!this.destroyed && !this.failed && !this.busy && this.pendingDuration !== undefined);
    return await this.dispatch(false);
  }

  /** Rotate only after all active particles have reached the endpoint (or stopped explicitly). */
  setNextSnapshot(input: ScientificVectorFieldInput, endTime: number): void {
    assert(
      !this.destroyed &&
        !this.failed &&
        !this.busy &&
        !this.hasPendingWork &&
        this.timeRange &&
        this.remainingTime === 0
    );
    assert(Number.isFinite(endTime) && endTime > this.time && Number.isFinite(endTime - this.time));
    const next = new ScientificFlowField(this.device, {...this.fieldOptions, input});
    try {
      this.validateField(next);
    } catch (error) {
      next.destroy();
      throw error;
    }
    const startTime = this.time;
    this.currentField.destroy();
    this.currentField = this.nextField;
    this.nextField = next;
    this.timeRange = [startTime, endTime];
    this.elapsedTime = 0;
    this.timeCompensation = 0;
  }

  destroy(): void {
    assert(!this.busy); // Await the outstanding dispatch before destroying its readback resources.
    if (this.destroyed) return;
    this.destroyed = true;
    this.commandGraph.destroy();
    this.kernel.destroy();
    this.queries?.destroy();
    for (const buffer of [
      this.output,
      this.previous,
      this.diagnostics,
      this.statistics,
      this.emptyStatistics,
      this.uniforms
    ])
      buffer.destroy();
    this.currentField.destroy();
    if (this.nextField !== this.currentField) this.nextField.destroy();
  }

  private makeCommandGraph(): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {id: 'scientific-flow-rk45'});
    const importBuffer = (buffer: Buffer) =>
      graph.importBuffer(
        {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
    const particles = importBuffer(this.output);
    const previous = importBuffer(this.previous);
    const diagnostics = importBuffer(this.diagnostics);
    const statistics = importBuffer(this.statistics);
    const emptyStatistics = importBuffer(this.emptyStatistics);
    const parameters = importBuffer(this.uniforms);
    const descriptor = {
      width: this.currentField.texture.width,
      height: this.currentField.texture.height,
      format: 'rgba32float' as const,
      usage: Texture.SAMPLE
    };
    const velocity = graph.importTexture({id: 'tracer-velocity', ...descriptor});
    const nextVelocity = graph.importTexture({id: 'tracer-next-velocity', ...descriptor});
    graph.addCopyPass({
      id: 'reset-trace-counters',
      description: 'Reset the nine per-dispatch counters before adaptive integration.',
      resources: [
        {buffer: emptyStatistics, usage: 'copy-source'},
        {buffer: statistics, usage: 'copy-destination'}
      ],
      workload: {
        operation: 'ResetTraceCounters',
        commandCount: 1,
        readByteLength: 36,
        writeByteLength: 36
      },
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(emptyStatistics),
            destinationBuffer: getBuffer(statistics),
            size: 36
          })
      })
    });
    graph.addComputePass({
      id: 'trace-particles-rk45',
      description: 'Bounded RKF45 trials with persistent particle progress and stopping reasons.',
      resources: [
        {buffer: parameters, usage: 'uniform'},
        {buffer: particles, usage: 'storage-read-write'},
        {buffer: previous, usage: 'storage-write'},
        {buffer: diagnostics, usage: 'storage-read-write'},
        {buffer: statistics, usage: 'storage-read-write'},
        {texture: velocity, usage: 'sampled'},
        {texture: nextVelocity, usage: 'sampled'}
      ],
      workload: {
        operation: 'AdaptiveRungeKuttaAdvection',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
        maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128
      },
      compile: () => ({
        encode: ({computePass, getBuffer, getTexture}) =>
          this.kernel.dispatch(computePass, {
            x: Math.ceil(this.particleCount / 128),
            bindings: {
              parameters: getBuffer(parameters),
              particles: getBuffer(particles),
              previous: getBuffer(previous),
              velocityField: getTexture(velocity),
              nextVelocityField: getTexture(nextVelocity),
              diagnostics: getBuffer(diagnostics),
              statistics: getBuffer(statistics)
            }
          })
      })
    });
    return graph.compile();
  }

  private validateField(field: ScientificFlowField): void {
    assert(
      field.texture.width === this.currentField.texture.width &&
        field.texture.height === this.currentField.texture.height &&
        field.field.coordinates === this.currentField.field.coordinates &&
        field.field.bounds.every((value, index) => value === this.currentField.field.bounds[index])
    );
  }

  private async dispatch(first: boolean): Promise<ScientificFlowTraceResult> {
    this.busy = true;
    try {
      const duration = this.pendingDuration!;
      const [west, south, east, north] = this.currentField.field.bounds;
      const interval = this.timeRange ? this.timeRange[1] - this.timeRange[0] : 1;
      const maximumTimeStep = Math.min(
        this.maximumTimeStep,
        0.5 / Math.max(this.currentField.maximumCellSpeed, this.nextField.maximumCellSpeed)
      );
      const bytes = new ArrayBuffer(64);
      const view = new DataView(bytes);
      [
        west,
        south,
        east - west,
        north - south,
        this.tolerance,
        this.minimumTimeStep,
        maximumTimeStep,
        this.lifetime
      ].forEach((value, index) => view.setFloat32(index * 4, value, true));
      [
        this.particleCount,
        this.currentField.field.coordinates === 'lnglat' ? 1 : 0,
        this.maximumAttempts,
        first ? 1 : 0
      ].forEach((value, index) => view.setUint32(32 + index * 4, value, true));
      [
        this.timeRange ? this.elapsedTime / interval : 0,
        this.timeRange ? Math.min(1, (this.elapsedTime + duration) / interval) : 0,
        duration,
        0
      ].forEach((value, index) => view.setFloat32(48 + index * 4, value, true));
      this.uniforms.write(new Uint8Array(bytes));
      const encoder = this.device.createCommandEncoder({timeProfilingQuerySet: this.queries});
      const encoding = this.commandGraph.encode(encoder, {
        parameters: undefined,
        textures: {
          'tracer-velocity': this.currentField.texture,
          'tracer-next-velocity': this.nextField.texture
        }
      });
      this.device.submit(encoder.finish());
      this.dispatchIndex++;
      const result = await this.statistics.readAsync();
      const counts = new Uint32Array(result.buffer, result.byteOffset, 9);
      const {gpuTimeMilliseconds: gpuMilliseconds} = await encoding.readTimings();
      const targetTime = this.time + duration;
      const complete = counts[6] === 0;
      if (complete) {
        const increment = duration - this.timeCompensation;
        const endTime = this.elapsedTime + increment;
        this.timeCompensation = endTime - this.elapsedTime - increment;
        this.elapsedTime = endTime;
        if (this.timeRange && Math.abs(this.elapsedTime - interval) <= interval * 1e-12) {
          this.elapsedTime = interval;
          this.timeCompensation = 0;
        }
        this.pendingDuration = undefined;
      }
      return {
        encoding,
        dispatchIndex: this.dispatchIndex,
        isContinuation: !first,
        targetTime,
        complete,
        time: this.time,
        active: counts[0],
        expired: counts[1],
        outsideDomain: counts[2],
        missingData: counts[3],
        toleranceFailure: counts[4],
        numericalFailure: counts[5],
        pending: counts[6],
        acceptedSteps: counts[7],
        rejectedSteps: counts[8],
        ...(gpuMilliseconds === undefined ? {} : {gpuMilliseconds})
      };
    } catch (error) {
      // GPU completion is unknown after a submission/readback failure. Do not retry stale progress.
      this.failed = true;
      throw error;
    } finally {
      this.busy = false;
    }
  }
}
