// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '../utils/assert';
import type {ShaderHookRegistry} from './shader-hooks';
import {maskWGSLComments} from './wgsl-binding-scan';

type Stage = 'vertex' | 'fragment';
type FunctionRange = {
  name: string;
  start: number;
  end: number;
  nameStart: number;
  bodyStart: number;
  entryStage?: Stage;
  calls: string[];
  stages: Set<Stage>;
};

/** Private emitted names for hooks declared in both render stages. */
export function getWGSLHookNames(
  hooks: ShaderHookRegistry,
  source = ''
): Map<string, Record<Stage, string>> {
  const names = new Map<string, Record<Stage, string>>();
  const usedNames = new Set(maskWGSLComments(source).match(/\b\w+\b/g));
  for (const key of Object.keys(hooks.vertex)) {
    const name = key.slice(3);
    if (hooks.fragment[`fs:${name}`]) {
      names.set(name, {
        vertex: allocateName(`_luma_vertex_hook_${name}`, usedNames),
        fragment: allocateName(`_luma_fragment_hook_${name}`, usedNames)
      });
    }
  }
  return names;
}

/** Resolve public hook calls by stage, specializing helpers shared by both entry points. */
export function resolveWGSLHookNames(
  source: string,
  hooks: ShaderHookRegistry,
  hookNames = getWGSLHookNames(hooks)
): string {
  if (!hookNames.size) return source;

  const masked = maskWGSLComments(source);
  const functions = new Map<string, FunctionRange>();
  const pattern = /((?:@\w+(?:\([^)]*\))?\s*)*)\bfn\s+(\w+)\s*\(/g;
  for (let match = pattern.exec(masked); match; match = pattern.exec(masked)) {
    const bodyStart = masked.indexOf('{', pattern.lastIndex);
    let end = bodyStart + 1;
    let depth = 1;
    for (; end < masked.length && depth; end++) {
      if (masked[end] === '{') depth++;
      if (masked[end] === '}') depth--;
    }
    // Assembly expects syntactically valid WGSL function declarations.
    assert(bodyStart >= 0 && depth === 0);
    const name = match[2];
    const nameStart = match.index + match[0].lastIndexOf(name);
    const calls = Array.from(
      masked.slice(bodyStart + 1, end - 1).matchAll(/\b(\w+)\s*\(/g),
      call => call[1]
    );
    functions.set(name, {
      name,
      start: match.index,
      end,
      nameStart,
      bodyStart,
      calls,
      stages: new Set(),
      entryStage: /@vertex\b/.test(match[1])
        ? 'vertex'
        : /@fragment\b/.test(match[1])
          ? 'fragment'
          : undefined
    });
    pattern.lastIndex = end;
  }

  function visit(name: string, stage: Stage): void {
    const shaderFunction = functions.get(name);
    if (!shaderFunction || shaderFunction.stages.has(stage)) return;
    shaderFunction.stages.add(stage);
    for (const call of shaderFunction.calls) {
      visit(hookNames.get(call)?.[stage] || call, stage);
    }
  }
  for (const shaderFunction of functions.values()) {
    if (shaderFunction.entryStage) visit(shaderFunction.name, shaderFunction.entryStage);
  }
  // Hook bodies also have a known stage, including hooks unused by this application.
  for (const stage of ['vertex', 'fragment'] as const) {
    for (const key of Object.keys(hooks[stage])) {
      const name = key.slice(3);
      visit(hookNames.get(name)?.[stage] || name, stage);
    }
  }

  const affected = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const shaderFunction of functions.values()) {
      if (
        !affected.has(shaderFunction.name) &&
        shaderFunction.calls.some(call => hookNames.has(call) || affected.has(call))
      ) {
        affected.add(shaderFunction.name);
        changed = true;
      }
    }
  }

  const helperNames = new Map<string, Record<Stage, string>>();
  const usedNames = new Set(masked.match(/\b\w+\b/g));
  for (const name of affected) {
    if (functions.get(name)?.stages.size === 2) {
      helperNames.set(name, {
        vertex: allocateName(`_luma_vertex_helper_${name}`, usedNames),
        fragment: allocateName(`_luma_fragment_helper_${name}`, usedNames)
      });
    }
  }

  function getCallName(name: string, stage: Stage): string {
    const hookName = hookNames.get(name)?.[stage];
    if (hookName) return hookName;
    return helperNames.get(name)?.[stage] || name;
  }

  // Replace from the end to preserve offsets in the original, comment-masked source.
  for (const shaderFunction of [...functions.values()].reverse()) {
    if (!affected.has(shaderFunction.name)) continue;
    if (!shaderFunction.stages.size) {
      throw new Error(`Cannot infer WGSL hook stage in ${shaderFunction.name}`);
    }
    const variants: string[] = [];
    const start = shaderFunction.start;
    for (const stage of shaderFunction.stages) {
      let text = source.slice(start, shaderFunction.end);
      const body = masked.slice(shaderFunction.bodyStart + 1, shaderFunction.end - 1);
      const calls = [...body.matchAll(/\b(\w+)\s*\(/g)];
      for (const call of calls.reverse()) {
        const offset = shaderFunction.bodyStart + 1 + call.index! - start;
        const replacement = getCallName(call[1], stage);
        text = text.slice(0, offset) + replacement + text.slice(offset + call[1].length);
      }
      const offset = shaderFunction.nameStart - start;
      text =
        text.slice(0, offset) +
        getCallName(shaderFunction.name, stage) +
        text.slice(offset + shaderFunction.name.length);
      variants.push(text);
    }
    source = source.slice(0, start) + variants.join('\n') + source.slice(shaderFunction.end);
  }
  return source;
}

function allocateName(baseName: string, usedNames: Set<string>): string {
  let name = baseName;
  let suffix = 0;
  while (usedNames.has(name)) name = `${baseName}_${++suffix}`;
  usedNames.add(name);
  return name;
}
