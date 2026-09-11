// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from './gpu-command-graph';
import {
  GPUScalar,
  getGPUScalarWGSLLoad,
  getGPUScalarWGSLStore,
  getGPUValueArenaWGSLBinding
} from './gpu-scalar';

export type GPUScalarArithmeticOperation = 'copy'|'add'|'subtract'|'multiply'|'divide'|'sqrt'|'min'|'max';
export type GPUScalarComparisonOperation = 'equal'|'not-equal'|'less-than'|'less-than-or-equal'|'greater-than'|'greater-than-or-equal';
export type GPUScalarOperation = GPUScalarArithmeticOperation | GPUScalarComparisonOperation;
export type GPUScalarOperationProps = {id?:string;operation:GPUScalarOperation;left:GPUScalar;right?:GPUScalar;output:GPUScalar};

/** Arithmetic/comparison over arena-backed graph-native scalars. */
export class GPUScalarCompute {
  readonly id:string; readonly operation:GPUScalarOperation; readonly left:GPUScalar; readonly right?:GPUScalar; readonly output:GPUScalar;
  constructor(props:GPUScalarOperationProps){this.id=props.id??`gpu-scalar-${props.operation}`;this.operation=props.operation;this.left=props.left;this.right=props.right;this.output=props.output;validateOperation(this);}
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{
    const arena=this.left.arena;
    if(this.right&&this.right.arena!==arena)throw new Error(`${this.id} operands must belong to the same GPUValueArena`);
    if(this.output.arena!==arena)throw new Error(`${this.id} output must belong to the same GPUValueArena`);
    if(arena.graph!==(graph as unknown as GPUCommandGraph<unknown>))throw new Error(`${this.id} scalars must belong to the target graph`);
    const buffer=arena.buffer;
    const source=makeShaderSource(this);
    graph.addComputePass({id:this.id,workload:{operation:'GPUScalarCompute',commandCount:1,maximumWorkgroupCount:1,maximumInvocationCount:1,readByteLength:this.right?8:4,writeByteLength:4},resources:[{buffer,usage:'storage-write'}],compile:({device})=>{const computation=new Computation(device,{id:this.id,source,shaderLayout:{bindings:[{name:'gpuValues',type:'storage',group:0,location:0}]}});return{encode:({computePass,getBuffer})=>{const bindings:Record<string,Binding>={gpuValues:getBuffer(buffer)};computation.setBindings(bindings);computation.dispatch(computePass,1,1,1);},destroy:()=>computation.destroy()};}});
  }
}
function validateOperation(operation:GPUScalarCompute):void{const isUnary=operation.operation==='copy'||operation.operation==='sqrt';const isComparison=isComparisonOperation(operation.operation);if(!isUnary&&!operation.right)throw new Error(`${operation.id} ${operation.operation} requires a right operand`);if(isUnary&&operation.right)throw new Error(`${operation.id} ${operation.operation} does not accept a right operand`);if(operation.right&&operation.right.format!==operation.left.format)throw new Error(`${operation.id} input scalar formats must match`);if(operation.operation==='sqrt'&&operation.left.format!=='float32')throw new Error(`${operation.id} sqrt currently requires float32 input`);if(isComparison){if(operation.output.format!=='uint32')throw new Error(`${operation.id} comparison output must be uint32`);}else if(operation.output.format!==operation.left.format)throw new Error(`${operation.id} arithmetic output format must match input format`);}
function makeShaderSource(operation:GPUScalarCompute):string{const left=getGPUScalarWGSLLoad(operation.left);const right=operation.right?getGPUScalarWGSLLoad(operation.right):undefined;const expression=getExpression(operation.operation,left,right);const store=getGPUScalarWGSLStore(operation.output,expression);return `${getGPUValueArenaWGSLBinding(0,0)}\n@compute @workgroup_size(1) fn main(){${store}}`;}
function getExpression(operation:GPUScalarOperation,left:string,right?:string):string{switch(operation){case'copy':return left;case'add':return`(${left} + ${right})`;case'subtract':return`(${left} - ${right})`;case'multiply':return`(${left} * ${right})`;case'divide':return`(${left} / ${right})`;case'sqrt':return`sqrt(${left})`;case'min':return`min(${left}, ${right})`;case'max':return`max(${left}, ${right})`;case'equal':return`select(0u,1u,${left} == ${right})`;case'not-equal':return`select(0u,1u,${left} != ${right})`;case'less-than':return`select(0u,1u,${left} < ${right})`;case'less-than-or-equal':return`select(0u,1u,${left} <= ${right})`;case'greater-than':return`select(0u,1u,${left} > ${right})`;case'greater-than-or-equal':return`select(0u,1u,${left} >= ${right})`;}}
function isComparisonOperation(operation:GPUScalarOperation):operation is GPUScalarComparisonOperation{return ['equal','not-equal','less-than','less-than-or-equal','greater-than','greater-than-or-equal'].includes(operation as GPUScalarComparisonOperation);}
