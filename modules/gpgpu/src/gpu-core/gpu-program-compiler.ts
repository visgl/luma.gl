// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from './gpu-command-graph';
import {GPUCompositeOperation,isGPUCommandGraphContributor,type GPUProgramOperation,type GPUOperationTree} from './gpu-operation';
import type {GPUProgram} from './gpu-program';

export type GPUProgramLoweredNode={nodeId:string;nodeType:'compute'|'render'|'copy';operationPath:readonly string[]};
export type GPUProgramLoweringReport={operations:readonly GPUOperationTree[];nodes:readonly GPUProgramLoweredNode[]};
export type GPUProgramCompilation<Parameters=void>={program:GPUProgram;graph:GPUCommandGraph<Parameters>;lowering:GPUProgramLoweringReport};

/**
 * Lowers backend-independent semantic programs into WebGPU command graphs.
 *
 * This first compiler intentionally uses existing `addToGraph()` contributors as a migration
 * adapter. Native semantic operations without a registered lowering are rejected rather than being
 * allowed to mutate the command graph themselves.
 */
export class GPUProgramCompiler<Parameters=void>{
  readonly device:Device;
  constructor(device:Device){this.device=device;}
  compile(program:GPUProgram):GPUProgramCompilation<Parameters>{
    const graph=new GPUCommandGraph<Parameters>(this.device,{id:`${program.id}-commands`});
    const state:{path:string[];nodes:GPUProgramLoweredNode[]}={path:[],nodes:[]};
    const restore=instrumentGraph(graph,state);
    try{for(const operation of program.operations)this.lower(graph,operation,state);}finally{restore();}
    return Object.freeze({program,graph,lowering:Object.freeze({operations:program.operationTree,nodes:Object.freeze(state.nodes.map(node=>Object.freeze({...node,operationPath:Object.freeze([...node.operationPath])})))})});
  }
  protected lower(graph:GPUCommandGraph<Parameters>,operation:GPUProgramOperation,state:{path:string[];nodes:GPUProgramLoweredNode[]}):void{
    const id='id'in operation&&typeof operation.id==='string'?operation.id:operation.constructor?.name??'legacy-contributor';
    state.path.push(id);
    try{
      if(operation instanceof GPUCompositeOperation){for(const child of operation.operations)this.lower(graph,child,state);return;}
      if(isGPUCommandGraphContributor(operation)){operation.addToGraph(graph);return;}
      throw new Error(`GPUProgram operation "${id}" (${operation.type}) has no WebGPU lowering`);
    }finally{state.path.pop();}
  }
}

function instrumentGraph<Parameters>(graph:GPUCommandGraph<Parameters>,state:{path:string[];nodes:GPUProgramLoweredNode[]}):()=>void{
  const target=graph as any;const originals:Record<string,Function>={};
  for(const[method,nodeType]of[['addComputePass','compute'],['addRenderPass','render'],['addCopyPass','copy']]as const){const original=target[method];if(typeof original!=='function')continue;originals[method]=original;target[method]=function(node:{id:string},...rest:unknown[]){if(state.path.length)state.nodes.push({nodeId:node.id,nodeType,operationPath:[...state.path]});return original.call(graph,node,...rest);};}
  return()=>{for(const[method,original]of Object.entries(originals))target[method]=original;};
}
