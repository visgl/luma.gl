// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Device, Framebuffer, Texture} from '@luma.gl/core';
import type {CompositeShaderPass, ShaderModule} from '@luma.gl/shaders';
import {
  ShaderPassRenderer,
  type ShaderPassRendererProps,
  type ShaderPassRendererRenderOptions
} from './shader-pass-renderer';

/**
 * A fullscreen draw in an effect. The shader supplies the filtering or sampling
 * implementation. Inputs route textures to its bindings and output selects the
 * destination. Uniform values here provide defaults for this draw.
 */
export type EffectPass<TargetName extends string = string> =
  | (CompositeShaderPass<TargetName>['steps'][number] & {kind: 'fullscreen'})
  | (Omit<CompositeShaderPass<TargetName>['steps'][number], 'shaderPass'> & {
      kind: 'filter' | 'sample';
      module: ShaderModule;
    });

/**
 * A reusable, device-independent description of a fullscreen effect.
 *
 * An effect receives the preceding color image and can sample additional textures
 * supplied for the frame. Passes write either private named targets or the shared
 * color chain. Each use of a definition gets its own render targets and history.
 *
 * Use `EffectDefinition<'targetA' | 'targetB'>` to check local target
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
  resources?: NonNullable<CompositeShaderPass<TargetName>['renderTargets']>;

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

/**
 * A reusable effect whose resource descriptors or pass sequence depend on options.
 * Configure it when constructing the stack or when topology changes. Per-frame
 * uniforms and external textures are supplied to the renderer separately.
 */
export type ConfigurableEffectDefinition<Options, TargetName extends string = string> =
  | {
      /** Name of the effect being configured. */
      name: string;

      /** Returns resources and passes for one configuration. */
      configure(options?: Options): EffectDefinition<TargetName>;
    }
  | (EffectDefinition<TargetName> & {
      optionDefaults: Required<Options>;
      /** A numeric option used for both dimensions of the listed render targets. */
      scaleResources?: {option: Extract<keyof Options, string>; targets: readonly TargetName[]};
      /** Choose a pass sequence using the value of a declared option. */
      passVariants?: {
        option: Extract<keyof Options, string>;
        values: Record<string, readonly EffectPass<TargetName>[]>;
      };
    });

/** Resolves a configurable effect for use in an EffectRenderer chain. */
export function configureEffect<Options, TargetName extends string>(
  effect: ConfigurableEffectDefinition<Options, TargetName>,
  options?: NoInfer<Options>
): EffectDefinition<TargetName> {
  if ('configure' in effect) return effect.configure(options);
  const {scaleResources, passVariants, optionDefaults} = effect;
  const resources = {...effect.resources} as NonNullable<EffectDefinition<TargetName>['resources']>;
  if (scaleResources) {
    const scale = options?.[scaleResources.option] ?? optionDefaults[scaleResources.option];
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0) {
      throw new Error(effect.name + ': resource scale must be a finite positive number');
    }
    for (const name of scaleResources.targets) {
      resources[name] = {...resources[name], scale: [scale, scale]};
    }
  }
  const variant =
    passVariants && String(options?.[passVariants.option] ?? optionDefaults[passVariants.option]);
  const passes =
    variant && passVariants && Object.hasOwn(passVariants.values, variant)
      ? [...passVariants.values[variant]]
      : effect.passes;
  return {...effect, resources, passes};
}

/** @internal Lowers an effect definition to the fullscreen renderer's execution format. */
export function resolveEffect<TargetName extends string>(
  effect: EffectDefinition<TargetName>
): CompositeShaderPass<TargetName> {
  return {
    name: effect.name,
    renderTargets: effect.resources,
    initialPasses: effect.initialPasses && {
      ...effect.initialPasses,
      fragment: effect.initialPasses.fragment.map(lowerEffectPass)
    },
    steps: effect.passes.map(lowerEffectPass)
  };
}

function lowerEffectPass<TargetName extends string>(
  pass: EffectPass<TargetName>
): CompositeShaderPass<TargetName>['steps'][number] {
  if (pass.kind === 'fullscreen') return pass;
  const {kind, module, ...routing} = pass;
  return {...routing, shaderPass: {...module, passes: [{action: kind}]}};
}

export type EffectRendererProps<Options extends readonly unknown[] = readonly unknown[]> = Omit<
  ShaderPassRendererProps,
  'shaderPasses'
> & {
  /**
   * Effects run in array order, with each color output feeding the next effect.
   * Configure reusable effects inline by supplying their definition and options.
   * Each configuration is checked against the options declared by its effect.
   */
  effects: {
    readonly [Index in keyof Options]:
      | EffectDefinition
      | {
          effect: ConfigurableEffectDefinition<Options[Index]>;
          configuration?: NoInfer<Options[Index]>;
          options?: NoInfer<Options[Index]>;
        }
      | {
          effect: EffectDefinition & {configure?: never; optionDefaults?: never};
          options?: never;
          configuration?: never;
        };
  };
};

/** Inputs and destination for a single effects frame. */
export type EffectRenderOptions = ShaderPassRendererRenderOptions & {
  /** Omit to return the texture, pass null to present, or supply a borrowed framebuffer. */
  target?: Framebuffer | null;
  /** Defaults to the device encoder. The renderer records work without submitting it. */
  commandEncoder?: CommandEncoder;
};

/**
 * Runs a chain of reusable fullscreen effects for a single device.
 *
 * Resize to the desired output size before rendering. Supply scene textures and
 * per-frame uniforms to the render call. Reset history when the camera cuts or
 * scene changes invalidate temporal data, and destroy the renderer when the
 * chain is no longer needed.
 */
export class EffectRenderer<
  Options extends readonly unknown[] = readonly unknown[]
> extends ShaderPassRenderer {
  constructor(device: Device, {effects, ...props}: EffectRendererProps<Options>) {
    super(device, {
      ...props,
      shaderPasses: effects.map(entry => {
        if (!('effect' in entry)) return resolveEffect(entry);
        const {effect} = entry;
        if (('configure' in effect && effect.configure) || 'optionDefaults' in effect) {
          return resolveEffect(
            configureEffect(
              effect as ConfigurableEffectDefinition<Options[number]>,
              entry.options ?? entry.configuration
            )
          );
        }
        return resolveEffect(effect);
      })
    });
  }

  /** Records a frame and returns a borrowed texture, or whether presentation was recorded. */
  render(options: EffectRenderOptions & {target?: undefined}): Texture | null;
  render(options: EffectRenderOptions & {target: Framebuffer | null}): boolean;
  render(options: EffectRenderOptions): Texture | null | boolean;
  render({
    target,
    commandEncoder = this.device.commandEncoder,
    ...frame
  }: EffectRenderOptions): Texture | null | boolean {
    if (target && target.device !== this.device) {
      throw new Error('EffectRenderer target must belong to the renderer device');
    }
    const output = this.encodeToTexture(commandEncoder, frame);
    if (target === undefined) {
      return output;
    }
    if (!output) {
      return false;
    }
    this.drawOutput(commandEncoder, output, target);
    return true;
  }
}
