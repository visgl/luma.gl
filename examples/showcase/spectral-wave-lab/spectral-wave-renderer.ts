// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';

const UNIFORM_BYTES=80;

/** Illuminated procedural height field that samples the inverse-FFT buffer directly. */
export class SpectralWaveRenderer{
  readonly device:Device;readonly model:Model;readonly uniforms:Buffer;
  constructor(device:Device,readonly field:Buffer,readonly resolution:number){this.device=device;this.uniforms=device.createBuffer({id:'spectral-wave-render-uniforms',byteLength:UNIFORM_BYTES,usage:Buffer.UNIFORM|Buffer.COPY_DST});this.model=new Model(device,{id:'spectral-wave-surface',source:SHADER,topology:'triangle-list',vertexCount:(resolution-1)*(resolution-1)*6,bindings:{field,uniforms:this.uniforms},shaderLayout:{bindings:[{name:'field',type:'read-only-storage',group:0,location:0},{name:'uniforms',type:'uniform',group:0,location:1}]}});}
  render(timeSeconds:number):void{const canvas=this.device.getDefaultCanvasContext();const[width,height]=canvas.getDrawingBufferSize();const eye:[number,number,number]=[5.6*Math.cos(timeSeconds*0.08),4.4,5.6*Math.sin(timeSeconds*0.08)];const projection=new Matrix4().perspective({fovy:radians(44),aspect:width/Math.max(height,1),near:0.1,far:30});const view=new Matrix4().lookAt({eye,center:[0,0,0],up:[0,1,0]});const vp=new Matrix4(projection).multiplyRight(view);const data=new Float32Array(UNIFORM_BYTES/4);data.set(vp,0);data[16]=this.resolution;data[17]=2.0;data[18]=1/this.resolution;this.uniforms.write(data);const pass=this.device.beginRenderPass({id:'spectral-wave-render',framebuffer:canvas.getCurrentFramebuffer(),clearColor:[0.003,0.006,0.018,1],clearDepth:1});this.model.draw(pass);pass.end();}
  destroy():void{this.model.destroy();this.uniforms.destroy();}
}

const SHADER=`
struct Uniforms{viewProjection:mat4x4f;resolution:f32;heightScale:f32;texel:f32;pad:f32};
@group(0)@binding(0)var<storage,read>field:array<vec2f>;@group(0)@binding(1)var<uniform>uniforms:Uniforms;
struct VOut{@builtin(position)position:vec4f;@location(0)height:f32;@location(1)normal:vec3f;@location(2)uv:vec2f;};
fn value(x:u32,y:u32)->f32{return field[y*u32(uniforms.resolution)+x].x;}
@vertex fn vs(@builtin(vertex_index)vid:u32)->VOut{let n=u32(uniforms.resolution);let cell=vid/6u;let corner=vid%6u;let cx=cell%(n-1u);let cy=cell/(n-1u);var ox=0u;var oy=0u;switch corner{case 0u:{ox=0u;oy=0u;}case 1u:{ox=1u;oy=0u;}case 2u:{ox=1u;oy=1u;}case 3u:{ox=0u;oy=0u;}case 4u:{ox=1u;oy=1u;}default:{ox=0u;oy=1u;}}let x=cx+ox;let y=cy+oy;let h=value(x,y);let xm=select(x-1u,x,x==0u);let xp=min(x+1u,n-1u);let ym=select(y-1u,y,y==0u);let yp=min(y+1u,n-1u);let dx=(value(xp,y)-value(xm,y))*uniforms.heightScale;let dz=(value(x,yp)-value(x,ym))*uniforms.heightScale;let normal=normalize(vec3f(-dx,2.0,-dz));let uv=vec2f(f32(x),f32(y))/f32(n-1u);let world=vec3f((uv.x-.5)*7.5,h*uniforms.heightScale,(uv.y-.5)*7.5);var out:VOut;out.position=uniforms.viewProjection*vec4f(world,1);out.height=h;out.normal=normal;out.uv=uv;return out;}
@fragment fn fs(in:VOut)->@location(0)vec4f{let light=normalize(vec3f(-.35,.8,.45));let diffuse=.22+.78*max(dot(in.normal,light),0.0);let magnitude=clamp(abs(in.height)*1.7,0.0,1.0);let positive=vec3f(.12,.62,1.0);let negative=vec3f(1.0,.18,.52);let base=mix(vec3f(.015,.025,.07),select(negative,positive,in.height>=0.0),magnitude);let contour=.72+.28*smoothstep(.1,.55,abs(fract(in.height*9.0)-.5));return vec4f(base*diffuse*contour,1);}`;
