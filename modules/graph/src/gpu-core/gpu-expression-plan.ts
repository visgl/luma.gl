// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUGraphState, type GPUGraphStateBindings} from './gpu-graph-state';
import {allocateVector, validateVector, validateWritableTarget} from './gpu-graph-vector-utils';
import type {GPUGraph} from './gpu-graph';
import {resolveGPUGraphDeclarations} from './gpu-graph-declarations';
import {GPUGraphVector, type GPUGraphScalar, type GPUGraphVectorFormat} from './gpu-graph-value';
import {GPUCompositeOperation, isGPUOperation, type GPUGraphOperation} from './gpu-operation';
import {GPULoopOperation} from './gpu-control-flow-operation';
import {
  GPUExpressionOperation,
  parseGPUExpression,
  getGPUExpressionReferences,
  type GPUExpression,
  type GPUExpressionRowFormat,
  isGPUExpressionRowFormat,
  getGPUExpressionFormat
} from './gpu-expression-operation';

import type {GPUOperationLowering} from './gpu-graph-lowering';
import {
  getGPUOperationValueName,
  validateGPUOperationContract,
  type GPUOperationContract
} from './gpu-operation-contract';

export type GPUGraphRunBindings = Readonly<Record<string, GPUVector | number>>;
export type GPUGraphExecutionBindings = {
  inputs?: GPUGraphRunBindings;
  state?: GPUGraphStateBindings | GPUGraphState;
  outputTargets?: Readonly<Record<string, GPUVector>>;
};
export type GPUGraphCompileOptions = {
  outputs?: readonly string[];
  lowerings?: readonly GPUOperationLowering[];
};
export type GPUGraphRunOptions = {outputTargets?: Readonly<Record<string, GPUVector>>};

/** @internal */
export type GPUExpressionPlan = {
  operation: GPUExpressionOperation;
  expression: GPUExpression;
  format: GPUExpressionRowFormat;
  formats: ReadonlyMap<string, GPUExpressionRowFormat>;
  references: readonly string[];
  gpuScalarInputs: readonly string[];
};

/** CPU-known dimensions for an unallocated operation result. @internal */
export type GPUExpressionVectorShape = {
  length: number;
  chunkLengths: readonly number[];
};

/** Snapshot of declarations and checked expressions; contains no bound resources. @internal */
export class GPUExpressionProgram {
  private readonly contracts = new Map<GPUGraphOperation, GPUOperationContract>();
  private readonly resultNames: ReadonlySet<string>;
  readonly expressions: readonly GPUExpressionPlan[];
  readonly operations: readonly GPUGraphOperation[];
  readonly outputs: readonly string[];
  readonly scalars: readonly GPUGraphScalar[];
  readonly vectors: readonly GPUGraphVector[];

  constructor(program: GPUGraph, options: GPUGraphCompileOptions = {}) {
    program = resolveGPUGraphDeclarations(program);
    this.scalars = program.scalars;
    this.vectors = program.vectors;
    const operations: GPUGraphOperation[] = [];
    const flatten = (operation: GPUGraphOperation): void => {
      if (operation instanceof GPUCompositeOperation && operation.type === 'composite')
        operation.operations.forEach(flatten);
      else {
        if (operation instanceof GPUCompositeOperation) {
          const containsExpression = (child: GPUGraphOperation): boolean =>
            child instanceof GPUExpressionOperation ||
            (child instanceof GPUCompositeOperation && child.operations.some(containsExpression));
          if (operation.operations.some(containsExpression))
            throw new Error('Expression operations inside control flow are not supported');
        }
        operations.push(operation);
      }
    };
    program.operations.forEach(flatten);
    this.operations = operations;
    const declarations = new Map(
      [...this.scalars, ...this.vectors].map(value => [value.id, value])
    );
    const expressions = operations.filter(
      (operation): operation is GPUExpressionOperation =>
        operation instanceof GPUExpressionOperation
    );
    const scalarProducers = new Set<string>();
    const precedingScalarProducers = new Map<GPUExpressionOperation, ReadonlySet<string>>();
    for (const operation of operations) {
      if (operation instanceof GPUExpressionOperation)
        precedingScalarProducers.set(operation, new Set(scalarProducers));
      if (!isGPUOperation(operation)) continue;
      try {
        const contract = getPlanningContract(operation, this.scalars);
        if (!contract) continue;
        validateGPUOperationContract(program, contract);
        this.contracts.set(operation, contract);
        for (const use of contract.values) {
          const name = getGPUOperationValueName(use.value);
          if (use.access !== 'read' && this.scalars.some(value => value.id === name))
            scalarProducers.add(name);
        }
      } catch (error) {
        throw new Error(
          `${operation.id}: ${error instanceof Error ? error.message : String(error)}`,
          {cause: error}
        );
      }
    }
    const producers = new Set<string>();
    for (const operation of expressions) {
      if (producers.has(operation.output))
        throw new Error(`Multiple expression writers for ${operation.output}`);
      producers.add(operation.output);
    }
    // Non-expression values may be initialized by execution bindings, even if overwritten later.
    // Expression outputs remain single-assignment values with compile-time producer ordering.
    const available = new Set(
      [...declarations.keys()].filter(
        name => !producers.has(name) && declarations.get(name)?.role !== 'value'
      )
    );
    const expressionPlans: GPUExpressionPlan[] = [];
    for (const operation of operations) {
      const contract = this.contracts.get(operation);
      if (!(operation instanceof GPUExpressionOperation)) {
        for (const use of contract?.values ?? []) {
          const name = getGPUOperationValueName(use.value);
          if (use.access !== 'write' && !available.has(name))
            throw new Error(
              `${'id' in operation ? operation.id : 'Operation'}: Reads ${name} before it is produced`
            );
        }
        for (const use of contract?.values ?? [])
          if (use.access !== 'read') available.add(getGPUOperationValueName(use.value));
        continue;
      }
      try {
        const output = declarations.get(operation.output);
        if (!output || !isGPUExpressionRowFormat(output.format))
          throw new Error(
            `Expression output ${operation.output} must declare a 32-bit numeric row of width 1–4`
          );
        const expression = parseGPUExpression(operation.expression);
        const references = getGPUExpressionReferences(expression);
        if (references.includes(operation.output))
          throw new Error(`Reads ${operation.output} before it is produced`);
        const formats = new Map<string, GPUExpressionRowFormat>();
        for (const name of references) {
          const declaration = declarations.get(name);
          if (!declaration || !isGPUExpressionRowFormat(declaration.format))
            throw new Error(
              `Expression input ${name} must declare a 32-bit numeric row of width 1–4`
            );
          formats.set(name, declaration.format);
          if (!available.has(name)) throw new Error(`Reads ${name} before it is produced`);
        }
        if (
          this.scalars.some(scalar => scalar.id === output.id) &&
          references.some(name => this.vectors.some(vector => vector.id === name))
        )
          throw new Error(`Vector expression cannot write scalar ${operation.output}`);
        if (
          this.vectors.some(vector => vector.id === operation.output) &&
          !references.some(name => this.vectors.some(vector => vector.id === name)) &&
          !(
            output instanceof GPUGraphVector &&
            output.role === 'value' &&
            output.length !== undefined
          )
        )
          throw new Error(
            `Vector expression ${operation.output} requires a vector input to determine its shape`
          );
        const format = getGPUExpressionFormat(expression, formats);
        if (output.format !== format)
          throw new Error('Expression result type must match its output declaration');
        available.add(operation.output);
        const gpuScalarInputs = references.filter(name =>
          precedingScalarProducers.get(operation)!.has(name)
        );
        expressionPlans.push({operation, expression, format, formats, references, gpuScalarInputs});
      } catch (error) {
        if (error instanceof Error)
          throw new Error(`${operation.id}: ${error.message}`, {cause: error});
        throw error;
      }
    }
    this.expressions = expressionPlans;
    const producedValues = [...declarations.values()].filter(value => value.role === 'value');
    this.resultNames = new Set(
      [...this.contracts.values()]
        .flatMap(contract =>
          contract.values
            .filter(use => use.access !== 'read')
            .map(use => getGPUOperationValueName(use.value))
        )
        .filter(
          name =>
            declarations.get(name)?.role !== 'input' && declarations.get(name)?.role !== 'state'
        )
    );
    const consumed = new Set(
      [...this.contracts.values()].flatMap(contract =>
        contract.values
          .filter(use => use.access !== 'write')
          .map(use => getGPUOperationValueName(use.value))
      )
    );
    this.outputs = [
      ...(options.outputs ??
        (producedValues.length
          ? [...this.resultNames].filter(name => !consumed.has(name))
          : expressions.map(operation => operation.output)))
    ];
    for (const name of this.outputs) {
      if (!declarations.has(name)) throw new Error(`Undeclared output ${name}`);
      if (
        this.scalars.some(scalar => scalar.id === name) &&
        !producers.has(name) &&
        !scalarProducers.has(name)
      )
        throw new Error(`Selected scalar ${name} must be produced by a graph operation`);
    }
  }

  resolveBindings(
    supplied: GPUGraphRunBindings | GPUGraphExecutionBindings,
    options: GPUGraphRunOptions = {}
  ): {bindings: GPUGraphRunBindings; options: GPUGraphRunOptions} {
    const declarations = [...this.scalars, ...this.vectors];
    const explicit = declarations.some(value => value.role === 'input' || value.role === 'state');
    const grouped =
      explicit ||
      Object.values(supplied).some(
        value => value !== undefined && typeof value === 'object' && !(value instanceof GPUVector)
      );
    if (!grouped) {
      for (const name of Object.keys(supplied))
        if (declarations.find(value => value.id === name)?.role === 'value')
          throw new Error(`Use outputTargets for graph result ${name}`);
      return {bindings: supplied as GPUGraphRunBindings, options};
    }
    for (const name of Object.keys(supplied))
      if (!['inputs', 'state', 'outputTargets'].includes(name))
        throw new Error(`Unknown execution option ${name}`);
    const execution = supplied as GPUGraphExecutionBindings;
    const bindings: Record<string, GPUVector | number> = Object.create(null);
    for (const [role, group] of [
      ['input', execution.inputs],
      [
        'state',
        execution.state instanceof GPUGraphState
          ? execution.state.getBindings(this)
          : execution.state
      ]
    ] as const) {
      for (const [name, value] of Object.entries(group ?? {})) {
        const declaration = declarations.find(value => value.id === name);
        const bindingRole = declaration?.role ?? (this.resultNames.has(name) ? 'value' : 'input');
        if (!declaration || bindingRole !== role)
          throw new Error(`Invalid ${role} binding ${name}`);
        bindings[name] = value;
      }
    }
    for (const declaration of declarations)
      if (
        (declaration.role === 'input' || declaration.role === 'state') &&
        bindings[declaration.id] === undefined
      )
        throw new Error(`Missing ${declaration.role} binding ${declaration.id}`);
    if (options.outputTargets && execution.outputTargets)
      throw new Error('Duplicate output targets');
    const outputTargets = execution.outputTargets ?? options.outputTargets;
    for (const name of Object.keys(outputTargets ?? {}))
      if (!this.resultNames.has(name) || !this.outputs.includes(name))
        throw new Error(`Invalid graph output target ${name}`);
    return {bindings, options: {outputTargets}};
  }

  prepare(
    device: Device,
    bindings: GPUGraphRunBindings,
    options: GPUGraphRunOptions = {},
    deferIntermediateStorage = false
  ): GPUExpressionInvocation {
    const values = new Map<string, GPUVector | number>();
    const owned = new Set<GPUVector>();
    const transientVectors = new Map<string, GPUExpressionVectorShape>();
    // Keep legacy declarations and control-flow allocation behavior unchanged.
    const deferStorage =
      deferIntermediateStorage &&
      !this.operations.some(operation => operation instanceof GPUCompositeOperation);
    const getShape = (name: string): GPUExpressionVectorShape | undefined => {
      const value = values.get(name);
      return value instanceof GPUVector
        ? {length: value.length, chunkLengths: value.data.map(chunk => chunk.length)}
        : transientVectors.get(name);
    };
    const allocateOutput = (
      name: string,
      chunkLengths: readonly number[],
      format: GPUGraphVectorFormat
    ): void => {
      if (
        deferStorage &&
        !this.outputs.includes(name) &&
        this.vectors.some(vector => vector.id === name && vector.role === 'value')
      ) {
        transientVectors.set(name, {
          length: chunkLengths.reduce((sum, count) => sum + count, 0),
          chunkLengths
        });
      } else {
        const output = allocateVector(device, name, chunkLengths, format);
        owned.add(output);
        values.set(name, output);
      }
    };
    const produced = new Set(this.expressions.map(plan => plan.operation.output));
    const targets = new Map(Object.entries(options.outputTargets ?? {}));
    const writableVectors = new Set(
      [...this.contracts.values()].flatMap(contract =>
        contract.values
          .filter(
            use =>
              use.access !== 'read' &&
              this.vectors.some(vector => vector.id === getGPUOperationValueName(use.value))
          )
          .map(use => getGPUOperationValueName(use.value))
      )
    );
    const availableScalars = new Set<string>();
    const readVectors = new Set<string>();
    try {
      for (const [name, binding] of Object.entries(bindings)) {
        if (produced.has(name)) throw new Error(`Use outputTargets for expression output ${name}`);
        const scalar = this.scalars.find(value => value.id === name);
        const vector = this.vectors.find(value => value.id === name);
        if (scalar) {
          if (typeof binding !== 'number' || !Number.isFinite(binding))
            throw new Error(`Expected numeric scalar ${name}`);
          if (
            scalar.format !== 'float32' &&
            (!Number.isInteger(binding) ||
              binding < (scalar.format === 'uint32' ? 0 : -2147483648) ||
              binding > (scalar.format === 'uint32' ? 4294967295 : 2147483647))
          )
            throw new Error(`Scalar ${name} is outside its declared integer format`);
        } else if (vector) {
          if (!(binding instanceof GPUVector)) throw new Error(`Expected GPUVector ${name}`);
          validateVector(device, binding, vector.format, vector.length, vector.chunkLengths);
        } else throw new Error(`Undeclared binding ${name}`);
        values.set(name, binding);
      }
      for (const operation of this.operations) {
        for (const use of this.contracts.get(operation)?.values ?? []) {
          const name = getGPUOperationValueName(use.value);
          if (use.access !== 'write' && values.get(name) instanceof GPUVector)
            readVectors.add(name);
        }
        if (!(operation instanceof GPUExpressionOperation)) {
          const contract = this.contracts.get(operation);
          for (const use of contract?.values ?? []) {
            const name = getGPUOperationValueName(use.value);
            if (
              use.access !== 'write' &&
              !values.has(name) &&
              !transientVectors.has(name) &&
              !availableScalars.has(name)
            )
              throw new Error(
                `Missing ${use.access === 'read-write' ? 'read-write' : 'execution'} binding ${name}`
              );
          }
          for (const use of contract?.values ?? []) {
            const name = getGPUOperationValueName(use.value);
            if (use.access !== 'read' && this.scalars.some(scalar => scalar.id === name))
              availableScalars.add(name);
          }
          for (const feature of contract?.requiredFeatures ?? [])
            if (!device.features.has(feature)) throw new Error(`Operation requires ${feature}`);
          for (const use of contract?.values ?? []) {
            if (use.access === 'read') continue;
            const declaration = this.vectors.find(
              vector => vector.id === getGPUOperationValueName(use.value)
            );
            if (!declaration) continue;
            const existing = values.get(declaration.id);
            const target =
              targets.get(declaration.id) ?? (existing instanceof GPUVector ? existing : undefined);
            const shape = use.shape;
            const template =
              shape && 'like' in shape ? getShape(getGPUOperationValueName(shape.like)) : undefined;
            if (shape && 'like' in shape && !template)
              throw new Error(`Missing shape input ${getGPUOperationValueName(shape.like)}`);
            const chunks = template
              ? template.chunkLengths
              : shape && 'length' in shape
                ? (shape.chunkLengths ?? declaration.chunkLengths ?? [shape.length])
                : (declaration.chunkLengths ??
                  (declaration.length === undefined ? undefined : [declaration.length]));
            if (use.access === 'read-write' && !(existing instanceof GPUVector))
              throw new Error(`Missing read-write binding ${declaration.id}`);
            if (use.access === 'read-write' && target !== existing)
              throw new Error(`Read-write target must use its bound storage: ${declaration.id}`);
            if (readVectors.has(declaration.id) && target !== existing)
              throw new Error(`Output target replaces an earlier read: ${declaration.id}`);
            if (!target && !chunks)
              throw new Error(`Cannot infer length of produced vector ${declaration.id}`);
            const length = chunks?.reduce((total, count) => total + count, 0) ?? target!.length;
            if (
              (declaration.length !== undefined && declaration.length !== length) ||
              (shape && 'length' in shape && shape.length !== length)
            )
              throw new Error(`Length constraint failed for ${declaration.id}`);
            if (
              declaration.chunkLengths &&
              chunks &&
              (declaration.chunkLengths.length !== chunks.length ||
                declaration.chunkLengths.some((count, index) => count !== chunks[index]))
            )
              throw new Error(`Chunk constraint failed for ${declaration.id}`);
            if (target) {
              validateVector(device, target, declaration.format, length, chunks);
              validateWritableTarget(declaration.id, target, values);
              values.set(declaration.id, target);
            } else {
              allocateOutput(declaration.id, chunks!, declaration.format);
            }
          }
          continue;
        }
        const plan = this.expressions.find(expression => expression.operation === operation)!;
        const vectorInputs: GPUExpressionVectorShape[] = [];
        for (const name of plan.references) {
          const value = values.get(name);
          if (
            value === undefined &&
            !transientVectors.has(name) &&
            !plan.gpuScalarInputs.includes(name)
          )
            throw new Error(`Missing execution binding ${name}`);
          const shape = getShape(name);
          if (shape && this.vectors.some(vector => vector.id === name)) vectorInputs.push(shape);
        }
        const declaration = this.vectors.find(value => value.id === plan.operation.output);
        const template = vectorInputs[0];
        const chunkLengths = declaration
          ? (template?.chunkLengths ??
            declaration.chunkLengths ??
            (declaration.length === undefined ? undefined : [declaration.length]))
          : [1];
        if (!chunkLengths) throw new Error(`Cannot infer length of ${plan.operation.output}`);
        for (const vector of vectorInputs) {
          if (
            vector.chunkLengths.length !== chunkLengths.length ||
            vector.chunkLengths.some((length, index) => length !== chunkLengths[index])
          )
            throw new Error(
              `Expression ${plan.operation.id} requires matching vector chunk boundaries`
            );
        }
        const length = chunkLengths.reduce((total, count) => total + count, 0);
        if (declaration?.length !== undefined && declaration.length !== length)
          throw new Error(`Length constraint failed for ${declaration.id}`);
        if (
          declaration?.chunkLengths &&
          (declaration.chunkLengths.length !== chunkLengths.length ||
            declaration.chunkLengths.some((count, index) => count !== chunkLengths[index]))
        )
          throw new Error(`Chunk constraint failed for ${declaration.id}`);
        const target = targets.get(plan.operation.output);
        if (target) {
          validateVector(device, target, plan.format, length, chunkLengths);
          validateWritableTarget(plan.operation.output, target, values);
          values.set(plan.operation.output, target);
        } else {
          allocateOutput(plan.operation.output, chunkLengths, plan.format);
        }
      }
      for (const name of Object.keys(options.outputTargets ?? {})) {
        const scalarOutput =
          this.outputs.includes(name) && this.scalars.some(scalar => scalar.id === name);
        if (!produced.has(name) && !writableVectors.has(name) && !scalarOutput)
          throw new Error(`Unknown graph output target ${name}`);
      }
      for (const name of this.outputs) {
        if (
          !(values.get(name) instanceof GPUVector) &&
          this.scalars.some(scalar => scalar.id === name)
        ) {
          const target = targets.get(name);
          if (target) {
            validateVector(
              device,
              target,
              this.scalars.find(scalar => scalar.id === name)!.format,
              1,
              [1]
            );
            validateWritableTarget(name, target, values);
            values.set(name, target);
            continue;
          }
          const output = allocateVector(
            device,
            name,
            [1],
            this.scalars.find(scalar => scalar.id === name)!.format
          );
          owned.add(output);
          values.set(name, output);
        }
      }
      return new GPUExpressionInvocation(this, values, owned, transientVectors);
    } catch (error) {
      for (const vector of owned) vector.destroy();
      throw error;
    }
  }
}

/** Fixed-count loops guarantee scalar writes; conditional bodies do not. */
function getPlanningContract(
  operation: GPUGraphOperation,
  scalars: readonly GPUGraphScalar[]
): GPUOperationContract | undefined {
  if (
    operation instanceof GPUCompositeOperation &&
    (operation.type === 'composite' ||
      (operation instanceof GPULoopOperation && !operation.predicate))
  ) {
    const reads = new Set<string>();
    const writes = new Set<string>();
    for (const child of operation.operations) {
      const uses = (getPlanningContract(child, scalars)?.values ?? []).filter(use =>
        scalars.some(scalar => scalar.id === getGPUOperationValueName(use.value))
      );
      // Reads within one operation precede its writes, regardless of descriptor ordering.
      for (const use of uses) {
        const name = getGPUOperationValueName(use.value);
        if (use.access !== 'write' && !writes.has(name)) reads.add(name);
      }
      for (const use of uses)
        if (use.access !== 'read') writes.add(getGPUOperationValueName(use.value));
    }
    return {
      values: [...new Set([...reads, ...writes])].map(value => ({
        value,
        access: reads.has(value) ? (writes.has(value) ? 'read-write' : 'read') : 'write'
      }))
    };
  }
  return isGPUOperation(operation) ? operation.contract : undefined;
}

/** Per-run owned storage; selected outputs transfer to the caller after successful execution. @internal */
export class GPUExpressionInvocation {
  constructor(
    readonly program: GPUExpressionProgram,
    readonly values: Map<string, GPUVector | number>,
    private readonly owned: Set<GPUVector>,
    readonly transientVectors: ReadonlyMap<string, GPUExpressionVectorShape> = new Map()
  ) {}
  getOutputs(): Record<string, GPUVector> {
    const outputs: Record<string, GPUVector> = Object.create(null);
    for (const name of this.program.outputs) {
      const value = this.values.get(name);
      if (!(value instanceof GPUVector))
        throw new Error(`Output ${name} has no materialized vector`);
      outputs[name] = value;
    }
    return outputs;
  }
  finish(): Record<string, GPUVector> {
    const outputs = this.getOutputs();
    for (const value of Object.values(outputs)) this.owned.delete(value);
    this.destroy();
    return outputs;
  }
  destroy(): void {
    for (const vector of this.owned) vector.destroy();
    this.owned.clear();
  }
}
