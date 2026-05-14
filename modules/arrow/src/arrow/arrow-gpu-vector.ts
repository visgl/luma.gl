// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferAttributeLayout,
  type BufferLayout,
  type BufferProps
} from '@luma.gl/core';
import {DynamicBuffer, type DynamicBufferProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {isInstanceArrowType, type AttributeArrowType} from './arrow-types';
import {
  GPUData,
  getArrowDataBufferSource,
  getArrowTypeByteStride,
  getArrowTypeStride,
  getArrowVectorBufferSource,
  readArrowGPUVectorAsync,
  validateArrowGPUDataDirectUpload
} from './arrow-gpu-data';

export {
  GPUData,
  readArrowGPUVectorAsync,
  type GPUDataFromBufferProps
} from './arrow-gpu-data';

/** Buffer creation props forwarded when uploading Arrow vector memory to the GPU. */
export type GPUVectorBufferProps = Omit<BufferProps, 'byteLength' | 'data'>;
/** Dynamic buffer props forwarded when creating appendable Arrow GPU vectors. */
export type GPUVectorDynamicBufferProps = Omit<DynamicBufferProps, 'byteLength' | 'data'>;

/** @deprecated Use {@link GPUVectorBufferProps}. */
export type GPUVectorProps = GPUVectorBufferProps;

/** Constructor props that upload an Arrow vector into a new GPU buffer. */
export type GPUVectorFromArrowProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Discriminator for Arrow-vector upload construction. */
  type: 'arrow';
  /** Name used when this vector is added to an {@link GPUTable}. */
  name: string;
  /** Device that creates the GPU buffer. */
  device: Device;
  /** Arrow vector whose value memory is uploaded. */
  vector: arrow.Vector<T>;
  /** Buffer creation props forwarded to the GPU buffer. */
  bufferProps?: GPUVectorBufferProps;
};

/** Constructor props that wrap an existing typed GPU buffer. */
export type GPUVectorFromBufferProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Discriminator for existing-buffer construction. */
  type: 'buffer';
  /** Name used when this vector is added to an {@link GPUTable}. */
  name: string;
  /** Existing GPU buffer. */
  buffer: Buffer;
  /** Arrow type that describes the values in the buffer. */
  arrowType: T;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. Defaults to the byte width of `arrowType`. */
  byteStride?: number;
  /**
   * Whether this vector should destroy the buffer.
   *
   * Defaults to `false` for wrapped buffers because ownership remains with the caller unless
   * explicitly transferred or opted in.
   */
  ownsBuffer?: boolean;
};

/** Constructor props that wrap one interleaved GPU buffer as opaque Arrow binary rows. */
export type GPUVectorFromInterleavedProps = {
  /** Discriminator for interleaved-buffer construction. */
  type: 'interleaved';
  /** Name used when this vector is added to an {@link GPUTable}. */
  name: string;
  /** Existing interleaved GPU buffer. */
  buffer: Buffer;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Attribute views stored in each interleaved row. */
  attributes: BufferAttributeLayout[];
  /**
   * Whether this vector should destroy the buffer.
   *
   * Defaults to `false` for wrapped buffers because ownership remains with the caller unless
   * explicitly transferred or opted in.
   */
  ownsBuffer?: boolean;
};

/** Constructor props that expose pre-existing Arrow GPU data chunks as one logical vector. */
export type GPUVectorFromDataProps<T extends arrow.DataType = AttributeArrowType> = {
  /** Discriminator for chunk-backed construction. */
  type: 'data';
  /** Name used when this vector is added to an {@link GPUTable}. */
  name: string;
  /** Arrow type that describes every chunk in `data`. */
  arrowType: T;
  /** Existing GPU data chunks to expose through this vector. */
  data: GPUData<T>[];
  /** Bytes between adjacent logical rows. Defaults to the first chunk stride when available. */
  byteStride?: number;
  /** Optional buffer layout retained for interleaved chunk collections. */
  bufferLayout?: BufferLayout;
};

/** Constructor props for an appendable DynamicBuffer-backed Arrow vector. */
export type GPUVectorFromAppendableProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Discriminator for appendable DynamicBuffer-backed construction. */
  type: 'appendable';
  /** Name used when this vector is added to an {@link GPUTable}. */
  name: string;
  /** Device that creates the DynamicBuffer. */
  device: Device;
  /** Arrow type that describes appended Arrow data. */
  arrowType: T;
  /** Initial row capacity. Defaults to `0`. */
  initialCapacityRows?: number;
  /** Capacity growth multiplier. Defaults to `1.5`. */
  capacityGrowthFactor?: number;
  /** DynamicBuffer construction props. */
  bufferProps?: GPUVectorDynamicBufferProps;
};

/** Discriminated constructor props for {@link GPUVector}. */
export type GPUVectorCreateProps<T extends arrow.DataType = AttributeArrowType> =
  | (T extends AttributeArrowType
      ? GPUVectorFromArrowProps<T> | GPUVectorFromBufferProps<T>
      : never)
  | GPUVectorFromInterleavedProps
  | GPUVectorFromDataProps<T>
  | (T extends AttributeArrowType ? GPUVectorFromAppendableProps<T> : never);

/**
 * GPU memory and Arrow type metadata derived from one Arrow vector.
 *
 * The Arrow vector is a construction input only. GPUVector does not retain
 * the source vector; it keeps a GPU buffer plus the type, length, and stride that
 * describe the uploaded memory.
 *
 * Ownership is tracked separately from the buffer reference. Vectors constructed
 * from Arrow data allocate and own their buffers. Vectors wrapping an existing
 * buffer default to non-owning unless `ownsBuffer` is supplied. In-place
 * operations can use {@link transferBufferOwnership} to consume one logical
 * vector and return another view that becomes responsible for destroying the
 * shared buffer.
 */
export class GPUVector<T extends arrow.DataType = AttributeArrowType> {
  /** Name used when this vector is added to an {@link GPUTable}. */
  readonly name: string;
  /** Arrow type that describes the uploaded vector memory. */
  readonly type: T;
  /** Number of logical Arrow vector rows uploaded into the GPU buffer. */
  length: number;
  /** Number of scalar values per logical vector row. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent logical rows in {@link buffer}. */
  readonly byteStride: number;
  /** Optional GPU buffer layout described by this vector. */
  readonly bufferLayout?: BufferLayout;
  /** GPU data chunk views preserving the source Arrow vector's chunk boundaries. */
  readonly data: GPUData<T>[] = [];
  /** Single concrete GPU buffer when this vector is directly bindable as one buffer. */
  private _buffer?: Buffer | DynamicBuffer;
  /** Whether this vector is responsible for destroying {@link buffer}. */
  private _ownsBuffer: boolean;
  /** Detached batch-local vectors whose buffers are now owned by this aggregate view. */
  private readonly _ownedVectors: GPUVector[] = [];
  /** Capacity growth multiplier for appendable DynamicBuffer-backed vectors. */
  private readonly capacityGrowthFactor?: number;

  /** Creates a GPU representation from an Arrow vector without retaining the source vector. */
  constructor(
    device: Device,
    vector: arrow.Vector<T & AttributeArrowType>,
    props?: GPUVectorBufferProps
  );
  /** Creates a GPU representation using discriminated construction props. */
  constructor(props: GPUVectorCreateProps<T>);
  constructor(
    deviceOrProps: Device | GPUVectorCreateProps<any>,
    vector?: arrow.Vector<T & AttributeArrowType>,
    props: GPUVectorBufferProps = {}
  ) {
    const constructionProps =
      deviceOrProps instanceof Device
        ? ({
            type: 'arrow',
            name: 'vector',
            device: deviceOrProps,
            vector: vector!,
            bufferProps: props
          } satisfies GPUVectorFromArrowProps)
        : deviceOrProps;

    switch (constructionProps.type) {
      case 'arrow': {
        const {name, device, vector: arrowVector, bufferProps = {}} = constructionProps;
        this.name = name;
        this.type = arrowVector.type;
        this.length = arrowVector.length;
        this.stride = getArrowVectorStride(arrowVector);
        this.byteOffset = 0;
        this.byteStride = getArrowTypeByteStride(arrowVector.type);
        this._buffer = device.createBuffer({
          usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
          ...bufferProps,
          data: getArrowVectorBufferSource(arrowVector as any)
        });
        const dataBuffer = createArrowGPUDataBuffer(this._buffer);
        let byteOffset = 0;
        for (const arrowData of arrowVector.data) {
          const gpuData = new GPUData({
            buffer: dataBuffer,
            arrowType: arrowData.type as AttributeArrowType,
            length: arrowData.length,
            byteOffset,
            byteStride: this.byteStride,
            ownsBuffer: false
          }) as unknown as GPUData<T>;
          this.data.push(gpuData);
          byteOffset += arrowData.length * this.byteStride;
        }
        this._ownsBuffer = true;
        return;
      }

      case 'buffer': {
        const {
          name,
          buffer,
          arrowType,
          length,
          byteOffset = 0,
          byteStride = getArrowTypeByteStride(arrowType),
          ownsBuffer = false
        } = constructionProps;
        this.name = name;
        this._buffer = buffer;
        this.type = arrowType;
        this.length = length;
        this.stride = getArrowTypeStride(arrowType);
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        const dataBuffer = createArrowGPUDataBuffer(buffer);
        this.data.push(
          new GPUData({
            buffer: dataBuffer,
            arrowType,
            length,
            byteOffset,
            byteStride,
            ownsBuffer: false
          }) as GPUData<T>
        );
        this._ownsBuffer = ownsBuffer;
        return;
      }

      case 'interleaved': {
        const {
          name,
          buffer,
          length,
          byteOffset = 0,
          byteStride,
          attributes,
          ownsBuffer = false
        } = constructionProps;
        this.name = name;
        this._buffer = buffer;
        this.type = new arrow.Binary() as T;
        this.length = length;
        this.stride = byteStride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.bufferLayout = {name, byteStride, attributes};
        const dataBuffer = createArrowGPUDataBuffer(buffer);
        this.data.push(
          new GPUData({
            buffer: dataBuffer,
            arrowType: this.type,
            length,
            byteOffset,
            byteStride,
            ownsBuffer: false
          })
        );
        this._ownsBuffer = ownsBuffer;
        return;
      }

      case 'data': {
        const {name, arrowType, data, byteStride, bufferLayout} = constructionProps;
        if (data.some(chunk => !arrow.util.compareTypes(chunk.type, arrowType))) {
          throw new Error('GPUVector data chunks must share the declared Arrow type');
        }

        this.name = name;
        this.type = arrowType;
        this.length = data.reduce((length, chunk) => length + chunk.length, 0);
        this.stride = data[0]?.stride ?? getArrowTypeStride(arrowType);
        this.byteOffset = data.length === 1 ? data[0].byteOffset : 0;
        this.byteStride = byteStride ?? data[0]?.byteStride ?? getArrowTypeByteStride(arrowType);
        this.bufferLayout = bufferLayout;
        this.data.push(...data);
        this._buffer = data.length === 1 ? data[0].buffer : undefined;
        this._ownsBuffer = false;
        return;
      }

      case 'appendable': {
        const {
          name,
          device,
          arrowType,
          initialCapacityRows = 0,
          capacityGrowthFactor = 1.5,
          bufferProps
        } = constructionProps;
        if (!isInstanceArrowType(arrowType)) {
          throw new Error(`GPUVector does not support Arrow type ${arrowType}`);
        }
        this.name = name;
        this.type = arrowType as unknown as T;
        this.length = 0;
        this.stride = getArrowTypeStride(arrowType);
        this.byteOffset = 0;
        this.byteStride = getArrowTypeByteStride(arrowType);
        this._buffer = new DynamicBuffer(device, {
          usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
          ...bufferProps,
          id: bufferProps?.id ?? `${name}-appendable-arrow-vector`,
          byteLength: Math.max(1, initialCapacityRows * this.byteStride)
        });
        this.capacityGrowthFactor = capacityGrowthFactor;
        this._ownsBuffer = true;
        return;
      }
    }
  }

  /**
   * Directly bindable GPU buffer when this vector has one concrete backing buffer.
   *
   * Aggregate table vectors may span multiple batch-owned buffers. Those vectors
   * intentionally require callers to use {@link data} or batch-local vectors.
   */
  get buffer(): Buffer | DynamicBuffer {
    if (!this._buffer) {
      throw new Error('GPUVector.buffer is unavailable for multi-buffer vectors; use data[]');
    }
    return this._buffer;
  }

  /**
   * Whether this vector is responsible for destroying {@link buffer}.
   *
   * `destroy()` only releases the buffer when this is `true`. This value can
   * change when ownership is transferred to another same-buffer view.
   */
  get ownsBuffer(): boolean {
    return this._ownsBuffer || this._ownedVectors.some(vector => vector.ownsBuffer);
  }

  /**
   * Adds one already-materialized GPU data chunk to this logical vector.
   *
   * This preserves ownership on the supplied {@link GPUData}; the vector
   * only aggregates metadata and never adopts or destroys that buffer through
   * this method.
   */
  addData(data: GPUData<T>): this {
    if (!arrow.util.compareTypes(data.type, this.type)) {
      throw new Error('GPUVector.addData() requires matching Arrow data types');
    }
    if (data.byteStride !== this.byteStride) {
      throw new Error('GPUVector.addData() requires matching byteStride');
    }

    this.data.push(data);
    this.length += data.length;
    if (this.data.length > 1) {
      this._buffer = undefined;
    }
    return this;
  }

  /** Number of rows the appendable backing DynamicBuffer can hold without reallocating. */
  get capacityRows(): number | undefined {
    return this._buffer instanceof DynamicBuffer
      ? Math.floor(this._buffer.byteLength / this.byteStride)
      : undefined;
  }

  /** Appends one Arrow Data chunk into this vector's trailing DynamicBuffer-backed data storage. */
  addToLastData(data: arrow.Data<T & AttributeArrowType>): this {
    if (!(this._buffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector.addToLastData() requires appendable vector storage');
    }
    if (!arrow.util.compareTypes(data.type, this.type)) {
      throw new Error('GPUVector.addToLastData() requires matching Arrow data types');
    }
    validateArrowGPUDataDirectUpload(this.name, data);

    const requiredRows = this.length + data.length;
    this.ensureAppendableCapacity(requiredRows);

    const byteOffset = this.length * this.byteStride;
    this._buffer.write(getArrowDataBufferSource(data), byteOffset);
    this.data.push(
      new GPUData({
        buffer: this._buffer,
        arrowType: data.type,
        length: data.length,
        byteOffset,
        byteStride: this.byteStride,
        ownsBuffer: false
      }) as GPUData<T>
    );
    this.length = requiredRows;
    return this;
  }

  /** @deprecated Use {@link addToLastData}. */
  addToLastBatch(data: arrow.Data<T & AttributeArrowType>): this {
    return this.addToLastData(data);
  }

  /** Appends every Arrow Data chunk from one Arrow vector into appendable batch storage. */
  addVectorToLastBatch(vector: arrow.Vector<T & AttributeArrowType>): this {
    if (!arrow.util.compareTypes(vector.type, this.type)) {
      throw new Error('GPUVector.addVectorToLastBatch() requires matching Arrow data types');
    }
    for (const data of vector.data) {
      this.addToLastData(data as arrow.Data<T & AttributeArrowType>);
    }
    return this;
  }

  /** Clears appendable logical rows while retaining the DynamicBuffer allocation. */
  resetLastBatch(): this {
    if (!(this._buffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector.resetLastBatch() requires appendable vector storage');
    }
    this.length = 0;
    this.data.length = 0;
    return this;
  }

  /** @internal Retains detached batch-local vector ownership under this aggregate vector. */
  retainOwnedVectors(vectors: GPUVector[]): this {
    this._ownedVectors.push(...vectors);
    return this;
  }

  /**
   * Transfers buffer ownership to another vector that views the same GPU buffer.
   *
   * This is intended for in-place operations that consume one logical vector and
   * return a new logical interpretation of the same bytes. After transfer,
   * destroying this vector will not destroy the buffer; destroying `target` will
   * destroy it if this vector previously owned it.
   */
  transferBufferOwnership(target: GPUVector): void {
    if (!this._buffer || !target._buffer || target._buffer !== this._buffer) {
      throw new Error('GPUVector ownership can only be transferred to the same buffer');
    }
    target._ownsBuffer = this._ownsBuffer;
    this._ownsBuffer = false;
  }

  /** Reads the GPU buffer contents back into a single non-null Arrow vector. */
  async readAsync(): Promise<arrow.Vector<T>> {
    if (this.bufferLayout) {
      throw new Error('GPUVector.readAsync() does not support interleaved vectors');
    }

    if (!this._buffer) {
      const data = await Promise.all(this.data.map(chunk => chunk.readAsync()));
      return new arrow.Vector(data) as arrow.Vector<T>;
    }

    return readArrowGPUVectorAsync({
      type: this.type as unknown as AttributeArrowType,
      buffer: this._buffer,
      length: this.length,
      byteOffset: this.byteOffset,
      byteStride: this.byteStride
    }) as unknown as Promise<arrow.Vector<T>>;
  }

  destroy(): void {
    if (this._ownsBuffer && this._buffer) {
      this._buffer.destroy();
      this._ownsBuffer = false;
    }
    for (const vector of this._ownedVectors.splice(0)) {
      vector.destroy();
    }
  }

  private ensureAppendableCapacity(requiredRows: number): void {
    if (!(this._buffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector append capacity requires DynamicBuffer storage');
    }
    const capacityRows = this.capacityRows ?? 0;
    if (requiredRows <= capacityRows) {
      return;
    }
    const grownRows = Math.ceil(Math.max(capacityRows, 1) * (this.capacityGrowthFactor ?? 1.5));
    const nextCapacityRows = Math.max(requiredRows, grownRows);
    this._buffer.ensureSize(nextCapacityRows * this.byteStride, {preserveData: true});
  }
}

function getArrowVectorStride(vector: arrow.Vector<AttributeArrowType>): number {
  return getArrowTypeStride(vector.type);
}

function createArrowGPUDataBuffer(buffer: Buffer | DynamicBuffer): DynamicBuffer {
  return buffer instanceof DynamicBuffer
    ? buffer
    : new DynamicBuffer(buffer.device, {
        buffer,
        ownsBuffer: false
      });
}
