// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {GPUGraph} from './gpu-graph';
import {GPUGraphVector, type GPUGraphScalar, type GPUGraphVectorFormat} from './gpu-graph-value';
import {GPUCompositeOperation, isGPUOperation, type GPUGraphOperation} from './gpu-operation';
import {
  GPUExpressionOperation,
  parseGPUExpression,
  getGPUExpressionReferences,
  type GPUExpression,
  type GPUExpressionRowFormat,
  isGPUExpressionRowFormat,
  getGPUExpressionRowInfo,
  getGPUExpressionFormat
} from './gpu-expression-operation';

import type {GPUOperationLoweringRegistry} from './gpu-graph-lowering';
import {
  getGPUOperationValueName,
  validateGPUOperationContract,
  type GPUOperationContract
} from './gpu-operation-contract';

export type GPUGraphRunBindings = Readonly<Record<string, GPUVector | number>>;
export type GPUGraphCompileOptions = {
  outputs?: readonly string[];
  lowerings?: GPUOperationLoweringRegistry;
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

/** Snapshot of declarations and checked expressions; contains no bound resources. @internal */
export class GPUExpressionProgram {
  private readonly contracts = new Map<GPUGraphOperation, GPUOperationContract>();
  readonly expressions: readonly GPUExpressionPlan[];
  readonly operations: readonly GPUGraphOperation[];
  readonly outputs: readonly string[];
  readonly scalars: readonly GPUGraphScalar[];
  readonly vectors: readonly GPUGraphVector[];

  constructor(program: GPUGraph, options: GPUGraphCompileOptions = {}) {
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
        const contract = operation.contract;
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
    const written = new Set<string>();
    const readWrite = new Set<string>();
    for (const contract of this.contracts.values()) {
      for (const use of contract.values) {
        const name = getGPUOperationValueName(use.value);
        if (use.access !== 'read') written.add(name);
        if (
          !producers.has(name) &&
          use.access !== 'read' &&
          contract.values.some(
            input => input.access !== 'write' && getGPUOperationValueName(input.value) === name
          )
        )
          readWrite.add(name);
      }
    }
    const available = new Set(
      [...declarations.keys()].filter(name => !written.has(name) || readWrite.has(name))
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
          !references.some(name => this.vectors.some(vector => vector.id === name))
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
    this.outputs = [...(options.outputs ?? expressions.map(operation => operation.output))];
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

  prepare(
    device: Device,
    bindings: GPUGraphRunBindings,
    options: GPUGraphRunOptions = {}
  ): GPUExpressionInvocation {
    const values = new Map<string, GPUVector | number>();
    const owned = new Set<GPUVector>();
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
        if (!(operation instanceof GPUExpressionOperation)) {
          const contract = this.contracts.get(operation);
          for (const use of contract?.values ?? []) {
            const name = getGPUOperationValueName(use.value);
            if (use.access !== 'write' && !values.has(name) && !availableScalars.has(name))
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
              shape && 'like' in shape
                ? values.get(getGPUOperationValueName(shape.like))
                : undefined;
            if (shape && 'like' in shape && !(template instanceof GPUVector))
              throw new Error(`Missing shape input ${getGPUOperationValueName(shape.like)}`);
            const chunks =
              template instanceof GPUVector
                ? template.data.map(chunk => chunk.length)
                : shape && 'length' in shape
                  ? (shape.chunkLengths ?? declaration.chunkLengths ?? [shape.length])
                  : (declaration.chunkLengths ??
                    (declaration.length === undefined ? undefined : [declaration.length]));
            if (use.access === 'read-write' && !(existing instanceof GPUVector))
              throw new Error(`Missing read-write binding ${declaration.id}`);
            if (use.access === 'read-write' && target !== existing)
              throw new Error(`Read-write target must use its bound storage: ${declaration.id}`);
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
              const output = allocateVector(device, declaration.id, chunks!, declaration.format);
              owned.add(output);
              values.set(declaration.id, output);
            }
          }
          continue;
        }
        const plan = this.expressions.find(expression => expression.operation === operation)!;
        const vectorInputs: GPUVector[] = [];
        for (const name of plan.references) {
          const value = values.get(name);
          if (value === undefined && !plan.gpuScalarInputs.includes(name))
            throw new Error(`Missing execution binding ${name}`);
          if (value instanceof GPUVector && this.vectors.some(vector => vector.id === name))
            vectorInputs.push(value);
        }
        const declaration = this.vectors.find(value => value.id === plan.operation.output);
        const template = vectorInputs[0];
        const chunkLengths = declaration
          ? (template?.data.map(chunk => chunk.length) ??
            declaration.chunkLengths ??
            (declaration.length === undefined ? undefined : [declaration.length]))
          : [1];
        if (!chunkLengths) throw new Error(`Cannot infer length of ${plan.operation.output}`);
        for (const vector of vectorInputs) {
          if (
            vector.data.length !== chunkLengths.length ||
            vector.data.some((chunk, index) => chunk.length !== chunkLengths[index])
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
          const output = allocateVector(device, plan.operation.output, chunkLengths, plan.format);
          owned.add(output);
          values.set(plan.operation.output, output);
        }
      }
      for (const name of Object.keys(options.outputTargets ?? {})) {
        if (!produced.has(name) && !writableVectors.has(name))
          throw new Error(`Unknown graph output target ${name}`);
      }
      for (const name of this.outputs) {
        if (
          !(values.get(name) instanceof GPUVector) &&
          this.scalars.some(scalar => scalar.id === name)
        ) {
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
      return new GPUExpressionInvocation(this, values, owned);
    } catch (error) {
      for (const vector of owned) vector.destroy();
      throw error;
    }
  }
}

/** Per-run owned storage; selected outputs transfer to the caller after successful execution. @internal */
export class GPUExpressionInvocation {
  constructor(
    readonly program: GPUExpressionProgram,
    readonly values: Map<string, GPUVector | number>,
    private readonly owned: Set<GPUVector>
  ) {}
  finish(): Record<string, GPUVector> {
    const outputs: Record<string, GPUVector> = Object.create(null);
    for (const name of this.program.outputs) {
      const value = this.values.get(name);
      if (!(value instanceof GPUVector))
        throw new Error(`Output ${name} has no materialized vector`);
      outputs[name] = value;
    }
    for (const value of Object.values(outputs)) this.owned.delete(value);
    this.destroy();
    return outputs;
  }
  destroy(): void {
    for (const vector of this.owned) vector.destroy();
    this.owned.clear();
  }
}

function allocateVector(
  device: Device,
  name: string,
  lengths: readonly number[],
  format: GPUGraphVectorFormat = 'float32'
): GPUVector<GPUGraphVectorFormat> {
  const data: GPUData<GPUGraphVectorFormat>[] = [];
  try {
    for (const length of lengths)
      data.push(
        new GPUData({
          buffer: device.createBuffer({
            byteLength: Math.max(1, length) * getGPUExpressionRowInfo(format).components * 4,
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format,
          length,
          ownsBuffer: true
        })
      );
    return new GPUVector({type: 'data', name, format, data, ownsData: true});
  } catch (error) {
    for (const chunk of data) chunk.destroy();
    throw error;
  }
}

function validateVector(
  device: Device,
  vector: GPUVector,
  format: string,
  length?: number,
  chunks?: readonly number[]
): void {
  if (vector.format !== format || (length !== undefined && vector.length !== length))
    throw new Error(`Incompatible vector ${vector.name}`);
  if (
    chunks &&
    (chunks.length !== vector.data.length ||
      chunks.some((count, index) => count !== vector.data[index].length))
  )
    throw new Error(`Incompatible chunks for ${vector.name}`);
  const rowByteLength = getGPUVectorFormatInfo(vector.format).byteLength;
  for (const chunk of vector.data) {
    if (
      chunk.buffer.device !== device ||
      chunk.byteStride !== rowByteLength ||
      chunk.byteOffset % 4 !== 0 ||
      chunk.rowByteLength !== rowByteLength
    )
      throw new Error(
        `Expression vector ${vector.name} must contain packed 32-bit numeric chunks on the execution device`
      );
  }
}

function validateWritableTarget(
  name: string,
  target: GPUVector,
  values: ReadonlyMap<string, GPUVector | number>
): void {
  const getBuffer = (chunk: GPUData): Buffer =>
    chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
  const ranges = new Map<Buffer, {start: number; end: number}[]>();
  for (const chunk of target.data) {
    if (chunk.length === 0) continue;
    const buffer = getBuffer(chunk);
    const intervals = ranges.get(buffer) ?? [];
    intervals.push({
      start: chunk.byteOffset,
      end: chunk.byteOffset + chunk.length * chunk.byteStride
    });
    ranges.set(buffer, intervals);
  }
  for (const intervals of ranges.values()) {
    intervals.sort((left, right) => left.start - right.start);
    if (intervals.some((interval, index) => index > 0 && interval.start < intervals[index - 1].end))
      throw new Error(`Output ${name} has overlapping writable chunks`);
  }
  for (const [inputName, value] of values) {
    if (
      inputName !== name &&
      value instanceof GPUVector &&
      value.data.some(chunk => ranges.has(getBuffer(chunk)))
    )
      throw new Error('Expression output targets must not alias inputs or earlier outputs');
  }
}
