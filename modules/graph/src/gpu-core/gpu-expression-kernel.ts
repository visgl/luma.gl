// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device} from '@luma.gl/core';
import {Kernel} from '../execution/compute/kernel';
import {getGPUExpressionFormat, type GPUExpression} from './gpu-expression-operation';
import {
  GPU_EXPRESSION_SHADER_TYPES,
  GPU_EXPRESSION_CAST_WGSL,
  getGPUExpressionCastWGSL
} from './gpu-expression-cast';
import type {GPUExpressionPlan, GPUExpressionProgram} from './gpu-expression-plan';
import type {GPUOperationLoweringContext} from './gpu-graph-lowering';
import {createGPUComputeCommandNode, addGPUCommandNodes} from './gpu-command-node';
import {getViewBinding, getViewElementOffset} from './graph-data-view-utils';
import {setGPUComputeDispatchWorkgroups} from './gpu-command-dispatch-metadata';

const WORKGROUP_SIZE = 64;

/** One shape-independent shader, reused across invocations and chunks. @internal */
export class GPUExpressionKernel {
  readonly kernel: Kernel;
  private readonly vectorNames: readonly string[];
  private readonly scalarNames: readonly string[];
  private readonly outputIsScalar: boolean;

  constructor(
    device: Device,
    readonly program: GPUExpressionProgram,
    readonly plan: GPUExpressionPlan
  ) {
    this.vectorNames = plan.references.filter(name =>
      program.vectors.some(value => value.id === name)
    );
    this.scalarNames = plan.references.filter(name =>
      program.scalars.some(value => value.id === name)
    );
    this.outputIsScalar = program.scalars.some(value => value.id === plan.operation.output);
    const arenaUsed = this.scalarNames.length > 0 || this.outputIsScalar;
    const metadata = (index: number): string => `metadata[${Math.floor(index / 4)}][${index % 4}]`;
    const emit = (expression: GPUExpression): string => {
      switch (expression.kind) {
        case 'literal':
          return `f32(${Object.is(expression.value, -0) ? '-0.0' : expression.value.toExponential()})`;
        case 'negate':
          return `(-${emit(expression.argument)})`;
        case 'cast':
          return getGPUExpressionCastWGSL(
            emit(expression.argument),
            getGPUExpressionFormat(expression.argument, plan.formats),
            expression.format,
            plan.operation.integerRounding
          );
        case 'call':
          return `${expression.name}(${expression.arguments.map(emit).join(', ')})`;
        case 'binary':
          return `(${emit(expression.left)} ${expression.operator} ${emit(expression.right)})`;
        case 'reference': {
          const index = this.vectorNames.indexOf(expression.name);
          if (index >= 0) return `input${index}[${metadata(index + 2)} + index]`;
          return `bitcast<${GPU_EXPRESSION_SHADER_TYPES[plan.formats.get(expression.name)!]}>(gpuValues[${program.scalars.findIndex(value => value.id === expression.name)}])`;
        }
      }
    };
    const bindings = this.vectorNames.map((_, index) => ({
      name: `input${index}`,
      type: 'read-only-storage' as const,
      group: 0,
      location: index
    }));
    const shaderBindings: import('@luma.gl/core').ShaderLayout['bindings'] = [...bindings];
    const declarations = bindings.map(
      (binding, index) =>
        `@group(0) @binding(${binding.location}) var<storage, read> ${binding.name}: array<${GPU_EXPRESSION_SHADER_TYPES[plan.formats.get(this.vectorNames[index])!]}>;`
    );
    if (!this.outputIsScalar) {
      declarations.push(
        `@group(0) @binding(${shaderBindings.length}) var<storage, read_write> outputValues: array<${GPU_EXPRESSION_SHADER_TYPES[plan.format]}>;`
      );
      shaderBindings.push({
        name: 'outputValues',
        type: 'storage',
        group: 0,
        location: shaderBindings.length
      });
    }
    if (arenaUsed) {
      declarations.push(
        `@group(0) @binding(${shaderBindings.length}) var<storage, ${this.outputIsScalar ? 'read_write' : 'read'}> gpuValues: array<u32>;`
      );
      shaderBindings.push({
        name: 'gpuValues',
        type: this.outputIsScalar ? 'storage' : 'read-only-storage',
        group: 0,
        location: shaderBindings.length
      });
    }
    declarations.push(
      `@group(0) @binding(${shaderBindings.length}) var<uniform> metadata: array<vec4u, ${Math.ceil((this.vectorNames.length + 2) / 4)}>;`
    );
    shaderBindings.push({
      name: 'metadata',
      type: 'uniform',
      group: 0,
      location: shaderBindings.length
    });
    const store = this.outputIsScalar
      ? `gpuValues[${program.scalars.findIndex(value => value.id === plan.operation.output)}] = bitcast<u32>(${emit(plan.expression)});`
      : `outputValues[${metadata(1)} + index] = ${emit(plan.expression)};`;
    this.kernel = new Kernel(device, {
      id: plan.operation.id,
      source: `${declarations.join('\n')}
${GPU_EXPRESSION_CAST_WGSL}
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroup: vec3u, @builtin(num_workgroups) dimensions: vec3u, @builtin(local_invocation_index) localIndex: u32) {
  let index = (workgroup.y * dimensions.x + workgroup.x) * ${WORKGROUP_SIZE}u + localIndex;
  if (index >= ${metadata(0)}) { return; }
  ${store}
}`,
      shaderLayout: {bindings: shaderBindings}
    });
  }

  lower<Parameters>(context: GPUOperationLoweringContext<Parameters>): void {
    const inputVectors = this.vectorNames.map(name =>
      context.resolveVector(this.program.vectors.find(value => value.id === name)!)
    );
    const outputScalar = this.outputIsScalar
      ? context.resolveScalar(
          this.program.scalars.find(value => value.id === this.plan.operation.output)!
        )
      : undefined;
    const outputVector = !this.outputIsScalar
      ? context.resolveVector(
          this.program.vectors.find(value => value.id === this.plan.operation.output)!
        )
      : undefined;
    const arena =
      outputScalar?.arena ??
      (this.scalarNames.length
        ? context.resolveScalar(
            this.program.scalars.find(value => value.id === this.scalarNames[0])!
          ).arena
        : undefined);
    const outputChunks = outputVector?.data ?? [outputScalar!.view];
    const nodes = outputChunks.flatMap((output, chunkIndex) => {
      if (output.length === 0) return [];
      const inputs = inputVectors.map(vector => vector.data[chunkIndex]);
      if (inputs.some(input => !input || input.length !== output.length))
        throw new Error('Expression chunk mismatch');
      const count = Math.ceil(output.length / WORKGROUP_SIZE);
      const limit = context.graph.device.limits.maxComputeWorkgroupsPerDimension;
      const x = Math.min(count, limit);
      const y = Math.ceil(count / x);
      if (y > limit) throw new Error('Expression chunk exceeds dispatch limits');
      const resources = [
        ...inputs.map(buffer => ({buffer, usage: 'storage-read' as const})),
        ...(outputVector ? [{buffer: output, usage: 'storage-write' as const}] : []),
        ...(arena
          ? [
              {
                buffer: arena.buffer,
                usage: this.outputIsScalar
                  ? ('storage-read-write' as const)
                  : ('storage-read' as const)
              }
            ]
          : [])
      ];
      return [
        setGPUComputeDispatchWorkgroups(
          createGPUComputeCommandNode<Parameters>({
            id: `${this.plan.operation.id}-chunk-${chunkIndex}`,
            resources,
            compile: ({device}) => {
              const data = new Uint32Array(Math.ceil((this.vectorNames.length + 2) / 4) * 4);
              data.set([
                output.length,
                getViewElementOffset(output),
                ...inputs.map(getViewElementOffset)
              ]);
              const metadataBuffer = device.createBuffer({data, usage: Buffer.UNIFORM});
              return {
                encode: ({computePass, getBuffer}) => {
                  const bindings: Record<string, Binding> = {metadata: metadataBuffer};
                  inputs.forEach((input, index) => {
                    bindings[`input${index}`] = getViewBinding(input, getBuffer);
                  });
                  if (outputVector) bindings['outputValues'] = getViewBinding(output, getBuffer);
                  if (arena) bindings['gpuValues'] = getBuffer(arena.buffer);
                  this.kernel.dispatch(computePass, {bindings, x, y, z: 1});
                },
                destroy: () => metadataBuffer.destroy()
              };
            }
          }),
          [x, y, 1]
        )
      ];
    });
    addGPUCommandNodes(context.graph, nodes);
    context.recordDecision({
      operationId: this.plan.operation.id,
      operationType: 'expression',
      lowering: 'webgpu-expression',
      reason: 'shape-independent expression shader with execution-time chunk dimensions'
    });
  }

  destroy(): void {
    this.kernel.destroy();
  }
}
