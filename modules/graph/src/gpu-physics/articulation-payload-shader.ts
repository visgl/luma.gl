// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getLinkContactShader} from './articulation-link-contact-shader';

/** Project contact impulses between tree links, a free box and a horizontal support plane. */
export function getPayloadDeclarations(boxCount: number, colliderCount: number) {
  return /* wgsl */ `
struct ContactRow {
 direction:vec3f, arm:vec3f, angularResponse:vec3f, effectiveInverseMass:f32,
 jacobian:array<f32,N>, response:array<f32,N>, accumulated:f32
}
struct PayloadContact {rows:array<ContactRow,3>, targetSpeed:f32, enabled:bool}
var<private> payload:Pose;
var<private> contacts:array<PayloadContact,${colliderCount ? 24 : boxCount ? boxCount * 2 : 10}>;
${
  boxCount
    ? `var<private> currentBox:u32;
var<private> velocities:array<vec3f,${boxCount}>;
var<private> spins:array<vec3f,${boxCount}>;`
    : ''
}
fn inversePayloadInertia(moment:vec3f)->vec3f {
 ${
   boxCount
     ? `let q=product(payload.rotation,boxes[currentBox].principal);
 return rotate(q,boxes[currentBox].inverseInertia.xyz*rotate(vec4f(-q.xyz,q.w),moment));`
     : `let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;
 let squares=halfSize*halfSize;
 let diagonal=3.0/(settings.payloadSizeMass.w*(squares.yzx+squares.zxy));
 return rotate(q,diagonal*rotate(vec4f(-q.xyz,q.w),moment));`
 }
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
  row.effectiveInverseMass=${boxCount ? 'payload.velocity.w' : '1.0/settings.payloadSizeMass.w'}+dot(moment,row.angularResponse);
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
${
  colliderCount
    ? getLinkContactShader(boxCount, colliderCount)
    : `fn preparePayload(dt:f32,inverse:ptr<function,array<array<f32,N>,N>>){
 ${
   boxCount
     ? `for(var index=0u;index<${boxCount}u;index++){
 currentBox=index;let box=boxes[index];
 payload=Pose(box.position,box.rotation,box.velocity,box.spin);
 velocities[index]=box.velocity.xyz;spins[index]=box.spin.xyz;
 let q=product(box.rotation,box.localRotation);
 let center=box.position.xyz+rotate(box.rotation,box.offset.xyz);
 let halfSize=box.shape.xyz;`
     : `payload=poses[N];
 payload.velocity+=vec4f(dt*settings.gravityStep.xyz,0);
 let q=payload.rotation;
 let halfSize=settings.payloadSizeMass.xyz;let center=payload.position.xyz;`
 }
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
  prepareContact(${boxCount ? 'index*2u+pad' : 'pad'},link,solved[link].position.xyz+normal*finger.y,normal,gap,dt,inverse);
 }
 ${
   boxCount
     ? '}'
     : `for(var corner=0u;corner<8u;corner++){
  let signs=vec3f(select(-1.,1.,(corner&1u)!=0u),select(-1.,1.,(corner&2u)!=0u),select(-1.,1.,(corner&4u)!=0u));
  let point=payload.position.xyz+rotate(q,halfSize*signs);
  prepareContact(2u+corner,-1,point,vec3f(0,0,1),point.z-settings.surface.x,dt,inverse);
 }`
 }
}
`
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
 payload.velocity+=vec4f(row.direction*(${boxCount ? 'delta*payload.velocity.w' : 'delta/settings.payloadSizeMass.w'}),0);
 payload.spin+=vec4f(row.angularResponse*delta,0);
 for(var j=0u;j<N;j++){speed[j]+=row.response[j]*delta;}
 return abs(delta);
}
fn solvePayload()->f32{
 var change=0.0;
 for(var index=0u;index<${colliderCount ? 'contactCount' : (boxCount ? boxCount * 2 : 10) + 'u'};index++){
  if(!contacts[index].enabled){continue;}
  ${
    boxCount
      ? `currentBox=${colliderCount ? 'boxIds[index]' : 'index/2u'};let box=boxes[currentBox];
  payload=Pose(box.position,box.rotation,vec4f(velocities[currentBox],box.velocity.w),vec4f(spins[currentBox],0));`
      : ''
  }
  let row=contacts[index].rows[0];
  if(row.effectiveInverseMass<1e-9){continue;}
  let normal=max(0.,row.accumulated+(contacts[index].targetSpeed-relativeSpeed(row))/row.effectiveInverseMass);
  change=max(change,applyRow(index,0u,normal));
  let first=contacts[index].rows[1];let second=contacts[index].rows[2];
  var friction=vec2f(first.accumulated-relativeSpeed(first)/max(first.effectiveInverseMass,1e-9),
   second.accumulated-relativeSpeed(second)/max(second.effectiveInverseMass,1e-9));
  let limit=normal*${boxCount ? 'sqrt(settings.surface.y*boxes[currentBox].material.z)' : 'select(settings.surface.z,settings.surface.y,index<2u)'};
  friction*=min(1.,limit/max(length(friction),1e-12));
  change=max(change,applyRow(index,1u,friction.x));
  change=max(change,applyRow(index,2u,friction.y));
  ${boxCount ? 'velocities[currentBox]=payload.velocity.xyz;spins[currentBox]=payload.spin.xyz;' : ''}
 }
 return change;
}
`;
}
