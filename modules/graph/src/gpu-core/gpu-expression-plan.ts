// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUGraph} from './gpu-graph';
import type {GPUGraphScalar, GPUGraphVector} from './gpu-graph-value';
import {GPUGraphDotProduct, GPUGraphVectorMADD} from './gpu-semantic-vector-operation';
import {GPUGraphSpMV} from './gpu-semantic-spmv';
import {GPUGraphScalarLiteral} from './gpu-semantic-state-operation';
import {GPUGraphScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUCompositeOperation, type GPUGraphOperation} from './gpu-operation';
import {
  GPUExpressionOperation,
  parseGPUExpression,
  getGPUExpressionReferences,
  type GPUExpression
} from './gpu-expression-operation';

export type GPUGraphRunBindings = Readonly<Record<string, GPUVector | number>>;
export type GPUGraphCompileOptions = {outputs?: readonly string[]};
export type GPUGraphRunOptions = {outputTargets?: Readonly<Record<string, GPUVector>>};

/** @internal */
export type GPUExpressionPlan = {
  operation: GPUExpressionOperation;
  expression: GPUExpression;
  references: readonly string[];
  gpuScalarInputs: readonly string[];
};

/** Snapshot of declarations and checked expressions; contains no bound resources. @internal */
export class GPUExpressionProgram {
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
      else if (operation instanceof GPUGraphScalarOperation)
        scalarProducers.add(operation.output.id);
      else if (
        operation instanceof GPUGraphDotProduct ||
        operation instanceof GPUGraphScalarLiteral
      )
        scalarProducers.add(operation.props.output.id);
    }
    const producers = new Set<string>();
    for (const operation of expressions) {
      if (producers.has(operation.output))
        throw new Error(`Multiple expression writers for ${operation.output}`);
      producers.add(operation.output);
    }
    const available = new Set([...declarations.keys()].filter(name => !producers.has(name)));
    this.expressions = expressions.map(operation => {
      const output = declarations.get(operation.output);
      if (!output || output.format !== 'float32')
        throw new Error(`Expression output ${operation.output} must declare float32`);
      const expression = parseGPUExpression(operation.expression);
      const references = getGPUExpressionReferences(expression);
      for (const name of references) {
        const declaration = declarations.get(name);
        if (!declaration || declaration.format !== 'float32')
          throw new Error(`Expression input ${name} must declare float32`);
        if (!available.has(name))
          throw new Error(`Expression ${operation.id} reads ${name} before it is produced`);
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
      available.add(operation.output);
      const gpuScalarInputs = references.filter(name =>
        precedingScalarProducers.get(operation)!.has(name)
      );
      return {operation, expression, references, gpuScalarInputs};
    });
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
      this.operations
        .map(getProducedVector)
        .filter(vector => vector !== undefined)
        .map(vector => vector.id)
    );
    try {
      for (const [name, binding] of Object.entries(bindings)) {
        if (produced.has(name)) throw new Error(`Use outputTargets for expression output ${name}`);
        const scalar = this.scalars.find(value => value.id === name);
        const vector = this.vectors.find(value => value.id === name);
        if (scalar) {
          if (typeof binding !== 'number' || !Number.isFinite(binding))
            throw new Error(`Expected numeric scalar ${name}`);
        } else if (vector) {
          if (!(binding instanceof GPUVector)) throw new Error(`Expected GPUVector ${name}`);
          validateVector(device, binding, vector.format, vector.length, vector.chunkLengths);
        } else throw new Error(`Undeclared binding ${name}`);
        values.set(name, binding);
      }
      for (const operation of this.operations) {
        if (!(operation instanceof GPUExpressionOperation)) {
          const declaration = getProducedVector(operation);
          if (declaration) {
            const existing = values.get(declaration.id);
            const target =
              targets.get(declaration.id) ?? (existing instanceof GPUVector ? existing : undefined);
            const input =
              operation instanceof GPUGraphVectorMADD
                ? values.get(operation.props.input.id)
                : undefined;
            const chunks =
              declaration.chunkLengths ??
              (input instanceof GPUVector
                ? input.data.map(chunk => chunk.length)
                : declaration.length === undefined
                  ? undefined
                  : [declaration.length]);
            if (!target && !chunks)
              throw new Error(`Cannot infer length of produced vector ${declaration.id}`);
            if (target) {
              validateVector(
                device,
                target,
                declaration.format,
                declaration.length ?? chunks?.reduce((total, count) => total + count, 0),
                chunks
              );
              validateWritableTarget(declaration.id, target, values);
              values.set(declaration.id, target);
            } else {
              const length = chunks!.reduce((total, count) => total + count, 0);
              if (declaration.length !== undefined && declaration.length !== length)
                throw new Error(`Length constraint failed for ${declaration.id}`);
              const output = allocateVector(device, declaration.id, chunks!);
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
          validateVector(device, target, 'float32', length, chunkLengths);
          validateWritableTarget(plan.operation.output, target, values);
          values.set(plan.operation.output, target);
        } else {
          const output = allocateVector(device, plan.operation.output, chunkLengths);
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
          const output = allocateVector(device, name, [1]);
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
  lengths: readonly number[]
): GPUVector<'float32'> {
  const data: GPUData<'float32'>[] = [];
  try {
    for (const length of lengths)
      data.push(
        new GPUData({
          buffer: device.createBuffer({
            byteLength: Math.max(1, length) * 4,
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format: 'float32',
          length,
          ownsBuffer: true
        })
      );
    return new GPUVector({type: 'data', name, format: 'float32', data, ownsData: true});
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
  for (const chunk of vector.data) {
    if (
      chunk.buffer.device !== device ||
      chunk.byteStride !== 4 ||
      chunk.byteOffset % 4 !== 0 ||
      chunk.rowByteLength !== 4
    )
      throw new Error(
        `Expression vector ${vector.name} must contain packed float32 chunks on the execution device`
      );
  }
}

/** Outputs known to the built-in full-graph lowerers. */
function getProducedVector(operation: GPUGraphOperation): GPUGraphVector<'float32'> | undefined {
  return operation instanceof GPUGraphVectorMADD || operation instanceof GPUGraphSpMV
    ? operation.props.output
    : undefined;
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
