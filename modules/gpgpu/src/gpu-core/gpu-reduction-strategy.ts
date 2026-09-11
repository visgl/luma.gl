// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {getGPUShaderSubgroupStrategy} from './gpu-subgroup-utils';

export type GPUReductionStrategy={workgroupSize:64|128|256;elementsPerThread:1|2|4|8;elementsPerWorkgroup:number;useSubgroups:boolean;firstLevelWorkgroups:number};

/**
 * Selects a reduction shape from workload size and device capabilities.
 *
 * More elements per thread amortize dispatch and hierarchy overhead on large inputs while smaller
 * workloads retain enough workgroups for parallelism. Subgroups remain an orthogonal intra-group
 * acceleration rather than changing public reduction semantics.
 */
export function getAdaptiveGPUReductionStrategy(device:Device,length:number):GPUReductionStrategy{
  if(!Number.isSafeInteger(length)||length<1)throw new Error('reduction length must be positive');
  const maxInvocations=device.limits.maxComputeInvocationsPerWorkgroup??256;
  const workgroupSize=(maxInvocations>=256?256:maxInvocations>=128?128:64) as 64|128|256;
  let elementsPerThread:1|2|4|8=1;
  if(length>=workgroupSize*4096)elementsPerThread=8;else if(length>=workgroupSize*1024)elementsPerThread=4;else if(length>=workgroupSize*256)elementsPerThread=2;
  const elementsPerWorkgroup=workgroupSize*elementsPerThread;
  const firstLevelWorkgroups=Math.ceil(length/elementsPerWorkgroup);
  const useSubgroups=getGPUShaderSubgroupStrategy(device,{requiresSubgroupId:true})==='subgroups';
  return Object.freeze({workgroupSize,elementsPerThread,elementsPerWorkgroup,useSubgroups,firstLevelWorkgroups});
}

/** Returns hierarchy lengths using a selected adaptive reduction shape. */
export function getAdaptiveGPUReductionLevels(length:number,strategy:GPUReductionStrategy):number[]{const levels:number[]=[];let current=length;do{current=Math.ceil(current/strategy.elementsPerWorkgroup);levels.push(current);}while(current>1);return levels;}
