import{A as e,B as t,C as n,D as r,F as i,H as a,I as o,L as s,M as c,N as l,O as u,P as d,R as f,S as p,T as m,U as h,V as g,_,d as v,f as y,g as b,h as x,j as S,k as C,l as w,m as T,p as E,r as D,s as ee,t as te,u as O,w as ne}from"./robot-arm-scene-CxuH41Um.js";import{V as re,z as k}from"./wgsl-interface-scan-BeLN4x0P.js";function ie(e,t){if(t.length!==3||t.some(e=>!Number.isFinite(e)||e<=0))throw Error(`Invalid collider scale`);let[n,r,i]=t,a=(e,t)=>Math.abs(e-t)<=1e-6*Math.max(e,t);switch(e.type){case`box`:return{...e,halfExtents:[e.halfExtents[0]*n,e.halfExtents[1]*r,e.halfExtents[2]*i]};case`plane`:return{...e,sizeX:e.sizeX===void 0?void 0:e.sizeX*n,sizeZ:e.sizeZ===void 0?void 0:e.sizeZ*i};case`sphere`:if(!a(n,r)||!a(n,i))throw Error(`Sphere scale requires an ellipsoid`);return{...e,radius:e.radius*n};case`capsule`:case`cylinder`:if(!a(n,i)||e.type===`capsule`&&!a(n,r))throw Error(`Unsupported tapered collider scale`);return{...e,height:e.height*r,radiusBottom:e.radiusBottom*n,radiusTop:e.radiusTop*n};default:throw Error(`Mesh scale requires a collider rebuild`)}}function ae(e){return`
struct ContactRow {
 direction:vec3f, arm:vec3f, angularResponse:vec3f, effectiveInverseMass:f32,
 jacobian:array<f32,N>, response:array<f32,N>, accumulated:f32
}
struct PayloadContact {rows:array<ContactRow,3>, targetSpeed:f32, enabled:bool}
var<private> payload:Pose;
var<private> contacts:array<PayloadContact,${e?e*2:10}>;
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
   row.jacobian[ancestor]= -dot(direction,cross(axis[ancestor],point-pivot[ancestor]));
  }
  for(var j=0u;j<N;j++){
   for(var k=0u;k<N;k++){row.response[j]+=(*inverse)[j][k]*row.jacobian[k];}
   row.effectiveInverseMass+=row.jacobian[j]*row.response[j];
  }
  contacts[index].rows[component]=row;
 }
}
fn preparePayload(dt:f32,inverse:ptr<function,array<array<f32,N>,N>>){
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
 for(var index=0u;index<${e?e*2:10}u;index++){
  if(!contacts[index].enabled){continue;}
  ${e?`currentBox=index/2u;let box=boxes[currentBox];
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
`}function oe(e,t=!1,n=!1,r=!1,i=0){return`
const N = ${e}u;
struct Link {
  parentAnchor:vec4f, childAnchor:vec4f, axisMass:vec4f, inertia:vec4f, rest:vec4f
}
struct Pose { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f }
struct Settings { base:vec4f, gravityStep:vec4f, boxCenterRadius:vec4f, boxExtentsLink:vec4f ${r||i?`, payloadSizeMass:vec4f, surface:vec4f, pads:array<vec4f,2>`:``} }
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
${i?`${c}
@group(0) @binding(${n?7:6}) var<storage,read_write> boxes:array<WorldBox>;`:``}
${r||i?ae(i):``}
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
   let linear=cross(axis[row],center-pivot[row]);
   force[row]+=dot(linear,load)+dot(axis[row],moment);
   let angularMass=inertia(body,axis[row]);
   for(var column=i32(body);column>=0;column=i32(links[column].parentAnchor.w)){
    mass[row][column]+=links[body].axisMass.w*dot(linear,cross(axis[column],center-pivot[column]))+dot(angularMass,axis[column]);
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
  jacobian[joint]=dot(normal,cross(axis[joint],center-pivot[joint]));
 }
 var inverseContactMass=0.0;
 for(var row=0u;row<N;row++){
  for(var column=0u;column<N;column++){response[row]+=inverse[row][column]*jacobian[column];}
  inverseContactMass+=jacobian[row]*response[row];
 }
 // Speculate across the remaining gap; correct existing overlap gradually.
 let separationSpeed=select(-gap/dt,min(2.0,0.2*max(0.0,-gap-0.0001)/dt),gap<0.0);
 var normalImpulse=0.0;`:``}
${r||i?`preparePayload(dt,&inverse);`:``}
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
${i?`for(var index=0u;index<${i}u;index++){
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
`}var A=class{timeStep;id;links;indices=new Map;buffers=[];base;gravity;contact;payload;publishMatrices;get poseMatrices(){return this.buffers[6]??null}initialState;worldContacts=!1;destroyed=!1;constructor(e){this.id=e.id??`articulation-tree`,this.timeStep=e.timeStep??1/120,this.payload=structuredClone(e.payload),this.contact=structuredClone(e.contact),this.publishMatrices=!!e.publishMatrices,this.links=structuredClone([...e.links]),this.base=[...e.base??[0,0,0]],this.gravity=[...e.gravity??[0,0,-9.81]];let t=e=>Number.isFinite(Math.fround(e));if(!this.links.length||this.links.length>16||!t(this.timeStep)||Math.fround(this.timeStep)<=0||![...this.base,...this.gravity].every(t))throw Error(`Invalid articulation settings`);for(let[e,n]of this.links.entries()){if(!n.id||this.indices.has(n.id)||!Number.isInteger(n.parent)||n.parent<-1||n.parent>=e||!t(n.mass)||Math.fround(n.mass)<=0||!n.inertia.every(e=>t(e)&&Math.fround(e)>0)||![...n.parentAnchor,...n.childAnchor,n.angle??0,n.speed??0].every(t)||(n.axis?!(Math.abs(Math.hypot(...n.axis)-1)<1e-6):n.angle||n.speed)||n.restOrientation&&!(Math.abs(Math.hypot(...n.restOrientation)-1)<1e-6))throw Error(`Invalid articulation link`);this.indices.set(n.id,e)}let n=this.payload;if(n&&(n.pads.length!==2||n.pads[0].link===n.pads[1].link||!n.pads.every(e=>this.indices.has(e.link))||![...n.position,n.supportHeight].every(t)||![n.mass,...n.halfExtents,...n.pads.map(e=>e.radius)].every(e=>t(e)&&Math.fround(e)>0)||![n.friction,n.supportFriction].every(e=>t(e)&&e>=0)))throw Error(`Invalid articulation payload`);let r=this.contact;if(r&&(!this.indices.has(r.link)||!r.center.every(t)||![r.radius,...r.halfExtents].every(e=>t(e)&&Math.fround(e)>0)))throw Error(`Invalid articulation contact`)}addToGraph(e,t){if(t&&(this.payload||this.contact||t.pads.length!==2||t.pads[0].link===t.pads[1].link||!Number.isFinite(t.friction)||t.friction<0||t.pads.some(e=>!this.indices.has(e.link)||!Number.isFinite(e.radius)||e.radius<=0)))throw Error(`Invalid world contact pads`);if(this.destroyed||this.buffers.length)throw Error(`Inactive or already registered articulation`);let n=[`links`,`drives`,`coordinates`,`poses`,`counters`,`settings`],r=this.links.length+Number(!!this.payload),i=new Float32Array(r*16);this.payload&&i.set([...this.payload.position,1,0,0,0,1],this.links.length*16);let a=[new Float32Array(this.links.flatMap(e=>[...e.parentAnchor,e.parent,...e.childAnchor,0,...e.axis??[0,0,0],e.mass,...e.inertia,0,...e.restOrientation??[0,0,0,1]])),new Float32Array(this.links.length*4),new Float32Array(this.links.flatMap(e=>[e.angle??0,e.speed??0,0,0])),i,new Uint32Array(4),new Float32Array([...this.base,0,...this.gravity,this.timeStep,...this.contact?.center??[0,0,0],this.contact?.radius??0,...this.contact?.halfExtents??[0,0,0],this.contact?this.indices.get(this.contact.link):0,...this.payload?[...this.payload.halfExtents,this.payload.mass,this.payload.supportHeight,this.payload.friction,this.payload.supportFriction,0,...this.payload.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:t?[0,0,0,0,0,t.friction,0,0,...t.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:[]])];this.publishMatrices&&(n.push(`matrices`),a.push(new Float32Array(r*16)));try{let r=a.map((t,r)=>{let i=(r===5?k.UNIFORM:k.STORAGE)|k.COPY_SRC|k.COPY_DST,a=e.device.createBuffer({id:this.id+`-`+n[r],data:t,usage:i});return this.buffers.push(a),e.importBuffer({id:a.id,byteLength:a.byteLength,usage:i},a)});this.initialState=()=>{for(let e of[1,2,3,4])this.buffers[e].write(a[e]);this.publishMatrices&&this.buffers[6].write(a[6])},t&&(this.worldContacts=!0,n.push(`boxes`),r.push(t.boxes));let i=r.map((e,t)=>({buffer:e,usage:t===5?`uniform`:t<2?`storage-read`:`storage-read-write`})),c={attributes:[],bindings:n.map((e,t)=>t===5?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:t<2?`read-only-storage`:`storage`})},l={source:oe(this.links.length,!!this.contact,this.publishMatrices,!!this.payload,t?.count??0),shaderLayout:c},u=e=>({encode:({computePass:t,getBuffer:i})=>{let a={};n.forEach((e,t)=>{a[e]=i(r[t])}),e.kernel.dispatch(t,{bindings:a,x:1})},destroy:()=>e.kernel.destroy()});return e.addComputePass({id:r[0].id+`-joint-space`,description:`Integrate joint-space dynamics and publish articulated link poses.`,resources:i,compile:({device:e})=>u(o(e,l)),compileAsync:async({device:e})=>u(await s(e,l))}),r[3]}catch(e){throw this.destroy(),e}}reset(){if(!this.initialState)throw Error(`Inactive articulation`);this.initialState()}driveIndex(e){let t=this.indices.get(e);if(this.destroyed||!this.buffers.length||t===void 0||!this.links[t].axis)throw Error(`Inactive or missing revolute drive`);return t}setDrive(e,t){let n=this.driveIndex(e),r=new Float32Array([t.angle,t.stiffness,t.damping,t.maximumTorque]);if(!r.every(Number.isFinite)||r.slice(1).some(e=>e<0))throw Error(`Invalid articulation drive`);this.buffers[1].write(r,n*16)}async readTorque(e){let t=this.driveIndex(e),n=await this.buffers[2].readAsync(t*16+8,4);return new DataView(n.buffer,n.byteOffset,4).getFloat32(0,!0)}async readState(){let e=await this.buffers[3].readAsync(),t=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return Array.from({length:t.length/16},(e,n)=>{let r=n*16;return{position:Array.from(t.subarray(r,r+3)),orientation:Array.from(t.subarray(r+4,r+8)),velocity:Array.from(t.subarray(r+8,r+11)),angularVelocity:Array.from(t.subarray(r+12,r+15))}})}async readSimulationDiagnostics(){let e=await this.buffers[4].readAsync(),t=new Uint32Array(e.buffer,e.byteOffset,4);return{steps:t[0],complete:t[1]===0,...this.worldContacts?{padContactMasks:[t[2],t[3]]}:{},...this.contact?{normalForce:new DataView(e.buffer,e.byteOffset).getFloat32(8,!0)}:{}}}destroy(){this.initialState=void 0,this.destroyed=!0;for(let e of this.buffers)e.destroy();this.buffers.length=0}};function se(e,t=!1){let{bodies:r,joints:a}=m(3),o=r[6].shape,s=r[7].shape;if(o?.type!==`sphere`||s?.type!==`box`)throw Error(`Invalid arm fixture`);let c=r.slice(2,7).map((e,t)=>{let n=a.find(e=>e.second===t+2),r=e.shape;if(r?.type!==`box`&&r?.type!==`sphere`)throw Error(`Invalid link`);return{id:n.id??`payload`,parent:n.first-2,parentAnchor:n.firstFrame.position,childAnchor:n.secondFrame?.position??[0,0,0],axis:n.type===`fixed`?void 0:[0,1,0],mass:e.mass,inertia:i(e.mass,r)}}),l=e?new A({links:c,base:r[1].position,publishMatrices:t,contact:{link:`payload`,radius:o.radius,center:r[7].position,halfExtents:s.halfExtents}}):new S({bodies:r.map(e=>({...e,friction:0,restitution:0})),joints:a,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:t});return{world:l,bodies:r,seatHeight:r[7].position[2]+s.halfExtents[2]+o.radius,command(e){for(let t of n){let n=t===`elbow`?e?.65:-.3:0,r=t===`elbow`&&e?25:300;l instanceof A?l.setDrive(t,{angle:n,maximumTorque:r,stiffness:ne,damping:70}):l.setAngularActuator(t,1,{angle:n,maximumTorque:r})}},async payloadHeight(){return(await l.readState())[e?4:6].position[2]}}}var j=class extends T{model;instanceMatrices;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.instanceMatrices=e.instanceMatrices||null,this.bounds=e.bounds?this.instanceMatrices?ce(e.bounds,this.instanceMatrices):e.bounds:null,this.setProps(e)}destroy(){this.model&&=(this.model.destroy(),null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}};function ce(e,t){let n=E();for(let r of t)y(n,e,r);return v(n)?n:null}function M(e){if(!e.every(Number.isFinite)||Math.abs(e[3])+Math.abs(e[7])+Math.abs(e[11])>1e-7||Math.abs(e[15]-1)>1e-7)throw Error(`Expected an affine transform`);let n=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];if(n.every(e=>e===0))return{position:[e[12],e[13],e[14]],rotation:[0,0,0,1],scale:n};if(n.some(e=>e<1e-10))throw Error(`Singular collider transforms are unsupported`);e.determinant()<0&&(n[0]=-n[0]);let r=[e[0]/n[0],e[1]/n[0],e[2]/n[0],e[4]/n[1],e[5]/n[1],e[6]/n[1],e[8]/n[2],e[9]/n[2],e[10]/n[2]];for(let[e,t]of[[0,1],[0,2],[1,2]]){let n=r[e*3]*r[t*3]+r[e*3+1]*r[t*3+1]+r[e*3+2]*r[t*3+2];if(Math.abs(n)>1e-5)throw Error(`Sheared collider transforms are unsupported`)}let i=new t().fromMatrix3(r).normalize();return{position:[e[12],e[13],e[14]],rotation:[i[0],i[1],i[2],i[3]],scale:n}}var le=class{joints;constructor(e){this.joints=e}resolve(e,t){let n=new Map,r=new Map,i=(e,a,o)=>{if(n.has(e))throw Error(`Joint scene must be a tree`);let s=new g(a).multiplyRight(e.matrix),c=t.has(e)?e:o;if(n.set(e,s),r.set(e,c),e instanceof O)for(let t of e.children)i(t,s,c)};for(let t of e)i(t,new g,null);let a=e=>{let t=n.get(e);if(!t)throw Error(`Joint attachment is outside the scene`);let i=r.get(e)??null,a=new g(t);if(i){let e=M(n.get(i));a=new g().translate(e.position).multiplyRight(new g().fromQuaternion(e.rotation)).invert().multiplyRight(a)}let o=M(a);return{body:i,position:o.position,orientation:o.rotation}};return this.joints.map(e=>({joint:e,first:a(e.first),second:a(e.second)}))}};function ue(e,t,n){let r=e=>{let r=e?t.get(e):n;if(r===void 0)throw Error(`Missing physics body for joint attachment`);return r},i={type:`general`,id:e.joint.id??e.joint.first.id,first:r(e.first.body),second:r(e.second.body),firstFrame:{position:e.first.position,orientation:e.first.orientation},secondFrame:{position:e.second.position,orientation:e.second.orientation},enabled:e.joint.enabled,collideConnected:e.joint.collideConnected},a=(e.joint.limits??[]).map(e=>({...i,...e}));for(let{axis:t,angular:n,...r}of e.joint.drives??[])a.push({...i,axes:[t],angular:n,drive:r});return a.length?a:[{...i,axes:[0]}]}function de(e,t,n,r=[]){let i=new Map,a=[{node:e,parent:new g}];for(;a.length;){let{node:e,parent:t}=a.pop();re(!i.has(e));let n=new g(t).multiplyRight(e.matrix);if(i.set(e,n),e instanceof O)for(let t=e.children.length-1;t>=0;t--)a.push({node:e.children[t],parent:n})}let o=[],s=new Map,c=new Map,u=new Map;for(let e of i.keys()){let n=t.get(e)?.geometry??(e instanceof ee||e instanceof w?e.geometry:e instanceof j?e.model.sourceGeometry:null);if(!(n instanceof p))continue;let r=e instanceof j&&e.instanceMatrices?e.instanceMatrices.map(e=>new g(e)):[new g];c.set(e,{geometry:n,placements:r});let i=n.attributes.POSITION;if(!i||i.size!==3)continue;let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0];for(let e of r)for(let t=0;t<i.value.length;t+=3){let n=e.transformAsPoint([i.value[t],i.value[t+1],i.value[t+2]]);for(let e=0;e<3;e++)a[e]=Math.min(a[e],n[e]),o[e]=Math.max(o[e],n[e])}r.length&&u.set(e,[a,o])}for(let[e,n]of t){let r=i.get(e);if(!r)throw Error(`Physics node is outside the scene: ${e.id}`);let{position:a,rotation:u,scale:f}=M(r),p=new g().translate(a).multiplyRight(new g().fromQuaternion(u)).invert(),m=[];if(n.collider&&n.collider!==`geometry`){let e=n.collider;if(e.type===`convex-hull`||e.type===`triangle-mesh`){let t=e.geometry.positions.map((e,t)=>e*f[t%3]),n=[...e.geometry.indices];if(f[0]*f[1]*f[2]<0)for(let e=0;e<n.length;e+=3)[n[e+1],n[e+2]]=[n[e+2],n[e+1]];m.push({shape:e.type===`convex-hull`?{type:`convex-hull`,geometry:l(t)}:{type:`triangle-mesh`,geometry:d(t,n)}})}else m.push({shape:ie(e,f.map(Math.abs))})}else{let r=[e];for(;r.length;){let a=r.pop();if(a!==e&&t.has(a))continue;let o=c.get(a);if(!o&&a instanceof j)throw Error(`Missing CPU collision geometry for model node ${a.id}; supply an explicit collider`);if(o)for(let e of o.placements)m.push(fe(o.geometry,new g(p).multiplyRight(i.get(a)).multiplyRight(e),n.geometryMode,n.motion===`static`));if(a instanceof O)for(let e=a.children.length-1;e>=0;e--)r.push(a.children[e])}}if(!m.length)throw Error(`No CPU collision geometry for physics node: ${e.id}`);let{motion:h=`dynamic`,collider:_,geometry:v,geometryMode:y,...b}=n;s.set(e,o.length),o.push({colliders:m,position:a,orientation:u,mode:h,mass:h===`static`?0:1,...b})}if(!o.length)throw Error(`Physics scene has no bodies`);let f=new le(r).resolve([e],new Set(s.keys())),m;return f.some(e=>!e.first.body||!e.second.body)&&(m=o.length,o.push({mode:`static`,mass:0,position:[0,0,0],colliders:[]})),{roots:[e],localBounds:u,definition:{bodies:s,world:{...n,bodies:o,joints:f.flatMap(e=>ue(e,s,m))}}}}function fe(e,t,n,r=!1){let i=e.attributes.POSITION;if(e.topology!==`triangle-list`||!i||i.size!==3)throw Error(`Physics cooking requires triangle-list POSITION geometry`);let a=[1/0,1/0,1/0],o=[-1/0,-1/0,-1/0],s=0;for(let e=0;e<i.value.length;e+=3){s=Math.max(s,Math.hypot(i.value[e],i.value[e+1],i.value[e+2]));for(let t=0;t<3;t++)a[t]=Math.min(a[t],i.value[e+t]),o[t]=Math.max(o[t],i.value[e+t])}let c;!n&&r&&o.some((e,t)=>e===a[t])&&(n=`triangle-mesh`);let u=M(t),f=u.scale.map(Math.abs),p=e instanceof x&&Array.from(i.value).every((e,t)=>Math.min(Math.abs(e-a[t%3]),Math.abs(e-o[t%3]))<1e-6),m=(e instanceof _||e instanceof b)&&f.every(e=>Math.abs(e-f[0])<1e-6)&&Array.from({length:i.value.length/3},(e,t)=>Math.hypot(i.value[t*3],i.value[t*3+1],i.value[t*3+2])).every(e=>Math.abs(e-s)<1e-6*Math.max(1,s));if(!n&&p){let e=o.map((e,t)=>(e-a[t])*f[t]/2),n=t.transformAsPoint(a.map((e,t)=>(e+o[t])/2));return{shape:{type:`box`,halfExtents:[e[0],e[1],e[2]]},position:[n[0],n[1],n[2]],orientation:u.rotation}}if(!n&&m)return{shape:{type:`sphere`,radius:s*f[0]},position:u.position,orientation:u.rotation};let h=[];for(let e=0;e<i.value.length;e+=3)h.push(...t.transformAsPoint([i.value[e],i.value[e+1],i.value[e+2]]));if(n===`triangle-mesh`){let n=e.indices?Array.from(e.indices.value):Array.from({length:h.length/3},(e,t)=>t);if(t.determinant()<0)for(let e=0;e<n.length;e+=3)[n[e+1],n[e+2]]=[n[e+2],n[e+1]];c={type:`triangle-mesh`,geometry:d(h,n)}}else c={type:`convex-hull`,geometry:l(h)};return{shape:c}}var N=[-.68,0,.68],P=1.65;function pe(e,t,n){let r=new O({id:`bin-workcell`}),i=new x,a=new Map,o=new Map;function s(e,t,n,s,c,l){let u=new g().scale(s),d=new g().translate(t).rotateZ(n).multiplyRight(u),f=new D({id:e,geometry:i,matrix:d,material:{id:e+`-finish`,uniforms:{baseColorFactor:[...l,1],metallicRoughnessValues:[.15,.4]}}});r.add(f),o.set(f,u),a.set(f,{motion:c?`dynamic`:`static`,mass:c,friction:c?1:.65**2,restitution:0})}s(`bench`,[0,0,-.12],0,[2.4,2.4,.12],0,[.27,.32,.34]);let c=[[.035,.55,.5],[.92,.29,.045],[.42,.56,.84]];for(let[r,i]of N.entries()){let a=e.obstructed&&r<2,o=e.drop&&r===2?P:a?N[e.target]:i,l=a?r===0?-.23:.23:0,u=t+(r===e.target?e.offset??0:0);s(`workpiece-`+r,[u*Math.cos(o)-l*Math.sin(o),u*Math.sin(o)+l*Math.cos(o),.24],o,[.19,a?.105:.2,.24],n,c[r])}let l=t*Math.cos(P),u=t*Math.sin(P);for(let e of[-1,1])s(`tray-x-`+e,[l+e*.47,u,.045],0,[.025,.49,.045],0,[.12,.18,.2]),s(`tray-y-`+e,[l,u+e*.47,.045],0,[.445,.025,.045],0,[.12,.18,.2]);let{definition:d}=de(r,a,{});return{root:r,bodies:d.world.bodies,bind(e,t,n){let i=new Map;for(let[e,t]of o){let r=d.bodies.get(e);i.set(e,{matrixIndex:n&&r>0?r+5:r,localMatrix:t})}r.transformSource={getFrame:()=>({matrices:e,matrixCount:t,revision:0,bindings:i})}}}}var F=[`Open`,`Grip`,`Lift`,`Carry`,`Lower`,`Release`],I=1.4;function me(e,t=.9,n=!1,r={}){let a=[0,0,.98],o=[.19,.2,.24],s=.095,c=[{position:[0,0,-.12],mass:0,shape:{type:`box`,halfExtents:[3,3,.12]},friction:.65**2},{position:[0,0,.4],mass:0,shape:{type:`sphere`,radius:.055}}],l=[],u=[],d=[];function f(e,n,r,a,o,s,f,p){let m=u.length,h=[0,0,0];h[o]=1,u.push({id:e,parent:n,parentAnchor:r,childAnchor:a,axis:h,mass:f,inertia:i(f,p)}),d.push(o),c.push({position:s,mass:f,shape:p,friction:t**2,restitution:0});let g={id:e,type:`general`,first:n+2,second:m+2,firstFrame:{position:n===-1?[0,0,.58]:r},secondFrame:{position:a}};l.push({...g,axes:[0,1,2],minimum:0,maximum:0},{...g,angular:!0,axes:[0,1,2].filter(e=>e!==o),minimum:0,maximum:0},{...g,angular:!0,axes:[o],drive:{positionTarget:0,velocityTarget:0,stiffness:900,damping:45,maximumForce:100}})}f(`turret`,-1,[0,0,0],[0,0,0],2,a,1,{type:`sphere`,radius:.085}),f(`boom`,0,[0,0,0],[-1.4/2,0,0],1,[I/2,0,a[2]],1,{type:`box`,halfExtents:[I/2,.055,.055]});for(let e of[-1,1])f(e<0?`left`:`right`,1,[I/2,e*.41,0],[0,0,.74],0,[I,e*.41,.24],.3,{type:`sphere`,radius:s});let p=[I,0,o[2]];c.push({position:p,mass:r.mass??1,shape:{type:`box`,halfExtents:o},friction:1,restitution:0});let m=r.bin,h=m?N[m.target]:0,g=m?P:1;if(m){if(h===void 0)throw RangeError(`Invalid bin target`);u[0].angle=h;let e=[0,0,Math.sin(h/2),Math.cos(h/2)];for(let t of c.slice(2,6)){let[n,r,i]=t.position;t.position=[n*Math.cos(h)-r*Math.sin(h),n*Math.sin(h)+r*Math.cos(h),i],t.orientation=e}}let _=m?pe(m,I,r.mass??1):void 0;_&&(c[0]=_.bodies[0],c.splice(6,1,..._.bodies.slice(1)));let v=[{link:`left`,radius:s},{link:`right`,radius:s}],y=m&&e?new S({id:`bin-counterparts`,bodies:[c[0],...c.slice(6)],gravity:[0,0,-9.81],timeStep:1/120,iterations:8,publishPoses:n}):void 0,b=e?new A({base:a,id:r.id,links:u,publishMatrices:n,payload:m?void 0:{mass:r.mass??1,position:p,halfExtents:o,pads:v,friction:t,supportFriction:.65,supportHeight:0}}):new S({bodies:c,joints:l,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:n}),x=m?-.55:-.38,C=e=>e===3?r.carrySteps??(m?4*Math.ceil(40*Math.abs(g-h)):120):120,w=m&&!m.drop&&!m.obstructed?[...F,`Regrip`,`Raise again`]:[...F];m?.drop&&(w[4]=`Drop`,w[5]=`Settle`);let T=[[h,-.024,0],[h,-.024,.36],[h,x,.36],[g,x,.36],[g,m?.drop?x:-.024,m?.drop?0:.36],[g,m?.drop?x:-.024,0],[g,-.024,.36],[g,x,.36]];return{world:b,bodies:c,binWorld:y,workcell:_,phaseNames:w,travelSteps:C,addToGraph(e){y&&b instanceof A?y.addToGraph(e,{tree:b,pads:v,friction:t**2}):b.addToGraph(e)},command(e,t=0){let n=Math.min(1,t/C(e)),i=n*n*(3-2*n),[a,o,s]=T[e].map((t,n)=>T[Math.max(0,e-1)][n]+i*(t-T[Math.max(0,e-1)][n])),c=[a,o,s,-s];u.forEach((e,t)=>{let n=c[t],i=t>=2?r.torque??32:100;b instanceof A?b.setDrive(e.id,{angle:n,stiffness:900,damping:45,maximumTorque:i}):b.setAngularActuator(e.id,d[t],{angle:n,maximumTorque:i})})},async positions(){let t=await b.readState(),n=y?(await y.readState()).slice(1):[];return[...t.slice(e?0:2),...n].map(e=>e.position)}}}var he=180,L=4,ge=F.length*he;function _e(e,t){let n=t.querySelector(`button`),r=t.querySelector(`output`),i=t.querySelector(`.results`);n.disabled=!1,n.onclick=()=>{n.disabled=!0,i.replaceChildren(),ve(e,r,i).catch(e=>{r.value=String(e)}).finally(()=>{n.disabled=!1})}}async function ve(e,t,n){let r=new f(e),i=[];try{for(let e of[8,32]){let t=document.createElement(`table`);t.createCaption().textContent=`Grip cap ${e} N·m`;let a=t.createTHead().insertRow();for(let e of[`Mass / μ`,`0`,`0.35`,`0.9`]){let t=document.createElement(`th`);t.textContent=e,a.append(t)}n.append(t);for(let n of[.5,1,3]){let a=t.insertRow(),o=document.createElement(`th`);o.scope=`row`,o.textContent=n+` kg`,a.append(o);for(let t of[0,.35,.9]){let o=a.insertCell(),s=document.createElement(`a`);s.href=`./gripper.html?`+new URLSearchParams({replay:`1`,mass:String(n),torque:String(e),friction:String(t)}),s.title=`Open this trial in 3D`,s.textContent=`Ready`,o.append(s);let c=me(!0,t,!1,{id:`grasp-`+i.length,mass:n,torque:e});i.push({trial:c,cell:o,link:s,heights:[]}),c.world.addToGraph(r)}}}t.value=`Compiling GPU trials…`;let a=await r.compileAsync();try{let n=0;for(let r=0;r<F.length;r++){t.value=`${F[r]} · ${i.length} trials`;for(let t=0;t<he;t+=L){let o=performance.now();if(t<=120)for(let{trial:e}of i)e.command(r,t);let s=e.createCommandEncoder();for(let e=0;e<L;e++)a.encode(s,{parameters:void 0});e.submit(s.finish());let c=e.createFence();try{await c.signaled}finally{c.destroy()}n+=performance.now()-o}await Promise.all(i.map(async e=>{let[t,n,i]=(await e.trial.positions())[4];if(e.heights.push(i),r<F.length-1){e.link.textContent=i.toFixed(2)+` m`;return}let a=await e.trial.world.readSimulationDiagnostics(),o=Math.hypot(t-I*Math.cos(1),n-I*Math.sin(1)),s=`placed`,c=`Placed`;!a.complete||a.steps!==ge||![...e.heights,o].every(Number.isFinite)?(s=`incomplete`,c=`Incomplete`):(e.heights[2]<=.58||e.heights[3]<=.58||o>=.25||Math.abs(i-.24)>=.06)&&(s=`missed`,c=`Missed bay`,e.heights[2]<=.58?c=`No lift`:e.heights[3]<=.58&&(c=`Lost in carry`)),e.cell.dataset.result=s,e.link.textContent=c,e.link.title=`Lift ${e.heights[2].toFixed(2)} m · Landing error ${o.toFixed(2)} m · Open in 3D`}))}t.value=`Completed · ${Math.round(i.length*ge*1e3/n).toLocaleString()} world-steps/s`}finally{a.destroy()}}finally{for(let{trial:e}of i)e.world.destroy()}}var R=document.body.dataset.lab===`gripper`,z=new URLSearchParams(location.search);function B(e,t,n,r){let i=z.get(e),a=i===null?t:Number(i);return Number.isFinite(a)&&a>=n&&a<=r?a:t}var V=B(`friction`,.9,0,1),H=B(`torque`,32,1,64),U=B(`mass`,H<16?.5:1,.25,4),ye=Math.max(H<16?.75:3,U),W=document.querySelector(`#block-mass`),G=document.querySelector(`#block-weight`);W&&G&&(W.max=String(ye),W.value=String(U),G.value=U+` kg`);var K=document.querySelector(`#grasp-scenario`),q=z.get(`bin`),J=[`left`,`center`,`right`,`obstructed`,`drop`].indexOf(q??``),Y=J>=0?{target:J>=3?1:J,obstructed:J===3,drop:J===4}:void 0;K&&(K.value=q??`single`,K.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`bin`,K.value),location.href=e.href});var X=document.querySelector(`#backend`),Z=new URLSearchParams(location.search).get(`solver`)!==`ordered`;X.value=Z?`tree`:`ordered`,X.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`solver`,X.value),location.href=e.href};var Q=document.querySelector(`#reading`),$=document.querySelector(`#world`),be=new u({traceTitle:`GPU Graph Timeline`}),xe=r(be,R?`Pick and place`:`Robot arm`,R?`Two-finger gripper · 120 Hz`:`3 kg work-stop comparison`);try{let t=await h.createDevice({adapters:[a],type:`webgpu`,createCanvasContext:{canvas:$,autoResize:!0}}),n=R?void 0:se(Z,!0);async function r(){let e=R?me(Z,V,!0,{mass:U,torque:H,bin:Y,carrySteps:!Y&&H<16&&!z.has(`replay`)?360:void 0}):void 0,{world:r,bodies:i}=e??n,a=new f(t);e?e.addToGraph(a):r.addToGraph(a);let o=await a.compileAsync(),s=new te(t,{poseMatrices:r.poseMatrices,count:Z?Y?4:5:i.length},Z?i:void 0,R,e?.workcell,e?.binWorld?.poseMatrices),c=(e&&(r instanceof S?r:e.binWorld))?.createGPUCheckpoint();return c?.save(),{pick:e,world:r,graph:o,scene:s,checkpoint:c}}let{pick:i,world:o,graph:s,scene:c,checkpoint:l}=await r(),u=new e(42,1,.1,200);u.up.set(0,0,1),u.position.fromArray(R?[3.4,-3.6,2.9]:[5,-8,5]);let d=new C(u,$);d.target.fromArray(R?[.75,.45,.65]:[1.8,0,1.5]),d.update();let p=0,m=0,_=!1,v=i?.phaseNames??F,y=e=>{p=e,m=0,i?.command(e);let t=document.querySelector(`#phase`);t&&(t.value=v[e])},b=!1,x=U,w=document.querySelector(`#cycle`);if(i&&w&&W&&G){_e(t,document.querySelector(`#grasp-sweep`)),w.onclick=()=>{b=!0,_=!_,w.textContent=_?`Stop cycle`:`Run cycle`},W.disabled=!1,w.disabled=!1,W.oninput=()=>{G.value=W.value+` kg`},W.onchange=()=>{x=W.valueAsNumber;let e=new URL(location.href);e.searchParams.set(`mass`,W.value),history.replaceState(null,``,e),b=!0,_=!1,w.textContent=`Run cycle`};let e=document.querySelector(`#friction`);Array.from(e.options).some(e=>Number(e.value)===V)||e.add(new Option(String(V),String(V))),e.value=String(V),e.onchange=()=>{let t=new URL(location.href);t.searchParams.set(`friction`,e.value),location.href=t.href},y(0)}else n&&(document.querySelector(`#press`).onclick=()=>n.command(!0),document.querySelector(`#lift`).onclick=()=>n.command(!1),n.command(!0));let T=performance.now(),E=o.timeStep,D=0,ee=async e=>{if(b){if(b=!1,U!==x){U=x;let e={pick:i,world:o,graph:s,scene:c};({pick:i,world:o,graph:s,scene:c,checkpoint:l}=await r()),e.scene.destroy(),e.graph.destroy(),e.world.destroy(),e.pick?.binWorld?.destroy()}else l?.restore(),o instanceof A&&o.reset();y(0),T=e,E=o.timeStep,D=-1/0}for(E=Math.min(E+(e-T)/1e3,4*o.timeStep),T=e,_&&i&&m>=i.travelSteps(p)+60&&(p<v.length-1?y(p+1):(_=!1,w&&(w.textContent=`Run again`)));E>=o.timeStep;){i&&m<=i.travelSteps(p)&&m%4==0&&i.command(p,m);let e=t.createCommandEncoder();be.encode(s,e,{parameters:void 0}),t.submit(e.finish()),E-=o.timeStep,m++}u.aspect=$.clientWidth/$.clientHeight,u.updateProjectionMatrix(),u.updateMatrixWorld();let a=new g([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(u.projectionMatrix.elements);if(c.draw(new g(u.matrixWorldInverse.elements),a,[u.position.x,u.position.y,u.position.z]),t.submit(),xe.update(),e-D>250&&i){let t=await i.positions();Q.value=`Payload ${U} kg · Grip cap ${H} N·m · height ${t[4+(Y?.target??0)][2].toFixed(3)} m`,D=e}else if(e-D>250&&n){let[t,r]=await Promise.all([n.payloadHeight(),o.readSimulationDiagnostics()]);if(!r.complete)throw Error(`Physics step failed`);Q.value=`Payload ${t.toFixed(3)} m · Stop clearance ${(t-n.seatHeight).toFixed(3)} m`,`normalForce`in r&&(Q.value+=` · ${Number(r.normalForce).toFixed(1)} N`),D=e}let d=t.createFence();try{await d.signaled}finally{d.destroy()}requestAnimationFrame(O)},O=e=>{ee(e).catch(e=>{Q.value=String(e)})};requestAnimationFrame(O)}catch(e){Q.value=String(e)}