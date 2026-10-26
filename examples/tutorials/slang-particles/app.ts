// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Computation, Model, type AnimationProps} from '@luma.gl/engine';
import {WGSLShaderAssembler, type ShaderTranspiler} from '@luma.gl/shadertools';
import {
  transpileSlangWGSL,
  packSlangUniforms,
  type SlangWGSLProgramResult,
  type SlangTypeLayout
} from '@luma.gl/slang';
import {
  getSlangShaderLayout,
  getSlangBindingNames,
  getSlangUniformBufferLayouts
} from '@luma.gl/slang/luma';
import {getExampleRuntimeEnvironment} from '../../example-support';
import source from './particles.slang?raw';
import {makeParticles} from './simulation';

export default class SlangParticlesExample extends AnimationLoopTemplate {
  static info =
    '<h3>Slang: Particle vortex</h3><p>Particles simulated and rendered from one Slang source. Move the pointer to pull the cloud; adjust its swirl and cohesion.</p>';
  readonly model: Model;
  readonly computation: Computation;
  readonly particles: [Buffer, Buffer];
  readonly uniformBuffer: Buffer;
  readonly particleCount: number;
  private readonly device: Device;
  private readonly sceneLayout: SlangTypeLayout;
  private readonly bindingNames: Record<string, string>;
  private frameIndex = 0;
  private elapsedTime = 0;
  private previousTime = 0;
  private paused = false;
  private swirl = 0.8;
  private cohesion = 0.08;
  private pointer: [number, number, number] = [0, 0, 0];
  private controls: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor({device}: AnimationProps, particleCount?: number) {
    super();
    particleCount ??=
      typeof window !== 'undefined' && getExampleRuntimeEnvironment(window, navigator).handheld
        ? 8192
        : 32768;
    // Every workgroup has 64 live particles, so all threads reach the synchronization barriers.
    if (device.info.type !== 'webgpu' || particleCount % 64 || particleCount < 64)
      throw new Error('Requires WebGPU and a multiple of 64 particles');
    this.device = device;
    this.particleCount = particleCount;
    const cache = new Map<string, SlangWGSLProgramResult>();
    const compile = (shaderSource: string, entryPoints: string[]) => {
      const key = JSON.stringify([shaderSource, entryPoints]);
      if (!cache.has(key))
        cache.set(key, transpileSlangWGSL(shaderSource, {entryPoints, omitUnusedResources: true}));
      return cache.get(key)!;
    };
    const compute = compile(source, ['simulate']);
    const render = compile(source, ['vertexMain', 'fragmentMain']);
    const shaderAssembler = new WGSLShaderAssembler();
    // This application owns compiler imports and registration.
    const transpiler: ShaderTranspiler = {
      name: 'slang',
      sourceLanguage: 'slang',
      transpile({source: shaderSource, entryPoints}) {
        const result = compile(
          shaderSource,
          Object.values(entryPoints).filter((entryPoint): entryPoint is string =>
            Boolean(entryPoint)
          )
        );
        return {
          code: result.code,
          entryPoints: Object.fromEntries(
            Object.values(result.entryPoints).map(entry => [entry.stage, entry.entryPoint])
          )
        };
      }
    };
    shaderAssembler.addShaderTranspiler(transpiler);
    this.bindingNames = getSlangBindingNames(compute);
    const scene = getSlangUniformBufferLayouts(compute).scene;
    this.sceneLayout = scene.layout;
    this.uniformBuffer = device.createBuffer({
      byteLength: scene.byteLength,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const stride = compute.entryPoints.simulate.reflection.bindings.find(
      binding => binding.name === 'previousParticles'
    )!.elementStride!;
    const createBuffer = () =>
      device.createBuffer({
        byteLength: particleCount * stride,
        data: makeParticles(particleCount),
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      });
    this.particles = [createBuffer(), createBuffer()];
    this.computation = new Computation(device, {
      id: 'slang-particle-simulation',
      shaderAssembler,
      source,
      sourceLanguage: 'slang',
      entryPoint: 'simulate',
      shaderLayout: getSlangShaderLayout(compute)
    });
    this.model = new Model(device, {
      id: 'slang-particle-cloud',
      shaderAssembler,
      source,
      sourceLanguage: 'slang',
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      shaderLayout: getSlangShaderLayout(render),
      topology: 'triangle-list',
      vertexCount: 6,
      instanceCount: particleCount,
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always',
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one'
      }
    });
    this.model.setBindings({
      [this.bindingNames.scene]: this.uniformBuffer,
      [this.bindingNames.previousParticles]: this.particles[0]
    });
    this.updateScene(0, 0, 1);
  }
  updateScene(time: number, delta: number, aspect: number): void {
    this.uniformBuffer.write(
      packSlangUniforms(this.sceneLayout, {
        clock: [time, delta, aspect, 0.0045],
        motion: [this.swirl, this.cohesion, 0, 0],
        attractor: [...this.pointer, 0]
      })
    );
  }
  /** The next GPU buffer becomes the render input, with no CPU readback or repacking. */
  step(time: number, delta: number, aspect = 1): void {
    this.updateScene(time, delta, aspect);
    const previous = this.particles[this.frameIndex % 2];
    const next = this.particles[(this.frameIndex + 1) % 2];
    this.computation.setBindings({
      [this.bindingNames.previousParticles]: previous,
      [this.bindingNames.nextParticles]: next,
      [this.bindingNames.scene]: this.uniformBuffer
    });
    const pass = this.device.beginComputePass();
    this.computation.dispatch(pass, this.particleCount / 64);
    pass.end();
    this.frameIndex++;
    this.model.setBindings({[this.bindingNames.previousParticles]: next});
  }
  get currentParticles(): Buffer {
    return this.particles[this.frameIndex % 2];
  }
  reset(): void {
    const values = makeParticles(this.particleCount);
    this.particles.forEach(buffer => buffer.write(values));
    this.elapsedTime = 0;
  }
  override async onInitialize({device}: AnimationProps): Promise<void> {
    const canvas = device.getDefaultCanvasContext().canvas;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    this.canvas = canvas;
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    const host = canvas.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    this.controls = document.createElement('div');
    this.controls.innerHTML = `<style>
      .slang-particles-panel {position:absolute;left:24px;bottom:24px;max-width:calc(100% - 48px);width:280px;padding:18px 22px;box-sizing:border-box;color:#e3edff;background:#0a1425dd;border:1px solid #cce3ff25;border-radius:16px;backdrop-filter:blur(12px);font:13px/1.5 system-ui;}
      .slang-particles-panel h2 {font-size:23px;font-weight:500;margin:6px 0;} .slang-particles-panel p {color:#9fafc8;margin:0 0 14px;}
      .slang-particles-panel small {color:#9addfa;letter-spacing:.12em;} .slang-particles-panel label {display:flex;align-items:center;justify-content:space-between;margin:9px 0;} .slang-particles-panel input {width:140px;accent-color:#9addfa;}
      .slang-particles-panel button {color:#dbeaff;background:#14253f;border:1px solid #ffffff30;border-radius:6px;padding:6px 14px;margin:8px 8px 0 0;}
      @media(max-width:600px) {.slang-particles-panel {left:12px;bottom:12px;width:245px;padding:12px 16px;}}
    </style><small>SLANG / WEBGPU</small><h2>Particle vortex</h2><p>${this.particleCount.toLocaleString()} sparks in a shared flow.<br>Move the pointer to pull the cloud.</p>
    <label>Swirl <input aria-label="Swirl" type="range" min="0" max="1.5" step="0.01" value="0.8"></label>
    <label>Cohesion <input aria-label="Cohesion" type="range" min="0" max="0.8" step="0.01" value="0.08"></label>
    <button data-action="pause">Pause</button><button data-action="reset">Reset</button>`;
    this.controls.className = 'slang-particles-panel';
    this.controls.querySelector('[aria-label="Swirl"]')!.addEventListener('input', event => {
      this.swirl = Number((event.target as HTMLInputElement).value);
    });
    this.controls.querySelector('[aria-label="Cohesion"]')!.addEventListener('input', event => {
      this.cohesion = Number((event.target as HTMLInputElement).value);
    });
    this.controls.querySelector('[data-action="pause"]')!.addEventListener('click', event => {
      this.paused = !this.paused;
      (event.target as HTMLButtonElement).textContent = this.paused ? 'Play' : 'Pause';
    });
    this.controls
      .querySelector('[data-action="reset"]')!
      .addEventListener('click', () => this.reset());
    host.append(this.controls);
  }
  override onRender({device, time, aspect}: AnimationProps): void {
    const delta = Math.min(Math.max(time - this.previousTime, 0) / 1000, 1 / 30);
    this.previousTime = time;
    if (!this.paused) {
      this.elapsedTime += delta;
      this.step(this.elapsedTime, delta, aspect);
    } else this.updateScene(this.elapsedTime, 0, aspect);
    const pass = device.beginRenderPass({clearColor: [0.006, 0.01, 0.025, 1]});
    this.model.draw(pass);
    pass.end();
  }
  override onFinalize(): void {
    this.canvas?.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerleave', this.handlePointerLeave);
    this.controls?.remove();
    this.computation.destroy();
    this.model.destroy();
    this.uniformBuffer.destroy();
    this.particles.forEach(buffer => buffer.destroy());
  }
  private readonly handlePointerMove = (event: PointerEvent): void => {
    const bounds = this.canvas!.getBoundingClientRect();
    this.pointer = [
      ((((event.clientX - bounds.left) / bounds.width) * 2 - 1) * bounds.width) / bounds.height,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
      1
    ];
  };
  private readonly handlePointerLeave = (): void => {
    this.pointer[2] = 0;
  };
}
