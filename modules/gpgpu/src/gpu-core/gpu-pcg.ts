// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {createGPUCopyCommandNode, type GPUCommandNode} from './gpu-command-node';
import {createTransientView} from './graph-data-view-utils';
import {GPUAdaptiveSpMV, type GPUAdaptiveSpMVProps} from './gpu-adaptive-spmv';
import {GPUApplyJacobiPreconditioner, GPUJacobiPreconditioner} from './gpu-jacobi-preconditioner';
import {GPUFloat32HierarchicalReduction} from './gpu-reduction-substrate';
import {createGPUScalar, type GPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUScalarConstant} from './gpu-scalar-constant';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';

export type GPUJacobiPCGProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  rhs: GraphDataView<'float32'>;
  solution: GraphDataView<'float32'>;
  columns: number;
  iterations: number;
  spmvStatistics?: GPUAdaptiveSpMVProps['statistics'];
};
export type GPUJacobiPCGResult = {
  residualSquared: GPUScalar<'float32'>;
  initialResidualSquared: GPUScalar<'float32'>;
  spmvStrategy: string;
  iterations: number;
};

/** Graph-composed fixed-iteration Jacobi-preconditioned conjugate gradient solver. */
export class GPUJacobiPCG {
  readonly id: string;
  private result?: GPUJacobiPCGResult;
  constructor(readonly props: GPUJacobiPCGProps) {
    this.id = props.id ?? 'gpu-jacobi-pcg';
    if (!Number.isInteger(props.iterations) || props.iterations < 1)
      throw new Error(`${this.id} iterations must be positive`);
    if (props.rhs.length !== props.solution.length || props.columns !== props.rhs.length)
      throw new Error(`${this.id} requires a square system matching rhs/solution length`);
  }
  getResult(): GPUJacobiPCGResult {
    if (!this.result) {
      throw new Error(`${this.id} must be added to a graph before reading its result`);
    }
    return this.result;
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    if (this.result) {
      throw new Error(`${this.id} can only be added to a graph once`);
    }
    const nodes: GPUCommandNode<Parameters>[] = [];
    const add = (primitive: {
      getCommandNodes(graph: GPUCommandGraph<Parameters>): readonly GPUCommandNode<Parameters>[];
    }): void => {
      nodes.push(...primitive.getCommandNodes(graph));
    };
    const {rowOffsets, columnIndices, values, rhs, solution, columns, iterations, spmvStatistics} =
      this.props;
    const n = rhs.length;
    const inverseDiagonal = createTransientView(graph, `${this.id}-inverse-diagonal`, 'float32', n),
      r = createTransientView(graph, `${this.id}-r`, 'float32', n),
      z = createTransientView(graph, `${this.id}-z`, 'float32', n),
      p = createTransientView(graph, `${this.id}-p`, 'float32', n),
      q = createTransientView(graph, `${this.id}-q`, 'float32', n);
    const rho = createGPUScalar(graph, `${this.id}-rho`, 'float32'),
      rhoNew = createGPUScalar(graph, `${this.id}-rho-new`, 'float32'),
      pDotQ = createGPUScalar(graph, `${this.id}-p-dot-q`, 'float32'),
      alpha = createGPUScalar(graph, `${this.id}-alpha`, 'float32'),
      beta = createGPUScalar(graph, `${this.id}-beta`, 'float32'),
      negativeAlpha = createGPUScalar(graph, `${this.id}-negative-alpha`, 'float32'),
      minusOne = createGPUScalar(graph, `${this.id}-minus-one`, 'float32'),
      initialResidualSquared = createGPUScalar(
        graph,
        `${this.id}-initial-residual-squared`,
        'float32'
      ),
      residualSquared = createGPUScalar(graph, `${this.id}-residual-squared`, 'float32');
    add(
      new GPUJacobiPreconditioner({
        id: `${this.id}-jacobi`,
        rowOffsets,
        columnIndices,
        values,
        inverseDiagonal
      })
    );
    nodes.push(addCopyViewPass(`${this.id}-r0`, rhs, r, n * 4));
    add(
      new GPUApplyJacobiPreconditioner({
        id: `${this.id}-z0`,
        inverseDiagonal,
        residual: r,
        output: z
      })
    );
    nodes.push(addCopyViewPass(`${this.id}-p0`, z, p, n * 4));
    add(
      new GPUFloat32HierarchicalReduction({
        id: `${this.id}-rho0`,
        input: r,
        inputB: z,
        map: 'multiply',
        output: rho
      })
    );
    add(
      new GPUFloat32HierarchicalReduction({
        id: `${this.id}-rr0`,
        input: r,
        map: 'square',
        output: initialResidualSquared
      })
    );
    add(new GPUScalarConstant({id: `${this.id}-minus-one`, output: minusOne, value: -1}));
    let spmvStrategy = '';
    for (let iteration = 0; iteration < iterations; iteration++) {
      const prefix = `${this.id}-iteration-${iteration}`;
      const spmv = new GPUAdaptiveSpMV({
        id: `${prefix}-spmv`,
        rowOffsets,
        columnIndices,
        values,
        vector: p,
        output: q,
        columns,
        statistics: spmvStatistics
      });
      spmvStrategy = spmv.getStrategy(graph).id;
      add(spmv);
      add(
        new GPUFloat32HierarchicalReduction({
          id: `${prefix}-pdq`,
          input: p,
          inputB: q,
          map: 'multiply',
          output: pDotQ
        })
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-alpha`,
          operation: 'divide',
          left: rho,
          right: pDotQ,
          output: alpha
        })
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-x`,
          input: p,
          scale: alpha,
          addend: solution,
          output: solution
        })
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-negative-alpha`,
          operation: 'multiply',
          left: alpha,
          right: minusOne,
          output: negativeAlpha
        })
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-r`,
          input: q,
          scale: negativeAlpha,
          addend: r,
          output: r
        })
      );
      add(
        new GPUApplyJacobiPreconditioner({
          id: `${prefix}-z`,
          inverseDiagonal,
          residual: r,
          output: z
        })
      );
      add(
        new GPUFloat32HierarchicalReduction({
          id: `${prefix}-rho-new`,
          input: r,
          inputB: z,
          map: 'multiply',
          output: rhoNew
        })
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-beta`,
          operation: 'divide',
          left: rhoNew,
          right: rho,
          output: beta
        })
      );
      add(
        new GPUVectorScalarMADD({
          id: `${prefix}-p`,
          input: p,
          scale: beta,
          addend: z,
          output: p
        })
      );
      add(
        new GPUScalarCompute({
          id: `${prefix}-rho-copy`,
          operation: 'copy',
          left: rhoNew,
          output: rho
        })
      );
    }
    add(
      new GPUFloat32HierarchicalReduction({
        id: `${this.id}-final-rr`,
        input: r,
        map: 'square',
        output: residualSquared
      })
    );
    this.result = {residualSquared, initialResidualSquared, spmvStrategy, iterations};
    return nodes;
  }
}

function addCopyViewPass<Parameters>(
  id: string,
  source: GraphDataView<'float32'>,
  destination: GraphDataView<'float32'>,
  byteLength: number
): GPUCommandNode<Parameters> {
  return createGPUCopyCommandNode({
    id,
    resources: [
      {buffer: source, usage: 'copy-source'},
      {buffer: destination, usage: 'copy-destination'}
    ],
    compile: () => ({
      encode: ({commandEncoder, getBuffer}) => {
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getBuffer(source),
          sourceOffset: source.byteOffset,
          destinationBuffer: getBuffer(destination),
          destinationOffset: destination.byteOffset,
          size: byteLength
        });
      }
    })
  });
}
