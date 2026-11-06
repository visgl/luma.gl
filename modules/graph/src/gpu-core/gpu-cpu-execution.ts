// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device} from '@luma.gl/core';
import {CPUData, CPUVector, GPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
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

  constructor(
    readonly device: Device,
    readonly program: GPUExpressionProgram,
    private readonly compileStage: GPUCPUStageCompiler
  ) {
    // Initial support is for pure numeric, operation-owned results.
    assert(!program.textures.length && !program.vectors.some(value => value.role === 'state'));
    const declarations = [...program.scalars, ...program.vectors];
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

  async run(
    bindings: GPUGraphRunBindings,
    locations: Readonly<Record<string, 'cpu' | 'gpu'>> = {}
  ): Promise<Record<string, GPUVector | CPUVector>> {
    for (const [name, location] of Object.entries(locations))
      assert(this.program.outputs.includes(name) && (location === 'cpu' || location === 'gpu'));
    const cpu = new Map<string, CPUVector>();
    for (const declaration of [...this.program.vectors, ...this.program.scalars].filter(
      value => value.role === 'input'
    )) {
      const value = bindings[declaration.id];
      assert(value !== undefined);
      if (!(value instanceof CPUVector)) {
        const graph = new GPUGraph();
        const vector = this.program.vectors.find(vector => vector.id === declaration.id);
        if (vector)
          graph.addInput(
            declaration.id,
            gpuGraph.vector(vector.format, {
              length: vector.length,
              chunkLengths: vector.chunkLengths
            })
          );
        else
          graph.addInput(
            declaration.id,
            gpuGraph.scalar(
              this.program.scalars.find(scalar => scalar.id === declaration.id)!.format
            )
          );
        new GPUExpressionProgram(graph, {outputs: []})
          .prepare(this.device, {[declaration.id]: value})
          .finish();
      }
      if (value instanceof CPUVector) {
        // List and validity metadata cannot be represented by portable callback rows yet.
        assert(value.data.every(chunk => !chunk.nullBitmap && !chunk.valueOffsets));
        assert(value.format === declaration.format);
        const vector = this.program.vectors.find(vector => vector.id === declaration.id);
        assert(vector && (vector.length === undefined || vector.length === value.length));
        assert(
          !vector.chunkLengths ||
            (vector.chunkLengths.length === value.data.length &&
              vector.chunkLengths.every((length, index) => length === value.data[index].length))
        );
        cpu.set(declaration.id, value);
      }
    }
    const values: Record<string, GPUGraphRunBindings[string]> = {...bindings};
    const owned = new Set<GPUVector>();
    const ensureCPU = async (name: string): Promise<GPUCPUVector> => {
      let value = cpu.get(name);
      if (!value) {
        const gpu = values[name];
        assert(gpu instanceof GPUVector);
        const read = await readCPUVector(gpu);
        value = makeCPUVector(
          read.format,
          read.chunks.map(chunk => chunk.values)
        );
        cpu.set(name, value);
      }
      return getCPUView(value);
    };
    const ensureGPU = async (name: string): Promise<GPUVector> => {
      const existing = values[name];
      if (existing instanceof GPUVector) return existing;
      const view = await ensureCPU(name);
      const graph = new GPUGraph();
      graph.add(
        new GPUUploadOperation({
          output: name,
          format: view.format,
          data: view.chunks.map(chunk => chunk.values)
        })
      );
      const compiled = this.compileStage(graph);
      try {
        const result = (await compiled.run({}))[name];
        owned.add(result);
        values[name] = result;
        return result;
      } finally {
        compiled.destroy();
      }
    };
    try {
      for (const stage of this.stages) {
        let results: Record<string, GPUVector>;
        if (stage instanceof GPUCPUOperation) {
          const inputs: Record<string, GPUCPUVector | number> = Object.create(null);
          for (const [localName, name] of Object.entries(stage.inputs)) {
            const value = values[name];
            const cpuValue = typeof value === 'number' ? value : await ensureCPU(name);
            inputs[localName] =
              typeof cpuValue !== 'number' &&
              this.program.scalars.some(scalar => scalar.id === name)
                ? cpuValue.pack()[0]
                : cpuValue;
          }
          const outputs = await stage.execute({inputs});
          assert(Object.keys(outputs).length === Object.keys(stage.outputs).length);
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
            cpu.set(name, makeCPUVector(descriptor.format, arrays));
            delete values[name];
          }
          continue;
        } else {
          const inputs: Record<string, GPUGraphRunBindings[string]> = Object.create(null);
          for (const name of stage.inputs) {
            const value = values[name];
            // Stage scalar inputs are host numbers, including results produced by an earlier GPU stage.
            inputs[name] = this.program.scalars.some(scalar => scalar.id === name)
              ? typeof value === 'number'
                ? value
                : (await ensureCPU(name)).pack()[0]
              : await ensureGPU(name);
          }
          results = await stage.graph.run({inputs});
        }
        for (const [name, value] of Object.entries(results)) {
          cpu.delete(name);
          values[name] = value;
          owned.add(value);
        }
      }
      const outputs: Record<string, GPUVector | CPUVector> = Object.create(null);
      for (const name of this.program.outputs) {
        if (locations[name] === 'cpu') {
          await ensureCPU(name);
          outputs[name] = cpu.get(name)!;
        } else outputs[name] = await ensureGPU(name);
      }
      for (const value of Object.values(outputs))
        if (value instanceof GPUVector) owned.delete(value);
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

function makeCPUVector(format: GPUCPUVector['format'], arrays: readonly GPUCPUArray[]): CPUVector {
  const width = getGPUVectorFormatInfo(format).byteLength;
  return new CPUVector({
    format,
    data: arrays.map(buffer => new CPUData({buffer, format, length: buffer.byteLength / width}))
  });
}
function getCPUView(vector: CPUVector): GPUCPUVector {
  const format = vector.format as GPUCPUVector['format'];
  assert(/^(float32|sint32|uint32)(x[234])?$/.test(format));
  const info = getGPUVectorFormatInfo(format);
  const ValueType =
    info.signedDataType === 'float32'
      ? Float32Array
      : info.signedDataType === 'uint32'
        ? Uint32Array
        : Int32Array;
  const chunks = vector.data.map(chunk => {
    const values = new ValueType(chunk.length * info.components);
    const bytes = new Uint8Array(values.buffer);
    for (let row = 0; row < chunk.length; row++)
      bytes.set(
        new Uint8Array(chunk.buffer, chunk.byteOffset + row * chunk.byteStride, info.byteLength),
        row * info.byteLength
      );
    return {values, length: chunk.length};
  });
  return {
    format,
    length: vector.length,
    chunks,
    pack() {
      const values = new ValueType(vector.length * info.components);
      let offset = 0;
      for (const chunk of chunks) {
        values.set(chunk.values, offset);
        offset += chunk.values.length;
      }
      return values;
    }
  };
}
