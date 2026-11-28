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

type EffectOptionKey<Options> = Options extends unknown ? Extract<keyof Options, string> : never;

/** Value accepted by a fullscreen pass uniform. */
type EffectUniform = NonNullable<EffectPass['uniforms']>[string];

/** Reads a construction option directly or through a lookup table. */
type EffectOptionValue<Options, Value = unknown> = {
  option: EffectOptionKey<Options>;
  values?: Readonly<Record<string, Value>>;
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
      optionDefaults: Options;
      /** A numeric option used for both dimensions of the listed render targets. */
      scaleResources?: EffectOptionValue<Options, number> & {
        targets: readonly TargetName[];
        fallback?: EffectOptionValue<Options, number>;
        defaultScale?: number;
        minimum?: number;
        factors?: Partial<Record<TargetName, number>>;
      };
      /** Initialize a history texture’s red channel from a numeric option. */
      historyClearOptions?: Partial<
        Record<TargetName, {option: EffectOptionKey<Options>; minimum?: number}>
      >;
      /** Map options to uniform defaults by shader module and uniform name. */
      optionUniforms?: Record<string, Record<string, EffectOptionValue<Options, EffectUniform>>>;
      /** Map option choices to logical inputs by shader module and binding name. */
      optionInputs?: Record<
        string,
        Record<string, EffectOptionValue<Options, 'previous' | 'original' | TargetName>>
      >;
      /** Select replacement passes and resources using the value of an option. */
      variants?: {
        option: EffectOptionKey<Options>;
        values: Record<
          string,
          Partial<Pick<EffectDefinition<TargetName>, 'name' | 'resources' | 'passes'>>
        >;
      };
    });

/** @internal Resolves construction options into the executable effect. */
export function resolveEffectOptions<Options, TargetName extends string>(
  effect: ConfigurableEffectDefinition<Options, TargetName>,
  options?: NoInfer<Options>
): EffectDefinition<TargetName> {
  if ('configure' in effect) return effect.configure(options);
  const {
    scaleResources,
    variants,
    optionDefaults,
    optionUniforms,
    optionInputs,
    historyClearOptions
  } = effect;
  const overrides = options as Partial<Record<EffectOptionKey<Options>, unknown>> | undefined;
  const defaults = optionDefaults as Partial<Record<EffectOptionKey<Options>, unknown>>;
  const readOption = (key: EffectOptionKey<Options>) => overrides?.[key] ?? defaults[key];
  const readValue = (mapping: EffectOptionValue<Options>) => {
    const option = readOption(mapping.option);
    if (!mapping.values) return option;
    const key = String(option);
    return Object.hasOwn(mapping.values, key) ? mapping.values[key] : undefined;
  };
  const value = variants && String(readOption(variants.option));
  const variant =
    variants && value !== undefined && Object.hasOwn(variants.values, value)
      ? variants.values[value]
      : undefined;
  const resolved = {...effect, ...variant};
  const resources = {...resolved.resources} as NonNullable<
    EffectDefinition<TargetName>['resources']
  >;
  if (scaleResources) {
    const scale =
      readValue(scaleResources) ??
      (scaleResources.fallback && readValue(scaleResources.fallback)) ??
      scaleResources.defaultScale;
    if (
      typeof scale !== 'number' ||
      !Number.isFinite(scale) ||
      (scale <= 0 && !scaleResources.minimum)
    ) {
      throw new Error(effect.name + ': resource scale must be a finite positive number');
    }
    for (const name of scaleResources.targets) {
      const resource = resources[name];
      if (!resource?.scale) continue;
      const factor = scaleResources.factors?.[name] ?? 1;
      const size = Math.max(scale, scaleResources.minimum ?? 0) * factor;
      resources[name] = {...resource, scale: [size, size]};
    }
  }
  for (const name of Object.keys(historyClearOptions ?? {}) as TargetName[]) {
    const mapping = historyClearOptions?.[name];
    const resource = resources[name];
    const initial = resource?.initialize;
    if (!mapping || !initial || initial === 'original') continue;
    const value = readOption(mapping.option);
    if (typeof value === 'number' && Number.isFinite(value)) {
      const [, green, blue, alpha] = initial.clearColor;
      resources[name] = {
        ...resource,
        initialize: {
          clearColor: [Math.max(value, mapping.minimum ?? -Infinity), green, blue, alpha]
        }
      };
    }
  }
  const passes = resolved.passes.map(pass => {
    const moduleName = pass.kind === 'fullscreen' ? pass.shaderPass.name : pass.module.name;
    const uniformOptions = optionUniforms?.[moduleName];
    const inputOptions = optionInputs?.[moduleName];
    if (!uniformOptions && !inputOptions) return pass;
    const uniforms = {...pass.uniforms};
    const inputs = {...pass.inputs};
    for (const [name, mapping] of Object.entries(uniformOptions ?? {})) {
      const value = readValue(mapping) as EffectUniform | undefined;
      if (value !== undefined) uniforms[name] = value;
    }
    for (const [name, mapping] of Object.entries(inputOptions ?? {})) {
      const value = readValue(mapping);
      if (typeof value === 'string') inputs[name] = value as 'previous' | 'original' | TargetName;
    }
    return {...pass, uniforms, ...(inputOptions ? {inputs} : {})};
  });
  return {...resolved, resources, passes};
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

/** Ordered effect definitions and their individually typed construction options. */
export type EffectEntries<Options extends readonly unknown[]> = {
  readonly [Index in keyof Options]:
    | EffectDefinition
    | {
        effect: ConfigurableEffectDefinition<Options[Index]>;
        options?: NoInfer<Options[Index]>;
      }
    | {
        effect: EffectDefinition & {configure?: never; optionDefaults?: never};
        options?: never;
      };
};

export type EffectRendererProps<Options extends readonly unknown[] = readonly unknown[]> = Omit<
  ShaderPassRendererProps,
  'shaderPasses'
> & {
  /**
   * Effects run in array order, with each color output feeding the next effect.
   * Configure reusable effects inline by supplying their definition and options.
   * Each configuration is checked against the options declared by its effect.
   */
  effects: EffectEntries<Options>;
};

/** Inputs and destination for a single effects frame. */
export type EffectRenderOptions = ShaderPassRendererRenderOptions & {
  /** Omit to return the texture, pass null to present, or supply a borrowed framebuffer. */
  target?: Framebuffer | null;
  /** Defaults to the device encoder. The renderer records work without submitting it. */
  commandEncoder?: CommandEncoder;
};

/** @internal Normalizes the public effect entries for either executor. */
export function resolveEffectEntries<Options extends readonly unknown[]>(
  effects: EffectEntries<Options>
): CompositeShaderPass[] {
  return effects.map(entry => {
    if (!('effect' in entry)) return resolveEffect(entry);
    const {effect} = entry;
    if (('configure' in effect && effect.configure) || 'optionDefaults' in effect) {
      return resolveEffect(
        resolveEffectOptions(effect as ConfigurableEffectDefinition<Options[number]>, entry.options)
      );
    }
    return resolveEffect(effect);
  });
}

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
      shaderPasses: resolveEffectEntries(effects)
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
