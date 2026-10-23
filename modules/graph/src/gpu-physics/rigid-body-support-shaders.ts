// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared support mappings and closest-simplex weights for discrete and continuous geometry. */
export const RIGID_BODY_SUPPORT_SHADER = /* wgsl */ `
struct SupportVertex { difference: vec3f, first: vec3f, second: vec3f }
fn meshVertex(collider:u32, index:u32)->vec3f {return readGeometry(u32(bodies.colliders[collider].padding.x)+index).xyz;}
fn localShapeSupport(collider:u32,direction:vec3f,triangle:i32)->vec3f {
 let shape=bodies.colliders[collider].shape;
 let magnitude=length(direction);let unit=select(vec3f(1,0,0),direction/max(magnitude,1e-20),magnitude>1e-20);
 if(triangle>=0){var best=triangleVertex(collider,u32(triangle),0u);for(var corner=1u;corner<3u;corner++){let candidate=triangleVertex(collider,u32(triangle),corner);if(dot(candidate,direction)>dot(best,direction)){best=candidate;}}return best;}
 if(shape.w==0.0){return unit*shape.x;}
 if(shape.w==1.0){return select(-shape.xyz,shape.xyz,direction>=vec3f(0));}
 if(shape.w==4.0){let bottom=unit*shape.x-vec3f(0,shape.z*0.5,0);let top=unit*shape.y+vec3f(0,shape.z*0.5,0);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 if(shape.w==5.0){let radial=length(direction.xz);let ring=select(vec2f(1,0),direction.xz/max(radial,1e-20),radial>1e-20);let bottom=vec3f(ring.x*shape.x,-shape.z*0.5,ring.y*shape.x);let top=vec3f(ring.x*shape.y,shape.z*0.5,ring.y*shape.y);return select(bottom,top,dot(top,direction)>dot(bottom,direction));}
 let nodeOffset=u32(bodies.colliders[collider].policies.z);let nodeCount=u32(bodies.colliders[collider].policies.w);
 var best=meshVertex(collider,0u);var projection=dot(best,direction);var node=0u;
 loop {if(node>=nodeCount){break;}let lower=readGeometry(nodeOffset+node*3u);let upper=readGeometry(nodeOffset+node*3u+1u);
  let bound=dot(select(lower.xyz,upper.xyz,direction>=vec3f(0)),direction);
  if(bound<projection){node=u32(lower.w);continue;}
  if(upper.w>0.0){let start=u32(readGeometry(nodeOffset+node*3u+2u).x);for(var face=0u;face<u32(upper.w);face++){for(var corner=0u;corner<3u;corner++){let candidate=triangleVertex(collider,start+face,corner);let value=dot(candidate,direction);if(value>projection){best=candidate;projection=value;}}}}
  node++;
 }
 return best;
}
fn triangleWeights(point:vec3f,first:vec3f,second:vec3f,third:vec3f)->vec3f {
 let firstEdge=second-first;let secondEdge=third-first;let delta=point-first;let firstProjection=dot(firstEdge,delta);let secondProjection=dot(secondEdge,delta);
 if(firstProjection<=0.0&&secondProjection<=0.0){return vec3f(1,0,0);}
 let secondDelta=point-second;let thirdProjection=dot(firstEdge,secondDelta);let fourthProjection=dot(secondEdge,secondDelta);
 if(thirdProjection>=0.0&&fourthProjection<=thirdProjection){return vec3f(0,1,0);}
 let edgeRegion=firstProjection*fourthProjection-thirdProjection*secondProjection;
 if(edgeRegion<=0.0&&firstProjection>=0.0&&thirdProjection<=0.0){let weight=firstProjection/(firstProjection-thirdProjection);return vec3f(1-weight,weight,0);}
 let thirdDelta=point-third;let fifthProjection=dot(firstEdge,thirdDelta);let sixthProjection=dot(secondEdge,thirdDelta);
 if(sixthProjection>=0.0&&fifthProjection<=sixthProjection){return vec3f(0,0,1);}
 let secondRegion=fifthProjection*secondProjection-firstProjection*sixthProjection;
 if(secondRegion<=0.0&&secondProjection>=0.0&&sixthProjection<=0.0){let weight=secondProjection/(secondProjection-sixthProjection);return vec3f(1-weight,0,weight);}
 let thirdRegion=thirdProjection*sixthProjection-fifthProjection*fourthProjection;
 if(thirdRegion<=0.0&&(fourthProjection-thirdProjection)>=0.0&&(fifthProjection-sixthProjection)>=0.0){let weight=(fourthProjection-thirdProjection)/((fourthProjection-thirdProjection)+(fifthProjection-sixthProjection));return vec3f(0,1-weight,weight);}
 let inverse=1.0/max(thirdRegion+secondRegion+edgeRegion,1e-20);return vec3f(thirdRegion,secondRegion,edgeRegion)*inverse;
}
`;
