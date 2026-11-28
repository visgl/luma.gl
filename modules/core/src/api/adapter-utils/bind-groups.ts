// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  BindingDeclaration,
  Bindings,
  BindingsByGroup,
  ComputeShaderLayout,
  ShaderLayout
} from '../adapter/types/shader-layout';
import {log} from '../utils/log';

type AnyShaderLayout = Pick<ShaderLayout | ComputeShaderLayout, 'bindings'>;

const UNIFORMS_SUFFIX = 'uniforms';

export function getShaderLayoutBinding(
  shaderLayout: AnyShaderLayout,
  bindingName: string,
  options?: {ignoreWarnings?: boolean}
): BindingDeclaration | null {
  const lowerCaseName = bindingName.toLowerCase();
  const aliasName = lowerCaseName.endsWith(UNIFORMS_SUFFIX)
    ? lowerCaseName.slice(0, -UNIFORMS_SUFFIX.length)
    : undefined;

  // Check both forms in layout order: an earlier alias can win over a later exact name.
  const bindingLayout = shaderLayout.bindings.find(
    binding =>
      binding.name === bindingName ||
      (aliasName !== undefined && binding.name.toLowerCase() === aliasName)
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
