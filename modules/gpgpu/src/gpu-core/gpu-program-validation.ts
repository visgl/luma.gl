// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUProgram} from './gpu-program';
import {GPUCompositeOperation,type GPUProgramOperation} from './gpu-operation';
import {GPUConditionalOperation,GPULoopOperation} from './gpu-control-flow-operation';
import type {GPUProgramBindings} from './gpu-program-compiler';
export type GPUProgramValidationIssue={level:'error'|'warning';code:string;message:string;operationId?:string;valueId?:string};
export type GPUProgramValidationReport={valid:boolean;issues:readonly GPUProgramValidationIssue[]};
/** Validates semantic structure and required external bindings before WebGPU graph allocation/lowering. */
export function validateGPUProgram(program:GPUProgram,bindings:GPUProgramBindings={}):GPUProgramValidationReport{const issues:GPUProgramValidationIssue[]=[];const scalars=new Set(program.scalars.map(value=>value.id));for(const vector of program.vectors)if(vector.external&&!bindings.vectors?.[vector.id])issues.push({level:'error',code:'missing-external-vector',valueId:vector.id,message:`External vector "${vector.id}" has no WebGPU binding`});const visit=(operation:GPUProgramOperation):void=>{const id='id'in operation&&typeof operation.id==='string'?operation.id:undefined;if(operation instanceof GPUConditionalOperation||operation instanceof GPULoopOperation){const predicate=operation.predicate;if(predicate?.source==='gpu'){if(predicate.value.format!=='uint32')issues.push({level:'error',code:'invalid-predicate-format',operationId:id,valueId:predicate.value.id,message:`GPU predicate "${predicate.id}" must use uint32 state`});if(!scalars.has(predicate.value.id))issues.push({level:'error',code:'missing-predicate-scalar',operationId:id,valueId:predicate.value.id,message:`GPU predicate "${predicate.id}" references undeclared scalar "${predicate.value.id}"`});}}if(operation instanceof GPUCompositeOperation)for(const child of operation.operations)visit(child);};for(const operation of program.operations)visit(operation);return Object.freeze({valid:!issues.some(issue=>issue.level==='error'),issues:Object.freeze(issues.map(issue=>Object.freeze({...issue})))});}
