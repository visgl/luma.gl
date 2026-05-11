// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ComputeShaderLayout, ShaderLayout} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

type AnyShaderLayout = ShaderLayout | ComputeShaderLayout;

export function mergeShaderModuleBindingsIntoLayout<TShaderLayout extends AnyShaderLayout>(
  shaderLayout: TShaderLayout | null | undefined,
  modules: ShaderModule[]
): TShaderLayout | null | undefined {
  if (!shaderLayout || !modules.some(module => module.bindingLayout?.length)) {
    return shaderLayout;
  }

  const mergedLayout = {
    ...shaderLayout,
    bindings: shaderLayout.bindings.map(binding => ({...binding}))
  } as TShaderLayout;

  if ('attributes' in (shaderLayout || {})) {
    (mergedLayout as ShaderLayout).attributes = (shaderLayout as ShaderLayout)?.attributes || [];
  }

  for (const module of modules) {
    for (const bindingLayout of module.bindingLayout || []) {
      for (const relatedBindingName of getRelatedBindingNames(bindingLayout.name)) {
        const binding = mergedLayout.bindings.find(
          candidate => candidate.name === relatedBindingName
        );
        if (binding?.group === 0) {
          binding.group = bindingLayout.group;
        }
      }
    }
  }

  return mergedLayout;
}

export function mergeInferredShaderLayout(
  shaderLayout: ShaderLayout | null | undefined,
  inferredShaderLayout: ShaderLayout | null | undefined
): ShaderLayout | null | undefined {
  if (!shaderLayout) {
    return inferredShaderLayout;
  }
  if (!inferredShaderLayout) {
    return shaderLayout;
  }

  return {
    ...shaderLayout,
    attributes: shaderLayout.attributes.length
      ? shaderLayout.attributes
      : inferredShaderLayout.attributes,
    bindings: mergeBindingLayouts(shaderLayout.bindings, inferredShaderLayout.bindings)
  };
}

export function shaderModuleHasUniforms(module: ShaderModule): boolean {
  return Boolean(module.uniformTypes && !isObjectEmpty(module.uniformTypes));
}

/** Returns binding-name aliases that should share the module-declared bind group. */
function getRelatedBindingNames(bindingName: string): string[] {
  const bindingNames = new Set<string>([bindingName, `${bindingName}Uniforms`]);

  if (!bindingName.endsWith('Uniforms')) {
    bindingNames.add(`${bindingName}Sampler`);
  }

  return [...bindingNames];
}

function isObjectEmpty(obj: object): boolean {
  for (const _key in obj) {
    return false;
  }
  return true;
}

function mergeBindingLayouts<TBindingLayout extends ShaderLayout['bindings'][number]>(
  explicitBindings: TBindingLayout[],
  inferredBindings: TBindingLayout[]
): TBindingLayout[] {
  const mergedBindings = explicitBindings.map(binding => ({...binding}));
  const explicitBindingNames = new Set(explicitBindings.map(binding => binding.name));
  const explicitBindingLocations = new Set(
    explicitBindings.map(binding => `${binding.group}:${binding.location}`)
  );

  for (const inferredBinding of inferredBindings) {
    const inferredBindingLocation = `${inferredBinding.group}:${inferredBinding.location}`;
    if (
      !explicitBindingNames.has(inferredBinding.name) &&
      !explicitBindingLocations.has(inferredBindingLocation)
    ) {
      mergedBindings.push({...inferredBinding});
    }
  }

  return mergedBindings;
}
