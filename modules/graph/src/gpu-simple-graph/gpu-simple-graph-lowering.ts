// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {
  GPUDataEvaluator,
  GPUVectorEvaluator,
  add,
  subtract,
  multiply,
  divide,
  sqrt
} from '@luma.gl/gpgpu';
import {
  GPUGraphScalarLiteral,
  GPUGraphScalarOperation,
  GPUGraphVectorMADD,
  type GPUGraphBindings,
  type GPUGraphVector
} from '@luma.gl/graph/gpu-core';
import {
  GPUSimpleGraphUploadOperation,
  GPUSimpleGraphCopyOperation,
  makeCopyEvaluator
} from './gpu-simple-graph-transfer';
import {GPUSimpleGraphOperation} from './gpu-simple-graph-operation';

import {
  GPUSimpleGraphValue,
  GPUSimpleGraphValueOperation,
  lowerSimpleGraphValue
} from './gpu-simple-graph-value';

export type SimpleOperation =
  | GPUSimpleGraphValueOperation
  | GPUSimpleGraphOperation
  | GPUSimpleGraphUploadOperation
  | GPUSimpleGraphCopyOperation
  | GPUGraphScalarOperation
  | GPUGraphScalarLiteral
  | GPUGraphVectorMADD;

/** Compilation-local adapter; existing semantic operations and bindings are borrowed. */
export class SimpleGraphLowering {
  readonly owned = new Set<GPUDataEvaluator | GPUVectorEvaluator>();
  readonly outputs = new Map<string, GPUSimpleGraphOperation>();
  readonly inputs = new Map<string, GPUDataEvaluator | GPUVectorEvaluator>();
  private readonly graphValues = new Map<GPUSimpleGraphValue, GPUDataEvaluator>();
  private readonly scalars = new Map<object, GPUDataEvaluator>();
  private readonly vectors = new Map<object, GPUVectorEvaluator>();
  private readonly values = new Map<string, object>();

  constructor(private readonly bindings: GPUGraphBindings) {}

  lower(operation: SimpleOperation): void {
    if (operation instanceof GPUSimpleGraphValueOperation) {
      const value = operation.props.value;
      const lower = (chunk: GPUSimpleGraphValue) =>
        lowerSimpleGraphValue(chunk, this.graphValues, this.owned);
      const evaluator =
        value instanceof GPUSimpleGraphValue
          ? lower(value)
          : GPUVectorEvaluator.fromGPUDataEvaluators(value.map(lower));
      this.owned.add(evaluator);
      this.registerOutput(operation.id, evaluator);
    } else if (operation instanceof GPUSimpleGraphOperation) {
      this.registerOutput(operation.id, operation.evaluator);
    } else if (operation instanceof GPUSimpleGraphUploadOperation) {
      const evaluator = this.own(GPUDataEvaluator.fromArray(operation.props.data, operation.props));
      this.registerOutput(operation.id, evaluator);
    } else if (operation instanceof GPUSimpleGraphCopyOperation) {
      const source = this.outputs.get(operation.props.input);
      // Named copy inputs must precede their consumers.
      assert(source);
      this.registerOutput(operation.id, makeCopyEvaluator(source.evaluator, this.owned));
    } else if (operation instanceof GPUGraphScalarLiteral) {
      const {output, value} = operation.props;
      this.registerValue(output);
      // The initial portable subset supports float32, single-assignment values only.
      assert(output.format === 'float32' && !this.scalars.has(output));
      const evaluator = this.own(GPUDataEvaluator.fromConstant(value));
      this.scalars.set(output, evaluator);
      this.registerOutput(output.id, evaluator);
    } else if (operation instanceof GPUGraphScalarOperation) {
      this.lowerScalar(operation);
    } else {
      const {input, scale, addend, output} = operation.props;
      const source = this.resolveVector(input);
      const addition = this.resolveVector(addend);
      this.registerValue(scale);
      this.registerValue(output);
      const scalar = this.scalars.get(scale);
      // Scalars must be defined before use; output storage is internal and single-assignment.
      assert(
        scalar && output.format === 'float32' && !output.external && !this.vectors.has(output)
      );
      const sourceChunks = source.gpuDataEvaluators;
      const additionChunks = addition.gpuDataEvaluators;
      // Preserve physical chunks; implicit repacking is outside this subset.
      assert(sourceChunks.length === additionChunks.length);
      assert(sourceChunks.every((chunk, index) => chunk.length === additionChunks[index].length));
      assert(output.length === source.length && output.length === addition.length);
      assert(
        !output.chunkLengths ||
          (output.chunkLengths.length === sourceChunks.length &&
            output.chunkLengths.every((length, index) => length === sourceChunks[index].length))
      );
      const chunks = sourceChunks.map((chunk, index) => {
        const product = this.own(multiply(chunk, scalar));
        return this.own(add(product, additionChunks[index]));
      });
      const evaluator = GPUVectorEvaluator.fromGPUDataEvaluators(chunks, {
        id: output.id,
        format: 'float32'
      });
      this.owned.add(evaluator);
      this.vectors.set(output, evaluator);
      this.registerOutput(output.id, evaluator);
    }
  }

  private lowerScalar(operation: GPUGraphScalarOperation): void {
    const {left, right, output} = operation;
    this.registerValue(left);
    if (right) this.registerValue(right);
    this.registerValue(output);
    const leftEvaluator = this.scalars.get(left);
    const rightEvaluator = right && this.scalars.get(right);
    // Scalar operands must already be defined; this subset uses float32 single-assignment values.
    assert(
      left.format === 'float32' &&
        output.format === 'float32' &&
        leftEvaluator &&
        !this.scalars.has(output)
    );
    assert(!right || (right.format === 'float32' && rightEvaluator));
    let evaluator: GPUDataEvaluator;
    switch (operation.operation) {
      case 'copy':
        evaluator = new GPUDataEvaluator({
          source: leftEvaluator,
          type: 'float32',
          size: 1,
          isConstant: leftEvaluator.isConstant
        });
        break;
      case 'sqrt':
        evaluator = sqrt(leftEvaluator);
        break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide': {
        // Binary operations require both initialized operands.
        assert(rightEvaluator);
        const operations = {add, subtract, multiply, divide};
        evaluator = operations[operation.operation](leftEvaluator, rightEvaluator);
        break;
      }
      default:
        // Comparisons, integer arithmetic, min and max are outside the current semantic subset.
        assert(false);
    }
    // An alias prevents expression merging across semantic operations, preserving float32 rounding.
    const result = this.own(
      new GPUDataEvaluator({
        source: this.own(evaluator),
        type: 'float32',
        size: 1,
        isConstant: evaluator.isConstant
      })
    );
    this.scalars.set(output, result);
    this.registerOutput(output.id, result);
  }

  destroy(): void {
    for (const evaluator of this.owned) evaluator.destroy();
    this.owned.clear();
  }

  private own(evaluator: GPUDataEvaluator): GPUDataEvaluator {
    this.owned.add(evaluator);
    return evaluator;
  }

  private registerValue(value: {id: string}): void {
    // Distinct logical values cannot share an identifier.
    assert(!this.values.has(value.id) || this.values.get(value.id) === value);
    this.values.set(value.id, value);
  }

  private registerOutput(id: string, evaluator: GPUSimpleGraphOperation['evaluator']): void {
    // Semantic output IDs and explicitly wrapped evaluator IDs share one namespace.
    assert(!this.outputs.has(id));
    this.outputs.set(id, new GPUSimpleGraphOperation({id, evaluator}));
    const chunks =
      evaluator instanceof GPUVectorEvaluator ? evaluator.gpuDataEvaluators : [evaluator];
    if (chunks.every(chunk => !chunk.source)) this.registerInput(id, evaluator);
  }

  private registerInput(id: string, evaluator: GPUDataEvaluator | GPUVectorEvaluator): void {
    // An invalidation name must identify exactly one input, including semantic vector bindings.
    assert(!this.inputs.has(id) || this.inputs.get(id) === evaluator);
    this.inputs.set(id, evaluator);
  }

  private resolveVector(vector: GPUGraphVector<'float32'>): GPUVectorEvaluator {
    this.registerValue(vector);
    const existing = this.vectors.get(vector);
    if (existing) return existing;
    const binding = this.bindings.vectors?.[vector.id];
    // Unwritten internal values and missing or unsupported bindings are invalid.
    assert(vector.external && vector.format === 'float32' && binding);
    const data = 'data' in binding ? binding.data : 'buffer' in binding ? [binding] : binding;
    assert(data.length > 0 && data.every(chunk => chunk.format === vector.format));
    assert(data.reduce((length, chunk) => length + chunk.length, 0) === vector.length);
    if ('data' in binding) {
      assert(!binding.bufferLayout && binding.length === vector.length);
      assert(!binding.format || binding.format === vector.format);
    }
    assert(
      !vector.chunkLengths ||
        (vector.chunkLengths.length === data.length &&
          vector.chunkLengths.every((length, index) => length === data[index].length))
    );
    const evaluator = GPUVectorEvaluator.fromGPUDataEvaluators(
      data.map(chunk => this.own(GPUDataEvaluator.fromGPUData(chunk))),
      {id: vector.id, format: vector.format}
    );
    this.owned.add(evaluator);
    this.vectors.set(vector, evaluator);
    this.registerInput(vector.id, evaluator);
    return evaluator;
  }
}
