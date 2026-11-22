// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  Buffer,
  type Binding,
  type CommandEncoder,
  type Device,
  type RenderPass,
  type Sampler,
  type VertexArray
} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {RenderKernel} from '../execution/compute/render-kernel';
import type {GPUShaderPassOperation} from './gpu-shader-pass-operation';
import type {GPUExpressionProgram} from './gpu-expression-plan';
import type {GPUOperationLoweringContext} from './gpu-graph-lowering';
import {getGPUScalarWGSLType} from './gpu-scalar';
import {getTextureBindingInfo, type GPUGraphTextureBinding} from './gpu-texture-plan';

const VERTEX_SOURCE = `
struct GraphShaderPassVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) textureCoordinates: vec2<f32>
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> GraphShaderPassVertex {
  let position = vec2<f32>(f32((index << 1u) & 2u), f32(index & 2u));
  var result: GraphShaderPassVertex;
  result.position = vec4<f32>(position * 2.0 - 1.0, 0.0, 1.0);
  result.textureCoordinates = vec2<f32>(position.x, 1.0 - position.y);
  return result;
}`;

/** One immutable pipeline; resources and uniforms are supplied independently for each draw. @internal */
export class GPUShaderPassKernel {
  private kernel!: RenderKernel;
  private vertexArray!: VertexArray;
  private readonly samplers: Record<string, Sampler> = Object.create(null);
  private readonly parameterFormats: readonly ('float32' | 'uint32' | 'sint32')[];
  private readonly parameterByteLength: number;

  constructor(
    readonly device: Device,
    readonly operation: GPUShaderPassOperation,
    program: Pick<GPUExpressionProgram, 'textures' | 'scalars'>
  ) {
    assert(device.type === 'webgpu');
    this.parameterFormats = Object.values(operation.parameters).map(name => {
      const scalar = program.scalars.find(value => value.id === name);
      assert(scalar);
      return scalar.format;
    });
    this.parameterByteLength = Math.ceil(this.parameterFormats.length / 4) * 16;
    // This first shader-pass contract samples filterable float color and writes float color.
    for (const name of Object.values(operation.inputs)) {
      const input = program.textures.find(texture => texture.id === name)!;
      const info = device.getTextureFormatInfo(input.format);
      assert(
        !info.integer &&
          info.attachment !== 'depth' &&
          info.attachment !== 'depth-stencil' &&
          device.getTextureFormatCapabilities(input.format).filter
      );
    }
    const outputInfo = device.getTextureFormatInfo(operation.outputDescriptor.format);
    assert(
      !outputInfo.integer &&
        device.getTextureFormatCapabilities(operation.outputDescriptor.format).render
    );
    const shaderBindings: import('@luma.gl/core').ShaderLayout['bindings'] = [
      ...Object.keys(operation.inputs).map((name, location) => ({
        name,
        location,
        group: 0,
        type: 'texture' as const,
        viewDimension: '2d' as const,
        sampleType: 'float' as const
      })),
      ...Object.keys(operation.samplers).map((name, index) => ({
        name,
        location: Object.keys(operation.inputs).length + index,
        group: 0,
        type: 'sampler' as const
      }))
    ];
    let binding = 0;
    const declarations = [
      ...Object.keys(operation.inputs).map(
        name => `@group(0) @binding(${binding++}) var ${name}: texture_2d<f32>;`
      ),
      ...Object.keys(operation.samplers).map(
        name => `@group(0) @binding(${binding++}) var ${name}: sampler;`
      )
    ];
    if (this.parameterFormats.length) {
      shaderBindings.push({name: 'parameters', location: binding, group: 0, type: 'uniform'});
      declarations.push(
        `struct GraphShaderPassParameters {${Object.keys(operation.parameters)
          .map((name, index) => `${name}: ${getGPUScalarWGSLType(this.parameterFormats[index])}`)
          .join(
            ','
          )}};\n@group(0) @binding(${binding}) var<uniform> parameters: GraphShaderPassParameters;`
      );
    }
    try {
      this.kernel = new RenderKernel(device, {
        id: operation.id,
        vertexSource: VERTEX_SOURCE,
        fragmentSource: `${declarations.join('\n')}\n${operation.fragmentSource}\n
@fragment fn fragmentMain(@location(0) textureCoordinates: vec2<f32>) -> @location(0) vec4<f32> {
  return shade(textureCoordinates);
}`,
        vertexEntryPoint: 'vertexMain',
        fragmentEntryPoint: 'fragmentMain',
        topology: 'triangle-list',
        shaderLayout: {attributes: [], bindings: shaderBindings},
        colorAttachmentFormats: [operation.outputDescriptor.format],
        parameters: {depthWriteEnabled: false}
      });
      this.vertexArray = device.createVertexArray({
        shaderLayout: this.kernel.pipeline.shaderLayout,
        bufferLayout: []
      });
      for (const [name, props] of Object.entries(operation.samplers))
        this.samplers[name] = device.createSampler(props);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  /** Validate selected view geometry before either executor records commands. */
  validateTextures(textures: ReadonlyMap<string, GPUGraphTextureBinding>): void {
    for (const name of [...Object.values(this.operation.inputs), this.operation.output]) {
      const binding = textures.get(name);
      assert(binding);
      const info = getTextureBindingInfo(binding);
      assert(
        info.texture.device === this.device &&
          info.dimension === '2d' &&
          info.depth === 1 &&
          info.samples === 1
      );
      if (name === this.operation.output) assert(info.mipLevels === 1);
    }
  }

  /** Full graph lowers to ordinary resource-tracked copy and render nodes. */
  lower<Parameters>(context: GPUOperationLoweringContext<Parameters>): void {
    const operation = this.operation;
    const inputs = Object.fromEntries(
      Object.entries(operation.inputs).map(([name, value]) => [
        name,
        context.resolveTextureView(value)
      ])
    );
    const output = context.resolveTextureView(operation.output);
    const parameters = this.parameterFormats.length
      ? context.graph.createTransientBuffer({
          id: context.graph.getUniqueResourceId(`${operation.id}-parameters`),
          byteLength: this.parameterByteLength,
          usage: Buffer.UNIFORM | Buffer.COPY_DST
        })
      : undefined;
    if (parameters) {
      const sources = Object.values(operation.parameters).map(
        name => context.resolveScalar(name).view
      );
      context.graph.addCopyPass({
        id: `${operation.id}-parameters`,
        resources: [
          ...sources.map(buffer => ({buffer, usage: 'copy-source' as const})),
          {buffer: parameters, usage: 'copy-destination'}
        ],
        compile: () => ({
          encode: ({commandEncoder, getBuffer}) => {
            sources.forEach((source, index) =>
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: getBuffer(source),
                sourceOffset: source.byteOffset,
                destinationBuffer: getBuffer(parameters),
                destinationOffset: index * 4,
                size: 4
              })
            );
          }
        })
      });
    }
    context.graph.addRenderPass({
      id: operation.id,
      resources: [
        ...Object.values(inputs).map(texture => ({texture, usage: 'sampled' as const})),
        ...(parameters ? [{buffer: parameters, usage: 'uniform' as const}] : [])
      ],
      attachments: {colorAttachments: [output]},
      compile: () => ({
        getRenderPassProps: () => ({clearColor: [0, 0, 0, 0], clearDepth: false}),
        encode: ({renderPass, getTextureView, getBuffer}) =>
          this.draw(
            renderPass,
            Object.fromEntries(
              Object.entries(inputs).map(([name, view]) => [name, getTextureView(view)])
            ),
            parameters ? getBuffer(parameters) : undefined
          )
      })
    });
  }

  /** SimpleGraph owns only per-invocation framebuffer/uniform wrappers, never bound textures. */
  prepare(
    textures: ReadonlyMap<string, GPUGraphTextureBinding>,
    values: ReadonlyMap<string, GPUVector | number>
  ) {
    this.validateTextures(textures);
    const inputs = Object.fromEntries(
      Object.entries(this.operation.inputs).map(([name, value]) => [name, textures.get(value)!])
    );
    const output = textures.get(this.operation.output)!;
    const info = getTextureBindingInfo(output);
    const data = new Uint8Array(this.parameterByteLength);
    const view = new DataView(data.buffer);
    const parameterValues = Object.values(this.operation.parameters).map((name, index) => {
      const value = values.get(name);
      assert(value !== undefined);
      if (typeof value === 'number') {
        switch (this.parameterFormats[index]) {
          case 'float32':
            view.setFloat32(index * 4, value, true);
            break;
          case 'sint32':
            view.setInt32(index * 4, value, true);
            break;
          case 'uint32':
            view.setUint32(index * 4, value, true);
            break;
        }
      } else assert(value.length === 1 && value.data.length === 1);
      return value;
    });
    const parameters = data.byteLength
      ? this.device.createBuffer({data, usage: Buffer.UNIFORM | Buffer.COPY_DST})
      : undefined;
    let framebuffer;
    try {
      framebuffer = this.device.createFramebuffer({
        width: info.width,
        height: info.height,
        colorAttachments: [output]
      });
    } catch (error) {
      parameters?.destroy();
      throw error;
    }
    return {
      encode: (commandEncoder: CommandEncoder) => {
        this.validateTextures(textures);
        if (parameters)
          parameterValues.forEach((value, index) => {
            if (!(value instanceof GPUVector)) return;
            const chunk = value.data[0];
            const buffer = chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: buffer,
              sourceOffset: chunk.byteOffset,
              destinationBuffer: parameters,
              destinationOffset: index * 4,
              size: 4
            });
          });
        const pass = commandEncoder.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 0],
          clearDepth: false
        });
        try {
          this.draw(pass, inputs, parameters);
        } finally {
          pass.end();
        }
      },
      destroy: () => {
        framebuffer.destroy();
        parameters?.destroy();
      }
    };
  }

  destroy(): void {
    for (const sampler of Object.values(this.samplers)) sampler.destroy();
    this.vertexArray?.destroy();
    this.kernel?.destroy();
  }

  private draw(
    renderPass: RenderPass,
    inputs: Record<string, GPUGraphTextureBinding>,
    parameters?: Buffer
  ): void {
    const bindings: Record<string, Binding> = {...inputs, ...this.samplers};
    if (parameters) bindings['parameters'] = parameters;
    this.kernel.draw(renderPass, {vertexArray: this.vertexArray, vertexCount: 3, bindings});
  }
}
