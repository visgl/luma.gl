import{C as e,D as t,E as n,M as r,N as i,O as a,S as o,T as s,_ as c,g as l,h as u,j as d,k as f,t as p,w as m,y as h}from"./robot-arm-scene-Xh9Ly_zP.js";import{z as g}from"./wgsl-interface-scan-mFJ876lO.js";function _(e,t=!1,n=!1){return`
const N = ${e}u;
struct Link {
  parentAnchor:vec4f, childAnchor:vec4f, axisMass:vec4f, inertia:vec4f, rest:vec4f
}
struct Pose { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f }
struct Settings { base:vec4f, gravityStep:vec4f, boxCenterRadius:vec4f, boxExtentsLink:vec4f }
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
  if(change<1e-7){break;}
 }
 for(var i=0u;i<N;i++){angle[i]+=dt*speed[i];}
 kinematics();
 for(var i=0u;i<N;i++){let pose=solved[i];
  if(!finite(vec4f(angle[i],speed[i],impulse[i]/dt,0))||!finite(pose.position)||!finite(pose.rotation)||!finite(pose.velocity)||!finite(pose.spin)){counters[1]=1u;return;}
 }
 for(var i=0u;i<N;i++){coordinates[i]=vec4f(angle[i],speed[i],impulse[i]/dt,0);poses[i]=solved[i];}
 ${t?`counters[2]=bitcast<u32>(normalImpulse/dt);`:``}
 ${n?`for(var i=0u;i<N;i++){
  let pose=solved[i];let q=pose.rotation;
  matrices[i]=mat4x4f(vec4f(rotate(q,vec3f(1,0,0)),0),vec4f(rotate(q,vec3f(0,1,0)),0),vec4f(rotate(q,vec3f(0,0,1)),0),pose.position);
 }`:``}
 counters[0]++;
}
`}var v=class{timeStep;id;links;indices=new Map;buffers=[];base;gravity;contact;publishMatrices;get poseMatrices(){return this.buffers[6]??null}destroyed=!1;constructor(e){this.id=e.id??`articulation-tree`,this.timeStep=e.timeStep??1/120,this.contact=structuredClone(e.contact),this.publishMatrices=!!e.publishMatrices,this.links=structuredClone([...e.links]),this.base=[...e.base??[0,0,0]],this.gravity=[...e.gravity??[0,0,-9.81]];let t=e=>Number.isFinite(Math.fround(e));if(!this.links.length||this.links.length>16||!t(this.timeStep)||Math.fround(this.timeStep)<=0||![...this.base,...this.gravity].every(t))throw Error(`Invalid articulation settings`);for(let[e,n]of this.links.entries()){if(!n.id||this.indices.has(n.id)||!Number.isInteger(n.parent)||n.parent<-1||n.parent>=e||!t(n.mass)||Math.fround(n.mass)<=0||!n.inertia.every(e=>t(e)&&Math.fround(e)>0)||![...n.parentAnchor,...n.childAnchor,n.angle??0,n.speed??0].every(t)||(n.axis?!(Math.abs(Math.hypot(...n.axis)-1)<1e-6):n.angle||n.speed)||n.restOrientation&&!(Math.abs(Math.hypot(...n.restOrientation)-1)<1e-6))throw Error(`Invalid articulation link`);this.indices.set(n.id,e)}let n=this.contact;if(n&&(!this.indices.has(n.link)||!n.center.every(t)||![n.radius,...n.halfExtents].every(e=>t(e)&&Math.fround(e)>0)))throw Error(`Invalid articulation contact`)}addToGraph(t){if(this.destroyed||this.buffers.length)throw Error(`Inactive or already registered articulation`);let n=[`links`,`drives`,`coordinates`,`poses`,`counters`,`settings`],r=[new Float32Array(this.links.flatMap(e=>[...e.parentAnchor,e.parent,...e.childAnchor,0,...e.axis??[0,0,0],e.mass,...e.inertia,0,...e.restOrientation??[0,0,0,1]])),new Float32Array(this.links.length*4),new Float32Array(this.links.flatMap(e=>[e.angle??0,e.speed??0,0,0])),new Float32Array(this.links.length*16),new Uint32Array(4),new Float32Array([...this.base,0,...this.gravity,this.timeStep,...this.contact?.center??[0,0,0],this.contact?.radius??0,...this.contact?.halfExtents??[0,0,0],this.contact?this.indices.get(this.contact.link):0])];this.publishMatrices&&(n.push(`matrices`),r.push(new Float32Array(this.links.length*16)));try{let i=r.map((e,r)=>{let i=(r===5?g.UNIFORM:g.STORAGE)|g.COPY_SRC|g.COPY_DST,a=t.device.createBuffer({id:this.id+`-`+n[r],data:e,usage:i});return this.buffers.push(a),t.importBuffer({id:a.id,byteLength:a.byteLength,usage:i},a)}),a=i.map((e,t)=>({buffer:e,usage:t===5?`uniform`:t<2?`storage-read`:`storage-read-write`})),o={attributes:[],bindings:n.map((e,t)=>t===5?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:t<2?`read-only-storage`:`storage`})},s={source:_(this.links.length,!!this.contact,this.publishMatrices),shaderLayout:o},c=e=>({encode:({computePass:t,getBuffer:r})=>{let a={};n.forEach((e,t)=>{a[e]=r(i[t])}),e.kernel.dispatch(t,{bindings:a,x:1})},destroy:()=>e.kernel.destroy()});return t.addComputePass({id:i[0].id+`-joint-space`,description:`Integrate joint-space dynamics and publish articulated link poses.`,resources:a,compile:({device:t})=>c(e(t,s)),compileAsync:async({device:e})=>c(await m(e,s))}),i[3]}catch(e){throw this.destroy(),e}}driveIndex(e){let t=this.indices.get(e);if(this.destroyed||!this.buffers.length||t===void 0||!this.links[t].axis)throw Error(`Inactive or missing revolute drive`);return t}setDrive(e,t){let n=this.driveIndex(e),r=new Float32Array([t.angle,t.stiffness,t.damping,t.maximumTorque]);if(!r.every(Number.isFinite)||r.slice(1).some(e=>e<0))throw Error(`Invalid articulation drive`);this.buffers[1].write(r,n*16)}async readTorque(e){let t=this.driveIndex(e),n=await this.buffers[2].readAsync(t*16+8,4);return new DataView(n.buffer,n.byteOffset,4).getFloat32(0,!0)}async readState(){let e=await this.buffers[3].readAsync(),t=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return this.links.map((e,n)=>{let r=n*16;return{position:Array.from(t.subarray(r,r+3)),orientation:Array.from(t.subarray(r+4,r+8)),velocity:Array.from(t.subarray(r+8,r+11)),angularVelocity:Array.from(t.subarray(r+12,r+15))}})}async readSimulationDiagnostics(){let e=await this.buffers[4].readAsync(),t=new Uint32Array(e.buffer,e.byteOffset,2);return{steps:t[0],complete:t[1]===0,...this.contact?{normalForce:new DataView(e.buffer,e.byteOffset).getFloat32(8,!0)}:{}}}destroy(){this.destroyed=!0;for(let e of this.buffers)e.destroy();this.buffers.length=0}};function y(e,t=!1){let{bodies:n,joints:r}=c(3),i=n[6].shape,a=n[7].shape;if(i?.type!==`sphere`||a?.type!==`box`)throw Error(`Invalid arm fixture`);let s=n.slice(2,7).map((e,t)=>{let n=r.find(e=>e.second===t+2),i=e.shape;if(i?.type!==`box`&&i?.type!==`sphere`)throw Error(`Invalid link`);return{id:n.id??`payload`,parent:n.first-2,parentAnchor:n.firstFrame.position,childAnchor:n.secondFrame?.position??[0,0,0],axis:n.type===`fixed`?void 0:[0,1,0],mass:e.mass,inertia:o(e.mass,i)}}),d=e?new v({links:s,base:n[1].position,publishMatrices:t,contact:{link:`payload`,radius:i.radius,center:n[7].position,halfExtents:a.halfExtents}}):new h({bodies:n.map(e=>({...e,friction:0,restitution:0})),joints:r,solver:`ordered`,iterations:64,timeStep:1/120,gravity:[0,0,-9.81],publishPoses:t});return{world:d,bodies:n,seatHeight:n[7].position[2]+a.halfExtents[2]+i.radius,command(e){for(let t of u){let n=t===`elbow`?e?.65:-.3:0,r=t===`elbow`&&e?25:300;d instanceof v?d.setDrive(t,{angle:n,maximumTorque:r,stiffness:l,damping:70}):d.setAngularActuator(t,1,{angle:n,maximumTorque:r})}},async payloadHeight(){return(await d.readState())[e?4:6].position[2]}}}var b=document.querySelector(`#backend`),x=new URLSearchParams(location.search).get(`solver`)!==`ordered`;b.value=x?`tree`:`ordered`,b.onchange=()=>{location.search=`?solver=`+b.value};var S=document.querySelector(`#reading`),C=document.querySelector(`#world`),w=new n({traceTitle:`GPU Graph Timeline`}),T=s(w,`Robot arm`,`3 kg work-stop comparison`);try{let e=await i.createDevice({adapters:[r],type:`webgpu`,createCanvasContext:{canvas:C,autoResize:!0}}),n=y(x,!0),{world:o}=n,s=new f(e);o.addToGraph(s);let c=await s.compileAsync(),l=new p(e,{poseMatrices:o.poseMatrices,count:x?5:8},x?n.bodies:void 0),u=new a(42,1,.1,200);u.up.set(0,0,1),u.position.set(5,-8,5);let m=new t(u,C);m.target.set(1.8,0,1.5),m.update(),document.querySelector(`#press`).onclick=()=>n.command(!0),document.querySelector(`#lift`).onclick=()=>n.command(!1),n.command(!0);let h=performance.now(),g=o.timeStep,_=0,v=async t=>{g=Math.min(g+(t-h)/1e3,4*o.timeStep),h=t;let r=e.createCommandEncoder();for(;g>=o.timeStep;)w.encode(c,r,{parameters:void 0}),g-=o.timeStep;e.submit(r.finish()),u.aspect=C.clientWidth/C.clientHeight,u.updateProjectionMatrix(),u.updateMatrixWorld();let i=new d([1,0,0,0,0,1,0,0,0,0,.5,0,0,0,.5,1]).multiplyRight(u.projectionMatrix.elements);if(l.draw(new d(u.matrixWorldInverse.elements),i,[u.position.x,u.position.y,u.position.z]),e.submit(),T.update(),t-_>250){let[e,r]=await Promise.all([n.payloadHeight(),o.readSimulationDiagnostics()]);if(!r.complete)throw Error(`Physics step failed`);S.value=`Payload ${e.toFixed(3)} m · Stop clearance ${(e-n.seatHeight).toFixed(3)} m`,`normalForce`in r&&(S.value+=` · ${Number(r.normalForce).toFixed(1)} N`),_=t}let a=e.createFence();try{await a.signaled}finally{a.destroy()}requestAnimationFrame(b)},b=e=>{v(e).catch(e=>{S.value=String(e)})};requestAnimationFrame(b)}catch(e){S.value=String(e)}