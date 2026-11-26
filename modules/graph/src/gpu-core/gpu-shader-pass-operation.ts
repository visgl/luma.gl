// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type SamplerProps, type TextureFormatColor} from '@luma.gl/core';
import {gpuGraph, type GPUGraphTextureDescriptor} from './gpu-graph-value';
import type {GPUOperation} from './gpu-operation';
import type {GPUOperationContract} from './gpu-operation-contract';

export type GPUShaderPassOperationProps = {
  id?: string;
  /** WGSL defining fn shade(textureCoordinates: vec2<f32>) -> vec4<f32>. */
  fragmentSource: string;
  /** Shader texture binding names mapped to logical graph texture names. */
  inputs: Readonly<Record<string, string>>;
  /** Explicit, immutable color sampler descriptions, keyed by shader binding name. */
  samplers?: Readonly<Record<string, SamplerProps>>;
  /** Fields of the generated parameters uniform, mapped to graph scalar names. */
  parameters?: Readonly<Record<string, string>>;
  output: string;
  /** Single-sampled 2D color result with an explicit fixed or inherited extent. */
  outputDescriptor: GPUGraphTextureDescriptor<TextureFormatColor>;
};

/** One fullscreen WGSL draw, shared by GPUGraph and WebGPU SimpleGraph. */
export class GPUShaderPassOperation implements GPUOperation {
  readonly type = 'shader-pass';
  readonly id: string;
  readonly fragmentSource: string;
  readonly inputs: Readonly<Record<string, string>>;
  readonly samplers: Readonly<Record<string, Readonly<SamplerProps>>>;
  readonly parameters: Readonly<Record<string, string>>;
  readonly output: string;
  readonly outputDescriptor: GPUGraphTextureDescriptor<TextureFormatColor>;

  constructor(props: GPUShaderPassOperationProps) {
    this.id = props.id ?? `${props.output}-shader-pass`;
    this.fragmentSource = props.fragmentSource;
    this.inputs = Object.freeze({...props.inputs});
    this.parameters = Object.freeze({...props.parameters});
    this.samplers = Object.freeze(
      Object.fromEntries(
        Object.entries(props.samplers ?? {}).map(([name, sampler]) => [
          name,
          Object.freeze({...sampler})
        ])
      )
    );
    this.output = props.output;
    const descriptor = props.outputDescriptor;
    // This operation writes one complete 2D color attachment, without mip generation or MSAA.
    assert(
      descriptor.extent &&
        (descriptor.dimension ?? '2d') === '2d' &&
        (descriptor.mipLevels ?? 1) === 1 &&
        (descriptor.samples ?? 1) === 1
    );
    this.outputDescriptor = gpuGraph.texture({
      ...descriptor,
      dimension: '2d',
      mipLevels: 1,
      samples: 1
    });
    const bindings = [...Object.keys(this.inputs), ...Object.keys(this.samplers)];
    // Binding names are WGSL identifiers; reserve the generated uniform and entry-point names.
    assert(new Set(bindings).size === bindings.length);
    for (const name of [...bindings, ...Object.keys(this.parameters)])
      assert(
        /^[A-Za-z][A-Za-z0-9_]*$/.test(name) &&
          !['parameters', 'shade', 'vertexMain', 'fragmentMain'].includes(name) &&
          !name.startsWith('GraphShaderPass')
      );
    for (const sampler of Object.values(this.samplers))
      assert((sampler.type ?? 'color-sampler') === 'color-sampler');
  }

  get contract(): GPUOperationContract {
    return {
      values: [
        ...Object.values(this.inputs).map(value => ({
          value,
          access: 'read' as const,
          textureUsage: 'sampled' as const
        })),
        ...Object.values(this.parameters).map(value => ({value, access: 'read' as const})),
        {value: this.output, access: 'write', textureUsage: 'render-attachment'}
      ],
      outputs: ({getValue}) => {
        for (const name of Object.values(this.inputs)) {
          const input = getValue(name);
          // Texture views may select one layer of an array, but the logical input is 2D.
          assert(
            input.type === 'texture' &&
              (input.dimension ?? '2d') === '2d' &&
              (input.samples ?? 1) === 1
          );
        }
        for (const name of Object.values(this.parameters)) assert(getValue(name).type === 'scalar');
        return {[this.output]: this.outputDescriptor};
      }
    };
  }
}
