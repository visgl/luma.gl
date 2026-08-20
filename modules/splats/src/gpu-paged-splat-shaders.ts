// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Spark-compatible RAD opacity and support behavior is adapted from Spark:
// https://github.com/sparkjsdev/spark (MIT, Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.)

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
const GPU_PAGED_SPLAT_SPARSE_PROJECTION_SHADER = replacePagedShaderSource(
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

/** Analytic perspective covariance and compensated filtering preserve Spark RAD appearance. */
export const GPU_PAGED_SPLAT_PROJECTION_SHADER = makeCalibratedPagedProjectionShader(
  GPU_PAGED_SPLAT_SPARSE_PROJECTION_SHADER
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
  if ((graphUniforms.isFloatColor & 4u) != 0u) {
    let projectedColor = projectedRecords[projectedRowIndex].color;
    projectedRecords[projectedRowIndex].color = vec4<f32>(
      pow(max(projectedColor.rgb, vec3<f32>(0.0)), vec3<f32>(2.2)),
      projectedColor.a
    );
  }
  atomicAdd(&drawCommands[1u], 1u);
}
`
);

/** Final gathered records already occupy exact global painter order. */
const GPU_PAGED_SPLAT_ORDERED_RENDER_SHADER = replacePagedShaderSource(
  replacePagedShaderSource(
    GPU_SPLAT_RENDER_SHADER,
    '@group(0) @binding(2) var<storage, read> sortedIds: array<u32>;\n',
    ''
  ),
  '  let projected = projectedRecords[sortedIds[instanceIndex]];',
  '  let projected = projectedRecords[instanceIndex];'
);

/** Spark's nonlinear parent opacity stays opt-in and preserves the existing record layout. */
export const GPU_PAGED_SPLAT_RENDER_SHADER = makeCalibratedPagedRenderShader(
  GPU_PAGED_SPLAT_ORDERED_RENDER_SHADER
);

/** Applies the exact homogeneous-coordinate projection Jacobian without extra source bindings. */
function makeCalibratedPagedProjectionShader(source: string): string {
  let calibratedSource = replacePagedShaderSource(
    source,
    `fn getProjectedScreenPosition(position: vec3<f32>) -> vec2<f32> {
  let clipPosition = graphUniforms.modelViewProjectionMatrix * vec4<f32>(position, 1.0);`,
    `fn getProjectedScreenPosition(clipPosition: vec4<f32>) -> vec2<f32> {`
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    `}

fn getProjectedRotation(quaternion: vec4<f32>)`,
    `}

fn getProjectedScreenAxis(clipCenter: vec4<f32>, worldAxis: vec3<f32>) -> vec2<f32> {
  let clipAxis = graphUniforms.modelViewProjectionMatrix * vec4<f32>(worldAxis, 0.0);
  let inverseClipW = 1.0 / clipCenter.w;
  let normalizedAxis =
    (clipAxis.xy - clipCenter.xy * (clipAxis.w * inverseClipW)) * inverseClipW;
  return vec2<f32>(
    normalizedAxis.x * graphUniforms.viewportSize.x * 0.5,
    -normalizedAxis.y * graphUniforms.viewportSize.y * 0.5
  );
}

fn getProjectedRotation(quaternion: vec4<f32>)`
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    '  if (graphUniforms.isFloatColor != 0u) {',
    '  if ((graphUniforms.isFloatColor & 1u) != 0u) {'
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    `  let color = getProjectedColor(batchRowIndex);
  let alpha = color.a * opacities[batchRowIndex] * graphUniforms.alphaScale;`,
    `  let color = getProjectedColor(batchRowIndex);
  let sourceAlpha = color.a * opacities[batchRowIndex];
  var alpha = sourceAlpha * graphUniforms.alphaScale;
  if ((graphUniforms.isFloatColor & 2u) != 0u && sourceAlpha > 1.0) {
    alpha = min(sourceAlpha * 4.0 - 3.0, 5.0) * graphUniforms.alphaScale;
  }`
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    `  let center = getProjectedScreenPosition(position);
  let rotationMatrix = getProjectedRotation(rotations[batchRowIndex]);
  let delta0 = getProjectedScreenPosition(position + rotationMatrix[0] * scale.x) - center;
  let delta1 = getProjectedScreenPosition(position + rotationMatrix[1] * scale.y) - center;
  let delta2 = getProjectedScreenPosition(position + rotationMatrix[2] * scale.z) - center;
  let kernelVariance = graphUniforms.kernel2DSize * graphUniforms.kernel2DSize;
  let covariance00 = dot(
    vec3<f32>(delta0.x, delta1.x, delta2.x),
    vec3<f32>(delta0.x, delta1.x, delta2.x)
  ) + kernelVariance;
  let covariance01 = dot(
    vec3<f32>(delta0.x, delta1.x, delta2.x),
    vec3<f32>(delta0.y, delta1.y, delta2.y)
  );
  let covariance11 = dot(
    vec3<f32>(delta0.y, delta1.y, delta2.y),
    vec3<f32>(delta0.y, delta1.y, delta2.y)
  ) + kernelVariance;
  let halfTrace =`,
    `  let center = getProjectedScreenPosition(clipCenter);
  let rotationMatrix = getProjectedRotation(rotations[batchRowIndex]);
  let delta0 = getProjectedScreenAxis(clipCenter, rotationMatrix[0] * scale.x);
  let delta1 = getProjectedScreenAxis(clipCenter, rotationMatrix[1] * scale.y);
  let delta2 = getProjectedScreenAxis(clipCenter, rotationMatrix[2] * scale.z);
  let horizontalAxes = vec3<f32>(delta0.x, delta1.x, delta2.x);
  let verticalAxes = vec3<f32>(delta0.y, delta1.y, delta2.y);
  let unfilteredCovariance00 = dot(horizontalAxes, horizontalAxes);
  let unfilteredCovariance11 = dot(verticalAxes, verticalAxes);
  let covariance01 = dot(horizontalAxes, verticalAxes);
  let originalDeterminant = max(
    unfilteredCovariance00 * unfilteredCovariance11 - covariance01 * covariance01,
    0.0
  );
  let kernelVariance = graphUniforms.kernel2DSize * graphUniforms.kernel2DSize;
  let covariance00 = unfilteredCovariance00 + kernelVariance;
  let covariance11 = unfilteredCovariance11 + kernelVariance;
  let filteredDeterminant = max(
    covariance00 * covariance11 - covariance01 * covariance01,
    MINIMUM_PROJECTABLE_W
  );
  alpha *= sqrt(originalDeterminant / filteredDeterminant);
  if (!isFiniteSplatValue(alpha) || alpha < graphUniforms.alphaCutoff) {
    clearProjectedSplat(projectedRowIndex);
    return;
  }
  let halfTrace =`
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    `  let clampScale = min(
    max(graphUniforms.maxScreenSpaceSplatSize, 0.001) / maximumAxisLength,
    1.0
  );`,
    `  let conventionalClampScale = min(
    max(graphUniforms.maxScreenSpaceSplatSize, 0.001) / maximumAxisLength,
    1.0
  );
  let clampScale = select(
    conventionalClampScale,
    1.0,
    (graphUniforms.isFloatColor & 2u) != 0u
  );`
  );
  calibratedSource = replacePagedShaderSource(
    calibratedSource,
    '  let supportScale = graphUniforms.gaussianSupportRadius * graphUniforms.radiusScale * clampScale;',
    `  let adjustedSupportRadius = graphUniforms.gaussianSupportRadius + select(
    0.0,
    0.7 * max(alpha - 1.0, 0.0),
    (graphUniforms.isFloatColor & 2u) != 0u
  );
  let supportScale = adjustedSupportRadius * graphUniforms.radiusScale * clampScale;`
  );
  return replacePagedShaderSource(
    calibratedSource,
    `  let axis0 = firstDirection * firstAxisLength * supportScale;
  let axis1 = secondDirection * secondAxisLength * supportScale;`,
    `  let firstSupportAxisLength = firstAxisLength * supportScale;
  let secondSupportAxisLength = secondAxisLength * supportScale;
  let maximumSupportAxisLength = max(graphUniforms.maxScreenSpaceSplatSize, 0.001);
  let axis0 = firstDirection * select(
    firstSupportAxisLength,
    min(firstSupportAxisLength, maximumSupportAxisLength),
    (graphUniforms.isFloatColor & 2u) != 0u
  );
  let axis1 = secondDirection * select(
    secondSupportAxisLength,
    min(secondSupportAxisLength, maximumSupportAxisLength),
    (graphUniforms.isFloatColor & 2u) != 0u
  );`
  );
}

/** Preserves Spark's finite circular support and nonlinear opaque hierarchy-parent profile. */
function makeCalibratedPagedRenderShader(source: string): string {
  let calibratedSource = replacePagedShaderSource(
    source,
    '  output.gaussianCoordinate = corner * graphUniforms.gaussianSupportRadius;',
    `  let adjustedSupportRadius = graphUniforms.gaussianSupportRadius + select(
    0.0,
    0.7 * max(projected.color.a - 1.0, 0.0),
    (graphUniforms.isFloatColor & 2u) != 0u
  );
  output.gaussianCoordinate = corner * adjustedSupportRadius;`
  );
  return replacePagedShaderSource(
    calibratedSource,
    `  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.color.a * gaussianWeight;`,
    `  let radiusSquared = dot(input.gaussianCoordinate, input.gaussianCoordinate);
  let adjustedSupportRadius = graphUniforms.gaussianSupportRadius + select(
    0.0,
    0.7 * max(input.color.a - 1.0, 0.0),
    (graphUniforms.isFloatColor & 2u) != 0u
  );
  if (radiusSquared > adjustedSupportRadius * adjustedSupportRadius) {
    discard;
  }
  let gaussianWeight = exp(-0.5 * radiusSquared);
  var alpha = input.color.a * gaussianWeight;
  if ((graphUniforms.isFloatColor & 2u) != 0u && input.color.a > 1.0) {
    let opaqueExponent = exp((input.color.a * input.color.a - 1.0) / 2.718281828459045);
    alpha = 1.0 - pow(max(1.0 - gaussianWeight, 0.0), opaqueExponent);
  }`
  );
}

/** Prevent upstream shader edits from silently removing sparse-source projection invariants. */
function replacePagedShaderSource(source: string, search: string, replacement: string): string {
  if (!source.includes(search)) {
    throw new Error('Paged Gaussian shader source no longer matches its shared graph shader');
  }
  return source.replace(search, replacement);
}
