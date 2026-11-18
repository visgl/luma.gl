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

/** A resolved name: the bindings up to and including its match, and their names at the time */
type ResolvedBindingName = {
  bindings: BindingDeclaration[];
  names: string[];
};

/**
 * Bindings are resolved by name on every draw. Caching the result per bindings array avoids
 * scanning (and lower-casing) every layout binding for every bound name on each draw.
 */
const resolvedBindingNames = new WeakMap<
  readonly BindingDeclaration[],
  Map<string, ResolvedBindingName>
>();

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
 * `uniforms` is the lower-cased `bindingName`. The first match can only change when a binding up
 * to and including it is replaced, renamed or removed, so a cached result is used only while
 * those bindings are unchanged. Names that match nothing are not cached.
 */
function findShaderLayoutBinding(
  bindings: readonly BindingDeclaration[],
  bindingName: string
): BindingDeclaration | undefined {
  let resolvedNames = resolvedBindingNames.get(bindings);
  if (!resolvedNames) {
    resolvedNames = new Map();
    resolvedBindingNames.set(bindings, resolvedNames);
  }

  const resolved = resolvedNames.get(bindingName);
  if (resolved && isResolvedBindingNameCurrent(bindings, resolved)) {
    return resolved.bindings[resolved.bindings.length - 1];
  }

  const lowerCaseName = bindingName.toLowerCase();
  const index = bindings.findIndex(
    binding =>
      binding.name === bindingName || `${binding.name.toLowerCase()}uniforms` === lowerCaseName
  );
  if (index < 0) {
    resolvedNames.delete(bindingName);
    return undefined;
  }

  const matchedBindings = bindings.slice(0, index + 1);
  resolvedNames.set(bindingName, {
    bindings: matchedBindings,
    names: matchedBindings.map(binding => binding.name)
  });
  return bindings[index];
}

function isResolvedBindingNameCurrent(
  bindings: readonly BindingDeclaration[],
  resolved: ResolvedBindingName
): boolean {
  for (let i = 0; i < resolved.bindings.length; i++) {
    if (bindings[i] !== resolved.bindings[i] || bindings[i].name !== resolved.names[i]) {
      return false;
    }
  }
  return true;
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
