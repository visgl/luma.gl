// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextureFormat} from '@luma.gl/core';
import type {GraphTextureViewProps} from './gpu-command-graph';

import {
  GPUCompositeOperation,
  getGPUOperationTree,
  type GPUOperationLike,
  type GPUOperationTree,
  type GPUGraphOperation
} from './gpu-operation';
import {
  GPUGraphScalar,
  GPUGraphTexture,
  GPUGraphTextureView,
  type GPUGraphTextureProps,
  GPUGraphVector,
  type GPUGraphScalarFormat,
  type GPUGraphVectorFormat
} from './gpu-graph-value';

/** Backend-independent semantic GPU program. */
export class GPUGraph {
  readonly id: string;
  private readonly programOperations: GPUGraphOperation[] = [];
  private readonly programScalars = new Map<string, GPUGraphScalar>();
  private readonly programVectors = new Map<string, GPUGraphVector>();
  private readonly programTextures = new Map<string, GPUGraphTexture>();
  constructor(props: {id?: string} = {}) {
    this.id = props.id ?? 'gpu-program';
  }
  add(operation: GPUOperationLike): this {
    this.assertOperationLike(operation);
    this.addOperationLike(operation);
    return this;
  }
  scalar<T extends GPUGraphScalarFormat>(id: string, format: T): GPUGraphScalar<T> {
    this.assertValueId(id);
    const scalar = new GPUGraphScalar(id, format);
    this.programScalars.set(id, scalar);
    return scalar;
  }
  vector<T extends GPUGraphVectorFormat>(
    id: string,
    format: T,
    length: number,
    props: {external?: boolean; chunkLengths?: readonly number[]} = {}
  ): GPUGraphVector<T> {
    this.assertValueId(id);
    const vector = new GPUGraphVector({id, format, length, ...props});
    this.programVectors.set(id, vector);
    return vector;
  }
  texture<Format extends TextureFormat>(
    id: string,
    props: GPUGraphTextureProps<Format>
  ): GPUGraphTexture<Format> {
    this.assertValueId(id);
    const texture = new GPUGraphTexture({...props, id});
    this.programTextures.set(id, texture);
    return texture;
  }
  textureView<Format extends TextureFormat>(
    texture: GPUGraphTexture<Format>,
    props: GraphTextureViewProps = {}
  ): GPUGraphTextureView<Format> {
    if (this.programTextures.get(texture.id) !== texture) {
      throw new Error(`Undeclared program texture "${texture.id}"`);
    }
    return new GPUGraphTextureView(texture, props);
  }
  get textures(): readonly GPUGraphTexture[] {
    return Object.freeze([...this.programTextures.values()]);
  }
  get scalars(): readonly GPUGraphScalar[] {
    return Object.freeze([...this.programScalars.values()]);
  }
  get vectors(): readonly GPUGraphVector[] {
    return Object.freeze([...this.programVectors.values()]);
  }
  get operations(): readonly GPUGraphOperation[] {
    return Object.freeze([...this.programOperations]);
  }
  get operationTree(): readonly GPUOperationTree[] {
    return Object.freeze(this.programOperations.map(getGPUOperationTree));
  }
  private assertValueId(id: string): void {
    if (this.programScalars.has(id) || this.programVectors.has(id) || this.programTextures.has(id))
      throw new Error(`${this.id} value "${id}" already exists`);
  }
  private addOperationLike(operation: GPUOperationLike): void {
    if (Array.isArray(operation)) {
      for (const child of operation) this.addOperationLike(child);
      return;
    }
    this.programOperations.push(operation as GPUGraphOperation);
  }
  private assertOperationLike(operation: GPUOperationLike): void {
    if (Array.isArray(operation)) {
      for (const child of operation) this.assertOperationLike(child);
      return;
    }
    if (!operation || typeof operation !== 'object')
      throw new Error(`${this.id} accepts GPU operations only`);
  }
}
export function composite<Operation extends GPUGraphOperation>(
  operations: readonly Operation[],
  props: {id?: string} = {}
): GPUCompositeOperation<Operation> {
  return new GPUCompositeOperation({id: props.id, operations});
}
