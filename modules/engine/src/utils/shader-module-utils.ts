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
  // @ts-ignore key is intentionally unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const key in obj) {
    return false;
  }
  return true;
}
