// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUVector} from '../table/gpu-vector';
import type {GPUVectorFormat} from '../table/gpu-vector-format';

/** Semantic role consumed by one model GPU input. */
export type ModelGPUInputKind = 'positions' | 'colors' | 'scalars' | 'text' | 'time';

/** Whether one model GPU input resolves from source data or model-generated data. */
export type ModelGPUInputSource = 'source-mappable' | 'generated';

/** Runtime declaration for one prepared GPUVector consumed by a model. */
export type ModelGPUInputDeclaration<
  Name extends string = string,
  Format extends GPUVectorFormat = GPUVectorFormat
> = {
  /** Prepared model prop name. */
  name: Name;
  /** Semantic role consumed by the model. */
  kind: ModelGPUInputKind;
  /** Whether callers must provide this prepared GPU input. */
  required: boolean;
  /** Accepted canonical GPUVector memory formats. */
  formats: readonly Format[];
  /** Whether source mapping may resolve this input. */
  source: ModelGPUInputSource;
};

/** Runtime prepared GPU input contract declared by one model. */
export type ModelGPUInputSchema = readonly ModelGPUInputDeclaration[];

/** Prepared GPU vectors keyed by declared model GPU input name. */
export type ModelGPUInputVectors = Record<string, GPUVector | undefined>;

/** Validates prepared GPU vectors against one runtime model GPU input schema. */
export function assertModelGPUVectorInputs(
  modelName: string,
  schema: ModelGPUInputSchema,
  vectors: ModelGPUInputVectors
): void {
  for (const input of schema) {
    const vector = vectors[input.name];
    if (!vector) {
      if (input.required) {
        throw new Error(`${modelName} requires GPU input "${input.name}"`);
      }
      continue;
    }

    const format = vector.format;
    if (!format || !(input.formats as readonly GPUVectorFormat[]).includes(format)) {
      throw new Error(
        `${modelName} ${input.name} GPUVector.format "${format ?? 'undefined'}" must be one of ${input.formats.join(', ')}`
      );
    }
  }
}
