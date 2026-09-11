// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer,type Device} from '@luma.gl/core';
import {GPUCommandGraph,type GraphDataView} from './gpu-command-graph';
import {addGPUCommandNodes,type GPUCommandNode,type GPUCommandNodeProducer} from './gpu-command-node';
import {createTransientView} from './graph-data-view-utils';
import {GPUScalarDispatchGate} from './gpu-scalar-dispatch-gate';
import {createGPUScalar,type GPUScalar} from './gpu-scalar';
import {GPUScalarCompute} from './gpu-scalar-operation';
import {GPUScalarLiteral} from './gpu-scalar-literal';
import {GPUVectorScalarMADD} from './gpu-elementwise-scalar';
import {GPUDotProductScalar} from './gpu-dot-product-scalar';
import {GPUAdaptiveSpMV} from './gpu-adaptive-spmv';
import {GPUPredicateConjunction} from './gpu-predicate-conjunction';
import {GPUGroupAggregation} from './gpu-group-aggregation';
import {GPUProgramScalarOperation} from './gpu-semantic-scalar-operation';
import {GPUProgramScalarLiteral} from './gpu-semantic-state-operation';
import {GPUProgramVectorMADD,GPUProgramDotProduct} from './gpu-semantic-vector-operation';
import {GPUProgramSpMV} from './gpu-semantic-spmv';
import {GPUProgramGroupCount} from './gpu-semantic-group-operation';
import {setGPUComputeDispatchWorkgroups,getGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';
import {GPUCompositeOperation,isGPUCommandGraphContributor,isGPUOperation,type GPUProgramOperation,type GPUOperationTree} from './gpu-operation';
import {GPUConditionalOperation,GPULoopOperation,type GPUOperationPredicate} from './gpu-control-flow-operation';
import {GPUOperationLoweringRegistry,type GPUOperationLoweringDecision,type GPUProgramBackendCapabilities} from './gpu-program-lowering';
import {validateGPUProgram,type GPUProgramValidationReport} from './gpu-program-validation';
import type {GPUProgramScalar,GPUProgramVector} from './gpu-program-value';
import type {GPUProgram} from './gpu-program';

export type GPUProgramBindings={vectors?:Readonly<Record<string,Buffer>>};
export type GPUProgramLoweredNode={nodeId:string;nodeType:'compute'|'render'|'copy';operationPath:readonly string[]};
export type GPUProgramLoweringReport={operations:readonly GPUOperationTree[];nodes:readonly GPUProgramLoweredNode[];decisions:readonly GPUOperationLoweringDecision[]};
export type GPUProgramCompilation<Parameters=void>={program:GPUProgram;graph:GPUCommandGraph<Parameters>;scalars:ReadonlyMap<string,GPUScalar>;vectors:ReadonlyMap<string,GraphDataView>;validation:GPUProgramValidationReport;lowering:GPUProgramLoweringReport};
type LoweringState={path:string[];nodes:GPUProgramLoweredNode[];decisions:GPUOperationLoweringDecision[];predicates:GPUOperationPredicate[];scalars:Map<string,GPUScalar>;vectors:Map<string,GraphDataView>;predicateConjunctions:Map<string,GPUScalar<'uint32'>>};

export class GPUProgramCompiler<Parameters=void>{
  readonly device:Device;
  readonly capabilities:GPUProgramBackendCapabilities;
  readonly lowerings=new GPUOperationLoweringRegistry<Parameters>();

  constructor(device:Device){
    this.device=device;
    this.capabilities=Object.freeze({backend:'webgpu',gpuConditionals:true,nativeLoops:false,childGraphs:false});
    this.registerCoreLowerings();
  }

  /** Transforms a semantic program into a new mutable command graph. */
  transform(program:GPUProgram,bindings?:GPUProgramBindings):GPUProgramCompilation<Parameters>;
  /** Transforms a semantic program directly into an existing mutable command graph. */
  transform(program:GPUProgram,graph:GPUCommandGraph<Parameters>,bindings?:GPUProgramBindings):GPUProgramCompilation<Parameters>;
  transform(program:GPUProgram,graphOrBindings:GPUCommandGraph<Parameters>|GPUProgramBindings={},bindings:GPUProgramBindings={}):GPUProgramCompilation<Parameters>{
    const graph=graphOrBindings instanceof GPUCommandGraph?graphOrBindings:new GPUCommandGraph<Parameters>(this.device,{id:`${program.id}-commands`});
    const resolvedBindings=graphOrBindings instanceof GPUCommandGraph?bindings:graphOrBindings;
    const validation=validateGPUProgram(program,resolvedBindings);
    if(!validation.valid)throw new Error(`GPUProgram "${program.id}" validation failed: ${validation.issues.filter(i=>i.level==='error').map(i=>i.message).join('; ')}`);

    const scalars=new Map<string,GPUScalar>();
    for(const scalar of program.scalars)scalars.set(scalar.id,createGPUScalar(graph,scalar.id,scalar.format));
    const vectors=new Map<string,GraphDataView>();
    for(const vector of program.vectors){
      if(vector.external){
        const buffer=resolvedBindings.vectors![vector.id];
        if(buffer.byteLength<Math.max(1,vector.length)*4)throw new Error(`GPUProgram external vector "${vector.id}" buffer is too small`);
        const handle=graph.importBuffer({id:vector.id,byteLength:buffer.byteLength,usage:buffer.usage},buffer);
        vectors.set(vector.id,graph.createDataView(handle,{format:vector.format,length:vector.length}));
      }else vectors.set(vector.id,createTransientView(graph,vector.id,vector.format,vector.length));
    }
    const state:LoweringState={path:[],nodes:[],decisions:[],predicates:[],scalars,vectors,predicateConjunctions:new Map()};
    for(const operation of program.operations)this.lower(graph,operation,state);
    return Object.freeze({program,graph,scalars,vectors,validation,lowering:Object.freeze({operations:program.operationTree,nodes:Object.freeze(state.nodes.map(node=>Object.freeze({...node,operationPath:Object.freeze([...node.operationPath])}))),decisions:Object.freeze(state.decisions.map(decision=>Object.freeze({...decision})))})});
  }

  protected registerCoreLowerings():void{
    this.lowerings.register<GPUProgramScalarLiteral>('scalar-literal',(o,c)=>{const e=new GPUScalarLiteral({id:o.id,output:c.resolveScalar(o.props.output),value:o.props.value});this.emitProducer(c.graph,e,[[1,1,1]],this.currentState!);c.recordDecision({operationId:o.id,operationType:o.type,lowering:'webgpu-scalar-literal',reason:'host-known literal transforms to one compute command node'});});
    this.lowerings.register<GPUProgramScalarOperation>('scalar-operation',(o,c)=>{const e=new GPUScalarCompute({id:o.id,operation:o.operation,left:c.resolveScalar(o.left),right:o.right?c.resolveScalar(o.right):undefined,output:c.resolveScalar(o.output)});this.emitProducer(c.graph,e,[[1,1,1]],this.currentState!);c.recordDecision({operationId:o.id,operationType:o.type,lowering:'webgpu-scalar-kernel',reason:'scalar operation transforms to one compute command node'});});
    this.lowerings.register<GPUProgramVectorMADD>('vector-madd',(o,c)=>{const p=o.props,e=new GPUVectorScalarMADD({id:o.id,input:c.resolveVector(p.input),scale:c.resolveScalar(p.scale),addend:c.resolveVector(p.addend),output:c.resolveVector(p.output)});this.emitProducer(c.graph,e,[[Math.max(1,Math.ceil(p.output.length/256)),1,1]],this.currentState!);c.recordDecision({operationId:o.id,operationType:o.type,lowering:'webgpu-vector-madd',reason:'dense float32 MADD transforms through explicit command nodes'});});
    this.lowerings.register<GPUProgramDotProduct>('dot-product',(o,c)=>{const p=o.props,e=new GPUDotProductScalar({id:o.id,left:c.resolveVector(p.left),right:c.resolveVector(p.right),output:c.resolveScalar(p.output)});this.emitProducer(c.graph,e,[[1,1,1]],this.currentState!);c.recordDecision({operationId:o.id,operationType:o.type,lowering:'webgpu-fused-dot',reason:'dot product transforms through one explicit command node'});});
    this.lowerings.register<GPUProgramSpMV>('spmv',(o,c)=>{const p=o.props,m=p.matrix,e=new GPUAdaptiveSpMV({id:o.id,rowOffsets:c.resolveVector(m.rowOffsets),columnIndices:c.resolveVector(m.columnIndices),values:c.resolveVector(m.values),vector:c.resolveVector(p.vector),output:c.resolveVector(p.output),columns:m.columns,statistics:m.statistics,strategy:p.strategy});const d=e.getStrategy(c.graph);let dispatches:[number,number,number][];if(d.id==='scalar-row'||d.id==='subgroup-row')dispatches=[[Math.ceil(m.rows/d.details.rowsPerWorkgroup),1,1]];else if(d.id==='workgroup-row')dispatches=[[m.rows,1,1]];else dispatches=[[m.rows*d.details.workgroupsPerLongRow,1,1],[Math.ceil(m.rows/64),1,1]];this.emitProducer(c.graph,e,dispatches,this.currentState!);c.recordDecision({operationId:o.id,operationType:o.type,lowering:`webgpu-spmv:${d.id}`,reason:d.reason});});
    this.lowerings.register<GPUProgramGroupCount>('group-count',(o,c)=>{new GPUGroupAggregation({id:o.id,keys:c.resolveVector(o.props.keys),mask:c.resolveVector(o.props.mask),output:c.resolveVector(o.props.output),operation:'count'}).addToGraph(c.graph);c.recordDecision({operationId:o.id,operationType:o.type,lowering:'webgpu-dense-group-count',reason:'dense group count transforms to GPUGroupAggregation command work'});});
    this.lowerings.register<GPUConditionalOperation>('conditional',(o,c)=>{c.recordDecision({operationId:o.id,operationType:o.type,lowering:'gpu-indirect-gate',reason:'WebGPU realizes runtime predicates with zero/nonzero indirect dispatch'});for(const child of o.operations)c.lowerConditional(o.predicate,child);});
    this.lowerings.register<GPULoopOperation>('loop',(o,c)=>{if(!o.predicate||o.lowering==='unroll'){c.recordDecision({operationId:o.id,operationType:o.type,lowering:'bounded-unroll',reason:o.predicate?'explicit unroll preference':'loop has no runtime predicate'});for(let i=0;i<o.maximumIterations;i++)for(const child of o.operations)c.lower(child);return;}c.recordDecision({operationId:o.id,operationType:o.type,lowering:'gpu-gated-bounded-sequence',reason:'WebGPU has indirect dispatch but no native graph loop'});for(let i=0;i<o.maximumIterations;i++){const gated=i>=o.minimumIterations;for(const child of o.operations)gated?c.lowerConditional(o.predicate,child):c.lower(child);}});
  }

  private currentState:LoweringState|null=null;

  protected lower(graph:GPUCommandGraph<Parameters>,operation:GPUProgramOperation,state:LoweringState):void{
    const id='id'in operation&&typeof operation.id==='string'?operation.id:operation.constructor?.name??'legacy-contributor';
    state.path.push(id);
    const previousState=this.currentState;
    this.currentState=state;
    try{
      if(operation instanceof GPUCompositeOperation&&operation.type==='composite'){
        state.decisions.push({operationId:operation.id,operationType:operation.type,lowering:'flatten',reason:'WebGPU has no executable child-graph primitive'});
        for(const child of operation.operations)this.lower(graph,child,state);
        return;
      }
      if(isGPUOperation(operation)){
        const lowerer=this.lowerings.get(operation.type);
        if(lowerer){
          lowerer(operation,{graph,capabilities:this.capabilities,lower:child=>this.lower(graph,child,state),lowerConditional:(predicate,child)=>{state.predicates.push(predicate);try{this.lower(graph,child,state);}finally{state.predicates.pop();}},resolveScalar:s=>this.resolveScalar(s,state),resolveVector:v=>this.resolveVector(v,state),recordDecision:d=>state.decisions.push(d)});
          return;
        }
      }
      if(isGPUCommandGraphContributor(operation)){
        if(state.predicates.length)throw new Error(`legacy command-graph contributor "${id}" cannot be transformed inside semantic runtime control flow; migrate it to GPUCommandNodeProducer`);
        state.decisions.push({operationId:id,operationType:'legacy-contributor',lowering:'legacy-addToGraph',reason:'compatibility bridge; migrate contributor to GPUCommandNodeProducer'});
        operation.addToGraph(graph);
        return;
      }
      throw new Error(`GPUProgram operation "${id}" has no WebGPU transform`);
    }finally{
      this.currentState=previousState;
      state.path.pop();
    }
  }

  private emitProducer(graph:GPUCommandGraph<Parameters>,producer:GPUCommandNodeProducer<Parameters>,dispatches:[number,number,number][],state:LoweringState):void{
    const nodes=producer.getCommandNodes(graph);
    if(nodes.length!==dispatches.length)throw new Error(`transform produced ${nodes.length} command nodes but declared ${dispatches.length} dispatches`);
    const decorated=nodes.map((node,index)=>this.decorateNode(graph,this.attachDispatch(node,dispatches[index]),state));
    addGPUCommandNodes(graph,decorated);
  }

  private attachDispatch(node:GPUCommandNode<Parameters>,dispatch:[number,number,number]):GPUCommandNode<Parameters>{
    if(node.type!=='compute')throw new Error(`dispatch geometry can only be attached to compute command nodes; got ${node.type} node "${node.id}"`);
    return setGPUComputeDispatchWorkgroups(node,dispatch) as GPUCommandNode<Parameters>;
  }

  private decorateNode(graph:GPUCommandGraph<Parameters>,node:GPUCommandNode<Parameters>,state:LoweringState):GPUCommandNode<Parameters>{
    state.nodes.push({nodeId:node.id,nodeType:node.type,operationPath:[...state.path]});
    if(node.type!=='compute'||!state.predicates.length)return node;
    if(node.condition)throw new Error(`compute node "${node.id}" already has condition`);
    const workgroups=getGPUComputeDispatchWorkgroups(node);
    if(!workgroups)throw new Error(`compute node "${node.id}" under runtime predicate must declare exact dispatch geometry`);
    let active:GPUScalar<'uint32'>;
    if(state.predicates.length===1){
      active=state.scalars.get(state.predicates[0].value.id) as GPUScalar<'uint32'>;
    }else{
      const key=state.predicates.map(p=>p.value.id).join('&&');
      let conjunction=state.predicateConjunctions.get(key);
      if(!conjunction){conjunction=createGPUScalar(graph,`predicate-and-${state.predicateConjunctions.size}`,'uint32');state.predicateConjunctions.set(key,conjunction);}
      const inputs=state.predicates.map(p=>state.scalars.get(p.value.id) as GPUScalar<'uint32'>);
      const support=new GPUPredicateConjunction({id:`${node.id}-predicate-and`,inputs,output:conjunction!}).getCommandNodes(graph).map(n=>this.attachDispatch(n,[1,1,1]));
      addGPUCommandNodes(graph,support);
      active=conjunction;
    }
    if(!active)throw new Error(`runtime predicate for "${node.id}" could not be resolved`);
    const gate=new GPUScalarDispatchGate(graph,{id:`${node.id}-predicate`,active,workgroups});
    const gateNodes=gate.getUpdateCommandNodes(graph,`${node.id}-predicate-update`).map(n=>this.attachDispatch(n,[1,1,1]));
    addGPUCommandNodes(graph,gateNodes);
    return{...node,condition:gate.condition};
  }

  private resolveScalar<T extends 'float32'|'uint32'|'sint32'>(s:GPUProgramScalar<T>,state:LoweringState):GPUScalar<T>{const r=state.scalars.get(s.id);if(!r||r.format!==s.format)throw new Error(`GPUProgram scalar "${s.id}" is not part of transform`);return r as GPUScalar<T>;}
  private resolveVector<T extends 'float32'|'uint32'|'sint32'>(v:GPUProgramVector<T>,state:LoweringState):GraphDataView<T>{const r=state.vectors.get(v.id);if(!r||r.format!==v.format||r.length!==v.length)throw new Error(`GPUProgram vector "${v.id}" is not part of transform`);return r as GraphDataView<T>;}
}
