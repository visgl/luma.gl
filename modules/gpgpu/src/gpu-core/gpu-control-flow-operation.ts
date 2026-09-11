// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from './gpu-command-graph';
import {GPUCompositeOperation,type GPUOperation,type GPUOperationContributor,type GPUOperationMetadata} from './gpu-operation';

/** Semantic predicate. Execution realization is deliberately separate from the IR. */
export type GPUOperationPredicate = {
  id:string;
  /** Human-readable predicate expression for diagnostics, e.g. `residualSquared > toleranceSquared`. */
  expression?:string;
  /** Where the predicate value lives conceptually. */
  source:'cpu'|'gpu';
};

export type GPUControlFlowLowering='unroll'|'dynamic-gpu';

/** Executes a semantic body only when a predicate is true. */
export class GPUConditionalOperation extends GPUCompositeOperation {
  override readonly type:string='conditional';
  readonly predicate:GPUOperationPredicate;
  readonly lowering:GPUControlFlowLowering;
  constructor(props:{id?:string;predicate:GPUOperationPredicate;body:GPUOperationContributor|readonly GPUOperationContributor[];metadata?:GPUOperationMetadata;lowering?:GPUControlFlowLowering}){
    const operations=Array.isArray(props.body)?props.body:[props.body as GPUOperationContributor];
    super({id:props.id??'gpu-conditional-operation',operations,metadata:props.metadata});
    this.predicate=Object.freeze({...props.predicate});
    this.lowering=props.lowering??'dynamic-gpu';
  }
  override addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{
    if(this.lowering==='dynamic-gpu')throw new Error(`${this.id} requires operation-aware dynamic conditional lowering`);
    // `unroll` means the caller/compiler has already resolved the condition structurally.
    super.addToGraph(graph);
  }
}

/**
 * Semantic bounded loop. The body remains one operation hierarchy rather than being duplicated in
 * the IR. Lowering may unroll it or realize GPU-resident control flow.
 */
export class GPULoopOperation extends GPUCompositeOperation {
  override readonly type:string='loop';
  readonly predicate?:GPUOperationPredicate;
  readonly maximumIterations:number;
  readonly minimumIterations:number;
  readonly lowering:GPUControlFlowLowering;
  constructor(props:{id?:string;body:GPUOperationContributor|readonly GPUOperationContributor[];predicate?:GPUOperationPredicate;maximumIterations:number;minimumIterations?:number;metadata?:GPUOperationMetadata;lowering?:GPUControlFlowLowering}){
    const operations=Array.isArray(props.body)?props.body:[props.body as GPUOperationContributor];
    super({id:props.id??'gpu-loop-operation',operations,metadata:props.metadata});
    if(!Number.isSafeInteger(props.maximumIterations)||props.maximumIterations<1)throw new Error(`${this.id} maximumIterations must be a positive safe integer`);
    const minimumIterations=props.minimumIterations??0;
    if(!Number.isSafeInteger(minimumIterations)||minimumIterations<0||minimumIterations>props.maximumIterations)throw new Error(`${this.id} minimumIterations must be between zero and maximumIterations`);
    this.predicate=props.predicate?Object.freeze({...props.predicate}):undefined;
    this.maximumIterations=props.maximumIterations;
    this.minimumIterations=minimumIterations;
    this.lowering=props.lowering??(props.predicate?'dynamic-gpu':'unroll');
  }
  override addToGraph<Parameters>(graph:GPUCommandGraph<Parameters>):void{
    if(this.lowering==='dynamic-gpu')throw new Error(`${this.id} requires operation-aware dynamic loop lowering`);
    for(let iteration=0;iteration<this.maximumIterations;iteration++)super.addToGraph(graph);
  }
}

/** Useful type guard for future planners. */
export function isGPUControlFlowOperation(operation:GPUOperation):operation is GPUConditionalOperation|GPULoopOperation{return operation.type==='conditional'||operation.type==='loop';}
