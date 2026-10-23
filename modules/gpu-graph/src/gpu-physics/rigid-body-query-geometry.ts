// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared surface-distance kernels for queries, sensors and bounded translational sweeps. */
export const RIGID_BODY_QUERY_GEOMETRY_SHADER = /* wgsl */ `
struct SurfacePoint { point:vec3f, distance:f32, complete:u32 }
fn closestSegment(point:vec3f,first:vec3f,second:vec3f)->vec3f{
 let edge=second-first;return first+edge*clamp(dot(point-first,edge)/max(dot(edge,edge),1e-30),0.0,1.0);
}
fn closestTriangle(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f{
 let firstEdge=second-first;let secondEdge=third-first;let normal=cross(firstEdge,secondEdge);
 let squared=dot(normal,normal);
 if(squared>0.0){
  let projected=point-normal*(dot(point-first,normal)/squared);
  if(dot(cross(second-first,projected-first),normal)>=0.0&&dot(cross(third-second,projected-second),normal)>=0.0&&dot(cross(first-third,projected-third),normal)>=0.0){return projected;}
 }
 var nearest=closestSegment(point,first,second);
 for(var edge=0u;edge<2u;edge++){
  let candidate=closestSegment(point,select(third,second,edge==0u),select(first,third,edge==0u));
  if(distance(point,candidate)<distance(point,nearest)){nearest=candidate;}
 }
 return nearest;
}
fn closestSurface(collider:u32,point:vec3f)->SurfacePoint{
 let shape=bodies.colliders[collider].shape;var nearest=point;var inside=false;var complete=1u;
 if(shape.w==0.0){let magnitude=length(point);nearest=point/max(magnitude,1e-20)*shape.x;if(magnitude==0.0){nearest=vec3f(shape.x,0,0);}inside=magnitude<=shape.x;}
 else if(shape.w==1.0){nearest=clamp(point,-shape.xyz,shape.xyz);inside=all(abs(point)<=shape.xyz);}
 else if(shape.w==6.0){nearest=vec3f(point.x,0,point.z);if(shape.x>0.0){nearest.x=clamp(point.x,-shape.x,shape.x);}if(shape.y>0.0){nearest.z=clamp(point.z,-shape.y,shape.y);}}
 else if(shape.w==5.0){
  let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
  let flattened=vec3f(radial,point.y,0);let bottom=vec3f(shape.x,-shape.z*0.5,0);let top=vec3f(shape.y,shape.z*0.5,0);
  var closest=closestSegment(flattened,bottom,top);
  let bottomCap=vec3f(clamp(radial,0.0,shape.x),bottom.y,0);let topCap=vec3f(clamp(radial,0.0,shape.y),top.y,0);
  if(distance(flattened,bottomCap)<distance(flattened,closest)){closest=bottomCap;}
  if(distance(flattened,topCap)<distance(flattened,closest)){closest=topCap;}
  nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
  inside=point.y>=bottom.y&&point.y<=top.y&&radial<=mix(shape.x,shape.y,clamp((point.y-bottom.y)/max(shape.z,1e-20),0.0,1.0));
 }else if(shape.w==4.0){
  let bottom=vec3f(0,-shape.z*0.5,0);let top=vec3f(0,shape.z*0.5,0);
  if(abs(shape.y-shape.x)>=shape.z){let center=select(bottom,top,shape.y>=shape.x);let radius=max(shape.x,shape.y);let delta=point-center;nearest=center+select(vec3f(1,0,0),delta/max(length(delta),1e-20),length(delta)>1e-20)*radius;inside=length(delta)<=radius;}
  else{
   let slope=(shape.y-shape.x)/shape.z;let radial=length(point.xz);let direction=select(vec2f(1,0),point.xz/max(radial,1e-20),radial>1e-20);
   let tangent=vec3f(sqrt(max(0.0,1.0-slope*slope)),-slope,0);
   let flattened=vec3f(radial,point.y,0);var closest=closestSegment(flattened,bottom+tangent*shape.x,top+tangent*shape.y);
   let bottomDirection=(flattened-bottom)/max(length(flattened-bottom),1e-20);let topDirection=(flattened-top)/max(length(flattened-top),1e-20);
   let bottomPoint=bottom+bottomDirection*shape.x;let topPoint=top+topDirection*shape.y;
   if(bottomDirection.y<=-slope&&distance(flattened,bottomPoint)<distance(flattened,closest)){closest=bottomPoint;}
   if(topDirection.y>=-slope&&distance(flattened,topPoint)<distance(flattened,closest)){closest=topPoint;}
   nearest=vec3f(direction.x*closest.x,closest.y,direction.y*closest.x);
   inside=length(flattened-bottom)<=shape.x||length(flattened-top)<=shape.y||(point.y>=bottom.y-shape.x*slope&&point.y<=top.y-shape.y*slope&&dot(flattened-bottom,tangent)<=shape.x);
  }
 }else{
  var best=3.402823e38;var work=0u;var node=0u;
  let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
  // Convex containment uses oriented face half-spaces. Triangle meshes retain surface semantics.
  inside=shape.w==2.0;
  if(inside){for(var triangle=0u;triangle<u32(bodies.colliders[collider].padding.w);triangle++){
   if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let first=triangleVertex(collider,triangle,0u);let second=triangleVertex(collider,triangle,1u);let third=triangleVertex(collider,triangle,2u);
   if(dot(point-first,cross(second-first,third-first))>0.0){inside=false;break;}
  }}
  loop{
   if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
   let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
   if(distance(point,clamp(point,lower.xyz,upper.xyz))>best){node=u32(lower.w);continue;}
   if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
    for(var offset=0u;offset<u32(upper.w);offset++){
     if(work>=MESH_TRAVERSAL_BUDGET){complete=0u;break;}work++;
     let candidate=closestTriangle(point,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u));
     let separation=distance(point,candidate);if(separation<best){best=separation;nearest=candidate;}
    }
   }if(complete==0u){break;}node++;
  }
 }
 return SurfacePoint(nearest,select(distance(point,nearest),0.0,inside),complete);
}
struct SphereSweep { point:vec3f, normal:vec3f, distance:f32, hit:u32, complete:u32 }
// Exact rounded-box cast: face rectangles, finite edge cylinders and corner spheres.
// Testing features separately preserves open corners instead of inflating an AABB.
fn sweepBox(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,extent:vec3f)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 if(radius==0.0){
  var enter=0.0;var leave=maximumDistance;
  for(var coordinate=0u;coordinate<3u;coordinate++){
   if(direction[coordinate]==0.0){if(abs(origin[coordinate])>extent[coordinate]){return result;}}
   else{let first=(-extent[coordinate]-origin[coordinate])/direction[coordinate];let second=(extent[coordinate]-origin[coordinate])/direction[coordinate];let lower=min(first,second);
    if(lower>=enter){enter=lower;result.normal=vec3f(0);result.normal[coordinate]=select(1.0,-1.0,direction[coordinate]>0.0);}leave=min(leave,max(first,second));}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;}
  return result;
 }
 let initial=clamp(origin,-extent,extent);let initialDelta=origin-initial;
 if(length(initialDelta)<=radius){result.hit=1u;result.point=initial;result.normal=initialDelta/max(length(initialDelta),1e-20);return result;}
 for(var coordinate=0u;coordinate<3u;coordinate++){
  let first=(coordinate+1u)%3u;let second=(coordinate+2u)%3u;
  for(var side=0u;side<2u;side++){
   let sign=select(-1.0,1.0,side==1u);
   if(direction[coordinate]*sign>=0.0){continue;}
   let travelled=(sign*(extent[coordinate]+radius)-origin[coordinate])/direction[coordinate];
   let center=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(center[first])<=extent[first]&&abs(center[second])<=extent[second]){
    nearest=travelled;result.hit=1u;result.normal=vec3f(0);result.normal[coordinate]=sign;
   }
  }
  for(var corner=0u;corner<4u;corner++){
   var center=vec3f(0);center[first]=select(-extent[first],extent[first],(corner&1u)!=0u);center[second]=select(-extent[second],extent[second],(corner&2u)!=0u);
   var delta=origin-center;delta[coordinate]=0.0;var radialDirection=direction;radialDirection[coordinate]=0.0;
   let squared=dot(radialDirection,radialDirection);if(squared==0.0){continue;}
   let projection=dot(delta,radialDirection)/squared;let perpendicular=delta-radialDirection*projection;
   let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;if(discriminant < -1e-6*radius*radius/squared){continue;}
   let travelled=-projection-sqrt(max(0.0,discriminant));let point=origin+direction*travelled;
   if(travelled>=0.0&&travelled<=nearest&&abs(point[coordinate])<=extent[coordinate]){
    nearest=travelled;result.hit=1u;center[coordinate]=point[coordinate];result.normal=(point-center)/max(radius,1e-20);
   }
  }
 }
 for(var corner=0u;corner<8u;corner++){
  let center=select(-extent,extent,vec3u(corner&1u,corner&2u,corner&4u)!=vec3u(0));
  let delta=origin-center;let projection=dot(delta,direction);let perpendicular=delta-direction*projection;
  let discriminant=radius*radius-dot(perpendicular,perpendicular);if(discriminant < -1e-6*radius*radius){continue;}
  let travelled=-projection-sqrt(max(0.0,discriminant));
  if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-center)/max(radius,1e-20);}
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
// A triangle's sphere expansion is convex. Ignore only a departing initial touch
// on that triangle; other triangles in the same nonconvex mesh remain candidates.
fn sweepTriangle(origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,first:vec3f,second:vec3f,third:vec3f,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;
 let firstEdge=second-first;let secondEdge=third-first;
 let edgeScale=max(max(max(abs(firstEdge.x),abs(firstEdge.y)),abs(firstEdge.z)),max(max(abs(secondEdge.x),abs(secondEdge.y)),abs(secondEdge.z)));
 let rawNormal=cross(firstEdge/max(edgeScale,1e-30),secondEdge/max(edgeScale,1e-30));
 let normal=rawNormal/max(length(rawNormal),1e-20);
 let initial=closestTriangle(origin,first,second,third);let delta=origin-initial;
 let tolerance=max(1e-8,min(1e-5,radius*1e-5));
 if(length(delta)<=radius+tolerance){
  result.normal=select(normal,(delta)/max(length(delta),1e-20),length(delta)>0.0);
  if(skipSeparating&&dot(direction,result.normal)>=0.0){return result;}
  result.hit=1u;result.point=initial;return result;
 }
 let denominator=dot(direction,normal);
 // Clip a coplanar zero-radius ray against the triangle's three inward half-spaces.
 // A parallel offset ray remains a miss; coplanar picking retains edge intersections.
 if(radius==0.0&&denominator==0.0&&abs(dot(origin-first,normal))<=tolerance){
  var enter=0.0;var leave=maximumDistance;var enterNormal=normal;
  let corners=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=corners[edge];let side=(corners[(edge+1u)%3u]-start)/edgeScale;
   let offset=dot(cross(side,(origin-start)/edgeScale),normal);
   let change=dot(cross(side,direction/edgeScale),normal);
   if(change==0.0){if(offset<0.0){return result;}}
   else{let boundary=-offset/change;if(change>0.0){if(boundary>=enter){enter=boundary;enterNormal=normalize(cross(side,normal));}}else{leave=min(leave,boundary);}}
  }
  if(enter<=leave){result.hit=1u;result.distance=enter;result.point=origin+direction*enter;result.normal=enterNormal;}
  return result;
 }
 if(abs(denominator)>0.0){for(var side=0u;side<2u;side++){
  let sign=select(-1.0,1.0,side==1u);if(denominator*sign>=0.0){continue;}
  let travelled=(sign*radius-dot(origin-first,normal))/denominator;
  let point=origin+direction*travelled-normal*(sign*radius);
  if(travelled<0.0||travelled>nearest){continue;}
  if(dot(cross((second-first)/edgeScale,(point-first)/edgeScale),normal)>=0.0&&dot(cross((third-second)/edgeScale,(point-second)/edgeScale),normal)>=0.0&&dot(cross((first-third)/edgeScale,(point-third)/edgeScale),normal)>=0.0){
   nearest=travelled;result.hit=1u;result.normal=normal*sign;
  }
 }}
 if(radius>0.0){
  var vertices=array<vec3f,3>(first,second,third);
  for(var edge=0u;edge<3u;edge++){
   let start=vertices[edge];let segment=vertices[(edge+1u)%3u]-start;
   let segmentLength=length(segment);let axis=segment/max(segmentLength,1e-20);
   let offset=origin-start;let radial=offset-axis*dot(offset,axis);let radialDirection=direction-axis*dot(direction,axis);
   let squared=dot(radialDirection,radialDirection);
   if(squared>0.0){
    let projection=dot(radial,radialDirection)/squared;let perpendicular=radial-radialDirection*projection;
    let discriminant=(radius*radius-dot(perpendicular,perpendicular))/squared;
    if(discriminant>=-1e-6*radius*radius/squared){
     let travelled=-projection-sqrt(max(0.0,discriminant));let center=origin+direction*travelled;let along=dot(center-start,axis);
     if(travelled>=0.0&&travelled<=nearest&&along>=0.0&&along<=segmentLength){nearest=travelled;result.hit=1u;result.normal=(center-start-axis*along)/radius;}
    }
   }
   let projection=dot(offset,direction);let perpendicular=offset-direction*projection;
   let discriminant=radius*radius-dot(perpendicular,perpendicular);
   if(discriminant>=-1e-6*radius*radius){
    let travelled=-projection-sqrt(max(0.0,discriminant));
    if(travelled>=0.0&&travelled<=nearest){nearest=travelled;result.hit=1u;result.normal=(origin+direction*travelled-start)/radius;}
   }
  }
 }
 if(result.hit!=0u){result.distance=nearest;result.point=origin+direction*nearest-result.normal*radius;}
 return result;
}
fn intersectsSweepBounds(origin:vec3f,direction:vec3f,maximumDistance:f32,lower:vec3f,upper:vec3f)->bool{
 var enter=0.0;var leave=maximumDistance;
 for(var coordinate=0u;coordinate<3u;coordinate++){
  if(direction[coordinate]==0.0){if(origin[coordinate]<lower[coordinate]||origin[coordinate]>upper[coordinate]){return false;}}
  else{let first=(lower[coordinate]-origin[coordinate])/direction[coordinate];let second=(upper[coordinate]-origin[coordinate])/direction[coordinate];enter=max(enter,min(first,second));leave=min(leave,max(first,second));}
 }
 return enter<=leave;
}
fn sweepMesh(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var nearest=maximumDistance;var work=0u;var node=0u;
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 loop{
  if(node>=nodeCount){break;}if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
  let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  if(!intersectsSweepBounds(origin,direction,nearest,lower.xyz-vec3f(radius),upper.xyz+vec3f(radius))){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);
   for(var offset=0u;offset<u32(upper.w);offset++){
    if(work>=MESH_TRAVERSAL_BUDGET){result.complete=0u;return result;}work++;
    let candidate=sweepTriangle(origin,direction,nearest,radius,triangleVertex(collider,start+offset,0u),triangleVertex(collider,start+offset,1u),triangleVertex(collider,start+offset,2u),skipSeparating);
    if(candidate.hit!=0u){nearest=candidate.distance;result=candidate;}
   }
  }node++;
 }
 return result;
}
fn sweepSphere(collider:u32,origin:vec3f,direction:vec3f,maximumDistance:f32,radius:f32,skipSeparating:bool)->SphereSweep{
 var result:SphereSweep;result.complete=1u;var travelled=0.0;
 let shape=bodies.colliders[collider].shape;
 if(shape.w==6.0&&shape.z==0.0&&origin.y<0.0){return result;}
 if(shape.w==3.0){return sweepMesh(collider,origin,direction,maximumDistance,radius,skipSeparating);}
 if(shape.w==1.0){return sweepBox(origin,direction,maximumDistance,radius,shape.xyz);}
 if(shape.w==0.0){
  let inflated=shape.x+radius;let projection=dot(origin,direction);
  let perpendicular=origin-direction*projection;let discriminant=inflated*inflated-dot(perpendicular,perpendicular);
  if(length(origin)>inflated){
   if(discriminant < -1e-6*inflated*inflated){return result;}
   travelled=-projection-sqrt(max(0.0,discriminant));
   if(travelled<0.0||travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;let normal=center/max(length(center),1e-20);
  result.point=normal*shape.x;result.normal=normal;result.distance=travelled;result.hit=1u;return result;
 }
 // Unbounded planes have an exact intersection, including parallel and tangent casts.
 if(shape.w==6.0&&shape.x==0.0&&shape.y==0.0){
  let side=select(-1.0,1.0,origin.y>=0.0);
  if(abs(origin.y)>radius){
   if(direction.y*side>=0.0){return result;}
   travelled=(side*radius-origin.y)/direction.y;
   if(travelled>maximumDistance){return result;}
  }
  let center=origin+direction*travelled;
  result.point=vec3f(center.x,0,center.z);result.normal=vec3f(0,side,0);result.distance=travelled;result.hit=1u;return result;
 }
 // Radius-zero rays still need a local-feature tolerance above float32 roundoff.
 // Never derive this from an elongated world AABB or the whole mesh bounds.
 let tolerance=max(1e-8,min(1e-5,max(radius,contactFeatureScale(collider,-1))*1e-6));
 for(var iteration=0u;iteration<128u;iteration++){
  let center=origin+direction*travelled;let surface=closestSurface(collider,center);
  if(surface.complete==0u){result.complete=0u;return result;}
  let separation=surface.distance-radius;
  if(separation<=tolerance){result.point=surface.point;result.normal=select(vec3f(0),(center-surface.point)/max(length(center-surface.point),1e-20),surface.distance>0.0);result.distance=travelled;result.hit=1u;return result;}
  if(travelled+separation>maximumDistance){return result;}
  let next=travelled+separation;
  if(next<=travelled){result.complete=0u;return result;}travelled=next;
 }
 result.complete=0u;return result;
}
`;
