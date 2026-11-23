// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';
import type {RigidBodyScene} from './scenes';
import {WRECKING_BALL_BODY_INDEX} from './wrecking-ball';

/** ShaderInputs owns uniform allocation and binding locations alongside canonical materials. */
export const rigidBodyPose = {
  name: 'rigidBodyPose',
  uniformTypes: {matrix: 'mat4x4<f32>'},
  source: `
struct RigidBodyPose {matrix:mat4x4f}
@group(0) @binding(auto) var<uniform> rigidBodyPose:RigidBodyPose;
@group(0) @binding(auto) var<storage,read> positions:array<vec4f>;
@group(0) @binding(auto) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(auto) var<storage,read> shapes:array<vec4f>;
@group(0) @binding(auto) var<storage,read> sleepStates:array<vec4f>;
@group(0) @binding(auto) var<storage,read> meshVertices:array<vec4f>;
`,
  bindingLayout: ['positions', 'orientations', 'shapes', 'sleepStates', 'meshVertices'].map(
    name => ({name, group: 0})
  )
} as const satisfies ShaderModule;

/** Geometry and GPU-pose decoding shared by visible and shadow passes. */
export function makeRigidBodyVertexShader(
  sceneName: RigidBodyScene,
  bodyCount: number,
  longitudeSegments: number,
  latitudeSegments: number,
  shadowPass = false
): string {
  return `
struct Output {@builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) color: vec3f, @location(2) localNormal: vec3f, @location(3) @interpolate(flat) sphere: f32, @location(4) worldPosition: vec3f, @location(5) @interpolate(flat) body: u32, @location(6) localPoint:vec3f}
fn rotate(rotation: vec4f, vector: vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
${
  sceneName === 'wreckingBall'
    ? `
// Pack box triangles and the single sphere into one draw; no collapsed sphere vertices per box.
@vertex fn vertexMain(@builtin(vertex_index) renderVertex:u32)->Output {
 let sphere=renderVertex>=${(bodyCount - (shadowPass ? 2 : 1)) * 36}u;
 let box=renderVertex/36u+${shadowPass ? 1 : 0}u;
 let body=select(box+select(0u,1u,box>=${WRECKING_BALL_BODY_INDEX}u),${WRECKING_BALL_BODY_INDEX}u,sphere);
 let vertex=select(renderVertex%36u,renderVertex-${(bodyCount - (shadowPass ? 2 : 1)) * 36}u,sphere);
`
    : '@vertex fn vertexMain(@builtin(vertex_index) vertex: u32,@builtin(instance_index) body: u32)->Output {'
}
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];var point=vec3f(0);var normal=vec3f(0);
 if(shapes[body].w==3.0) {
  if(vertex<u32(shapes[body].y)) {
   let first=u32(shapes[body].x)+(vertex/3u)*3u;
   point=meshVertices[u32(shapes[body].x)+vertex].xyz;
   normal=normalize(cross(meshVertices[first+1u].xyz-meshVertices[first].xyz,meshVertices[first+2u].xyz-meshVertices[first].xyz));
  } else {normal=vec3f(0,0,1);}
 } else if(shapes[body].w==0.0) {
  let tile=vertex/6u;let longitude=(f32(tile%${longitudeSegments}u)+corner.x)*6.2831853/${longitudeSegments}.0;let latitude=(f32(tile/${longitudeSegments}u)+corner.y)*3.14159265/${latitudeSegments}.0;
  normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shapes[body].x;
 } else {
  let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal[axis]=direction;point[axis]=direction;
  point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shapes[body].xyz;
  // Remaining sphere tessellation vertices collapse for boxes.
  if(vertex>=36u) {point=vec3f(0);}
 }
 var output:Output;output.localPoint=point;output.worldPosition=positions[body].xyz+rotate(orientations[body],point);output.body=body;
 output.position=rigidBodyPose.matrix*vec4f(output.worldPosition,1);
 output.localNormal=normal;output.sphere=1.0-shapes[body].w;output.normal=rotate(orientations[body],normal);output.color=select(vec3f(0.28+0.45*fract(f32(body)*0.27),0.48+0.25*fract(f32(body)*0.39),0.42+0.25*fract(f32(body)*0.17)),vec3f(0.68,0.73,0.67),(shapes[body].w==2.0||(shapes[body].w==3.0&&shapes[body].z>0.5)));output.color=mix(output.color,vec3f(0.55),select(0.0,0.7,sleepStates[body].y>0.5));return output;
}
`;
}
