// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Variable} from './ast';
import type {ShaderInterface} from './ir';

const SLANG_BUILTINS: Record<string, {wgsl: string; stages: string[]; type: string}> = {
  SV_POSITION: {
    wgsl: 'position',
    stages: ['vertex:out', 'fragment:in'],
    type: 'float4'
  },
  SV_VERTEXID: {wgsl: 'vertex_index', stages: ['vertex:in'], type: 'uint'},
  SV_INSTANCEID: {
    wgsl: 'instance_index',
    stages: ['vertex:in'],
    type: 'uint'
  },
  SV_ISFRONTFACE: {
    wgsl: 'front_facing',
    stages: ['fragment:in'],
    type: 'bool'
  },
  SV_DEPTH: {wgsl: 'frag_depth', stages: ['fragment:out'], type: 'float'},
  SV_DISPATCHTHREADID: {
    wgsl: 'global_invocation_id',
    stages: ['compute:in'],
    type: 'uint3'
  },
  SV_GROUPID: {
    wgsl: 'workgroup_id',
    stages: ['compute:in'],
    type: 'uint3'
  },
  SV_GROUPTHREADID: {
    wgsl: 'local_invocation_id',
    stages: ['compute:in'],
    type: 'uint3'
  },
  SV_GROUPINDEX: {
    wgsl: 'local_invocation_index',
    stages: ['compute:in'],
    type: 'uint'
  }
};

/** Resolve source semantics once, before target interface emission. */
export function lowerSlangInterface(
  variable: Variable,
  stage: string,
  direction: 'in' | 'out',
  locations: ReadonlyMap<string, number>,
  fail: (message: string) => never
): ShaderInterface {
  const semantic = variable.semantic!.toUpperCase();
  const builtin = SLANG_BUILTINS[semantic];
  let location: number | undefined;
  if (builtin) {
    if (!builtin.stages.includes(`${stage}:${direction}`))
      fail(`Invalid ${variable.semantic} for ${stage} ${direction}`);
    if (variable.type.name !== builtin.type) fail(`${variable.semantic} requires ${builtin.type}`);
  } else if (/^SV_TARGET\d*$/.test(semantic)) {
    if (stage !== 'fragment' || direction !== 'out') fail('SV_Target requires fragment output');
    location = Number(semantic.slice(9) || 0);
  } else {
    if (semantic.startsWith('SV_') || stage === 'compute')
      fail(`Unsupported semantic ${variable.semantic}`);
    location = locations.get(semantic)!;
  }
  const modifiers = variable.modifiers;
  return {
    ...(builtin ? {builtin: builtin.wgsl} : {location}),
    interpolation:
      modifiers.includes('nointerpolation') || /^(int|uint)/.test(variable.type.name)
        ? 'flat'
        : modifiers.includes('noperspective')
          ? 'linear'
          : 'perspective',
    sampling: modifiers.includes('centroid')
      ? 'centroid'
      : modifiers.includes('sample')
        ? 'sample'
        : 'center'
  };
}
