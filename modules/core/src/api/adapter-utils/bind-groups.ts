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

/** Name lookups already resolved for one shader layout's bindings array */
type BindingNameCache = {
  /** `bindings.length` when the cache was started, to notice bindings added or removed later */
  length: number;
  /** Bound name to the binding it resolved to and that binding's position in the array */
  byName: Map<string, {index: number; binding: BindingDeclaration}>;
};

/**
 * Bindings are resolved by name on every draw. Caching the result per bindings array avoids
 * scanning (and lower-casing) every layout binding for every bound name on each draw.
 */
const bindingNameCaches = new WeakMap<readonly BindingDeclaration[], BindingNameCache>();

export function getShaderLayoutBinding(
  shaderLayout: AnyShaderLayout,
  bindingName: string,
  options?: {ignoreWarnings?: boolean}
): BindingDeclaration | null {
  const bindingLayout = findShaderLayoutBinding(shaderLayout.bindings, bindingName);

  if (!bindingLayout && !options?.ignoreWarnings) {
    log.warn(`Binding ${bindingName} not set: Not found in shader layout.`)();
  }

  return bindingLayout || null;
}

/**
 * Returns the first binding whose name is `bindingName`, or whose lower-cased name followed by
 * `uniforms` is the lower-cased `bindingName`. A cached result is only used while the bindings
 * array has the same length and still holds the same binding at the same position; names that
 * match nothing are not cached, so they are always looked up again.
 */
function findShaderLayoutBinding(
  bindings: readonly BindingDeclaration[],
  bindingName: string
): BindingDeclaration | undefined {
  let cache = bindingNameCaches.get(bindings);
  if (!cache || cache.length !== bindings.length) {
    cache = {length: bindings.length, byName: new Map()};
    bindingNameCaches.set(bindings, cache);
  }

  const cached = cache.byName.get(bindingName);
  if (cached && bindings[cached.index] === cached.binding) {
    return cached.binding;
  }

  const lowerCaseName = bindingName.toLowerCase();
  const index = bindings.findIndex(
    binding =>
      binding.name === bindingName || `${binding.name.toLowerCase()}uniforms` === lowerCaseName
  );
  if (index < 0) {
    cache.byName.delete(bindingName);
    return undefined;
  }

  cache.byName.set(bindingName, {index, binding: bindings[index]});
  return bindings[index];
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
