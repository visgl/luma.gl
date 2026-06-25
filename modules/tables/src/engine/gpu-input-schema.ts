// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUVector} from '../table/gpu-vector';
import type {GPUVectorFormat} from '../table/gpu-vector-format';

/** Semantic role consumed by one GPU input. */
export type GPUInputKind = 'positions' | 'colors' | 'scalars' | 'text' | 'time';

/** Runtime declaration for one prepared GPUVector consumed by a model or renderer. */
export type GPUInputDeclaration<
  ColumnName extends string = string,
  Format extends GPUVectorFormat = GPUVectorFormat
> = {
  /** Prepared GPUTable column and GPUVector map key. */
  columnName: ColumnName;
  /** Optional shader attribute supplied by this column. */
  attributeName?: string;
  /** Optional shader storage binding supplied by this column. */
  bindingName?: string;
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

/** Prepared GPU vectors keyed by declared GPU input column name. */
export type GPUInputVectors = Record<string, GPUVector | undefined>;

/** Validates prepared GPU vectors against one runtime GPU input schema. */
export function validateGPUInputVectors(
  ownerName: string,
  schema: GPUInputSchema,
  vectors: GPUInputVectors
): void {
  for (const input of schema) {
    const vector = vectors[input.columnName];
    if (!vector) {
      if (input.required) {
        throw new Error(`${ownerName} requires GPU input "${input.columnName}"`);
      }
      continue;
    }

    const format = vector.format;
    if (!format || !(input.formats as readonly GPUVectorFormat[]).includes(format)) {
      throw new Error(
        `${ownerName} ${input.columnName} GPUVector.format "${format ?? 'undefined'}" must be one of ${input.formats.join(', ')}`
      );
    }
  }
}
