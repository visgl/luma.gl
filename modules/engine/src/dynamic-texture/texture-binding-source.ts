// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration, ComputeShaderLayout, ShaderLayout} from '@luma.gl/core';
import {getShaderLayoutBinding} from '@luma.gl/core';

/** Reflected shader binding declarations that accept texture-like engine sources. */
export type TextureBindingLayout = Extract<
  BindingDeclaration,
  {type: 'texture' | 'external-texture'}
>;

/**
 * Engine-level source that resolves into a concrete core texture binding for one shader slot.
 */
export interface TextureBindingSource {
  /** Stable resource identifier used in loading and debug messages. */
  readonly id: string;
  /** Whether the source can resolve a concrete binding for the current draw. */
  readonly isReady: boolean;
  /** Monotonic binding generation advanced when concrete draw bindings may need recreation. */
  readonly generation: number;
  /** Device timestamp of the most recent source content or binding identity update. */
  readonly updateTimestamp: number;

  /**
   * Resolves this source for one reflected texture binding declaration.
   * @param bindingLayout Reflected `texture` or `external-texture` shader slot.
   * @returns A concrete core binding, or `null` while the source is not ready.
   */
  resolveTextureBinding(bindingLayout: TextureBindingLayout): Binding | null;
}

/**
 * Returns whether a value is an engine source that resolves texture bindings at draw time.
 * @param value Candidate engine binding value.
 * @returns Whether `value` implements {@link TextureBindingSource}.
 */
export function isTextureBindingSource(value: unknown): value is TextureBindingSource {
  return (
    value !== null &&
    typeof value === 'object' &&
    'resolveTextureBinding' in value &&
    typeof value.resolveTextureBinding === 'function'
  );
}

/**
 * Returns whether a shader binding declaration accepts a texture binding source.
 * @param bindingLayout Candidate reflected shader binding declaration.
 * @returns Whether `bindingLayout` is a `texture` or `external-texture` declaration.
 */
export function isTextureBindingLayout(
  bindingLayout: BindingDeclaration | null
): bindingLayout is TextureBindingLayout {
  return bindingLayout?.type === 'texture' || bindingLayout?.type === 'external-texture';
}

/**
 * Looks up the reflected texture binding declaration for one engine binding name.
 *
 * @remarks
 * Models and materials can be asked for bindings before a shader layout has been reflected.
 * In that legacy empty-layout path, `fallbackGroup` synthesizes an ordinary `texture` slot so
 * copied `DynamicTexture` and `VideoTexture` bindings keep their pre-reflection behavior.
 * Native WebGPU `texture_external` resolution still requires the real reflected declaration.
 *
 * @param shaderLayout Reflected shader bindings, or an empty binding list before reflection.
 * @param bindingName Engine binding name to resolve against the shader layout.
 * @param options Texture binding lookup behavior.
 * @param options.fallbackGroup Bind group for the legacy empty-layout ordinary texture fallback.
 * @returns The reflected or synthesized texture binding declaration, or `null` for non-texture slots.
 */
export function getTextureBindingLayout(
  shaderLayout: Pick<ShaderLayout | ComputeShaderLayout, 'bindings'>,
  bindingName: string,
  options?: {fallbackGroup?: number}
): TextureBindingLayout | null {
  const bindingLayout = getShaderLayoutBinding(shaderLayout, bindingName, {
    ignoreWarnings: true
  });
  if (isTextureBindingLayout(bindingLayout)) {
    return bindingLayout;
  }
  return shaderLayout.bindings.length === 0 && options?.fallbackGroup !== undefined
    ? {
        type: 'texture',
        name: bindingName,
        group: options.fallbackGroup,
        location: 0
      }
    : null;
}
