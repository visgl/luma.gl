// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert, Buffer, Texture, type Device, type QuerySet} from '@luma.gl/core';
import {Kernel} from '../../execution/compute/kernel';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '../../gpu-core/index';
import {SphericalFlowField, type SphericalVectorFieldInput} from './spherical-flow-field';
import type {SphericalFlowGraphProps} from './spherical-flow-graph';
import type {ScientificFlowTraceResult} from './scientific-flow-tracer';
import {SPHERICAL_FLOW_RK45} from './spherical-flow-rk45-shaders';

/** Forward adaptive sphere transport with a bounded trial budget per call. */
export type SphericalFlowTracerProps = Omit<SphericalFlowGraphProps, 'integrator'> & {
  /** Absolute local embedded error tolerance in physical radius-distance units. */
  tolerance: number;
  /** Smallest trial proposal, except clipped horizon/lifetime endpoints. */
  minimumTimeStep?: number;
  /** Initial trial proposal, capped by the grid/speed bound. */
  initialTimeStep?: number;
  /** Maximum attempted trials per particle per call, including rejected steps (1–256). */
  maximumAttempts?: number;
  /** Physical lifetime in seconds; default 1e30. */
  lifetime?: number;
};

/** Adaptive unit-sphere RKF45 with explicit counter readback and inspectable execution. */
export class SphericalFlowTracer {
  /** Stable particle slot count. */
  readonly particleCount: number;
  /** Physical radius in input velocity distance units. */
  readonly radius: number;
  /** Unit Cartesian xyz and physical age in seconds. */
  readonly output: Buffer;
  /** Unit Cartesian xyz and age before the most recent call. */
  readonly previous: Buffer;
  /** Request elapsed seconds, proposed timestep, ScientificParticleStatus, last accepted timestep. */
  readonly diagnostics: Buffer;
  /** Actual counter-reset/integration graph; execute through advance/continue only. */
  readonly commandGraph: CompiledGPUCommandGraph;
  /** Owning execution device. */
  private readonly device: Device;
  /** Physical integration limits. */
  private readonly options: Required<
    Pick<
      SphericalFlowTracerProps,
      | 'tolerance'
      | 'minimumTimeStep'
      | 'maximumTimeStep'
      | 'initialTimeStep'
      | 'maximumAttempts'
      | 'lifetime'
    >
  >;
  /** Current resident field snapshot. */
  private currentField: SphericalFlowField;
  /** Following resident field snapshot. */
  private nextField: SphericalFlowField;
  /** Physical resident time interval, absent for stationary transport. */
  private interval?: readonly [number, number];
  /** Elapsed committed time within the resident interval. */
  private elapsed = 0;
  /** Compensated clock summation residual. */
  private compensation = 0;
  /** Requested duration retained across bounded continuation calls. */
  private pendingDuration?: number;
  /** Protect asynchronous readback and resource ownership. */
  private busy = false;
  /** Prevent reuse after destruction or unknown GPU completion. */
  private unavailable = false;
  /** Track destruction separately from a failed GPU submission. */
  private destroyed = false;
  /** One-based number of submitted integration dispatches. */
  private dispatchIndex = 0;
  /** Immutable for the lifetime of an awaited dispatch. */
  private readonly uniforms: Buffer;
  /** Nine status/progress/work counters. */
  private readonly statistics: Buffer;
  /** Zero counter reset source. */
  private readonly emptyStatistics: Buffer;
  /** Spherical RKF45 integration kernel. */
  private readonly kernel: Kernel;
  /** Optional GPU compute timestamps. */
  private readonly queries?: QuerySet;

  /** Validate and upload a stable particle release and global field snapshots. */
  constructor(device: Device, props: SphericalFlowTracerProps) {
    // Adaptive transport requires WebGPU and positive finite f32 physical parameters.
    assert(device.type === 'webgpu');
    this.device = device;
    this.options = {
      tolerance: props.tolerance,
      maximumTimeStep: props.maximumTimeStep,
      minimumTimeStep: props.minimumTimeStep ?? 1e-4,
      initialTimeStep: props.initialTimeStep ?? props.maximumTimeStep,
      lifetime: props.lifetime ?? 1e30,
      maximumAttempts: props.maximumAttempts ?? 32
    };
    assert(
      [
        props.radius,
        props.tolerance,
        props.maximumTimeStep,
        this.options.minimumTimeStep!,
        this.options.initialTimeStep!,
        this.options.lifetime!
      ].every(value => Number.isFinite(Math.fround(value)) && Math.fround(value) > 0)
    );
    // Proposals and trial budgets must respect their explicit bounds.
    assert(
      this.options.minimumTimeStep! <= this.options.initialTimeStep! &&
        this.options.initialTimeStep! <= props.maximumTimeStep
    );
    assert(
      Number.isInteger(this.options.maximumAttempts) &&
        this.options.maximumAttempts! >= 1 &&
        this.options.maximumAttempts! <= 256
    );
    this.radius = props.radius;
    this.particleCount = props.positions.length / 3;
    // One vec4 of state per stable slot must fit the device's storage binding limit.
    assert(
      Number.isInteger(this.particleCount) &&
        this.particleCount > 0 &&
        this.particleCount <= 1048576 &&
        this.particleCount * 16 <= device.limits.maxStorageBufferBindingSize
    );
    assert(Boolean(props.nextInput) === Boolean(props.timeRange)); // Temporal snapshots require a matching interval.
    if (props.timeRange) {
      assert(
        props.timeRange.every(Number.isFinite) &&
          props.timeRange[1] > props.timeRange[0] &&
          Number.isFinite(props.timeRange[1] - props.timeRange[0])
      ); // No infinite or reversed intervals.
      this.interval = [...props.timeRange];
    }
    /** Owned resources collected for constructor failure cleanup. */
    const owned: {destroy(): void}[] = [];
    /** Register each allocation immediately, before later allocations can fail. */
    const own = <Resource extends {destroy(): void}>(resource: Resource): Resource => {
      owned.push(resource);
      return resource;
    };
    try {
      this.currentField = own(new SphericalFlowField(device, props.input));
      this.nextField = props.nextInput
        ? own(new SphericalFlowField(device, props.nextInput))
        : this.currentField;
      this.validateField(this.nextField);
      /** Normalized Cartesian release and initial physical age. */
      const particles = new Float32Array(this.particleCount * 4);
      /** Persistent adaptive progress and initial proposal. */
      const diagnostics = new Float32Array(particles.length);
      /** Stable release cursor. */
      for (let index = 0; index < this.particleCount; index++) {
        /** Input direction length; normalization happens only once on upload. */
        const length = Math.hypot(
          props.positions[index * 3],
          props.positions[index * 3 + 1],
          props.positions[index * 3 + 2]
        );
        assert(Number.isFinite(length) && length > 0); // Directions must be finite and nonzero.
        particles.set(
          [
            props.positions[index * 3] / length,
            props.positions[index * 3 + 1] / length,
            props.positions[index * 3 + 2] / length,
            0
          ],
          index * 4
        );
        diagnostics[index * 4 + 1] = this.options.initialTimeStep!;
      }
      /** Allocate owned state with explicit copy/readback support. */
      const makeBuffer = (id: string, data: Float32Array | Uint32Array) =>
        own(
          device.createBuffer({id, data, usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST})
        );
      this.output = makeBuffer('spherical-tracer-particles', particles);
      this.previous = makeBuffer('spherical-tracer-previous', particles);
      this.diagnostics = makeBuffer('spherical-tracer-diagnostics', diagnostics);
      this.statistics = makeBuffer('spherical-tracer-statistics', new Uint32Array(9));
      this.emptyStatistics = makeBuffer('spherical-tracer-empty-statistics', new Uint32Array(9));
      this.uniforms = own(
        device.createBuffer({
          id: 'spherical-tracer-parameters',
          byteLength: 64,
          usage: Buffer.UNIFORM | Buffer.COPY_DST
        })
      );
      this.kernel = own(
        new Kernel(device, {
          id: 'spherical-tracer-rk45',
          source: SPHERICAL_FLOW_RK45,
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
      /** Release each successfully allocated resource in reverse ownership order. */
      for (const resource of owned.reverse()) resource.destroy();
      throw error;
    }
  }

  /** Committed physical horizon; unchanged while particles are catching up. */
  get time(): number {
    return (this.interval?.[0] ?? 0) + this.elapsed;
  }
  /** Remaining resident time, or infinity for a stationary field. */
  get remainingTime(): number {
    return this.interval ? this.interval[1] - this.interval[0] - this.elapsed : Infinity;
  }
  /** Whether continue() must finish the current request. */
  get hasPendingWork(): boolean {
    return this.pendingDuration !== undefined;
  }
  /** Start a physical horizon and submit one bounded adaptive dispatch. */
  async advance(duration: number): Promise<ScientificFlowTraceResult> {
    assert(!this.unavailable && !this.busy && !this.hasPendingWork); // Finish pending requests before starting another.
    assert(
      Number.isFinite(duration) &&
        duration >= 0 &&
        duration <= this.remainingTime &&
        Number.isFinite(Math.fround(duration)) &&
        (duration === 0 || Math.fround(duration) > 0)
    ); // No extrapolation or unrepresentable request duration.
    this.pendingDuration = duration;
    return this.dispatch(true);
  }
  /** Resume the same physical horizon with another bounded trial budget. */
  async continue(): Promise<ScientificFlowTraceResult> {
    assert(!this.unavailable && !this.busy && this.hasPendingWork); // A continuation requires unfinished work.
    return this.dispatch(false);
  }
  /** Rotate resident snapshots only after the previous endpoint has committed. */
  setNextSnapshot(input: SphericalVectorFieldInput, endTime: number): void {
    assert(
      !this.unavailable &&
        !this.busy &&
        !this.hasPendingWork &&
        this.interval &&
        this.remainingTime === 0
    ); // Snapshot rotation cannot interrupt a horizon.
    assert(Number.isFinite(endTime) && endTime > this.time && Number.isFinite(endTime - this.time)); // The next interval must be finite and forward.
    /** Upload before releasing current allocations so validation failure preserves the tracer. */
    const next = new SphericalFlowField(this.device, input);
    try {
      this.validateField(next);
    } catch (error) {
      next.destroy();
      throw error;
    }
    /** Preserve absolute time before replacing the interval. */
    const startTime = this.time;
    this.currentField.destroy();
    this.currentField = this.nextField;
    this.nextField = next;
    this.interval = [startTime, endTime];
    this.elapsed = 0;
    this.compensation = 0;
  }
  /** Release owned resources after any outstanding readback has completed. */
  destroy(): void {
    assert(!this.busy); // Outstanding readback owns these buffers until its promise settles.
    if (this.destroyed) return;
    this.destroyed = true;
    this.unavailable = true;
    this.commandGraph.destroy();
    this.kernel.destroy();
    this.queries?.destroy();
    /** Release owned particle, parameter and readback storage. */
    for (const buffer of [
      this.output,
      this.previous,
      this.diagnostics,
      this.uniforms,
      this.statistics,
      this.emptyStatistics
    ])
      buffer.destroy();
    this.currentField.destroy();
    if (this.nextField !== this.currentField) this.nextField.destroy();
  }
  /** All resident snapshots use the same regular global grid. */
  private validateField(field: SphericalFlowField): void {
    assert(
      field.texture.width === this.currentField.texture.width &&
        field.texture.height === this.currentField.texture.height
    ); // Snapshot interpolation requires matching grid dimensions.
  }
  /** Build the actual reset and bounded-integration graph exposed to inspectors. */
  private makeCommandGraph(): CompiledGPUCommandGraph {
    /** Graph owns execution metadata while imported buffers remain tracer-owned. */
    const graph = new GPUCommandGraph(this.device, {id: 'spherical-flow-rk45'});
    /** Import exact storage usages and retain stable buffer identities. */
    const importBuffer = (buffer: Buffer) =>
      graph.importBuffer(
        {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
    /** Typed shader buffer bindings imported into the graph. */
    const buffers = {
      parameters: importBuffer(this.uniforms),
      particles: importBuffer(this.output),
      previous: importBuffer(this.previous),
      diagnostics: importBuffer(this.diagnostics),
      statistics: importBuffer(this.statistics)
    };
    /** Nine zero counters copied before each dispatch. */
    const empty = importBuffer(this.emptyStatistics);
    /** Global snapshot descriptors shared by both resident fields. */
    const descriptor = {
      width: this.currentField.texture.width,
      height: this.currentField.texture.height,
      format: 'rgba32float' as const,
      usage: Texture.SAMPLE
    };
    /** Current velocity texture rebound at snapshot rotation. */
    const velocity = graph.importTexture({id: 'spherical-tracer-field', ...descriptor});
    /** Following velocity texture rebound at snapshot rotation. */
    const nextVelocity = graph.importTexture({id: 'spherical-tracer-next-field', ...descriptor});
    graph.addCopyPass({
      id: 'reset-spherical-counters',
      resources: [
        {buffer: empty, usage: 'copy-source'},
        {buffer: buffers.statistics, usage: 'copy-destination'}
      ],
      workload: {
        operation: 'ResetSphericalCounters',
        commandCount: 1,
        readByteLength: 36,
        writeByteLength: 36
      },
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) =>
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(empty),
            destinationBuffer: getBuffer(buffers.statistics),
            size: 36
          })
      })
    });
    graph.addComputePass({
      id: 'trace-sphere-rk45',
      description: 'Bounded adaptive Cartesian sphere stages and physical chord-error control.',
      resources: [
        {buffer: buffers.parameters, usage: 'uniform'},
        {buffer: buffers.particles, usage: 'storage-read-write'},
        {buffer: buffers.previous, usage: 'storage-write'},
        {buffer: buffers.diagnostics, usage: 'storage-read-write'},
        {buffer: buffers.statistics, usage: 'storage-read-write'},
        {texture: velocity, usage: 'sampled'},
        {texture: nextVelocity, usage: 'sampled'}
      ],
      workload: {
        operation: 'AdaptiveSphericalAdvection',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
        maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128
      },
      compile: () => ({
        encode: ({computePass, getBuffer, getTexture}) =>
          this.kernel.dispatch(computePass, {
            x: Math.ceil(this.particleCount / 128),
            bindings: {
              parameters: getBuffer(buffers.parameters),
              particles: getBuffer(buffers.particles),
              previous: getBuffer(buffers.previous),
              diagnostics: getBuffer(buffers.diagnostics),
              statistics: getBuffer(buffers.statistics),
              velocityField: getTexture(velocity),
              nextVelocityField: getTexture(nextVelocity)
            }
          })
      })
    });
    return graph.compile();
  }
  /** Encode and await one trial budget without reading particle state. */
  private async dispatch(first: boolean): Promise<ScientificFlowTraceResult> {
    this.busy = true;
    try {
      /** Pending horizon duration shared by all continuation calls. */
      const duration = this.pendingDuration!;
      /** Physical interval length used only for snapshot interpolation. */
      const interval = this.interval ? this.interval[1] - this.interval[0] : 1;
      /** Angular grid travel cap independent of the local error controller. */
      const spacing = Math.min(
        Math.PI / (this.currentField.texture.height - 1),
        (2 * Math.PI) / (this.currentField.texture.width - 1)
      );
      /** Conservative physical timestep cap. */
      const maximumTimeStep = Math.min(
        this.options.maximumTimeStep,
        (0.5 * spacing * this.radius) /
          Math.max(this.currentField.maximumSpeed, this.nextField.maximumSpeed)
      );
      /** Packed WGSL parameters with separately encoded integer counters. */
      const bytes = new ArrayBuffer(64);
      /** Little-endian parameter writer. */
      const view = new DataView(bytes);
      [
        this.radius,
        this.options.tolerance,
        this.options.minimumTimeStep!,
        maximumTimeStep,
        this.options.lifetime!,
        0,
        0,
        0,
        this.interval ? this.elapsed / interval : 0,
        this.interval ? Math.min(1, (this.elapsed + duration) / interval) : 0,
        duration,
        0
      ].forEach((value, index) => view.setFloat32(index * 4, value, true));
      [this.particleCount, this.options.maximumAttempts!, first ? 1 : 0, 0].forEach(
        (value, index) => view.setUint32(48 + index * 4, value, true)
      );
      this.uniforms.write(new Uint8Array(bytes));
      /** Command encoder with optional immutable per-encoding timing snapshots. */
      const encoder = this.device.createCommandEncoder({timeProfilingQuerySet: this.queries});
      /** Inspected execution encoding returned to the caller. */
      const encoding = this.commandGraph.encode(encoder, {
        parameters: undefined,
        textures: {
          'spherical-tracer-field': this.currentField.texture,
          'spherical-tracer-next-field': this.nextField.texture
        }
      });
      this.device.submit(encoder.finish());
      this.dispatchIndex++;
      /** Explicit 36-byte status/work synchronization. */
      const result = await this.statistics.readAsync();
      /** Fixed status/progress/work layout shared with Cartesian RK45 results. */
      const counts = new Uint32Array(result.buffer, result.byteOffset, 9);
      /** Optional complete compute-pass timing. */
      const timings = await encoding.readTimings();
      /** Requested absolute endpoint, even while slots are catching up. */
      const targetTime = this.time + duration;
      /** A horizon completes when every slot reaches it or terminates explicitly. */
      const complete = counts[6] === 0;
      if (complete) {
        /** Compensated physical clock increment. */
        const increment = duration - this.compensation;
        /** Candidate committed elapsed time. */
        const endTime = this.elapsed + increment;
        this.compensation = endTime - this.elapsed - increment;
        this.elapsed = endTime;
        if (this.interval && Math.abs(this.elapsed - interval) <= interval * 1e-12) {
          this.elapsed = interval;
          this.compensation = 0;
        }
        this.pendingDuration = undefined;
      }
      return {
        encoding,
        encodings: [encoding],
        dispatchCount: 1,
        dispatchIndex: this.dispatchIndex,
        counterReadbackBytes: 36,
        scheduledParticles: this.particleCount,
        integrationWorkgroups: Math.ceil(this.particleCount / 128),
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
        ...(timings.gpuTimeMilliseconds === undefined
          ? {}
          : {gpuMilliseconds: timings.gpuTimeMilliseconds})
      };
    } catch (error) {
      this.unavailable = true;
      throw error;
    } finally {
      this.busy = false;
    }
  }
}
