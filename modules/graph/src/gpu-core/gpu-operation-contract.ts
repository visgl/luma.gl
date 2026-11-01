// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {DeviceFeature} from '@luma.gl/core';
import {GPUGraphScalar, GPUGraphVector, GPUGraphTexture} from './gpu-graph-value';
import type {GPUGraph} from './gpu-graph';

/** A logical declaration or its name; never a bound buffer or command-graph view. */
export type GPUOperationValueReference = string | GPUGraphScalar | GPUGraphVector | GPUGraphTexture;

/** Output topology is fixed, or inherited without repacking from another vector. */
export type GPUOperationVectorShape =
  | {like: string | GPUGraphVector}
  | {length: number; chunkLengths?: readonly number[]};

export type GPUOperationValueUse = {
  value: GPUOperationValueReference;
  access: 'read' | 'write' | 'read-write';
  /** Vector outputs only. Omitted shapes use the output declaration or supplied storage. */
  shape?: GPUOperationVectorShape;
};

/** Compiler-facing dependencies and outputs, separate from diagnostic metadata. */
export type GPUOperationContract = {
  values: readonly GPUOperationValueUse[];
  requiredFeatures?: readonly DeviceFeature[];
};

/** @internal */
export function getGPUOperationValueName(value: GPUOperationValueReference): string {
  return typeof value === 'string' ? value : value.id;
}

/** Resolve names and typed references through the same declaration namespace. @internal */
export function resolveGPUOperationValue(
  program: GPUGraph,
  reference: GPUOperationValueReference
): GPUGraphScalar | GPUGraphVector | GPUGraphTexture {
  const name = getGPUOperationValueName(reference);
  const declaration = [...program.scalars, ...program.vectors, ...program.textures].find(
    value => value.id === name
  );
  if (!declaration) throw new Error(`Undeclared operation value ${name}`);
  if (
    typeof reference !== 'string' &&
    (reference.constructor !== declaration.constructor || reference.format !== declaration.format)
  )
    throw new Error(`Incompatible operation reference ${name}`);
  return declaration;
}

/** Compile-time structural checks; bindings and physical hazards remain separate. @internal */
export function validateGPUOperationContract(
  program: GPUGraph,
  contract: GPUOperationContract
): void {
  for (const use of contract.values) {
    const declaration = resolveGPUOperationValue(program, use.value);
    if (!use.shape) continue;
    if (!(declaration instanceof GPUGraphVector) || use.access === 'read')
      throw new Error('Operation shapes require writable vectors');
    if ('like' in use.shape) {
      if (!(resolveGPUOperationValue(program, use.shape.like) instanceof GPUGraphVector))
        throw new Error('Operation shape source must be a vector');
      const sourceName = getGPUOperationValueName(use.shape.like);
      if (
        !contract.values.some(
          input => input.access !== 'write' && getGPUOperationValueName(input.value) === sourceName
        )
      )
        throw new Error('Operation shape source must be a declared read');
    } else {
      const {length, chunkLengths} = use.shape;
      if (
        !Number.isSafeInteger(length) ||
        length < 0 ||
        (chunkLengths &&
          (chunkLengths.some(count => !Number.isSafeInteger(count) || count < 0) ||
            chunkLengths.reduce((total, count) => total + count, 0) !== length))
      )
        throw new Error('Invalid operation output shape');
    }
  }
}
