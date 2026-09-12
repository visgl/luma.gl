// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUCompositeOperation,type GPUOperation,type GPUProgramOperation,type GPUOperationMetadata} from './gpu-operation';
import type {GPUProgramScalar} from './gpu-program-value';

/** Semantic boolean predicate backed by a logical uint32 program scalar (zero=false, nonzero=true). */
export type GPUOperationPredicate = {
  id: string;
  value: GPUProgramScalar<'uint32'>;
  expression?: string;
};
export type GPUControlFlowLowering = 'auto' | 'unroll' | 'dynamic-gpu';

export class GPUConditionalOperation extends GPUCompositeOperation {
  override readonly type:string='conditional';readonly predicate:GPUOperationPredicate;readonly lowering:GPUControlFlowLowering;
  constructor(props:{id?:string;predicate:GPUOperationPredicate;body:GPUProgramOperation|readonly GPUProgramOperation[];metadata?:GPUOperationMetadata;lowering?:GPUControlFlowLowering}){const operations=Array.isArray(props.body)?props.body:[props.body as GPUProgramOperation];super({id:props.id??'gpu-conditional-operation',operations,metadata:props.metadata});this.predicate=Object.freeze({...props.predicate});this.lowering=props.lowering??'auto';}
}
export class GPULoopOperation extends GPUCompositeOperation {
  override readonly type:string='loop';readonly predicate?:GPUOperationPredicate;readonly maximumIterations:number;readonly minimumIterations:number;readonly lowering:GPUControlFlowLowering;
  constructor(props:{id?:string;body:GPUProgramOperation|readonly GPUProgramOperation[];predicate?:GPUOperationPredicate;maximumIterations:number;minimumIterations?:number;metadata?:GPUOperationMetadata;lowering?:GPUControlFlowLowering}){const operations=Array.isArray(props.body)?props.body:[props.body as GPUProgramOperation];super({id:props.id??'gpu-loop-operation',operations,metadata:props.metadata});if(!Number.isSafeInteger(props.maximumIterations)||props.maximumIterations<1)throw new Error(`${this.id} maximumIterations must be a positive safe integer`);const minimumIterations=props.minimumIterations??0;if(!Number.isSafeInteger(minimumIterations)||minimumIterations<0||minimumIterations>props.maximumIterations)throw new Error(`${this.id} minimumIterations must be between zero and maximumIterations`);this.predicate=props.predicate?Object.freeze({...props.predicate}):undefined;this.maximumIterations=props.maximumIterations;this.minimumIterations=minimumIterations;this.lowering=props.lowering??'auto';}
}
export function isGPUControlFlowOperation(operation:GPUOperation):operation is GPUConditionalOperation|GPULoopOperation{return operation.type==='conditional'||operation.type==='loop';}
