// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import {GPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import {GPUGraph} from './gpu-graph';
import {gpuGraph} from './gpu-graph-value';
import {GPUCPUOperation, type GPUCPUVector, type GPUCPUArray} from './gpu-cpu-operation';
import {GPUExpressionProgram, type GPUGraphRunBindings} from './gpu-expression-plan';
import {GPUUploadOperation} from './gpu-transfer-operation';
import type {GPUGraphExecutionBindings} from './gpu-expression-plan';

/** Backend-specific GPU stage; CPU scheduling is shared by both graph executors. */
export type GPUCPUStage = {
  run(bindings: GPUGraphExecutionBindings): Promise<Record<string, GPUVector>>;
  destroy(): void;
};
export type GPUCPUStageCompiler = (source: GPUGraph, outputs?: readonly string[]) => GPUCPUStage;

/** Submission boundaries around CPU callbacks; each GPU stage resolves its shapes independently. */
export class GPUCPUExecution {
  private readonly stages: (
    | GPUCPUOperation
    | {
        graph: GPUCPUStage;
        inputs: readonly string[];
      }
  )[] = [];
  private readonly validation: GPUExpressionProgram;

  constructor(
    readonly device: Device,
    readonly program: GPUExpressionProgram,
    private readonly compileStage: GPUCPUStageCompiler
  ) {
    // Initial support is for pure numeric, operation-owned results.
    assert(!program.textures.length && !program.vectors.some(value => value.role === 'state'));
    const declarations = [...program.scalars, ...program.vectors];
    const inputGraph = new GPUGraph();
    const addInput = (graph: GPUGraph, name: string) => {
      const declaration = declarations.find(value => value.id === name)!;
      assert(declaration);
      const vector = program.vectors.find(value => value.id === name);
      if (vector)
        graph.addInput(
          name,
          gpuGraph.vector(vector.format, {
            length: vector.length,
            chunkLengths: vector.chunkLengths
          })
        );
      else
        graph.addInput(
          name,
          gpuGraph.scalar(program.scalars.find(value => value.id === name)!.format)
        );
    };
    for (const declaration of declarations)
      if (declaration.role === 'input') addInput(inputGraph, declaration.id);
    this.validation = new GPUExpressionProgram(inputGraph, {outputs: []});
    try {
      for (const operation of program.operations) {
        if (operation instanceof GPUCPUOperation) {
          this.stages.push(operation);
          continue;
        }
        assert('contract' in operation && operation.contract);
        const inputs = operation.contract.values
          .filter(use => use.access !== 'write')
          .map(use => (typeof use.value === 'string' ? use.value : use.value.id));
        const outputs = operation.contract.values
          .filter(use => use.access !== 'read')
          .map(use => (typeof use.value === 'string' ? use.value : use.value.id));
        const graph = new GPUGraph();
        for (const name of new Set(inputs)) addInput(graph, name);
        for (const name of new Set(outputs)) {
          const vector = program.vectors.find(value => value.id === name);
          if (vector)
            graph.addDeclaration(
              name,
              gpuGraph.vector(vector.format, {
                length: vector.length,
                chunkLengths: vector.chunkLengths
              }),
              'value'
            );
        }
        graph.add(operation);
        this.stages.push({
          graph: compileStage(graph, outputs),
          inputs
        });
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  async run(bindings: GPUGraphRunBindings): Promise<Record<string, GPUVector>> {
    const initial = this.validation.resolveBindings({inputs: bindings});
    this.validation.prepare(this.device, initial.bindings).finish();
    const values: Record<string, GPUGraphRunBindings[string]> = {...bindings};
    const owned = new Set<GPUVector>();
    try {
      for (const stage of this.stages) {
        let results: Record<string, GPUVector>;
        if (stage instanceof GPUCPUOperation) {
          const inputs: Record<string, GPUCPUVector | number> = Object.create(null);
          for (const [localName, name] of Object.entries(stage.inputs)) {
            const value = values[name];
            assert(typeof value === 'number' || value instanceof GPUVector);
            const cpuValue = typeof value === 'number' ? value : await readCPUVector(value);
            inputs[localName] =
              typeof cpuValue !== 'number' &&
              this.program.scalars.some(scalar => scalar.id === name)
                ? cpuValue.pack()[0]
                : cpuValue;
          }
          const outputs = await stage.execute({inputs});
          assert(Object.keys(outputs).length === Object.keys(stage.outputs).length);
          const graph = new GPUGraph();
          for (const name of Object.keys(stage.outputs)) {
            // The resolved declaration includes constraints supplied through graph.vector().
            const descriptor = this.program.vectors.find(vector => vector.id === name)!;
            const result = outputs[name];
            assert(result);
            const arrays = 'chunks' in result ? result.chunks.map(chunk => chunk.values) : [result];
            const upload = new GPUUploadOperation({
              output: name,
              format: descriptor.format,
              data: arrays
            });
            const length = upload.chunkLengths.reduce((total, count) => total + count, 0);
            // Returned rows must satisfy any declared fixed shape.
            assert(descriptor.length === undefined || descriptor.length === length);
            assert(
              !descriptor.chunkLengths ||
                (descriptor.chunkLengths.length === arrays.length &&
                  descriptor.chunkLengths.every(
                    (count, index) => count === upload.chunkLengths[index]
                  ))
            );
            graph.add(upload);
          }
          const compiled = this.compileStage(graph);
          try {
            results = await compiled.run({});
          } finally {
            compiled.destroy();
          }
        } else {
          const inputs: Record<string, GPUGraphRunBindings[string]> = Object.create(null);
          for (const name of stage.inputs) {
            const value = values[name];
            // Stage scalar inputs are host numbers, including results produced by an earlier GPU stage.
            inputs[name] =
              value instanceof GPUVector && this.program.scalars.some(scalar => scalar.id === name)
                ? (await readCPUVector(value)).pack()[0]
                : value;
          }
          results = await stage.graph.run({inputs});
        }
        for (const [name, value] of Object.entries(results)) {
          values[name] = value;
          owned.add(value);
        }
      }
      const outputs: Record<string, GPUVector> = Object.create(null);
      for (const name of this.program.outputs) {
        const value = values[name];
        assert(value instanceof GPUVector);
        outputs[name] = value;
      }
      for (const value of Object.values(outputs)) owned.delete(value);
      return outputs;
    } finally {
      for (const value of owned) value.destroy();
    }
  }

  destroy(): void {
    for (const stage of this.stages) if (!(stage instanceof GPUCPUOperation)) stage.graph.destroy();
  }
}

async function readCPUVector(vector: GPUVector): Promise<GPUCPUVector> {
  assert(vector.format);
  const info = getGPUVectorFormatInfo(vector.format);
  const ValueType =
    info.signedDataType === 'float32'
      ? Float32Array
      : info.signedDataType === 'uint32'
        ? Uint32Array
        : Int32Array;
  const chunks: {values: GPUCPUArray; length: number}[] = [];
  for (const chunk of vector.data) {
    const values = new ValueType((chunk.length * info.byteLength) / 4);
    if (chunk.length) {
      const bytes = await chunk.buffer.readAsync(
        chunk.byteOffset,
        (chunk.length - 1) * chunk.byteStride + info.byteLength
      );
      const packed = new Uint8Array(values.buffer);
      for (let row = 0; row < chunk.length; row++)
        packed.set(
          bytes.subarray(row * chunk.byteStride, row * chunk.byteStride + info.byteLength),
          row * info.byteLength
        );
    }
    chunks.push({values, length: chunk.length});
  }
  return {
    format: vector.format as GPUCPUVector['format'],
    length: vector.length,
    chunks,
    pack() {
      const packed = new ValueType(chunks.reduce((total, chunk) => total + chunk.values.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        packed.set(chunk.values, offset);
        offset += chunk.values.length;
      }
      return packed;
    }
  };
}
