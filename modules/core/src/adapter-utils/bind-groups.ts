// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BindingDeclaration,
  Bindings,
  BindingsByGroup,
  ComputeShaderLayout,
  ShaderLayout
} from '../adapter/types/shader-layout';
import {log} from '../utils/log';

type AnyShaderLayout = Pick<ShaderLayout | ComputeShaderLayout, 'bindings'>;

export function getShaderLayoutBinding(
  shaderLayout: AnyShaderLayout,
  bindingName: string,
  options?: {ignoreWarnings?: boolean}
): BindingDeclaration | null {
  const bindingLayout = shaderLayout.bindings.find(
    binding =>
      binding.name === bindingName ||
      `${binding.name.toLocaleLowerCase()}uniforms` === bindingName.toLocaleLowerCase()
  );

  if (!bindingLayout && !options?.ignoreWarnings) {
    log.warn(`Binding ${bindingName} not set: Not found in shader layout.`)();
  }

  return bindingLayout || null;
}

export function normalizeBindingsByGroup(
  shaderLayout: AnyShaderLayout,
  bindingsOrBindGroups?: Bindings | BindingsByGroup
): BindingsByGroup {
  if (!bindingsOrBindGroups) {
    return {};
  }

  if (areBindingsGrouped(bindingsOrBindGroups)) {
    const bindGroups = bindingsOrBindGroups as BindingsByGroup;
    return Object.fromEntries(
      Object.entries(bindGroups).map(([group, bindings]) => [Number(group), {...bindings}])
    ) as BindingsByGroup;
  }

  const bindGroups: BindingsByGroup = {};
  for (const [bindingName, binding] of Object.entries(bindingsOrBindGroups as Bindings)) {
    const bindingLayout = getShaderLayoutBinding(shaderLayout, bindingName);
    const group = bindingLayout?.group ?? 0;
    bindGroups[group] ||= {};
    bindGroups[group][bindingName] = binding;
  }

  return bindGroups;
}

export function flattenBindingsByGroup(bindGroups: BindingsByGroup): Bindings {
  const bindings: Bindings = {};
  for (const groupBindings of Object.values(bindGroups)) {
    Object.assign(bindings, groupBindings);
  }
  return bindings;
}

function areBindingsGrouped(bindingsOrBindGroups: Bindings | BindingsByGroup): boolean {
  const keys = Object.keys(bindingsOrBindGroups);
  return keys.length > 0 && keys.every(key => /^\d+$/.test(key));
}
