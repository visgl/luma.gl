// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Binding,
  RenderPass,
  RenderPassDrawOptions,
  RenderPipelineProps,
  Shader,
  VertexArray
} from '@luma.gl/core';
import {
  Buffer,
  Device,
  PipelineFactory,
  RenderPipeline,
  ShaderFactory
} from '@luma.gl/core';

/** Properties for a lightweight immutable WebGPU render kernel. */
export type RenderKernelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  /** Already assembled WGSL vertex shader source. */
  vertexSource: string;
  /** Already assembled WGSL fragment shader source. Omit for vertex/depth-only pipelines. */
  fragmentSource?: string;
  /** Factory used to create/reuse the render pipeline. */
  pipelineFactory?: PipelineFactory;
  /** Factory used to create/reuse the render shaders. */
  shaderFactory?: ShaderFactory;
  /** Show shader source in browser debugging UI. */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';
};

/** Per-draw state that deliberately remains outside the immutable render kernel. */
export type RenderKernelDrawOptions = RenderPassDrawOptions & {
  /** Complete resource binding set for this draw. */
  bindings?: Record<string, Binding>;
  /** Vertex/index bindings consumed by this draw. */
  vertexArray: VertexArray;
};

/** Per-indirect-draw state shared by indexed and non-indexed indirect rendering. */
export type RenderKernelIndirectDrawOptions = {
  /** Complete resource binding set for this draw. */
  bindings?: Record<string, Binding>;
  /** Vertex/index bindings consumed by this draw. */
  vertexArray: VertexArray;
  /** Buffer containing WebGPU indirect draw arguments. */
  indirectBuffer: Buffer;
  /** Byte offset of the indirect draw record. */
  indirectOffset?: number;
};

/**
 * Lightweight executable WebGPU render program.
 *
 * `RenderKernel` owns compiled shaders and a cached render pipeline only. Shader assembly,
 * uniforms, geometry ownership, draw counts, command graphs and scene/model policy stay above it.
 * Bindings and vertex arrays are supplied per draw so the kernel does not retain mutable draw state.
 */
export class RenderKernel {
  /** Creates a render kernel while allowing the backend to compile its pipeline asynchronously. */
  static async createAsync(device: Device, props: RenderKernelProps): Promise<RenderKernel> {
    const ownsCompilation = !PipelineFactory.getAsyncCompilation(device);
    const asyncCompilation = ownsCompilation
      ? PipelineFactory.beginAsyncCompilation(device)
      : PipelineFactory.getAsyncCompilation(device)!;
    let kernel: RenderKernel;
    try {
      kernel = new RenderKernel(device, props);
    } finally {
      if (ownsCompilation) PipelineFactory.endAsyncCompilation(device, asyncCompilation);
    }
    try {
      if (ownsCompilation) {
        await Promise.all(asyncCompilation);
      } else {
        await kernel._pipelineInitialization;
      }
      return kernel;
    } catch (error) {
      kernel.destroy();
      throw error;
    }
  }

  readonly device: Device;
  readonly id: string;
  readonly vertexSource: string;
  readonly fragmentSource?: string;
  readonly pipelineFactory: PipelineFactory;
  readonly shaderFactory: ShaderFactory;

  readonly vertexShader: Shader;
  readonly fragmentShader: Shader | null;
  pipeline!: RenderPipeline;

  private _pipelineInitialization?: Promise<RenderPipeline>;
  private _destroyed = false;

  constructor(device: Device, props: RenderKernelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('RenderKernel is only supported in WebGPU');
    }

    this.device = device;
    this.id = props.id ?? 'render-kernel';
    this.vertexSource = props.vertexSource;
    this.fragmentSource = props.fragmentSource;
    this.pipelineFactory =
      props.pipelineFactory ?? PipelineFactory.getDefaultPipelineFactory(device);
    this.shaderFactory = props.shaderFactory ?? ShaderFactory.getDefaultShaderFactory(device);

    this.vertexShader = this.shaderFactory.createShader({
      id: `${this.id}-vertex`,
      stage: 'vertex',
      source: this.vertexSource,
      debugShaders: props.debugShaders
    });
    this.fragmentShader = this.fragmentSource
      ? this.shaderFactory.createShader({
          id: `${this.id}-fragment`,
          stage: 'fragment',
          source: this.fragmentSource,
          debugShaders: props.debugShaders
        })
      : null;

    const pipelineProps: RenderPipelineProps = {
      ...props,
      vs: this.vertexShader,
      fs: this.fragmentShader
    };
    delete (pipelineProps as RenderKernelProps).vertexSource;
    delete (pipelineProps as RenderKernelProps).fragmentSource;
    delete (pipelineProps as RenderKernelProps).pipelineFactory;
    delete (pipelineProps as RenderKernelProps).shaderFactory;
    delete (pipelineProps as RenderKernelProps).debugShaders;

    const asyncCompilation = PipelineFactory.getAsyncCompilation(device);
    if (asyncCompilation) {
      this._pipelineInitialization = this.pipelineFactory.createRenderPipelineAsync(pipelineProps);
      asyncCompilation.push(
        this._pipelineInitialization.then(pipeline => {
          this.pipeline = pipeline;
          return pipeline;
        })
      );
    } else {
      this.pipeline = this.pipelineFactory.createRenderPipeline(pipelineProps);
    }
  }

  /** Applies per-draw bindings/vertex state and records a direct draw. */
  draw(renderPass: RenderPass, options: RenderKernelDrawOptions): boolean {
    const {bindings = {}, vertexArray, ...drawOptions} = options;
    this._setPipeline(renderPass, bindings, vertexArray);
    return renderPass.draw(drawOptions);
  }

  /** Applies per-draw state and records a non-indexed indirect draw. */
  drawIndirect(renderPass: RenderPass, options: RenderKernelIndirectDrawOptions): void {
    const {bindings = {}, vertexArray, indirectBuffer, indirectOffset = 0} = options;
    this._setPipeline(renderPass, bindings, vertexArray);
    renderPass.drawIndirect(indirectBuffer, indirectOffset);
  }

  /** Applies per-draw state and records an indexed indirect draw. */
  drawIndexedIndirect(renderPass: RenderPass, options: RenderKernelIndirectDrawOptions): void {
    const {bindings = {}, vertexArray, indirectBuffer, indirectOffset = 0} = options;
    this._setPipeline(renderPass, bindings, vertexArray);
    renderPass.drawIndexedIndirect(indirectBuffer, indirectOffset);
  }

  destroy(): void {
    if (this._destroyed) return;
    if (this.pipeline) this.pipelineFactory.release(this.pipeline);
    this.shaderFactory.release(this.vertexShader);
    if (this.fragmentShader) this.shaderFactory.release(this.fragmentShader);
    this._destroyed = true;
  }

  private _setPipeline(
    renderPass: RenderPass,
    bindings: Record<string, Binding>,
    vertexArray: VertexArray
  ): void {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindings(bindings);
    renderPass.setVertexArray(vertexArray);
  }
}
