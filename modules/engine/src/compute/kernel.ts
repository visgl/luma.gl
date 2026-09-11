// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, ComputePipelineProps, Shader} from '@luma.gl/core';
import {
  Buffer,
  ComputePass,
  ComputePipeline,
  Device,
  PipelineFactory,
  ShaderFactory
} from '@luma.gl/core';

/** Properties for a lightweight immutable WebGPU compute kernel. */
export type KernelProps = Omit<ComputePipelineProps, 'shader'> & {
  /** WGSL compute shader source. Shader assembly belongs to higher-level APIs. */
  source: string;
  /** Factory used to create/reuse the compute pipeline. */
  pipelineFactory?: PipelineFactory;
  /** Factory used to create/reuse the compute shader. */
  shaderFactory?: ShaderFactory;
  /** Show shader source in browser debugging UI. */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';
};

/** Bindings and workgroup dimensions for one direct dispatch. */
export type KernelDispatchOptions = {
  bindings?: Record<string, Binding>;
  x: number;
  y?: number;
  z?: number;
};

/** Bindings and GPU-written dispatch record for one indirect dispatch. */
export type KernelDispatchIndirectOptions = {
  bindings?: Record<string, Binding>;
  indirectBuffer: Buffer;
  indirectOffset?: number;
};

/**
 * Lightweight executable WebGPU compute program.
 *
 * `Kernel` deliberately does not assemble shadertools modules or own ShaderInputs/uniform state.
 * Higher-level APIs may assemble WGSL before constructing a kernel. Bindings are supplied per
 * dispatch so a kernel remains reusable and does not retain mutable resource binding state.
 */
export class Kernel {
  /** Creates a kernel while allowing the backend to compile its pipeline asynchronously. */
  static async createAsync(device: Device, props: KernelProps): Promise<Kernel> {
    const ownsCompilation = !PipelineFactory.getAsyncCompilation(device);
    const asyncCompilation = ownsCompilation
      ? PipelineFactory.beginAsyncCompilation(device)
      : PipelineFactory.getAsyncCompilation(device)!;
    let kernel: Kernel;
    try {
      kernel = new Kernel(device, props);
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
  readonly source: string;
  readonly pipelineFactory: PipelineFactory;
  readonly shaderFactory: ShaderFactory;

  shader: Shader;
  pipeline!: ComputePipeline;

  private readonly props: KernelProps;
  private _pipelineInitialization?: Promise<ComputePipeline>;
  private _destroyed = false;

  constructor(device: Device, props: KernelProps) {
    if (device.type !== 'webgpu') {
      throw new Error('Kernel is only supported in WebGPU');
    }
    this.device = device;
    this.id = props.id ?? 'kernel';
    this.source = props.source;
    this.props = props;
    this.pipelineFactory =
      props.pipelineFactory ?? PipelineFactory.getDefaultPipelineFactory(device);
    this.shaderFactory = props.shaderFactory ?? ShaderFactory.getDefaultShaderFactory(device);
    this.shader = this.shaderFactory.createShader({
      id: `${this.id}-compute`,
      stage: 'compute',
      source: this.source,
      debugShaders: props.debugShaders
    });

    const pipelineProps: ComputePipelineProps = {...props, shader: this.shader};
    delete (pipelineProps as KernelProps).source;
    delete (pipelineProps as KernelProps).pipelineFactory;
    delete (pipelineProps as KernelProps).shaderFactory;
    delete (pipelineProps as KernelProps).debugShaders;

    const asyncCompilation = PipelineFactory.getAsyncCompilation(device);
    if (asyncCompilation) {
      this._pipelineInitialization = this.pipelineFactory.createComputePipelineAsync(pipelineProps);
      asyncCompilation.push(
        this._pipelineInitialization.then(pipeline => {
          this.pipeline = pipeline;
          return pipeline;
        })
      );
    } else {
      this.pipeline = this.pipelineFactory.createComputePipeline(pipelineProps);
    }
  }

  /** Applies per-dispatch bindings and records a direct compute dispatch. */
  dispatch(computePass: ComputePass, options: KernelDispatchOptions): void {
    this._setPipeline(computePass, options.bindings);
    computePass.dispatch(options.x, options.y, options.z);
  }

  /** Applies per-dispatch bindings and records a GPU-driven indirect compute dispatch. */
  dispatchIndirect(computePass: ComputePass, options: KernelDispatchIndirectOptions): void {
    this._setPipeline(computePass, options.bindings);
    computePass.dispatchIndirect(options.indirectBuffer, options.indirectOffset ?? 0);
  }

  destroy(): void {
    if (this._destroyed) return;
    if (this.pipeline) this.pipelineFactory.release(this.pipeline);
    this.shaderFactory.release(this.shader);
    this._destroyed = true;
  }

  private _setPipeline(computePass: ComputePass, bindings: Record<string, Binding> = {}): void {
    this.pipeline.setBindings(bindings);
    computePass.setPipeline(this.pipeline);
    // ComputePass implementations apply bindings from the selected pipeline internally.
    // @ts-expect-error Internal binding application mirrors Computation/Model behavior.
    computePass.setBindings({});
  }
}
