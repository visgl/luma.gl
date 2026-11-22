// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Reconstruct the same upward-oriented grid triangles used by CPU terrain meshing. */
export const RIGID_BODY_HEIGHT_FIELD_SHADER = /* wgsl */ `
fn heightFieldSample(base:u32,index:u32)->f32{return readGeometry(base+2u+index/4u)[index%4u];}
fn heightFieldCell(width:u32,triangle:u32)->vec2u{
 let cell=triangle/2u;
 return vec2u(cell%(width-1u),cell/(width-1u));
}
fn heightFieldCorners(flags:u32,triangle:u32)->vec3u{
 let second=(triangle&1u)!=0u;
 var corners=select(vec3u(0,1,3),vec3u(0,3,2),second);
 if((flags&1u)!=0u){corners=select(vec3u(0,1,2),vec3u(1,3,2),second);}
 if((flags&2u)!=0u){corners=corners.xzy;}
 return corners;
}
fn heightFieldTriangleIndices(base:u32,triangle:u32)->vec3u{
 let header=readGeometry(base+1u);
 let width=u32(header.z);
 let cell=heightFieldCell(width,triangle);
 let corners=heightFieldCorners(u32(header.w),triangle);
 return vec3u(cell.y*width+cell.x)+(corners/2u)*width+(corners%2u);
}
fn heightFieldTriangleVertex(collider:u32,triangle:u32,corner:u32)->vec3f{
 let base=u32(bodies.colliders[collider].padding.x);
 let steps=readGeometry(base);let header=readGeometry(base+1u);let width=u32(header.z);
 let index=heightFieldTriangleIndices(base,triangle)[corner];
 let position=header.xy+f32(index%width)*steps.xy+f32(index/width)*steps.zw;
 return vec3f(position,heightFieldSample(base,index));
}
fn heightFieldTriangleActive(collider:u32,triangle:u32)->bool{
 let base=u32(bodies.colliders[collider].padding.x);
 let indices=heightFieldTriangleIndices(base,triangle);
 return heightFieldSample(base,indices.x)!=3.402823e38 &&
        heightFieldSample(base,indices.y)!=3.402823e38 &&
        heightFieldSample(base,indices.z)!=3.402823e38;
}
fn heightFieldTriangleData(collider:u32,triangle:u32)->u32{
 let base=u32(bodies.colliders[collider].padding.x);
 let header=readGeometry(base+1u);
 let width=u32(header.z);let flags=u32(header.w);
 let cell=heightFieldCell(width,triangle);let start=cell.y*width+cell.x;
 let first=heightFieldSample(base,start);let second=heightFieldSample(base,start+1u);
 let third=heightFieldSample(base,start+width);let fourth=heightFieldSample(base,start+width+1u);
 if(any(vec4f(first,second,third,fourth)==vec4f(3.402823e38))){return (triangle+1u)*8u;}
 // Remove the quad diagonal only when it joins coplanar triangles.
 if((first-second)+(fourth-third)!=0.0){return (triangle+1u)*8u;}
 let odd=(triangle&1u)!=0u;
 var edge=select(2u,0u,odd);
 if((flags&1u)!=0u){edge=select(1u,2u,odd);}
 if((flags&2u)!=0u){edge=2u-edge;}
 return ((triangle & 0xfffffffeu)+1u)*8u+(1u<<edge);
}
`;
