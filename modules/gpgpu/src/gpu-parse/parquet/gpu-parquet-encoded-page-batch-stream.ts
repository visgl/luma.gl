// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncodeOptions,
  type GPUCommandGraphEncoding
} from '@luma.gl/gpgpu/gpu-core';
import {
  addGPUParquetEncodedPageBatchToGraph,
  type GPUParquetEncodedPageBatch
} from './gpu-parquet-encoded-page-batch';
import type {GPUParquetEncodedPageBatchPlan} from './parquet-encoded-page-batch';

/** Context supplied while constructing each reusable stream slot. */
export type GPUParquetEncodedPageBatchStreamGraphContext<Parameters> = Readonly<{
  /** Mutable graph containing the automatic Parquet page decoders. */
  graph: GPUCommandGraph<Parameters>;
  /** Decoded graph views that downstream operations can consume without readback. */
  batch: GPUParquetEncodedPageBatch;
  /** Stable zero-based slot index for naming caller-owned output resources. */
  slotIndex: number;
}>;

/** Construction properties for a bounded reusable Parquet decode stream. */
export type GPUParquetEncodedPageBatchStreamProps<Parameters, Output> = Readonly<{
  /** Prefix for graph and buffer identifiers. */
  id?: string;
  /** Number of independently reusable in-flight graph slots. Defaults to two. */
  slotCount?: number;
  /**
   * Adds the graph-native consumer for one slot and returns its caller-facing output.
   *
   * Use this callback to copy decoded pages into imported render/table buffers, or to append
   * filtering, aggregation, and rendering work. Returned resources are owned by the caller unless
   * `destroyOutput` is supplied.
   */
  configureGraph: (context: GPUParquetEncodedPageBatchStreamGraphContext<Parameters>) => Output;
  /** Optional cleanup for resources returned by `configureGraph`. */
  destroyOutput?: (output: Output) => void;
}>;

/** Static allocation and graph-size measurements for a prepared stream. */
export type GPUParquetEncodedPageBatchStreamStats = Readonly<{
  /** Number of independently reusable slots. */
  slotCount: number;
  /** Compiled node count for each slot, in slot-index order. */
  graphNodeCounts: readonly number[];
  /** Capacity of every slot's packed upload buffer. */
  uploadByteLengthPerSlot: number;
  /** Physical graph-transient allocation for each slot, in slot-index order. */
  transientByteLengths: readonly number[];
  /** Exact upload plus graph-transient allocation across every slot. */
  pooledUploadAndTransientByteLength: number;
}>;

type StreamSlot<Parameters, Output> = {
  inputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<Parameters>;
  batch: GPUParquetEncodedPageBatch;
  output: Output;
  destroyed: boolean;
};

type StreamWaiter<Parameters, Output> = {
  plan: GPUParquetEncodedPageBatchPlan;
  resolve: (ticket: GPUParquetEncodedPageBatchStreamTicket<Parameters, Output>) => void;
  reject: (error: unknown) => void;
};

type StreamTicketState = 'reserved' | 'encoding' | 'encoded' | 'completing' | 'released';

/**
 * One exclusive reservation in a {@link GPUParquetEncodedPageBatchStream}.
 *
 * Call `encode()` exactly once, submit the command encoder, then immediately pass the queue or
 * readback completion promise to `releaseWhen()`. The slot is not recycled until that promise
 * settles, so its upload buffer and graph transients cannot be overwritten while GPU work is in
 * flight. Call `cancel()` only when no commands were encoded.
 */
export class GPUParquetEncodedPageBatchStreamTicket<Parameters, Output> {
  /** Plan whose packed upload was written into this slot. */
  readonly plan: GPUParquetEncodedPageBatchPlan;
  /** Per-slot result returned by `configureGraph`. */
  readonly output: Output;

  private readonly stream: GPUParquetEncodedPageBatchStream<Parameters, Output>;
  private readonly slot: StreamSlot<Parameters, Output>;
  private state: StreamTicketState = 'reserved';

  /** @internal */
  constructor(
    stream: GPUParquetEncodedPageBatchStream<Parameters, Output>,
    slot: StreamSlot<Parameters, Output>,
    plan: GPUParquetEncodedPageBatchPlan
  ) {
    this.stream = stream;
    this.slot = slot;
    this.plan = plan;
    this.output = slot.output;
  }

  /** Records this slot's prepared decode and consumer graph without finishing or submitting it. */
  encode(
    commandEncoder: CommandEncoder,
    options: GPUCommandGraphEncodeOptions<Parameters>
  ): GPUCommandGraphEncoding {
    if (this.state !== 'reserved') {
      throw new Error('GPU Parquet stream ticket has already been encoded or released');
    }
    this.state = 'encoding';
    const encoding = this.slot.compiled.encode(commandEncoder, options);
    this.state = 'encoded';
    return encoding;
  }

  /**
   * Releases the slot after submitted GPU work or dependent readback settles.
   *
   * Rejections still release the slot before being rethrown. Passing an already-resolved promise
   * is safe only when the encoded command buffer was deliberately not submitted.
   */
  async releaseWhen(completion: PromiseLike<unknown>): Promise<void> {
    if (this.state !== 'encoding' && this.state !== 'encoded') {
      throw new Error(
        'GPU Parquet stream ticket must begin encoding before completion is attached'
      );
    }
    this.state = 'completing';
    try {
      await completion;
    } finally {
      this.release();
    }
  }

  /** Returns an unused reservation to the stream. Encoded tickets require `releaseWhen()`. */
  cancel(): void {
    if (this.state !== 'reserved') {
      throw new Error('Only an unused GPU Parquet stream ticket can be cancelled');
    }
    this.release();
  }

  /**
   * Releases a ticket after `encode()` threw and the command encoder will be discarded.
   *
   * A failed graph encode may already have recorded commands. Never call this method if that
   * encoder can be finished or submitted; attach its completion to `releaseWhen()` instead.
   */
  discard(): void {
    if (this.state !== 'encoding') {
      throw new Error('Only a failed GPU Parquet stream encoding can be discarded');
    }
    this.release();
  }

  private release(): void {
    if (this.state !== 'released') {
      this.state = 'released';
      this.stream.release(this.slot);
    }
  }
}

/**
 * Fixed-capacity pool of reusable compiled graphs for loaders.gl Parquet page batches.
 *
 * Use this when a stream or partitioned dataset repeatedly emits the same GPU decode layout: page
 * order, encodings, value counts, byte ranges, descriptor capacities, and shader-embedded control
 * values must match. Payload and descriptor bytes may change. Construction compiles each slot once;
 * later acquisitions only validate the layout key and write the new aligned upload.
 *
 * `tryAcquire()` supports drop or CPU-fallback policies under pressure. `acquire()` provides FIFO
 * backpressure. A slot owns one upload buffer, one compiled graph, and that graph's transient decode
 * storage, so multiple submitted tickets never alias writable resources. The class records and
 * validates work but never creates command encoders, submits commands, waits on a queue, or reads
 * results back.
 *
 * This is intentionally an exact-layout template rather than a general Parquet executor. Variable
 * page shapes should be grouped into separate streams or decoded through the one-shot adapter.
 */
export class GPUParquetEncodedPageBatchStream<Parameters = void, Output = unknown> {
  readonly device: Device;
  readonly id: string;
  readonly slotCount: number;
  readonly layoutKey: string;
  readonly stats: GPUParquetEncodedPageBatchStreamStats;

  private readonly props: GPUParquetEncodedPageBatchStreamProps<Parameters, Output>;
  private readonly slots: StreamSlot<Parameters, Output>[];
  private readonly availableSlots: StreamSlot<Parameters, Output>[];
  private readonly waiters: StreamWaiter<Parameters, Output>[] = [];
  private destroyed = false;

  constructor(
    device: Device,
    templatePlan: GPUParquetEncodedPageBatchPlan,
    props: GPUParquetEncodedPageBatchStreamProps<Parameters, Output>
  ) {
    validateTemplatePlan(templatePlan);
    const slotCount = props.slotCount ?? 2;
    if (!Number.isSafeInteger(slotCount) || slotCount <= 0) {
      throw new Error('GPU Parquet stream slotCount must be a positive integer');
    }
    this.device = device;
    this.id = props.id ?? 'gpu-parquet-page-batch-stream';
    this.slotCount = slotCount;
    this.layoutKey = getGPUParquetEncodedPageBatchLayoutKey(templatePlan);
    this.props = props;
    this.slots = [];

    try {
      for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
        this.slots.push(this.createSlot(templatePlan, slotIndex));
      }
    } catch (error) {
      for (const slot of this.slots) this.destroySlot(slot);
      throw error;
    }
    this.availableSlots = [...this.slots];
    const uploadByteLengthPerSlot = Math.max(templatePlan.uploadData.byteLength, 4);
    const graphNodeCounts = this.slots.map(slot => slot.compiled.stats.nodeOrder.length);
    const transientByteLengths = this.slots.map(
      slot => slot.compiled.stats.physicalTransientResourceBytes
    );
    this.stats = Object.freeze({
      slotCount,
      graphNodeCounts: Object.freeze(graphNodeCounts),
      uploadByteLengthPerSlot,
      transientByteLengths: Object.freeze(transientByteLengths),
      pooledUploadAndTransientByteLength:
        slotCount * uploadByteLengthPerSlot +
        transientByteLengths.reduce((sum, byteLength) => sum + byteLength, 0)
    });
    void device.lost.then(() => this.destroy());
  }

  /** Number of slots that can accept a compatible batch immediately. */
  get availableSlotCount(): number {
    return this.availableSlots.length;
  }

  /** Number of FIFO acquisitions currently waiting for backpressure to clear. */
  get pendingAcquireCount(): number {
    return this.waiters.length;
  }

  /** Returns whether a plan can safely reuse this stream's compiled graph layout. */
  isCompatible(plan: GPUParquetEncodedPageBatchPlan): boolean {
    return (
      plan.cpuFallbackPageCount === 0 &&
      getGPUParquetEncodedPageBatchLayoutKey(plan) === this.layoutKey
    );
  }

  /** Acquires a slot immediately, or returns `null` when the stream is under backpressure. */
  tryAcquire(
    plan: GPUParquetEncodedPageBatchPlan
  ): GPUParquetEncodedPageBatchStreamTicket<Parameters, Output> | null {
    this.validatePlan(plan);
    if (this.destroyed) return null;
    const slot = this.availableSlots.shift();
    if (!slot) return null;
    try {
      return this.prepareTicket(slot, plan);
    } catch (error) {
      this.availableSlots.unshift(slot);
      throw error;
    }
  }

  /** Waits in FIFO order for a slot, then writes the compatible plan's packed upload into it. */
  acquire(
    plan: GPUParquetEncodedPageBatchPlan
  ): Promise<GPUParquetEncodedPageBatchStreamTicket<Parameters, Output>> {
    this.validatePlan(plan);
    if (this.destroyed) {
      return Promise.reject(new Error('GPU Parquet stream has been destroyed'));
    }
    const slot = this.availableSlots.shift();
    if (slot) {
      try {
        return Promise.resolve(this.prepareTicket(slot, plan));
      } catch (error) {
        this.availableSlots.unshift(slot);
        return Promise.reject(error);
      }
    }
    return new Promise((resolve, reject) => this.waiters.push({plan, resolve, reject}));
  }

  /** Rejects queued acquisitions and destroys idle slots; active slots are destroyed on release. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('GPU Parquet stream has been destroyed'));
    }
    for (const slot of this.availableSlots.splice(0)) this.destroySlot(slot);
  }

  /** @internal Returns a completed slot to the next waiter or the idle pool. */
  release(slot: StreamSlot<Parameters, Output>): void {
    if (this.destroyed) {
      this.destroySlot(slot);
      return;
    }
    for (let waiter = this.waiters.shift(); waiter; waiter = this.waiters.shift()) {
      try {
        waiter.resolve(this.prepareTicket(slot, waiter.plan));
        return;
      } catch (error) {
        waiter.reject(error);
      }
    }
    this.availableSlots.push(slot);
  }

  private createSlot(
    templatePlan: GPUParquetEncodedPageBatchPlan,
    slotIndex: number
  ): StreamSlot<Parameters, Output> {
    const inputBuffer = this.device.createBuffer({
      id: `${this.id}-upload-${slotIndex}`,
      byteLength: Math.max(templatePlan.uploadData.byteLength, 4),
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    const graph = new GPUCommandGraph<Parameters>(this.device, {
      id: `${this.id}-graph-${slotIndex}`
    });
    let output: Output | undefined;
    try {
      const batch = addGPUParquetEncodedPageBatchToGraph(graph, templatePlan, inputBuffer);
      output = this.props.configureGraph({graph, batch, slotIndex});
      const compiled = graph.compile();
      return {inputBuffer, compiled, batch, output, destroyed: false};
    } catch (error) {
      if (output !== undefined) this.props.destroyOutput?.(output);
      inputBuffer.destroy();
      throw error;
    }
  }

  private prepareTicket(
    slot: StreamSlot<Parameters, Output>,
    plan: GPUParquetEncodedPageBatchPlan
  ): GPUParquetEncodedPageBatchStreamTicket<Parameters, Output> {
    slot.inputBuffer.write(plan.uploadData);
    return new GPUParquetEncodedPageBatchStreamTicket(this, slot, plan);
  }

  private validatePlan(plan: GPUParquetEncodedPageBatchPlan): void {
    validateTemplatePlan(plan);
    if (getGPUParquetEncodedPageBatchLayoutKey(plan) !== this.layoutKey) {
      throw new Error(
        'GPU Parquet stream plan is not compatible with the compiled template layout'
      );
    }
  }

  private destroySlot(slot: StreamSlot<Parameters, Output>): void {
    if (slot.destroyed) return;
    slot.destroyed = true;
    slot.compiled.destroy();
    slot.inputBuffer.destroy();
    this.props.destroyOutput?.(slot.output);
  }
}

/**
 * Returns a deterministic key for every graph-shaping field in a page-batch plan.
 *
 * Original payload and descriptor contents are excluded because shaders read them from the packed
 * upload. Typed-array kinds and capacities, upload offsets, page order, counts, encodings, and all
 * scalar decoder properties remain in the key. Matching keys therefore permit buffer replacement
 * without recompiling while different shader constants or transient sizes are rejected.
 */
export function getGPUParquetEncodedPageBatchLayoutKey(
  plan: GPUParquetEncodedPageBatchPlan
): string {
  return JSON.stringify(
    {
      uploadByteLength: plan.uploadData.byteLength,
      dictionaries: plan.dictionaries,
      pages: plan.pages
    },
    (_key, value) =>
      ArrayBuffer.isView(value)
        ? {typedArray: value.constructor.name, byteLength: value.byteLength}
        : value
  );
}

function validateTemplatePlan(plan: GPUParquetEncodedPageBatchPlan): void {
  if (plan.shape !== 'gpu-parquet-page-batch-plan') {
    throw new Error('GPU Parquet stream requires a page-batch plan');
  }
  if (plan.cpuFallbackPageCount !== 0) {
    throw new Error('GPU Parquet stream templates cannot contain CPU fallback pages');
  }
}
