// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextureFormatColor} from '@luma.gl/core';
import type {CompositeShaderPassComputeOptimization} from '@luma.gl/shadertools';

const BLOOM_COMPUTE_WORKGROUP_SIZE = 16;

type BloomComputePyramidOptions = {
  levelNames: readonly string[];
  colorFormat: TextureFormatColor;
  threshold: number;
  softKnee: number;
  fireflyReduction: number;
  exposure: number;
  exposureCompensation: number;
};

/** Builds a single-dispatch, workgroup-local HDR extraction and downsampling pyramid. */
export function createBloomComputePyramid(
  options: BloomComputePyramidOptions
): CompositeShaderPassComputeOptimization {
  const outputs = Object.fromEntries(
    options.levelNames.map(levelName => [`output${levelName}`, `extract${levelName}`])
  );
  const outputDeclarations = options.levelNames
    .map(
      (levelName, levelIndex) =>
        `@group(0) @binding(${levelIndex + 2}) var output${levelName}: ` +
        `texture_storage_2d<${options.colorFormat}, write>;`
    )
    .join('\n');
  const reductionStages = options.levelNames
    .slice(1)
    .map((levelName, levelIndex) => makeReductionStage(levelName, levelIndex + 1))
    .join('\n');

  return {
    name: 'bloomComputePyramid',
    uniformModule: 'bloomExtract',
    uniformBinding: 'bloomCompute',
    uniformNames: ['threshold', 'softKnee', 'fireflyReduction', 'exposure', 'exposureCompensation'],
    uniforms: {
      threshold: options.threshold,
      softKnee: options.softKnee,
      fireflyReduction: options.fireflyReduction,
      exposure: options.exposure,
      exposureCompensation: options.exposureCompensation
    },
    input: 'previous',
    outputs,
    replacedPasses: ['bloomExtract', 'bloomDownsample'],
    workgroupSize: [BLOOM_COMPUTE_WORKGROUP_SIZE, BLOOM_COMPUTE_WORKGROUP_SIZE],
    source: /* wgsl */ `
struct BloomComputeUniforms {
  threshold: f32,
  softKnee: f32,
  fireflyReduction: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(0) var<uniform> bloomCompute: BloomComputeUniforms;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
${outputDeclarations}

var<workgroup> bloomTile: array<vec4f, ${BLOOM_COMPUTE_WORKGROUP_SIZE ** 2}>;

fn bloomCompute_applyThreshold(sourceColor: vec4f) -> vec4f {
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let exposure = max(bloomCompute.exposure * exp2(bloomCompute.exposureCompensation), 0.0001);
  let threshold = bloomCompute.threshold / exposure;
  let knee = max(threshold * bloomCompute.softKnee, 0.00001);
  let soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - threshold, 0.0);
  let contribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4f(sourceColor.rgb * contribution, sourceColor.a * contribution);
}

fn bloomCompute_extractHighlight(outputCoordinate: vec2u, outputDimensions: vec2u) -> vec4f {
  let sourceDimensions = textureDimensions(sourceTexture);
  let clampedCoordinate = min(outputCoordinate, outputDimensions - vec2u(1));
  let sourceCenter =
    (vec2f(clampedCoordinate) + vec2f(0.5)) * vec2f(sourceDimensions) /
      vec2f(outputDimensions) - vec2f(0.5);
  let filterRadius = max(vec2f(sourceDimensions) / vec2f(outputDimensions), vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  let maximumSourceCoordinate = vec2i(sourceDimensions) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let sourceColor = textureLoad(
        sourceTexture,
        clamp(vec2i(sourceX, sourceY), vec2i(0), maximumSourceCoordinate),
        0
      );
      let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
      let fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomCompute.fireflyReduction, 0.0, 1.0)
      );
      let weight = weightX * weightY * fireflyWeight;
      color += bloomCompute_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}

@compute @workgroup_size(${BLOOM_COMPUTE_WORKGROUP_SIZE}, ${BLOOM_COMPUTE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalInvocation: vec3u,
  @builtin(local_invocation_id) localInvocation: vec3u,
  @builtin(workgroup_id) workgroupCoordinate: vec3u
) {
  let localCoordinate = localInvocation.xy;
  let localIndex = localCoordinate.y * ${BLOOM_COMPUTE_WORKGROUP_SIZE}u + localCoordinate.x;
  let halfDimensions = textureDimensions(outputHalf);
  let halfCoordinate = globalInvocation.xy;
  let extractedColor = bloomCompute_extractHighlight(halfCoordinate, halfDimensions);
  bloomTile[localIndex] = extractedColor;
  if (all(halfCoordinate < halfDimensions)) {
    textureStore(outputHalf, vec2i(halfCoordinate), extractedColor);
  }
  workgroupBarrier();
${reductionStages}
}
`
  };
}

function makeReductionStage(levelName: string, levelIndex: number): string {
  const tileWidth = BLOOM_COMPUTE_WORKGROUP_SIZE / 2 ** levelIndex;
  const stageName = levelName.toLowerCase();
  return /* wgsl */ `
  var ${stageName}Color = vec4f(0.0);
  if (localCoordinate.x < ${tileWidth}u && localCoordinate.y < ${tileWidth}u) {
    let sourceCoordinate = localCoordinate * 2u;
    let sourceIndex = sourceCoordinate.y * ${BLOOM_COMPUTE_WORKGROUP_SIZE}u + sourceCoordinate.x;
    ${stageName}Color = (
      bloomTile[sourceIndex] +
      bloomTile[sourceIndex + 1u] +
      bloomTile[sourceIndex + ${BLOOM_COMPUTE_WORKGROUP_SIZE}u] +
      bloomTile[sourceIndex + ${BLOOM_COMPUTE_WORKGROUP_SIZE + 1}u]
    ) * 0.25;
  }
  workgroupBarrier();
  if (localCoordinate.x < ${tileWidth}u && localCoordinate.y < ${tileWidth}u) {
    bloomTile[localIndex] = ${stageName}Color;
    let ${stageName}Coordinate = workgroupCoordinate.xy * ${tileWidth}u + localCoordinate;
    if (all(${stageName}Coordinate < textureDimensions(output${levelName}))) {
      textureStore(output${levelName}, vec2i(${stageName}Coordinate), ${stageName}Color);
    }
  }
  workgroupBarrier();`;
}
