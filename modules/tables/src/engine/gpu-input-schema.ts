// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUVector} from '../table/gpu-vector';
import type {GPUVectorFormat} from '../table/gpu-vector-format';

/** Semantic role consumed by one GPU input. */
export type GPUInputKind = 'positions' | 'colors' | 'scalars' | 'text' | 'time';

/** Runtime declaration for one prepared GPUVector consumed by a model or renderer. */
export type GPUInputDeclaration<
  Name extends string = string,
  Format extends GPUVectorFormat = GPUVectorFormat
> = {
  /** Prepared input name. */
  name: Name;
  /** Semantic role consumed by the model or renderer. */
  kind: GPUInputKind;
  /** Whether callers must provide this prepared GPU input. */
  required: boolean;
  /** Accepted canonical GPUVector memory formats. */
  formats: readonly Format[];
  /**
   * Whether this input is generated during conversion or model preparation.
   * Omit for inputs that source mapping may resolve directly.
   */
  internal?: boolean;
};

/** Runtime prepared GPU input contract declared by one model or renderer. */
export type GPUInputSchema = readonly GPUInputDeclaration[];

/** Prepared GPU vectors keyed by declared GPU input name. */
export type GPUInputVectors = Record<string, GPUVector | undefined>;

/** Validates prepared GPU vectors against one runtime GPU input schema. */
export function validateGPUInputVectors(
  ownerName: string,
  schema: GPUInputSchema,
  vectors: GPUInputVectors
): void {
  for (const input of schema) {
    const vector = vectors[input.name];
    if (!vector) {
      if (input.required) {
        throw new Error(`${ownerName} requires GPU input "${input.name}"`);
      }
      continue;
    }

    const format = vector.format;
    if (!format || !(input.formats as readonly GPUVectorFormat[]).includes(format)) {
      throw new Error(
        `${ownerName} ${input.name} GPUVector.format "${format ?? 'undefined'}" must be one of ${input.formats.join(', ')}`
      );
    }
  }
}
