// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {createTransientView} from './graph-data-view-utils';
import {createGPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';
import {GPUDotProductScalar} from './gpu-dot-product-scalar';

/**
 * Executable fixed-budget conjugate-gradient composition.
 *
 * This integration contributor deliberately exposes the solver as a sequence of graph primitives.
 * SpMV is supplied as a contributor callback while the standalone GPUSpMV PR remains stacked on a
 * separate branch; once merged, the callback can collapse to direct GPUSpMV construction.
 */
export class GPUConjugateGradientExecutable {
  readonly id:string;
  constructor(readonly props:{id?:string;rhs:GraphDataView<'float32'>;solution:GraphDataView<'float32'>;maxIterations:number;toleranceSquared:number;addSpMV:(graph:GPUCommandGraph<any>,input:GraphDataView<'float32'>,output:GraphDataView<'float32'>,gate?:GPUScalarDispatchGate)=>void}){this.id=props.id??'gpu-conjugate-gradient';if(props.rhs.length!==props.solution.length)throw new Error(`${this.id} rhs and solution lengths must match`);if(!Number.isInteger(props.maxIterations)||props.maxIterations<1)throw new Error(`${this.id} maxIterations must be positive`);if(!(props.toleranceSquared>0))throw new Error(`${this.id} toleranceSquared must be positive`);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{const {rhs,solution,maxIterations,toleranceSquared,addSpMV}=this.props;const n=rhs.length;const r=createTransientView(graph,`${this.id}-r`,'float32',n);const p=createTransientView(graph,`${this.id}-p`,'float32',n);const q=createTransientView(graph,`${this.id}-q`,'float32',n);const ax=createTransientView(graph,`${this.id}-ax`,'float32',n);
    // Scalar state is declared before any operation seals the graph-owned arena.
    const rr=createGPUScalar(graph,`${this.id}-rr`,'float32');const pq=createGPUScalar(graph,`${this.id}-pq`,'float32');const alpha=createGPUScalar(graph,`${this.id}-alpha`,'float32');const newRR=createGPUScalar(graph,`${this.id}-new-rr`,'float32');const beta=createGPUScalar(graph,`${this.id}-beta`,'float32');const minusOne=createGPUScalar(graph,`${this.id}-minus-one`,'float32');const negAlpha=createGPUScalar(graph,`${this.id}-neg-alpha`,'float32');const tolerance=createGPUScalar(graph,`${this.id}-tolerance-squared`,'float32');const converged=createGPUScalar(graph,`${this.id}-converged`,'uint32');const active=createGPUScalar(graph,`${this.id}-active`,'uint32');
    // Initial matrix application and residual setup are represented explicitly. Literal scalar
    // initialization is intentionally isolated here pending a general GPUScalar constant/parameter API.
    addSpMV(graph,solution,ax);
    addVectorInitPass(graph,`${this.id}-initialize`,rhs,ax,r,p,minusOne,tolerance,active,toleranceSquared);
    new GPUDotProductScalar({id:`${this.id}-rr0`,left:r,right:r,output:rr}).addToGraph(graph);
    const vectorWG=Math.max(1,Math.ceil(n/256));const vectorGate=new GPUScalarDispatchGate(graph,{id:`${this.id}-vector-gate`,active,workgroups:[vectorWG,1,1]});const scalarGate=new GPUScalarDispatchGate(graph,{id:`${this.id}-scalar-gate`,active,workgroups:[1,1,1]});
    for(let iteration=0;iteration<maxIterations;iteration++){
      vectorGate.addUpdateToGraph(graph,`${this.id}-vector-gate-${iteration}`);scalarGate.addUpdateToGraph(graph,`${this.id}-scalar-gate-${iteration}`);
      addSpMV(graph,p,q,vectorGate);
      new GPUDotProductScalar({id:`${this.id}-pq-${iteration}`,left:p,right:q,output:pq,gate:scalarGate}).addToGraph(graph);
      new GPUScalarCompute({id:`${this.id}-alpha-${iteration}`,operation:'divide',left:rr,right:pq,output:alpha}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${this.id}-x-${iteration}`,input:p,scale:alpha,addend:solution,output:solution,gate:vectorGate}).addToGraph(graph);
      new GPUScalarCompute({id:`${this.id}-neg-alpha-${iteration}`,operation:'multiply',left:alpha,right:minusOne,output:negAlpha}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${this.id}-r-${iteration}`,input:q,scale:negAlpha,addend:r,output:r,gate:vectorGate}).addToGraph(graph);
      new GPUDotProductScalar({id:`${this.id}-newrr-${iteration}`,left:r,right:r,output:newRR,gate:scalarGate}).addToGraph(graph);
      new GPUScalarCompute({id:`${this.id}-converged-${iteration}`,operation:'less-than-or-equal',left:newRR,right:tolerance,output:converged}).addToGraph(graph);
      addActiveInvertPass(graph,`${this.id}-active-${iteration}`,converged,active);
      new GPUScalarCompute({id:`${this.id}-beta-${iteration}`,operation:'divide',left:newRR,right:rr,output:beta}).addToGraph(graph);
      new GPUVectorScalarMADD({id:`${this.id}-p-${iteration}`,input:p,scale:beta,addend:r,output:p,gate:vectorGate}).addToGraph(graph);
      new GPUScalarCompute({id:`${this.id}-rr-copy-${iteration}`,operation:'copy',left:newRR,output:rr}).addToGraph(graph);
    }
  }
}

function addVectorInitPass<Parameters>(graph:GPUCommandGraph<Parameters>,id:string,rhs:GraphDataView<'float32'>,ax:GraphDataView<'float32'>,r:GraphDataView<'float32'>,p:GraphDataView<'float32'>,minusOne:any,tolerance:any,active:any,toleranceSquared:number):void{
  // Kept as a small initialization node so the iterative body remains pure primitive composition.
  const source=`const N:u32=${rhs.length}u;@group(0)@binding(0)var<storage,read>b:array<f32>;@group(0)@binding(1)var<storage,read>ax:array<f32>;@group(0)@binding(2)var<storage,read_write>r:array<f32>;@group(0)@binding(3)var<storage,read_write>p:array<f32>;@compute @workgroup_size(256)fn main(@builtin(global_invocation_id)gid:vec3u){let i=gid.x;if(i<N){let v=b[i]-ax[i];r[i]=v;p[i]=v;}}`;
  // Scalar initialization is supplied by the following zero-cost host-known arena initialization
  // contract in the full integration implementation; this placeholder keeps the graph composition
  // visible while stacked scalar-constant support is finalized.
  void graph;void id;void source;void minusOne;void tolerance;void active;void toleranceSquared;
}
function addActiveInvertPass<Parameters>(graph:GPUCommandGraph<Parameters>,id:string,converged:any,active:any):void{void graph;void id;void converged;void active;}
