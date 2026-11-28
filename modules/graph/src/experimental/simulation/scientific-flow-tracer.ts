// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, Texture, type Device, type QuerySet} from '@luma.gl/core';
import {Kernel} from '../../execution/compute/kernel';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding
} from '@luma.gl/graph/gpu-core';
import {
  ScientificFlowField,
  type ScientificFlowFieldProps,
  type ScientificFlowInput
} from './scientific-flow-field';
import {makeScientificFlowRK45Shader} from './scientific-flow-rk45-shaders';
import {makeScientificFlowSchedulingShader} from './scientific-flow-scheduling-shaders';

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
  nextInput?: ScientificFlowInput;
  timeRange?: readonly [number, number];
  /** Absolute local position-error tolerance: bounds units, or metres for lnglat. */
  tolerance: number;
  /** Reject trials whose accepted chord crosses an interpolation cell with missing samples. */
  conservativeMask?: boolean;
  minimumTimeStep?: number;
  maximumTimeStep?: number;
  initialTimeStep?: number;
  lifetime?: number;
  /** Maximum trials per particle per dispatch, including rejected trials (1–256). */
  maximumAttempts?: number;
  /** Fixed dispatches submitted before one counter readback (1–32). Default 1 retains interactive behavior. */
  dispatchesPerReadback?: number;
  /** Opt-in GPU queue and indirect integration; dense remains the default. */
  scheduling?: 'dense' | 'active' | 'persistent';
};

export type ScientificFlowTraceResult = {
  /** Final submitted encoding; resource previews read current allocations, not historical particles. */
  encoding: GPUCommandGraphEncoding;
  /** One-based dispatch number across all requests on this tracer. */
  dispatchIndex: number;
  /** Actual encodings in submission order, including any idle tail dispatches. */
  encodings: readonly GPUCommandGraphEncoding[];
  /** Number of bounded dispatches submitted by this call. */
  dispatchCount: number;
  /** Bytes in the single counter readback; never particle state. */
  counterReadbackBytes: number;
  /** Particle slots scheduled for integration across this batch; excludes queue scans. */
  scheduledParticles: number;
  /** Integration workgroups actually launched across this batch; excludes queue scans. */
  integrationWorkgroups: number;
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
  /** Work counters summed across this call's dispatch batch. */
  acceptedSteps: number;
  rejectedSteps: number;
  /** Sum of batch compute-pass durations, present only when timestamp queries are supported. */
  gpuMilliseconds?: number;
};

/** Adaptive forward tracing with bounded dispatch batches and one counter readback per call. */
export class ScientificFlowTracer {
  readonly particleCount: number;
  /** Execution graph for inspection. Use advance()/continue() to execute it. */
  readonly commandGraph: CompiledGPUCommandGraph;
  /** Normalized x/y, age in seconds, generation (always 1; no implicit respawning). */
  readonly output: Buffer;
  /** Particle records before the latest advance/continue batch, including idle-tail batches. */
  readonly previous: Buffer;
  /** Per particle: elapsed request seconds, proposed dt, status, last accepted dt. */
  readonly diagnostics: Buffer;
  private currentField: ScientificFlowField;
  private nextField: ScientificFlowField;
  private readonly fieldOptions: Pick<
    ScientificFlowFieldProps,
    'bounds' | 'coordinates' | 'periodicLongitude'
  >;
  private readonly device: Device;
  private readonly uniforms: Buffer;
  /** One immutable uniform allocation per dispatch in a submitted batch. */
  private readonly batchUniforms: Buffer[];
  /** Contiguous per-dispatch counter snapshots for one explicit readback. */
  private readonly batchStatistics: Buffer;
  /** Bounded batch size; completed particles skip subsequent trials. */
  private readonly dispatchesPerReadback: number;
  /** Optional stable-ID queue; the first word stores its populated length. */
  private readonly activeIndices?: Buffer;
  /** Optional three-word indirect integration command. */
  private readonly dispatchArguments?: Buffer;
  /** Constant [0, 1, 1] command used to reset the indirect workgroup count. */
  private readonly emptyDispatchArguments?: Buffer;
  /** Optional GPU queue builder, kept separate from expensive integration. */
  private readonly schedulingKernel?: Kernel;
  /** Counter snapshot stride, including queue telemetry only in active mode. */
  private readonly statisticsByteLength: number;
  /** Second queue, populated directly by unfinished integration invocations. */
  private readonly survivorIndices?: Buffer;
  /** Indirect command for the second queue. */
  private readonly survivorArguments?: Buffer;
  /** Logical queue cursor; bindings are captured separately for every encoding. */
  private queueCursor = 0;
  /** CPU-known request boundary controlling the initial full-slot scan. */
  private initializeQueue = false;
  /** CPU-known call boundary controlling the stable previous-state copy. */
  private capturePrevious = false;
  private readonly statistics: Buffer;
  private readonly emptyStatistics: Buffer;
  private dispatchIndex = 0;
  private readonly kernel: Kernel;
  private readonly queries?: QuerySet;
  private readonly tolerance: number;
  /** Whether to validate the swept interpolation footprint. */
  private readonly conservativeMask: boolean;
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
    // Only the explicit scheduling contracts are supported.
    assert(
      props.scheduling === undefined ||
        props.scheduling === 'dense' ||
        props.scheduling === 'active' ||
        props.scheduling === 'persistent'
    );
    this.statisticsByteLength = props.scheduling && props.scheduling !== 'dense' ? 44 : 36;
    this.fieldOptions = {
      bounds: props.bounds,
      coordinates: props.coordinates,
      periodicLongitude: props.periodicLongitude
    };
    this.particleCount = props.positions.length / 2;
    this.tolerance = props.tolerance;
    this.conservativeMask = props.conservativeMask ?? false;
    this.minimumTimeStep = props.minimumTimeStep ?? 1e-4;
    this.maximumTimeStep = props.maximumTimeStep ?? 1;
    this.lifetime = props.lifetime ?? 1e30;
    this.maximumAttempts = props.maximumAttempts ?? 32;
    this.dispatchesPerReadback = props.dispatchesPerReadback ?? 1;
    // Bound per-call dispatch work and uniform/counter allocations to 1–32 batches.
    assert(
      Number.isInteger(this.dispatchesPerReadback) &&
        this.dispatchesPerReadback >= 1 &&
        this.dispatchesPerReadback <= 32
    );
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
      this.batchUniforms = Array.from({length: this.dispatchesPerReadback}, (_, index) =>
        own(
          device.createBuffer({
            id: `scientific-tracer-parameters-${index}`,
            byteLength: 64,
            usage: Buffer.UNIFORM | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        )
      );
      this.uniforms = this.batchUniforms[0];
      this.batchStatistics = own(
        device.createBuffer({
          id: 'scientific-tracer-batch-statistics',
          byteLength: this.statisticsByteLength * this.dispatchesPerReadback,
          usage: Buffer.COPY_SRC | Buffer.COPY_DST
        })
      );
      if (props.scheduling === 'active' || props.scheduling === 'persistent') {
        this.activeIndices = own(
          device.createBuffer({
            id: 'scientific-tracer-active-indices',
            byteLength: (this.particleCount + 1) * 4,
            usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        );
        this.dispatchArguments = own(
          device.createBuffer({
            id: 'scientific-tracer-dispatch-arguments',
            byteLength: 12,
            usage: Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_SRC | Buffer.COPY_DST
          })
        );
        this.emptyDispatchArguments = makeBuffer(
          'scientific-tracer-empty-dispatch',
          new Uint32Array([0, 1, 1])
        );
        if (props.scheduling === 'persistent') {
          this.survivorIndices = own(
            device.createBuffer({
              id: 'scientific-tracer-survivor-indices',
              byteLength: this.activeIndices.byteLength,
              usage: this.activeIndices.usage
            })
          );
          this.survivorArguments = own(
            device.createBuffer({
              id: 'scientific-tracer-survivor-arguments',
              byteLength: 12,
              usage: this.dispatchArguments.usage
            })
          );
        }
        this.schedulingKernel = own(
          new Kernel(device, {
            id: 'scientific-tracer-schedule',
            source: makeScientificFlowSchedulingShader(Boolean(this.survivorIndices)),
            shaderLayout: {
              bindings: [
                {name: 'parameters', type: 'uniform', group: 0, location: 0},
                {name: 'particles', type: 'read-only-storage', group: 0, location: 1},
                {name: 'previous', type: 'storage', group: 0, location: 2},
                {name: 'diagnostics', type: 'storage', group: 0, location: 3},
                {name: 'statistics', type: 'storage', group: 0, location: 4},
                {name: 'activeIndices', type: 'storage', group: 0, location: 5},
                {name: 'dispatchArguments', type: 'storage', group: 0, location: 6}
              ]
            }
          })
        );
      }
      this.kernel = own(
        new Kernel(device, {
          id: 'scientific-tracer-rk45',
          source: makeScientificFlowRK45Shader(
            Boolean(this.activeIndices),
            Boolean(this.survivorIndices)
          ),
          shaderLayout: {
            bindings: [
              {name: 'parameters', type: 'uniform', group: 0, location: 0},
              {name: 'particles', type: 'storage', group: 0, location: 1},
              ...(this.activeIndices
                ? []
                : [{name: 'previous', type: 'storage' as const, group: 0, location: 2}]),
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
              {name: 'statistics', type: 'storage', group: 0, location: 6},
              ...(this.survivorIndices
                ? [
                    {name: 'survivorIndices', type: 'storage' as const, group: 0, location: 8},
                    {name: 'survivorArguments', type: 'storage' as const, group: 0, location: 9}
                  ]
                : []),
              ...(this.activeIndices
                ? [
                    {
                      name: 'activeIndices',
                      type: 'read-only-storage' as const,
                      group: 0,
                      location: 7
                    }
                  ]
                : [])
            ]
          }
        })
      );
      this.commandGraph = own(this.makeCommandGraph());
      if (device.features.has('timestamp-query'))
        this.queries = own(
          device.createQuerySet({
            type: 'timestamp',
            count: (this.activeIndices ? 4 : 2) * this.dispatchesPerReadback
          })
        );
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

  /** Start one horizon; submit the configured dispatch batch, then read only its counter snapshots. */
  async advance(deltaTime: number): Promise<ScientificFlowTraceResult> {
    assert(!this.destroyed && !this.failed && !this.busy && !this.hasPendingWork); // Finish pending work before starting another horizon.
    assert(Number.isFinite(deltaTime) && deltaTime >= 0 && Number.isFinite(Math.fround(deltaTime)));
    assert(deltaTime === 0 || Math.fround(deltaTime) > 0);
    assert(deltaTime <= this.remainingTime); // No extrapolation beyond the resident snapshot pair.
    this.pendingDuration = deltaTime;
    return await this.dispatch(true);
  }

  /** Resume the same horizon after exhausting the previous batch's trial budget. */
  async continue(): Promise<ScientificFlowTraceResult> {
    assert(!this.destroyed && !this.failed && !this.busy && this.pendingDuration !== undefined);
    return await this.dispatch(false);
  }

  /** Rotate only after all active particles have reached the endpoint (or stopped explicitly). */
  setNextSnapshot(input: ScientificFlowInput, endTime: number): void {
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
    this.schedulingKernel?.destroy();
    this.survivorIndices?.destroy();
    this.survivorArguments?.destroy();
    this.activeIndices?.destroy();
    this.dispatchArguments?.destroy();
    this.emptyDispatchArguments?.destroy();
    this.queries?.destroy();
    for (const buffer of [
      this.output,
      this.previous,
      this.diagnostics,
      this.statistics,
      this.emptyStatistics,
      this.batchStatistics,
      ...this.batchUniforms
    ])
      buffer.destroy();
    this.currentField.destroy();
    if (this.nextField !== this.currentField) this.nextField.destroy();
  }

  private makeCommandGraph(): CompiledGPUCommandGraph {
    if (this.survivorIndices) return this.makePersistentCommandGraph();
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
    /** Optional compact queue imported once into the inspected graph. */
    const activeIndices = this.activeIndices ? importBuffer(this.activeIndices) : undefined;
    /** GPU-written dispatch record consumed by the integration pass. */
    const dispatchArguments = this.dispatchArguments
      ? importBuffer(this.dispatchArguments)
      : undefined;
    /** Immutable reset command for an empty queue. */
    const emptyDispatchArguments = this.emptyDispatchArguments
      ? importBuffer(this.emptyDispatchArguments)
      : undefined;
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
    if (activeIndices && dispatchArguments && emptyDispatchArguments) {
      graph.addCopyPass({
        id: 'reset-active-queue',
        description: 'Reset queue length and indirect workgroups without a CPU readback.',
        workload: {
          operation: 'ResetActiveQueue',
          commandCount: 2,
          readByteLength: 16,
          writeByteLength: 16
        },
        resources: [
          {buffer: emptyDispatchArguments, usage: 'copy-source'},
          {buffer: activeIndices, usage: 'copy-destination'},
          {buffer: dispatchArguments, usage: 'copy-destination'}
        ],
        compile: () => ({
          encode: ({commandEncoder, getBuffer}) => {
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(emptyDispatchArguments),
              destinationBuffer: getBuffer(activeIndices),
              size: 4
            });
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(emptyDispatchArguments),
              destinationBuffer: getBuffer(dispatchArguments),
              size: 12
            });
          }
        })
      });
      graph.addComputePass({
        id: 'compact-active-particles',
        description: 'Scan stable slots, apply lifecycle changes and queue unfinished particles.',
        resources: [
          {buffer: parameters, usage: 'uniform'},
          {buffer: particles, usage: 'storage-read'},
          {buffer: previous, usage: 'storage-write'},
          {buffer: diagnostics, usage: 'storage-read-write'},
          {buffer: statistics, usage: 'storage-read-write'},
          {buffer: activeIndices, usage: 'storage-read-write'},
          {buffer: dispatchArguments, usage: 'storage-read-write'}
        ],
        workload: {
          operation: 'CompactActiveParticles',
          commandCount: 1,
          maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
          maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128
        },
        compile: () => ({
          encode: ({computePass, getBuffer}) =>
            this.schedulingKernel!.dispatch(computePass, {
              x: Math.ceil(this.particleCount / 128),
              bindings: {
                parameters: getBuffer(parameters),
                particles: getBuffer(particles),
                previous: getBuffer(previous),
                diagnostics: getBuffer(diagnostics),
                statistics: getBuffer(statistics),
                activeIndices: getBuffer(activeIndices),
                dispatchArguments: getBuffer(dispatchArguments)
              }
            })
        })
      });
    }
    graph.addComputePass({
      id: 'trace-particles-rk45',
      description: 'Bounded RKF45 trials with persistent particle progress and stopping reasons.',
      resources: [
        {buffer: parameters, usage: 'uniform'},
        {buffer: particles, usage: 'storage-read-write'},
        ...(activeIndices ? [] : [{buffer: previous, usage: 'storage-write' as const}]),
        {buffer: diagnostics, usage: 'storage-read-write'},
        {buffer: statistics, usage: 'storage-read-write'},
        ...(activeIndices ? [{buffer: activeIndices, usage: 'storage-read' as const}] : []),
        ...(dispatchArguments ? [{buffer: dispatchArguments, usage: 'indirect' as const}] : []),
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
        encode: ({computePass, getBuffer, getTexture}) => {
          /** Bind stable particle storage regardless of queue order. */
          const bindings = {
            parameters: getBuffer(parameters),
            particles: getBuffer(particles),
            ...(activeIndices ? {} : {previous: getBuffer(previous)}),
            velocityField: getTexture(velocity),
            nextVelocityField: getTexture(nextVelocity),
            diagnostics: getBuffer(diagnostics),
            statistics: getBuffer(statistics),
            ...(activeIndices ? {activeIndices: getBuffer(activeIndices)} : {})
          };
          if (dispatchArguments) {
            this.kernel.dispatchIndirect(computePass, {
              indirectBuffer: getBuffer(dispatchArguments),
              bindings
            });
          } else {
            this.kernel.dispatch(computePass, {x: Math.ceil(this.particleCount / 128), bindings});
          }
        }
      })
    });
    return graph.compile();
  }

  /** Initialize each horizon once, then integrate and append only unfinished stable IDs. */
  private makePersistentCommandGraph(): CompiledGPUCommandGraph {
    /** Persistent graph shares allocations with every encoding and swaps queue bindings explicitly. */
    const graph = new GPUCommandGraph(this.device, {id: 'scientific-flow-persistent-rk45'});
    /** Import owned storage with exact usages for dependency inference. */
    const importBuffer = (buffer: Buffer) =>
      graph.importBuffer(
        {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
        buffer
      );
    /** Stable public state and per-dispatch uniforms. */
    const particles = importBuffer(this.output);
    /** Full-slot pre-call state; a GPU copy preserves stopped and completed slots too. */
    const previous = importBuffer(this.previous);
    /** Stable adaptive progress. */
    const diagnostics = importBuffer(this.diagnostics);
    /** Persistent statuses plus transient pending/work counters. */
    const statistics = importBuffer(this.statistics);
    /** Zero counter source. */
    const emptyStatistics = importBuffer(this.emptyStatistics);
    /** Immutable parameters for each batch dispatch. */
    const parameters = importBuffer(this.uniforms);
    /** Input queue and command, rebound on every alternating dispatch. */
    const activeIndices = importBuffer(this.activeIndices!);
    /** Integration dispatch arguments for the input queue. */
    const dispatchArguments = importBuffer(this.dispatchArguments!);
    /** Output survivor queue. */
    const survivorIndices = importBuffer(this.survivorIndices!);
    /** GPU-written next integration command. */
    const survivorArguments = importBuffer(this.survivorArguments!);
    /** Empty indirect command with y=z=1. */
    const emptyArguments = importBuffer(this.emptyDispatchArguments!);
    /** Identical resident snapshot texture descriptors. */
    const descriptor = {
      width: this.currentField.texture.width,
      height: this.currentField.texture.height,
      format: 'rgba32float' as const,
      usage: Texture.SAMPLE
    };
    /** Current resident field. */
    const velocity = graph.importTexture({id: 'tracer-velocity', ...descriptor});
    /** Following resident field. */
    const nextVelocity = graph.importTexture({id: 'tracer-next-velocity', ...descriptor});
    graph.addCopyPass({
      id: 'prepare-survivor-dispatch',
      description:
        'Reset only transient counters and next queue; capture previous once per call and initialize the input queue once per horizon.',
      resources: [
        {buffer: particles, usage: 'copy-source'},
        {buffer: previous, usage: 'copy-destination'},
        {buffer: emptyStatistics, usage: 'copy-source'},
        {buffer: statistics, usage: 'copy-destination'},
        {buffer: emptyArguments, usage: 'copy-source'},
        ...[activeIndices, dispatchArguments, survivorIndices, survivorArguments].map(buffer => ({
          buffer,
          usage: 'copy-destination' as const
        }))
      ],
      workload: {
        operation: 'PrepareSurvivorDispatch',
        commandCount: 6,
        readByteLength: this.output.byteLength + 68,
        writeByteLength: this.output.byteLength + 68
      },
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) => {
          if (this.capturePrevious)
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(particles),
              destinationBuffer: getBuffer(previous),
              size: this.output.byteLength
            });
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(emptyStatistics),
            destinationBuffer: getBuffer(statistics),
            destinationOffset: this.initializeQueue ? 0 : 24,
            size: this.initializeQueue ? 36 : 12
          });
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(emptyArguments),
            destinationBuffer: getBuffer(survivorIndices),
            size: 4
          });
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(emptyArguments),
            destinationBuffer: getBuffer(survivorArguments),
            size: 12
          });
          if (this.initializeQueue) {
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(emptyArguments),
              destinationBuffer: getBuffer(activeIndices),
              size: 4
            });
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(emptyArguments),
              destinationBuffer: getBuffer(dispatchArguments),
              size: 12
            });
          }
        }
      })
    });
    graph.addComputePass({
      id: 'initialize-survivor-queue',
      description:
        'Scan stable slots only when a new horizon starts; continuations skip this pass.',
      condition: {id: 'new-trace-horizon', source: 'cpu', evaluate: () => this.initializeQueue},
      resources: [
        {buffer: parameters, usage: 'uniform'},
        {buffer: particles, usage: 'storage-read'},
        {buffer: previous, usage: 'storage-write'},
        {buffer: diagnostics, usage: 'storage-read-write'},
        {buffer: statistics, usage: 'storage-read-write'},
        {buffer: activeIndices, usage: 'storage-read-write'},
        {buffer: dispatchArguments, usage: 'storage-read-write'}
      ],
      workload: {
        operation: 'InitializeSurvivorQueue',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
        maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128
      },
      compile: () => ({
        encode: ({computePass, getBuffer}) =>
          this.schedulingKernel!.dispatch(computePass, {
            x: Math.ceil(this.particleCount / 128),
            bindings: {
              parameters: getBuffer(parameters),
              particles: getBuffer(particles),
              previous: getBuffer(previous),
              diagnostics: getBuffer(diagnostics),
              statistics: getBuffer(statistics),
              activeIndices: getBuffer(activeIndices),
              dispatchArguments: getBuffer(dispatchArguments)
            }
          })
      })
    });
    graph.addComputePass({
      id: 'trace-survivors-rk45',
      description:
        'Integrate queued stable IDs, update status transitions and append unfinished survivors for the next dispatch.',
      resources: [
        {buffer: parameters, usage: 'uniform'},
        {buffer: particles, usage: 'storage-read-write'},
        {buffer: diagnostics, usage: 'storage-read-write'},
        {buffer: statistics, usage: 'storage-read-write'},
        {buffer: activeIndices, usage: 'storage-read'},
        {buffer: dispatchArguments, usage: 'indirect'},
        {buffer: survivorIndices, usage: 'storage-read-write'},
        {buffer: survivorArguments, usage: 'storage-read-write'},
        {texture: velocity, usage: 'sampled'},
        {texture: nextVelocity, usage: 'sampled'}
      ],
      workload: {
        operation: 'AdaptiveSurvivorAdvection',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(this.particleCount / 128),
        maximumInvocationCount: Math.ceil(this.particleCount / 128) * 128
      },
      compile: () => ({
        encode: ({computePass, getBuffer, getTexture}) =>
          this.kernel.dispatchIndirect(computePass, {
            indirectBuffer: getBuffer(dispatchArguments),
            bindings: {
              parameters: getBuffer(parameters),
              particles: getBuffer(particles),
              diagnostics: getBuffer(diagnostics),
              statistics: getBuffer(statistics),
              activeIndices: getBuffer(activeIndices),
              survivorIndices: getBuffer(survivorIndices),
              survivorArguments: getBuffer(survivorArguments),
              velocityField: getTexture(velocity),
              nextVelocityField: getTexture(nextVelocity)
            }
          })
      })
    });
    return graph.compile();
  }

  private validateField(field: ScientificFlowField): void {
    assert(
      field.layout === this.currentField.layout &&
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
        (this.currentField.field.coordinates === 'lnglat' ? 1 : 0) |
          (this.currentField.periodicLongitude ? 2 : 0) |
          (this.conservativeMask ? 4 : 0) |
          (this.currentField.layout === 'c-grid' ? 8 : 0),
        this.maximumAttempts,
        first ? 1 : 0
      ].forEach((value, index) => view.setUint32(32 + index * 4, value, true));
      [
        this.timeRange ? this.elapsedTime / interval : 0,
        this.timeRange ? Math.min(1, (this.elapsedTime + duration) / interval) : 0,
        duration,
        0
      ].forEach((value, index) => view.setFloat32(48 + index * 4, value, true));
      const encoder = this.device.createCommandEncoder({timeProfilingQuerySet: this.queries});
      /** Actual graph encodings retained in submission order for inspection. */
      const encodings: GPUCommandGraphEncoding[] = [];
      /** Dispatch cursor within the fixed per-readback batch. */
      for (let batchIndex = 0; batchIndex < this.dispatchesPerReadback; batchIndex++) {
        this.initializeQueue = first && batchIndex === 0;
        this.capturePrevious = batchIndex === 0;
        /** Physical buffers serving as input and output queues for this encoding. */
        const queueBindings =
          this.survivorIndices && this.survivorArguments
            ? {
                [this.activeIndices!.id]: this.queueCursor
                  ? this.survivorIndices
                  : this.activeIndices!,
                [this.survivorIndices.id]: this.queueCursor
                  ? this.activeIndices!
                  : this.survivorIndices,
                [this.dispatchArguments!.id]: this.queueCursor
                  ? this.survivorArguments
                  : this.dispatchArguments!,
                [this.survivorArguments.id]: this.queueCursor
                  ? this.dispatchArguments!
                  : this.survivorArguments
              }
            : {};
        // Later dispatches resume progress rather than restarting the request clock.
        view.setUint32(
          44,
          (first && batchIndex === 0 ? 1 : 0) | (batchIndex === 0 && !this.survivorIndices ? 2 : 0),
          true
        );
        this.batchUniforms[batchIndex].write(new Uint8Array(bytes));
        encodings.push(
          this.commandGraph.encode(encoder, {
            parameters: undefined,
            buffers: {[this.uniforms.id]: this.batchUniforms[batchIndex], ...queueBindings},
            textures: {
              'tracer-velocity': this.currentField.texture,
              'tracer-next-velocity': this.nextField.texture
            }
          })
        );
        // Preserve each dispatch's work counts before the next graph reset. These
        // copies are readback staging, outside the inspected integration graph.
        encoder.copyBufferToBuffer({
          sourceBuffer: this.statistics,
          destinationBuffer: this.batchStatistics,
          destinationOffset: batchIndex * this.statisticsByteLength,
          size: 36
        });
        if (this.activeIndices && this.dispatchArguments) {
          encoder.copyBufferToBuffer({
            sourceBuffer:
              this.queueCursor && this.survivorIndices ? this.survivorIndices : this.activeIndices,
            destinationBuffer: this.batchStatistics,
            destinationOffset: batchIndex * this.statisticsByteLength + 36,
            size: 4
          });
          encoder.copyBufferToBuffer({
            sourceBuffer:
              this.queueCursor && this.survivorArguments
                ? this.survivorArguments
                : this.dispatchArguments,
            destinationBuffer: this.batchStatistics,
            destinationOffset: batchIndex * this.statisticsByteLength + 40,
            size: 4
          });
        }
        if (this.survivorIndices) this.queueCursor = 1 - this.queueCursor;
      }
      this.device.submit(encoder.finish());
      this.dispatchIndex += this.dispatchesPerReadback;
      const result = await this.batchStatistics.readAsync();
      /** Contiguous status/work snapshots copied before each graph counter reset. */
      const batchCounts = new Uint32Array(
        result.buffer,
        result.byteOffset,
        (this.statisticsByteLength / 4) * this.dispatchesPerReadback
      );
      /** Final statuses only; earlier statuses would double-count particle slots. */
      const counts = batchCounts.subarray(batchCounts.length - this.statisticsByteLength / 4);
      /** Accepted steps summed over the complete batch, including idle tails. */
      let acceptedSteps = 0;
      /** Rejected trials summed over the complete batch. */
      let rejectedSteps = 0;
      /** Integration slots summed over the batch, separate from compaction scans. */
      let scheduledParticles = 0;
      /** Actual integration workgroups, including padded lanes. */
      let integrationWorkgroups = 0;
      /** Dispatch cursor within the fixed per-readback batch. */
      for (let batchIndex = 0; batchIndex < this.dispatchesPerReadback; batchIndex++) {
        /** Offset of this dispatch's counter snapshot. */
        const counterOffset = (batchIndex * this.statisticsByteLength) / 4;
        acceptedSteps += batchCounts[counterOffset + 7];
        rejectedSteps += batchCounts[counterOffset + 8];
        scheduledParticles += this.activeIndices
          ? batchCounts[counterOffset + 9]
          : this.particleCount;
        integrationWorkgroups += this.activeIndices
          ? batchCounts[counterOffset + 10]
          : Math.ceil(this.particleCount / 128);
      }
      /** Per-encoding timestamp reports, read only after batch submission. */
      const timings = await Promise.all(encodings.map(encoding => encoding.readTimings()));
      /** Aggregate compute duration when all dispatch timings are available. */
      const gpuMilliseconds = timings.every(timing => timing.gpuTimeMilliseconds !== undefined)
        ? timings.reduce((sum, timing) => sum + timing.gpuTimeMilliseconds!, 0)
        : undefined;
      /** Final encoding retained as the backwards-compatible inspection handle. */
      const encoding = encodings[encodings.length - 1];
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
        encodings,
        dispatchCount: this.dispatchesPerReadback,
        counterReadbackBytes: this.batchStatistics.byteLength,
        scheduledParticles,
        integrationWorkgroups,
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
        acceptedSteps,
        rejectedSteps,
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
