// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {CompositeShaderPass} from '@luma.gl/shaders';
import {ShaderPassRenderer, type ShaderPassRendererProps} from './shader-pass-renderer';

/**
 * A fullscreen draw in an effect. The shader supplies the filtering or sampling
 * implementation. Inputs route textures to its bindings and output selects the
 * destination. Uniform values here provide defaults for this draw.
 */
export type EffectPass<TargetName extends string = string> =
  CompositeShaderPass<TargetName>['steps'][number] & {kind: 'fullscreen'};

/**
 * A reusable, device-independent description of a fullscreen effect.
 *
 * An effect receives the preceding color image and can sample additional textures
 * supplied for the frame. Passes write either private named targets or the shared
 * color chain. Each use of a definition gets its own render targets and history.
 *
 * Use `satisfies EffectDefinition<'targetA' | 'targetB'>` to check local target
 * references when declaring an effect as a module-level constant. Treat the
 * definition as immutable once a renderer uses it.
 *
 * @typeParam TargetName - Names of textures owned by this effect.
 */
export type EffectDefinition<TargetName extends string = string> = {
  /** Label used to identify the effect and its GPU resources in diagnostics. */
  name: string;

  /**
   * Textures owned by each occurrence of this effect. A target's scale is relative
   * to the renderer size. History targets retain their prior frame value and may
   * declare how to initialize it. Use an empty object for an effect that only
   * writes to the shared color chain.
   */
  resources: NonNullable<CompositeShaderPass<TargetName>['renderTargets']>;

  /**
   * Optional backend alternatives for a stage before the shared passes. Both
   * implementations must produce the named textures the shared passes consume.
   * The renderer selects the implementation once when constructed.
   */
  initialPasses?: {
    /**
     * A fused WebGPU dispatch. Declare each storage output by binding name, and
     * mark the corresponding resource with `storage: true`. The first listed
     * output determines dispatch dimensions. The renderer checks device limits
     * and storage-format support and chooses the fragment sequence if needed.
     */
    compute?: NonNullable<CompositeShaderPass<TargetName>['initialPasses']>['compute'];

    /** Portable fullscreen draws in execution order. */
    fragment: EffectPass<TargetName>[];
  };

  /**
   * Shared fullscreen draws in execution order. Use `previous` to read or
   * update the color chain, `original` to read the stack's input image, and a
   * local resource name to route a texture between draws within the effect.
   */
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

/**
 * Runs a chain of reusable fullscreen effects for a single device.
 *
 * Resize to the desired output size before rendering. Supply scene textures and
 * per-frame uniforms to the render call. Reset history when the camera cuts or
 * scene changes invalidate temporal data, and destroy the renderer when the
 * chain is no longer needed.
 */
export class EffectRenderer extends ShaderPassRenderer {
  constructor(device: Device, {effects, ...props}: EffectRendererProps) {
    super(device, {...props, shaderPasses: effects.map(effect => resolveEffect(effect))});
  }
}
