// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUOperationContract} from './gpu-operation-contract';
import type {GPUOperation, GPUOperationMetadata} from './gpu-operation';
import type {GPUGraphScalar} from './gpu-graph-value';
import type {
  GPUScalarArithmeticOperation,
  GPUScalarComparisonOperation,
  GPUScalarOperation
} from './gpu-scalar-operation';

/** Backend-independent scalar arithmetic/comparison in a GPUGraph. */
export class GPUGraphScalarOperation implements GPUOperation {
  get contract(): GPUOperationContract {
    return {
      values: [
        {value: this.left, access: 'read'},
        ...(this.right ? [{value: this.right, access: 'read' as const}] : []),
        {value: this.output, access: 'write'}
      ]
    };
  }
  readonly id: string;
  readonly type = 'scalar-operation';
  readonly operation: GPUScalarOperation;
  readonly left: GPUGraphScalar;
  readonly right?: GPUGraphScalar;
  readonly output: GPUGraphScalar;
  readonly metadata: GPUOperationMetadata;

  constructor(props: {
    id?: string;
    operation: GPUScalarOperation;
    left: GPUGraphScalar;
    right?: GPUGraphScalar;
    output: GPUGraphScalar;
  }) {
    this.id = props.id ?? `gpu-scalar-${props.operation}`;
    this.operation = props.operation;
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    validateScalarOperation(this);
    this.metadata = Object.freeze({
      inputs: Object.freeze([
        {name: 'left', kind: 'scalar', format: this.left.format},
        ...(this.right ? [{name: 'right', kind: 'scalar', format: this.right.format}] : [])
      ]),
      outputs: Object.freeze([{name: 'output', kind: 'scalar', format: this.output.format}]),
      workload: Object.freeze({scalarOperations: 1})
    });
  }
}

export function scalarArithmetic(props: {
  id?: string;
  operation: GPUScalarArithmeticOperation;
  left: GPUGraphScalar;
  right?: GPUGraphScalar;
  output: GPUGraphScalar;
}): GPUGraphScalarOperation {
  return new GPUGraphScalarOperation(props);
}

export function scalarCompare(props: {
  id?: string;
  operation: GPUScalarComparisonOperation;
  left: GPUGraphScalar;
  right: GPUGraphScalar;
  output: GPUGraphScalar<'uint32'>;
}): GPUGraphScalarOperation {
  return new GPUGraphScalarOperation(props);
}

function validateScalarOperation(operation: GPUGraphScalarOperation): void {
  const unary = operation.operation === 'copy' || operation.operation === 'sqrt';
  const comparison = isComparison(operation.operation);
  if (!unary && !operation.right) {
    throw new Error(`${operation.id} ${operation.operation} requires a right operand`);
  }
  if (unary && operation.right) {
    throw new Error(`${operation.id} ${operation.operation} does not accept a right operand`);
  }
  if (operation.right && operation.right.format !== operation.left.format) {
    throw new Error(`${operation.id} input scalar formats must match`);
  }
  if (operation.operation === 'sqrt' && operation.left.format !== 'float32') {
    throw new Error(`${operation.id} sqrt currently requires float32 input`);
  }
  if (comparison) {
    if (operation.output.format !== 'uint32') {
      throw new Error(`${operation.id} comparison output must be uint32`);
    }
  } else if (operation.output.format !== operation.left.format) {
    throw new Error(`${operation.id} arithmetic output format must match input format`);
  }
}

function isComparison(operation: GPUScalarOperation): operation is GPUScalarComparisonOperation {
  return [
    'equal',
    'not-equal',
    'less-than',
    'less-than-or-equal',
    'greater-than',
    'greater-than-or-equal'
  ].includes(operation as GPUScalarComparisonOperation);
}
