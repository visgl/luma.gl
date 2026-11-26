// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GPURigidBodyQueryFilter = {
  /** Omit to query all colliders; selection is independent of physical pair filtering. */
  colliderIndices?: readonly number[];
  excludeBody?: number;
};
export type GPURigidBodySphereCastQuery = GPURigidBodyRayQuery & {radius: number};
export type GPURigidBodyRayQuery = GPURigidBodyQueryFilter & {
  origin: readonly [number, number, number];
  direction: readonly [number, number, number];
  maximumDistance: number;
};
export type GPURigidBodyOverlapQuery = GPURigidBodyQueryFilter & {
  center: readonly [number, number, number];
  radius: number;
  maximumHits?: number;
};
export type GPURigidBodyQueryHit = {
  body: number;
  collider: number;
  point: [number, number, number];
  normal: [number, number, number];
  distance: number;
};
export type GPURigidBodyQueryResult = {
  hits: GPURigidBodyQueryHit[];
  totalHits: number;
  truncated: boolean;
  /** False if bounded geometry traversal or conservative advancement did not finish. */
  complete: boolean;
};

/** One batched ray, or a sphere sweep when radius is supplied. Filters share the batch selection. */
export type GPURigidBodyBatchCast = Omit<GPURigidBodyRayQuery, 'colliderIndices'> & {
  /** Nonnegative sweep radius. Omit for a ray. */
  radius?: number;
};

/** Optional collider selection shared by every command in a cast batch. */
export type GPURigidBodyBatchCastOptions = Pick<GPURigidBodyQueryFilter, 'colliderIndices'> & {
  /** Override the world's default. Indexed casts require queryBatchIndex. */
  strategy?: 'scan' | 'indexed';
};

/** Input command stride in bytes, matching the WGSL Query structure. */
export const RIGID_BODY_CAST_COMMAND_BYTES = 48;

/** One result header and one nearest-hit record per command, measured in bytes. */
export const RIGID_BODY_BATCH_RESULT_BYTES = 64;

/** Encode a batch without duplicating the collider selection per command. */
export function packRigidBodyBatchCasts(
  commands: readonly GPURigidBodyBatchCast[],
  bodyCount: number,
  selectedCount: number,
  indexedCount = 0
): Uint8Array {
  /** Shared typed views for the command floats and integer flags. */
  const data = new ArrayBuffer(commands.length * RIGID_BODY_CAST_COMMAND_BYTES);
  /** Position, direction, segment length and sweep radius. */
  const floats = new Float32Array(data);
  /** Query kind and optional excluded body. */
  const words = new Uint32Array(data);
  for (const [index, command] of commands.entries()) {
    /** Resolve the per-command segment and optional exclusion before packing. */
    const {origin, direction, maximumDistance, radius, excludeBody} = command;
    /** Normalize directions once on the CPU, retaining distance in world units. */
    const length = Math.hypot(...direction);
    if (
      'colliderIndices' in command ||
      origin.length !== 3 ||
      !origin.every(value => Number.isFinite(Math.fround(value))) ||
      direction.length !== 3 ||
      !Number.isFinite(length) ||
      length === 0 ||
      !Number.isFinite(Math.fround(maximumDistance)) ||
      maximumDistance < 0 ||
      (radius !== undefined && (!Number.isFinite(Math.fround(radius)) || radius < 0)) ||
      (excludeBody !== undefined &&
        (!Number.isInteger(excludeBody) || excludeBody < 0 || excludeBody >= bodyCount))
    )
      throw new Error('Invalid batched collision cast');
    /** Each row is independently aligned to one Query. */
    const offset = (index * RIGID_BODY_CAST_COMMAND_BYTES) / 4;
    floats.set(
      [...origin, radius ?? 0, ...direction.map(value => value / length), maximumDistance],
      offset
    );
    words.set(
      [radius === undefined ? 0 : 2, indexedCount, excludeBody ?? 0xffffffff, selectedCount],
      offset + 8
    );
  }
  return new Uint8Array(data);
}

/** Read one nearest hit, using the same layout for scalar and batched query results. */
export function decodeRigidBodyQueryHit(
  words: Uint32Array,
  floats: Float32Array,
  offset: number
): GPURigidBodyQueryHit {
  return {
    body: words[offset],
    collider: words[offset + 1],
    point: [floats[offset + 4], floats[offset + 5], floats[offset + 6]],
    distance: floats[offset + 7],
    normal: [floats[offset + 8], floats[offset + 9], floats[offset + 10]]
  };
}

/** Decode ordered results from one compact GPU readback. */
export function decodeRigidBodyBatchCasts(bytes: Uint8Array): GPURigidBodyQueryResult[] {
  /** Header and identifier words for every command. */
  const words = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  /** Nearest hit geometry for each result row. */
  const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return Array.from({length: bytes.byteLength / RIGID_BODY_BATCH_RESULT_BYTES}, (_, index) => {
    /** A four-word header precedes the nearest-hit record. */
    const offset = (index * RIGID_BODY_BATCH_RESULT_BYTES) / 4;
    return {
      hits: words[offset] ? [decodeRigidBodyQueryHit(words, floats, offset + 4)] : [],
      totalHits: words[offset + 1],
      truncated: false,
      complete: words[offset + 2] === 0
    };
  });
}

/** Shared collider intersection code for scalar queries and batched casts. */
export const RIGID_BODY_QUERY_SHADER = /* wgsl */ `
struct Query { origin:vec4f, direction:vec4f, settings:vec4u }
struct QueryHit { identifiers:vec4u, point:vec4f, normal:vec4f }
struct QueryOutput { count:u32, total:u32, reserved:vec2u, hits:array<QueryHit> }
@group(0) @binding(12) var<uniform> query:Query;
@group(0) @binding(13) var<storage,read> querySelection:array<u32>;
@group(0) @binding(14) var<storage,read_write> queryOutput:QueryOutput;
fn queryCollider(collider:u32,request:Query)->QueryHit {
  let shape=bodies.colliders[collider].shape;
  let origin=colliderLocal(collider,request.origin.xyz-colliderPosition(collider));
  let direction=colliderLocal(collider,request.direction.xyz);
  var point=origin;var normal=vec3f(0);var distance=0.0;var hit=false;
  var complete=1u;
  if(request.settings.x==2u||shape.w>1.0){
   if(request.settings.x==1u){let surface=closestSurface(collider,origin);hit=surface.distance<=request.origin.w;point=surface.point;normal=select(vec3f(0),(origin-point)/max(length(origin-point),1e-20),surface.distance>0.0);complete=surface.complete;if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){hit=false;}}
   else{let sweep=sweepSphere(collider,origin,direction,request.direction.w,request.origin.w,false);hit=sweep.hit!=0u;point=sweep.point;normal=sweep.normal;distance=sweep.distance;complete=sweep.complete;}
  }else if(request.settings.x==1u){
   if(shape.w==0.0){let lengthFromCenter=length(origin);hit=lengthFromCenter<=shape.x+request.origin.w;normal=select(vec3f(1,0,0),origin/max(lengthFromCenter,1e-20),lengthFromCenter>1e-20);point=normal*shape.x;}
   else {point=clamp(origin,-shape.xyz,shape.xyz);let separation=origin-point;let lengthFromSurface=length(separation);hit=lengthFromSurface<=request.origin.w;normal=separation/max(lengthFromSurface,1e-20);}
  }else if(shape.w==0.0){
   let projection=dot(origin,direction);
   // Avoid cancellation between large squared distances for distant rays.
   let perpendicular=origin-direction*projection;let discriminant=shape.x*shape.x-dot(perpendicular,perpendicular);
   if(dot(origin,origin)<=shape.x*shape.x){hit=true;}
   else if(discriminant>=0.0){distance=-projection-sqrt(discriminant);hit=distance>=0.0;point=origin+direction*distance;normal=normalize(point);}
  }else{
   var enter=0.0;var leave=request.direction.w;hit=true;
   for(var coordinate=0u;coordinate<3u;coordinate++){
    if(direction[coordinate]==0.0){if(abs(origin[coordinate])>shape[coordinate]){hit=false;}}
    else{
     let first=(-shape[coordinate]-origin[coordinate])/direction[coordinate];let second=(shape[coordinate]-origin[coordinate])/direction[coordinate];
     let lower=min(first,second);let upper=max(first,second);
     if(lower>enter){enter=lower;normal=vec3f(0);normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}
     leave=min(leave,upper);
    }
   }
   distance=enter;point=origin+direction*distance;hit=hit&&enter<=leave&&leave>=0.0;
  }
  return QueryHit(vec4u(colliderBody(collider),collider,select(0u,1u,hit&&distance<=request.direction.w),complete),vec4f(colliderPosition(collider)+rotate(colliderRotation(collider),point),distance),vec4f(rotate(colliderRotation(collider),normal),0));
}
@compute @workgroup_size(64) fn queryColliders(@builtin(global_invocation_id) invocation:vec3u){
 let collider=invocation.x;if(collider>=COLLIDER_COUNT){return;}
 queryOutput.hits[collider]=QueryHit();
 if(querySelection[collider]!=0u){queryOutput.hits[collider]=queryCollider(collider,query);}
}
@compute @workgroup_size(1) fn reduceQueries(){
 queryOutput.count=0u;queryOutput.total=0u;queryOutput.reserved=vec2u(0);var nearest=query.direction.w;
 for(var collider=0u;collider<COLLIDER_COUNT;collider++){
  if(querySelection[collider]==0u){continue;}
  let candidate=queryOutput.hits[collider];if(candidate.identifiers.w==0u){queryOutput.reserved.x++;}
  if(candidate.identifiers.z==0u){continue;}queryOutput.total++;
  var slot=queryOutput.count;
  if(query.settings.x!=1u){if(candidate.point.w>nearest){continue;}if(queryOutput.count>0u&&candidate.point.w==nearest){continue;}nearest=candidate.point.w;slot=0u;}
  if(slot>=query.settings.y){continue;}queryOutput.hits[slot]=candidate;queryOutput.count=max(queryOutput.count,slot+1u);
 }
}
`;

/** One workgroup per cast. Scratch is local to the group and scales with lane count. */
export function getRigidBodyBatchCastShader(leafCapacity = 0): string {
  return /* wgsl */ `
struct BatchResult {header:vec4u,hit:QueryHit}
@group(0) @binding(30) var<storage,read> batchCommands:array<Query>;
@group(0) @binding(31) var<storage,read_write> batchResults:array<BatchResult>;
var<workgroup> reducedHits:array<QueryHit,64>;
var<workgroup> reducedCounts:array<vec2u,64>;

// Match the scalar reducer: prefer the smaller collider index at equal distance.
fn closer(first:QueryHit,second:QueryHit)->bool{
 return first.identifiers.z!=0u&&(second.identifiers.z==0u||
   first.point.w<second.point.w||
   (first.point.w==second.point.w&&first.identifiers.y<second.identifiers.y));
}
${leafCapacity ? getCastTraversalShader(leafCapacity) : ''}
fn accumulateCast(
 collider:u32,command:Query,best:ptr<function,QueryHit>,counts:ptr<function,vec2u>
){
 if(colliderBody(collider)==command.settings.z){return;}
 let candidate=queryCollider(collider,command);
 (*counts)+=vec2u(candidate.identifiers.z,select(0u,1u,candidate.identifiers.w==0u));
 if(closer(candidate,*best)){*best=candidate;}
}
@compute @workgroup_size(64) fn castBatch(
 @builtin(workgroup_id) groupIndex:vec3u,
 @builtin(local_invocation_index) lane:u32
){
 let command=batchCommands[groupIndex.x];
 var best=QueryHit();var counts=vec2u(0);
 ${leafCapacity ? 'traverseCastBounds(lane,command,&best,&counts);' : ''}
 for(var work=lane+command.settings.y;work<command.settings.w;work+=64u){
  accumulateCast(querySelection[work],command,&best,&counts);
 }
 reducedHits[lane]=best;reducedCounts[lane]=counts;workgroupBarrier();
 for(var stride=32u;stride>0u;stride/=2u){
  if(lane<stride){
   let neighbor=lane+stride;
   if(closer(reducedHits[neighbor],reducedHits[lane])){reducedHits[lane]=reducedHits[neighbor];}
   reducedCounts[lane]+=reducedCounts[neighbor];
  }
  workgroupBarrier();
 }
 if(lane==0u){
  let hit=reducedHits[0];let counts=reducedCounts[0];
  batchResults[groupIndex.x]=BatchResult(vec4u(hit.identifiers.z,counts.x,counts.y,0u),hit);
 }
}
`;
}

/** Traverse disjoint implicit subtrees without a private stack or a candidate buffer. */
function getCastTraversalShader(leafCapacity: number): string {
  return /* wgsl */ `
@group(0) @binding(26) var<storage,read> nodeMinima:array<f32>;
@group(0) @binding(27) var<storage,read> nodeMaxima:array<f32>;
const CAST_LEAVES:u32=${leafCapacity}u;
const CAST_SUBTREES:u32=min(CAST_LEAVES,8u);

fn traverseCastBounds(
 lane:u32,command:Query,best:ptr<function,QueryHit>,counts:ptr<function,vec2u>
){
 if(lane>=CAST_SUBTREES){return;}
 // One-based heap addresses make sibling and parent navigation arithmetic.
 let root=CAST_SUBTREES+lane;
 var node=root;
 // The world slab and local intersection use different arithmetic orders.
 let directionRoundoff=command.direction.w*vec3f(2e-6);
 let padding=command.origin.w*1.000002+abs(command.origin.xyz)*2e-6+directionRoundoff;
 loop{
  let offset=(node-1u)*3u;
  let lower=vec3f(nodeMinima[offset],nodeMinima[offset+1u],nodeMinima[offset+2u]);
  let upper=vec3f(nodeMaxima[offset],nodeMaxima[offset+1u],nodeMaxima[offset+2u]);
  if(all(lower<=upper)&&intersectsSweepBounds(
   command.origin.xyz,command.direction.xyz,command.direction.w,lower-padding,upper+padding
  )){
   if(node<CAST_LEAVES){node*=2u;continue;}
   let row=node-CAST_LEAVES;
   if(row<command.settings.y){accumulateCast(querySelection[row],command,best,counts);}
  }
  while(node>root&&(node&1u)!=0u){node/=2u;}
  if(node==root){break;}
  node+=1u;
 }
}
`;
}
