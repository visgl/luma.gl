// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {GPUCompositeOperation, type GPUOperationLike} from './gpu-operation';
import {GPUShaderPassOperation} from './gpu-shader-pass-operation';

export type GPUEffectProps = {
  id?: string;
  /** Local color input and output ports. Intermediate names remain private to this fragment. */
  input: string;
  output: string;
  /** Local scalar input ports, bound to graph scalar names when linking. */
  parameters?: readonly string[];
  operations: readonly GPUShaderPassOperation[];
};

/** Immutable, device-independent fullscreen effect fragment. */
export class GPUEffect {
  readonly id: string;
  readonly input: string;
  readonly output: string;
  readonly parameters: readonly string[];
  readonly operations: readonly GPUShaderPassOperation[];

  constructor(props: GPUEffectProps) {
    this.id = props.id ?? 'effect';
    this.input = props.input;
    this.output = props.output;
    this.parameters = Object.freeze([...(props.parameters ?? [])]);
    this.operations = Object.freeze(
      props.operations.map(operation => Object.freeze(new GPUShaderPassOperation(operation)))
    );
    const available = new Set([this.input]);
    const parameters = new Set(this.parameters);
    // Local values are single-assignment; reads and size dependencies precede their consumers.
    assert(parameters.size === this.parameters.length && !parameters.has(this.input));
    for (const operation of this.operations) {
      assert(!available.has(operation.output) && !parameters.has(operation.output));
      for (const input of Object.values(operation.inputs)) assert(available.has(input));
      for (const parameter of Object.values(operation.parameters))
        assert(parameters.has(parameter));
      const extent = operation.outputDescriptor.extent!;
      if ('like' in extent) assert(available.has(extent.like));
      available.add(operation.output);
    }
    assert(this.output !== this.input && available.has(this.output));
    const consumed = new Set(this.operations.flatMap(operation => Object.values(operation.inputs)));
    // Only the public output may escape the fragment as an unconsumed result.
    for (const operation of this.operations)
      assert(operation.output === this.output || consumed.has(operation.output));
    Object.freeze(this);
  }
}

export type GPUEffectBinding = {
  effect: GPUEffect;
  /** Local scalar port -> graph scalar input or produced scalar. */
  parameters?: Readonly<Record<string, string>>;
};

export type AppendEffectsOptions = {
  input: string;
  /** Public result name; also scopes this chain's private intermediate names. */
  output: string;
  effects: readonly GPUEffectBinding[];
};

/** Link independent fragments before either graph is compiled. Returns the final logical value. */
export function appendEffects(
  graph: {add(operation: GPUOperationLike): unknown},
  options: AppendEffectsOptions
): string {
  // An empty chain is an identity; callers select the returned name at compilation.
  if (!options.effects.length) return options.input;
  assert(options.input !== options.output);
  const operations: GPUCompositeOperation[] = [];
  let input = options.input;
  for (const [index, binding] of options.effects.entries()) {
    const {effect} = binding;
    const prefix = `${options.output}/effect-${index}`;
    const names = new Map([[effect.input, input]]);
    for (const parameter of effect.parameters) {
      const target =
        binding.parameters && Object.hasOwn(binding.parameters, parameter)
          ? binding.parameters[parameter]
          : undefined;
      assert(typeof target === 'string' && target.length > 0);
      names.set(parameter, target);
    }
    for (const parameter of Object.keys(binding.parameters ?? {}))
      assert(effect.parameters.includes(parameter));
    for (const operation of effect.operations)
      names.set(operation.output, `${prefix}/${operation.output}`);
    if (index === options.effects.length - 1) names.set(effect.output, options.output);
    const resolve = (name: string): string => names.get(name)!;
    const remap = (values: Readonly<Record<string, string>>) =>
      Object.fromEntries(Object.entries(values).map(([key, value]) => [key, resolve(value)]));
    operations.push(
      new GPUCompositeOperation({
        id: `${prefix}/${effect.id}`,
        operations: effect.operations.map(operation => {
          const extent = operation.outputDescriptor.extent!;
          return new GPUShaderPassOperation({
            ...operation,
            inputs: remap(operation.inputs),
            parameters: remap(operation.parameters),
            output: resolve(operation.output),
            outputDescriptor: {
              ...operation.outputDescriptor,
              extent: 'like' in extent ? {...extent, like: resolve(extent.like)} : extent
            }
          });
        })
      })
    );
    input = resolve(effect.output);
  }
  // Add only after every fragment has linked successfully.
  graph.add(new GPUCompositeOperation({id: `${options.output}/effects`, operations}));
  return input;
}
