import{h as e,m as t,r as n}from"./gpu-rigid-body-world-D5pqV3vF.js";import{z as r}from"./wgsl-interface-scan-BeLN4x0P.js";function i(e,t){return`
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
 for(var collider=0u;collider<${t}u;collider++){
  let offset=settings.pads[3u*collider];let link=u32(offset.w);let pose=solved[link];
  let center=pose.position.xyz+rotate(pose.rotation,offset.xyz);
  let rotation=product(pose.rotation,settings.pads[3u*collider+1u]);let shape=settings.pads[3u*collider+2u];
  let radius=select(shape.x+shape.y,length(shape.xyz),shape.w>=2.)+0.001;
  for(var start=0u;start<${e}u;start+=8u){
   let cluster=boxes[${e}u+start/8u];
   if(any(center+radius<cluster.position.xyz)||any(center-radius>cluster.shape.xyz)){continue;}
   for(var i=start;i<min(start+8u,${e}u);i++){
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
`}function a(e,t){return`
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
${t?i(e,t):`fn preparePayload(dt:f32,inverse:ptr<function,array<array<f32,N>,N>>){
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
`}function o(e,t=!1,r=!1,i=!1,o=0,s=0,c=!1){return`
const N = ${e}u;
struct Link {
  parentAnchor:vec4f, childAnchor:vec4f, axisMass:vec4f, inertia:vec4f, rest:vec4f
}
struct Pose { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f }
struct Settings { base:vec4f, gravityStep:vec4f, boxCenterRadius:vec4f, boxExtentsLink:vec4f ${i||o?`, payloadSizeMass:vec4f, surface:vec4f, pads:array<vec4f,${s?3*s:2}>`:``} }
@group(0) @binding(0) var<storage,read> links:array<Link>;
@group(0) @binding(1) var<storage,read> drives:array<vec4f>;
@group(0) @binding(2) var<storage,read_write> coordinates:array<vec4f>;
@group(0) @binding(3) var<storage,read_write> poses:array<Pose>;
@group(0) @binding(4) var<storage,read_write> counters:array<u32>;
@group(0) @binding(5) var<uniform> settings:Settings;

${r?`@group(0) @binding(6) var<storage,read_write> matrices:array<mat4x4f>;`:``}
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
 ${c?`if(links[j].childAnchor.w!=0.){return axis[j];}`:``}
 return cross(axis[j],point-pivot[j]);
}
fn angularColumn(j:i32)->vec3f{
 ${c?`if(links[j].childAnchor.w!=0.){return vec3f(0);}`:``}
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
  ${c?`if(link.childAnchor.w!=0.){
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
${o?`${n}
@group(0) @binding(${r?7:6}) var<storage,read_write> boxes:array<WorldBox>;`:``}
${i||o?a(o,s):``}
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
${i||o?`preparePayload(dt,&inverse);if(counters[1]!=0u){return;}`:``}
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
${i||o?`change=max(change,solvePayload());`:``}
  if(change<1e-7){break;}
 }
 for(var i=0u;i<N;i++){angle[i]+=dt*speed[i];}
 kinematics();
 for(var i=0u;i<N;i++){let pose=solved[i];
  if(!finite(vec4f(angle[i],speed[i],impulse[i]/dt,0))||!finite(pose.position)||!finite(pose.rotation)||!finite(pose.velocity)||!finite(pose.spin)){counters[1]=1u;return;}
 }
 ${i?`payload.position+=dt*payload.velocity;
 payload.rotation=normalize(payload.rotation+0.5*dt*product(vec4f(payload.spin.xyz,0),payload.rotation));
 if(!finite(payload.position)||!finite(payload.rotation)||!finite(payload.velocity)||!finite(payload.spin)){counters[1]=1u;return;}
 poses[N]=payload;`:``}
${s?`publishLinkContacts();if(counters[1]!=0u){return;}`:o?`for(var index=0u;index<${o}u;index++){
 if(!finite(vec4f(velocities[index],0))||!finite(vec4f(spins[index],0))){counters[1]=1u;return;}
 }
 for(var index=0u;index<${o}u;index++){
 for(var pad=0u;pad<2u;pad++){
   if(index==0u){counters[2u+pad]=0u;}
   if(contacts[index*2u+pad].rows[0].accumulated>1e-8){counters[2u+pad]|=1u<<index;}
 }
 boxes[index].velocity=vec4f(velocities[index],boxes[index].velocity.w);boxes[index].spin=vec4f(spins[index],0);
 }`:``}
 for(var i=0u;i<N;i++){coordinates[i]=vec4f(angle[i],speed[i],impulse[i]/dt,0);poses[i]=solved[i];}
 ${t?`counters[2]=bitcast<u32>(normalImpulse/dt);`:``}
 ${r?`for(var i=0u;i<${i?`N+1u`:`N`};i++){
  let pose=poses[i];let q=pose.rotation;
  matrices[i]=mat4x4f(vec4f(rotate(q,vec3f(1,0,0)),0),vec4f(rotate(q,vec3f(0,1,0)),0),vec4f(rotate(q,vec3f(0,0,1)),0),pose.position);
 }`:``}
 counters[0]++;
}
`}var s=class n{timeStep;id;links;indices=new Map;buffers=[];base;gravity;contact;payload;publishMatrices;get poseMatrices(){return this.buffers[6]??null}initialState;worldContacts=!1;destroyed=!1;static fromRoots(e,t={}){let r=[];for(let t of e){let e=r.length;for(let[n,i]of t.links.entries()){if(!Number.isInteger(i.parent)||i.parent<-1||i.parent>=n)throw Error(`Invalid local parent`);let[a,o,s]=i.parentAnchor;r.push(i.parent===-1?{...i,parentAnchor:[t.base[0]+a,t.base[1]+o,t.base[2]+s]}:{...i,parent:e+i.parent})}}return new n({...t,links:r})}constructor(e){this.id=e.id??`articulation-tree`,this.timeStep=e.timeStep??1/120,this.payload=structuredClone(e.payload),this.contact=structuredClone(e.contact),this.publishMatrices=!!e.publishMatrices,this.links=structuredClone([...e.links]),this.base=[...e.base??[0,0,0]],this.gravity=[...e.gravity??[0,0,-9.81]];let t=e=>Number.isFinite(Math.fround(e));if(!this.links.length||this.links.length>16||!t(this.timeStep)||Math.fround(this.timeStep)<=0||![...this.base,...this.gravity].every(t))throw Error(`Invalid articulation settings`);for(let[e,n]of this.links.entries()){if(!n.id||n.jointType===`prismatic`&&!n.axis||this.indices.has(n.id)||!Number.isInteger(n.parent)||n.parent<-1||n.parent>=e||!t(n.mass)||Math.fround(n.mass)<=0||!n.inertia.every(e=>t(e)&&Math.fround(e)>0)||![...n.parentAnchor,...n.childAnchor,n.angle??0,n.speed??0].every(t)||(n.axis?!(Math.abs(Math.hypot(...n.axis)-1)<1e-6):n.angle||n.speed)||n.restOrientation&&!(Math.abs(Math.hypot(...n.restOrientation)-1)<1e-6))throw Error(`Invalid articulation link`);this.indices.set(n.id,e)}let n=this.payload;if(n&&(n.pads.length!==2||n.pads[0].link===n.pads[1].link||!n.pads.every(e=>this.indices.has(e.link))||![...n.position,n.supportHeight].every(t)||![n.mass,...n.halfExtents,...n.pads.map(e=>e.radius)].every(e=>t(e)&&Math.fround(e)>0)||![n.friction,n.supportFriction].every(e=>t(e)&&e>=0)))throw Error(`Invalid articulation payload`);let r=this.contact;if(r&&(!this.indices.has(r.link)||!r.center.every(t)||![r.radius,...r.halfExtents].every(e=>t(e)&&Math.fround(e)>0)))throw Error(`Invalid articulation contact`)}addToGraph(n,i){let a=i?.colliders,s=a?.flatMap(({link:e,shape:t,faceManifold:n,position:r=[0,0,0],orientation:i=[0,0,0,1]})=>{let a=t.type===`box`?[...t.halfExtents]:t.type===`capsule`?[t.radiusTop,t.height/2,0]:[t.radius,0,0];if(!this.indices.has(e)||n&&t.type!==`box`||t.type===`capsule`&&t.radiusTop!==t.radiusBottom||![...r,...i,...a].every(Number.isFinite)||Math.abs(Math.hypot(...i)-1)>1e-5||a[0]<=0||a[1]<0||t.type===`box`&&(a[1]<=0||a[2]<=0))throw Error(`Invalid link collider`);return[...r,this.indices.get(e),...i,...a,t.type===`sphere`?0:t.type===`capsule`?1:n?3:2]});if(i&&(this.payload||this.contact||(a?a.length===0||a.length>16:!i.pads||i.pads.length!==2||i.pads[0].link===i.pads[1].link)||!Number.isFinite(i.friction)||i.friction<0||i.pads?.some(e=>!this.indices.has(e.link)||!Number.isFinite(e.radius)||e.radius<=0)))throw Error(`Invalid world contact pads`);if(this.destroyed||this.buffers.length)throw Error(`Inactive or already registered articulation`);let c=[`links`,`drives`,`coordinates`,`poses`,`counters`,`settings`],l=this.links.length+Number(!!this.payload),u=new Float32Array(l*16);this.payload&&u.set([...this.payload.position,1,0,0,0,1],this.links.length*16);let d=[new Float32Array(this.links.flatMap(e=>[...e.parentAnchor,e.parent,...e.childAnchor,Number(e.jointType===`prismatic`),...e.axis??[0,0,0],e.mass,...e.inertia,0,...e.restOrientation??[0,0,0,1]])),new Float32Array(this.links.length*4),new Float32Array(this.links.flatMap(e=>[e.angle??0,e.speed??0,0,0])),u,new Uint32Array(a?296:4),new Float32Array([...this.base,0,...this.gravity,this.timeStep,...this.contact?.center??[0,0,0],this.contact?.radius??0,...this.contact?.halfExtents??[0,0,0],this.contact?this.indices.get(this.contact.link):0,...this.payload?[...this.payload.halfExtents,this.payload.mass,this.payload.supportHeight,this.payload.friction,this.payload.supportFriction,0,...this.payload.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:i?[0,0,0,0,0,i.friction,0,0,...s??i.pads.flatMap(e=>[this.indices.get(e.link),e.radius,0,0])]:[]])];this.publishMatrices&&(c.push(`matrices`),d.push(new Float32Array(l*16)));try{let s=d.map((e,t)=>{let i=(t===5?r.UNIFORM:r.STORAGE)|r.COPY_SRC|r.COPY_DST,a=n.device.createBuffer({id:this.id+`-`+c[t],data:e,usage:i});return this.buffers.push(a),n.importBuffer({id:a.id,byteLength:a.byteLength,usage:i},a)});this.initialState=()=>{for(let e of[1,2,3,4])this.buffers[e].write(d[e]);this.publishMatrices&&this.buffers[6].write(d[6])},i&&(this.worldContacts=!0,c.push(`boxes`),s.push(i.boxes));let l=s.map((e,t)=>({buffer:e,usage:t===5?`uniform`:t<2?`storage-read`:`storage-read-write`})),u={attributes:[],bindings:c.map((e,t)=>t===5?{name:e,location:t,group:0,type:`uniform`}:{name:e,location:t,group:0,type:t<2?`read-only-storage`:`storage`})},f={source:o(this.links.length,!!this.contact,this.publishMatrices,!!this.payload,i?.count??0,a?.length??0,this.links.some(e=>e.jointType===`prismatic`)),shaderLayout:u},p=e=>({encode:({computePass:t,getBuffer:n})=>{let r={};c.forEach((e,t)=>{r[e]=n(s[t])}),e.kernel.dispatch(t,{bindings:r,x:1})},destroy:()=>e.kernel.destroy()});return n.addComputePass({id:s[0].id+`-joint-space`,description:`Integrate joint-space dynamics and publish articulated link poses.`,resources:l,compile:({device:e})=>p(t(e,f)),compileAsync:async({device:t})=>p(await e(t,f))}),s[3]}catch(e){throw this.destroy(),e}}reset(){if(!this.initialState)throw Error(`Inactive articulation`);this.initialState()}driveIndex(e,t=`revolute`){let n=this.indices.get(e);if(this.destroyed||!this.buffers.length||n===void 0||!this.links[n].axis)throw Error(`Inactive or missing joint drive`);if((this.links[n].jointType??`revolute`)!==t)throw Error(`Unexpected joint type`);return n}setDrive(e,t){let n=this.driveIndex(e);this.writeDrive(n,t.angle,t.stiffness,t.damping,t.maximumTorque)}setLinearDrive(e,t){let n=this.driveIndex(e,`prismatic`);this.writeDrive(n,t.position,t.stiffness,t.damping,t.maximumForce)}writeDrive(e,t,n,r,i){let a=new Float32Array([t,n,r,i]);if(!a.every(Number.isFinite)||a.slice(1).some(e=>e<0))throw Error(`Invalid articulation drive`);this.buffers[1].write(a,e*16)}async readTorque(e){return this.readEffort(this.driveIndex(e))}async readForce(e){return this.readEffort(this.driveIndex(e,`prismatic`))}async readEffort(e){let t=await this.buffers[2].readAsync(e*16+8,4);return new DataView(t.buffer,t.byteOffset,4).getFloat32(0,!0)}async readState(){let e=await this.buffers[3].readAsync(),t=new Float32Array(e.buffer,e.byteOffset,e.byteLength/4);return Array.from({length:t.length/16},(e,n)=>{let r=n*16;return{position:Array.from(t.subarray(r,r+3)),orientation:Array.from(t.subarray(r+4,r+8)),velocity:Array.from(t.subarray(r+8,r+11)),angularVelocity:Array.from(t.subarray(r+12,r+15))}})}async readSimulationDiagnostics(){let e=await this.buffers[4].readAsync(),t=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4),n=new Float32Array(e.buffer,e.byteOffset,t.length);return{steps:t[0],complete:t[1]===0,...t.length>4?{candidatePairs:t[4],activeContacts:t[5],contactPairs:Array.from({length:t[5]},(e,n)=>({body:t[8+n*12],collider:t[9+n*12]})),contactImpulses:Array.from({length:t[5]},(e,t)=>Array.from(n.subarray(16+12*t,19+12*t))),contactOverflow:t[6]!==0,reusedContacts:t[7]}:{},...this.worldContacts?{padContactMasks:[t[2],t[3]]}:{},...this.contact?{normalForce:new DataView(e.buffer,e.byteOffset).getFloat32(8,!0)}:{}}}destroy(){this.initialState=void 0,this.destroyed=!0;for(let e of this.buffers)e.destroy();this.buffers.length=0}};export{s as t};