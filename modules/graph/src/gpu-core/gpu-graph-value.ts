// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextureFormat} from '@luma.gl/core';
import type {
  GraphTextureDescriptor,
  GraphTextureDimension,
  GraphTextureViewProps
} from './gpu-command-graph';

/** Scalar/vector formats portable across current Jarnevon execution backends. */
export type GPUGraphScalarFormat = 'float32' | 'uint32' | 'sint32';
export type GPUGraphVectorFormat = GPUGraphScalarFormat;

/** Backend-independent scalar state owned by a GPUGraph. */
export class GPUGraphScalar<T extends GPUGraphScalarFormat = GPUGraphScalarFormat> {
  readonly id: string;
  readonly format: T;
  constructor(id: string, format: T) {
    if (!id) throw new Error('GPUGraphScalar id is required');
    this.id = id;
    this.format = format;
  }
}

/**
 * Backend-independent dense one-dimensional value array.
 *
 * A vector describes logical shape/type only. It is not a WebGPU Buffer or GraphDataView. Backend
 * compilers decide allocation, packing and binding. `external` vectors represent program I/O whose
 * concrete storage is supplied to compilation; transient vectors are compiler-owned scratch/state.
 */
export class GPUGraphVector<T extends GPUGraphVectorFormat = GPUGraphVectorFormat> {
  readonly id: string;
  readonly format: T;
  readonly length: number;
  readonly external: boolean;
  /** Optional physical partition lengths; omitted external topology is supplied by its binding. */
  readonly chunkLengths?: readonly number[];
  constructor(props: {
    id: string;
    format: T;
    length: number;
    external?: boolean;
    chunkLengths?: readonly number[];
  }) {
    if (!props.id) throw new Error('GPUGraphVector id is required');
    if (!Number.isSafeInteger(props.length) || props.length < 0) {
      throw new Error(`${props.id} vector length must be a non-negative safe integer`);
    }
    this.id = props.id;
    this.format = props.format;
    this.length = props.length;
    this.external = props.external ?? false;
    if (props.chunkLengths) {
      if (
        props.chunkLengths.some(length => !Number.isSafeInteger(length) || length < 0) ||
        props.chunkLengths.reduce((sum, length) => sum + length, 0) !== props.length
      ) {
        throw new Error(`${props.id} chunk lengths must partition its logical length`);
      }
      this.chunkLengths = Object.freeze([...props.chunkLengths]);
    }
  }
}

/** Logical texture storage. Allocation and device validation belong to the graph compiler. */
export class GPUGraphTexture<Format extends TextureFormat = TextureFormat> {
  readonly id: string;
  readonly format: Format;
  readonly width: number;
  readonly height: number;
  readonly usage: number;
  readonly dimension?: GraphTextureDimension;
  readonly depth?: number;
  readonly mipLevels?: number;
  readonly samples?: number;
  /** Caller-owned storage, optionally bound at compilation or supplied when encoding. */
  readonly external: boolean;

  constructor(props: GPUGraphTextureProps<Format> & {id: string}) {
    this.id = props.id;
    this.format = props.format;
    this.width = props.width;
    this.height = props.height;
    this.usage = props.usage;
    this.dimension = props.dimension;
    this.depth = props.depth;
    this.mipLevels = props.mipLevels;
    this.samples = props.samples;
    this.external = props.external ?? false;
  }
}

/** Uses the same descriptor vocabulary as GPUCommandGraph; defaults are applied during lowering. */
export type GPUGraphTextureProps<Format extends TextureFormat = TextureFormat> = Omit<
  GraphTextureDescriptor<Format>,
  'id'
> & {external?: boolean};

/** A subresource selection, never an allocation or an independently owned texture. */
export class GPUGraphTextureView<Format extends TextureFormat = TextureFormat> {
  readonly texture: GPUGraphTexture<Format>;
  readonly props: Readonly<GraphTextureViewProps>;

  constructor(texture: GPUGraphTexture<Format>, props: GraphTextureViewProps = {}) {
    this.texture = texture;
    this.props = Object.freeze({...props});
  }
}
