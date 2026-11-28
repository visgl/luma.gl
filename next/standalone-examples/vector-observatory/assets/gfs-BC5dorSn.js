const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./gfs-export-nWys6r-o.js","./gfs-data-D7JhEQOm.js","./csv-writer-types-BHUv9Kbn.js","./preload-helper-C8Dcx800.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper-C8Dcx800.js";import{a as t,c as n,l as r,m as i,n as a,o,t as s,v as c,x as l}from"./style-jmDARCPB.js";import{b as u,v as d}from"./compute-pipeline-gk6qmn_l.js";import{a as f,i as p,n as m,r as h,s as g,t as _}from"./gfs-data-D7JhEQOm.js";var v=class{buffer;capacity;frameByteLength;retainedFrames=[];sequence=0;pendingReadbacks=0;constructor(e,t){u(e.type===`webgpu`),u(Number.isSafeInteger(t.particleCount)&&t.particleCount>0),u(Number.isSafeInteger(t.capacity)&&t.capacity>0),this.capacity=t.capacity,this.frameByteLength=t.particleCount*16;let n=this.frameByteLength*this.capacity;u(Number.isSafeInteger(n)&&n<=e.limits.maxBufferSize&&n<=e.limits.maxStorageBufferBindingSize),this.buffer=e.createBuffer({id:`flow-trajectory-history`,byteLength:n,usage:d.STORAGE|d.COPY_SRC|d.COPY_DST})}get frames(){return this.retainedFrames.map(e=>({...e}))}record(e,t,n){u(!this.buffer.destroyed&&!t.destroyed&&t!==this.buffer),u(t.byteLength>=this.frameByteLength&&(t.usage&d.COPY_SRC)!==0),u(Number.isFinite(n));let r=this.retainedFrames.at(-1);u(!r||n>=r.time);let i=this.sequence%this.capacity*this.frameByteLength;e.copyBufferToBuffer({sourceBuffer:t,destinationBuffer:this.buffer,destinationOffset:i,size:this.frameByteLength}),this.retainedFrames.length===this.capacity&&this.retainedFrames.shift(),this.retainedFrames.push({time:n,byteOffset:i,sequence:this.sequence++})}async readFrames(){u(!this.buffer.destroyed);let e=this.frames;if(e.length===0)return[];let t=e[0].byteOffset,n=Math.min(e.length,this.capacity-t/this.frameByteLength),r=[{byteOffset:t,count:n}];n<e.length&&r.push({byteOffset:0,count:e.length-n}),this.pendingReadbacks++;try{let t=await Promise.all(r.map(e=>this.buffer.readAsync(e.byteOffset,e.count*this.frameByteLength))),n=[];for(let i=0;i<r.length;i++)for(let a=0;a<r[i].count;a++)n.push({...e[n.length],particles:new Float32Array(t[i].buffer,t[i].byteOffset+a*this.frameByteLength,this.frameByteLength/4)});return n}finally{this.pendingReadbacks--}}reset(){u(!this.buffer.destroyed),this.retainedFrames.length=0,this.sequence=0}destroy(){u(this.pendingReadbacks===0),this.buffer.destroy(),this.retainedFrames.length=0}},y=[{label:`Baseline`,tolerance:1,maximumTimeStep:300,stride:1,frozen:!1},{label:`Tighter tolerance`,tolerance:.1,maximumTimeStep:300,stride:1,frozen:!1},{label:`Looser tolerance`,tolerance:10,maximumTimeStep:300,stride:1,frozen:!1},{label:`Shorter steps`,tolerance:1,maximumTimeStep:60,stride:1,frozen:!1},{label:`2° grid`,tolerance:1,maximumTimeStep:300,stride:2,frozen:!1},{label:`3° grid`,tolerance:1,maximumTimeStep:300,stride:3,frozen:!1},{label:`Frozen initial wind`,tolerance:1,maximumTimeStep:300,stride:1,frozen:!0}];async function b(e,t,n,i){let a=t.captureInterval??3600,o=performance.now(),s=new r(e,{input:p(0,t.stride),nextInput:p(+!t.frozen,t.stride),timeRange:[0,m],positions:f(t.side),tolerance:t.tolerance,maximumTimeStep:t.maximumTimeStep,maximumAttempts:32,conservativeMask:!0}),c=new v(e,{particleCount:s.particleCount,capacity:m/a+1}),l=0,u=0,d=0,h=0,_=0,y;function b(){let t=e.createCommandEncoder();c.record(t,s.output,s.time),e.submit(t.finish())}try{b();for(let e=a;e<=m;e+=a){i?.throwIfAborted();let e=await s.advance(a),t=0;for(;l+=e.acceptedSteps,u+=e.rejectedSteps,d++,e.gpuMilliseconds!==void 0&&(h+=e.gpuMilliseconds,_++),n?.(s,e),i?.throwIfAborted(),!e.complete;){if(++t>512)throw Error(`GFS integration did not complete`);e=await s.continue()}y=e,b()}let e=await s.diagnostics.readAsync(0,64),r=new Float32Array(e.buffer,e.byteOffset,16);for(let e=0;e<4;e++)if(r[e*4+2]!==0)throw Error(`A qualification release stopped before the final horizon`);let f=await c.readFrames();return{frames:f,report:{...t,particleCount:s.particleCount,maximumErrorMetres:Math.max(...g(f)),referenceErrorsMetres:g(f),acceptedSteps:l,rejectedSteps:u,dispatches:d,termination:{active:y?.active,outsideDomain:y?.outsideDomain,missingData:y?.missingData,toleranceFailure:y?.toleranceFailure,numericalFailure:y?.numericalFailure},gpuMilliseconds:_===d?h:null,wallMilliseconds:performance.now()-o,historyBytes:c.buffer.byteLength},destroy(){c.destroy(),s.destroy()}}}catch(e){throw c.destroy(),s.destroy(),e}}var x=class{canvas;earth;context;constructor(e,t){this.canvas=e,this.earth=t,this.context=e.getContext(`2d`)}draw(e,t){let n=this.canvas.clientWidth,r=this.canvas.clientHeight,i=Math.min(2,window.devicePixelRatio);(this.canvas.width!==Math.round(n*i)||this.canvas.height!==Math.round(r*i))&&(this.canvas.width=Math.round(n*i),this.canvas.height=Math.round(r*i));let a=this.context;a.setTransform(i,0,0,i,0,0),a.fillStyle=`#050c14`,a.fillRect(0,0,n,r);let o=n<850,s=o?n-80:n-370,c=Math.max(120,Math.min(r-285,s/.82)),l={left:Math.max(40,(s-c*.82)/2),top:145,width:c*.82,height:c};a.font=`11px system-ui`,a.fillStyle=`#7ef5db`,a.fillText(`ARCHIVED ATMOSPHERE / NORTH ATLANTIC`,l.left,113),a.font=`${o?19:27}px system-ui`,a.fillStyle=`#eef7fa`,a.fillText(new Date(Date.parse(h.snapshots[0].date)+t*1e3).toISOString().slice(0,16).replace(`T`,` `)+` UTC`,l.left,138),a.save(),a.beginPath(),a.rect(l.left,l.top,l.width,l.height),a.clip(),a.globalAlpha=.55,a.drawImage(this.earth,this.earth.width*95/360,this.earth.height*40/180,this.earth.width/12,this.earth.height/6,l.left,l.top,l.width,l.height),a.globalAlpha=1,a.fillStyle=`#07162666`,a.fillRect(l.left,l.top,l.width,l.height);let u=t/21600;a.strokeStyle=`#9adce44d`,a.lineWidth=.7;for(let e=1;e<30;e+=2)for(let t=1;t<30;t+=2){let n=e*31+t,r=(1-u)*h.snapshots[0].eastward[n]+u*h.snapshots[1].eastward[n],i=(1-u)*h.snapshots[0].northward[n]+u*h.snapshots[1].northward[n],o=l.left+t/30*l.width,s=l.top+(1-e/30)*l.height,c=Math.min(.8,l.height/600),d=o+r*c,f=s-i*c,p=Math.atan2(-i,r);a.beginPath(),a.moveTo(o,s),a.lineTo(d,f),a.lineTo(d-3*Math.cos(p-.5),f-3*Math.sin(p-.5)),a.moveTo(d,f),a.lineTo(d-3*Math.cos(p+.5),f-3*Math.sin(p+.5)),a.stroke()}let d=Math.min(e.length-1,Math.floor(t/300));if(d>=0){a.lineWidth=1,a.strokeStyle=`#57d9e369`;for(let t=4;t<e[d].particles.length/4;t++){a.beginPath();for(let n=Math.max(0,d-8);n<=d;n++){let r=e[n].particles,i=l.left+r[t*4]*l.width,o=l.top+(1-r[t*4+1])*l.height;n===Math.max(0,d-8)?a.moveTo(i,o):a.lineTo(i,o)}a.stroke()}for(let t=0;t<4;t++)this.drawRelease(l,e,d,t,[-85,20,-55,50],!0)}a.restore(),a.strokeStyle=`#45606b`,a.lineWidth=1,a.strokeRect(l.left,l.top,l.width,l.height),a.font=`10px system-ui`,a.fillStyle=`#9ab1bf`;for(let e=0;e<=6;e++){let t=l.left+e/6*l.width,n=l.top+(1-e/6)*l.height;a.fillText(`${85-e*5}°W`,t-10,l.top+l.height+18),a.fillText(`${20+e*5}°N`,l.left-35,n+3)}if(a.fillText(`10 m winds · 1° grid · two snapshots · 1,028 GPU trajectories`,l.left,l.top+l.height+42),!o&&d>=0){let t=g(e),i=Math.min(135,(r-165)/4);for(let r=0;r<4;r++){let o={left:n-305,top:120+r*i,width:260,height:i-16};a.fillStyle=`#0c1a27`,a.fillRect(o.left,o.top,o.width,o.height),a.font=`12px system-ui`,a.fillStyle=_[r],a.fillText(`RELEASE ${r+1}`,o.left+12,o.top+20),a.fillStyle=`#b7cbd4`,a.font=`11px system-ui`,a.fillText(`${t[r].toFixed(2)} m max hourly error`,o.left+104,o.top+20);let s=h.reference.frames.map(e=>e.positions[r]),c=Math.min(...s.map(e=>e[0]))-.2,l=Math.min(...s.map(e=>e[1]))-.2,u=Math.max(...s.map(e=>e[0]))+.2,f=Math.max(...s.map(e=>e[1]))+.2,p={left:o.left+15,top:o.top+35,width:o.width-30,height:o.height-50};this.drawRelease(p,e,d,r,[c,l,u,f],!1)}}}drawRelease(e,t,n,r,i,a){let o=this.context,s=(t,n)=>[e.left+(t-i[0])/(i[2]-i[0])*e.width,e.top+(i[3]-n)/(i[3]-i[1])*e.height];o.strokeStyle=`#ffffffaa`,o.lineWidth=1.5,o.setLineDash([3,4]),o.beginPath();for(let e=0;e<h.reference.frames.length;e++){let t=h.reference.frames[e].positions[r],n=s(t[0],t[1]);e===0?o.moveTo(...n):o.lineTo(...n)}o.stroke(),o.setLineDash([]),o.strokeStyle=_[r],o.lineWidth=2,o.beginPath();for(let e=0;e<=n;e++){let n=t[e].particles,i=s(-85+n[r*4]*30,20+n[r*4+1]*30);e===0?o.moveTo(...i):o.lineTo(...i)}o.stroke();let c=t[n].particles,l=s(-85+c[r*4]*30,20+c[r*4+1]*30);o.fillStyle=_[r],o.beginPath(),o.arc(...l,a?4:3,0,Math.PI*2),o.fill(),a&&(o.font=`bold 12px system-ui`,o.fillText(String(r+1),l[0]+8,l[1]-7))}},S=`ISC License

Copyright (c) 2016, Mapbox

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

`,C=`// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Device} from '@luma.gl/core';
import {
  FlowTrajectoryHistory,
  ScientificFlowTracer,
  type ScientificFlowTraceResult
} from '@luma.gl/graph/experimental-simulation';
import {GFS_DURATION, makeGfsField, makeGfsSeeds, measureGfsFrames} from './gfs-data';

/** One controlled variation; all other solver and fixture settings stay fixed. */
export type GfsRunOptions = {
  label: string;
  tolerance: number;
  maximumTimeStep: number;
  stride: number;
  frozen: boolean;
  side?: number;
  captureInterval?: number;
};
/** One-factor-at-a-time accuracy/cost experiments; coarse/frozen cases change the field. */
export const GFS_SWEEP: GfsRunOptions[] = [
  {label: 'Baseline', tolerance: 1, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Tighter tolerance', tolerance: 0.1, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Looser tolerance', tolerance: 10, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Shorter steps', tolerance: 1, maximumTimeStep: 60, stride: 1, frozen: false},
  {label: '2° grid', tolerance: 1, maximumTimeStep: 300, stride: 2, frozen: false},
  {label: '3° grid', tolerance: 1, maximumTimeStep: 300, stride: 3, frozen: false},
  {label: 'Frozen initial wind', tolerance: 1, maximumTimeStep: 300, stride: 1, frozen: true}
];

/** Integrate on the GPU, retaining common horizons; explicit readback occurs once at the end. */
export async function runGfsTrajectories(
  device: Device,
  options: GfsRunOptions,
  onDispatch?: (tracer: ScientificFlowTracer, result: ScientificFlowTraceResult) => void,
  signal?: AbortSignal
) {
  const captureInterval = options.captureInterval ?? 3600;
  const start = performance.now();
  const tracer = new ScientificFlowTracer(device, {
    input: makeGfsField(0, options.stride),
    nextInput: makeGfsField(options.frozen ? 0 : 1, options.stride),
    timeRange: [0, GFS_DURATION],
    positions: makeGfsSeeds(options.side),
    tolerance: options.tolerance,
    maximumTimeStep: options.maximumTimeStep,
    maximumAttempts: 32,
    conservativeMask: true
  });
  const history = new FlowTrajectoryHistory(device, {
    particleCount: tracer.particleCount,
    capacity: GFS_DURATION / captureInterval + 1
  });
  let acceptedSteps = 0;
  let rejectedSteps = 0;
  let dispatches = 0;
  let gpuMilliseconds = 0;
  let timedDispatches = 0;
  let termination: ScientificFlowTraceResult | undefined;
  /** Capture after submission at a completed common horizon. */
  function capture(): void {
    const encoder = device.createCommandEncoder();
    history.record(encoder, tracer.output, tracer.time);
    device.submit(encoder.finish());
  }
  try {
    capture();
    for (let time = captureInterval; time <= GFS_DURATION; time += captureInterval) {
      signal?.throwIfAborted();
      let result = await tracer.advance(captureInterval);
      let continuation = 0;
      while (true) {
        acceptedSteps += result.acceptedSteps;
        rejectedSteps += result.rejectedSteps;
        dispatches++;
        if (result.gpuMilliseconds !== undefined) {
          gpuMilliseconds += result.gpuMilliseconds;
          timedDispatches++;
        }
        onDispatch?.(tracer, result);
        signal?.throwIfAborted();
        if (result.complete) break;
        if (++continuation > 512) throw new Error('GFS integration did not complete');
        result = await tracer.continue();
      }
      termination = result;
      capture();
    }
    const stateBytes = await tracer.diagnostics.readAsync(0, 64);
    const states = new Float32Array(stateBytes.buffer, stateBytes.byteOffset, 16);
    for (let particle = 0; particle < 4; particle++) {
      if (states[particle * 4 + 2] !== 0)
        throw new Error('A qualification release stopped before the final horizon');
    }
    const frames = await history.readFrames();
    return {
      frames,
      report: {
        ...options,
        particleCount: tracer.particleCount,
        maximumErrorMetres: Math.max(...measureGfsFrames(frames)),
        referenceErrorsMetres: measureGfsFrames(frames),
        acceptedSteps,
        rejectedSteps,
        dispatches,
        termination: {
          active: termination?.active,
          outsideDomain: termination?.outsideDomain,
          missingData: termination?.missingData,
          toleranceFailure: termination?.toleranceFailure,
          numericalFailure: termination?.numericalFailure
        },
        gpuMilliseconds: timedDispatches === dispatches ? gpuMilliseconds : null,
        wallMilliseconds: performance.now() - start,
        historyBytes: history.buffer.byteLength
      },
      /** Release the retained resources after graph inspection is no longer needed. */
      destroy(): void {
        history.destroy();
        tracer.destroy();
      }
    };
  } catch (error) {
    history.destroy();
    tracer.destroy();
    throw error;
  }
}
/** Completed run, including explicitly read CPU snapshots and retained inspection resources. */
export type GfsRun = Awaited<ReturnType<typeof runGfsTrajectories>>;
`;function w(e){return document.querySelector(`#`+e)}function T(e,t,n){let r=URL.createObjectURL(new Blob([t],{type:n})),i=document.createElement(`a`);i.href=r,i.download=e,i.click(),setTimeout(()=>URL.revokeObjectURL(r),1e3)}var E=w(`status`);try{let r=await l.createDevice({adapters:[c],optionalFeatures:[`timestamp-query`]}),u=new s({traceTitle:`Trace`}),d=new AbortController,f,p,g,_,v=[],D=`Run seven controlled variants, twice each after warmup. Four particles; six physical hours per run.`,O,k=0,A=!0,j=0,M=performance.now(),N=w(`gfs-timeline`),P=w(`gfs-play`),F=w(`gfs-speed`),I=w(`gfs-export`),L=new Image;L.src=i,await L.decode();let R=new x(w(`flow`),L);function z(){if(!_)return;_.replaceChildren();let e=document.createElement(`p`);e.textContent=D;let t=document.createElement(`button`);t.textContent=f?`Cancel sweep`:`Run accuracy / cost sweep`,t.disabled=!p,t.onclick=()=>{f?f.abort():g=B()};let n=document.createElement(`table`);n.className=`gfs-results`;let i=n.createTHead().insertRow();for(let e of[`Variant`,`Error (m)`,`GPU (ms)`,`Wall (ms)`,`Steps`]){let t=document.createElement(`th`);t.textContent=e,i.append(t)}for(let e of v){let t=n.insertRow();for(let n of[e.label,e.maximumErrorMetres.toFixed(2),e.gpuMilliseconds?.toFixed(2)??`n/a`,e.wallMilliseconds.toFixed(0),e.acceptedSteps.toLocaleString()])t.insertCell().textContent=n}let a=document.createElement(`button`);a.textContent=`Export benchmark JSON`,a.disabled=v.length===0||!!f,a.onclick=()=>T(`gfs-accuracy-cost.json`,JSON.stringify({fixture:{source:h.sourceRepository,revision:h.sourceRevision,dates:h.snapshots.map(e=>e.date)},device:r.info,timestampQueries:r.features.has(`timestamp-query`),durationSeconds:m,referenceRefinementMetres:h.reference.maximumReferenceDifferenceMetres,measurement:`GPU compute only; wall includes allocation, compilation, counter synchronization, capture and final readback. Warmup discarded; two samples per variant. Coarse and frozen cases alter the field, so their error includes interpolation error.`,samples:v},null,2),`application/json`);let o=document.createElement(`p`);o.textContent=`GPU time excludes transfers and rendering. Wall time includes setup and explicit readback. Timings are device-dependent; four particles measure latency, not throughput. Coarse/frozen variants change the field. Error is measured only at matching hourly horizons.`,_.append(e,t,n,a,o)}async function B(){f=new AbortController,v=[],D=`Warming up…`,z();let e=AbortSignal.any([d.signal,f.signal]);try{(await b(r,y[0],void 0,e)).destroy();for(let t=0;t<2;t++){let n=t===0?y:[...y].reverse();for(let i of n){D=`${i.label} · sample ${t+1}/2`,z();let n=await b(r,i,void 0,e);v.push(n.report),n.destroy(),z(),await new Promise(e=>setTimeout(e,0))}}D=`Complete · two samples per variant; warmup discarded.`}catch(t){D=e.aborted?`Sweep cancelled; completed samples retained.`:`Sweep failed: ${String(t)}`}finally{f=void 0,z()}}let V=new n({parentElement:w(`observatory-panels`)});V.setProps({components:[new a({title:`GFS Atlantic`,subtitle:`Archived winds / GPU trajectory lab`,directory:`experimental`,id:`vector-observatory`,websiteBaseUrl:`/`,appearance:`cinematic`,panel:t({id:`gfs-tabs`,theme:`dark`,panels:[o({id:`gfs-info`,title:`Info`,html:`<p>Six hours of NOAA GFS 10 m model winds from 20 November 2016, decoded from the pinned Mapbox 8-bit archive. This is model data, not observations or a forecast service.</p><p>The arrows interpolate the two archived wind snapshots. Cyan trails are a 1,024-particle GPU release; four colored releases match the independent CPU reference. White dashes connect hourly reference points. The overview uses geographic coordinates; inset axes are magnified independently.</p><p>RK45 uses a 1 m local tolerance and 300 s maximum step. The GPU history retains 73 common horizons, every five minutes, before one explicit trajectory readback. Playback shows those retained states; it does not rerun the solver. Reported error compares only common hourly horizons.</p><p><a href="./index.html">Return to synthetic weather globe</a> · <a href="${h.sourceRepository}/tree/${h.sourceRevision}" target="_blank" rel="noreferrer">Pinned data source</a></p><details><summary>Data license</summary><pre data-gfs-license></pre></details>`,onRender:e=>{e.querySelector(`[data-gfs-license]`).textContent=S}}),o({id:`gfs-diagnostics`,title:`Diagnostics`,html:``,onRender:e=>(O=e,e.textContent=p?JSON.stringify(p.report,null,2):E.textContent,e.style.whiteSpace=`pre-wrap`,()=>{O=void 0})}),u.inspectorPanel.panel,u.tracePanel.panel,o({id:`gfs-benchmark`,title:`Accuracy / cost`,html:``,onRender:e=>(_=e,z(),()=>{_=void 0})}),o({id:`gfs-source`,title:`Source`,html:`<pre class="observatory-source"></pre>`,onRender:e=>{e.querySelector(`pre`).textContent=C}})]})})]}),P.onclick=()=>{j>=21600&&(j=0),A=!A,P.textContent=A?`Pause`:`Play`},N.oninput=()=>{j=Number(N.value),A=!1,P.textContent=`Play`},I.onclick=async()=>{if(p){I.disabled=!0;try{let{makeGfsCsv:t}=await e(async()=>{let{makeGfsCsv:e}=await import(`./gfs-export-nWys6r-o.js`);return{makeGfsCsv:e}},__vite__mapDeps([0,1,2,3]),import.meta.url);T(`gfs-atlantic-trajectories.csv`,await t(p.frames),`text/csv`)}catch(e){E.textContent=`CSV export failed: ${String(e)}`}finally{I.disabled=!1}}};function H(e){d.signal.aborted||(p&&A&&(j=Math.min(m,j+Math.min(.1,(e-M)/1e3)*Number(F.value))),j>=21600&&(A=!1,P.textContent=`Replay`),M=e,N.value=String(j),w(`gfs-time`).textContent=`${(j/3600).toFixed(2)} / 6 h`,R.draw(p?.frames??[],j),V.onRedraw({viewports:[],layers:[]}),k=requestAnimationFrame(H))}k=requestAnimationFrame(H),g=(async()=>{try{p=await b(r,{...y[0],side:32,captureInterval:300},(e,t)=>{u.record(e.commandGraph,t.encoding),E.textContent=`Integrating archived winds · ${Math.round(t.targetTime/m*100)}%`,O&&(O.textContent=E.textContent)},d.signal),E.textContent=`GPU RK45 · ${p.report.maximumErrorMetres.toFixed(2)} m maximum hourly reference error · 73 retained horizons`,O&&(O.textContent=JSON.stringify(p.report,null,2)),P.disabled=!1,N.disabled=!1,I.disabled=!1,z()}catch(e){d.signal.aborted||(E.textContent=`Integration failed: ${String(e)}`,A=!1)}})(),window.addEventListener(`pagehide`,()=>{d.abort(),cancelAnimationFrame(k),g?.finally(()=>{V.finalize(),u.clear(),p?.destroy(),r.destroy()})},{once:!0})}catch(e){let t=w(`error`);t.hidden=!1,t.textContent=`This example requires WebGPU. ${String(e)}`}