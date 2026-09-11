// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer,type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

/** Full-screen Fourier-space view of the same evolving spectrum used to reconstruct the wave. */
export class SpectralViewRenderer{
  readonly model:Model;readonly uniforms:Buffer;
  constructor(readonly device:Device,readonly spectrum:Buffer,readonly resolution:number){
    this.uniforms=device.createBuffer({id:'spectral-view-uniforms',byteLength:16,usage:Buffer.UNIFORM|Buffer.COPY_DST});
    this.model=new Model(device,{id:'spectral-view',source:SHADER,topology:'triangle-list',vertexCount:3,bindings:{spectrum,uniforms:this.uniforms},shaderLayout:{bindings:[{name:'spectrum',type:'read-only-storage',group:0,location:0},{name:'uniforms',type:'uniform',group:0,location:1}]}});
  }
  draw(renderPass:any,viewport:readonly[number,number,number,number],time:number):void{
    const data=new ArrayBuffer(16),f=new Float32Array(data),u=new Uint32Array(data);u[0]=this.resolution;f[1]=time;this.uniforms.write(data);
    renderPass.setViewport(...viewport);this.model.draw(renderPass);
  }
  destroy():void{this.model.destroy();this.uniforms.destroy();}
}

const SHADER=`
struct Uniforms{resolution:u32;time:f32;pad0:f32;pad1:f32};
@group(0)@binding(0)var<storage,read>spectrum:array<vec2f>;@group(0)@binding(1)var<uniform>uniforms:Uniforms;
struct VOut{@builtin(position)position:vec4f;@location(0)uv:vec2f;};
@vertex fn vs(@builtin(vertex_index)i:u32)->VOut{var p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));var o:VOut;o.position=vec4f(p[i],0,1);o.uv=p[i]*.5+.5;return o;}
fn shiftedIndex(x:u32,n:u32)->u32{return(x+n/2u)%n;}
@fragment fn fs(in:VOut)->@location(0)vec4f{let n=uniforms.resolution;let x=min(u32(clamp(in.uv.x,0.0,.999999)*f32(n)),n-1u);let y=min(u32(clamp(in.uv.y,0.0,.999999)*f32(n)),n-1u);let z=spectrum[shiftedIndex(y,n)*n+shiftedIndex(x,n)];let energy=dot(z,z);let level=clamp(log2(1.0+energy)*.11,0.0,1.0);let center=length(in.uv-.5);let grid=.93+.07*cos(center*120.0);let cold=vec3f(.015,.035,.09);let hot=vec3f(1.0,.38,.08);let color=mix(cold,hot,pow(level,.58))*grid;return vec4f(color,1);}`;
