// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
//
// GPUCommandGraph -> borrowed GPU buffers -> upstream Three.js WebGPURenderer.
// Three 0.185.1 is intentionally pinned: the bridge uses private renderer hooks.
import {Buffer, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {ThreeBufferBridge, getThreeBufferBridgeSupport} from '@luma.gl/three/interop';
import {
  WebGPURenderer, Scene, PerspectiveCamera, Color, IcosahedronGeometry,
  InstancedBufferGeometry, Mesh, MeshBasicNodeMaterial, AdditiveBlending
} from 'three/webgpu';
import {attribute, positionLocal} from 'three/tsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const COUNT = 65536;
const WGSL = `
struct Params { time: f32, radius: f32, count: f32, pad: f32 };
@group(0) @binding(0) var<storage, read_write> offsets: array<f32>;
@group(0) @binding(1) var<storage, read_write> colors: array<f32>;
@group(0) @binding(2) var<uniform> params: Params;
fn hash(n: f32) -> f32 { return fract(sin(n * 127.1 + 78.233) * 43758.5453); }
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= u32(params.count)) { return; }
  let f = f32(i);
  let arm = f32(i % 5u) * 1.25663706;
  let t = sqrt((f + 0.5) / params.count);
  let jitter = (hash(f) - 0.5) * 0.5;
  let theta = arm + t * 15.0 + params.time * (0.2 + 0.6 / (0.3 + t)) + jitter;
  let r = (0.12 + 9.0 * t) * params.radius;
  let spread = 0.04 + t * t * 0.65;
  let y = (hash(f + 7.0) - 0.5) * spread + sin(theta * 2.0) * 0.11;
  offsets[i*3u] = cos(theta)*r; offsets[i*3u+1u] = y; offsets[i*3u+2u] = sin(theta)*r;
  let hot = 1.0 - t;
  colors[i*3u] = 0.25+0.75*hot; colors[i*3u+1u] = 0.28+0.6*hot+hash(f+4.0)*0.1; colors[i*3u+2u] = 0.8+0.2*hot;
}`;

async function main() {
  if (!navigator.gpu) throw new Error('This showcase requires WebGPU.');
  const container = document.querySelector<HTMLElement>('#viewport')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const canvas = document.createElement('canvas');
  container.append(canvas);
  const device = await luma.createDevice({adapters: [webgpuAdapter], type: 'webgpu'});
  const renderer = new WebGPURenderer({canvas, device: device.handle as GPUDevice, antialias: true});
  await renderer.init();
  const support = getThreeBufferBridgeSupport(device, renderer);
  if (!support.supported) throw new Error(support.reason);
  const bridge = new ThreeBufferBridge(device, renderer);
  // vec4 layout avoids alignment ambiguity in storage; Three consumes xyz with stride 16.
  // The bridge currently supports packed Float32 attributes, so use vec3 arrays instead.
  const positions = device.createBuffer({id:'galaxy-positions',byteLength:COUNT*12,usage:Buffer.STORAGE|Buffer.VERTEX});
  const colors = device.createBuffer({id:'galaxy-colors',byteLength:COUNT*12,usage:Buffer.STORAGE|Buffer.VERTEX});
  const params = device.createBuffer({id:'galaxy-params',byteLength:16,usage:Buffer.UNIFORM|Buffer.COPY_DST});
  const graph = new GPUCommandGraph(device,{id:'galaxy-animation'});
  const posHandle = graph.importBuffer({id:'positions',byteLength:positions.byteLength,usage:positions.usage},positions);
  const colorHandle = graph.importBuffer({id:'colors',byteLength:colors.byteLength,usage:colors.usage},colors);
  const paramHandle = graph.importBuffer({id:'params',byteLength:params.byteLength,usage:params.usage},params);
  graph.addComputePass({
    id:'animate-and-color',
    resources:[{buffer:posHandle,usage:'storage-write'},{buffer:colorHandle,usage:'storage-write'},{buffer:paramHandle,usage:'uniform'}],
    compile:({device})=>{
      const computation = new Computation(device,{
        id:'galaxy-kernel',source:WGSL,
        shaderLayout:{bindings:[
          {name:'offsets',type:'storage',group:0,location:0},
          {name:'colors',type:'storage',group:0,location:1},
          {name:'params',type:'uniform',group:0,location:2}
        ]}
      });
      return {
        encode:({computePass,getBuffer})=>{
          computation.setBindings({offsets:getBuffer(posHandle),colors:getBuffer(colorHandle),params:getBuffer(paramHandle)});
          computation.dispatch(computePass,COUNT/256);
        },
        destroy:()=>computation.destroy()
      };
    }
  });
  const compiled = await graph.compileAsync();
  const base = new IcosahedronGeometry(0.035,0);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute('position',base.getAttribute('position'));
  geometry.instanceCount = COUNT;
  geometry.setAttribute('instanceOffset',bridge.createInstancedAttribute(positions,3,COUNT));
  geometry.setAttribute('instanceColor',bridge.createInstancedAttribute(colors,3,COUNT));
  const material = new MeshBasicNodeMaterial({color:'#ffffff',transparent:true,opacity:0.85,blending:AdditiveBlending,depthWrite:false});
  material.positionNode = positionLocal.add(attribute<'vec3'>('instanceOffset','vec3'));
  material.colorNode = attribute<'vec3'>('instanceColor','vec3');
  const mesh = new Mesh(geometry,material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.background = new Color('#02030b');
  scene.add(mesh);
  const camera = new PerspectiveCamera(55,1,0.01,200);
  camera.position.set(0,12,21);
  const controls = new OrbitControls(camera,canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.25;
  const resize = ()=>{
    const w=container.clientWidth,h=container.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  window.addEventListener('resize',resize);resize();
  status.textContent='65,536 instances · GPU graph → shared buffers → Three.js';
  let time=0,last=performance.now(),alive=true;
  const animate = (now:number)=>{
    if(!alive)return;
    const dt=Math.min((now-last)/1000,0.05);last=now;
    if(!document.querySelector<HTMLInputElement>('#pause')!.checked)
      time+=dt*Number(document.querySelector<HTMLInputElement>('#speed')!.value);
    params.write(new Float32Array([time,Number(document.querySelector<HTMLInputElement>('#radius')!.value),COUNT,0]));
    compiled.encode(device.commandEncoder,{parameters:undefined});
    device.submit(); // Same GPU queue; no readback, no intermediate upload.
    controls.update();
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  window.addEventListener('pagehide',()=>{
    alive=false;controls.dispose();geometry.dispose();material.dispose();bridge.dispose();
    compiled.destroy();params.destroy();positions.destroy();colors.destroy();renderer.dispose();device.destroy();
  },{once:true});
}
main().catch(error=>{
  document.querySelector<HTMLElement>('#status')!.textContent=String(error);
  console.error(error);
});
