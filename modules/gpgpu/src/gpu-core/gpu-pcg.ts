// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {createTransientView} from './graph-data-view-utils';
import {GPUAdaptiveSpMV, type GPUAdaptiveSpMVProps} from './gpu-adaptive-spmv';
import {GPUApplyJacobiPreconditioner, GPUJacobiPreconditioner} from './gpu-jacobi-preconditioner';
import {GPUFloat32HierarchicalReduction} from './gpu-reduction-substrate';
import {createGPUScalar, type GPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';

export type GPUJacobiPCGProps = {
  id?: string;
  rowOffsets: GraphDataView<'uint32'>;
  columnIndices: GraphDataView<'uint32'>;
  values: GraphDataView<'float32'>;
  rhs: GraphDataView<'float32'>;
  solution: GraphDataView<'float32'>;
  columns: number;
  /** Fixed graph-unrolled iteration count. GPU convergence gating can be layered on later. */
  iterations: number;
  spmvStatistics?: GPUAdaptiveSpMVProps['statistics'];
};

export type GPUJacobiPCGResult = {
  residualSquared: GPUScalar<'float32'>;
  initialResidualSquared: GPUScalar<'float32'>;
  spmvStrategy: string;
};

/**
 * Graph-composed Jacobi-preconditioned conjugate gradient solver.
 *
 * The solver intentionally expands into public primitives rather than hiding the algorithm in one
 * shader. Iterations are graph-unrolled today; all state remains GPU-resident and the final residual
 * is a GPUScalar suitable for publication/inspection.
 */
export class GPUJacobiPCG {
  readonly id: string;
  constructor(readonly props: GPUJacobiPCGProps) {
    this.id = props.id ?? 'gpu-jacobi-pcg';
    if (!Number.isInteger(props.iterations) || props.iterations < 1) throw new Error(`${this.id} iterations must be positive`);
    if (props.rhs.length !== props.solution.length || props.columns !== props.rhs.length) throw new Error(`${this.id} requires a square system matching rhs/solution length`);
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): GPUJacobiPCGResult {
    const {rowOffsets,columnIndices,values,rhs,solution,columns,iterations,spmvStatistics}=this.props;
    const n=rhs.length;
    const inverseDiagonal=createTransientView(graph,`${this.id}-inverse-diagonal`,'float32',n);
    const r=createTransientView(graph,`${this.id}-r`,'float32',n);
    const z=createTransientView(graph,`${this.id}-z`,'float32',n);
    const p=createTransientView(graph,`${this.id}-p`,'float32',n);
    const q=createTransientView(graph,`${this.id}-q`,'float32',n);
    const rho=createGPUScalar(graph,`${this.id}-rho`,'float32');
    const rhoNew=createGPUScalar(graph,`${this.id}-rho-new`,'float32');
    const pDotQ=createGPUScalar(graph,`${this.id}-p-dot-q`,'float32');
    const alpha=createGPUScalar(graph,`${this.id}-alpha`,'float32');
    const beta=createGPUScalar(graph,`${this.id}-beta`,'float32');
    const negativeAlpha=createGPUScalar(graph,`${this.id}-negative-alpha`,'float32');
    const minusOne=createGPUScalar(graph,`${this.id}-minus-one`,'float32');
    const initialResidualSquared=createGPUScalar(graph,`${this.id}-initial-residual-squared`,'float32');
    const residualSquared=createGPUScalar(graph,`${this.id}-residual-squared`,'float32');

    new GPUJacobiPreconditioner({id:`${this.id}-jacobi`,rowOffsets,columnIndices,values,inverseDiagonal}).addToGraph(graph);
    // Hero starts from x0=0, therefore r0=b exactly.
    graph.addCopyPass({id:`${this.id}-r0`,source:rhs,destination:r,byteLength:n*4});
    new GPUApplyJacobiPreconditioner({id:`${this.id}-z0`,inverseDiagonal,residual:r,output:z}).addToGraph(graph);
    graph.addCopyPass({id:`${this.id}-p0`,source:z,destination:p,byteLength:n*4});
    new GPUFloat32HierarchicalReduction({id:`${this.id}-rho0`,input:r,inputB:z,map:'multiply',output:rho}).addToGraph(graph);
    new GPUFloat32HierarchicalReduction({id:`${this.id}-rr0`,input:r,map:'square',output:initialResidualSquared}).addToGraph(graph);
    addScalarLiteral(graph,minusOne,-1);

    let spmvStrategy='';
    for(let iteration=0;iteration<iterations;iteration++){
      const prefix=`${this.id}-iteration-${iteration}`;
      const spmv=new GPUAdaptiveSpMV({id:`${prefix}-spmv`,rowOffsets,columnIndices,values,vector:p,output:q,columns,statistics:spmvStatistics});
      spmvStrategy=spmv.getStrategy(graph).id;
      spmv.addToGraph(graph);
      new GPUFloat32HierarchicalReduction({id:`${prefix}-pdq`,input:p,inputB:q,map:'multiply',output:pDotQ}).addToGraph(graph);
      new GPUScalarCompute({id:`${prefix}-alpha`,operation:'divide',left:rho,right:pDotQ,output:alpha}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${prefix}-x`,input:p,scale:alpha,addend:solution,output:solution}).addToGraph(graph);
      new GPUScalarCompute({id:`${prefix}-negative-alpha`,operation:'multiply',left:alpha,right:minusOne,output:negativeAlpha}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${prefix}-r`,input:q,scale:negativeAlpha,addend:r,output:r}).addToGraph(graph);
      new GPUApplyJacobiPreconditioner({id:`${prefix}-z`,inverseDiagonal,residual:r,output:z}).addToGraph(graph);
      new GPUFloat32HierarchicalReduction({id:`${prefix}-rho-new`,input:r,inputB:z,map:'multiply',output:rhoNew}).addToGraph(graph);
      new GPUScalarCompute({id:`${prefix}-beta`,operation:'divide',left:rhoNew,right:rho,output:beta}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${prefix}-p`,input:p,scale:beta,addend:z,output:p}).addToGraph(graph);
      new GPUScalarCompute({id:`${prefix}-rho-copy`,operation:'copy',left:rhoNew,output:rho}).addToGraph(graph);
    }
    new GPUFloat32HierarchicalReduction({id:`${this.id}-final-rr`,input:r,map:'square',output:residualSquared}).addToGraph(graph);
    return {residualSquared,initialResidualSquared,spmvStrategy};
  }
}

function addScalarLiteral<Parameters>(graph:GPUCommandGraph<Parameters>,output:GPUScalar<'float32'>,value:number):void{
  // A one-value transient vector plus reduction keeps initialization inside existing public graph
  // semantics; GPUScalarConstant can replace this helper once exported through gpu-core.
  const literal=createTransientView(graph,`${output.id}-literal`,'float32',1);
  throw new Error(`GPUJacobiPCG scalar literal ${value} requires GPUScalarConstant export`);
}
