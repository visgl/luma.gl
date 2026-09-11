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
import {GPUScalarConstant} from './gpu-scalar-constant';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';

export type GPUJacobiPCGProps={id?:string;rowOffsets:GraphDataView<'uint32'>;columnIndices:GraphDataView<'uint32'>;values:GraphDataView<'float32'>;rhs:GraphDataView<'float32'>;solution:GraphDataView<'float32'>;columns:number;iterations:number;spmvStatistics?:GPUAdaptiveSpMVProps['statistics']};
export type GPUJacobiPCGResult={residualSquared:GPUScalar<'float32'>;initialResidualSquared:GPUScalar<'float32'>;spmvStrategy:string};

/** Graph-composed fixed-iteration Jacobi-preconditioned conjugate gradient solver. */
export class GPUJacobiPCG{
  readonly id:string;
  constructor(readonly props:GPUJacobiPCGProps){this.id=props.id??'gpu-jacobi-pcg';if(!Number.isInteger(props.iterations)||props.iterations<1)throw new Error(`${this.id} iterations must be positive`);if(props.rhs.length!==props.solution.length||props.columns!==props.rhs.length)throw new Error(`${this.id} requires a square system matching rhs/solution length`);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):GPUJacobiPCGResult{
    const{rowOffsets,columnIndices,values,rhs,solution,columns,iterations,spmvStatistics}=this.props;const n=rhs.length;
    const inverseDiagonal=createTransientView(graph,`${this.id}-inverse-diagonal`,'float32',n),r=createTransientView(graph,`${this.id}-r`,'float32',n),z=createTransientView(graph,`${this.id}-z`,'float32',n),p=createTransientView(graph,`${this.id}-p`,'float32',n),q=createTransientView(graph,`${this.id}-q`,'float32',n);
    const rho=createGPUScalar(graph,`${this.id}-rho`,'float32'),rhoNew=createGPUScalar(graph,`${this.id}-rho-new`,'float32'),pDotQ=createGPUScalar(graph,`${this.id}-p-dot-q`,'float32'),alpha=createGPUScalar(graph,`${this.id}-alpha`,'float32'),beta=createGPUScalar(graph,`${this.id}-beta`,'float32'),negativeAlpha=createGPUScalar(graph,`${this.id}-negative-alpha`,'float32'),minusOne=createGPUScalar(graph,`${this.id}-minus-one`,'float32'),initialResidualSquared=createGPUScalar(graph,`${this.id}-initial-residual-squared`,'float32'),residualSquared=createGPUScalar(graph,`${this.id}-residual-squared`,'float32');
    new GPUJacobiPreconditioner({id:`${this.id}-jacobi`,rowOffsets,columnIndices,values,inverseDiagonal}).addToGraph(graph);
    graph.addCopyPass({id:`${this.id}-r0`,source:rhs,destination:r,byteLength:n*4});
    new GPUApplyJacobiPreconditioner({id:`${this.id}-z0`,inverseDiagonal,residual:r,output:z}).addToGraph(graph);
    graph.addCopyPass({id:`${this.id}-p0`,source:z,destination:p,byteLength:n*4});
    new GPUFloat32HierarchicalReduction({id:`${this.id}-rho0`,input:r,inputB:z,map:'multiply',output:rho}).addToGraph(graph);
    new GPUFloat32HierarchicalReduction({id:`${this.id}-rr0`,input:r,map:'square',output:initialResidualSquared}).addToGraph(graph);
    new GPUScalarConstant({id:`${this.id}-minus-one`,output:minusOne,value:-1}).addToGraph(graph);
    let spmvStrategy='';
    for(let iteration=0;iteration<iterations;iteration++){
      const prefix=`${this.id}-iteration-${iteration}`;const spmv=new GPUAdaptiveSpMV({id:`${prefix}-spmv`,rowOffsets,columnIndices,values,vector:p,output:q,columns,statistics:spmvStatistics});spmvStrategy=spmv.getStrategy(graph).id;spmv.addToGraph(graph);
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
    return{residualSquared,initialResidualSquared,spmvStrategy};
  }
}
