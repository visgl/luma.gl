// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:5327/');
if (!['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Expected local lab');
const browser = await chromium.launch(getPlaywrightLaunchOptions({headless:true,backend:'webgpu-core'}));
try {
  const page=await browser.newPage();
  await page.route(url.href,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Gripper benchmark</title>'}));
  await page.goto(url.href);
  page.on('console', message=>{if(message.type()==='error') console.error(message.text());});
  const report=await page.evaluate(async root=>{
    const [{luma},{webgpuAdapter},{GPUCommandGraph},{makeGripperTrial}]=await Promise.all([
      import(root+'/modules/core/src/index.ts'),import(root+'/modules/core/src/webgpu/index.ts'),
      import(root+'/modules/graph/src/gpu-core/gpu-command-graph.ts'),import('/gripper.ts')]);
    const device=await luma.createDevice({adapters:[webgpuAdapter],type:'webgpu'});
    const rows=[];
    try {
      for(const reduced of [true,false]) for(const friction of [0.9,0]){
        const trial=makeGripperTrial(reduced,friction);
        const definition=new GPUCommandGraph(device);
        trial.world.addToGraph(definition);
        const graph=await definition.compileAsync();
        try {
          const times=[], phases=[];
          let greatestSlip=0, deepestOverlap=0, gripOffset;
          for(let phase=0;phase<6;phase++){
            trial.command(phase);
            for(let step=0;step<180;step++){
              const start=performance.now();
              if(step<=120 && step%4===0)trial.command(phase,step);
              const encoder=device.createCommandEncoder();
              graph.encode(encoder,{parameters:undefined});
              device.submit(encoder.finish());
              const fence=device.createFence();
              try{await fence.signaled;}finally{fence.destroy();}
              if(phase>0) times.push(performance.now()-start);
              if(step%12===11){
                const states=(await trial.world.readState()).slice(reduced?0:2);
                const positions=states.map(state=>state.position);
                const [left,right,box]=positions.slice(2);
                const distance=Math.hypot(...box.map((v,i)=>v-(left[i]+right[i])/2));
                if(phase===1) gripOffset=distance;
                if(phase===2 || phase===3) greatestSlip=Math.max(greatestSlip,Math.abs(distance-gripOffset));
                const [qx,qy,qz,qw]=states[4].orientation;
                // World Z projection of the three oriented half-extent vectors.
                const verticalExtent=.19*Math.abs(2*(qx*qz-qw*qy))+.2*Math.abs(2*(qy*qz+qw*qx))+.24*Math.abs(1-2*(qx*qx+qy*qy));
                deepestOverlap=Math.max(deepestOverlap,verticalExtent-box[2]);
                if(step===179) phases.push(box);
              }
            }
          }
          const status=await trial.world.readSimulationDiagnostics();
          times.sort((a,b)=>a-b);
          const end=phases[5];const landingError=Math.hypot(end[0]-1.4*Math.cos(1),end[1]-1.4*Math.sin(1));
          rows.push({solver:reduced?'reduced':'ordered',friction,samples:times.length,p50:times[449],p95:times[854],phases,maximumRadialSlip:greatestSlip,maximumBenchPenetration:deepestOverlap,landingError,
            qualified:status.complete && status.steps===1080 && (friction ? greatestSlip<0.05 && phases[2][2]>0.58 && phases[3][2]>0.58 && landingError<0.25 && Math.abs(end[2]-0.24)<0.06 : phases[2][2]<0.32)});
        }finally{graph.destroy();trial.world.destroy();}
      }
      return {adapter:device.info,rows};
    }finally{device.destroy();}
  },'/@fs'+process.cwd());
  console.log(JSON.stringify({browser:browser.version(),...report},null,2));
  if(report.rows.some(row=>!row.qualified))process.exitCode=2;
}finally{await browser.close();}
