// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {packSlangUniforms, type SlangTypeLayout} from '@luma.gl/slang';
import {AnimationLoopTemplate, type AnimationProps, Model} from '@luma.gl/engine';
import {GLSLShaderAssembler, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {createSlangTranspiler} from './slang-transpiler';
import {createShaderViewer} from './shader-viewer';
import {filmGrain} from './film-grain';
import shaderSource from './shader.slang?raw';
import paletteSource from './palette.slang?raw';
import geometrySource from './geometry.slang?raw';

export default class SlangShadersExample extends AnimationLoopTemplate {
  static info =
    `<h3>Slang: Orbital sculpture</h3><p>Animated distance fields, iridescent lighting, and a floor reflection, written once in Slang. Drag to orbit or open the shader viewer to compare Slang with the generated code. The application registers its compiler; named Slang imports supply geometry and material. A typed bridge calls native valueNoise code, which calls a public Slang helper to add adjustable grain.</p>`;

  readonly model: Model;
  readonly uniformBuffer: Buffer;
  private readonly sceneLayout: SlangTypeLayout;
  private controls: HTMLDivElement | null = null;
  private shaderViewer: ReturnType<typeof createShaderViewer> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private previousTime = 0;
  private elapsedTime = 0;
  private paused = false;
  private twist = 0.35;
  private palette = 0;
  private exposure = 1.3;
  private grain = 0.035;
  private yaw = 0.45;
  private pitch = 0.28;
  private pointerPosition: [number, number] | null = null;

  constructor({device}: AnimationProps) {
    super();
    const shaderAssembler =
      device.info.shadingLanguage === 'wgsl'
        ? new WGSLShaderAssembler()
        : new GLSLShaderAssembler();
    // The application imports and registers its compiler on its own assembler.
    const slangTranspiler = createSlangTranspiler({
      modules: {geometry: geometrySource, palette: paletteSource, filmGrain},
      exports: {getGrainOffset: 'scaleGrain'}
    });
    shaderAssembler.addShaderTranspiler(slangTranspiler);
    this.model = new Model(device, {
      id: 'slang-orbital-sculpture',
      shaderAssembler,
      sourceLanguage: 'slang',
      source: shaderSource,
      vs: shaderSource,
      fs: shaderSource,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      topology: 'triangle-list',
      vertexCount: 3
    });
    // Shader assembly populated reflection, including the buffer's exact host layout.
    const scene = slangTranspiler.uniformBufferLayouts.scene;
    this.sceneLayout = scene.layout;
    this.uniformBuffer = device.createBuffer({
      id: 'slang-scene-uniforms',
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      byteLength: scene.byteLength
    });
    this.model.setBindings({[scene.name]: this.uniformBuffer});
    this.updateScene(0, 1);
  }

  override async onInitialize({device}: AnimationProps): Promise<void> {
    const canvas = device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    this.canvas = canvas;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    const host = canvas.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    this.controls = document.createElement('div');
    this.controls.className = 'slang-sculpture-controls';
    this.controls.innerHTML = `
      <style>
        .slang-sculpture-controls { position:absolute; left:24px; bottom:24px; z-index:2;
          max-width:calc(100% - 48px); width:290px; box-sizing:border-box; color:#e6edf7;
          font:13px/1.5 system-ui,sans-serif; background:rgba(10,17,29,.88);
          border:1px solid #ffffff20; border-radius:16px; padding:18px 20px;
          backdrop-filter:blur(16px); box-shadow:0 12px 40px #0005; }
        .slang-sculpture-controls h2 { margin:4px 0 2px; font-size:21px; font-weight:500; }
        .slang-sculpture-controls p { margin:0 0 16px; color:#9cabbd; }
        .slang-sculpture-controls .eyebrow { color:#7edbdc; font-size:10px; letter-spacing:.15em; }
        .slang-sculpture-controls label { display:flex; justify-content:space-between; gap:16px;
          align-items:center; margin:10px 0; }
        .slang-sculpture-controls input { width:145px; accent-color:#80dbde; }
        .slang-sculpture-controls select, .slang-sculpture-controls button { color:#e6edf7;
          background:#182535; border:1px solid #ffffff25; border-radius:6px; padding:5px 9px; }
        .slang-sculpture-controls footer { display:flex; justify-content:space-between;
          align-items:center; margin-top:16px; color:#8da2b7; font-size:11px; }
        @media(max-width:600px) { .slang-sculpture-controls { left:12px; bottom:12px;
          padding:12px 16px; width:250px; } .slang-sculpture-controls p { margin-bottom:8px; }
          .slang-sculpture-controls label { gap:8px; }
          .slang-sculpture-controls input { width:130px; } }
      </style>
      <span class="eyebrow">SLANG / ${device.info.type === 'webgpu' ? 'WEBGPU' : 'WEBGL 2'}</span>
      <h2>Orbital sculpture</h2>
      <p>Three rings. One glowing core.<br>Drag the scene to explore.</p>
      <label>Material <select aria-label="Material"><option value="0">Prismatic</option>
        <option value="1">Ember</option><option value="2">Glacier</option></select></label>
      <label>Twist <input aria-label="Twist" type="range" min="0" max="0.75" step="0.01" value="0.35"></label>
      <label>Exposure <input aria-label="Exposure" type="range" min="0.5" max="2.5" step="0.05" value="1.3"></label>
      <label>Native grain <input aria-label="Native grain" type="range" min="0" max="0.15" step="0.005" value="0.035"></label>
      <footer><button type="button" aria-expanded="false" data-action="shaders">Show shaders</button>
        <button type="button" data-action="pause">Pause</button></footer>`;
    this.controls.querySelector('select')!.addEventListener('change', event => {
      this.palette = Number((event.target as HTMLSelectElement).value);
    });
    this.controls.querySelector('[aria-label="Twist"]')!.addEventListener('input', event => {
      this.twist = Number((event.target as HTMLInputElement).value);
    });
    this.controls.querySelector('[aria-label="Exposure"]')!.addEventListener('input', event => {
      this.exposure = Number((event.target as HTMLInputElement).value);
    });
    this.controls.querySelector('[aria-label="Native grain"]')!.addEventListener('input', event => {
      this.grain = Number((event.target as HTMLInputElement).value);
    });
    this.controls.querySelector('[data-action="pause"]')!.addEventListener('click', event => {
      this.paused = !this.paused;
      (event.target as HTMLButtonElement).textContent = this.paused ? 'Play' : 'Pause';
    });
    host.append(this.controls);
    this.shaderViewer = createShaderViewer(
      host,
      [
        {name: 'shader.slang', code: shaderSource},
        {name: 'geometry.slang', code: geometrySource},
        {name: 'palette.slang', code: paletteSource},
        {name: 'filmGrain · Slang declarations', code: filmGrain.declarations},
        {name: 'filmGrain · Slang imports', code: filmGrain.imports},
        {
          name: 'filmGrain · native implementation',
          code: device.info.shadingLanguage === 'wgsl' ? filmGrain.wgsl : filmGrain.glsl
        }
      ],
      device.info.shadingLanguage === 'wgsl'
        ? [{name: 'WGSL · sculpture and native grain', code: this.model.source}]
        : [
            {name: 'GLSL ES 300 · vertex', code: this.model.vs},
            {name: 'GLSL ES 300 · fragment', code: this.model.fs}
          ]
    );
    const showShaders = this.controls.querySelector<HTMLButtonElement>('[data-action="shaders"]')!;
    showShaders.addEventListener('click', () => this.shaderViewer?.open(showShaders));
  }

  /** Pack named values using compiler reflection instead of handwritten offsets. */
  updateScene(time: number, aspect: number, grain = this.grain): void {
    this.uniformBuffer.write(
      packSlangUniforms(this.sceneLayout, {
        animation: [time, aspect, this.twist, this.palette],
        camera: [this.yaw, this.pitch, this.exposure, grain]
      })
    );
  }

  override onRender({device, time, aspect}: AnimationProps): void {
    if (!this.paused) this.elapsedTime += Math.min(time - this.previousTime, 100) / 1000;
    this.previousTime = time;
    this.updateScene(this.elapsedTime, aspect);
    const renderPass = device.beginRenderPass({clearColor: [0.01, 0.02, 0.04, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.canvas?.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas?.removeEventListener('pointercancel', this.handlePointerUp);
    this.shaderViewer?.destroy();
    this.controls?.remove();
    this.model.destroy();
    this.uniformBuffer.destroy();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerPosition = [event.clientX, event.clientY];
    this.canvas?.setPointerCapture(event.pointerId);
    if (this.canvas) this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerPosition) return;
    this.yaw -= (event.clientX - this.pointerPosition[0]) * 0.008;
    this.pitch = Math.max(
      -0.1,
      Math.min(1.1, this.pitch + (event.clientY - this.pointerPosition[1]) * 0.006)
    );
    this.pointerPosition = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (): void => {
    this.pointerPosition = null;
    if (this.canvas) this.canvas.style.cursor = 'grab';
  };
}
