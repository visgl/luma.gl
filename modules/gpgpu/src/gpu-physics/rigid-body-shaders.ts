// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Bounded rigid-body reference path. Pair discovery is parallel; impulses are ordered on GPU. */
export function getRigidBodyShader(count: number, iterations: number): string {
  return /* wgsl */ `
const BODY_COUNT: u32 = ${count}u;
const ITERATIONS: u32 = ${iterations}u;
struct Body { shape: vec4f, inertia: vec4f, material: vec4f }
struct Contact { point: vec4f, normal: vec4f, impulse: vec4f, tangent: vec4f }
struct Manifold { contacts: array<Contact, 4>, count: u32, padding: vec3u }
struct Settings { gravity: vec4f, solver: vec4f, sleep: vec4f }
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(5) var<storage, read> bodies: array<Body>;
@group(0) @binding(6) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> sleepStates: array<vec4f>;
fn rotate(rotation: vec4f, vector: vec3f) -> vec3f {
  return vector + 2.0 * cross(rotation.xyz, cross(rotation.xyz, vector) + rotation.w * vector);
}
fn local(body: u32, vector: vec3f) -> vec3f {return rotate(vec4f(-orientations[body].xyz, orientations[body].w), vector);}
fn axis(body: u32, index: u32) -> vec3f {var unit=vec3f(0); unit[index]=1.0; return rotate(orientations[body], unit);}
fn inverseInertia(body: u32, vector: vec3f) -> vec3f {
 return rotate(orientations[body], local(body,vector) * bodies[body].inertia.xyz);
}
fn extent(body: u32, direction: vec3f) -> f32 {
 if(bodies[body].shape.w == 0.0) {return bodies[body].shape.x;}
 return dot(abs(local(body,direction)), bodies[body].shape.xyz);
}
fn support(body: u32, direction: vec3f) -> vec3f {
 if(bodies[body].shape.w == 0.0) {return positions[body].xyz + direction * bodies[body].shape.x;}
 let side=select(vec3f(-1),vec3f(1),local(body,direction)>=vec3f(0));
 return positions[body].xyz + rotate(orientations[body], side*bodies[body].shape.xyz);
}
fn vertex(body: u32, index: u32) -> vec3f {
 let side=vec3f(select(-1.0,1.0,(index&1u)!=0u),select(-1.0,1.0,(index&2u)!=0u),select(-1.0,1.0,(index&4u)!=0u));
 return positions[body].xyz+rotate(orientations[body],side*bodies[body].shape.xyz);
}
fn pointVelocity(body: u32, point: vec3f) -> vec3f {
 return velocities[body].xyz+cross(angularVelocities[body].xyz,point-positions[body].xyz);
}
fn applyImpulse(body: u32, point: vec3f, impulse: vec3f) {
 velocities[body]=vec4f(velocities[body].xyz+impulse*velocities[body].w,velocities[body].w);
 angularVelocities[body]=vec4f(angularVelocities[body].xyz+inverseInertia(body,cross(point-positions[body].xyz,impulse)),0);
}
fn effectiveMass(first: u32, second: u32, point: vec3f, direction: vec3f) -> f32 {
 let firstLever=point-positions[first].xyz; let secondLever=point-positions[second].xyz;
 return velocities[first].w+velocities[second].w + dot(direction,
 cross(inverseInertia(first,cross(firstLever,direction)),firstLever)+cross(inverseInertia(second,cross(secondLever,direction)),secondLever));
}
@compute @workgroup_size(64) fn integrate(@builtin(global_invocation_id) invocation: vec3u) {
 let body=invocation.x; if(body>=BODY_COUNT) {return;}
 let rotation=orientations[body]; orientations[body]=select(vec4f(0,0,0,1),normalize(rotation),dot(rotation,rotation)>0.000001);
 if(velocities[body].w==0.0 || sleepStates[body].y>0.5) {return;}
 velocities[body]=vec4f(velocities[body].xyz+settings.gravity.xyz*settings.gravity.w,velocities[body].w);

}
fn storeContact(pair: u32, slot: u32, point: vec3f, normal: vec3f, depth: f32, previous: Manifold, first: u32, second: u32) {
 var contact: Contact; contact.point=vec4f(point,depth); contact.normal=vec4f(normal,0);
 let closing=dot(pointVelocity(second,point)-pointVelocity(first,point),normal);
 contact.normal.w=select(0.0,-closing*min(bodies[first].material.x,bodies[second].material.x),closing < -settings.solver.z);
 var nearest=settings.solver.w*settings.solver.w; var found=false;
 for(var old=0u;old<previous.count;old++) {
  var used=false;
  for(var retained=0u;retained<slot;retained++) {if(manifolds[pair].contacts[retained].impulse.y==f32(old+1u)) {used=true;}}
  if(used) {continue;}
  let distance=dot(previous.contacts[old].point.xyz-point,previous.contacts[old].point.xyz-point);
  if(distance<nearest && dot(previous.contacts[old].normal.xyz,normal)>0.95) {
   nearest=distance; contact.impulse=previous.contacts[old].impulse; contact.tangent=previous.contacts[old].tangent; contact.impulse.y=f32(old+1u); found=true;
  }
 }
 if(found) {
  contact.normal.w=0.0;
  var tangent=contact.tangent.xyz-normal*dot(contact.tangent.xyz,normal);
  let limit=sqrt(bodies[first].material.y*bodies[second].material.y)*contact.impulse.x;
  if(length(tangent)>limit) {tangent*=limit/max(0.000001,length(tangent));}
  contact.tangent=vec4f(tangent,0);
 }
 manifolds[pair].contacts[slot]=contact;
}
// SAT separates oriented boxes along all six face normals and nine edge cross products.
@compute @workgroup_size(64) fn collide(@builtin(global_invocation_id) invocation: vec3u) {
 let pair=invocation.x; if(pair>=BODY_COUNT*BODY_COUNT) {return;}
 let first=pair/BODY_COUNT; let second=pair%BODY_COUNT;
 let previous=manifolds[pair]; manifolds[pair].count=0u;
 if(first>=second || velocities[first].w+velocities[second].w==0.0) {return;}
 let difference=positions[second].xyz-positions[first].xyz;
 let firstSphere=bodies[first].shape.w==0.0; let secondSphere=bodies[second].shape.w==0.0;
 var normal=vec3f(0,0,1); var depth=1e20; var faceBody=first; var faceAxis=0u; var edgeContact=false;
 if(firstSphere && secondSphere) {
  let distance=length(difference); depth=bodies[first].shape.x+bodies[second].shape.x-distance;
  if(depth < -settings.solver.x) {return;}
  if(distance>0.000001) {normal=difference/distance;}
  let point=positions[first].xyz+normal*(bodies[first].shape.x-depth*0.5);
  storeContact(pair,0u,point,normal,depth,previous,first,second); manifolds[pair].count=1u; return;
 }
 if(firstSphere || secondSphere) {
  let sphere=select(second,first,firstSphere); let box=select(first,second,firstSphere);
  let center=local(box,positions[sphere].xyz-positions[box].xyz); let halfExtent=bodies[box].shape.xyz;
  var closest=clamp(center,-halfExtent,halfExtent); var delta=center-closest; let distance=length(delta);
  var boxNormal=vec3f(0,0,1);
  if(distance>0.000001) {boxNormal=rotate(orientations[box],delta/distance);depth=bodies[sphere].shape.x-distance;}
  else {
   let distances=halfExtent-abs(center); var minimumAxis=0u;
   if(distances.y<distances.x) {minimumAxis=1u;} if(distances.z<distances[minimumAxis]) {minimumAxis=2u;}
   var localNormal=vec3f(0); localNormal[minimumAxis]=select(-1.0,1.0,center[minimumAxis]>=0.0);
   closest[minimumAxis]=localNormal[minimumAxis]*halfExtent[minimumAxis]; boxNormal=rotate(orientations[box],localNormal);
   depth=bodies[sphere].shape.x+distances[minimumAxis];
  }
  if(depth < -settings.solver.x) {return;}
  normal=select(boxNormal,-boxNormal,firstSphere);
  storeContact(pair,0u,positions[box].xyz+rotate(orientations[box],closest),normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 for(var candidate=0u;candidate<15u;candidate++) {
  var direction=vec3f(0); var candidateBody=first; var candidateAxis=candidate;
  if(candidate<3u) {direction=axis(first,candidate);}
  else if(candidate<6u) {candidateBody=second;candidateAxis=candidate-3u;direction=axis(second,candidateAxis);}
  else {direction=cross(axis(first,(candidate-6u)/3u),axis(second,(candidate-6u)%3u));}
  let magnitude=length(direction);if(magnitude<0.0001) {continue;} direction/=magnitude;
  let overlap=extent(first,direction)+extent(second,direction)-abs(dot(difference,direction));
  if(overlap < -settings.solver.x) {return;}
  // Prefer face manifolds over nearly tied edge axes.
  if(overlap<depth-select(0.0,0.001,candidate>=6u)) {
   depth=overlap;normal=select(-direction,direction,dot(difference,direction)>=0.0);
   faceBody=candidateBody;faceAxis=candidateAxis;edgeContact=candidate>=6u;
  }
 }
 if(edgeContact) {
  // Closest points between the two supporting edge segments.
  var firstAxis=0u;var secondAxis=0u;var smallest=1e20;
  for(var horizontal=0u;horizontal<3u;horizontal++) {for(var vertical=0u;vertical<3u;vertical++) {
   let candidate=cross(axis(first,horizontal),axis(second,vertical));let magnitude=length(candidate);
   if(magnitude>0.0001) {let error=1.0-abs(dot(candidate/magnitude,normal));if(error<smallest) {smallest=error;firstAxis=horizontal;secondAxis=vertical;}}
  }}
  let firstDirection=axis(first,firstAxis);let secondDirection=axis(second,secondAxis);
  var firstCenter=support(first,normal);var secondCenter=support(second,-normal);
  firstCenter-=firstDirection*dot(firstCenter-positions[first].xyz,firstDirection);
  secondCenter-=secondDirection*dot(secondCenter-positions[second].xyz,secondDirection);
  let delta=firstCenter-secondCenter;let alignment=dot(firstDirection,secondDirection);let denominator=max(0.00001,1.0-alignment*alignment);
  var firstDistance=clamp((alignment*dot(secondDirection,delta)-dot(firstDirection,delta))/denominator,-bodies[first].shape[firstAxis],bodies[first].shape[firstAxis]);
  let secondDistance=clamp(dot(secondDirection,delta)+alignment*firstDistance,-bodies[second].shape[secondAxis],bodies[second].shape[secondAxis]);
  firstDistance=clamp(alignment*secondDistance-dot(firstDirection,delta),-bodies[first].shape[firstAxis],bodies[first].shape[firstAxis]);
  storeContact(pair,0u,(firstCenter+firstDirection*firstDistance+secondCenter+secondDirection*secondDistance)*0.5,normal,depth,previous,first,second);
  manifolds[pair].count=1u;return;
 }
 // Clip the incident face polygon against the four reference-face side planes.
 let reference=faceBody;let incident=select(first,second,reference==first);
 let referenceNormal=select(-normal,normal,reference==first);
 let referenceCenter=positions[reference].xyz+referenceNormal*bodies[reference].shape[faceAxis];
 var incidentAxis=0u;var maximumAlignment=0.0;
 for(var index=0u;index<3u;index++) {let alignment=abs(dot(axis(incident,index),referenceNormal));if(alignment>maximumAlignment) {maximumAlignment=alignment;incidentAxis=index;}}
 let incidentNormal=axis(incident,incidentAxis)*select(1.0,-1.0,dot(axis(incident,incidentAxis),referenceNormal)>0.0);
 let incidentCenter=positions[incident].xyz+incidentNormal*bodies[incident].shape[incidentAxis];
 let firstTangent=axis(incident,(incidentAxis+1u)%3u)*bodies[incident].shape[(incidentAxis+1u)%3u];
 let secondTangent=axis(incident,(incidentAxis+2u)%3u)*bodies[incident].shape[(incidentAxis+2u)%3u];
 var polygon: array<vec3f, 16>;var temporary: array<vec3f, 16>;
 polygon[0]=incidentCenter-firstTangent-secondTangent;polygon[1]=incidentCenter+firstTangent-secondTangent;
 polygon[2]=incidentCenter+firstTangent+secondTangent;polygon[3]=incidentCenter-firstTangent+secondTangent;
 var vertexCount=4u;
 for(var boundary=0u;boundary<4u;boundary++) {
  let tangentAxis=(faceAxis+1u+boundary/2u)%3u;
  let direction=axis(reference,tangentAxis)*select(-1.0,1.0,boundary%2u==0u);
  let limit=bodies[reference].shape[tangentAxis];var outputCount=0u;
  for(var index=0u;index<vertexCount;index++) {
   let start=polygon[index];let end=polygon[(index+1u)%vertexCount];
   let startDistance=dot(start-referenceCenter,direction)-limit;let endDistance=dot(end-referenceCenter,direction)-limit;
   if(startDistance<=0.0) {temporary[outputCount]=start;outputCount++;}
   if((startDistance<=0.0)!=(endDistance<=0.0)) {temporary[outputCount]=mix(start,end,startDistance/(startDistance-endDistance));outputCount++;}
  }
  vertexCount=outputCount;for(var index=0u;index<vertexCount;index++) {polygon[index]=temporary[index];}
 }
 // Spread four retained points around the clipped polygon rather than taking adjacent vertices.
 var accepted: array<vec3f, 16>;var acceptedCount=0u;
 for(var index=0u;index<vertexCount;index++) {if(dot(referenceCenter-polygon[index],referenceNormal)>=-settings.solver.x) {accepted[acceptedCount]=polygon[index];acceptedCount++;}}
 let contactCount=min(4u,acceptedCount);
 for(var index=0u;index<contactCount;index++) {
  let point=accepted[index*acceptedCount/contactCount];let separation=dot(referenceCenter-point,referenceNormal);
  storeContact(pair,index,point+referenceNormal*separation*0.5,normal,separation,previous,first,second);
 }
 manifolds[pair].count=contactCount;
}
fn root(body: u32) -> u32 {var current=body;for(var iteration=0u;iteration<BODY_COUNT;iteration++) {let parent=u32(sleepStates[current].z);if(parent==current) {break;}current=parent;}return current;}
@compute @workgroup_size(1) fn solve() {
 // Connected components include dynamic bodies only: a shared static floor must not join islands.
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].z=f32(body);}
 for(var pair=0u;pair<BODY_COUNT*BODY_COUNT;pair++) {
  if(manifolds[pair].count==0u) {continue;}let first=pair/BODY_COUNT;let second=pair%BODY_COUNT;
  if(velocities[first].w>0.0 && velocities[second].w>0.0) {let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}
 }
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(velocities[body].w>0.0 && sleepStates[body].y<0.5) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {if(velocities[body].w>0.0 && sleepStates[root(body)].w<0.5) {if(sleepStates[body].y>0.5) {sleepStates[body].x=0.0;}sleepStates[body].y=0.0;}}
 for(var pair=0u;pair<BODY_COUNT*BODY_COUNT;pair++) {
  let first=pair/BODY_COUNT;let second=pair%BODY_COUNT;
  if((sleepStates[first].y>0.5 || velocities[first].w==0.0) && (sleepStates[second].y>0.5 || velocities[second].w==0.0)) {continue;}
  for(var slot=0u;slot<manifolds[pair].count;slot++) {
   let contact=manifolds[pair].contacts[slot];let impulse=contact.normal.xyz*contact.impulse.x+contact.tangent.xyz;
   applyImpulse(first,contact.point.xyz,-impulse);applyImpulse(second,contact.point.xyz,impulse);
  }
 }
 for(var iteration=0u;iteration<ITERATIONS;iteration++) {
  for(var pair=0u;pair<BODY_COUNT*BODY_COUNT;pair++) {
   let first=pair/BODY_COUNT;let second=pair%BODY_COUNT;
   if((sleepStates[first].y>0.5 || velocities[first].w==0.0) && (sleepStates[second].y>0.5 || velocities[second].w==0.0)) {continue;}
   for(var slot=0u;slot<manifolds[pair].count;slot++) {
    var contact=manifolds[pair].contacts[slot];let point=contact.point.xyz;let normal=contact.normal.xyz;
    let relative=pointVelocity(second,point)-pointVelocity(first,point);
    let bias=min(2.0,0.15*max(0.0,contact.point.w-settings.solver.x)/settings.gravity.w);
    let increment=(max(bias,contact.normal.w)-dot(relative,normal))/max(0.000001,effectiveMass(first,second,point,normal));
    let accumulated=max(0.0,contact.impulse.x+increment);let change=accumulated-contact.impulse.x;contact.impulse.x=accumulated;
    applyImpulse(first,point,-normal*change);applyImpulse(second,point,normal*change);
    let after=pointVelocity(second,point)-pointVelocity(first,point);let slip=after-normal*dot(after,normal);let speed=length(slip);
    if(speed>0.000001) {
     let direction=slip/speed;var tangent=contact.tangent.xyz-direction*speed/max(0.000001,effectiveMass(first,second,point,direction));
     tangent-=normal*dot(tangent,normal);
     let limit=sqrt(bodies[first].material.y*bodies[second].material.y)*accumulated;
     if(length(tangent)>limit) {tangent*=limit/max(0.000001,length(tangent));}
     let tangentChange=tangent-contact.tangent.xyz;contact.tangent=vec4f(tangent,0);
     applyImpulse(first,point,-tangentChange);applyImpulse(second,point,tangentChange);
    }
    manifolds[pair].contacts[slot]=contact;
   }
  }
 }
}
@compute @workgroup_size(1) fn finish() {
 for(var body=0u;body<BODY_COUNT;body++) {
  if(velocities[body].w==0.0 || sleepStates[body].y>0.5) {continue;}
  positions[body]=vec4f(positions[body].xyz+velocities[body].xyz*settings.gravity.w,positions[body].w);
  let rotation=orientations[body];let angular=angularVelocities[body].xyz;
  let inversePrincipalInertia=bodies[body].inertia.xyz;
  let movableAxes=inversePrincipalInertia>vec3f(0);
  let principalMomentum=local(body,angular)/select(vec3f(1),inversePrincipalInertia,movableAxes);
  let momentum=rotate(rotation,select(vec3f(0),principalMomentum,movableAxes));
  let derivative=vec4f(rotation.w*angular+cross(angular,rotation.xyz),-dot(angular,rotation.xyz));
  orientations[body]=normalize(rotation+derivative*(0.5*settings.gravity.w));
  // Preserve world angular momentum as the inertia tensor rotates.
  angularVelocities[body]=vec4f(inverseInertia(body,momentum),0);
  let quiet=length(velocities[body].xyz)<settings.sleep.y && length(angular)<settings.sleep.z;
  sleepStates[body].x=select(0.0,sleepStates[body].x+settings.gravity.w,quiet);
 }
 for(var body=0u;body<BODY_COUNT;body++) {sleepStates[body].w=1.0;}
 for(var body=0u;body<BODY_COUNT;body++) {if(velocities[body].w>0.0 && (settings.sleep.x<=0.0 || sleepStates[body].x<settings.sleep.x)) {sleepStates[root(body)].w=0.0;}}
 for(var body=0u;body<BODY_COUNT;body++) {
  if(velocities[body].w>0.0 && sleepStates[root(body)].w>0.5) {sleepStates[body].y=1.0;velocities[body]=vec4f(0,0,0,velocities[body].w);angularVelocities[body]=vec4f(0);}
 }
}
`;
}
