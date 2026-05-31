// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SignedDataType, VertexFormat} from '@luma.gl/core';
import {
  getGPUVectorFormatInfo,
  getInterleavedGPUVectorLayout,
  type Interleaved,
  type InterleavedFields,
  type GPUVector
} from '@luma.gl/tables';
import {
  getGPUTableEvaluator,
  getGPUVectorBuffer,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
import {
  getInterleavedGPUTableEvaluatorFromGPUVector,
  InterleavedGPUTableEvaluator
} from '../operation/interleaved-gpu-table-evaluator';
import {Operation} from '../operation/operation';

type ScatterInterleavedInputMap<Fields extends InterleavedFields> = {
  [Name in keyof Fields & string]: GPUTableEvaluatorInput;
};

type ScatterInterleavedEvaluatorMap<Fields extends InterleavedFields> = {
  [Name in keyof Fields & string]: GPUTableEvaluator;
};

/** Options for scattering primitive columns into one interleaved output. */
export type ScatterInterleavedOptions<Fields extends InterleavedFields = InterleavedFields> = {
  /** Output vector name. */
  name: string;
  /** Target interleaved field formats. */
  fields: Fields;
  /** Step mode for the generated BufferLayout. */
  stepMode?: 'vertex' | 'instance';
  /** Minimum field/stride byte alignment. Defaults to 4 bytes. */
  minAttributeAlignment?: number;
};

class ScatterInterleavedOperation<Fields extends InterleavedFields> extends Operation<
  ScatterInterleavedEvaluatorMap<Fields>,
  InterleavedGPUTableEvaluator<Fields>
> {
  name = 'scatterInterleaved';

  output: InterleavedGPUTableEvaluator<Fields>;

  constructor(
    inputs: ScatterInterleavedEvaluatorMap<Fields>,
    options: ScatterInterleavedOptions<Fields>
  ) {
    super(inputs);
    const layout = getInterleavedGPUVectorLayout(options);
    const length = getScatterInterleavedLength(inputs);
    validateScatterInterleavedInputs(inputs, options.fields, length);
    this.output = new InterleavedGPUTableEvaluator({
      id: options.name,
      layout,
      length,
      source: this,
      fieldInputs: inputs
    });
  }

  toString(): string {
    return `scatterInterleaved(${Object.keys(this.inputs).join(',')})`;
  }

  protected override shouldExecuteOnCPU(): boolean {
    return false;
  }
}

/**
 * Scatters named primitive columns into one interleaved output column.
 *
 * Inputs are interpreted as raw memory columns matching the target field's
 * component type and component count.
 */
export function scatterInterleaved<Fields extends InterleavedFields>(
  inputs: ScatterInterleavedInputMap<Fields>,
  options: ScatterInterleavedOptions<Fields>
): InterleavedGPUTableEvaluator<Fields> {
  const normalizedInputs = normalizeScatterInterleavedInputs(inputs, options.fields);
  return new ScatterInterleavedOperation(normalizedInputs, options).output;
}

/** Picks one primitive field out of an interleaved evaluator or vector. */
export function pickInterleaved<
  Fields extends InterleavedFields,
  Name extends keyof Fields & string
>(
  source: InterleavedGPUTableEvaluator<Fields> | GPUVector<Interleaved<Fields>>,
  fieldName: Name
): GPUTableEvaluator {
  const interleavedEvaluator =
    source instanceof InterleavedGPUTableEvaluator
      ? source
      : getInterleavedGPUTableEvaluatorFromGPUVector(source);

  const directInput = interleavedEvaluator.fieldInputs[fieldName];
  if (directInput) {
    return directInput;
  }

  const attribute = interleavedEvaluator.layout.attributes.find(
    candidate => candidate.attribute === fieldName
  );
  if (!attribute) {
    throw new Error(`Interleaved GPU vector field "${fieldName}" does not exist`);
  }

  const formatInfo = getGPUVectorFormatInfo(attribute.format);
  const buffer = getGPUVectorBuffer(interleavedEvaluator.gpuVector);
  return new GPUTableEvaluator({
    id: fieldName,
    type: formatInfo.signedDataType,
    size: formatInfo.components,
    offset: attribute.byteOffset,
    stride: interleavedEvaluator.layout.byteStride,
    normalized: formatInfo.normalized,
    length: interleavedEvaluator.length,
    buffer,
    format: attribute.format
  });
}

function normalizeScatterInterleavedInputs<Fields extends InterleavedFields>(
  inputs: ScatterInterleavedInputMap<Fields>,
  fields: Fields
): ScatterInterleavedEvaluatorMap<Fields> {
  const fieldNames = Object.keys(fields);
  const inputNames = Object.keys(inputs);
  for (const fieldName of fieldNames) {
    if (!(fieldName in inputs)) {
      throw new Error(`scatterInterleaved missing input field "${fieldName}"`);
    }
  }
  for (const inputName of inputNames) {
    if (!(inputName in fields)) {
      throw new Error(`scatterInterleaved input "${inputName}" is not declared in fields`);
    }
  }

  return Object.fromEntries(
    fieldNames.map(fieldName => [fieldName, getGPUTableEvaluator(inputs[fieldName])])
  ) as ScatterInterleavedEvaluatorMap<Fields>;
}

function getScatterInterleavedLength(inputs: Record<string, GPUTableEvaluator>): number {
  const nonConstantLengths = Object.values(inputs)
    .filter(input => !input.isConstant)
    .map(input => input.length);
  return nonConstantLengths[0] ?? 1;
}

function validateScatterInterleavedInputs<Fields extends InterleavedFields>(
  inputs: ScatterInterleavedEvaluatorMap<Fields>,
  fields: Fields,
  length: number
): void {
  for (const [fieldName, format] of Object.entries(fields) as Array<
    [keyof Fields & string, VertexFormat]
  >) {
    const input = inputs[fieldName];
    const formatInfo = getGPUVectorFormatInfo(format);
    if (!input.isConstant && input.length !== length) {
      throw new Error('scatterInterleaved requires matching non-constant row counts');
    }
    if (input.size !== formatInfo.components) {
      throw new Error(
        `scatterInterleaved field "${fieldName}" requires ${formatInfo.components} components`
      );
    }
    if (!isCompatibleScatterInputType(input.type, formatInfo.signedDataType)) {
      throw new Error(
        `scatterInterleaved field "${fieldName}" requires ${formatInfo.signedDataType} input values`
      );
    }
  }
}

function isCompatibleScatterInputType(
  inputType: SignedDataType,
  fieldType: SignedDataType
): boolean {
  return inputType === fieldType;
}
