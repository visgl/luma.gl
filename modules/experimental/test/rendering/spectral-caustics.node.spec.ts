// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WGSLShaderAssembler} from '@luma.gl/shadertools';
import {WgslReflect} from 'wgsl_reflect';
import {
  convertD65XYZToLinearSRGB,
  D65_XYZ_TO_LINEAR_SRGB_MATRIX,
  spectralCaustics
} from '../../src/rendering/spectral-caustics';

const PLATFORM_INFO = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

const RECEIVER_SHADER = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.worldPosition = vec3<f32>(positions[vertexIndex].x, 0.0, positions[vertexIndex].y);
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let xyz = spectralCaustics_getXYZ(input.worldPosition);
  let linearSRGB = spectralCaustics_getLinearSRGB(input.worldPosition);
  return vec4<f32>(linearSRGB + xyz * 0.0, 1.0);
}
`;

function closeTo(actual: number, expected: number, tolerance = 1e-10): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

test('spectral caustics use the W3C D65 XYZ-to-linear-sRGB matrix', testCase => {
  testCase.deepEqual(
    D65_XYZ_TO_LINEAR_SRGB_MATRIX,
    [
      3.2409699419045226, -1.537383177570094, -0.4986107602930034, -0.9692436362808796,
      1.8759675015077202, 0.04155505740717559, 0.05563007969699366, -0.20397695888897652,
      1.0569715142428786
    ],
    'the CPU helper and WGSL use the W3C row-major conversion coefficients'
  );

  const white = convertD65XYZToLinearSRGB([0.9504559270516716, 1, 1.0890577507598784]);
  testCase.ok(closeTo(white[0], 1), 'D65 white maps to linear-sRGB red one');
  testCase.ok(closeTo(white[1], 1), 'D65 white maps to linear-sRGB green one');
  testCase.ok(closeTo(white[2], 1), 'D65 white maps to linear-sRGB blue one');
  testCase.end();
});

test('spectral caustics clamp only negative final RGB and preserve HDR', testCase => {
  const linearSRGB = convertD65XYZToLinearSRGB([0, 1, 0]);
  testCase.deepEqual(
    linearSRGB,
    [0, 1.8759675015077202, 0],
    'negative final red and blue are clamped while green remains above one'
  );
  testCase.ok(linearSRGB[1] > 1, 'the conversion does not clamp positive HDR radiance');
  testCase.match(
    spectralCaustics.source,
    /return max\(linearSRGB, vec3<f32>\(0\.0\)\);/,
    'WGSL clamps only the converted RGB result'
  );
  testCase.notOk(/clamp\(linearSRGB/.test(spectralCaustics.source), 'WGSL has no upper RGB clamp');
  testCase.end();
});

test('spectral caustics assemble as a planar XYZ receiver module', testCase => {
  const assembledShader = new WGSLShaderAssembler().assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: RECEIVER_SHADER,
    modules: [spectralCaustics]
  });
  const reflection = new WgslReflect(assembledShader.source);

  testCase.equal(spectralCaustics.name, 'spectralCaustics', 'the module has a stable name');
  testCase.match(
    assembledShader.source,
    /fn spectralCaustics_getXYZ\(/,
    'the assembled module exposes unconverted XYZ sampling'
  );
  testCase.match(
    assembledShader.source,
    /fn spectralCaustics_getLinearSRGB\(/,
    'the assembled module exposes receiver-boundary linear-sRGB conversion'
  );
  testCase.ok(
    reflection.textures.some(texture => texture.name === 'spectralCausticsMap'),
    'the accumulated XYZ map is a reflected texture binding'
  );
  testCase.ok(
    reflection.samplers.some(sampler => sampler.name === 'spectralCausticsMapSampler'),
    'the accumulated XYZ map has a reflected filtering sampler'
  );
  testCase.ok(
    reflection.uniforms.some(uniform => uniform.name === 'spectralCaustics'),
    'the planar receiver basis is a reflected uniform block'
  );
  testCase.end();
});
