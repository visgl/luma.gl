import{A as e,B as t,C as n,D as r,E as i,F as a,G as o,I as s,K as c,L as l,M as u,N as d,O as f,P as p,R as m,S as h,T as g,U as _,V as v,W as y,_ as b,d as x,f as S,g as C,h as w,j as T,l as E,m as D,p as O,r as k,s as ee,t as te,u as A,w as ne,x as re,z as ie}from"./robot-arm-scene-CJ0jNw1k.js";import{V as ae,z as j}from"./wgsl-interface-scan-BeLN4x0P.js";function oe(e,t){if(t.length!==3||t.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid collider scale`);let[n,r,i]=t,a=(e,t)=>Math.abs(e-t)<=1e-6*Math.max(e,t);switch(e.type){case`box`:return{...e,halfExtents:[e.halfExtents[0]*n,e.halfExtents[1]*r,e.halfExtents[2]*i]};case`plane`:return{...e,sizeX:e.sizeX===void 0?void 0:e.sizeX*n,sizeZ:e.sizeZ===void 0?void 0:e.sizeZ*i};case`sphere`:if(!a(n,r)||!a(n,i))throw Error(`Sphere scale requires an ellipsoid`);return{...e,radius:e.radius*n};case`capsule`:case`cylinder`:if(!a(n,i)||e.type===`capsule`&&!a(n,r))throw Error(`Unsupported tapered collider scale`);return{...e,height:e.height*r,radiusBottom:e.radiusBottom*n,radiusTop:e.radiusTop*n};default:throw Error(`Mesh scale requires a collider rebuild`)}}function se(e,t){return`
const CAPACITY=24u;
var<private> contactCount:u32;
var<private> boxIds:array<u32,CAPACITY>;
var<private> colliderIds:array<u32,CAPACITY>;

fn boxDistanceSquared(point:vec3f, extent:vec3f)->f32{
 let delta=point-clamp(point,-extent,extent);return dot(delta,delta);
}
// Test face normals and all nondegenerate edge cross products. Return a representative
// point on the incident face; the general world solver owns box/box stacking manifolds.
fn intersectBoxes(a:vec3f,qa:vec4f,ea:vec3f,b:vec3f,qb:vec4f,eb:vec3f)->mat2x4f{
 var axesA:array<vec3f,3>;var axesB:array<vec3f,3>;
 for(var j=0u;j<3u;j++){var basis=vec3f(0);basis[j]=1.;axesA[j]=rotate(qa,basis);axesB[j]=rotate(qb,basis);}
 var gap=-1e30;var normal=vec3f(0);
 for(var j=0u;j<15u;j++){
  var axis=vec3f(0);if(j<3u){axis=axesA[j];}else if(j<6u){axis=axesB[j-3u];}else{axis=cross(axesA[(j-6u)/3u],axesB[(j-6u)%3u]);}
  let squared=dot(axis,axis);if(squared<1e-10){continue;}axis*=inverseSqrt(squared);
  var extent=0.;for(var k=0u;k<3u;k++){extent+=ea[k]*abs(dot(axis,axesA[k]))+eb[k]*abs(dot(axis,axesB[k]));}
  let distance=dot(b-a,axis);let separation=abs(distance)-extent;
  if(separation>gap){normal=select(-axis,axis,distance>=0.);gap=separation;}
  if(gap>0.001){break;}
 }
 let incident=clamp(rotate(vec4f(-qa.xyz,qa.w),b-a),-ea,ea);
 return mat2x4f(vec4f(a+rotate(qa,incident),0),vec4f(normal,gap));
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
 for(var collider=0u;collider<${t}u;collider++){
  let offset=settings.pads[3u*collider];let link=u32(offset.w);let pose=solved[link];
  let center=pose.position.xyz+rotate(pose.rotation,offset.xyz);
  let rotation=product(pose.rotation,settings.pads[3u*collider+1u]);let shape=settings.pads[3u*collider+2u];
  let radius=select(shape.x+shape.y,length(shape.xyz),shape.w==2.)+0.001;
  for(var start=0u;start<${e}u;start+=8u){
   let cluster=boxes[${e}u+start/8u];
   if(any(center+radius<cluster.position.xyz)||any(center-radius>cluster.shape.xyz)){continue;}
   for(var i=start;i<min(start+8u,${e}u);i++){
    let box=boxes[i];let b=box.position.xyz+rotate(box.rotation,box.offset.xyz);
    let difference=center-b;let bound=radius+length(box.shape.xyz);
    if(dot(difference,difference)>bound*bound){continue;} counters[4]++;
    let q=product(box.rotation,box.localRotation);var hit:mat2x4f;
    if(shape.w==2.){hit=intersectBoxes(center,rotation,shape.xyz,b,q,box.shape.xyz);}
    else{hit=intersectRound(center,rotation,shape,b,q,box.shape.xyz);}
    if(hit[1].w>0.001){continue;}
    if(contactCount==CAPACITY){counters[1]=1u;counters[2]=0u;counters[3]=0u;counters[5]=0u;counters[6]=1u;return;}
    currentBox=i;payload=Pose(box.position,box.rotation,box.velocity,box.spin);
    velocities[i]=box.velocity.xyz;spins[i]=box.spin.xyz;
    boxIds[contactCount]=i;colliderIds[contactCount]=collider;
    prepareContact(contactCount,i32(link),hit[0].xyz,hit[1].xyz,hit[1].w,dt,inverse);contactCount++;
   }
  }
 }
 // Match the previous accepted step by both stable identities, normal and contact point.
 for(var j=0u;j<contactCount;j++){
  currentBox=boxIds[j];let box=boxes[currentBox];payload=Pose(box.position,box.rotation,vec4f(velocities[currentBox],box.velocity.w),vec4f(spins[currentBox],0));
  let row=contacts[j].rows[0];
  for(var k=0u;k<counters[5];k++){
   let base=8u+12u*k;if(counters[base]!=u32(box.material.w)||counters[base+1u]!=colliderIds[j]){continue;}
   let normal=vec3f(bitcast<f32>(counters[base+2u]),bitcast<f32>(counters[base+3u]),bitcast<f32>(counters[base+4u]));
   let arm=vec3f(bitcast<f32>(counters[base+5u]),bitcast<f32>(counters[base+6u]),bitcast<f32>(counters[base+7u]));
   if(dot(row.direction,normal)<0.98||distance(arm,row.arm)>0.03){continue;}
   let impulse=vec3f(bitcast<f32>(counters[base+8u]),bitcast<f32>(counters[base+9u]),bitcast<f32>(counters[base+10u]));
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
`}function ce(e,t){return`
struct ContactRow {
 direction:vec3f, arm:vec3f, angularResponse:vec3f, effectiveInverseMass:f32,
 jacobian:array<f32,N>, response:array<f32,N>, accumulated:f32
}
struct PayloadContact {rows:array<ContactRow,3>, targetSpeed:f32, enabled:bool}
var<private> payload:Pose;
var<private> contacts:array<PayloadContact,${t?24:e?e*2:10}>;
${e?`var<private> currentBox:u32;
var<private> velocities:array<vec3f,${e}>;
var<private> spins:array<vec3f,${e}>;`:``}
fn inversePayloadInertia(moment:vec3f)->vec3f {
 ${e?`let q=product(payload.rotation,boxes[currentBox].principal);
 return rotate(q,boxes[currentBox].inverseInertia.xyz*rotate(vec4f(-q.xyz,q.w),moment));`:`let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;
 let squares=halfSize*halfSize;
 let diagonal=3.0/(settings.payloadSizeMass.w*(squares.yzx+squares.zxy));
 return rotate(q,diagonal*rotate(vec4f(-q.xyz,q.w),moment));`}
}
fn prepareContact(index:u32, link:i32, point:vec3f, normal:vec3f, gap:f32, dt:f32,
 inverse:ptr<function,array<array<f32,N>,N>>) {
 // Activate friction only at contact. The small skin covers roundoff at rest.
 if(gap>0.001){return;}
 contacts[index].enabled=true;
 contacts[index].targetSpeed=clamp(-0.2*gap/dt,-0.1,1.0);
 let tangent=normalize(cross(normal,select(vec3f(1,0,0),vec3f(0,1,0),abs(normal.x)>0.8)));
 let directions=array<vec3f,3>(normal,tangent,cross(normal,tangent));
 for(var component=0u;component<3u;component++){
  let direction=directions[component];
  var row:ContactRow;
  row.direction=direction;
  row.arm=point-payload.position.xyz;
  let moment=cross(row.arm,direction);
  row.angularResponse=inversePayloadInertia(moment);
  row.effectiveInverseMass=${e?`payload.velocity.w`:`1.0/settings.payloadSizeMass.w`}+dot(moment,row.angularResponse);
  for(var ancestor=link;ancestor>=0;ancestor=i32(links[ancestor].parentAnchor.w)){
   row.jacobian[ancestor]= -dot(direction,linearColumn(ancestor,point));
  }
  for(var j=0u;j<N;j++){
   for(var k=0u;k<N;k++){row.response[j]+=(*inverse)[j][k]*row.jacobian[k];}
   row.effectiveInverseMass+=row.jacobian[j]*row.response[j];
  }
  contacts[index].rows[component]=row;
 }
}
${t?se(e,t):`fn preparePayload(dt:f32,inverse:ptr<function,array<array<f32,N>,N>>){
 ${e?`for(var index=0u;index<${e}u;index++){
 currentBox=index;let box=boxes[index];
 payload=Pose(box.position,box.rotation,box.velocity,box.spin);
 velocities[index]=box.velocity.xyz;spins[index]=box.spin.xyz;
 let q=product(box.rotation,box.localRotation);
 let center=box.position.xyz+rotate(box.rotation,box.offset.xyz);
 let halfSize=box.shape.xyz;`:`payload=poses[N];
 payload.velocity+=vec4f(dt*settings.gravityStep.xyz,0);
 let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;let center=payload.position.xyz;`}
 for(var pad=0u;pad<2u;pad++){
  let finger=settings.pads[pad];let link=i32(finger.x);
  let local=rotate(vec4f(-q.xyz,q.w),solved[link].position.xyz-center);
  let nearest=clamp(local,-halfSize,halfSize);
  let outward=local-nearest;let distance=length(outward);
  var direction=vec3f(0);var gap=distance-finger.y;
  if(distance>0.000001){direction=outward/distance;}else{
   let depth=halfSize-abs(local);var face=0u;
   if(depth.y<depth.x){face=1u;}if(depth.z<depth[face]){face=2u;}
   direction[face]=select(-1.0,1.0,local[face]>=0.0);gap= -depth[face]-finger.y;
  }
  let normal= -rotate(q,direction);
  prepareContact(${e?`index*2u+pad`:`pad`},link,solved[link].position.xyz+normal*finger.y,normal,gap,dt,inverse);
 }
 ${e?`}`:`for(var corner=0u;corner<8u;corner++){
  let signs=vec3f(select(-1.,1.,(corner&1u)!=0u),select(-1.,1.,(corner&2u)!=0u),select(-1.,1.,(corner&4u)!=0u));
  let point=payload.position.xyz+rotate(q,halfSize*signs);
  prepareContact(2u+corner,-1,point,vec3f(0,0,1),point.z-settings.surface.x,dt,inverse);
 }`}
}
`}
fn relativeSpeed(row:ContactRow)->f32{
 var result=dot(row.direction,payload.velocity.xyz+cross(payload.spin.xyz,row.arm));
 for(var j=0u;j<N;j++){result+=row.jacobian[j]*speed[j];}
 return result;
}
fn applyRow(index:u32,component:u32,total:f32)->f32{
 let row=contacts[index].rows[component];
 let delta=total-row.accumulated;
 contacts[index].rows[component].accumulated=total;
 payload.velocity+=vec4f(row.direction*(${e?`delta*payload.velocity.w`:`delta/settings.payloadSizeMass.w`}),0);
 payload.spin+=vec4f(row.angularResponse*delta,0);
 for(var j=0u;j<N;j++){speed[j]+=row.response[j]*delta;}
 return abs(delta);
}
fn solvePayload()->f32{
 var change=0.0;
 for(var index=0u;index<${t?`contactCount`:(e?e*2:10)+`u`};index++){
  if(!contacts[index].enabled){continue;}
  ${e?`currentBox=${t?`boxIds[index]`:`index/2u`};let box=boxes[currentBox];
  payload=Pose(box.position,box.rotation,vec4f(velocities[currentBox],box.velocity.w),vec4f(spins[currentBox],0));`:``}
  let row=contacts[index].rows[0];
  if(row.effectiveInverseMass<1e-9){continue;}
  let normal=max(0.,row.accumulated+(contacts[index].targetSpeed-relativeSpeed(row))/row.effectiveInverseMass);
  change=max(change,applyRow(index,0u,normal));
  let first=contacts[index].rows[1];let second=contacts[index].rows[2];
  var friction=vec2f(first.accumulated-relativeSpeed(first)/max(first.effectiveInverseMass,1e-9),
   second.accumulated-relativeSpeed(second)/max(second.effectiveInverseMass,1e-9));
  let limit=normal*${e?`sqrt(settings.surface.y*boxes[currentBox].material.z)`:`select(settings.surface.z,settings.surface.y,index<2u)`};
  friction*=min(1.,limit/max(length(friction),1e-12));
  change=max(change,applyRow(index,1u,friction.x));
  change=max(change,applyRow(index,2u,friction.y));
  ${e?`velocities[currentBox]=payload.velocity.xyz;spins[currentBox]=payload.spin.xyz;`:``}
 }
 return change;
}
`}function le(e,t=!1,n=!1,r=!1,i=0,o=0,s=!1){return`
const N = ${e}u;
struct Link {
  parentAnchor:vec4f, childAnchor:vec4f, axisMass:vec4f, inertia:vec4f, rest:vec4f
}
struct Pose { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f }
struct Settings { base:vec4f, gravityStep:vec4f, boxCenterRadius:vec4f, boxExtentsLink:vec4f ${r||i?`, payloadSizeMass:vec4f, surface:vec4f, pads:array<vec4f,${o?3*o:2}>`:``} }
@group(0) @binding(0) var<storage,read> links:array<Link>;
@group(0) @binding(1) var<storage,read> drives:array<vec4f>;
@group(0) @binding(2) var<storage,read_write> coordinates:array<vec4f>;
@group(0) @binding(3) var<storage,read_write> poses:array<Pose>;
@group(0) @binding(4) var<storage,read_write> counters:array<u32>;
@group(0) @binding(5) var<uniform> settings:Settings;

${n?`@group(0) @binding(6) var<storage,read_write> matrices:array<mat4x4f>;`:``}
var<private> angle:array<f32,N>;
var<private> speed:array<f32,N>;
var<private> solved:array<Pose,N>;
var<private> axis:array<vec3f,N>;
var<private> pivot:array<vec3f,N>;
var<private> acceleration:array<vec3f,N>;
var<private> angularAcceleration:array<vec3f,N>;
fn rotate(q:vec4f,v:vec3f)->vec3f{return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
fn product(a:vec4f,b:vec4f)->vec4f{return vec4f(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
fn inertia(i:u32,v:vec3f)->vec3f{
 let q=solved[i].rotation;
 return rotate(q,links[i].inertia.xyz*rotate(vec4f(-q.xyz,q.w),v));
}
fn linearColumn(j:i32,point:vec3f)->vec3f{
 ${s?`if(links[j].childAnchor.w!=0.){return axis[j];}`:``}
 return cross(axis[j],point-pivot[j]);
}
fn angularColumn(j:i32)->vec3f{
 ${s?`if(links[j].childAnchor.w!=0.){return vec3f(0);}`:``}
 return axis[j];
}
// Propagate pose, twist and bias acceleration (joint accelerations held at zero).
fn kinematics(){
 for(var i=0u;i<N;i++){
  let link=links[i];let parent=i32(link.parentAnchor.w);
  var previous=Pose(vec4f(settings.base.xyz,0),vec4f(0,0,0,1),vec4f(0),vec4f(0));
  var linearBias=vec3f(0);var angularBias=vec3f(0);
  if(parent>=0){previous=solved[parent];linearBias=acceleration[parent];angularBias=angularAcceleration[parent];}
  let offset=rotate(previous.rotation,link.parentAnchor.xyz);
  pivot[i]=previous.position.xyz+offset;
  axis[i]=rotate(previous.rotation,link.axisMass.xyz);
  ${s?`if(link.childAnchor.w!=0.){
   let rotation=normalize(product(previous.rotation,link.rest));
   let travel=offset+axis[i]*angle[i]+rotate(rotation,-link.childAnchor.xyz);
   let rate=axis[i]*speed[i];let spin=previous.spin.xyz;
   solved[i]=Pose(vec4f(previous.position.xyz+travel,1),rotation,vec4f(previous.velocity.xyz+cross(spin,travel)+rate,0),previous.spin);
   acceleration[i]=linearBias+cross(angularBias,travel)+cross(spin,cross(spin,travel))+2.*cross(spin,rate);
   angularAcceleration[i]=angularBias;continue;
  }`:``}
  let halfAngle=0.5*angle[i];
  let rotation=normalize(product(product(previous.rotation,vec4f(link.axisMass.xyz*sin(halfAngle),cos(halfAngle))),link.rest));
  let radius=rotate(rotation,-link.childAnchor.xyz);
  let parentSpin=previous.spin.xyz;
  let spin=parentSpin+axis[i]*speed[i];
  let velocity=previous.velocity.xyz+cross(parentSpin,offset)+cross(spin,radius);
  let pivotBias=linearBias+cross(angularBias,offset)+cross(parentSpin,cross(parentSpin,offset));
  angularAcceleration[i]=angularBias+cross(parentSpin,axis[i]*speed[i]);
  acceleration[i]=pivotBias+cross(angularAcceleration[i],radius)+cross(spin,cross(spin,radius));
  solved[i]=Pose(vec4f(pivot[i]+radius,1),rotation,vec4f(velocity,0),vec4f(spin,0));
 }
}
${i?`${a}
@group(0) @binding(${n?7:6}) var<storage,read_write> boxes:array<WorldBox>;`:``}
${r||i?ce(i,o):``}
fn finite(v:vec4f)->bool{return all(abs(v)<=vec4f(3.4028234e38));}
@compute @workgroup_size(1) fn main(){
 if(counters[1]!=0u){return;}
 let dt=settings.gravityStep.w;
 var mass:array<array<f32,N>,N>;var inverse:array<array<f32,N>,N>;
 var force:array<f32,N>;var impulse:array<f32,N>;
 for(var i=0u;i<N;i++){
  angle[i]=coordinates[i].x;speed[i]=coordinates[i].y;inverse[i][i]=1;
  // A fixed link contributes its mass to ancestors and has no generalized motion.
  if(dot(links[i].axisMass.xyz,links[i].axisMass.xyz)==0){mass[i][i]=1;}
 }
 kinematics();
 for(var body=0u;body<N;body++){
  let center=solved[body].position.xyz;let spin=solved[body].spin.xyz;
  let load=links[body].axisMass.w*(settings.gravityStep.xyz-acceleration[body]);
  let moment= -inertia(body,angularAcceleration[body])-cross(spin,inertia(body,spin));
  for(var row=i32(body);row>=0;row=i32(links[row].parentAnchor.w)){
   let linear=linearColumn(row,center);
   force[row]+=dot(linear,load)+dot(angularColumn(row),moment);
   let angularMass=inertia(body,angularColumn(row));
   for(var column=i32(body);column>=0;column=i32(links[column].parentAnchor.w)){
    mass[row][column]+=links[body].axisMass.w*dot(linear,linearColumn(column,center))+dot(angularMass,angularColumn(column));
   }
  }
 }
 // Positive definite joint inertia admits elimination without pivoting.
 for(var k=0u;k<N;k++){
  let diagonal=mass[k][k];if(!(diagonal>0)){counters[1]=1u;return;}
  for(var j=0u;j<N;j++){mass[k][j]/=diagonal;inverse[k][j]/=diagonal;}
  for(var i=0u;i<N;i++){if(i!=k){
   let factor=mass[i][k];
   for(var j=0u;j<N;j++){mass[i][j]-=factor*mass[k][j];inverse[i][j]-=factor*inverse[k][j];}
  }}
 }
 for(var i=0u;i<N;i++){for(var j=0u;j<N;j++){speed[i]+=dt*inverse[i][j]*force[j];}}
 ${t?`// Closest point on a finite AABB. Inside, use the nearest exit face.
 let body=u32(settings.boxExtentsLink.w);
 let center=solved[body].position.xyz;
 let local=center-settings.boxCenterRadius.xyz;
 let extent=settings.boxExtentsLink.xyz;
 let outside=local-clamp(local,-extent,extent);
 let distance=length(outside);
 var normal=vec3f(0);
 var gap=distance-settings.boxCenterRadius.w;
 if(distance>0.0){normal=outside/distance;}else{
  let depth=extent-abs(local);var face=0u;
  if(depth.y<depth.x){face=1u;}if(depth.z<depth[face]){face=2u;}
  normal[face]=select(-1.0,1.0,local[face]>=0.0);
  gap= -depth[face]-settings.boxCenterRadius.w;
 }
 var jacobian:array<f32,N>;var response:array<f32,N>;
 for(var joint=i32(body);joint>=0;joint=i32(links[joint].parentAnchor.w)){
  jacobian[joint]=dot(normal,linearColumn(joint,center));
 }
 var inverseContactMass=0.0;
 for(var row=0u;row<N;row++){
  for(var column=0u;column<N;column++){response[row]+=inverse[row][column]*jacobian[column];}
  inverseContactMass+=jacobian[row]*response[row];
 }
 // Speculate across the remaining gap; correct existing overlap gradually.
 let separationSpeed=select(-gap/dt,min(2.0,0.2*max(0.0,-gap-0.0001)/dt),gap<0.0);
 var normalImpulse=0.0;`:``}
${r||i?`preparePayload(dt,&inverse);if(counters[1]!=0u){return;}`:``}
 // Implicit spring/damper impulses in coupled joint space. Project each update
 // onto its torque budget and propagate the resulting velocity change to all axes.
 for(var sweep=0u;sweep<64u;sweep++){
  var change=0.0;
  for(var i=0u;i<N;i++){
   let drive=drives[i];let resistance=dt*(drive.z+dt*drive.y);
   let residual=dt*drive.y*(drive.x-angle[i])-resistance*speed[i]-impulse[i];
   let next=clamp(impulse[i]+residual/(1.0+resistance*inverse[i][i]),-dt*drive.w,dt*drive.w);
   let delta=next-impulse[i];impulse[i]=next;change=max(change,abs(delta));
   for(var j=0u;j<N;j++){speed[j]+=inverse[j][i]*delta;}
  }
  ${t?`if(inverseContactMass>1e-9){
   var normalSpeed=0.0;
   for(var j=0u;j<N;j++){normalSpeed+=jacobian[j]*speed[j];}
   let next=max(0.0,normalImpulse+(separationSpeed-normalSpeed)/inverseContactMass);
   let delta=next-normalImpulse;normalImpulse=next;change=max(change,abs(delta));
   for(var j=0u;j<N;j++){speed[j]+=response[j]*delta;}
  }`:``}
${r||i?`change=max(change,solvePayload());`:``}
  if(change<1e-7){break;}
 }
 for(var i=0u;i<N;i++){angle[i]+=dt*speed[i];}
 kinematics();
 for(var i=0u;i<N;i++){let pose=solved[i];
  if(!finite(vec4f(angle[i],speed[i],impulse[i]/dt,0))||!finite(pose.position)||!finite(pose.rotation)||!finite(pose.velocity)||!finite(pose.spin)){counters[1]=1u;return;}
 }
 ${r?`payload.position+=dt*payload.velocity;
 payload.rotation=normalize(payload.rotation+0.5*dt*product(vec4f(payload.spin.xyz,0),payload.rotation));
 if(!finite(payload.position)||!finite(payload.rotation)||!finite(payload.velocity)||!finite(payload.spin)){counters[1]=1u;return;}
 poses[N]=payload;`:``}
${o?`publishLinkContacts();if(counters[1]!=0u){return;}`:i?`for(var index=0u;index<${i}u;index++){
 if(!finite(vec4f(velocities[index],0))||!finite(vec4f(spins[index],0))){counters[1]=1u;return;}
 }
 for(var index=0u;index<${i}u;index++){
 for(var pad=0u;pad<2u;pad++){
   if(index==0u){counters[2u+pad]=0u;}
   if(contacts[index*2u+pad].rows[0].accumulated>1e-8){counters[2u+pad]|=1u<<index;}
 }
 boxes[index].velocity=vec4f(velocities[index],boxes[index].velocity.w);boxes[index].spin=vec4f(spins[index],0);
 }`:``}
 for(var i=0u;i<N;i++){coordinates[i]=vec4f(angle[i],speed[i],impulse[i]/dt,0);poses[i]=solved[i];}
 ${t?`counters[2]=bitcast<u32>(normalImpulse/dt);`:``}
 ${n?`for(var i=0u;i<${r?`N+1u`:`N`};i++){
  let pose=poses[i];let q=pose.rotation;
  matrices[i]=mat4x4f(vec4f(rotate(q,vec3f(1,0,0)),0),vec4f(rotate(q,vec3f(0,1,0)),0),vec4f(rotate(q,vec3f(0,0,1)),0),pose.position);
 }`:``}
 counters[0]++;
}
`}var M=class{timeStep;id;links;indices=new Map;buffers=[];base;gravity;contact;payload;publishMatrices;get poseMatrices(){return this.buffers[6]??null}initialState;worldContacts=!1;destroyed=!1;constructor(e){this.id=e.id??`articulation-tree`,this.timeStep=e.timeStep??1/120,this.payload=structuredClone(e.payload),this.contact=structuredClone(e.contact),this.publishMatrices=!!e.publishMatrices,this.links=structuredClone([...e.links]),this.base=[...e.base??[0,0,0]],this.gravity=[...e.gravity??[0,0,-9.81]];let t=e=>Number.isFinite(Math.fround(e));if(!this.links.length||this.links.length>16||!t(this.timeStep)||Math.fround(this.timeStep)<=0||![...this.base,...this.gravity].every(t))throw Error(`Invalid articulation settings`);for(let[e,n]of this.links.entries()){if(!n.id||n.jointType===`prismatic`&&!n.axis||this.indices.has(n.id)||!Number.isInteger(n.parent)||n.parent<-1||n.parent>=e||!t(n.mass)||Math.fround(n.mass)<=0||!n.inertia.every(e=>t(e)&&Math.fround(e)>0)||![...n.parentAnchor,...n.childAnchor,n.angle??0,n.speed??0].every(t)||(n.axis?!(Math.abs(Math.hypot(...n.axis)-1)<1e-6):n.angle||n.speed)||n.restOrientation&&!(Math.abs(Math.hypot(...n.restOrientation)-1)<1e-6))throw Error(`Invalid articulation link`);this.indices.set(n.id,e)}let n=this.payload;if(n&&(n.pads.length!==2||n.pads[0].link===n.pads[1].link||!n.pads.every(e=>this.indices.has(e.link))||![...n.position,n.supportHeight].every(t)||![n.mass,...n.halfExtents,...n.pads.map(e=>e.radius)].every(e=>t(e)&&Math.fround(e)>0)||![n.friction,n.supportFriction].every(e=>t(e)&&e>=0)))throw Error(`Invalid articulation payload`);let r=this.contact;if(r&&(!this.indices.has(r.link)||!r.center.every(t)||![r.radius,...r.halfExtents].every(e=>t(e)&&Math.fround(e)>0)))throw Error(`Invalid articulation contact`)}addToGraph(e,n){let r=n?.colliders,i=r?.flatMap(({link:e,shape:t,position:n=[0,0,0],orientation:r=[0,0,0,1]})=>{let i=t.type===`box`?[...t.halfExtents]:t.type===`capsule`?[t.radiusTop,t.height/2,0]:[t.radius,0,0];if(!this.indices.has(e)||t.type===`capsule`&&t.radiusTop!==t.radiusBottom||![...n,...r,...i].every(Number.isFinite)||Math.abs(Math.hypot(...r)-1)>1e-5||i[0]<=0||i[1]<0||t.type===`box`&&(i[1]<=0||i[2]<=0))throw Error(`Invalid link collider`);return[...n,this.indices.get(e),...r,...i,t.type===`sphere`?0:t.type===`capsule`?1:2]});if(n&&(this.payload||this.contact||(r?r.length===0||r.length>16:!n.pads||n.pads.length!==2||n.pads[0].link===n.pads[1].link)||!Number.isFinite(n.friction)||n.friction<0||n.pads?.some(e=>!this.indices.has(e.link)||!Number.isFinite(e.radius)||e.radius<=0)))throw Error(`Invalid world contact pads`);if(this.destroyed||this.buffers.length)throw Error(`Inactive or already registered articulation`);let a=[`links`,`drives`,`coordinates`,`poses`,`counters`,`settings`],o=this.links.length+Number(!!this.payload),s=new Float32Array(o*16);this.payload&&s.set([...this.payload.position,1,0,0,0,1],this.links.length*16);let c=[new Float32Array(this.links.flatMap(e=>[...e.parentAnchor,e.parent,...e.childAnchor,Number(e.jointType===`prismatic`),...e.axis??[0,0,0],e.mass,...e.inertia,0,...e.restOrientation??[0,0,0,1]])),new Float32Array(this.links.length*4),new Float32Array(this.links.flatMap(e=>[e.angle??0,e.speed??0,0,0])),s,new Uint32Array(r?296:4),new Float32Array([...this.base,0,...this.gravity,this.timeStep,...this.contact?.center??[0,0,0],this.contact?.radius??0,...this.contact?.halfExtents??[0,0,0],this.contact?this.indices.get(this.contact.link):0,...this.payload?[...this.payload.halfExtents,this.payload.mass,this.payload.supportHeight,this.payload.friction,this.payload.supportFriction,0,...this.payload.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:n?[0,0,0,0,0,n.friction,0,0,...i??n.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:[]])];this.publishMatrices&&(a.push(`matrices`),c.push(new Float32Array(o*16)));try{let i=c.map((t,n)=>{let r=(n===5?j.UNIFORM:j.STORAGE)|j.COPY_SRC|j.COPY_DST,i=e.device.createBuffer({id:this.id+`-`+a[n],data:t,usage:r});return this.buffers.push(i),e.importBuffer({id:i.id,byteLength:i.byteLength,usage:r},i)});this.initialState=()=>{for(let e of[1,2,3,4])this.buffers[e].write(c[e]);this.publishMatrices&&this.buffers[6].write(c[6])},n&&(this.worldContacts=!0,a.push(`boxes`),i.push(n.boxes));let o=i.map((e,t)=>({buffer:e,usage:t===5?`uniform`:t<2?`storage-read`:`storage-read-write`})),s={attributes:[],bindings:a.map((e,t)=>t===5?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:t<2?`read-only-storage`:`storage`})},l={source:le(this.links.length,!!this.contact,this.publishMatrices,!!this.payload,n?.count??0,r?.length??0,this.links.some(e=>e.jointType===`prismatic`)),shaderLayout:s},u=e=>({encode:({computePass:t,getBuffer:n})=>{let r={};a.forEach((e,t)=>{r[e]=n(i[t])}),e.kernel.dispatch(t,{bindings:r,x:1})},destroy:()=>e.kernel.destroy()});return e.addComputePass({id:i[0].id+`-joint-space`,description:`Integrate joint-space dynamics and publish articulated link poses.`,resources:o,compile:({device:e})=>u(ie(e,l)),compileAsync:async({device:e})=>u(await t(e,l))}),i[3]}catch(e){throw this.destroy(),e}}reset(){if(!this.initialState)throw Error(`Inactive articulation`);this.initialState()}driveIndex(e,t=`revolute`){let n=this.indices.get(e);if(this.destroyed||!this.buffers.length||n===void 0||!this.links[n].axis)throw Error(`Inactive or missing joint drive`);if((this.links[n].jointType??`revolute`)!==t)throw Error(`Unexpected joint type`);return n}setDrive(e,t){let n=this.driveIndex(e);this.writeDrive(n,t.angle,t.stiffness,t.damping,t.maximumTorque)}setLinearDrive(e,t){let n=this.driveIndex(e,`prismatic`);this.writeDrive(n,t.position,t.stiffness,t.damping,t.maximumForce)}writeDrive(e,t,n,r,i){let a=new Float32Array([t,n,r,i]);if(!a.every(Number.isFinite)||a.slice(1).some(e=>e<0))throw Error(`Invalid articulation drive`);this.buffers[1].write(a,e*16)}async readTorque(e){return this.readEffort(this.driveIndex(e))}async readForce(e){return this.readEffort(this.driveIndex(e,`prismatic`))}async readEffort(e){let t=await this.buffers[2].readAsync(e*16+8,4);return new DataView(t.buffer,t.byteOffset,4).getFloat32(0,!0)}async readState(){let e=await this.buffers[3].readAsync(),t=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return Array.from({length:t.length/16},(e,n)=>{let r=n*16;return{position:Array.from(t.subarray(r,r+3)),orientation:Array.from(t.subarray(r+4,r+8)),velocity:Array.from(t.subarray(r+8,r+11)),angularVelocity:Array.from(t.subarray(r+12,r+15))}})}async readSimulationDiagnostics(){let e=await this.buffers[4].readAsync(),t=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4);return{steps:t[0],complete:t[1]===0,...t.length>4?{candidatePairs:t[4],activeContacts:t[5],contactPairs:Array.from({length:t[5]},(e,n)=>({body:t[8+n*12],collider:t[9+n*12]})),contactOverflow:t[6]!==0,reusedContacts:t[7]}:{},...this.worldContacts?{padContactMasks:[t[2],t[3]]}:{},...this.contact?{normalForce:new DataView(e.buffer,e.byteOffset).getFloat32(8,!0)}:{}}}destroy(){this.initialState=void 0,this.destroyed=!0;for(let e of this.buffers)e.destroy();this.buffers.length=0}};function ue(e,t=!1){let{bodies:n,joints:a}=f(3),o=n[6].shape,s=n[7].shape;if(o?.type!==`sphere`||s?.type!==`box`)throw Error(`Invalid arm fixture`);let c=n.slice(2,7).map((e,t)=>{let n=a.find(e=>e.second===t+2),r=e.shape;if(r?.type!==`box`&&r?.type!==`sphere`)throw Error(`Invalid link`);return{id:n.id??`payload`,parent:n.first-2,parentAnchor:n.firstFrame.position,childAnchor:n.secondFrame?.position??[0,0,0],axis:n.type===`fixed`?void 0:[0,1,0],mass:e.mass,inertia:m(e.mass,r)}}),l=e?new M({links:c,base:n[1].position,publishMatrices:t,contact:{link:`payload`,radius:o.radius,center:n[7].position,halfExtents:s.halfExtents}}):new p({bodies:n.map(e=>({...e,friction:0,restitution:0})),joints:a,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:t});return{world:l,bodies:n,seatHeight:n[7].position[2]+s.halfExtents[2]+o.radius,command(e){for(let t of i){let n=t===`elbow`?e?.65:-.3:0,i=t===`elbow`&&e?25:300;l instanceof M?l.setDrive(t,{angle:n,maximumTorque:i,stiffness:r,damping:70}):l.setAngularActuator(t,1,{angle:n,maximumTorque:i})}},async payloadHeight(){return(await l.readState())[e?4:6].position[2]}}}var de=class extends g{constructor(e){let{sizeX:t,sizeZ:r,nx:i=1,nz:a=1}=e;h(t,`sizeX`),h(r,`sizeZ`),n(i,`nx`),n(a,`nz`);let o=[],s=[],c=[],l=[];for(let e=0;e<=a;e++){let n=e/a;for(let e=0;e<=i;e++){let a=e/i;o.push((a-.5)*t,0,(.5-n)*r),s.push(0,1,0),c.push(a,n)}}let u=i+1;for(let e=0;e<a;e++)for(let t=0;t<i;t++){let n=e*u+t,r=n+1,i=n+u,a=i+1;l.push(n,r,a,n,a,i)}let d=o.length/3;super({id:e.id,topology:`triangle-list`,indices:ne(d,l),attributes:{POSITION:{size:3,value:new Float32Array(o)},NORMAL:{size:3,value:new Float32Array(s)},TEXCOORD_0:{size:2,value:new Float32Array(c)},...e.attributes}})}},fe=class extends g{constructor(e){let{sample:t,normal:r,uSegments:i=32,vSegments:a=32,periodicU:o=!1,periodicV:s=!1}=e;n(i,`uSegments`),n(a,`vSegments`);let c=(i+1)*(a+1),l=i*a*6;if(!Number.isSafeInteger(l)||l>4294967295)throw RangeError(`Surface exceeds 32-bit index-buffer length`);if(!Number.isSafeInteger(c)||c>4294967295)throw RangeError(`Surface exceeds 32-bit indexing`);let u=new Float32Array(c*3),d=new Float32Array(c*3),f=new Float32Array(c*2),p=(e,t)=>t?(e%1+1)%1:Math.max(0,Math.min(1,e)),m=(e,n)=>pe(t(p(e,o),p(n,s))),h=1e-5,g=0;for(let e=0;e<=a;e++)for(let t=0;t<=i;t++,g++){let n=t/i,c=e/a,l=p(n,o),_=p(c,s);u.set(m(l,_),g*3);let v;if(r)v=pe(r(l,_));else{let e=m(l-h,_),t=m(l+h,_),n=m(l,_-h),r=m(l,_+h),i=N(t.map((t,n)=>t-e[n])),a=N(r.map((e,t)=>e-n[t]));v=[i[1]*a[2]-i[2]*a[1],i[2]*a[0]-i[0]*a[2],i[0]*a[1]-i[1]*a[0]]}d.set(N(v),g*3),f.set([n,c],g*2)}for(let e of u)if(!Number.isFinite(e))throw RangeError(`Positions must be representable as Float32`);let _=c>65535?new Uint32Array(l):new Uint16Array(l),v=i+1,y=0;for(let e=0;e<a;e++)for(let t=0;t<i;t++){let n=e*v+t,r=n+1,i=n+v,a=i+1;_[y++]=n,_[y++]=r,_[y++]=a,_[y++]=n,_[y++]=a,_[y++]=i}super({id:e.id,topology:`triangle-list`,indices:_,attributes:{POSITION:{size:3,value:u},NORMAL:{size:3,value:d},TEXCOORD_0:{size:2,value:f},...e.attributes}})}};function pe(e){if(!e||e.length!==3||!Array.from(e).every(Number.isFinite))throw RangeError(`Surface samples and normals must be finite triples`);return Array.from(e)}function N(e){let t=Math.max(...e.map(Math.abs));if(!t)return[0,0,0];let n=e.map(e=>e/t),r=Math.hypot(...n);return n.map(e=>e===0?0:e/r)}var me=class extends fe{constructor(e){let{points:t,segments:n=48,phiStart:r=0,phiLength:i=Math.PI*2}=e;if(!t||t.length<2||t.some(e=>e.length!==2||!e.every(Number.isFinite)||e[0]<0))throw RangeError(`Lathe needs at least two finite [nonnegative radius, height] points`);if(!Number.isFinite(r)||!Number.isFinite(i)||i<=0||i>Math.PI*2)throw RangeError(`Invalid lathe angular sweep`);if(n<3)throw RangeError(`Lathe requires at least three angular segments`);let a=t.map(e=>[...e]),o=a.slice(1).map((e,t)=>{let n=e[0]-a[t][0],r=e[1]-a[t][1];if(n===0&&r===0)throw RangeError(`Consecutive profile points must differ`);return N([r,-n,0])}),s=a.map((e,t)=>{let n=o[Math.max(0,t-1)],r=o[Math.min(t,o.length-1)];return N(n.map((e,t)=>e+r[t]))}),c=e=>{let t=e*(a.length-1),n=Math.min(a.length-2,Math.floor(t));return{i:n,t:t-n}};super({...e,uSegments:n,vSegments:a.length-1,periodicU:i===Math.PI*2,sample:(e,t)=>{let{i:n,t:o}=c(t),s=a[n][0]*(1-o)+a[n+1][0]*o,l=a[n][1]*(1-o)+a[n+1][1]*o,u=r+e*i;return[s*Math.cos(u),l,-s*Math.sin(u)]},normal:(e,t)=>{let{i:n,t:a}=c(t),o=s[n].map((e,t)=>e*(1-a)+s[n+1][t]*a),l=r+e*i;return[o[0]*Math.cos(l),o[1],-o[0]*Math.sin(l)]}})}},he=class extends D{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?ge(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&=(this.model.destroy(),null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}};function ge(e,t){let n=O();for(let r of t)S(n,e,r);return x(n)?n:null}var _e=class extends re{constructor(e={}){let{innerRadius:t=.5,outerRadius:n=1,height:r=.2,segments:i=48,startAngle:a=0,angle:o=Math.PI*2}=e;ae(Number.isFinite(t)&&t>=0&&Number.isFinite(n)&&n>t&&Number.isFinite(r)&&r>0&&Number.isFinite(a)&&Number.isFinite(o)&&o>0&&o<=Math.PI*2&&Number.isInteger(i)&&i>=3);let s=r/2,c=[[[n,-s],[n,s]],[[n,s],[t,s]],[[t,-s],[n,-s]]];t>0&&c.push([[t,s],[t,-s]]);let l=c.map(e=>new me({points:e,segments:i,phiStart:a,phiLength:o}));if(o<Math.PI*2)for(let[e,i]of[a,a+o].entries()){let a=new de({sizeX:n-t,sizeZ:r}),o=a.attributes.POSITION.value,s=a.attributes.NORMAL.value,c=Math.cos(i),u=Math.sin(i),d=e===0?1:-1;for(let e=0;e<o.length;e+=3){let r=Number(o[e])+(t+n)/2,i=-d*Number(o[e+2]);o[e]=r*c,o[e+1]=i,o[e+2]=-r*u,s[e]=d*u,s[e+1]=0,s[e+2]=d*c}l.push(a)}let u=[],d=[],f=[],p=[];for(let e of l){let t=u.length/3;for(let t of e.attributes.POSITION.value)u.push(t);for(let t of e.attributes.NORMAL.value)d.push(t);for(let t of e.attributes.TEXCOORD_0.value)f.push(t);for(let n of e.indices.value)p.push(Number(n)+t)}super({id:e.id,topology:`triangle-list`,indices:new Uint32Array(p),attributes:{POSITION:{size:3,value:new Float32Array(u)},NORMAL:{size:3,value:new Float32Array(d)},TEXCOORD_0:{size:2,value:new Float32Array(f)},...e.attributes}})}};function ve(e){if(!e.every(Number.isFinite)||Math.abs(e[3])+Math.abs(e[7])+Math.abs(e[11])>1e-7||Math.abs(e[15]-1)>1e-7)throw Error(`Expected an affine transform`);let t=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(t.every(e=>e===0))return{position:[e[12],e[13],e[14]],rotation:[0,0,0,1],scale:t};if(t.some(e=>e<1e-10))throw Error(`Singular collider transforms are unsupported`);e.determinant()<0&&(t[0]=-t[0]);let n=[e[0]/t[0],e[1]/t[0],e[2]/t[0],e[4]/t[1],e[5]/t[1],e[6]/t[1],e[8]/t[2],e[9]/t[2],e[10]/t[2]];for(let[e,t]of[[0,1],[0,2],[1,2]]){let r=n[e*3]*n[t*3]+n[e*3+1]*n[t*3+1]+n[e*3+2]*n[t*3+2];if(Math.abs(r)>1e-5)throw Error(`Sheared collider transforms are unsupported`)}let r=new _().fromMatrix3(n).normalize();return{position:[e[12],e[13],e[14]],rotation:[r[0],r[1],r[2],r[3]],scale:t}}var ye=class{joints;constructor(e){this.joints=e}resolve(e,t){let n=new Map,r=new Map,i=(e,a,o)=>{if(n.has(e))throw Error(`Joint scene must be a tree`);let s=new y(a).multiplyRight(e.matrix),c=t.has(e)?e:o;if(n.set(e,s),r.set(e,c),e instanceof A)for(let t of e.children)i(t,s,c)};for(let t of e)i(t,new y,null);let a=e=>{let t=n.get(e);if(!t)throw Error(`Joint attachment is outside the scene`);let i=r.get(e)??null,a=new y(t);if(i){let e=ve(n.get(i));a=new y().translate(e.position).multiplyRight(new y().fromQuaternion(e.rotation)).invert().multiplyRight(a)}let o=ve(a);return{body:i,position:o.position,orientation:o.rotation}};return this.joints.map(e=>({joint:e,first:a(e.first),second:a(e.second)}))}};function be(e,t,n){let r=e=>{let r=e?t.get(e):n;if(r===void 0)throw Error(`Missing physics body for joint attachment`);return r},i={type:`general`,id:e.joint.id??e.joint.first.id,first:r(e.first.body),second:r(e.second.body),firstFrame:{position:e.first.position,orientation:e.first.orientation},secondFrame:{position:e.second.position,orientation:e.second.orientation},enabled:e.joint.enabled,collideConnected:e.joint.collideConnected},a=(e.joint.limits??[]).map(e=>({...i,...e}));for(let{axis:t,angular:n,...r}of e.joint.drives??[])a.push({...i,axes:[t],angular:n,drive:r});return a.length?a:[{...i,axes:[0]}]}function xe(e,t,n,r=[]){let i=new Map,a=[{node:e,parent:new y}];for(;a.length;){let{node:e,parent:t}=a.pop();ae(!i.has(e));let n=new y(t).multiplyRight(e.matrix);if(i.set(e,n),e instanceof A)for(let t=e.children.length-1;t>=0;t--)a.push({node:e.children[t],parent:n})}let o=[],c=new Map,u=new Map,d=new Map;for(let e of i.keys()){let n=t.get(e)?.geometry??(e instanceof ee||e instanceof E?e.geometry:e instanceof he?e.model.sourceGeometry:null);if(!(n instanceof g))continue;let r=e instanceof he&&e.instanceMatrices?e.instanceMatrices.map(e=>new y(e)):[new y];u.set(e,{geometry:n,placements:r});let i=n.attributes.POSITION;if(!i||i.size!==3)continue;let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0];for(let e of r)for(let t=0;t<i.value.length;t+=3){let n=e.transformAsPoint([i.value[t],i.value[t+1],i.value[t+2]]);for(let e=0;e<3;e++)a[e]=Math.min(a[e],n[e]),o[e]=Math.max(o[e],n[e])}r.length&&d.set(e,[a,o])}for(let[e,n]of t){let r=i.get(e);if(!r)throw Error(`Physics node is outside the scene: ${e.id}`);let{position:a,rotation:d,scale:f}=ve(r),p=new y().translate(a).multiplyRight(new y().fromQuaternion(d)).invert(),m=[];if(n.collider&&n.collider!==`geometry`){let e=n.collider;if(e.type===`convex-hull`||e.type===`triangle-mesh`){let t=e.geometry.positions.map((e,t)=>e*f[t%3]),n=[...e.geometry.indices];if(f[0]*f[1]*f[2]<0)for(let e=0;e<n.length;e+=3)[n[e+1],n[e+2]]=[n[e+2],n[e+1]];m.push({shape:e.type===`convex-hull`?{type:`convex-hull`,geometry:s(t)}:{type:`triangle-mesh`,geometry:l(t,n)}})}else m.push({shape:oe(e,f.map(Math.abs))})}else{let r=[e];for(;r.length;){let a=r.pop();if(a!==e&&t.has(a))continue;let o=u.get(a);if(!o&&a instanceof he)throw Error(`Missing CPU collision geometry for model node ${a.id}; supply an explicit collider`);if(o)for(let e of o.placements)m.push(Se(o.geometry,new y(p).multiplyRight(i.get(a)).multiplyRight(e),n.geometryMode,n.motion===`static`));if(a instanceof A)for(let e=a.children.length-1;e>=0;e--)r.push(a.children[e])}}if(!m.length)throw Error(`No CPU collision geometry for physics node: ${e.id}`);let{motion:h=`dynamic`,collider:g,geometry:_,geometryMode:v,...b}=n;c.set(e,o.length),o.push({colliders:m,position:a,orientation:d,mode:h,mass:h===`static`?0:1,...b})}if(!o.length)throw Error(`Physics scene has no bodies`);let f=new ye(r).resolve([e],new Set(c.keys())),p;return f.some(e=>!e.first.body||!e.second.body)&&(p=o.length,o.push({mode:`static`,mass:0,position:[0,0,0],colliders:[]})),{roots:[e],localBounds:d,definition:{bodies:c,world:{...n,bodies:o,joints:f.flatMap(e=>be(e,c,p))}}}}function Se(e,t,n,r=!1){let i=e.attributes.POSITION;if(e.topology!==`triangle-list`||!i||i.size!==3)throw Error(`Physics cooking requires triangle-list POSITION geometry`);let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0],c=0;for(let e=0;e<i.value.length;e+=3){c=Math.max(c,Math.hypot(i.value[e],i.value[e+1],i.value[e+2]));for(let t=0;t<3;t++)a[t]=Math.min(a[t],i.value[e+t]),o[t]=Math.max(o[t],i.value[e+t])}let u;!n&&r&&o.some((e,t)=>e===a[t])&&(n=`triangle-mesh`);let d=ve(t),f=d.scale.map(Math.abs),p=e instanceof w&&Array.from(i.value).every((e,t)=>Math.min(Math.abs(e-a[t%3]),Math.abs(e-o[t%3]))<1e-6),m=(e instanceof b||e instanceof C)&&f.every(e=>Math.abs(e-f[0])<1e-6)&&Array.from({length:i.value.length/3},(e,t)=>Math.hypot(i.value[t*3],i.value[t*3+1],i.value[t*3+2])).every(e=>Math.abs(e-c)<1e-6*Math.max(1,c));if(!n&&p){let e=o.map((e,t)=>(e-a[t])*f[t]/2),n=t.transformAsPoint(a.map((e,t)=>(e+o[t])/2));return{shape:{type:`box`,halfExtents:[e[0],e[1],e[2]]},position:[n[0],n[1],n[2]],orientation:d.rotation}}if(!n&&m)return{shape:{type:`sphere`,radius:c*f[0]},position:d.position,orientation:d.rotation};let h=[];for(let e=0;e<i.value.length;e+=3)h.push(...t.transformAsPoint([i.value[e],i.value[e+1],i.value[e+2]]));if(n===`triangle-mesh`){let n=e.indices?Array.from(e.indices.value):Array.from({length:h.length/3},(e,t)=>t);if(t.determinant()<0)for(let e=0;e<n.length;e+=3)[n[e+1],n[e+2]]=[n[e+2],n[e+1]];u={type:`triangle-mesh`,geometry:l(h,n)}}else u={type:`convex-hull`,geometry:s(h)};return{shape:u}}var Ce=[-.68,0,.68],we=-.55,Te=-.32,P=.74,F=1.65,I=.44;function L(e,t,n=.15,r=.4){return{id:e,uniforms:{baseColorFactor:[...t,1],metallicRoughnessValues:[n,r]}}}var Ee=L(`graphite`,[.27,.32,.34]),De=L(`steel`,[.12,.18,.2]),R=[L(`brushed-aluminum`,[.74,.76,.78],.54,.34),L(`satin-nickel`,[.61,.59,.55],.51,.38),L(`gunmetal`,[.35,.39,.42],.48,.31)],z=[{name:`Shim`,size:[.15,.18,.16],mass:.35},{name:`Spacer`,size:[.18,.17,.22],mass:.55},{name:`Billet`,size:[.22,.2,.19],mass:.8},{name:`Die`,size:[.18,.21,.25],mass:2.5},{name:`Gauge block`,size:[.23,.19,.21],mass:4.8},{name:`Counterweight`,size:[.21,.22,.27],mass:12}],Oe=e=>(e-(z.length-1)/2)*2*Math.PI/z.length;function ke(e,t,n){let r=new A({id:`bin-workcell`}),i=new w,a=new Map,o=new Map;function s(e,t,n,s,c,l){let u=new y().scale(s),d=new y().translate(t).rotateZ(n).multiplyRight(u),f=new k({id:e,geometry:i,matrix:d,material:l});r.add(f),o.set(f,u),a.set(f,{motion:c?`dynamic`:`static`,mass:c,friction:c?1:.65**2,restitution:0})}if(s(`bench`,[0,0,-.12],0,[2.4,2.4,.12],0,Ee),e.ring){let e=new _e({innerRadius:.299,outerRadius:.312,height:.0015}),i=L(`inlaid-target`,[.78,.76,.69],.18,.64);for(let[a,o]of z.entries()){let c=Oe(a),l=t-I;r.add(new k({id:`target-`+a,geometry:e,material:i,matrix:new y().translate([l*Math.cos(c),l*Math.sin(c),.002]).rotateX(Math.PI/2)})),s(o.name,[t*Math.cos(c),t*Math.sin(c),o.size[2]],c,o.size,n*o.mass,R[a%R.length])}}else for(let[r,i]of Ce.entries()){let a=e.obstructed&&r<2,o=e.drop&&r===2?F:a?Ce[e.target]:i,c=a?r===0?-.23:.23:0,l=e.parts&&e.drop&&r===2?t*Math.cos(Te)-P*Math.sin(Te):t+(r===e.target?e.offset??0:0);s(`workpiece-`+r,[l*Math.cos(o)-c*Math.sin(o),l*Math.sin(o)+c*Math.cos(o),.24],o,[.19,a?.105:.2,.24],n,R[r])}if(e.parts){let n=139,r=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=Math.ceil(Math.sqrt(e.parts)*1.25),a=3;for(let n=0;n<i&&a<e.parts;n++)for(let o=0;o<i&&a<e.parts;o++){let e=(o-(i-1)/2)*4.5/i,c=(n-(i-1)/2)*4.5/i;if(Math.abs(e)>2.28||Math.abs(c)>2.28||Math.hypot(e,c)<.48||[...Ce,1.65].some(n=>Math.hypot(e-t*Math.cos(n),c-t*Math.sin(n))<.55))continue;let l=.8/i,u=[l*(.55+r()*.4),l*(.55+r()*.4),l*(.7+r())];s(`stock-`+a,[e,c,u[2]],r()*Math.PI,u,.15+r()*.2,R[a%R.length]),a++}e.gate&&s(`forearm-stop`,[.73,.34,.78],0,[.08,.09,.78],0,L(`ochre`,[.88,.56,.06]))}let c=t*Math.cos(F),l=t*Math.sin(F);if(!e.ring)for(let e of[-1,1])s(`tray-x-`+e,[c+e*.47,l,.045],0,[.025,.49,.045],0,De),s(`tray-y-`+e,[c,l+e*.47,.045],0,[.445,.025,.045],0,De);let{definition:u}=xe(r,a,{});return{root:r,ring:!!e.ring,bodies:u.world.bodies,bind(t,n,i){let a=new Map;for(let[t,n]of o){let r=u.bodies.get(t);a.set(t,{matrixIndex:i&&r>0?r+(e.ring?6:5):r,localMatrix:n})}r.transformSource={getFrame:()=>({matrices:t,matrixCount:n,revision:0,bindings:a})}}}}var B=[`Open`,`Grip`,`Lift`,`Carry`,`Lower`,`Release`],V=1.4;function Ae(e,t=.9,n=!1,r={}){let i=r.bin,a=i?.ring?7:6,o=[0,0,.98],s=[.19,.2,.24],c=.095,l=[{position:[0,0,-.12],mass:0,shape:{type:`box`,halfExtents:[3,3,.12]},friction:.65**2},{position:[0,0,.4],mass:0,shape:{type:`sphere`,radius:.055}}],u=[],d=[],f=[];function h(e,n,r,i,a,o,s,c,p=`revolute`){let h=d.length,g=[0,0,0];g[a]=1,d.push({id:e,parent:n,parentAnchor:r,childAnchor:i,axis:g,jointType:p,mass:s,inertia:m(s,c)}),f.push(a),l.push({position:o,mass:s,shape:c,friction:t**2,restitution:0});let _={id:e,type:`general`,first:n+2,second:h+2,firstFrame:{position:n===-1?[0,0,.58]:r},secondFrame:{position:i}},v=[0,1,2],y=v.filter(e=>e!==a),b=p===`revolute`;u.push({..._,axes:b?v:y,minimum:0,maximum:0},{..._,angular:!0,axes:b?y:v,minimum:0,maximum:0},{..._,angular:b,axes:[a],drive:{positionTarget:0,velocityTarget:0,stiffness:900,damping:45,maximumForce:100}})}h(`turret`,-1,[0,0,0],[0,0,0],2,o,1,{type:`sphere`,radius:.085}),h(`boom`,0,[0,0,0],[-1.4/2,0,0],1,[V/2,0,o[2]],1,{type:`box`,halfExtents:[V/2,.055,.055]});let g=-1;i?.ring&&(h(`slide`,1,[V/2,0,0],[0,0,0],0,[V,0,o[2]],.35,{type:`box`,halfExtents:[.1,.46,.075]},`prismatic`),g=u.length-1);for(let e of[-1,1])h(e<0?`left`:`right`,i?.ring?2:1,[i?.ring?0:V/2,e*.41,0],[0,0,P],0,[V,e*.41,.24],.3,{type:`sphere`,radius:c});let _=[V,0,s[2]];l.push({position:_,mass:r.mass??1,shape:{type:`box`,halfExtents:s},friction:1,restitution:0});let v=i?.ring?Oe(0):i?Ce[i.target]:0,y=i?F:1;if(i){if(v===void 0)throw RangeError(`Invalid bin target`);d[0].angle=v;let e=[0,0,Math.sin(v/2),Math.cos(v/2)];for(let t of l.slice(2,a)){let[n,r,i]=t.position;t.position=[n*Math.cos(v)-r*Math.sin(v),n*Math.sin(v)+r*Math.cos(v),i],t.orientation=e}}let b=i?ke(i,V,r.mass??1):void 0;b&&(l[0]=b.bodies[0],l.splice(a,1,...b.bodies.slice(1)));let x=[{link:`left`,radius:c},{link:`right`,radius:c}],S=[...x.map(e=>({link:e.link,shape:{type:`sphere`,radius:e.radius}})),{link:`boom`,shape:{type:`capsule`,radiusTop:.065,radiusBottom:.065,height:1.28},orientation:[0,0,Math.SQRT1_2,Math.SQRT1_2]},{link:i?.ring?`slide`:`boom`,position:[i?.ring?0:V/2,0,0],shape:{type:`box`,halfExtents:[.1,.46,.075]}}];if((i?.parts||i?.ring)&&!e){let{shape:e,...t}=l[3];l[3]={...t,inertiaDiagonal:d[1].inertia,centerOfMass:[0,0,0],colliders:S.slice(2).filter(e=>e.link===`boom`).map(({shape:e,orientation:t,position:n})=>({position:n,orientation:t,shape:e}))}}let C=i&&e?new p({id:`bin-counterparts`,bodies:[l[0],...l.slice(a)],gravity:[0,0,-9.81],timeStep:1/120,iterations:8,...i.parts?{broadPhase:`hierarchical-grid`,solver:`parallel`}:{},publishPoses:n}):void 0,w=e?new M({base:o,id:r.id,links:d,publishMatrices:n,payload:i?void 0:{mass:r.mass??1,position:_,halfExtents:s,pads:x,friction:t,supportFriction:.65,supportHeight:0}}):new p({bodies:l,...i?.parts?{broadPhase:`hierarchical-grid`}:{},joints:u,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:n}),T=i?we:-.38,E=[`Extend`,`Lower`,`Grip`,`Lift`,`Retract`,`Set down`,`Release`,`Clear`],D=e=>i?.ring?e%E.length===0?144:96:e===3?r.carrySteps??(i?4*Math.ceil(40*Math.abs(y-v)):120):120,O=i&&!i.drop&&!i.obstructed?[...B,`Regrip`,`Raise again`]:[...B];i?.drop&&(O[4]=i.parts?`Lower to stack`:`Drop`,O[5]=i.parts?`Release`:`Settle`);let k=[[v,-.024,0],[v,-.024,.36],[v,T,.36],[y,T,.36],[y,i?.drop?i.parts?Te:T:-.024,i?.drop&&!i.parts?0:.36],[y,i?.drop?i.parts?Te:T:-.024,0],[y,-.024,.36],[y,T,.36]];if(i?.ring){O.length=0,k.length=0;for(let[e,t]of z.entries()){let n=Oe(e),r=Math.asin((o[2]-P-t.size[2])/V),i=Math.asin((o[2]-P-t.size[2])/(V-I));for(let n of E)O.push(`${e+1}/${z.length} · ${t.name} · ${n}`);k.push([n,T,0,0],[n,r,0,0],[n,r,.36,0],[n,T,.36,0],[n,T,.36,-I],[n,i,.36,-I],[n,i,0,-I],[n,T,0,-I])}}return{world:w,bodies:l,binWorld:C,workcell:b,phaseNames:O,armBodyCount:a,travelSteps:D,targetIndex:e=>i?.ring?Math.floor(e/E.length):i?.target??0,addToGraph(e){C&&w instanceof M?C.addToGraph(e,{tree:w,...i?.parts||i?.ring?{colliders:S}:{pads:x},friction:t**2}):w.addToGraph(e)},command(e,t=0){let n=Math.min(1,t/D(e)),a=n*n*(3-2*n),[o,s,c,l]=k[e].map((t,n)=>k[Math.max(0,e-1)][n]+a*(t-k[Math.max(0,e-1)][n])),p=i?.ring?[o,s,l,c,-c]:[o,s,c,-c];d.forEach((e,t)=>{if(e.jointType===`prismatic`){let t={position:l,stiffness:1e3,damping:60,maximumForce:80};if(w instanceof M)w.setLinearDrive(e.id,t);else{let e=u[g];e.type===`general`&&w.setJointParameters(g,{...e,drive:{positionTarget:l,stiffness:t.stiffness,damping:t.damping,maximumForce:t.maximumForce}})}return}let n=p[t],i=t>=2?r.torque??32:100;w instanceof M?w.setDrive(e.id,{angle:n,stiffness:900,damping:45,maximumTorque:i}):w.setAngularActuator(e.id,f[t],{angle:n,maximumTorque:i})})},async positions(){let t=await w.readState(),n=C?(await C.readState()).slice(1):[];return[...t.slice(e?0:2),...n].map(e=>e.position)}}}var je=180,Me=4,Ne=B.length*je;function Pe(e,t){let n=t.querySelector(`button`),r=t.querySelector(`output`),i=t.querySelector(`.results`);n.disabled=!1,n.onclick=()=>{n.disabled=!0,i.replaceChildren(),Fe(e,r,i).catch(e=>{r.value=String(e)}).finally(()=>{n.disabled=!1})}}async function Fe(e,t,n){let r=new v(e),i=[];try{for(let e of[8,32]){let t=document.createElement(`table`);t.createCaption().textContent=`Grip cap ${e} N·m`;let a=t.createTHead().insertRow();for(let e of[`Mass / μ`,`0`,`0.35`,`0.9`]){let t=document.createElement(`th`);t.textContent=e,a.append(t)}n.append(t);for(let n of[.5,1,3]){let a=t.insertRow(),o=document.createElement(`th`);o.scope=`row`,o.textContent=n+` kg`,a.append(o);for(let t of[0,.35,.9]){let o=a.insertCell(),s=document.createElement(`a`);s.href=`./gripper.html?`+new URLSearchParams({replay:`1`,mass:String(n),torque:String(e),friction:String(t)}),s.title=`Open this trial in 3D`,s.textContent=`Ready`,o.append(s);let c=Ae(!0,t,!1,{id:`grasp-`+i.length,mass:n,torque:e});i.push({trial:c,cell:o,link:s,heights:[]}),c.world.addToGraph(r)}}}t.value=`Compiling GPU trials…`;let a=await r.compileAsync();try{let n=0;for(let r=0;r<B.length;r++){t.value=`${B[r]} · ${i.length} trials`;for(let t=0;t<je;t+=Me){let o=performance.now();if(t<=120)for(let{trial:e}of i)e.command(r,t);let s=e.createCommandEncoder();for(let e=0;e<Me;e++)a.encode(s,{parameters:void 0});e.submit(s.finish());let c=e.createFence();try{await c.signaled}finally{c.destroy()}n+=performance.now()-o}await Promise.all(i.map(async e=>{let[t,n,i]=(await e.trial.positions())[4];if(e.heights.push(i),r<B.length-1){e.link.textContent=i.toFixed(2)+` m`;return}let a=await e.trial.world.readSimulationDiagnostics(),o=Math.hypot(t-V*Math.cos(1),n-V*Math.sin(1)),s=`placed`,c=`Placed`;!a.complete||a.steps!==Ne||![...e.heights,o].every(Number.isFinite)?(s=`incomplete`,c=`Incomplete`):(e.heights[2]<=.58||e.heights[3]<=.58||o>=.25||Math.abs(i-.24)>=.06)&&(s=`missed`,c=`Missed bay`,e.heights[2]<=.58?c=`No lift`:e.heights[3]<=.58&&(c=`Lost in carry`)),e.cell.dataset.result=s,e.link.textContent=c,e.link.title=`Lift ${e.heights[2].toFixed(2)} m · Landing error ${o.toFixed(2)} m · Open in 3D`}))}t.value=`Completed · ${Math.round(i.length*Ne*1e3/n).toLocaleString()} world-steps/s`}finally{a.destroy()}}finally{for(let{trial:e}of i)e.world.destroy()}}var H=document.body.dataset.lab===`gripper`,U=new URLSearchParams(location.search);function Ie(e,t,n,r){let i=U.get(e),a=i===null?t:Number(i);return Number.isFinite(a)&&a>=n&&a<=r?a:t}var W=Ie(`friction`,.9,0,1),G=Ie(`torque`,32,1,64),K=Ie(`mass`,G<16?.5:1,.25,4),Le=Math.max(G<16?.75:3,K),q=document.querySelector(`#block-mass`),J=document.querySelector(`#block-weight`);q&&J&&(q.max=String(Le),q.value=String(K),J.value=K+` kg`);var Y=document.querySelector(`#grasp-scenario`),Re=U.get(`bin`)??(!H||U.has(`mass`)||U.has(`friction`)||U.has(`replay`)?`single`:`ring`),X=[`left`,`center`,`right`,`obstructed`,`drop`,`crowded`,`gate`,`scale`,`stack`].indexOf(Re??``),Z=Re===`ring`?{target:0,ring:!0}:X>=0?{target:X>=3?1:X,obstructed:X===3,parts:X>=5?X===7?256:64:void 0,gate:X===6,drop:X===4||X===8}:void 0;Z?.ring&&q&&(q.labels[0].textContent=`Load scale`,J.value=K+`×`),Y&&(Y.value=Re??`single`,Y.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`bin`,Y.value),location.href=e.href});var ze=document.querySelector(`#backend`),Q=new URLSearchParams(location.search).get(`solver`)!==`ordered`;ze.value=Q?`tree`:`ordered`,ze.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`solver`,ze.value),location.href=e.href};var $=document.querySelector(`#reading`),Be=document.querySelector(`#world`),Ve=new T({traceTitle:`GPU Graph Timeline`}),He=e(Ve,H?`Pick and place`:`Robot arm`,H?`Two-finger gripper · 120 Hz`:`3 kg work-stop comparison`);try{let e=await c.createDevice({adapters:[o],type:`webgpu`,createCanvasContext:{canvas:Be,autoResize:!0}}),t=H?void 0:ue(Q,!0);async function n(){let n=H?Ae(Q,W,!0,{mass:K,torque:G,bin:Z,carrySteps:!Z&&G<16&&!U.has(`replay`)?360:void 0}):void 0,{world:r,bodies:i}=n??t,a=new v(e);n?n.addToGraph(a):r.addToGraph(a);let o=await a.compileAsync(),s=new te(e,{poseMatrices:r.poseMatrices,count:Q?Z&&n?n.armBodyCount-2:5:i.length},Q?i:void 0,H,n?.workcell,n?.binWorld?.poseMatrices),c=(n&&(r instanceof p?r:n.binWorld))?.createGPUCheckpoint();return c?.save(),{pick:n,world:r,graph:o,scene:s,checkpoint:c}}let{pick:r,world:i,graph:a,scene:s,checkpoint:l}=await n(),f=new d(42,1,.1,200);f.up.set(0,0,1),f.position.fromArray(H?[3.4,-3.6,2.9]:[5,-8,5]);let m=new u(f,Be);m.target.fromArray(H?[.75,.45,.65]:[1.8,0,1.5]),m.update();let h=0,g=0,_=!1,b=r?.phaseNames??B,x=e=>{h=e,g=0,r?.command(e);let t=document.querySelector(`#phase`);t&&(t.value=b[e])},S=!1,C=K,w=document.querySelector(`#cycle`);if(r&&w&&q&&J){Pe(e,document.querySelector(`#grasp-sweep`)),w.onclick=()=>{S=!0,_=!_,w.textContent=_?`Stop cycle`:`Run cycle`},q.disabled=!1,w.disabled=!1,q.oninput=()=>{J.value=q.value+(Z?.ring?`×`:` kg`)},q.onchange=()=>{C=q.valueAsNumber;let e=new URL(location.href);e.searchParams.set(`mass`,q.value),Z?.ring&&e.searchParams.set(`bin`,`ring`),history.replaceState(null,``,e),S=!0,_=!1,w.textContent=`Run cycle`};let t=document.querySelector(`#friction`);Array.from(t.options).some(e=>Number(e.value)===W)||t.add(new Option(String(W),String(W))),t.value=String(W),t.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`friction`,t.value),Z?.ring&&e.searchParams.set(`bin`,`ring`),location.href=e.href},x(0)}else t&&(document.querySelector(`#press`).onclick=()=>t.command(!0),document.querySelector(`#lift`).onclick=()=>t.command(!1),t.command(!0));let T=performance.now(),E=i.timeStep,D=0,O,k=[],ee=async o=>{if(S){if(S=!1,await Promise.all([...k,O]),K!==C){K=C;let e={pick:r,world:i,graph:a,scene:s};({pick:r,world:i,graph:a,scene:s,checkpoint:l}=await n()),e.scene.destroy(),e.graph.destroy(),e.world.destroy(),e.pick?.binWorld?.destroy()}else l?.restore(),i instanceof M&&i.reset();x(0),T=o,E=i.timeStep,D=-1/0}for(E=Math.min(E+(o-T)/1e3,4*i.timeStep),T=o,_&&r&&g>=r.travelSteps(h)+(Z?.ring?24:60)&&(h<b.length-1?x(h+1):(_=!1,w&&(w.textContent=`Run again`)));E>=i.timeStep;){r&&g<=r.travelSteps(h)&&g%4==0&&r.command(h,g);let t=e.createCommandEncoder();Ve.encode(a,t,{parameters:void 0}),e.submit(t.finish()),E-=i.timeStep,g++}f.aspect=Be.clientWidth/Be.clientHeight,f.updateProjectionMatrix(),f.updateMatrixWorld();let c=new y([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(f.projectionMatrix.elements);s.draw(new y(f.matrixWorldInverse.elements),c,[f.position.x,f.position.y,f.position.z]),e.submit(),He.update(),!O&&o-D>250&&(D=o,O=(async()=>{if(r){let e=r.binWorld?.poseMatrices??i.poseMatrices,t=r.targetIndex(h),n=r.binWorld?1+t:r.armBodyCount-(Q?2:0)+t,[a,o]=await Promise.all([e.readAsync((n*16+14)*4,4),Z?.parts&&i instanceof M?i.readSimulationDiagnostics():void 0]),s=new Float32Array(a.buffer,a.byteOffset,1)[0];$.value=`Payload ${Number((K*(Z?.ring?z[t].mass:1)).toFixed(2))} kg · Grip cap ${G} N·m · height ${s.toFixed(3)} m`,o&&($.value+=` · ${Z.parts} parts · ${o.candidatePairs} candidate pairs · ${o.activeContacts} contacts · ${o.reusedContacts} reused`,o.complete||($.value+=` · Solver stopped`))}else if(t){let[e,n]=await Promise.all([t.payloadHeight(),i.readSimulationDiagnostics()]);if(!n.complete)throw Error(`Physics step failed`);$.value=`Payload ${e.toFixed(3)} m · Stop clearance ${(e-t.seatHeight).toFixed(3)} m`,`normalForce`in n&&($.value+=` · ${Number(n.normalForce).toFixed(1)} N`)}})().catch(e=>{$.value=String(e)}).finally(()=>{O=void 0}));let u=e.createFence(),d=u.signaled.finally(()=>{u.destroy()});k.push(d),k.length===2&&await k.shift(),requestAnimationFrame(A)},A=e=>{ee(e).catch(e=>{$.value=String(e)})};requestAnimationFrame(A)}catch(e){$.value=String(e)}