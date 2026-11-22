// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type BindingDeclaration} from '@luma.gl/core';
import type {
  GPUCommandGraph,
  GPUCommandGraphComputeExecutable,
  GraphBufferHandle
} from '../gpu-core/gpu-command-graph';
import {
  createBoundKernel,
  createBoundKernelAsync,
  type BoundKernel
} from '../gpu-core/utils/bound-kernel';

/** Stable slot tiles also fit default WebGPU workgroup limits. */
const EVENT_WORKGROUP_SIZE = 64;

/** Storage binding shared by the three large-ring publication passes. */
const EVENT_WORK_LOCATION = 29;

/** Optional per-stage visibility for an imported simulation buffer. */
export type RigidBodyEventBinding = {
  /** WGSL variable name. */
  name: string;
  /** Binding number in group zero. */
  location: number;
  /** Caller-owned simulation resource. */
  resource: GraphBufferHandle;
  /** Whether the underlying declaration is read-only storage. */
  readOnly?: boolean;
};

/** Configure a publication ring and the resources each callback uses. */
type EventCompactionOptions = {
  /** Prefix for the graph nodes and temporary storage. */
  id: string;
  /** Number of stable pair or trigger slots scanned in a step. */
  rowCount: number;
  /** Maximum number of retained events. */
  capacity: number;
  /** WGSL ring variable shared by the reservation helpers. */
  ring: string;
  /** WGSL declaring eventClassify, eventCount, eventPublish and eventCommit. */
  source: string;
  /** Resources used to determine transition flags. */
  classify: readonly RigidBodyEventBinding[];
  /** Resources read when deciding whether a step committed. */
  commit: readonly RigidBodyEventBinding[];
  /** Resources accessed to publish payloads and update history. */
  publish: readonly RigidBodyEventBinding[];
};

/** Compact ordered transitions and publish a single coherent step into an existing ring. */
export function addRigidBodyEventCompaction<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  options: EventCompactionOptions
): void {
  /** A single workgroup can classify and publish without external scratch. */
  const workgroups = Math.max(1, Math.ceil(options.rowCount / EVENT_WORKGROUP_SIZE));
  /** The shared WGSL preserves identical event sequence and overflow semantics in both paths. */
  const source = options.source + getEventCompactionShader(options, workgroups);
  /** Attach one explicit graph stage and resolve aliased scratch at encode time. */
  function addStage(
    entryPoint: string,
    description: string,
    bindings: readonly RigidBodyEventBinding[],
    count: number
  ): void {
    /** A buffer may serve several callbacks in the fused entry point. */
    const unique = [...new Map(bindings.map(binding => [binding.name, binding])).values()];
    /** Bind resources without declaring unused storage at this entry point. */
    const declarations = unique.map(
      ({name, location, readOnly}): BindingDeclaration => ({
        name,
        location,
        group: 0,
        type: readOnly ? 'read-only-storage' : 'storage'
      })
    );
    /** The same bindings serve sync and async pipeline compilation. */
    const properties = {
      id: `${options.id}-${entryPoint}`,
      entryPoint,
      source,
      shaderLayout: {bindings: declarations}
    };
    /** Connect compiler-owned scratch and source views for this dispatch. */
    const executable = (
      computation: BoundKernel
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass, getBuffer}) => {
        for (const binding of unique)
          computation.bindings[binding.name] = getBuffer(binding.resource);
        computation.kernel.dispatch(computePass, {bindings: computation.bindings, x: count});
      },
      destroy: () => computation.kernel.destroy()
    });
    graph.addComputePass({
      id: properties.id,
      description,
      resources: unique.map(binding => ({
        buffer: binding.resource,
        usage: binding.readOnly ? 'storage-read' : 'storage-read-write'
      })),
      compile: () => executable(createBoundKernel(graph.device, properties)),
      compileAsync: async () => executable(await createBoundKernelAsync(graph.device, properties))
    });
  }

  if (workgroups === 1) {
    addStage(
      'publishEventTile',
      'Publish ordered events in one workgroup.',
      [...options.classify, ...options.commit, ...options.publish],
      1
    );
    return;
  }

  /** One flag/offset word per row, one total/offset per tile, and one reservation header. */
  const scratch = graph.createTransientBuffer({
    id: `${options.id}-compaction`,
    usage: Buffer.STORAGE,
    byteLength: (4 + options.rowCount + workgroups) * 4
  });
  /** Scratch is graph-owned and never enters snapshots or the public event ring layout. */
  const work = {name: 'eventWork', location: EVENT_WORK_LOCATION, resource: scratch};
  addStage(
    'classifyEventTiles',
    'Classify transitions and compact one tile per workgroup.',
    [...options.classify, work],
    workgroups
  );
  addStage(
    'reserveEventTiles',
    'Reserve ordered ring positions from tile counts.',
    [...options.commit, work],
    1
  );
  addStage(
    'publishEventTiles',
    'Write retained event records and advance transition history.',
    [...options.publish, work],
    workgroups
  );
}

/** Emit a stable workgroup scan and bounded ring reservation for the two event payloads. */
function getEventCompactionShader(
  {ring, capacity, rowCount}: EventCompactionOptions,
  workgroups: number
): string {
  return /* wgsl */ `
const EVENT_ROWS:u32=${rowCount}u;
const EVENT_CAPACITY:u32=${capacity}u;
const EVENT_TILE_SIZE:u32=${EVENT_WORKGROUP_SIZE}u;
var<workgroup> eventPrefix:array<u32,${EVENT_WORKGROUP_SIZE}>;

// Each row emits at most two records, in the order chosen by its publisher.
fn scanEvents(lane:u32,count:u32)->u32{
 eventPrefix[lane]=count;
 workgroupBarrier();
 for(var stride=1u;stride<EVENT_TILE_SIZE;stride*=2u){
  var prior=0u;
  if(lane>=stride){prior=eventPrefix[lane-stride];}
  workgroupBarrier();
  eventPrefix[lane]+=prior;
  workgroupBarrier();
 }
 return eventPrefix[lane]-count;
}

// Reserve from the old sequence but keep only the newest records that fit the ring.
// x = base sequence, y = accepted count, z = step (zero for an uncommitted tick).
fn reserveEvents(total:u32)->vec3u{
 if(!eventCommit()){return vec3u(0);}
 if(${ring}.step==0xffffffffu){${ring}.saturated=1u;return vec3u(0);}
 let base=${ring}.sequence;
 let accepted=min(total,0xffffffffu-base);
 if(accepted<total){${ring}.saturated=1u;}
 ${ring}.sequence=base+accepted;
 ${ring}.step++;
 return vec3u(base,accepted,${ring}.step);
}

fn retainedEventSequence(reservation:vec3u,offset:u32)->u32{
 if(offset>=reservation.y||reservation.y-offset>EVENT_CAPACITY){return 0u;}
 return reservation.x+offset+1u;
}

${
  workgroups === 1
    ? /* wgsl */ `
var<workgroup> eventReservation:vec3u;
@compute @workgroup_size(${EVENT_WORKGROUP_SIZE}) fn publishEventTile(
 @builtin(local_invocation_index) lane:u32
){
 var flags=0u;
 if(lane<EVENT_ROWS){flags=eventClassify(lane);}
 let offset=scanEvents(lane,eventCount(flags));
 if(lane==0u){eventReservation=reserveEvents(eventPrefix[EVENT_TILE_SIZE-1u]);}
 workgroupBarrier();
 if(lane<EVENT_ROWS&&eventReservation.z!=0u){eventPublish(lane,flags,offset,eventReservation);}
}
`
    : /* wgsl */ `
@group(0) @binding(${EVENT_WORK_LOCATION}) var<storage,read_write> eventWork:array<u32>;
const EVENT_TILES:u32=${workgroups}u;

@compute @workgroup_size(${EVENT_WORKGROUP_SIZE}) fn classifyEventTiles(
 @builtin(global_invocation_id) invocation:vec3u,
 @builtin(local_invocation_index) lane:u32,
 @builtin(workgroup_id) tile:vec3u
){
 let row=invocation.x;
 var flags=0u;
 if(row<EVENT_ROWS){flags=eventClassify(row);}
 let offset=scanEvents(lane,eventCount(flags));
 // A 64-lane tile uses at most 128 records. Keep flags above the local offset.
 if(row<EVENT_ROWS){eventWork[4u+row]=offset|(flags<<8u);}
 if(lane==0u){eventWork[4u+EVENT_ROWS+tile.x]=eventPrefix[EVENT_TILE_SIZE-1u];}
}

@compute @workgroup_size(1) fn reserveEventTiles(){
 var total=0u;
 for(var tile=0u;tile<EVENT_TILES;tile++){
  let index=4u+EVENT_ROWS+tile;
  let count=eventWork[index];
  eventWork[index]=total;
  total+=count;
 }
 let reservation=reserveEvents(total);
 eventWork[0]=reservation.x;eventWork[1]=reservation.y;eventWork[2]=reservation.z;
}

@compute @workgroup_size(${EVENT_WORKGROUP_SIZE}) fn publishEventTiles(
 @builtin(global_invocation_id) invocation:vec3u,
 @builtin(workgroup_id) tile:vec3u
){
 let row=invocation.x;
 let reservation=vec3u(eventWork[0],eventWork[1],eventWork[2]);
 if(row>=EVENT_ROWS||reservation.z==0u){return;}
 let word=eventWork[4u+row];
 let offset=eventWork[4u+EVENT_ROWS+tile.x]+(word&255u);
 eventPublish(row,word>>8u,offset,reservation);
}
`
}
`;
}
