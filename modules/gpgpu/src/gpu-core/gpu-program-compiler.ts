// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from './gpu-command-graph';
import {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';
import {createGPUScalar,type GPUScalar} from './gpu-scalar';
import {getGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';
import {GPUCompositeOperation,isGPUCommandGraphContributor,isGPUOperation,type GPUProgramOperation,type GPUOperationTree} from './gpu-operation';
import {GPUConditionalOperation,GPULoopOperation,type GPUOperationPredicate} from './gpu-control-flow-operation';
import {GPUOperationLoweringRegistry,type GPUOperationLoweringDecision,type GPUProgramBackendCapabilities} from './gpu-program-lowering';
import type {GPUProgramScalar} from './gpu-program-value';
import type {GPUProgram} from './gpu-program';

export type GPUProgramLoweredNode={nodeId:string;nodeType:'compute'|'render'|'copy';operationPath:readonly string[]};
export type GPUProgramLoweringReport={operations:readonly GPUOperationTree[];nodes:readonly GPUProgramLoweredNode[];decisions:readonly GPUOperationLoweringDecision[]};
export type GPUProgramCompilation<Parameters=void>={program:GPUProgram;graph:GPUCommandGraph<Parameters>;scalars:ReadonlyMap<string,GPUScalar>;lowering:GPUProgramLoweringReport};

type LoweringState={path:string[];nodes:GPUProgramLoweredNode[];decisions:GPUOperationLoweringDecision[];predicates:GPUOperationPredicate[];scalars:Map<string,GPUScalar>;suppressInstrumentation:boolean};

/** WebGPU compiler from semantic GPUProgram to executable GPUCommandGraph. */
export class GPUProgramCompiler<Parameters=void>{
  readonly device:Device;readonly capabilities:GPUProgramBackendCapabilities;readonly lowerings=new GPUOperationLoweringRegistry<Parameters>();
  constructor(device:Device){this.device=device;this.capabilities=Object.freeze({backend:'webgpu',gpuConditionals:true,nativeLoops:false,childGraphs:false});this.registerCoreLowerings();}
  compile(program:GPUProgram):GPUProgramCompilation<Parameters>{
    const graph=new GPUCommandGraph<Parameters>(this.device,{id:`${program.id}-commands`});
    const scalars=new Map<string,GPUScalar>();for(const scalar of program.scalars)scalars.set(scalar.id,createGPUScalar(graph,scalar.id,scalar.format));
    const state:LoweringState={path:[],nodes:[],decisions:[],predicates:[],scalars,suppressInstrumentation:false};const restore=instrumentGraph(graph,state);
    try{for(const operation of program.operations)this.lower(graph,operation,state);}finally{restore();}
    return Object.freeze({program,graph,scalars,lowering:Object.freeze({operations:program.operationTree,nodes:Object.freeze(state.nodes.map(node=>Object.freeze({...node,operationPath:Object.freeze([...node.operationPath])}))),decisions:Object.freeze(state.decisions.map(decision=>Object.freeze({...decision})))})});
  }
  protected registerCoreLowerings():void{
    this.lowerings.register<GPUConditionalOperation>('conditional',(operation,context)=>{context.recordDecision({operationId:operation.id,operationType:operation.type,lowering:'gpu-indirect-gate',reason:'WebGPU realizes runtime predicates with zero/nonzero indirect dispatch'});for(const child of operation.operations)context.lowerConditional(operation.predicate,child);});
    this.lowerings.register<GPULoopOperation>('loop',(operation,context)=>{
      if(!operation.predicate||operation.lowering==='unroll'){context.recordDecision({operationId:operation.id,operationType:operation.type,lowering:'bounded-unroll',reason:operation.predicate?'explicit unroll preference':'loop has no runtime predicate'});for(let i=0;i<operation.maximumIterations;i++)for(const child of operation.operations)context.lower(child);return;}
      context.recordDecision({operationId:operation.id,operationType:operation.type,lowering:'gpu-gated-bounded-sequence',reason:'WebGPU has indirect dispatch but no native graph loop'});
      for(let i=0;i<operation.maximumIterations;i++){const gated=i>=operation.minimumIterations;for(const child of operation.operations){if(gated)context.lowerConditional(operation.predicate,child);else context.lower(child);}}
    });
  }
  protected lower(graph:GPUCommandGraph<Parameters>,operation:GPUProgramOperation,state:LoweringState):void{
    const id='id'in operation&&typeof operation.id==='string'?operation.id:operation.constructor?.name??'legacy-contributor';state.path.push(id);
    try{
      if(operation instanceof GPUCompositeOperation&&operation.type==='composite'){state.decisions.push({operationId:operation.id,operationType:operation.type,lowering:'flatten',reason:'WebGPU command graphs have no executable child-graph primitive'});for(const child of operation.operations)this.lower(graph,child,state);return;}
      if(isGPUOperation(operation)){const lowerer=this.lowerings.get(operation.type);if(lowerer){lowerer(operation,{graph,capabilities:this.capabilities,lower:child=>this.lower(graph,child,state),lowerConditional:(predicate,child)=>{state.predicates.push(predicate);try{this.lower(graph,child,state);}finally{state.predicates.pop();}},resolveScalar:scalar=>this.resolveScalar(scalar,state),recordDecision:decision=>state.decisions.push(decision)});return;}}
      if(isGPUCommandGraphContributor(operation)){state.decisions.push({operationId:id,operationType:'legacy-contributor',lowering:'legacy-addToGraph',reason:'migration adapter for existing WebGPU algorithm'});operation.addToGraph(graph);return;}
      throw new Error(`GPUProgram operation "${id}" (${isGPUOperation(operation)?operation.type:'unknown'}) has no WebGPU lowering`);
    }finally{state.path.pop();}
  }
  private resolveScalar<T extends 'float32'|'uint32'|'sint32'>(scalar:GPUProgramScalar<T>,state:LoweringState):GPUScalar<T>{const resolved=state.scalars.get(scalar.id);if(!resolved)throw new Error(`GPUProgram scalar "${scalar.id}" is not part of this compilation`);if(resolved.format!==scalar.format)throw new Error(`GPUProgram scalar "${scalar.id}" format mismatch`);return resolved as GPUScalar<T>;}
}

function instrumentGraph<Parameters>(graph:GPUCommandGraph<Parameters>,state:LoweringState):()=>void{
  const target=graph as any;const originals:Record<string,Function>={};
  for(const[method,nodeType]of[['addComputePass','compute'],['addRenderPass','render'],['addCopyPass','copy']]as const){const original=target[method];if(typeof original!=='function')continue;originals[method]=original;target[method]=function(node:{id:string;condition?:unknown},...rest:unknown[]){
    if(state.suppressInstrumentation)return original.call(graph,node,...rest);
    if(state.path.length)state.nodes.push({nodeId:node.id,nodeType,operationPath:[...state.path]});
    if(state.predicates.length){if(nodeType!=='compute')throw new Error(`runtime GPU predicate cannot condition ${nodeType} node "${node.id}" on WebGPU`);if(node.condition)throw new Error(`compute node "${node.id}" already has an execution condition`);if(state.predicates.length!==1)throw new Error(`nested runtime GPU predicates require predicate conjunction lowering`);const workgroups=getGPUComputeDispatchWorkgroups(node);if(!workgroups)throw new Error(`compute node "${node.id}" under a runtime predicate must declare exact dispatch geometry with setGPUComputeDispatchWorkgroups()`);const predicate=state.predicates[0];const active=state.scalars.get(predicate.value.id);if(!active||active.format!=='uint32')throw new Error(`predicate "${predicate.id}" requires a compiled uint32 scalar`);const gate=new GPUScalarDispatchGate(graph,{id:`${node.id}-predicate`,active:active as GPUScalar<'uint32'>,workgroups});state.suppressInstrumentation=true;try{gate.addUpdateToGraph(graph,`${node.id}-predicate-update`);}finally{state.suppressInstrumentation=false;}node={...node,condition:gate.condition};}
    return original.call(graph,node,...rest);
  };}
  return()=>{for(const[method,original]of Object.entries(originals))target[method]=original;};
}
