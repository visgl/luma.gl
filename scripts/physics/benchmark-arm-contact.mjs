// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:5316/');
if (!['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Expected local lab');
const browser = await chromium.launch(getPlaywrightLaunchOptions({headless:true,backend:'webgpu-core'}));
try {
  const page=await browser.newPage();
  await page.route('**/main.ts*',route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(url.href);
  const report=await page.evaluate(async root=>{
    const [{luma},{webgpuAdapter},{GPUCommandGraph},{makeArmContactTrial}]=await Promise.all([
      import(root+'/modules/core/src/index.ts'),import(root+'/modules/core/src/webgpu/index.ts'),
      import(root+'/modules/graph/src/gpu-core/gpu-command-graph.ts'),import('/robot-arm-contact.ts')]);
    const device=await luma.createDevice({adapters:[webgpuAdapter],type:'webgpu'});
    const rows=[];
    try {
      for(const reduced of [false,true]){
        const trial=makeArmContactTrial(reduced);
        const definition=new GPUCommandGraph(device);
        trial.world.addToGraph(definition);
        const graph=await definition.compileAsync();
        try {
          const times=[];
          let maxPenetration=0, supportedHeight, supportedForce;
          // Each phase runs for two simulated seconds. Sample clearance every eight steps.
          for(const press of [true,false]){
            trial.command(press);
            for(let step=0;step<240;step++){
              const start=performance.now();
              const encoder=device.createCommandEncoder();
              graph.encode(encoder,{parameters:undefined});
              device.submit(encoder.finish());
              const fence=device.createFence();
              try {await fence.signaled;} finally {fence.destroy();}
              if(step>=8) times.push(performance.now()-start);
              if(step%8===7) maxPenetration=Math.max(maxPenetration,trial.seatHeight-await trial.payloadHeight());
            }
            if(press){
              supportedHeight=await trial.payloadHeight();
              supportedForce=(await trial.world.readSimulationDiagnostics()).normalForce;
            }
          }
          const releasedHeight=await trial.payloadHeight();
          const status=await trial.world.readSimulationDiagnostics();
          times.sort((a,b)=>a-b);
          const p95=times[Math.ceil(.95*times.length)-1];
          rows.push({solver:reduced?'reduced':'ordered',samples:times.length,p50:times[Math.ceil(.5*times.length)-1],p95,
            within120Hz:p95<=1000/120,maxPenetration,supportedHeight,supportedForce,releasedHeight,
            qualified:status.complete && status.steps===480 && Math.abs(supportedHeight-trial.seatHeight)<.02 && maxPenetration<.03 && releasedHeight>2 && (!reduced || (supportedForce>0 && status.normalForce===0))});
        } finally {graph.destroy();trial.world.destroy();}
      }
      return {adapter:device.info,rows};
    } finally {device.destroy();}
  },'/@fs'+process.cwd());
  console.log(JSON.stringify({browser:browser.version(),...report},null,2));
  if(report.rows.some(row=>!row.qualified)) process.exitCode=2;
} finally {await browser.close();}
