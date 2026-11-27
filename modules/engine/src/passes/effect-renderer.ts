// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {CompositeShaderPass} from '@luma.gl/shaders';
import {ShaderPassRenderer, type ShaderPassRendererProps} from './shader-pass-renderer';

type EffectPass<TargetName extends string> =
  CompositeShaderPass<TargetName>['steps'][number] & {kind: 'fullscreen'};

/** Reusable fullscreen effect. The renderer owns the resources for each occurrence. */
export type EffectDefinition<TargetName extends string = string> = {
  name: string;
  resources: NonNullable<CompositeShaderPass<TargetName>['renderTargets']>;
  initialPasses?: {
    compute?: NonNullable<CompositeShaderPass<TargetName>['initialPasses']>['compute'];
    fragment: EffectPass<TargetName>[];
  };
  passes: EffectPass<TargetName>[];
};

/** @internal Lowers an effect definition to the fullscreen renderer's execution format. */
export function resolveEffect<TargetName extends string>(
  effect: EffectDefinition<TargetName>
): CompositeShaderPass<TargetName> {
  return {
    name: effect.name,
    renderTargets: effect.resources,
    initialPasses: effect.initialPasses,
    steps: effect.passes
  };
}

export type EffectRendererProps = Omit<ShaderPassRendererProps, 'shaderPasses'> & {
  /** Effects run in array order, with each color output feeding the next effect. */
  effects: readonly EffectDefinition[];
};

/** Executes a chain of reusable fullscreen effect definitions. */
export class EffectRenderer extends ShaderPassRenderer {
  constructor(device: Device, {effects, ...props}: EffectRendererProps) {
    super(device, {...props, shaderPasses: effects.map(effect => resolveEffect(effect))});
  }
}
