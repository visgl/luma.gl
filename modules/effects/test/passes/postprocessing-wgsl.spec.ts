// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {WgslReflect} from 'wgsl_reflect';
import {
  bloom,
  brightnessContrast,
  bulgePinch,
  colorHalftone,
  denoise,
  dotScreen,
  edgeWork,
  fxaa,
  gaussianBlur,
  hexagonalPixelate,
  hueSaturation,
  ink,
  magnify,
  noise,
  sepia,
  swirl,
  tiltShift,
  triangleBlur,
  vibrance,
  vignette,
  zoomBlur
} from '../../src/index';
import {ShaderAssembler} from '../../../shadertools/src/lib/shader-assembler';
import {getFragmentShaderForRenderPass} from '../../../engine/src/passes/get-fragment-shader';

const CLIP_SPACE_VERTEX_SHADER_WGSL = /* wgsl */ `\
struct VertexInputs {
  @location(0) clipSpacePositions: vec2<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) coordinates: vec2<f32>
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) position : vec2<f32>,
  @location(1) coordinate : vec2<f32>,
  @location(2) uv : vec2<f32>
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.Position = vec4(inputs.clipSpacePositions, 0., 1.);
  outputs.position = inputs.clipSpacePositions;
  outputs.coordinate = inputs.coordinates;
  outputs.uv = inputs.texCoords;
  return outputs;
}
`;

const PLATFORM_INFO = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

const SHADER_PASSES = [
  fxaa,
  brightnessContrast,
  denoise,
  hueSaturation,
  noise,
  sepia,
  vibrance,
  vignette,
  bloom,
  gaussianBlur,
  tiltShift,
  triangleBlur,
  zoomBlur,
  colorHalftone,
  dotScreen,
  edgeWork,
  hexagonalPixelate,
  ink,
  magnify,
  bulgePinch,
  swirl
] as const;

const WGSL_COMPILATION_TIMEOUT_MS = 2000;

async function getOptionalWebGPUDevice() {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return null;
  }

  return getWebGPUTestDevice();
}

function getSubPassAction(subPass: Record<string, unknown>): 'filter' | 'sample' {
  return (
    (subPass.action as 'filter' | 'sample') ||
    (subPass.filter ? 'filter' : undefined) ||
    (subPass.sampler ? 'sample' : undefined) ||
    'filter'
  );
}

function getTargetFunctionName(shaderPassName: string, action: 'filter' | 'sample'): string {
  return action === 'filter'
    ? `${shaderPassName}_filterColor_ext`
    : `${shaderPassName}_sampleColor`;
}

function formatCompilationErrors(compilationMessages: {type: string; message: string}[]): string {
  return compilationMessages
    .filter(compilationMessage => compilationMessage.type === 'error')
    .map(compilationMessage => compilationMessage.message)
    .join('\n');
}

async function getCompilationInfoWithTimeout(shader: {
  getCompilationInfo: () => Promise<
    {type: string; message: string}[] | readonly {type: string; message: string}[]
  >;
}): Promise<readonly {type: string; message: string}[]> {
  return await Promise.race([
    shader.getCompilationInfo(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timed out waiting ${WGSL_COMPILATION_TIMEOUT_MS}ms for WebGPU shader compilation info`
            )
          ),
        WGSL_COMPILATION_TIMEOUT_MS
      )
    )
  ]);
}

test('postprocessing WGSL#assemble/compile', async testCase => {
  const shaderAssembler = new ShaderAssembler();
  const webgpuDevice = await getOptionalWebGPUDevice();

  if (!webgpuDevice) {
    testCase.comment('WebGPU unavailable, validating assembled WGSL with WgslReflect only');
  }

  for (const shaderPass of SHADER_PASSES) {
    for (const subPass of shaderPass.passes || []) {
      const action = getSubPassAction(subPass as Record<string, unknown>);
      const fragmentSource = getFragmentShaderForRenderPass({
        shaderPass,
        action,
        shadingLanguage: 'wgsl'
      });
      const assembledSource = shaderAssembler.assembleWGSLShader({
        platformInfo: PLATFORM_INFO,
        source: `${CLIP_SPACE_VERTEX_SHADER_WGSL}\n${fragmentSource}`,
        modules: [shaderPass]
      }).source;
      const targetFunctionName = getTargetFunctionName(shaderPass.name, action);

      testCase.ok(
        assembledSource.includes(`fn ${targetFunctionName}(`),
        `${shaderPass.name} ${action} assembles ${targetFunctionName}`
      );

      let parsedSuccessfully = false;
      try {
        const reflectedShader = new WgslReflect(assembledSource);
        parsedSuccessfully = Boolean(reflectedShader);
        testCase.pass(`${shaderPass.name} ${action} parses as WGSL`);
      } catch (error) {
        testCase.fail(`${shaderPass.name} ${action} WGSL parse failed: ${String(error)}`);
      }

      if (parsedSuccessfully && webgpuDevice) {
        const shader = webgpuDevice.createShader({
          id: `${shaderPass.name}-${action}`,
          source: assembledSource
        });
        try {
          const compilationMessages = await getCompilationInfoWithTimeout(shader);
          const compilationErrors = formatCompilationErrors(compilationMessages);
          testCase.equal(
            compilationErrors,
            '',
            `${shaderPass.name} ${action} compiles as WebGPU WGSL${compilationErrors ? `\n${compilationErrors}` : ''}`
          );
        } catch (error) {
          testCase.fail(
            `${shaderPass.name} ${action} WebGPU compilation check failed: ${String(error)}`
          );
        } finally {
          shader.destroy();
        }
      }
    }
  }

  testCase.end();
});
