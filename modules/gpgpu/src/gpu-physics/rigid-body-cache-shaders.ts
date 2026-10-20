// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type RigidBodySparseShaderLayout = {
  maximumPairs: number;
  pairOffset: number;
  diagnosticOffset: number;
};

export function getRigidBodyCacheShader(layout: RigidBodySparseShaderLayout): string {
  return /* wgsl */ `
const EMPTY_PAIR:u32=0u;
const DELETED_PAIR:u32=0xffffffffu;
fn metadataWord(component:u32)->u32{return bodies.geometry[component/4u][component%4u];}
fn candidateCount()->u32{return min(metadataWord(${layout.diagnosticOffset}u),PAIR_CAPACITY);}
fn candidatePair(index:u32)->vec2u{let component=${layout.pairOffset}u+index*2u;return vec2u(metadataWord(component),metadataWord(component+1u));}
fn getFirstCollider(pair:u32)->u32{return manifolds[pair].first;}
fn getSecondCollider(pair:u32)->u32{return manifolds[pair].second;}
fn claimManifold(first:u32,second:u32)->u32{
 let key=((first<<16u)|second)+1u;
 var mixed=(key^(key>>16u))*2246822519u;
 mixed=(mixed^(mixed>>13u))*3266489917u;
 let origin=(mixed^(mixed>>16u))&(PAIR_CAPACITY-1u);
 for(var attempt=0u;attempt<8u;attempt++){
  var reusable=DELETED_PAIR;var observed=DELETED_PAIR;
  for(var probe=0u;probe<min(PAIR_CAPACITY,128u);probe++){
   let slot=(origin+probe)&(PAIR_CAPACITY-1u);let stored=atomicLoad(&targets.keys[slot].key);
   if(stored==key){targets.keys[slot].epoch=targets.frame;return slot;}
   if(stored==DELETED_PAIR&&reusable==DELETED_PAIR){reusable=slot;observed=DELETED_PAIR;}
   if(stored==EMPTY_PAIR){if(reusable==DELETED_PAIR){reusable=slot;observed=EMPTY_PAIR;}break;}
  }
  if(reusable==DELETED_PAIR){break;}
  let claimed=atomicCompareExchangeWeak(&targets.keys[reusable].key,observed,key);
  if(claimed.exchanged){
   targets.keys[reusable].epoch=targets.frame;manifolds[reusable].previousCount=0u;
   manifolds[reusable].first=first;manifolds[reusable].second=second;return reusable;
  }
 }
 atomicAdd(&targets.cacheDropped,1u);return DELETED_PAIR;
}
var<workgroup> cacheEpoch:u32;
@compute @workgroup_size(64) fn prepare(@builtin(local_invocation_index) invocation:u32){
 if(invocation==0u){targets.frame++;cacheEpoch=targets.frame;atomicStore(&targets.cacheDropped,0u);}
 workgroupBarrier();
 for(var pair=invocation;pair<PAIR_CAPACITY;pair+=64u){
  manifolds[pair].previousCount=manifolds[pair].count;
  manifolds[pair].count=0u;manifolds[pair].padding=vec3u(0);
  let key=atomicLoad(&targets.keys[pair].key);
  if(key!=EMPTY_PAIR&&key!=DELETED_PAIR&&cacheEpoch-targets.keys[pair].epoch>2u){
   atomicStore(&targets.keys[pair].key,DELETED_PAIR);manifolds[pair].previousCount=0u;
  }
 }
}
`;
}
