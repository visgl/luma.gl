// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUVector} from '../table/gpu-vector';
import type {GPUConstant} from '../table/gpu-constant';
import type {GPUVectorFormat} from '../table/gpu-vector-format';

/** Semantic role consumed by one GPU input. */
export type GPUInputKind = 'positions' | 'colors' | 'scalars' | 'matrices' | 'text' | 'time';

/** Shader-attribute mapping supplied by one logical GPU input. */
type GPUInputAttributeMapping =
  | {
      /** Optional shader attribute supplied by this column. */
      attributeName?: string;
      /** Composite attribute mappings are mutually exclusive with `attributeName`. */
      attributeNames?: never;
    }
  | {
      /** Singular attribute mappings are mutually exclusive with `attributeNames`. */
      attributeName?: never;
      /** Two or more shader attributes supplied by views of the same physical column. */
      attributeNames: readonly [string, string, ...string[]];
    };

/** Runtime declaration for one prepared GPUVector consumed by a model or renderer. */
export type GPUInputDeclaration<
  ColumnName extends string = string,
  Format extends GPUVectorFormat = GPUVectorFormat
> = GPUInputAttributeMapping & {
  /** Prepared GPUTable column and GPUVector map key. */
  columnName: ColumnName;
  /** Optional shader storage binding supplied by this column. */
  storageBindingName?: string;
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

/** Prepared varying GPU vectors keyed by declared GPU input column name. */
export type GPUInputVectors = Record<string, GPUVector | undefined>;

/** Prepared logical GPU columns keyed by declared GPU input column name. */
export type GPUInputColumns = Record<string, GPUVector | GPUConstant | undefined>;

/**
 * Returns the shader attributes supplied by one logical GPU input.
 *
 * Runtime validation complements the composite tuple type for JavaScript callers and values that
 * reach the API through an unchecked cast.
 */
export function getGPUInputAttributeNames(input: GPUInputDeclaration): readonly string[] {
  if (input.attributeNames !== undefined) {
    // Singular mappings use attributeName.
    assert(input.attributeNames.length >= 2);
    const uniqueNames = new Set(input.attributeNames);
    // Each name identifies a distinct shader-visible view.
    assert(uniqueNames.size === input.attributeNames.length);
    return input.attributeNames;
  }
  return input.attributeName === undefined ? [] : [input.attributeName];
}

/** Validates prepared GPU vectors against one runtime GPU input schema. */
export function validateGPUInputVectors(
  ownerName: string,
  schema: GPUInputSchema,
  vectors: GPUInputColumns
): void {
  for (const input of schema) {
    getGPUInputAttributeNames(input);
    const column = vectors[input.columnName];
    if (!column) {
      if (input.required) {
        throw new Error(`${ownerName} requires GPU input "${input.columnName}"`);
      }
      continue;
    }

    if ('isConstant' in column && input.required) {
      throw new Error(
        `${ownerName} requires varying GPU input "${input.columnName}"; required inputs cannot be constant`
      );
    }

    const format = column.format;
    if (!format || !(input.formats as readonly GPUVectorFormat[]).includes(format)) {
      const columnType = 'isConstant' in column ? 'GPUConstant' : 'GPUVector';
      throw new Error(
        `${ownerName} ${input.columnName} ${columnType}.format "${format ?? 'undefined'}" must be one of ${input.formats.join(', ')}`
      );
    }
  }
}
