// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  GPUVector,
  type Interleaved,
  type InterleavedFields,
  type InterleavedGPUVectorLayout
} from '@luma.gl/tables';
import {bufferPool} from '../utils/buffer-pool';
import type {Operation} from './operation';
import {getGPUVectorBuffer, GPUTableEvaluator} from './gpu-table-evaluator';

type InterleavedGPUTableEvaluatorBufferOwnership = 'owned' | 'borrowed';

/** Props for one heterogeneous interleaved evaluator. */
export type InterleavedGPUTableEvaluatorProps<
  Fields extends InterleavedFields = InterleavedFields
> = {
  /** Optional debug/output name. */
  id?: string;
  /** Computed interleaved row layout. */
  layout: InterleavedGPUVectorLayout<Fields>;
  /** Number of logical rows. */
  length: number;
  /** Operation that materializes this evaluator. */
  source?: Operation<any, InterleavedGPUTableEvaluator<Fields>> | null;
  /** Already materialized GPU vector. */
  gpuVector?: GPUVector<Interleaved<Fields>>;
  /** CPU-side bytes, when available. */
  value?: Uint8Array;
  /** Source primitive evaluators for zero-copy picks before materialization. */
  fieldInputs?: Partial<Record<keyof Fields & string, GPUTableEvaluator>>;
};

/** Device-agnostic heterogeneous interleaved output for GPGPU operations. */
export class InterleavedGPUTableEvaluator<Fields extends InterleavedFields = InterleavedFields> {
  /** Computed interleaved row layout. */
  readonly layout: InterleavedGPUVectorLayout<Fields>;
  /** Named fields stored in each row. */
  readonly fields: Fields;
  /** Number of logical rows. */
  readonly length: number;
  /** Number of bytes in the materialized buffer. */
  readonly byteLength: number;
  /** Lazy operation source, when unevaluated. */
  readonly source: Operation<any, InterleavedGPUTableEvaluator<Fields>> | null;
  /** Primitive source evaluators keyed by field name. */
  readonly fieldInputs: Partial<Record<keyof Fields & string, GPUTableEvaluator>>;
  private readonly id?: string;
  private value?: Uint8Array;
  private gpuVectorResource?: GPUVector<Interleaved<Fields>>;
  private bufferOwnership: InterleavedGPUTableEvaluatorBufferOwnership = 'owned';
  private destroyed = false;

  constructor(props: InterleavedGPUTableEvaluatorProps<Fields>) {
    this.id = props.id;
    this.layout = props.layout;
    this.fields = props.layout.fields;
    this.length = props.length;
    this.byteLength = props.length * props.layout.byteStride;
    this.source = props.source ?? null;
    this.value = props.value;
    this.fieldInputs = props.fieldInputs ?? {};
    if (props.gpuVector) {
      this.gpuVectorResource = props.gpuVector;
      this.bufferOwnership = 'borrowed';
    }
  }

  /** Materialized interleaved GPU vector. */
  get gpuVector(): GPUVector<Interleaved<Fields>> {
    if (!this.gpuVectorResource) {
      throw new Error(`${this} not evaluated`);
    }
    return this.gpuVectorResource;
  }

  /** CPU-side bytes, when available. */
  get cpuValue(): Uint8Array | undefined {
    return this.value;
  }

  /** Materializes this interleaved output. */
  async evaluate(device: Device): Promise<GPUVector<Interleaved<Fields>>> {
    if (this.destroyed) {
      throw new Error(`InterleavedGPUTableEvaluator ${this} already destroyed`);
    }
    if (this.gpuVectorResource) {
      return this.gpuVectorResource;
    }

    const buffer = bufferPool.createOrReuse(device, this.byteLength);
    if (this.value) {
      buffer.write(this.value);
    } else {
      const result = await this.source!.execute(device, buffer);
      if (!result.success) {
        throw result.error || new Error(`${this.source} evaluation failed`);
      }
      if (result.value) {
        this.value = result.value as Uint8Array;
      }
    }

    this.gpuVectorResource = new GPUVector<Interleaved<Fields>>({
      type: 'interleaved',
      name: this.id ?? this.layout.name,
      buffer,
      length: this.length,
      byteStride: this.layout.byteStride,
      attributes: this.layout.attributes,
      interleavedFields: this.fields,
      ownsBuffer: false
    });
    return this.gpuVectorResource;
  }

  /** Reads the interleaved bytes back to CPU memory. */
  async readValue(): Promise<Uint8Array> {
    if (!this.value) {
      const bytes = await getGPUVectorBuffer(this.gpuVector).readAsync(0, this.byteLength);
      this.value = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    return this.value;
  }

  /** Releases cached GPU storage and prevents future evaluation. */
  destroy(): void {
    if (this.gpuVectorResource) {
      if (this.bufferOwnership === 'owned') {
        bufferPool.recycle(getGPUVectorBuffer(this.gpuVectorResource));
      }
      this.gpuVectorResource = undefined;
    }
    this.destroyed = true;
  }

  toString(): string {
    return this.id ?? this.source?.toString() ?? 'InterleavedGPUTableEvaluator';
  }
}

/** Creates an interleaved evaluator view over an existing GPUVector. */
export function getInterleavedGPUTableEvaluatorFromGPUVector<
  Fields extends InterleavedFields = InterleavedFields
>(vector: GPUVector<Interleaved<Fields>>): InterleavedGPUTableEvaluator<Fields> {
  if (
    !vector.interleavedFields ||
    !vector.bufferLayout?.attributes ||
    vector.bufferLayout.byteStride === undefined
  ) {
    throw new Error(
      `InterleavedGPUTableEvaluator requires interleaved field metadata for "${vector.name}"`
    );
  }

  const layout: InterleavedGPUVectorLayout<Fields> = {
    name: vector.name,
    fields: vector.interleavedFields as Fields,
    byteStride: vector.bufferLayout.byteStride,
    attributes: vector.bufferLayout.attributes,
    bufferLayout: vector.bufferLayout
  };

  return new InterleavedGPUTableEvaluator({
    id: vector.name,
    layout,
    length: vector.length,
    gpuVector: vector
  });
}
