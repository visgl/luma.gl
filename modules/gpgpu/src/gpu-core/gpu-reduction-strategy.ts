// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';
import {selectGPUStrategy} from './gpu-strategy';

export type GPUReductionStrategy={workgroupSize:64|128|256;elementsPerThread:1|2|4|8;elementsPerWorkgroup:number;useSubgroups:boolean;firstLevelWorkgroups:number};
type ReductionShapeId='wg64'|'wg128'|'wg256';

/** Selects reduction execution shape through the common Jarnevon strategy contract. */
export function getAdaptiveGPUReductionStrategy(device:Device,length:number):GPUReductionStrategy{
  if(!Number.isSafeInteger(length)||length<1)throw new Error('reduction length must be positive');
  const maxInvocations=device.limits.maxComputeInvocationsPerWorkgroup??256;
  const decision=selectGPUStrategy<ReductionShapeId,{length:number},{workgroupSize:64|128|256}>({device,workload:{length},candidates:[
    {id:'wg64',score:()=>length<4096?100:30,reason:()=>`small reduction favors 64-thread workgroups`,createDetails:()=>({workgroupSize:64})},
    {id:'wg128',isSupported:()=>maxInvocations>=128,score:()=>length>=4096&&length<65536?110:60,reason:()=>`medium reduction favors 128-thread workgroups`,createDetails:()=>({workgroupSize:128})},
    {id:'wg256',isSupported:()=>maxInvocations>=256,score:()=>length>=65536?120:70,reason:()=>`large reduction favors 256-thread workgroups`,createDetails:()=>({workgroupSize:256})}
  ]});
  const workgroupSize=decision.details.workgroupSize;
  let elementsPerThread:1|2|4|8=1;
  if(length>=workgroupSize*4096)elementsPerThread=8;else if(length>=workgroupSize*1024)elementsPerThread=4;else if(length>=workgroupSize*256)elementsPerThread=2;
  const elementsPerWorkgroup=workgroupSize*elementsPerThread;
  const firstLevelWorkgroups=Math.ceil(length/elementsPerWorkgroup);
  const useSubgroups=getGPUShaderSubgroupStrategy(device,{requiresSubgroupId:true})==='subgroups';
  return Object.freeze({workgroupSize,elementsPerThread,elementsPerWorkgroup,useSubgroups,firstLevelWorkgroups});
}
export function getAdaptiveGPUReductionLevels(length:number,strategy:GPUReductionStrategy):number[]{const levels:number[]=[];let current=length;do{current=Math.ceil(current/strategy.elementsPerWorkgroup);levels.push(current);}while(current>1);return levels;}
