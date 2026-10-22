// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

export const CRADLE_MATERIAL_SHADER = /* wgsl */ `
fn stoneColor(point:vec3f, normal:vec3f)->vec3f {
 let grain=fract(sin(dot(floor(point*180.0),vec3f(12.9898,78.233,37.719)))*43758.5453);
 let veins=pow(0.5+0.5*sin(point.x*13.0+point.z*9.0+sin(point.y*19.0+point.z*4.0)*2.0),24.0);
 let base=vec3f(0.035,0.041,0.046)+grain*0.022+veins*0.012;
 return base*(0.55+0.7*max(dot(normal,normalize(vec3f(-0.5,-0.7,1))),0.0));
}
fn steelColor(normal:vec3f, viewDirection:vec3f)->vec3f {
 let reflection=reflect(-viewDirection,normal);
 // A procedural studio environment keeps the polished metal asset-free.
 let horizon=smoothstep(-0.18,0.2,reflection.z);
 var environment=mix(vec3f(0.60,0.58,0.54),vec3f(0.68,0.74,0.80),horizon);
 environment=mix(environment,vec3f(0.32,0.39,0.48),smoothstep(0.35,1.0,reflection.z));
 let softbox=pow(max(dot(reflection,normalize(vec3f(-0.6,-0.8,1.4))),0.0),30.0);
 let strip=pow(max(dot(reflection,normalize(vec3f(1.0,0.35,0.5))),0.0),100.0);
 let rim=pow(1.0-max(dot(normal,viewDirection),0.0),4.0);
 return environment*0.8+vec3f(1.0,0.97,0.91)*softbox*0.85+vec3f(0.83,0.91,1.0)*strip*0.65+rim*0.12;
}
`;

/** Decorative frame only; the existing static joint anchors retain the physics topology. */
export function createCradleFrame(device: Device, matrix: Buffer): Model {
  return new Model(device, {
    id: 'cradle-stone-frame',
    source: /* wgsl */ `
@group(0) @binding(0) var<uniform> matrix:mat4x4f;
struct Output {@builtin(position) position:vec4f,@location(0) point:vec3f,@location(1) normal:vec3f}
${CRADLE_MATERIAL_SHADER}
@vertex fn vertexMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) instance:u32)->Output {
 let centers=array<vec3f,3>(vec3f(-4.2,0,1.95),vec3f(4.2,0,1.95),vec3f(0,0,4.2));
 let extents=array<vec3f,3>(vec3f(0.3,0.3,1.95),vec3f(0.3,0.3,1.95),vec3f(4.5,0.3,0.3));
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];let face=vertex/6u;let axis=face/2u;
 let direction=select(-1.0,1.0,face%2u==0u);var normal=vec3f(0);normal[axis]=direction;
 var point=normal;point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;
 point=centers[instance]+point*extents[instance];
 var output:Output;output.position=matrix*vec4f(point,1);output.point=point;output.normal=normal;return output;
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {return vec4f(stoneColor(input.point,input.normal),1);}
`,
    vertexCount: 36,
    instanceCount: 3,
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', depthFormat: 'depth24plus'},
    bindings: {matrix},
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'matrix', group: 0, location: 0, type: 'uniform'}]
    }
  });
}
