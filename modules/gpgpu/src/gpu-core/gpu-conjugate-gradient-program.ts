// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUProgram} from './gpu-program';
import {GPUCompositeOperation} from './gpu-operation';
import {GPULoopOperation} from './gpu-control-flow-operation';
import {GPUProgramScalarLiteral} from './gpu-semantic-state-operation';
import {GPUProgramScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUProgramDotProduct,GPUProgramVectorMADD} from './gpu-semantic-vector-operation';
import {GPUProgramCSRMatrix,GPUProgramSpMV} from './gpu-semantic-spmv';
import type {GPUSpMVRowStatistics} from './gpu-spmv-strategy';

/** Builds a complete backend-independent convergence-controlled conjugate-gradient program. */
export function createGPUConjugateGradientProgram(props:{id?:string;size:number;nonZeros:number;maxIterations:number;toleranceSquared:number;statistics?:GPUSpMVRowStatistics}) {
  const id=props.id??'gpu-conjugate-gradient';if(!Number.isSafeInteger(props.size)||props.size<1)throw new Error(`${id} size must be positive`);if(!Number.isSafeInteger(props.nonZeros)||props.nonZeros<0)throw new Error(`${id} nonZeros must be non-negative`);if(!Number.isSafeInteger(props.maxIterations)||props.maxIterations<1)throw new Error(`${id} maxIterations must be positive`);if(!(props.toleranceSquared>0))throw new Error(`${id} toleranceSquared must be positive`);
  const n=props.size,program=new GPUProgram({id});
  const rowOffsets=program.vector(`${id}-row-offsets`,'uint32',n+1,{external:true}),columnIndices=program.vector(`${id}-column-indices`,'uint32',props.nonZeros,{external:true}),values=program.vector(`${id}-values`,'float32',props.nonZeros,{external:true}),rhs=program.vector(`${id}-rhs`,'float32',n,{external:true}),solution=program.vector(`${id}-x`,'float32',n,{external:true});
  const matrix=new GPUProgramCSRMatrix({id:`${id}-matrix`,rows:n,columns:n,rowOffsets,columnIndices,values,statistics:props.statistics});
  const ax=program.vector(`${id}-ax`,'float32',n),residual=program.vector(`${id}-r`,'float32',n),search=program.vector(`${id}-p`,'float32',n),q=program.vector(`${id}-q`,'float32',n);
  const rr=program.scalar(`${id}-rr`,'float32'),pq=program.scalar(`${id}-pq`,'float32'),alpha=program.scalar(`${id}-alpha`,'float32'),newRR=program.scalar(`${id}-new-rr`,'float32'),beta=program.scalar(`${id}-beta`,'float32'),negAlpha=program.scalar(`${id}-neg-alpha`,'float32'),minusOne=program.scalar(`${id}-minus-one`,'float32'),tolerance=program.scalar(`${id}-tolerance-squared`,'float32'),active=program.scalar(`${id}-active`,'uint32');
  program.add([new GPUProgramScalarLiteral({output:minusOne,value:-1}),new GPUProgramScalarLiteral({output:tolerance,value:props.toleranceSquared}),new GPUProgramScalarLiteral({output:active,value:1}),new GPUProgramSpMV({id:`${id}-initial-spmv`,matrix,vector:solution,output:ax}),new GPUProgramVectorMADD({id:`${id}-initial-residual`,input:ax,scale:minusOne,addend:rhs,output:residual}),new GPUProgramVectorMADD({id:`${id}-initial-search`,input:ax,scale:minusOne,addend:rhs,output:search}),new GPUProgramDotProduct({id:`${id}-rr0`,left:residual,right:residual,output:rr})]);
  const body=new GPUCompositeOperation({id:`${id}-iteration`,operations:[new GPUProgramSpMV({id:`${id}-spmv`,matrix,vector:search,output:q}),new GPUProgramDotProduct({id:`${id}-pq`,left:search,right:q,output:pq}),new GPUProgramScalarOperation({id:`${id}-alpha`,operation:'divide',left:rr,right:pq,output:alpha}),new GPUProgramVectorMADD({id:`${id}-x-update`,input:search,scale:alpha,addend:solution,output:solution}),new GPUProgramScalarOperation({id:`${id}-neg-alpha`,operation:'multiply',left:alpha,right:minusOne,output:negAlpha}),new GPUProgramVectorMADD({id:`${id}-r-update`,input:q,scale:negAlpha,addend:residual,output:residual}),new GPUProgramDotProduct({id:`${id}-new-rr`,left:residual,right:residual,output:newRR}),new GPUProgramScalarOperation({id:`${id}-active`,operation:'greater-than',left:newRR,right:tolerance,output:active}),new GPUProgramScalarOperation({id:`${id}-beta`,operation:'divide',left:newRR,right:rr,output:beta}),new GPUProgramVectorMADD({id:`${id}-p-update`,input:search,scale:beta,addend:residual,output:search}),new GPUProgramScalarOperation({id:`${id}-rr-copy`,operation:'copy',left:newRR,output:rr})]});
  program.add(new GPULoopOperation({id:`${id}-loop`,body,predicate:{id:`${id}-continue`,source:'gpu',value:active,expression:'residualSquared > toleranceSquared'},maximumIterations:props.maxIterations,minimumIterations:1}));
  return {program,matrix,rowOffsets,columnIndices,values,rhs,solution};
}
