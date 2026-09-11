// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';

const SHADER=`struct Frame{viewProjection:mat4x4<f32>,heightScale:f32,resolution:u32,interior:u32,pad:u32};
@group(0)@binding(0)var<storage,read>solution:array<f32>;
@group(0)@binding(1)var<uniform>frame:Frame;
struct VOut{@builtin(position)position:vec4f,@location(0)value:f32,@location(1)normal:vec3f};
fn sample(ix:u32,iy:u32)->f32{if(ix==0u||iy==0u||ix+1u>=frame.resolution||iy+1u>=frame.resolution){return 0.0;}return solution[(iy-1u)*frame.interior+(ix-1u)];}
fn gridVertex(vertex:u32)->vec2u{let cell=vertex/6u;let corner=vertex%6u;let cells=frame.resolution-1u;let x=cell%cells;let y=cell/cells;let dx=array<u32,6>(0u,1u,0u,0u,1u,1u)[corner];let dy=array<u32,6>(0u,0u,1u,1u,0u,1u)[corner];return vec2u(x+dx,y+dy);}
@vertex fn vertexMain(@builtin(vertex_index)vertex:u32)->VOut{let g=gridVertex(vertex);let value=sample(g.x,g.y);let x=f32(g.x)/f32(frame.resolution-1u)*2.0-1.0;let z=f32(g.y)/f32(frame.resolution-1u)*2.0-1.0;let left=sample(select(g.x,g.x-1u,g.x>0u),g.y);let right=sample(min(g.x+1u,frame.resolution-1u),g.y);let down=sample(g.x,select(g.y,g.y-1u,g.y>0u));let up=sample(g.x,min(g.y+1u,frame.resolution-1u));let normal=normalize(vec3f(-(right-left)*frame.heightScale,2.0/f32(frame.resolution-1u),-(up-down)*frame.heightScale));var out:VOut;out.position=frame.viewProjection*vec4f(x,value*frame.heightScale,z,1.0);out.value=value;out.normal=normal;return out;}
@fragment fn fragmentMain(in:VOut)->@location(0)vec4f{let light=normalize(vec3f(0.4,0.85,0.25));let diffuse=0.28+0.72*max(dot(in.normal,light),0.0);let t=clamp(in.value,0.0,1.0);let deep=vec3f(0.015,0.09,0.22);let cyan=vec3f(0.05,0.75,0.95);let gold=vec3f(1.0,0.58,0.08);let base=select(mix(deep,cyan,t*2.0),mix(cyan,gold,(t-0.5)*2.0),t>0.5);let contour=0.72+0.28*smoothstep(0.035,0.09,abs(fract(in.value*12.0)-0.5));return vec4f(base*diffuse*contour,1.0);}`;

/** Illuminated height field sourced directly from the GPU-resident PCG solution buffer. */
export class PoissonSurfaceRenderer{
  readonly model:Model;readonly frameBuffer:Buffer;
  constructor(readonly device:Device,solution:Buffer,readonly resolution:number){const interior=resolution-2;this.frameBuffer=device.createBuffer({id:'poisson-surface-frame',byteLength:80,usage:Buffer.UNIFORM|Buffer.COPY_DST});this.model=new Model(device,{id:'poisson-surface',source:SHADER,vs:'vertexMain',fs:'fragmentMain',topology:'triangle-list',vertexCount:(resolution-1)*(resolution-1)*6,bindings:{solution,frame:this.frameBuffer}});}
  render(time=0):void{const canvas=this.device.getDefaultCanvasContext();const[width,height]=canvas.getDrawingBufferSize();const projection=new Matrix4().perspective({fovy:radians(43),aspect:width/Math.max(height,1),near:0.1,far:20});const eye:[number,number,number]=[2.45*Math.cos(time*0.08),1.75,2.45*Math.sin(time*0.08)];const view=new Matrix4().lookAt({eye,center:[0,0.32,0],up:[0,1,0]});const vp=new Matrix4(projection).multiplyRight(view);const data=new ArrayBuffer(80);new Float32Array(data,0,16).set(vp);const dv=new DataView(data);dv.setFloat32(64,0.72,true);dv.setUint32(68,this.resolution,true);dv.setUint32(72,this.resolution-2,true);this.frameBuffer.write(data);const pass=this.device.beginRenderPass({id:'poisson-surface-pass',framebuffer:canvas.getCurrentFramebuffer(),clearColor:[0.003,0.008,0.02,1],clearDepth:1});try{this.model.draw(pass);}finally{pass.end();}}
  destroy():void{this.model.destroy();this.frameBuffer.destroy();}
}
