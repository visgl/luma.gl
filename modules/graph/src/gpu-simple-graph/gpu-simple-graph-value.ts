// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type {GPUData} from '@luma.gl/graph/gpu-data';
import {GPUDataEvaluator} from './operation/gpu-data-evaluator';
import {type GPUVectorEvaluator} from './operation/gpu-vector-evaluator';
import {
  abs,
  add,
  cos,
  divide,
  exp,
  log,
  multiply,
  pow,
  sin,
  sqrt,
  subtract,
  tan
} from './operations/arithmetic';
import {dot} from './operations/dot';
import {equalAll} from './operations/equal-all';
import {extent} from './operations/extent';
import {fround} from './operations/fround';
import {gather} from './operations/gather';
import {interleave} from './operations/interleave';
import {length} from './operations/length';
import {segmentedMap} from './operations/segmented-map';
import {select} from './operations/select';
import {sequence} from './operations/sequence';
import {swizzle} from './operations/swizzle';
import {castData} from './operations/cast-data';
import {convertColorData} from './operations/convert-colors';
import type {GPUOperation, GPUOperationMetadata} from '@luma.gl/graph/gpu-core';
import type {GPUSimpleGraphUploadProps} from './gpu-simple-graph-transfer';

const OPERATIONS = {
  abs,
  add,
  cos,
  divide,
  dot,
  equalAll,
  exp,
  extent,
  fround,
  gather,
  interleave,
  length,
  log,
  multiply,
  pow,
  segmentedMap,
  select,
  sequence,
  sin,
  sqrt,
  subtract,
  tan,
  swizzle,
  castData,
  convertColorData
};

/** Replace evaluator operands with graph values while retaining operation-specific arguments. */
type GraphArgument<Value> = Value extends GPUDataEvaluator
  ? GPUSimpleGraphValue
  : Value extends readonly unknown[]
    ? {[Index in keyof Value]: GraphArgument<Value[Index]>}
    : Value;

export type GPUSimpleGraphOperations = {
  [Name in keyof typeof OPERATIONS]: (
    ...operationArguments: GraphArgument<Parameters<(typeof OPERATIONS)[Name]>>
  ) => GPUSimpleGraphValue;
};

type ValueRecipe =
  | {
      kind: 'upload';
      data: TypedArray | number[];
      options: Omit<GPUSimpleGraphUploadProps, 'id' | 'data'>;
    }
  | {kind: 'constant'; value: number | number[]}
  | {kind: 'input'; data: GPUData}
  | {kind: 'operation'; name: keyof typeof OPERATIONS; operationArguments: readonly unknown[]};

/** Stable expression identity. Compilations own execution state; values own no GPU resources. */
export class GPUSimpleGraphValue {
  private constructor(/** @internal */ readonly recipe: ValueRecipe) {}

  /** Borrows CPU data until compilation/materialization, with the existing array layout rules. */
  static upload(
    data: TypedArray | number[],
    options: Omit<GPUSimpleGraphUploadProps, 'id' | 'data'> = {}
  ): GPUSimpleGraphValue {
    return new GPUSimpleGraphValue({kind: 'upload', data, options: {...options}});
  }

  static constant(value: number | number[]): GPUSimpleGraphValue {
    return new GPUSimpleGraphValue({kind: 'constant', value});
  }

  /** Borrows one existing GPU data chunk without transferring buffer ownership. */
  static fromGPUData(data: GPUData): GPUSimpleGraphValue {
    return new GPUSimpleGraphValue({kind: 'input', data});
  }

  /** @internal */
  static operation(
    name: keyof typeof OPERATIONS,
    operationArguments: readonly unknown[]
  ): GPUSimpleGraphValue {
    return new GPUSimpleGraphValue({kind: 'operation', name, operationArguments});
  }
}

/** Existing GPGPU functions expressed as lazy graph recipes, with unchanged argument semantics. */
export const simpleGraphOperations: GPUSimpleGraphOperations = Object.fromEntries(
  Object.keys(OPERATIONS).map(name => [
    name,
    (...operationArguments: unknown[]) =>
      GPUSimpleGraphValue.operation(name as keyof typeof OPERATIONS, operationArguments)
  ])
) as GPUSimpleGraphOperations;

/** Publishes an expression as a named graph output. */
export class GPUSimpleGraphValueOperation implements GPUOperation {
  readonly type = 'simple-graph-value';
  readonly id: string;
  constructor(
    readonly props: {id: string; value: GPUSimpleGraphValue | readonly GPUSimpleGraphValue[]}
  ) {
    this.id = props.id;
  }
  get metadata(): GPUOperationMetadata {
    return {outputs: [{name: this.id, kind: 'vector'}]};
  }
}

/** Compilation-local adapter. It uses the original operations and owns their entire lazy tree. @internal */
export function lowerSimpleGraphValue(
  value: GPUSimpleGraphValue,
  cache: Map<GPUSimpleGraphValue, GPUDataEvaluator>,
  owned: Set<GPUDataEvaluator | GPUVectorEvaluator>
): GPUDataEvaluator {
  const existing = cache.get(value);
  if (existing) return existing;
  const resolveArgument = (argument: unknown): unknown => {
    if (argument instanceof GPUSimpleGraphValue)
      return lowerSimpleGraphValue(argument, cache, owned);
    if (Array.isArray(argument)) return argument.map(resolveArgument);
    return argument;
  };
  const recipe = value.recipe;
  let evaluator: GPUDataEvaluator;
  switch (recipe.kind) {
    case 'upload':
      evaluator = GPUDataEvaluator.fromArray(recipe.data, recipe.options);
      break;
    case 'constant':
      evaluator = GPUDataEvaluator.fromConstant(recipe.value);
      break;
    case 'input':
      evaluator = GPUDataEvaluator.fromGPUData(recipe.data);
      break;
    case 'operation': {
      // The public mapped signatures preserve each original function's argument types.
      const operation = OPERATIONS[recipe.name] as (
        ...operationArguments: unknown[]
      ) => GPUDataEvaluator;
      evaluator = operation(...recipe.operationArguments.map(resolveArgument));
      break;
    }
  }
  const ownTree = (node: GPUDataEvaluator): void => {
    if (owned.has(node)) return;
    owned.add(node);
    if (node.source instanceof GPUDataEvaluator) ownTree(node.source);
    else for (const dependency of node.source?.dependencies ?? []) ownTree(dependency);
  };
  ownTree(evaluator);
  cache.set(value, evaluator);
  return evaluator;
}
