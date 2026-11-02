// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type CommandEncoder, type Device} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUGraph} from './gpu-graph';
import type {CompiledGPUCommandGraph} from './gpu-command-graph';
import {GPUGraphCompiler} from './gpu-graph-compiler';
import type {GPUOperationLowering} from './gpu-graph-lowering';
import {GPUExpressionOperation} from './gpu-expression-operation';
import {
  GPUExpressionProgram,
  type GPUExpressionInvocation,
  type GPUGraphCompileOptions,
  type GPUGraphRunBindings,
  type GPUGraphExecutionBindings,
  type GPUGraphRunOptions
} from './gpu-expression-plan';
import {GPUExpressionKernel} from './gpu-expression-kernel';

/** Reusable WebGPU program. Returned output vectors belong to the caller. */
export class CompiledGPUGraph {
  private readonly program: GPUExpressionProgram;
  private readonly compiler: GPUGraphCompiler;
  private readonly kernels = new Map<GPUExpressionOperation, GPUExpressionKernel>();
  private destroyed = false;

  constructor(
    readonly device: Device,
    source: GPUGraph,
    options: GPUGraphCompileOptions = {},
    lowerings?: readonly GPUOperationLowering[]
  ) {
    if (device.type !== 'webgpu') throw new Error('GPUGraph execution requires WebGPU');
    if (source.textures.length)
      throw new Error('Reusable expression programs do not yet support texture declarations');
    this.program = new GPUExpressionProgram(source, options);
    this.compiler = new GPUGraphCompiler(device, [
      ...(lowerings ?? options.lowerings ?? []),
      {
        type: 'expression',
        lower: (operation: GPUExpressionOperation, context) =>
          this.kernels.get(operation)!.lower(context)
      }
    ]);
    try {
      for (const plan of this.program.expressions)
        this.kernels.set(plan.operation, new GPUExpressionKernel(device, this.program, plan));
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  async run(
    supplied: GPUGraphRunBindings | GPUGraphExecutionBindings,
    options: GPUGraphRunOptions = {}
  ): Promise<Record<string, GPUVector>> {
    const execution = this.prepare(supplied, options);
    let encoder: CommandEncoder | undefined;
    try {
      encoder = this.device.createCommandEncoder();
      execution.encode(encoder);
      this.device.submit(encoder.finish());
      return execution.outputs;
    } catch (error) {
      execution.discard();
      throw error;
    } finally {
      execution.destroy();
      encoder?.destroy();
    }
  }

  /** Bind one invocation without encoding or submitting commands. */
  prepare(
    supplied: GPUGraphRunBindings | GPUGraphExecutionBindings,
    options: GPUGraphRunOptions = {}
  ): PreparedGPUGraphExecution {
    // A destroyed compiled program cannot encode further work.
    assert(!this.destroyed);
    const resolvedBindings = this.program.resolveBindings(supplied, options);
    const bindings = resolvedBindings.bindings;
    options = resolvedBindings.options;
    const invocation = this.program.prepare(this.device, bindings, options);
    let executable: CompiledGPUCommandGraph | undefined;
    try {
      const resolved = new GPUGraph();
      for (const scalar of this.program.scalars) resolved.scalar(scalar.id, scalar.format);
      const vectors: Record<string, GPUVector> = Object.create(null);
      const scalars: Record<string, number> = Object.create(null);
      for (const [name, value] of invocation.values) {
        if (typeof value === 'number') scalars[name] = value;
        else if (this.program.vectors.some(vector => vector.id === name)) vectors[name] = value;
      }
      for (const [name, value] of Object.entries(bindings)) {
        if (typeof value === 'number') scalars[name] = value;
      }
      for (const vector of this.program.vectors) {
        const binding = vectors[vector.id];
        if (!binding && vector.length === undefined)
          throw new Error(`Missing length or execution binding for ${vector.id}`);
        resolved.vector(vector.id, vector.format, binding?.length ?? vector.length, {
          external: Boolean(binding),
          chunkLengths: binding?.data.map(chunk => chunk.length) ?? vector.chunkLengths
        });
      }
      resolved.add(this.program.operations);
      const compilation = this.compiler.compile(resolved, {vectors, scalars});
      for (const scalar of this.program.scalars) {
        const target = invocation.values.get(scalar.id);
        if (!(target instanceof GPUVector)) continue;
        const source = compilation.scalars.get(scalar.id)!.view;
        const destination = compilation.graph.importGPUVector(`${scalar.id}-result`, target)
          .data[0];
        compilation.graph.addCopyPass({
          id: `${scalar.id}-result-copy`,
          resources: [
            {buffer: source, usage: 'copy-source'},
            {buffer: destination, usage: 'copy-destination'}
          ],
          compile: () => ({
            encode: ({commandEncoder, getBuffer}) =>
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: getBuffer(source),
                sourceOffset: source.byteOffset,
                destinationBuffer: getBuffer(destination),
                destinationOffset: destination.byteOffset,
                size: 4
              })
          })
        });
      }
      executable = compilation.graph.compile();
      return new PreparedGPUGraphExecution(this.device, invocation, executable, () => {
        // Keep the compiled program alive until encoding and submission have completed.
        assert(!this.destroyed);
      });
    } catch (error) {
      executable?.destroy();
      invocation.destroy();
      throw error;
    }
  }

  destroy(): void {
    for (const kernel of this.kernels.values()) kernel.destroy();
    this.kernels.clear();
    this.destroyed = true;
  }
}

/** One bound invocation. Outputs remain caller-owned after destruction. */
export class PreparedGPUGraphExecution {
  readonly outputs: Record<string, GPUVector>;
  private encoded = false;
  private destroyed = false;

  /** @internal Use CompiledGPUGraph.prepare(). */
  constructor(
    private readonly device: Device,
    private readonly invocation: GPUExpressionInvocation,
    private readonly executable: CompiledGPUCommandGraph,
    private readonly checkProgram: () => void
  ) {
    this.outputs = invocation.getOutputs();
  }

  /** Append commands once to a caller-owned encoder; never finish or submit it. */
  encode(commandEncoder: CommandEncoder): void {
    // An execution is single-use, and its encoder must belong to the same device.
    assert(!this.destroyed && !this.encoded && commandEncoder.device === this.device);
    this.checkProgram();
    // A partial encoding cannot be retried. Discard the caller's encoder on failure.
    this.encoded = true;
    this.executable.encode(commandEncoder, {parameters: undefined});
  }

  /** Release scratch after submission, or after abandoning an unsubmitted encoder. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.executable.destroy();
    this.invocation.finish();
  }

  /** @internal run() has no caller to receive allocated outputs when it fails. */
  discard(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.executable.destroy();
    this.invocation.destroy();
  }
}
