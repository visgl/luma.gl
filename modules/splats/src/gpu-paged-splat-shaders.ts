// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import {
  GPU_SPLAT_FEATURE_SHADER,
  GPU_SPLAT_PROJECTION_SHADER,
  GPU_SPLAT_RENDER_SHADER
} from './gpu-splat-graph-shaders';

/** Sparse source projection retains every original column within eight storage bindings. */
export const GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
    {name: 'scales', type: 'read-only-storage', group: 0, location: 1},
    {name: 'rotations', type: 'read-only-storage', group: 0, location: 2},
    {name: 'colors', type: 'read-only-storage', group: 0, location: 3},
    {name: 'opacities', type: 'read-only-storage', group: 0, location: 4},
    {name: 'projectedRecords', type: 'storage', group: 0, location: 5},
    {name: 'depthKeys', type: 'storage', group: 0, location: 6},
    {name: 'activeRows', type: 'read-only-storage', group: 0, location: 7},
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 8}
  ]
} satisfies ShaderLayout;

/** Sparse SH, semantics, and global visibility also honor the portable eight-buffer limit. */
export const GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
    {name: 'sphericalHarmonics', type: 'read-only-storage', group: 0, location: 1},
    {name: 'semanticIds', type: 'read-only-storage', group: 0, location: 2},
    {name: 'semanticSelections', type: 'read-only-storage', group: 0, location: 3},
    {name: 'projectedRecords', type: 'storage', group: 0, location: 4},
    {name: 'depthKeys', type: 'storage', group: 0, location: 5},
    {name: 'drawCommands', type: 'storage', group: 0, location: 6},
    {name: 'activeRows', type: 'read-only-storage', group: 0, location: 7},
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 8},
    {name: 'featureUniforms', type: 'uniform', group: 0, location: 9}
  ]
} satisfies ShaderLayout;

/** Already gathered global-order segments require one uniform and one projected storage buffer. */
export const GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'projectedRecords', type: 'read-only-storage', group: 0, location: 1}
  ]
} satisfies ShaderLayout;

const PAGED_UNIFORM_FIELDS = `  isFloatColor: u32,
  hasActiveRows: u32,
  sourceRowOffset: u32,
};`;

/** Original Gaussian projection with sparse source rows and a separate global depth domain. */
export const GPU_PAGED_SPLAT_PROJECTION_SHADER = replacePagedShaderSource(
  replacePagedShaderSource(
    replacePagedShaderSource(
      replacePagedShaderSource(
        replacePagedShaderSource(
          replacePagedShaderSource(
            GPU_SPLAT_PROJECTION_SHADER,
            '  isFloatColor: u32,\n};',
            PAGED_UNIFORM_FIELDS
          ),
          '@group(0) @binding(7) var<storage, read_write> drawCommands: array<atomic<u32>>;',
          '@group(0) @binding(7) var<storage, read> activeRows: array<u32>;'
        ),
        '  depthKeys[rowIndex] = INVALID_DEPTH_KEY;',
        '  depthKeys[graphUniforms.batchOffset + rowIndex] = INVALID_DEPTH_KEY;'
      ),
      `  let batchRowIndex = globalInvocationId.x;
  if (batchRowIndex >= graphUniforms.rowCount) {
    return;
  }

  let projectedRowIndex = graphUniforms.batchOffset + batchRowIndex;`,
      `  let projectedRowIndex = globalInvocationId.x;
  if (projectedRowIndex >= graphUniforms.rowCount) {
    return;
  }
  var batchRowIndex = projectedRowIndex + graphUniforms.sourceRowOffset;
  if (graphUniforms.hasActiveRows != 0u) {
    batchRowIndex = activeRows[projectedRowIndex];
  }`
    ),
    '  depthKeys[projectedRowIndex] = MAXIMUM_VALID_DEPTH_KEY - quantizedDepth;',
    '  depthKeys[graphUniforms.batchOffset + projectedRowIndex] = MAXIMUM_VALID_DEPTH_KEY - quantizedDepth;'
  ),
  '  atomicAdd(&drawCommands[1u], 1u);\n',
  ''
);

/** Sparse source feature evaluation publishes the exact globally visible indirect count. */
export const GPU_PAGED_SPLAT_FEATURE_SHADER = replacePagedShaderSource(
  replacePagedShaderSource(
    replacePagedShaderSource(
      replacePagedShaderSource(
        replacePagedShaderSource(
          replacePagedShaderSource(
            GPU_SPLAT_FEATURE_SHADER,
            '  isFloatColor: u32,\n};',
            PAGED_UNIFORM_FIELDS
          ),
          `@group(0) @binding(7) var<uniform> graphUniforms: GraphSplatUniforms;
@group(0) @binding(8) var<uniform> featureUniforms: GraphSplatFeatureUniforms;`,
          `@group(0) @binding(7) var<storage, read> activeRows: array<u32>;
@group(0) @binding(8) var<uniform> graphUniforms: GraphSplatUniforms;
@group(0) @binding(9) var<uniform> featureUniforms: GraphSplatFeatureUniforms;`
        ),
        `  let batchRowIndex = globalInvocationId.x;
  if (batchRowIndex >= graphUniforms.rowCount) {
    return;
  }

  let projectedRowIndex = graphUniforms.batchOffset + batchRowIndex;`,
        `  let projectedRowIndex = globalInvocationId.x;
  if (projectedRowIndex >= graphUniforms.rowCount) {
    return;
  }
  var batchRowIndex = projectedRowIndex + graphUniforms.sourceRowOffset;
  if (graphUniforms.hasActiveRows != 0u) {
    batchRowIndex = activeRows[projectedRowIndex];
  }
  let globalRowIndex = graphUniforms.batchOffset + projectedRowIndex;`
      ),
      '  if (depthKeys[projectedRowIndex] == INVALID_FEATURE_DEPTH_KEY) {',
      '  if (depthKeys[globalRowIndex] == INVALID_FEATURE_DEPTH_KEY) {'
    ),
    `    depthKeys[projectedRowIndex] = INVALID_FEATURE_DEPTH_KEY;
    atomicSub(&drawCommands[1u], 1u);`,
    '    depthKeys[globalRowIndex] = INVALID_FEATURE_DEPTH_KEY;'
  ),
  `      projectedColor.a
    );
  }
}
`,
  `      projectedColor.a
    );
  }
  atomicAdd(&drawCommands[1u], 1u);
}
`
);

/** Final gathered records already occupy exact global painter order. */
export const GPU_PAGED_SPLAT_RENDER_SHADER = replacePagedShaderSource(
  replacePagedShaderSource(
    GPU_SPLAT_RENDER_SHADER,
    '@group(0) @binding(2) var<storage, read> sortedIds: array<u32>;\n',
    ''
  ),
  '  let projected = projectedRecords[sortedIds[instanceIndex]];',
  '  let projected = projectedRecords[instanceIndex];'
);

/** Prevent upstream shader edits from silently removing sparse-source projection invariants. */
function replacePagedShaderSource(source: string, search: string, replacement: string): string {
  if (!source.includes(search)) {
    throw new Error('Paged Gaussian shader source no longer matches its shared graph shader');
  }
  return source.replace(search, replacement);
}
