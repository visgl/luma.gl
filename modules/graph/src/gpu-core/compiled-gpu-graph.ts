// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type CommandEncoder, type Device} from '@luma.gl/core';
import {CPUVector, GPUVector} from '@luma.gl/graph/gpu-data';
import {
  getTextureBindingInfo,
  type GPUGraphTextureBinding,
  type GPUGraphOutputs
} from './gpu-texture-plan';
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
import {GPUCPUOperation} from './gpu-cpu-operation';
import {GPUCPUExecution} from './gpu-cpu-execution';

/** Reusable WebGPU program. Returned output vectors belong to the caller. */
export class CompiledGPUGraph<Outputs extends GPUGraphOutputs = Record<string, GPUVector>> {
  private readonly program: GPUExpressionProgram;
  private readonly compiler: GPUGraphCompiler;
  private readonly kernels = new Map<GPUExpressionOperation, GPUExpressionKernel>();
  private destroyed = false;
  private runningCPU = false;
  private cpuExecution?: GPUCPUExecution;
  private readonly outputLocations: Readonly<Record<string, 'cpu' | 'gpu'>>;

  constructor(
    readonly device: Device,
    source: GPUGraph,
    options: GPUGraphCompileOptions = {},
    lowerings?: readonly GPUOperationLowering[]
  ) {
    if (device.type !== 'webgpu') throw new Error('GPUGraph execution requires WebGPU');
    this.program = new GPUExpressionProgram(source, options);
    this.outputLocations = options.outputLocations ?? {};
    this.compiler = new GPUGraphCompiler(device, [
      ...(lowerings ?? options.lowerings ?? []),
      {
        type: 'expression',
        lower: (operation: GPUExpressionOperation, context) =>
          this.kernels.get(operation)!.lower(context)
      }
    ]);
    if (
      this.program.operations.some(operation => operation instanceof GPUCPUOperation) ||
      Object.values(this.outputLocations).includes('cpu')
    ) {
      this.cpuExecution = new GPUCPUExecution(
        device,
        this.program,
        (source, outputs) =>
          new CompiledGPUGraph(device, source, {outputs}, lowerings ?? options.lowerings)
      );
      return;
    }
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
  ): Promise<Outputs> {
    assert(!this.destroyed && !this.runningCPU);
    const suppliedInputs = 'inputs' in supplied ? supplied.inputs : supplied;
    if (
      !this.cpuExecution &&
      Object.values(suppliedInputs ?? {}).some(value => value instanceof CPUVector)
    )
      this.cpuExecution = new GPUCPUExecution(
        this.device,
        this.program,
        (source, outputs) => new CompiledGPUGraph(this.device, source, {outputs})
      );
    if (this.cpuExecution) {
      const resolved = this.program.resolveBindings(supplied, options);
      // Dynamic CPU outputs are owned by the invocation, not caller-provided targets.
      assert(
        !resolved.options.outputTargets || Object.keys(resolved.options.outputTargets).length === 0
      );
      this.runningCPU = true;
      try {
        return (await this.cpuExecution.run(resolved.bindings, this.outputLocations)) as Outputs;
      } finally {
        this.runningCPU = false;
      }
    }
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
  ): PreparedGPUGraphExecution<Outputs> {
    // A destroyed compiled program cannot encode further work.
    assert(!this.destroyed);
    if (
      this.program.operations.some(operation => operation instanceof GPUCPUOperation) ||
      Object.values(this.outputLocations).includes('cpu')
    )
      throw new Error('CPU operations require asynchronous run(), not prepare()');
    const resolvedBindings = this.program.resolveBindings(supplied, options);
    const bindings = resolvedBindings.bindings;
    options = resolvedBindings.options;
    const invocation = this.program.prepare(this.device, bindings, options, true);
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
        const transient = invocation.transientVectors.get(vector.id);
        if (transient) {
          resolved.addDeclaration(
            vector.id,
            {
              type: 'vector',
              format: vector.format,
              length: transient.length,
              chunkLengths: transient.chunkLengths
            },
            'value'
          );
          continue;
        }
        if (!binding && vector.length === undefined)
          throw new Error(`Missing length or execution binding for ${vector.id}`);
        resolved.vector(vector.id, vector.format, binding?.length ?? vector.length, {
          external: Boolean(binding),
          chunkLengths: binding?.data.map(chunk => chunk.length) ?? vector.chunkLengths
        });
      }
      const textures: Record<string, GPUGraphTextureBinding> = Object.create(null);
      for (const texture of this.program.textures) {
        const binding = invocation.textures!.values.get(texture.id)!;
        const info = getTextureBindingInfo(binding);
        resolved.texture(texture.id, {
          format: info.format,
          dimension: info.dimension,
          width: info.width,
          height: info.height,
          depth: info.depth,
          mipLevels: info.mipLevels,
          samples: info.samples,
          usage: info.texture.props.usage,
          external: true
        });
        textures[texture.id] = binding;
      }
      resolved.add(this.program.operations);
      const compilation = this.compiler.compile(resolved, {vectors, scalars, textures});
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
      return new PreparedGPUGraphExecution<Outputs>(this.device, invocation, executable, () => {
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
    // CPU callbacks may still be awaiting input readback or producing output arrays.
    assert(!this.runningCPU);
    this.cpuExecution?.destroy();
    for (const kernel of this.kernels.values()) kernel.destroy();
    this.kernels.clear();
    this.destroyed = true;
  }
}

/** One bound invocation. Outputs remain caller-owned after destruction. */
export class PreparedGPUGraphExecution<
  Outputs extends GPUGraphOutputs = Record<string, GPUVector>
> {
  readonly outputs: Outputs;
  private encoded = false;
  private destroyed = false;

  /** @internal Use CompiledGPUGraph.prepare(). */
  constructor(
    private readonly device: Device,
    private readonly invocation: GPUExpressionInvocation,
    private readonly executable: CompiledGPUCommandGraph,
    private readonly checkProgram: () => void
  ) {
    this.outputs = invocation.getOutputs<Outputs>();
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
