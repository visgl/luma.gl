// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Lifetime request for a heavyweight transient graph buffer. */
export type GPUTransientLifetimeRequest={id:string;byteLength:number;usage:number;firstNode:number;lastNode:number};
export type GPUTransientPhysicalAllocation={allocation:number;byteLength:number;usage:number};
export type GPUTransientLifetimeAssignment=GPUTransientLifetimeRequest&{allocation:number};
export type GPUTransientLifetimePlan={assignments:readonly GPUTransientLifetimeAssignment[];allocations:readonly GPUTransientPhysicalAllocation[];logicalByteLength:number;physicalByteLength:number;savedByteLength:number};

/**
 * Greedy interval allocator for large transient buffers.
 *
 * Buffers may share a physical allocation only when lifetimes do not overlap, usage flags are
 * compatible, and the existing allocation is large enough. Small GPUValueArena slots are excluded
 * by design: their stable offsets are more valuable than the negligible memory saving.
 */
export function planGPUTransientLifetimes(requests:readonly GPUTransientLifetimeRequest[]):GPUTransientLifetimePlan{
  validate(requests);const ordered=[...requests].sort((a,b)=>a.firstNode-b.firstNode||b.byteLength-a.byteLength);const allocations:Array<GPUTransientPhysicalAllocation&{lastNode:number}>=[];const assignments:GPUTransientLifetimeAssignment[]=[];
  for(const request of ordered){let best=-1;let bestWaste=Infinity;for(let i=0;i<allocations.length;i++){const allocation=allocations[i];if(allocation.lastNode>=request.firstNode)continue;if((allocation.usage&request.usage)!==request.usage)continue;if(allocation.byteLength<request.byteLength)continue;const waste=allocation.byteLength-request.byteLength;if(waste<bestWaste){best=i;bestWaste=waste;}}
    if(best<0){best=allocations.length;allocations.push({allocation:best,byteLength:request.byteLength,usage:request.usage,lastNode:request.lastNode});}else{allocations[best].lastNode=request.lastNode;}
    assignments.push({...request,allocation:best});
  }
  const logicalByteLength=requests.reduce((sum,r)=>sum+r.byteLength,0);const physicalByteLength=allocations.reduce((sum,a)=>sum+a.byteLength,0);return Object.freeze({assignments:Object.freeze(assignments),allocations:Object.freeze(allocations.map(({lastNode,...a})=>Object.freeze(a))),logicalByteLength,physicalByteLength,savedByteLength:logicalByteLength-physicalByteLength});
}
function validate(requests:readonly GPUTransientLifetimeRequest[]):void{const ids=new Set<string>();for(const r of requests){if(!r.id||ids.has(r.id))throw new Error(`invalid or duplicate transient id "${r.id}"`);ids.add(r.id);if(!Number.isSafeInteger(r.byteLength)||r.byteLength<=0)throw new Error(`${r.id} byteLength must be positive`);if(!Number.isSafeInteger(r.firstNode)||!Number.isSafeInteger(r.lastNode)||r.firstNode<0||r.lastNode<r.firstNode)throw new Error(`${r.id} has invalid lifetime`);}}
