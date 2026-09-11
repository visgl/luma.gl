// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationLoop} from '@luma.gl/engine';
import {WebGPUDevice} from '@luma.gl/webgpu';
import {SpectralWaveEngine} from './spectral-wave-engine';
import {SpectralWaveRenderer} from './spectral-wave-renderer';

class SpectralWaveLab extends AnimationLoopTemplate{
  engine!:SpectralWaveEngine;renderer!:SpectralWaveRenderer;
  async onInitialize({device}:{device:WebGPUDevice}){this.engine=new SpectralWaveEngine(device,{resolution:256});this.renderer=new SpectralWaveRenderer(device,this.engine.field,this.engine.resolution);writeInfo(this.engine);return{};}
  onRender({device,tick}:any){const time=tick/60;this.engine.encode(time);this.renderer.render(time);}
  onFinalize(){this.renderer?.destroy();this.engine?.destroy();}
}

function writeInfo(engine:SpectralWaveEngine):void{const element=document.getElementById('info');if(!element)return;const s=engine.stats;element.innerHTML=`<h1>Spectral Wave Lab</h1><p><strong>What are you looking at?</strong> A real solution of the two-dimensional wave equation. The initial disturbances are transformed into spatial frequencies with a 2D FFT. In Fourier space every wave mode evolves independently at its physically prescribed frequency. An inverse FFT reconstructs the surface you see here.</p><p>This is why Fourier methods are so powerful: a differential equation that couples neighboring points in real space becomes simple arithmetic on independent frequency modes.</p><div class="equation">∂²u/∂t² = c²Δu<br>û(k,t) = û₀(k) cos(c|k|t)</div><p><strong>The picture is the computation.</strong> The renderer samples the inverse-FFT GPU buffer directly; there is no CPU field reconstruction or canned animation.</p><h2>Engineering</h2><dl><dt>Grid</dt><dd>${s.resolution} × ${s.resolution}</dd><dt>Complex modes</dt><dd>${s.elementCount.toLocaleString()}</dd><dt>FFT passes</dt><dd>${s.fftPasses}</dd><dt>FFT dispatches/frame</dt><dd>${s.fftDispatchesPerFrame}</dd><dt>Wave speed</dt><dd>${s.waveSpeed}</dd></dl><p class="foot">One forward FFT captures the initial condition. Each frame performs spectral phase evolution plus one inverse FFT. This example exercises dense GPU compute, FFT, frequency-domain mathematics, and direct compute→render flow.</p>`;}

AnimationLoop.start(new SpectralWaveLab(),{device:WebGPUDevice});
