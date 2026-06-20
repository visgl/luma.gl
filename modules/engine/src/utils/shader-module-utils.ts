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
        if (binding && bindingLayout.visibility !== undefined) {
          binding.visibility = bindingLayout.visibility;
        }
      }
    }
  }

  return mergedLayout;
}

export function mergeInferredShaderLayout(
  shaderLayout: ShaderLayout | null | undefined,
  inferredShaderLayout: ShaderLayout | null | undefined,
  inferredAttributeNames: readonly string[] = []
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
      ? mergeAttributeLayouts(
          shaderLayout.attributes,
          inferredShaderLayout.attributes.filter(attribute =>
            inferredAttributeNames.includes(attribute.name)
          )
        )
      : inferredShaderLayout.attributes,
    bindings: mergeBindingLayouts(shaderLayout.bindings, inferredShaderLayout.bindings)
  };
}

export function shaderModuleHasUniforms(module: ShaderModule): boolean {
  return Boolean(module.uniformTypes && !isObjectEmpty(module.uniformTypes));
}

export function mergeShaderModules(
  explicitModules: ShaderModule[] | undefined,
  shaderInputModules: ShaderModule[] | undefined
): ShaderModule[] {
  const modules: ShaderModule[] = [];
  const moduleNames = new Set<string>();

  for (const module of [...(explicitModules || []), ...(shaderInputModules || [])]) {
    if (!moduleNames.has(module.name)) {
      moduleNames.add(module.name);
      modules.push(module);
    }
  }

  return modules;
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

function mergeAttributeLayouts(
  explicitAttributes: ShaderLayout['attributes'],
  inferredAttributes: ShaderLayout['attributes']
): ShaderLayout['attributes'] {
  const mergedAttributes = explicitAttributes.map(attribute => ({...attribute}));
  const explicitAttributesByName = new Map(
    explicitAttributes.map(attribute => [attribute.name, attribute])
  );
  const explicitAttributesByLocation = new Map(
    explicitAttributes.map(attribute => [attribute.location, attribute])
  );

  for (const inferredAttribute of inferredAttributes) {
    const explicitByName = explicitAttributesByName.get(inferredAttribute.name);
    if (explicitByName) {
      if (
        explicitByName.type !== inferredAttribute.type ||
        explicitByName.location !== inferredAttribute.location
      ) {
        throw new Error(
          `Shader attribute "${inferredAttribute.name}" conflicts with its inferred type or location`
        );
      }
      continue;
    }

    const explicitByLocation = explicitAttributesByLocation.get(inferredAttribute.location);
    if (explicitByLocation) {
      throw new Error(
        `Shader attributes "${explicitByLocation.name}" and "${inferredAttribute.name}" both use location ${inferredAttribute.location}`
      );
    }

    mergedAttributes.push({...inferredAttribute});
  }

  return mergedAttributes;
}
