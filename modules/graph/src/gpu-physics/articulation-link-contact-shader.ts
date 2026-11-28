// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Narrow phase and compact contact rows for a fixed-base tree against refitted box clusters. */
export function getLinkContactShader(boxCount: number, colliderCount: number) {
  return /* wgsl */ `
const CAPACITY=24u;
var<private> contactCount:u32;
var<private> boxIds:array<u32,CAPACITY>;
var<private> colliderIds:array<u32,CAPACITY>;

fn boxDistanceSquared(point:vec3f, extent:vec3f)->f32{
 let delta=point-clamp(point,-extent,extent);return dot(delta,delta);
}
// Test face normals and all nondegenerate edge cross products. Return a representative
// point on the incident face; the general world solver owns box/box stacking manifolds.
fn intersectBoxes(a:vec3f,qa:vec4f,ea:vec3f,b:vec3f,qb:vec4f,eb:vec3f,preferFace:bool)->mat2x4f{
 var axesA:array<vec3f,3>;var axesB:array<vec3f,3>;
 for(var j=0u;j<3u;j++){var basis=vec3f(0);basis[j]=1.;axesA[j]=rotate(qa,basis);axesB[j]=rotate(qb,basis);}
 var feature=0u;var gap=-1e30;var normal=vec3f(0);
 for(var j=0u;j<15u;j++){
  var axis=vec3f(0);if(j<3u){axis=axesA[j];}else if(j<6u){axis=axesB[j-3u];}else{axis=cross(axesA[(j-6u)/3u],axesB[(j-6u)%3u]);}
  let squared=dot(axis,axis);if(squared<1e-10){continue;}axis*=inverseSqrt(squared);
  var extent=0.;for(var k=0u;k<3u;k++){extent+=ea[k]*abs(dot(axis,axesA[k]))+eb[k]*abs(dot(axis,axesB[k]));}
  let distance=dot(b-a,axis);let separation=abs(distance)-extent;
  if(separation>gap+select(0.,0.0005,preferFace && j>=6u)){normal=select(-axis,axis,distance>=0.);gap=separation;feature=j;}
  if(separation>0.001){gap=separation;break;}
 }
 let incident=clamp(rotate(vec4f(-qa.xyz,qa.w),b-a),-ea,ea);
 return mat2x4f(vec4f(a+rotate(qa,incident),f32(feature)),vec4f(normal,gap));
}
struct Patch { vertices:array<vec3f,8>, count:u32, gaps:array<f32,8> }
// Clip the opposing face in reference-box local space against its four side planes.
fn clipPatch(input:Patch,axis:u32,sign:f32,extent:f32)->Patch {
 var output:Patch;if(input.count==0u){return output;}
 var previous=input.vertices[input.count-1u];var before=sign*previous[axis]-extent;
 for(var i=0u;i<input.count;i++){
  let current=input.vertices[i];let after=sign*current[axis]-extent;
  if((before<0.)!=(after<0.) && before!=0. && after!=0.){output.vertices[output.count]=mix(previous,current,before/(before-after));output.count++;}
  if(after<=0.){output.vertices[output.count]=current;output.count++;}
  previous=current;before=after;
 }return output;
}
fn facePatch(referenceCenter:vec3f,rotation:vec4f,extent:vec3f,face:u32,normal:vec3f,incident:vec3f,orientation:vec4f,size:vec3f)->Patch {
 let inverseRotation=vec4f(-rotation.xyz,rotation.w);
 let localNormal=rotate(vec4f(-orientation.xyz,orientation.w),normal);
 var axis=0u;if(abs(localNormal.y)>abs(localNormal.x)){axis=1u;}if(abs(localNormal.z)>abs(localNormal[axis])){axis=2u;}
 var polygon:Patch;polygon.count=4u;
 for(var i=0u;i<4u;i++){
  var corner=vec3f(0);corner[axis]=select(size[axis],-size[axis],localNormal[axis]>0.);
  let u=(axis+1u)%3u;let v=(axis+2u)%3u;
  corner[u]=select(-size[u],size[u],i==1u||i==2u);corner[v]=select(-size[v],size[v],i>=2u);
  polygon.vertices[i]=rotate(inverseRotation,incident-referenceCenter+rotate(orientation,corner));
 }
 for(var j=1u;j<=2u;j++){let side=(face+j)%3u;polygon=clipPatch(polygon,side,1.,extent[side]);polygon=clipPatch(polygon,side,-1.,extent[side]);}
 var result:Patch;let direction=rotate(inverseRotation,normal)[face];
 for(var i=0u;i<polygon.count;i++){let vertex=polygon.vertices[i];if(vertex[face]*direction<=extent[face]+0.001){
  result.gaps[result.count]=vertex[face]*direction-extent[face];result.vertices[result.count]=referenceCenter+rotate(rotation,vertex);result.count++;
 }}return result;
}
fn intersectRound(a:vec3f,qa:vec4f,shape:vec4f,b:vec3f,qb:vec4f,extent:vec3f)->mat2x4f{
 let inverseQ=vec4f(-qb.xyz,qb.w);var local=rotate(inverseQ,a-b);
 if(shape.w==1.){
  // Distance from a segment to a solid box is convex along the segment.
  let axis=rotate(inverseQ,rotate(qa,vec3f(0,shape.y,0)));
  var low=-1.;var high=1.;
  for(var iteration=0u;iteration<24u;iteration++){let t=(high-low)/3.;let l=low+t;let r=high-t;
   if(boxDistanceSquared(local+axis*l,extent)<=boxDistanceSquared(local+axis*r,extent)){high=r;}else{low=l;}}
  local+=axis*((low+high)*0.5);
 }
 let delta=local-clamp(local,-extent,extent);let distance=length(delta);
 var outward=vec3f(0);var gap=distance-shape.x;
 if(distance>1e-6){outward=delta/distance;}else{
  let depth=extent-abs(local);var face=0u;if(depth.y<depth.x){face=1u;}if(depth.z<depth[face]){face=2u;}
  outward[face]=select(-1.,1.,local[face]>=0.);gap=-depth[face]-shape.x;
 }
 let normal=-rotate(qb,outward);
 return mat2x4f(vec4f(b+rotate(qb,local)+shape.x*normal,0),vec4f(normal,gap));
}
fn preparePayload(dt:f32,inverse:ptr<function,array<array<f32,N>,N>>){
 counters[4]=0u;counters[6]=0u;counters[7]=0u;
 for(var collider=0u;collider<${colliderCount}u;collider++){
  let offset=settings.pads[3u*collider];let link=u32(offset.w);let pose=solved[link];
  let center=pose.position.xyz+rotate(pose.rotation,offset.xyz);
  let rotation=product(pose.rotation,settings.pads[3u*collider+1u]);let shape=settings.pads[3u*collider+2u];
  let radius=select(shape.x+shape.y,length(shape.xyz),shape.w>=2.)+0.001;
  for(var start=0u;start<${boxCount}u;start+=8u){
   let cluster=boxes[${boxCount}u+start/8u];
   if(any(center+radius<cluster.position.xyz)||any(center-radius>cluster.shape.xyz)){continue;}
   for(var i=start;i<min(start+8u,${boxCount}u);i++){
    let box=boxes[i];let b=box.position.xyz+rotate(box.rotation,box.offset.xyz);
    let difference=center-b;let bound=radius+length(box.shape.xyz);
    if(dot(difference,difference)>bound*bound){continue;} counters[4]++;
    let q=product(box.rotation,box.localRotation);var hit:mat2x4f;
    if(shape.w>=2.){hit=intersectBoxes(center,rotation,shape.xyz,b,q,box.shape.xyz,shape.w==3.);}
    else{hit=intersectRound(center,rotation,shape,b,q,box.shape.xyz);}
    if(hit[1].w>0.001){continue;}
    var polygon:Patch;
    if(shape.w==3. && hit[0].w<6.){
     let feature=u32(hit[0].w);
     if(feature<3u){polygon=facePatch(center,rotation,shape.xyz,feature,hit[1].xyz,b,q,box.shape.xyz);}
     else{polygon=facePatch(b,q,box.shape.xyz,feature-3u,-hit[1].xyz,center,rotation,shape.xyz);}
    }
    if(polygon.count==0u){polygon.vertices[0]=hit[0].xyz;polygon.gaps[0]=hit[1].w;polygon.count=1u;}
    let rows=min(polygon.count,4u);
    if(contactCount+rows>CAPACITY){counters[1]=1u;counters[2]=0u;counters[3]=0u;counters[5]=0u;counters[6]=1u;return;}
    currentBox=i;payload=Pose(box.position,box.rotation,box.velocity,box.spin);
    velocities[i]=box.velocity.xyz;spins[i]=box.spin.xyz;
    for(var point=0u;point<rows;point++){
     let pointIndex=point*polygon.count/rows;let vertex=polygon.vertices[pointIndex];
     boxIds[contactCount]=i;colliderIds[contactCount]=collider;
     prepareContact(contactCount,i32(link),vertex,hit[1].xyz,polygon.gaps[pointIndex],dt,inverse);contactCount++;
    }
   }
  }
 }
 // Match the previous accepted step by both stable identities, normal and contact point.
 var matched=0u;
 for(var j=0u;j<contactCount;j++){
  currentBox=boxIds[j];let box=boxes[currentBox];payload=Pose(box.position,box.rotation,vec4f(velocities[currentBox],box.velocity.w),vec4f(spins[currentBox],0));
  let row=contacts[j].rows[0];
  for(var k=0u;k<counters[5];k++){
   let base=8u+12u*k;if((matched&(1u<<k))!=0u || counters[base]!=u32(box.material.w)||counters[base+1u]!=colliderIds[j]){continue;}
   let normal=vec3f(bitcast<f32>(counters[base+2u]),bitcast<f32>(counters[base+3u]),bitcast<f32>(counters[base+4u]));
   let arm=vec3f(bitcast<f32>(counters[base+5u]),bitcast<f32>(counters[base+6u]),bitcast<f32>(counters[base+7u]));
   if(dot(row.direction,normal)<0.98||distance(arm,row.arm)>0.03){continue;}
   matched|=1u<<k;let impulse=vec3f(bitcast<f32>(counters[base+8u]),bitcast<f32>(counters[base+9u]),bitcast<f32>(counters[base+10u]));
   let normalImpulse=max(0.,dot(impulse,row.direction))*0.75;
   var tangent=vec2f(dot(impulse,contacts[j].rows[1].direction),dot(impulse,contacts[j].rows[2].direction))*0.75;
   tangent*=min(1.,normalImpulse*sqrt(settings.surface.y*box.material.z)/max(1e-12,length(tangent)));
   applyRow(j,0u,normalImpulse);applyRow(j,1u,tangent.x);applyRow(j,2u,tangent.y);counters[7]++;break;
  }
  velocities[currentBox]=payload.velocity.xyz;spins[currentBox]=payload.spin.xyz;
 }
}
fn publishLinkContacts(){
 for(var j=0u;j<contactCount;j++){let i=boxIds[j];if(!finite(vec4f(velocities[i],0))||!finite(vec4f(spins[i],0))){counters[1]=1u;return;}}
 counters[2]=0u;counters[3]=0u;counters[5]=contactCount;
 for(var j=0u;j<contactCount;j++){
  let i=boxIds[j];let id=u32(boxes[i].material.w);let collider=colliderIds[j];let base=8u+j*12u;
  let row=contacts[j].rows[0];let impulse=row.direction*row.accumulated+contacts[j].rows[1].direction*contacts[j].rows[1].accumulated+contacts[j].rows[2].direction*contacts[j].rows[2].accumulated;
  counters[base]=id;counters[base+1u]=collider;
  for(var k=0u;k<3u;k++){counters[base+2u+k]=bitcast<u32>(row.direction[k]);counters[base+5u+k]=bitcast<u32>(row.arm[k]);counters[base+8u+k]=bitcast<u32>(impulse[k]);}
  if(collider<2u && id<32u && row.accumulated>1e-8){counters[2u+collider]|=1u<<id;}
  boxes[i].velocity=vec4f(velocities[i],boxes[i].velocity.w);boxes[i].spin=vec4f(spins[i],boxes[i].spin.w);
 }
}
`;
}
