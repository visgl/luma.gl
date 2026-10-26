// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {parseArgs} from 'node:util';
import path from 'node:path';
import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from '../playwright/get-playwright-launch-options.mjs';

const {values} = parseArgs({options: {url: {type: 'string', default: 'http://127.0.0.1:5241/'}, count: {type: 'string', default: '10000'}, samples: {type: 'string', default: '30'}, 'software-gpu': {type: 'boolean', default: false}}});
const url = new URL(values.url);
const count = Number(values.count), samples = Number(values.samples);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !Number.isInteger(count) || count < 1 || count > 1000000 || !Number.isInteger(samples) || samples < 5 || samples > 1000) throw new Error('Invalid local publication benchmark');
const browser = await chromium.launch(getPlaywrightLaunchOptions({headless: true, backend: 'webgpu-core', softwareGpu: values['software-gpu']}));
try {
  const context = await browser.newContext();
  await context.route('**/main.ts*', route => route.fulfill({contentType: 'text/javascript', body: ''}));
  const page = await context.newPage();
  await page.goto(url.href);
  const result = await page.evaluate(async ({root, count, samples}) => {
    const [{luma, Buffer}, {webgpuAdapter}, {GPUCommandGraph}, {GPUCommandGraphInspector}, {addRigidBodyPosePublication}] = await Promise.all([
      import(`${root}/modules/core/src/index.ts`), import(`${root}/modules/core/src/webgpu/index.ts`),
      import(`${root}/modules/graph/src/gpu-core/gpu-command-graph.ts`), import(`${root}/modules/graph/src/gpu-core/gpu-command-graph-inspector.ts`),
      import(`${root}/modules/graph/src/gpu-physics/rigid-body-publication.ts`)
    ]);
    const device = await luma.createDevice({type: 'webgpu', featureLevel: 'core', optionalFeatures: ['timestamp-query'], adapters: [webgpuAdapter]});
    const owned = [];
    let compiled;
    try {
      const graph = new GPUCommandGraph(device);
      const allocate = (name, data) => {
        const buffer = device.createBuffer({id: name, ...(typeof data === 'number' ? {byteLength: data} : {data}), usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST});
        owned.push(buffer); return buffer;
      };
      const positions = new Float32Array(count * 4), orientations = new Float32Array(count * 4);
      const bodies = Array.from({length: count}, (_, index) => {
        positions.set([index + 0.25, 2, 3, 0], index * 4);
        orientations.set([0, 0, 0, 1], index * 4);
        return {position: [index, 2, 3], centerOfMass: [0.25, 0, 0], shape: {type: 'sphere', radius: 1}};
      });
      const input = (name, data) => {const buffer = allocate(name, data); return {buffer, resource: graph.importBuffer({id: name, byteLength: buffer.byteLength, usage: Buffer.STORAGE}, buffer)};};
      const output = addRigidBodyPosePublication(graph, 'publication', bodies, bodies.map(() => [[-1,-1,-1],[1,1,1]]), input('positions',positions), input('orientations',orientations), allocate);
      compiled = await graph.compileAsync();
      const inspector = new GPUCommandGraphInspector(); inspector.registerGraph(compiled);
      const timings = [];
      for (let sample = -3; sample < samples; sample++) {
        const query = device.features.has('timestamp-query') ? device.createQuerySet({type:'timestamp',count:2}) : undefined;
        try {
          const start = performance.now(), encoder = device.createCommandEncoder();
          const encoding = query ? encoder.withTimeProfilingQuerySet(query, () => compiled.encode(encoder,{parameters:undefined})) : compiled.encode(encoder,{parameters:undefined});
          const cpu = performance.now() - start;
          device.submit(encoder.finish());
          const fence = device.createFence();
          try {await fence.signaled;} finally {fence.destroy();}
          const completion = performance.now() - start;
          const timing = query ? await inspector.recordGPUTimings(compiled.id,encoding) : undefined;
          if (sample >= 0) timings.push({cpu,completion,gpu:timing?.gpuTimeMilliseconds ?? null});
        } finally {query?.destroy();}
      }
      // Verification readback is outside the timed publication path.
      const matrices = new Float32Array((await output.matrices.readAsync()).buffer);
      const bounds = new Float32Array((await output.bounds.readAsync()).buffer);
      let correct = true;
      for (let index=0; index<count; index++) correct &&= matrices[index*16+12] === index && bounds[index*8] === index-1 && bounds[index*8+4] === index+1;
      const summarize = key => {const sorted = timings.map(value=>value[key]).filter(value=>value!==null).sort((a,b)=>a-b); return {median: sorted[Math.floor(sorted.length/2)] ?? null,p95:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)] ?? null};};
      const gpu = summarize('gpu');
      return {stage:'publication',fixture:'pose-bounds',objectCount:count,adapter:device.info,qualified:correct && gpu.p95 !== null && gpu.p95 < 16.67,correct,bytes:owned.reduce((sum,buffer)=>sum+buffer.byteLength,0),cpuEncodeMilliseconds:summarize('cpu'),completionMilliseconds:summarize('completion'),gpuMilliseconds:gpu,samples,timings};
    } finally {compiled?.destroy(); for (const buffer of owned) buffer.destroy(); device.destroy();}
  },{root:`/@fs${path.resolve(process.cwd())}`,count,samples});
  console.log(JSON.stringify({...result,browserVersion:browser.version(),softwareGpuRequested:values['software-gpu']},null,2));
  if (!result.qualified) process.exitCode = 1;
} finally {await browser.close();}
