// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CompiledGPUGraph} from './compiled-gpu-graph';
import type {GPUGraphCompileOptions} from './gpu-expression-plan';
import type {Device} from '@luma.gl/core';

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
  type GPUGraphScalarDescriptor,
  type GPUGraphVectorDescriptor,
  type GPUGraphValueDescriptor,
  type GPUGraphValueRole,
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
  addInput<T extends GPUGraphScalarFormat>(
    id: string,
    descriptor: GPUGraphScalarDescriptor<T>
  ): GPUGraphScalar<T>;
  addInput<T extends GPUGraphVectorFormat>(
    id: string,
    descriptor: GPUGraphVectorDescriptor<T>
  ): GPUGraphVector<T>;
  addInput(id: string, descriptor: GPUGraphValueDescriptor): GPUGraphScalar | GPUGraphVector {
    return this.addDeclaration(id, descriptor, 'input');
  }
  /** State is initialized, borrowed vector storage supplied for every invocation. */
  addState<T extends GPUGraphVectorFormat>(
    id: string,
    descriptor: GPUGraphVectorDescriptor<T>
  ): GPUGraphVector<T> {
    if (descriptor.type !== 'vector') throw new Error('Graph state requires vector storage');
    return this.addDeclaration(id, descriptor, 'state') as GPUGraphVector<T>;
  }
  /** @internal */
  addDeclaration(
    id: string,
    descriptor: GPUGraphValueDescriptor,
    role?: GPUGraphValueRole
  ): GPUGraphScalar | GPUGraphVector {
    this.assertValueId(id);
    if (descriptor.type === 'scalar') {
      const scalar = new GPUGraphScalar(id, descriptor.format, role);
      this.programScalars.set(id, scalar);
      return scalar;
    }
    const vector = new GPUGraphVector({
      id,
      ...descriptor,
      role,
      external: role === 'input' || role === 'state'
    });
    this.programVectors.set(id, vector);
    return vector;
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
    lengthOrProps?:
      | number
      | {length?: number; external?: boolean; chunkLengths?: readonly number[]},
    props: {external?: boolean; chunkLengths?: readonly number[]} = {}
  ): GPUGraphVector<T> {
    this.assertValueId(id);
    const declaration =
      typeof lengthOrProps === 'number'
        ? {length: lengthOrProps, ...props}
        : (lengthOrProps ?? props);
    const vector = new GPUGraphVector({id, format, ...declaration});
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
  compile(device: Device, options: GPUGraphCompileOptions = {}): CompiledGPUGraph {
    return new CompiledGPUGraph(device, this, options);
  }
  /** @internal */
  constrainResult(vector: GPUGraphVector, descriptor: GPUGraphVectorDescriptor): GPUGraphVector {
    if (
      vector.length !== undefined &&
      descriptor.length !== undefined &&
      vector.length !== descriptor.length
    )
      throw new Error(`Incompatible result length ${vector.id}`);
    if (
      vector.chunkLengths &&
      descriptor.chunkLengths &&
      (vector.chunkLengths.length !== descriptor.chunkLengths.length ||
        vector.chunkLengths.some((length, index) => length !== descriptor.chunkLengths![index]))
    )
      throw new Error(`Incompatible result chunks ${vector.id}`);
    const constrained = new GPUGraphVector({
      ...vector,
      length: vector.length ?? descriptor.length,
      chunkLengths: vector.chunkLengths ?? descriptor.chunkLengths
    });
    this.programVectors.set(vector.id, constrained);
    return constrained;
  }
  /** @internal */
  clone(): GPUGraph {
    const program = new GPUGraph({id: this.id});
    for (const [name, value] of this.programScalars) program.programScalars.set(name, value);
    for (const [name, value] of this.programVectors) program.programVectors.set(name, value);
    for (const [name, value] of this.programTextures) program.programTextures.set(name, value);
    program.programOperations.push(...this.programOperations);
    return program;
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
export function composite(
  operations: readonly GPUGraphOperation[],
  props: {id?: string} = {}
): GPUCompositeOperation {
  return new GPUCompositeOperation({id: props.id, operations});
}
