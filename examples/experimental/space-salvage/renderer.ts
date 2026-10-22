// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {GPURigidBodyWorld, GPURigidBody} from '@luma.gl/gpu-graph/gpu-physics';
import {Matrix4} from '@math.gl/core';

export function makeSalvageRenderer(
  device: Device,
  world: GPURigidBodyWorld,
  bodies: GPURigidBody[]
) {
  const uniforms = device.createBuffer({byteLength: 112, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  const shapes = device.createBuffer({
    data: new Float32Array(
      bodies.flatMap((body, index) => {
        const shape = body.shape!;
        const dimensions =
          shape.type === 'sphere'
            ? [shape.radius, 0, 0, 0]
            : shape.type === 'box'
              ? [...shape.halfExtents, 1]
              : [1, 1, 1, 1];
        const color =
          index === 0
            ? [0.4, 0.9, 1, 2]
            : index <= 5
              ? [1, 0.63, 0.2, 1]
              : body.mass === 0
                ? [0.12, 0.24, 0.32, 0]
                : [0.35, 0.43, 0.53, 0];
        return [...dimensions, ...color];
      })
    ),
    usage: Buffer.STORAGE
  });
  const shared = `struct Globals {matrix:mat4x4f, view:vec4f, aim:vec4f, beam:vec4f}
@group(0) @binding(0) var<uniform> globals:Globals;`;
  const background = new Model(device, {
    id: 'salvage-space',
    vertexCount: 3,
    source:
      shared +
      `
struct Output {@builtin(position) position:vec4f,@location(0) uv:vec2f}
@vertex fn vertexMain(@builtin(vertex_index) index:u32)->Output {let point=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3))[index];var output:Output;output.position=vec4f(point,0.999,1);output.uv=point;return output;}
fn hash(point:vec2f)->f32{return fract(sin(dot(point,vec2f(127.1,311.7)))*43758.5453);}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 let world=input.uv*globals.view.xy;let cell=floor(world*3.0);let local=fract(world*3.0)-vec2f(hash(cell),hash(cell+17.0));
 let star=pow(max(0.0,1.0-length(local)*12.0),4.0)*select(0.0,1.0,hash(cell+3.0)>0.65);
 let nebula=0.5+0.5*sin(world.x*0.13+sin(world.y*0.2));
 var color=vec3f(0.014,0.025,0.06)+vec3f(0.012,0.024,0.036)*nebula+vec3f(star)*0.8;
 let dock=length(world-vec2f(-14,7));let ring=1.0-smoothstep(0.03,0.09,abs(dock-2.6));
 color+=vec3f(0.08,0.75,0.55)*(ring*0.65+max(0.0,1.0-dock/2.6)*0.1);
 let ticks=abs(sin(atan2(world.y-7.0,world.x+14.0)*12.0));color+=vec3f(0.1,0.8,0.65)*(1.0-smoothstep(0.03,0.08,abs(dock-3.0)))*step(0.6,ticks);
 if(globals.beam.w>0.0){let start=globals.aim.xy;let delta=globals.beam.xy-start;let fraction=clamp(dot(world-start,delta)/max(dot(delta,delta),0.001),0.0,1.0);let distance=length(world-start-delta*fraction);color+=vec3f(0.1,0.8,0.65)*exp(-distance*35.0)*(0.6+0.2*sin(globals.view.z*40.0));}
 return vec4f(color,1);
}`,
    bindings: {globals: uniforms},
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'globals', location: 0, group: 0, type: 'uniform'}]
    },
    parameters: {depthWriteEnabled: false, depthCompare: 'always', depthFormat: 'depth24plus'}
  });
  const objects = new Model(device, {
    id: 'salvage-bodies',
    vertexCount: 16 * 12 * 6,
    instanceCount: bodies.length,
    source:
      shared +
      `
@group(0) @binding(1) var<storage,read> positions:array<vec4f>;
@group(0) @binding(2) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(3) var<storage,read> shapes:array<vec4f>;
struct Output {@builtin(position) position:vec4f,@location(0) normal:vec3f,@location(1) color:vec3f,@location(2) local:vec3f,@location(3) @interpolate(flat) kind:f32}
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@vertex fn vertexMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) body:u32)->Output{
 let shape=shapes[body*2u];let color=shapes[body*2u+1u];var point=vec3f(0);var normal=vec3f(0,0,1);
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));let corner=corners[vertex%6u];
 if(body==0u){
  let vertices=array<vec3f,12>(vec3f(0,0.9,0),vec3f(-0.6,-0.6,0),vec3f(0,0,0.4),vec3f(0,0.9,0),vec3f(0,0,0.4),vec3f(0.6,-0.6,0),vec3f(-0.6,-0.6,0),vec3f(0.6,-0.6,0),vec3f(0,0,0.4),vec3f(0,0.9,0),vec3f(0.6,-0.6,0),vec3f(-0.6,-0.6,0));
  if(vertex<12u){point=vertices[vertex];let first=(vertex/3u)*3u;normal=normalize(cross(vertices[first+1u]-vertices[first],vertices[first+2u]-vertices[first]));}
  let angle=globals.aim.z;point=vec3f(point.x*cos(angle)-point.y*sin(angle),point.x*sin(angle)+point.y*cos(angle),point.z);normal=vec3f(normal.x*cos(angle)-normal.y*sin(angle),normal.x*sin(angle)+normal.y*cos(angle),normal.z);
 }else if(shape.w==0.0){let tile=vertex/6u;let longitude=(f32(tile%16u)+corner.x)*6.2831853/16.0;let latitude=(f32(tile/16u)+corner.y)*3.14159265/12.0;normal=vec3f(cos(longitude)*sin(latitude),sin(longitude)*sin(latitude),cos(latitude));point=normal*shape.x;}
 else{let face=(vertex/6u)%6u;let axis=face/2u;let direction=select(-1.0,1.0,face%2u==0u);normal=vec3f(0);normal[axis]=direction;point[axis]=direction;point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;point*=shape.xyz;if(vertex>=36u){point=vec3f(0);}}
 var output:Output;output.local=point;output.kind=color.w;output.position=globals.matrix*vec4f(positions[body].xyz+rotate(orientations[body],point),1);output.normal=rotate(orientations[body],normal);output.color=color.xyz;return output;
}
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {let light=0.3+0.7*max(0.0,dot(normalize(input.normal),normalize(vec3f(-0.5,0.7,1))));let stripe=select(1.0,0.35,input.kind==1.0&&abs(input.local.x)<0.13);return vec4f(input.color*light*stripe,1);}
`,
    bindings: {
      globals: uniforms,
      positions: world.positions!,
      orientations: world.orientations!,
      shapes
    },
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'globals', group: 0, location: 0, type: 'uniform'},
        ...['positions', 'orientations', 'shapes'].map((name, index) => ({
          name,
          group: 0,
          location: index + 1,
          type: 'read-only-storage' as const,
          visibility: 1
        }))
      ]
    },
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', depthFormat: 'depth24plus'}
  });
  return {
    draw(
      time: number,
      aspect: number,
      ship: readonly number[],
      aim: readonly number[],
      beam: readonly number[] | null
    ) {
      const extentY = Math.max(14, 22 / aspect);
      const extentX = extentY * aspect;
      const matrix = new Matrix4()
        .ortho({
          left: -extentX,
          right: extentX,
          bottom: -extentY,
          top: extentY,
          near: 0.1,
          far: 100
        })
        .multiplyRight(new Matrix4().lookAt({eye: [0, 0, 40], center: [0, 0, 0], up: [0, 1, 0]}));
      const depth = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]).multiplyRight(
        matrix
      );
      uniforms.write(
        new Float32Array([
          ...depth,
          extentX,
          extentY,
          time,
          0,
          ship[0],
          ship[1],
          Math.atan2(aim[1] - ship[1], aim[0] - ship[0]) - Math.PI / 2,
          0,
          ...(beam ? [beam[0], beam[1], 0, 1] : [0, 0, 0, 0])
        ])
      );
      const pass = device.beginRenderPass({clearColor: [0.01, 0.02, 0.05, 1], clearDepth: 1});
      background.draw(pass);
      objects.draw(pass);
      pass.end();
      device.submit();
      return {extentX, extentY};
    },
    destroy() {
      background.destroy();
      objects.destroy();
      shapes.destroy();
      uniforms.destroy();
    }
  };
}
