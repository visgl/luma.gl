// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUDataView} from './gpu-data-view';
import {
  isGPUDataStructFormat,
  normalizeGPUDataStructFormat,
  type GPUDataFormat,
  type GPUDataFormatDeclaration,
  type GPUDataStructFields,
  type GPUDataStructLayout,
  type GPUDataFormatT
} from './gpu-data-format';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from './gpu-vector-format';

/** Optional caller-owned metadata retained on a GPU data range. */
export type GPUDataReadbackMetadata = any;

/** Constructor props that wrap one existing GPU data buffer. */
type GPUDataFromBufferBaseProps = {
  /** Stable dynamic GPU buffer wrapper for this data range. */
  buffer: Buffer | DynamicBuffer;
  /** Number of logical rows in the data range. */
  length: number;
  /** Number of fixed rows or flattened vertex-list values in the data range. */
  valueLength?: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  stride?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent fixed rows or flattened elements. */
  byteStride?: number;
  /** Number of bytes occupied by the fixed row or flattened element payload. */
  rowByteLength?: number;
  /** Whether this data view should destroy the buffer. */
  ownsBuffer?: boolean;
  /** Optional metadata owned by the producer, such as Arrow readback descriptors. */
  readbackMetadata?: GPUDataReadbackMetadata;
  /** Optional row offsets for variable-length values normalized to this data chunk. */
  valueOffsets?: Int32Array;
  /** Optional row validity bitmap normalized to this data chunk. */
  nullBitmap?: Uint8Array;
  /** Optional number of uploaded value bytes referenced by this data chunk. */
  valueByteLength?: number;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Constructor props that wrap one existing GPU data buffer. */
export type GPUDataFromBufferProps<
  Format extends GPUDataFormatDeclaration = GPUVectorFormat,
  Layout extends GPUDataStructLayout = 'wgsl-storage'
> = GPUDataFromBufferBaseProps &
  (
    | {
        /** Canonical scalar or list memory-layout descriptor for this data range. */
        format?: Extract<Format, GPUVectorFormat>;
        /** Struct layout rules are only valid with a struct format declaration. */
        layout?: never;
      }
    | ([Extract<Format, GPUDataStructFields>] extends [never]
        ? never
        : {
            /** Named fixed-width formats stored in each interleaved row. */
            format: Extract<Format, GPUDataStructFields>;
            /** Physical struct packing rules. Defaults to `wgsl-storage`. */
            layout?: Layout;
          })
  );

type GPUDataScalarFromBufferProps<Format extends GPUVectorFormat> = GPUDataFromBufferBaseProps & {
  format?: Format;
  layout?: never;
};

type GPUDataStructFromBufferProps<
  Fields extends GPUDataStructFields,
  Layout extends GPUDataStructLayout
> = GPUDataFromBufferBaseProps & {
  format: Fields;
  layout?: Layout;
};

class GPUDataBufferOwner {
  /** GPU buffer containing this chunk's bytes. */
  readonly buffer: Buffer | DynamicBuffer;
  private ownsDataBuffer: boolean;

  constructor(buffer: Buffer | DynamicBuffer, ownsBuffer: boolean) {
    this.buffer = buffer;
    this.ownsDataBuffer = ownsBuffer;
  }

  /** Whether this data range is responsible for destroying its backing buffer. */
  get ownsBuffer(): boolean {
    return this.ownsDataBuffer;
  }

  /** Transfers backing-buffer ownership to another GPUData chunk over the same buffer. */
  transferBufferOwnership(target: GPUDataBufferOwner): void {
    if (target.buffer !== this.buffer) {
      throw new Error('GPUData ownership can only be transferred to the same buffer');
    }
    target.ownsDataBuffer = this.ownsDataBuffer;
    this.ownsDataBuffer = false;
  }

  /** Releases the backing buffer when this data range owns it. */
  destroy(): void {
    if (this.ownsDataBuffer) {
      this.buffer.destroy();
      this.ownsDataBuffer = false;
    }
  }
}

/** Runtime implementation behind the typed GPUData constructor interface. */
class GPUDataImpl extends GPUDataBufferOwner {
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  readonly dataType?: unknown;
  /** Canonical memory-layout descriptor for this data range. */
  readonly format?: GPUDataFormat;
  /** Number of logical rows in this chunk. */
  readonly length: number;
  /** Number of fixed rows or flattened vertex-list values in this chunk. */
  readonly valueLength: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent fixed rows or flattened elements in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one fixed row or flattened element payload. */
  readonly rowByteLength: number;
  /** Optional producer-owned metadata retained for adapter-level readback. */
  readonly readbackMetadata?: GPUDataReadbackMetadata;
  /** Optional row offsets for variable-length values normalized to this data chunk. */
  readonly valueOffsets?: Int32Array;
  /** Optional row validity bitmap normalized to this data chunk. */
  readonly nullBitmap?: Uint8Array;
  /** Optional number of uploaded value bytes referenced by this data chunk. */
  readonly valueByteLength?: number;
  constructor(
    props:
      | GPUDataFromBufferProps<GPUVectorFormat>
      | GPUDataFromBufferProps<GPUDataStructFields, GPUDataStructLayout>
  ) {
    const {
      buffer,
      format,
      length,
      valueLength,
      stride,
      byteOffset = 0,
      byteStride,
      rowByteLength,
      ownsBuffer = false,
      readbackMetadata,
      valueOffsets,
      nullBitmap,
      valueByteLength,
      dataType
    } = props;
    super(buffer, ownsBuffer);
    const canonicalFormat: GPUDataFormat | undefined =
      format && typeof format === 'object'
        ? normalizeGPUDataStructFormat(format, props.layout ?? 'wgsl-storage')
        : format;
    const structFormat = isGPUDataStructFormat(canonicalFormat) ? canonicalFormat : undefined;
    const formatInfo =
      typeof canonicalFormat === 'string' ? getGPUVectorFormatInfo(canonicalFormat) : undefined;
    this.dataType = dataType;
    this.format = canonicalFormat;
    this.length = length;
    this.valueLength = valueLength ?? length;
    this.stride =
      stride ??
      formatInfo?.components ??
      structFormat?.components ??
      byteStride ??
      rowByteLength ??
      1;
    this.byteOffset = byteOffset;
    this.rowByteLength =
      rowByteLength ??
      structFormat?.rowByteLength ??
      formatInfo?.byteLength ??
      byteStride ??
      this.stride;
    this.byteStride = byteStride ?? structFormat?.byteStride ?? this.rowByteLength;
    if (structFormat) {
      if (this.rowByteLength < structFormat.rowByteLength) {
        throw new Error(
          `GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${structFormat.rowByteLength}`
        );
      }
      if (this.byteStride < Math.max(structFormat.byteStride, this.rowByteLength)) {
        throw new Error(
          `GPUData byteStride ${this.byteStride} is smaller than its struct row layout`
        );
      }
    }
    this.readbackMetadata = readbackMetadata;
    this.valueOffsets = valueOffsets;
    this.nullBitmap = nullBitmap;
    this.valueByteLength = valueByteLength;
  }

  /** Returns a borrowed zero-copy view of one named struct field, or null for non-struct data. */
  getChild(name: string): GPUDataView | null {
    if (!isGPUDataStructFormat(this.format)) {
      return null;
    }
    const field = this.format.fields[name];
    if (!field) {
      return null;
    }
    return new GPUDataView({
      buffer: this.buffer,
      format: field.format,
      length: this.length,
      byteOffset: this.byteOffset + field.byteOffset,
      byteStride: this.byteStride
    });
  }

  /** Returns a borrowed zero-copy view of one struct field by declaration order. */
  getChildAt(index: number): GPUDataView | null {
    if (!isGPUDataStructFormat(this.format)) {
      return null;
    }
    const field = Object.values(this.format.fields)[index];
    if (!field) {
      return null;
    }
    return new GPUDataView({
      buffer: this.buffer,
      format: field.format,
      length: this.length,
      byteOffset: this.byteOffset + field.byteOffset,
      byteStride: this.byteStride
    });
  }
}

/**
 * GPU memory and format metadata for one contiguous data chunk.
 *
 * `GPUData` is Arrow-agnostic. Format-specific adapters upload bytes and retain
 * any extra schema/readback metadata outside table core.
 */
interface GPUDataBase<Format extends GPUDataFormat = GPUDataFormat> {
  /** GPU buffer containing this chunk's bytes. */
  readonly buffer: Buffer | DynamicBuffer;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  readonly dataType?: unknown;
  /** Canonical memory-layout descriptor for this data range. */
  readonly format?: Format;
  /** Number of logical rows in this chunk. */
  readonly length: number;
  /** Number of fixed rows or flattened vertex-list values in this chunk. */
  readonly valueLength: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent fixed rows or flattened elements in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one fixed row or flattened element payload. */
  readonly rowByteLength: number;
  /** Optional producer-owned metadata retained for adapter-level readback. */
  readonly readbackMetadata?: GPUDataReadbackMetadata;
  /** Optional row offsets for variable-length values normalized to this data chunk. */
  readonly valueOffsets?: Int32Array;
  /** Optional row validity bitmap normalized to this data chunk. */
  readonly nullBitmap?: Uint8Array;
  /** Optional number of uploaded value bytes referenced by this data chunk. */
  readonly valueByteLength?: number;
  /** Whether this data range is responsible for destroying its backing buffer. */
  readonly ownsBuffer: boolean;

  /** Returns a borrowed zero-copy view of one named struct field, or null for non-struct data. */
  getChild(name: string): GPUDataView | null;
  /** Returns a borrowed zero-copy view of one struct field by declaration order. */
  getChildAt(index: number): GPUDataView | null;
  /** Transfers backing-buffer ownership to another GPUData chunk over the same buffer. */
  transferBufferOwnership(target: GPUDataBase): void;
  /** Releases the backing buffer when this data range owns it. */
  destroy(): void;
}

/** Typed GPU data object for scalar, list, or inline struct format declarations. */
export type GPUData<
  Format extends GPUDataFormatDeclaration = GPUVectorFormat,
  Layout extends GPUDataStructLayout | null = null
> = Omit<GPUDataBase<GPUDataFormatT<Format, Layout>>, 'getChild' | 'getChildAt'> &
  GPUDataChildMethods<Format, Layout>;

type GPUDataChildMethods<
  Format extends GPUDataFormatDeclaration,
  Layout extends GPUDataStructLayout | null
> = Layout extends null
  ? {
      getChild(name: string): GPUDataView | null;
      getChildAt(index: number): GPUDataView | null;
    }
  : Extract<Format, GPUDataStructFields> extends infer Fields extends GPUDataStructFields
    ? {
        getChild<Name extends string>(name: Name): GPUDataChild<Fields, Name> | null;
        getChildAt(index: number): GPUDataChildAt<Fields> | null;
      }
    : {};

type GPUDataConstructor = {
  new <const Format extends GPUVectorFormat = GPUVectorFormat>(
    props: GPUDataScalarFromBufferProps<Format>
  ): GPUData<Format>;
  new <const Fields extends GPUDataStructFields>(
    props: GPUDataStructFromBufferProps<Fields, 'wgsl-storage'>
  ): GPUData<Fields, 'wgsl-storage'>;
  new <const Fields extends GPUDataStructFields, const Layout extends GPUDataStructLayout>(
    props: GPUDataStructFromBufferProps<Fields, Layout> & {layout: Layout}
  ): GPUData<Fields, Layout>;
  new (
    props:
      | GPUDataScalarFromBufferProps<GPUVectorFormat>
      | GPUDataStructFromBufferProps<GPUDataStructFields, GPUDataStructLayout>
  ): GPUData;
};

/** Typed constructor for scalar, list, and inline struct GPUData declarations. */
export const GPUData = GPUDataImpl as unknown as GPUDataConstructor;

/** Borrowed view type returned for one named GPU data struct field. */
export type GPUDataChild<Format extends GPUDataFormatDeclaration, Name extends string> = [
  Extract<Format, GPUDataStructFields>
] extends [never]
  ? never
  : Extract<Format, GPUDataStructFields> extends infer Fields extends GPUDataStructFields
    ? Name extends keyof Fields
      ? GPUDataView<Fields[Name]>
      : never
    : never;

/** Borrowed view type returned for a GPU data struct field selected by index. */
export type GPUDataChildAt<Format extends GPUDataFormatDeclaration> = [
  Extract<Format, GPUDataStructFields>
] extends [never]
  ? never
  : Extract<Format, GPUDataStructFields> extends infer Fields extends GPUDataStructFields
    ? GPUDataView<Fields[keyof Fields]>
    : never;
