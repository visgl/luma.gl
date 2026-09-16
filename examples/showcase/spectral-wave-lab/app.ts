// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {AccordeonPanel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {SpectralWaveEngine, type SpectralWaveLabStats} from './spectral-wave-engine';
import {SpectralWaveRenderer} from './spectral-wave-renderer';
import {SpectralViewRenderer} from './spectral-view-renderer';
export default class SpectralWaveLab extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  engine!: SpectralWaveEngine;
  physical!: SpectralWaveRenderer;
  fourier!: SpectralViewRenderer;
  panels?: ExamplePanelManager;
  override async onInitialize({device}: AnimationProps): Promise<void> {
    if (device.type !== 'webgpu') {
      throw new Error('Spectral Wave Lab requires WebGPU');
    }
    this.engine = new SpectralWaveEngine(device, {resolution: 256});
    this.physical = new SpectralWaveRenderer(device, this.engine.field, this.engine.resolution);
    this.fourier = new SpectralViewRenderer(
      device,
      this.engine.evolvedSpectrum,
      this.engine.resolution
    );
    this.panels = new ExamplePanelManager({panel: makeInfoPanel(this.engine.stats)});
    this.panels.mount();
  }
  override onRender({device, tick}: AnimationProps): void {
    const time = tick / 60;
    this.engine.encode(time);
    const canvas = device.getDefaultCanvasContext();
    const [w, h] = canvas.getDrawingBufferSize();
    const pass = device.beginRenderPass({
      id: 'spectral-dual-view',
      framebuffer: canvas.getCurrentFramebuffer(),
      clearColor: [0.003, 0.006, 0.018, 1],
      clearDepth: 1
    });
    pass.end();
    this.physical.render(time, [0, 0, Math.ceil(w * 0.58), h]);
    const pass2 = device.beginRenderPass({
      id: 'spectral-fourier-view',
      framebuffer: canvas.getCurrentFramebuffer(),
      clearColor: false
    });
    this.fourier.draw(pass2, [Math.ceil(w * 0.58), 0, w - Math.ceil(w * 0.58), h], time);
    pass2.end();
  }
  override onFinalize(): void {
    this.panels?.finalize();
    this.fourier?.destroy();
    this.physical?.destroy();
    this.engine?.destroy();
  }
}

function makeInfoPanel(stats: SpectralWaveLabStats): AccordeonPanel {
  return new AccordeonPanel({
    id: 'spectral-wave-lab-info',
    title: 'Spectral Lab — Two Views of One Wave',
    panels: [
      makeHtmlCustomPanel({
        id: 'spectral-wave-lab-guide',
        title: 'Guide',
        html: `<p><strong>Left: physical space.</strong> Peaks, troughs, and interference evolve across the wave surface.</p><p><strong>Right: Fourier space.</strong> A magnified low-frequency window shows the same state as independent spatial modes. Brightness represents spectral energy.</p><p>These are <em>not two simulations</em>. A 2D inverse FFT connects both views every frame.</p><p><code>∂²u/∂t² = c²Δu</code><br><code>û(k,t) = û₀(k) cos(c|k|t)</code></p>`
      }),
      makeHtmlCustomPanel({
        id: 'spectral-wave-lab-engineering',
        title: 'Engineering',
        html: `<dl><dt>Grid</dt><dd>${stats.resolution} × ${stats.resolution}</dd><dt>Fourier modes</dt><dd>${stats.elementCount.toLocaleString()}</dd><dt>FFT passes</dt><dd>${stats.fftPasses}</dd><dt>FFT dispatches/frame</dt><dd>${stats.fftDispatchesPerFrame}</dd><dt>Wave speed</dt><dd>${stats.waveSpeed}</dd></dl><p>One forward FFT captures the initial disturbance. Each frame evolves the spectrum analytically, renders it directly, inverse-transforms it, and renders the physical field from the same GPU buffers.</p>`
      })
    ]
  });
}
