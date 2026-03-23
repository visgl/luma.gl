// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {BufferTransform} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';

const projectLayoutRegressionModule: ShaderModule = {
  name: 'project',
  // Mirrors deck.gl master:
  // modules/core/src/shaderlib/project/project.ts
  // modules/core/src/shaderlib/project/project.glsl.ts
  uniformTypes: {
    wrapLongitude: 'f32',
    coordinateSystem: 'i32',
    commonUnitsPerMeter: 'vec3<f32>',
    projectionMode: 'i32',
    scale: 'f32',
    commonUnitsPerWorldUnit: 'vec3<f32>',
    commonUnitsPerWorldUnit2: 'vec3<f32>',
    center: 'vec4<f32>',
    modelMatrix: 'mat4x4<f32>',
    viewProjectionMatrix: 'mat4x4<f32>',
    viewportSize: 'vec2<f32>',
    devicePixelRatio: 'f32',
    focalDistance: 'f32',
    cameraPosition: 'vec3<f32>',
    coordinateOrigin: 'vec3<f32>',
    commonOrigin: 'vec3<f32>',
    pseudoMeters: 'f32'
  },
  vs: `\
layout(std140) uniform projectUniforms {
  bool wrapLongitude;
  int coordinateSystem;
  vec3 commonUnitsPerMeter;
  int projectionMode;
  float scale;
  vec3 commonUnitsPerWorldUnit;
  vec3 commonUnitsPerWorldUnit2;
  vec4 center;
  mat4 modelMatrix;
  mat4 viewProjectionMatrix;
  vec2 viewportSize;
  float devicePixelRatio;
  float focalDistance;
  vec3 cameraPosition;
  vec3 coordinateOrigin;
  vec3 commonOrigin;
  bool pseudoMeters;
} project;
`
};

const projectUniforms = {
  wrapLongitude: 1,
  coordinateSystem: 3,
  commonUnitsPerMeter: [11.125, 12.25, 13.5],
  projectionMode: 4,
  scale: 14.75,
  commonUnitsPerWorldUnit: [21.125, 22.25, 23.5],
  commonUnitsPerWorldUnit2: [31.125, 32.25, 33.5],
  center: [41.125, 42.25, 43.5, 44.75],
  modelMatrix: Array.from({length: 16}, (_, i) => 101 + i),
  viewProjectionMatrix: Array.from({length: 16}, (_, i) => 201 + i),
  viewportSize: [301.25, 302.5],
  devicePixelRatio: 303.75,
  focalDistance: 304.5,
  cameraPosition: [401.125, 402.25, 403.5],
  coordinateOrigin: [501.125, 502.25, 503.5],
  commonOrigin: [601.125, 602.25, 603.5],
  pseudoMeters: 1
} as const;

test('ShaderModule project layout regression reads original deck project uniforms on GPU', async t => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const feedbackBuffers = {
    outConfig: device.createBuffer({byteLength: 4 * Float32Array.BYTES_PER_ELEMENT}),
    outMeters: device.createBuffer({byteLength: 4 * Float32Array.BYTES_PER_ELEMENT}),
    outViewport: device.createBuffer({byteLength: 4 * Float32Array.BYTES_PER_ELEMENT}),
    outOrigins: device.createBuffer({byteLength: 4 * Float32Array.BYTES_PER_ELEMENT})
  };

  const transform = new BufferTransform(device, {
    vs: `\
    #version 300 es
    out vec4 outConfig;
    out vec4 outMeters;
    out vec4 outViewport;
    out vec4 outOrigins;

    void main() {
      outConfig = vec4(
        float(project.coordinateSystem),
        float(project.projectionMode),
        project.scale,
        project.pseudoMeters ? 1.0 : 0.0
      );
      outMeters = vec4(project.commonUnitsPerMeter.xyz, project.wrapLongitude ? 1.0 : 0.0);
      outViewport = vec4(project.viewportSize.xy, project.devicePixelRatio, project.focalDistance);
      outOrigins = vec4(project.coordinateOrigin.xy, project.commonOrigin.xy);
    }
    `,
    outputs: ['outConfig', 'outMeters', 'outViewport', 'outOrigins'],
    modules: [projectLayoutRegressionModule],
    vertexCount: 1,
    feedbackBuffers
  });

  transform.model.shaderInputs.setProps({
    project: projectUniforms
  });
  transform.run();

  t.deepEqual(
    Array.from(await readTransformOutput(transform, 'outConfig')),
    [3, 4, 14.75, 1],
    'reads scalar and bool-like config values from the original project block'
  );
  t.deepEqual(
    Array.from(await readTransformOutput(transform, 'outMeters')),
    [11.125, 12.25, 13.5, 1],
    'reads vec3 and bool-like meter values from the original project block'
  );
  t.deepEqual(
    Array.from(await readTransformOutput(transform, 'outViewport')),
    [301.25, 302.5, 303.75, 304.5],
    'reads vec2 + scalar viewport values from the original project block'
  );
  t.deepEqual(
    Array.from(await readTransformOutput(transform, 'outOrigins')),
    [501.125, 502.25, 601.125, 602.25],
    'reads vec3 origin values from the original project block'
  );

  transform.destroy();
  t.end();
});

async function readTransformOutput(
  transform: BufferTransform,
  varyingName: 'outConfig' | 'outMeters' | 'outViewport' | 'outOrigins'
): Promise<Float32Array> {
  const bytes = await transform.readAsync(varyingName);
  return new Float32Array(bytes.buffer, bytes.byteOffset, 4);
}
