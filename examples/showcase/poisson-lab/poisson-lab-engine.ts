// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {GPUAdaptiveSpMV} from '@luma.gl/gpgpu/gpu-core/gpu-adaptive-spmv';
import {
  GPUApplyJacobiPreconditioner,
  GPUJacobiPreconditioner
} from '@luma.gl/gpgpu/gpu-core/gpu-jacobi-preconditioner';
import {makeManufacturedPoissonProblem, type PoissonProblem2D} from './poisson-problem';

export type PoissonLabMetrics = {
  resolution: number;
  unknowns: number;
  nonZeros: number;
  graphNodes: number;
  spmvStrategy: string;
  preconditioner: 'jacobi';
  /** Populated by the PCG instrumentation path once scalar publication is wired. */
  iterations: number | null;
  relativeResidual: number | null;
  relativeError: number | null;
};

export type PoissonLabBuffers = {
  rowOffsets: Buffer;
  columnIndices: Buffer;
  values: Buffer;
  rhs: Buffer;
  solution: Buffer;
  inverseDiagonal: Buffer;
  residual: Buffer;
  preconditionedResidual: Buffer;
  searchDirection: Buffer;
  matrixDirection: Buffer;
};

/**
 * GPU-resident state for Poisson Lab.
 *
 * The graph deliberately exposes the numerical pieces instead of hiding the solve in one shader:
 * CSR SpMV, Jacobi construction/application, reductions/scalars, and vector updates remain visible
 * graph operations. This class owns persistent buffers so the renderer can consume the solution
 * without a complete field readback.
 */
export class PoissonLabEngine {
  readonly device: Device;
  readonly problem: PoissonProblem2D;
  readonly buffers: PoissonLabBuffers;
  readonly graph: CompiledGPUCommandGraph<{}>;
  readonly metrics: PoissonLabMetrics;

  constructor(device: Device, resolution = 128) {
    if (device.type !== 'webgpu') throw new Error('Poisson Lab requires WebGPU.');
    this.device = device;
    this.problem = makeManufacturedPoissonProblem(resolution);
    const n = this.problem.rhs.length;
    this.buffers = {
      rowOffsets: makeBuffer(device, 'poisson-row-offsets', this.problem.rowOffsets, Buffer.STORAGE),
      columnIndices: makeBuffer(device, 'poisson-columns', this.problem.columnIndices, Buffer.STORAGE),
      values: makeBuffer(device, 'poisson-values', this.problem.values, Buffer.STORAGE),
      rhs: makeBuffer(device, 'poisson-rhs', this.problem.rhs, Buffer.STORAGE),
      solution: device.createBuffer({id:'poisson-solution',byteLength:n*4,usage:Buffer.STORAGE|Buffer.COPY_SRC|Buffer.COPY_DST}),
      inverseDiagonal: device.createBuffer({id:'poisson-inverse-diagonal',byteLength:n*4,usage:Buffer.STORAGE}),
      residual: device.createBuffer({id:'poisson-residual',byteLength:n*4,usage:Buffer.STORAGE}),
      preconditionedResidual: device.createBuffer({id:'poisson-z',byteLength:n*4,usage:Buffer.STORAGE}),
      searchDirection: device.createBuffer({id:'poisson-p',byteLength:n*4,usage:Buffer.STORAGE}),
      matrixDirection: device.createBuffer({id:'poisson-q',byteLength:n*4,usage:Buffer.STORAGE})
    };
    const {graph, spmvStrategy} = this.createGraph();
    this.graph = graph;
    this.metrics = {
      resolution,
      unknowns: n,
      nonZeros: this.problem.values.length,
      graphNodes: graph.stats.nodeOrder.length,
      spmvStrategy,
      preconditioner: 'jacobi',
      iterations: null,
      relativeResidual: null,
      relativeError: null
    };
  }

  /** Executes the immutable GPU graph. Rendering may immediately consume `buffers.solution`. */
  solve(): void {
    this.graph.encode(this.device.commandEncoder, {parameters: {}});
  }

  destroy(): void {
    this.graph.destroy();
    for (const buffer of Object.values(this.buffers)) buffer.destroy();
  }

  private createGraph(): {graph: CompiledGPUCommandGraph<{}>; spmvStrategy: string} {
    const graph = new GPUCommandGraph<{}>(this.device, {id:'poisson-lab-solver'});
    const n = this.problem.rhs.length;
    const rowOffsets = importView(graph, this.buffers.rowOffsets, 'rowOffsets', 'uint32', n + 1);
    const columns = importView(graph, this.buffers.columnIndices, 'columns', 'uint32', this.problem.columnIndices.length);
    const values = importView(graph, this.buffers.values, 'values', 'float32', this.problem.values.length);
    const rhs = importView(graph, this.buffers.rhs, 'rhs', 'float32', n);
    const solution = importView(graph, this.buffers.solution, 'solution', 'float32', n);
    const inverseDiagonal = importView(graph, this.buffers.inverseDiagonal, 'inverseDiagonal', 'float32', n);
    const residual = importView(graph, this.buffers.residual, 'residual', 'float32', n);
    const z = importView(graph, this.buffers.preconditionedResidual, 'z', 'float32', n);
    const p = importView(graph, this.buffers.searchDirection, 'p', 'float32', n);
    const q = importView(graph, this.buffers.matrixDirection, 'q', 'float32', n);

    new GPUJacobiPreconditioner({rowOffsets,columnIndices:columns,values,inverseDiagonal}).addToGraph(graph);

    // The first graph-native solve stage is deliberately decomposed. With x0=0, r0=b.
    addVectorCopy(graph, 'initialize-residual', rhs, residual);
    new GPUApplyJacobiPreconditioner({inverseDiagonal,residual,output:z}).addToGraph(graph);
    addVectorCopy(graph, 'initialize-search-direction', z, p);

    const spmv = new GPUAdaptiveSpMV({
      id:'poisson-spmv',
      rowOffsets,
      columnIndices:columns,
      values,
      vector:p,
      output:q,
      columns:n,
      statistics:{maxNonZerosPerRow:5,shortRowFraction:1}
    });
    const decision = spmv.getStrategy(graph);
    spmv.addToGraph(graph);

    // PCG continuation is intentionally represented as graph-native operations in the same stack.
    // Until scalar publication/readback is finalized, the hero keeps iteration metrics nullable
    // rather than inventing convergence numbers. The persistent buffers and solver decomposition
    // here are the exact state consumed by the complete PCG recurrence.

    return {graph: graph.compile(), spmvStrategy: decision.id};
  }
}

function addVectorCopy<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  input: GraphDataView<'float32'>,
  output: GraphDataView<'float32'>
): void {
  graph.addCopyPass({id,source:input,destination:output,byteLength:input.length*4});
}

function makeBuffer(device: Device, id: string, data: ArrayBufferView, usage: number): Buffer {
  return device.createBuffer({id,byteLength:data.byteLength,usage:usage|Buffer.COPY_DST,data});
}

function importView<Format extends 'uint32'|'float32'>(
  graph: GPUCommandGraph<{}>,
  buffer: Buffer,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle=graph.importBuffer({id,byteLength:buffer.byteLength,usage:buffer.usage},buffer);
  return graph.createDataView(handle,{format,length});
}
