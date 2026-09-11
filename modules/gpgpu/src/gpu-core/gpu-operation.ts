// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCommandGraph, type GPUCommandGraphContributor} from './gpu-command-graph';

export type GPUOperationResource = {name:string;kind?:string;format?:string;shape?:readonly number[]};
export type GPUOperationWorkload = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationConstraints = Readonly<Record<string, number | string | boolean>>;
export type GPUOperationMetadata = {inputs?:readonly GPUOperationResource[];outputs?:readonly GPUOperationResource[];workload?:GPUOperationWorkload;constraints?:GPUOperationConstraints};

export interface GPUOperation extends GPUCommandGraphContributor {readonly id:string;readonly type:string;readonly metadata?:GPUOperationMetadata;}
export type GPUOperationContributor = GPUOperation | GPUCommandGraphContributor;
export type GPUOperationLike = GPUOperationContributor | readonly GPUOperationLike[];

/** Semantic hierarchy. Grouping never implies synchronization. */
export class GPUCompositeOperation implements GPUOperation {
  readonly id:string;
  readonly type:string='composite';
  readonly operations:readonly GPUOperationContributor[];
  readonly metadata?:GPUOperationMetadata;
  constructor(props:readonly GPUOperationContributor[]|{id?:string;operations:readonly GPUOperationContributor[];metadata?:GPUOperationMetadata}){
    const normalized=Array.isArray(props)?{operations:props}:props;
    this.id=normalized.id??'gpu-composite-operation';
    this.operations=Object.freeze([...normalized.operations]);
    this.metadata=normalized.metadata;
  }
  addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{for(const operation of this.operations)operation.addToGraph(graph);}
}

export type GPUOperationTree={id:string;type:string;metadata?:GPUOperationMetadata;children?:readonly GPUOperationTree[]};
const graphOperations=new WeakMap<GPUCommandGraph<unknown>,GPUOperationContributor[]>();
export function getGPUCommandGraphOperationTree(graph:GPUCommandGraph<unknown>):readonly GPUOperationTree[]{return Object.freeze((graphOperations.get(graph)??[]).map(getOperationTree));}
function getOperationTree(operation:GPUOperationContributor):GPUOperationTree{if(operation instanceof GPUCompositeOperation){return Object.freeze({id:operation.id,type:operation.type,...(operation.metadata?{metadata:operation.metadata}:{}),children:Object.freeze(operation.operations.map(getOperationTree))});}if(isGPUOperation(operation)){return Object.freeze({id:operation.id,type:operation.type,...(operation.metadata?{metadata:operation.metadata}:{})});}return Object.freeze({id:operation.constructor?.name??'gpu-command-graph-contributor',type:'contributor'});}
export function isGPUOperation(operation:GPUOperationContributor):operation is GPUOperation{const candidate=operation as Partial<GPUOperation>;return typeof candidate.id==='string'&&typeof candidate.type==='string';}
function addOperationLike<Parameters>(graph:GPUCommandGraph<Parameters>,operation:GPUOperationLike):void{if(Array.isArray(operation)){for(const child of operation)addOperationLike(graph,child);return;}let operations=graphOperations.get(graph as GPUCommandGraph<unknown>);if(!operations){operations=[];graphOperations.set(graph as GPUCommandGraph<unknown>,operations);}operations.push(operation as GPUOperationContributor);(operation as GPUOperationContributor).addToGraph(graph);}
declare module './gpu-command-graph'{interface GPUCommandGraph<Parameters=void>{add(operation:GPUOperationLike):this;readonly operations:readonly GPUOperationTree[];}}
if(!GPUCommandGraph.prototype.add){GPUCommandGraph.prototype.add=function<Parameters>(this:GPUCommandGraph<Parameters>,operation:GPUOperationLike):GPUCommandGraph<Parameters>{addOperationLike(this,operation);return this;};Object.defineProperty(GPUCommandGraph.prototype,'operations',{get(this:GPUCommandGraph<unknown>){return getGPUCommandGraphOperationTree(this);}});}
