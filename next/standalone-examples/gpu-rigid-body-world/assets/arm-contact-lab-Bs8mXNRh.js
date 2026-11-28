import{C as e,D as t,E as n,M as r,N as i,O as a,S as o,T as s,_ as c,g as l,h as u,j as d,k as f,t as p,w as m,y as h}from"./robot-arm-scene-DxjZ_FAC.js";import{z as g}from"./wgsl-interface-scan-BeLN4x0P.js";var _=`
struct ContactRow {
 direction:vec3f, arm:vec3f, angularResponse:vec3f, effectiveInverseMass:f32,
 jacobian:array<f32,N>, response:array<f32,N>, accumulated:f32
}
struct PayloadContact {rows:array<ContactRow,3>, targetSpeed:f32, enabled:bool}
var<private> payload:Pose;
var<private> contacts:array<PayloadContact,10>;
fn inversePayloadInertia(moment:vec3f)->vec3f {
 let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;
 let squares=halfSize*halfSize;
 let diagonal=3.0/(settings.payloadSizeMass.w*(squares.yzx+squares.zxy));
 return rotate(q,diagonal*rotate(vec4f(-q.xyz,q.w),moment));
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
  row.effectiveInverseMass=1.0/settings.payloadSizeMass.w+dot(moment,row.angularResponse);
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
 payload=poses[N];
 payload.velocity+=vec4f(dt*settings.gravityStep.xyz,0);
 let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;
 for(var pad=0u;pad<2u;pad++){
  let finger=settings.pads[pad];let link=i32(finger.x);
  let local=rotate(vec4f(-q.xyz,q.w),solved[link].position.xyz-payload.position.xyz);
  let nearest=clamp(local,-halfSize,halfSize);
  let outward=local-nearest;let distance=length(outward);
  var direction=vec3f(0);var gap=distance-finger.y;
  if(distance>0.000001){direction=outward/distance;}else{
   let depth=halfSize-abs(local);var face=0u;
   if(depth.y<depth.x){face=1u;}if(depth.z<depth[face]){face=2u;}
   direction[face]=select(-1.0,1.0,local[face]>=0.0);gap= -depth[face]-finger.y;
  }
  let normal= -rotate(q,direction);
  prepareContact(pad,link,solved[link].position.xyz+normal*finger.y,normal,gap,dt,inverse);
 }
 for(var corner=0u;corner<8u;corner++){
  let signs=vec3f(select(-1.,1.,(corner&1u)!=0u),select(-1.,1.,(corner&2u)!=0u),select(-1.,1.,(corner&4u)!=0u));
  let point=payload.position.xyz+rotate(q,halfSize*signs);
  prepareContact(2u+corner,-1,point,vec3f(0,0,1),point.z-settings.surface.x,dt,inverse);
 }
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
 payload.velocity+=vec4f(row.direction*(delta/settings.payloadSizeMass.w),0);
 payload.spin+=vec4f(row.angularResponse*delta,0);
 for(var j=0u;j<N;j++){speed[j]+=row.response[j]*delta;}
 return abs(delta);
}
fn solvePayload()->f32{
 var change=0.0;
 for(var index=0u;index<10u;index++){
  if(!contacts[index].enabled){continue;}
  let row=contacts[index].rows[0];
  let normal=max(0.,row.accumulated+(contacts[index].targetSpeed-relativeSpeed(row))/row.effectiveInverseMass);
  change=max(change,applyRow(index,0u,normal));
  let first=contacts[index].rows[1];let second=contacts[index].rows[2];
  var friction=vec2f(first.accumulated-relativeSpeed(first)/first.effectiveInverseMass,
   second.accumulated-relativeSpeed(second)/second.effectiveInverseMass);
  let limit=normal*select(settings.surface.z,settings.surface.y,index<2u);
  friction*=min(1.,limit/max(length(friction),1e-12));
  change=max(change,applyRow(index,1u,friction.x));
  change=max(change,applyRow(index,2u,friction.y));
 }
 return change;
}
`;function v(e,t=!1,n=!1,r=!1){return`
const N = ${e}u;
struct Link {
  parentAnchor:vec4f, childAnchor:vec4f, axisMass:vec4f, inertia:vec4f, rest:vec4f
}
struct Pose { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f }
struct Settings { base:vec4f, gravityStep:vec4f, boxCenterRadius:vec4f, boxExtentsLink:vec4f ${r?`, payloadSizeMass:vec4f, surface:vec4f, pads:array<vec4f,2>`:``} }
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
${r?_:``}
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
${r?`preparePayload(dt,&inverse);`:``}
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
${r?`change=max(change,solvePayload());`:``}
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
 for(var i=0u;i<N;i++){coordinates[i]=vec4f(angle[i],speed[i],impulse[i]/dt,0);poses[i]=solved[i];}
 ${t?`counters[2]=bitcast<u32>(normalImpulse/dt);`:``}
 ${n?`for(var i=0u;i<${r?`N+1u`:`N`};i++){
  let pose=poses[i];let q=pose.rotation;
  matrices[i]=mat4x4f(vec4f(rotate(q,vec3f(1,0,0)),0),vec4f(rotate(q,vec3f(0,1,0)),0),vec4f(rotate(q,vec3f(0,0,1)),0),pose.position);
 }`:``}
 counters[0]++;
}
`}var y=class{timeStep;id;links;indices=new Map;buffers=[];base;gravity;contact;payload;publishMatrices;get poseMatrices(){return this.buffers[6]??null}destroyed=!1;constructor(e){this.id=e.id??`articulation-tree`,this.timeStep=e.timeStep??1/120,this.payload=structuredClone(e.payload),this.contact=structuredClone(e.contact),this.publishMatrices=!!e.publishMatrices,this.links=structuredClone([...e.links]),this.base=[...e.base??[0,0,0]],this.gravity=[...e.gravity??[0,0,-9.81]];let t=e=>Number.isFinite(Math.fround(e));if(!this.links.length||this.links.length>16||!t(this.timeStep)||Math.fround(this.timeStep)<=0||![...this.base,...this.gravity].every(t))throw Error(`Invalid articulation settings`);for(let[e,n]of this.links.entries()){if(!n.id||this.indices.has(n.id)||!Number.isInteger(n.parent)||n.parent<-1||n.parent>=e||!t(n.mass)||Math.fround(n.mass)<=0||!n.inertia.every(e=>t(e)&&Math.fround(e)>0)||![...n.parentAnchor,...n.childAnchor,n.angle??0,n.speed??0].every(t)||(n.axis?!(Math.abs(Math.hypot(...n.axis)-1)<1e-6):n.angle||n.speed)||n.restOrientation&&!(Math.abs(Math.hypot(...n.restOrientation)-1)<1e-6))throw Error(`Invalid articulation link`);this.indices.set(n.id,e)}let n=this.payload;if(n&&(n.pads.length!==2||n.pads[0].link===n.pads[1].link||!n.pads.every(e=>this.indices.has(e.link))||![...n.position,n.supportHeight].every(t)||![n.mass,...n.halfExtents,...n.pads.map(e=>e.radius)].every(e=>t(e)&&Math.fround(e)>0)||![n.friction,n.supportFriction].every(e=>t(e)&&e>=0)))throw Error(`Invalid articulation payload`);let r=this.contact;if(r&&(!this.indices.has(r.link)||!r.center.every(t)||![r.radius,...r.halfExtents].every(e=>t(e)&&Math.fround(e)>0)))throw Error(`Invalid articulation contact`)}addToGraph(t){if(this.destroyed||this.buffers.length)throw Error(`Inactive or already registered articulation`);let n=[`links`,`drives`,`coordinates`,`poses`,`counters`,`settings`],r=this.links.length+Number(!!this.payload),i=new Float32Array(r*16);this.payload&&i.set([...this.payload.position,1,0,0,0,1],this.links.length*16);let a=[new Float32Array(this.links.flatMap(e=>[...e.parentAnchor,e.parent,...e.childAnchor,0,...e.axis??[0,0,0],e.mass,...e.inertia,0,...e.restOrientation??[0,0,0,1]])),new Float32Array(this.links.length*4),new Float32Array(this.links.flatMap(e=>[e.angle??0,e.speed??0,0,0])),i,new Uint32Array(4),new Float32Array([...this.base,0,...this.gravity,this.timeStep,...this.contact?.center??[0,0,0],this.contact?.radius??0,...this.contact?.halfExtents??[0,0,0],this.contact?this.indices.get(this.contact.link):0,...this.payload?[...this.payload.halfExtents,this.payload.mass,this.payload.supportHeight,this.payload.friction,this.payload.supportFriction,0,...this.payload.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:[]])];this.publishMatrices&&(n.push(`matrices`),a.push(new Float32Array(r*16)));try{let r=a.map((e,r)=>{let i=(r===5?g.UNIFORM:g.STORAGE)|g.COPY_SRC|g.COPY_DST,a=t.device.createBuffer({id:this.id+`-`+n[r],data:e,usage:i});return this.buffers.push(a),t.importBuffer({id:a.id,byteLength:a.byteLength,usage:i},a)}),i=r.map((e,t)=>({buffer:e,usage:t===5?`uniform`:t<2?`storage-read`:`storage-read-write`})),o={attributes:[],bindings:n.map((e,t)=>t===5?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:t<2?`read-only-storage`:`storage`})},s={source:v(this.links.length,!!this.contact,this.publishMatrices,!!this.payload),shaderLayout:o},c=e=>({encode:({computePass:t,getBuffer:i})=>{let a={};n.forEach((e,t)=>{a[e]=i(r[t])}),e.kernel.dispatch(t,{bindings:a,x:1})},destroy:()=>e.kernel.destroy()});return t.addComputePass({id:r[0].id+`-joint-space`,description:`Integrate joint-space dynamics and publish articulated link poses.`,resources:i,compile:({device:t})=>c(e(t,s)),compileAsync:async({device:e})=>c(await m(e,s))}),r[3]}catch(e){throw this.destroy(),e}}driveIndex(e){let t=this.indices.get(e);if(this.destroyed||!this.buffers.length||t===void 0||!this.links[t].axis)throw Error(`Inactive or missing revolute drive`);return t}setDrive(e,t){let n=this.driveIndex(e),r=new Float32Array([t.angle,t.stiffness,t.damping,t.maximumTorque]);if(!r.every(Number.isFinite)||r.slice(1).some(e=>e<0))throw Error(`Invalid articulation drive`);this.buffers[1].write(r,n*16)}async readTorque(e){let t=this.driveIndex(e),n=await this.buffers[2].readAsync(t*16+8,4);return new DataView(n.buffer,n.byteOffset,4).getFloat32(0,!0)}async readState(){let e=await this.buffers[3].readAsync(),t=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return Array.from({length:t.length/16},(e,n)=>{let r=n*16;return{position:Array.from(t.subarray(r,r+3)),orientation:Array.from(t.subarray(r+4,r+8)),velocity:Array.from(t.subarray(r+8,r+11)),angularVelocity:Array.from(t.subarray(r+12,r+15))}})}async readSimulationDiagnostics(){let e=await this.buffers[4].readAsync(),t=new Uint32Array(e.buffer,e.byteOffset,2);return{steps:t[0],complete:t[1]===0,...this.contact?{normalForce:new DataView(e.buffer,e.byteOffset).getFloat32(8,!0)}:{}}}destroy(){this.destroyed=!0;for(let e of this.buffers)e.destroy();this.buffers.length=0}};function b(e,t=!1){let{bodies:n,joints:r}=c(3),i=n[6].shape,a=n[7].shape;if(i?.type!==`sphere`||a?.type!==`box`)throw Error(`Invalid arm fixture`);let s=n.slice(2,7).map((e,t)=>{let n=r.find(e=>e.second===t+2),i=e.shape;if(i?.type!==`box`&&i?.type!==`sphere`)throw Error(`Invalid link`);return{id:n.id??`payload`,parent:n.first-2,parentAnchor:n.firstFrame.position,childAnchor:n.secondFrame?.position??[0,0,0],axis:n.type===`fixed`?void 0:[0,1,0],mass:e.mass,inertia:o(e.mass,i)}}),d=e?new y({links:s,base:n[1].position,publishMatrices:t,contact:{link:`payload`,radius:i.radius,center:n[7].position,halfExtents:a.halfExtents}}):new h({bodies:n.map(e=>({...e,friction:0,restitution:0})),joints:r,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:t});return{world:d,bodies:n,seatHeight:n[7].position[2]+a.halfExtents[2]+i.radius,command(e){for(let t of u){let n=t===`elbow`?e?.65:-.3:0,r=t===`elbow`&&e?25:300;d instanceof y?d.setDrive(t,{angle:n,maximumTorque:r,stiffness:l,damping:70}):d.setAngularActuator(t,1,{angle:n,maximumTorque:r})}},async payloadHeight(){return(await d.readState())[e?4:6].position[2]}}}var x=[`Open`,`Grip`,`Lift`,`Carry`,`Lower`,`Release`],S=1.4;function C(e,t=.9,n=!1){let r=[0,0,.98],i=[.19,.2,.24],a=.095,s=[{position:[0,0,-.12],mass:0,shape:{type:`box`,halfExtents:[3,3,.12]},friction:.65**2},{position:[0,0,.4],mass:0,shape:{type:`sphere`,radius:.055}}],c=[],l=[],u=[];function d(e,n,r,i,a,d,f,p){let m=l.length,h=[0,0,0];h[a]=1,l.push({id:e,parent:n,parentAnchor:r,childAnchor:i,axis:h,mass:f,inertia:o(f,p)}),u.push(a),s.push({position:d,mass:f,shape:p,friction:t**2,restitution:0});let g={id:e,type:`general`,first:n+2,second:m+2,firstFrame:{position:n===-1?[0,0,.58]:r},secondFrame:{position:i}};c.push({...g,axes:[0,1,2],minimum:0,maximum:0},{...g,angular:!0,axes:[0,1,2].filter(e=>e!==a),minimum:0,maximum:0},{...g,angular:!0,axes:[a],drive:{positionTarget:0,velocityTarget:0,stiffness:900,damping:45,maximumForce:100}})}d(`turret`,-1,[0,0,0],[0,0,0],2,r,1,{type:`sphere`,radius:.085}),d(`boom`,0,[0,0,0],[-1.4/2,0,0],1,[S/2,0,r[2]],1,{type:`box`,halfExtents:[S/2,.055,.055]});for(let e of[-1,1])d(e<0?`left`:`right`,1,[S/2,e*.41,0],[0,0,.74],0,[S,e*.41,.24],.3,{type:`sphere`,radius:a});let f=[S,0,i[2]];s.push({position:f,mass:1,shape:{type:`box`,halfExtents:i},friction:1,restitution:0});let p=e?new y({base:r,links:l,publishMatrices:n,payload:{mass:1,position:f,halfExtents:i,pads:[{link:`left`,radius:a},{link:`right`,radius:a}],friction:t,supportFriction:.65,supportHeight:0}}):new h({bodies:s,joints:c,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:n}),m=[[0,-.024,0],[0,-.024,.36],[0,-.38,.36],[1,-.38,.36],[1,-.024,.36],[1,-.024,0]];return{world:p,bodies:s,command(e,t=0){let n=Math.min(1,t/120),r=n*n*(3-2*n),[i,a,o]=m[e].map((t,n)=>m[Math.max(0,e-1)][n]+r*(t-m[Math.max(0,e-1)][n])),s=[i,a,o,-o];l.forEach((e,t)=>{let n=s[t],r=t>=2?32:100;p instanceof y?p.setDrive(e.id,{angle:n,stiffness:900,damping:45,maximumTorque:r}):p.setAngularActuator(e.id,u[t],{angle:n,maximumTorque:r})})},async positions(){return(await p.readState()).slice(e?0:2).map(e=>e.position)}}}var w=document.body.dataset.lab===`gripper`,T=new URLSearchParams(location.search).get(`friction`)===`0`?0:.9,E=document.querySelector(`#backend`),D=new URLSearchParams(location.search).get(`solver`)!==`ordered`;E.value=D?`tree`:`ordered`,E.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`solver`,E.value),location.href=e.href};var O=document.querySelector(`#reading`),k=document.querySelector(`#world`),A=new n({traceTitle:`GPU Graph Timeline`}),j=s(A,w?`Pick and place`:`Robot arm`,w?`Two-finger gripper · 120 Hz`:`3 kg work-stop comparison`);try{let e=await i.createDevice({adapters:[r],type:`webgpu`,createCanvasContext:{canvas:k,autoResize:!0}}),n=w?void 0:b(D,!0),o=w?C(D,T,!0):void 0,{world:s,bodies:c}=o??n,l=new f(e);s.addToGraph(l);let u=await l.compileAsync(),m=new p(e,{poseMatrices:s.poseMatrices,count:D?5:c.length},D?c:void 0,w),h=new a(42,1,.1,200);h.up.set(0,0,1),h.position.fromArray(w?[3.4,-3.6,2.9]:[5,-8,5]);let g=new t(h,k);g.target.fromArray(w?[.75,.45,.65]:[1.8,0,1.5]),g.update();let _=0,v=0,y=!1,S=e=>{_=e,v=0,o?.command(e);let t=document.querySelector(`#phase`);t&&(t.value=x[e]);let n=document.querySelector(`#advance`);n&&(n.textContent=e<5?`Next · `+x[e+1]:`Complete`,n.disabled=e===x.length-1,document.querySelector(`#cycle`).disabled=n.disabled)};if(o){let e=document.querySelector(`#advance`);e.onclick=()=>{y=!1,S(Math.min(_+1,5))},document.querySelector(`#cycle`).onclick=()=>{y=!0},document.querySelector(`#reset`).onclick=()=>location.reload();let t=document.querySelector(`#friction`);t.value=String(T),t.onchange=()=>{let e=new URL(location.href);e.searchParams.set(`friction`,t.value),location.href=e.href},S(0)}else n&&(document.querySelector(`#press`).onclick=()=>n.command(!0),document.querySelector(`#lift`).onclick=()=>n.command(!1),n.command(!0));let E=performance.now(),M=s.timeStep,N=0,P=async t=>{for(M=Math.min(M+(t-E)/1e3,4*s.timeStep),E=t,y&&v>=180&&(_<5?S(_+1):y=!1);M>=s.timeStep;){o&&v<=120&&v%4==0&&o.command(_,v);let t=e.createCommandEncoder();A.encode(u,t,{parameters:void 0}),e.submit(t.finish()),M-=s.timeStep,v++}h.aspect=k.clientWidth/k.clientHeight,h.updateProjectionMatrix(),h.updateMatrixWorld();let r=new d([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(h.projectionMatrix.elements);if(m.draw(new d(h.matrixWorldInverse.elements),r,[h.position.x,h.position.y,h.position.z]),e.submit(),j.update(),t-N>250&&o)O.value=`Payload height ${(await o.positions())[4][2].toFixed(3)} m`,N=t;else if(t-N>250&&n){let[e,r]=await Promise.all([n.payloadHeight(),s.readSimulationDiagnostics()]);if(!r.complete)throw Error(`Physics step failed`);O.value=`Payload ${e.toFixed(3)} m · Stop clearance ${(e-n.seatHeight).toFixed(3)} m`,`normalForce`in r&&(O.value+=` · ${Number(r.normalForce).toFixed(1)} N`),N=t}let i=e.createFence();try{await i.signaled}finally{i.destroy()}requestAnimationFrame(F)},F=e=>{P(e).catch(e=>{O.value=String(e)})};requestAnimationFrame(F)}catch(e){O.value=String(e)}