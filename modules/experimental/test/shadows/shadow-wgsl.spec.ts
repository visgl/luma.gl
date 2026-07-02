// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4, radians} from '@math.gl/core';
import {WgslReflect} from 'wgsl_reflect';
import {ShaderAssembler} from '../../../shadertools/src/lib/shader-assembler';
import {getFragmentShaderForRenderPass} from '../../../engine/src/passes/get-fragment-shader';
import {textureTransform} from '../../../engine/src/passes/texture-transform-module';
import {
  contactShadowBilateralBlur,
  contactShadowComposite,
  contactShadowTrace
} from '../../src/shadows/contact-shadow';
import {shadow} from '../../src/shadows/shadow';
import {ShadowMapRenderer} from '../../src/shadows/shadow-map-renderer';

const PLATFORM_INFO = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

const CLIP_SPACE_VERTEX_SHADER = /* wgsl */ `\
struct VertexInputs {
  @location(0) clipSpacePositions: vec2<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) coordinates: vec2<f32>
}
struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) position: vec2<f32>,
  @location(1) coordinate: vec2<f32>,
  @location(2) uv: vec2<f32>
};
@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  outputs.Position = vec4f(inputs.clipSpacePositions, 0.0, 1.0);
  outputs.position = inputs.clipSpacePositions;
  outputs.coordinate = inputs.coordinates;
  outputs.uv = inputs.texCoords;
  return outputs;
}`;

const SHADOW_RECEIVER_SHADER = /* wgsl */ `\
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  let positions = array<vec2f, 3>(vec2f(-1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.5, 1.0);
  output.worldPosition = vec3f(0.0);
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let normal = vec3f(0.0, 1.0, 0.0);
  let factor = shadow_getDirectionalFactor(input.worldPosition, normal, 1.0) *
    shadow_getSpotFactor(0, input.worldPosition, normal) *
    shadow_getPointFactor(0, input.worldPosition, normal);
  return vec4f(vec3f(factor), 1.0);
}`;

test('shadow WGSL assembles and reflects group-2 depth resources', async t => {
  const assembler = new ShaderAssembler();
  const assembled = assembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: SHADOW_RECEIVER_SHADER,
    modules: [shadow]
  }).source;
  const reflected = new WgslReflect(assembled);
  const resources = [...reflected.uniforms, ...reflected.textures, ...reflected.samplers];
  for (const resourceName of [
    'shadow',
    'directionalShadowTexture',
    'spotShadowTexture',
    'pointShadowTexture',
    'directionalShadowTextureSampler',
    'shadowComparisonSampler'
  ]) {
    const resource = resources.find(candidate => candidate.name === resourceName);
    t.ok(resource, `${resourceName} reflects`);
    t.equal(resource?.group, 2, `${resourceName} stays in group 2`);
  }
  await compileWGSL(t, assembled, 'shadow-receiver');
  t.end();
});

test('contact shadow passes assemble and compile', async t => {
  const assembler = new ShaderAssembler();
  for (const shaderPass of [
    contactShadowTrace,
    contactShadowBilateralBlur,
    contactShadowComposite
  ]) {
    const fragmentSource = getFragmentShaderForRenderPass({
      shaderPass,
      action: 'sample',
      shadingLanguage: 'wgsl'
    });
    const assembled = assembler.assembleWGSLShader({
      platformInfo: PLATFORM_INFO,
      source: `${CLIP_SPACE_VERTEX_SHADER}\n${fragmentSource}`,
      modules: [textureTransform, shaderPass]
    }).source;
    t.ok(new WgslReflect(assembled), `${shaderPass.name} reflects`);
    await compileWGSL(t, assembled, shaderPass.name);
  }
  t.end();
});

test('ShadowMapRenderer executes caster and receiver draws for every light view', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU unavailable');
    t.end();
    return;
  }
  const renderer = new ShadowMapRenderer(device, {
    quality: 'low',
    directionalMapSize: 16,
    spotMapSize: 16,
    pointMapSize: 16
  });
  const caster = new Model(device, {
    id: 'shadow-real-caster',
    source: /* wgsl */ `\
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.35, 1.0);
}
@fragment fn fragmentMain() {}`,
    vertexCount: 3,
    colorAttachmentFormats: [],
    depthStencilAttachmentFormat: 'depth32float',
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
  });
  let casterDrawCount = 0;
  const shaderProps = renderer.render({
    camera: {
      viewMatrix: new Matrix4().lookAt({eye: [5, 5, 8], center: [0, 0, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: radians(55),
        aspect: 1,
        near: 0.1,
        far: 60
      }),
      near: 0.1,
      far: 60
    },
    directionalLights: [{direction: [0.4, 0.8, 0.3]}],
    spotLights: [
      {
        position: [0, 8, 0],
        direction: [0, -1, 0],
        range: 20,
        outerConeAngle: 0.4
      }
    ],
    pointLights: [{position: [0, 3, 0], range: 12}],
    drawShadowCasters: view => {
      caster.setParameters(view.rasterParameters);
      caster.draw(view.renderPass);
      casterDrawCount++;
    }
  });
  t.equal(casterDrawCount, 10, 'draws three cascades, one spot and six point faces');

  const shaderInputs = new ShaderInputs({shadow});
  shaderInputs.setProps({shadow: shaderProps});
  const receiver = new Model(device, {
    id: 'shadow-real-receiver',
    source: SHADOW_RECEIVER_SHADER,
    modules: [shadow],
    shaderInputs,
    vertexCount: 3,
    colorAttachmentFormats: ['rgba8unorm']
  });
  const colorTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: [colorTexture]
  });
  const receiverPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
  receiver.draw(receiverPass);
  receiverPass.end();
  device.submit();
  const pixel = await readPixels(colorTexture, 1, 1);
  t.equal(pixel[3], 255, 'receiver sampled all auxiliary shadow bindings');

  framebuffer.destroy();
  colorTexture.destroy();
  receiver.destroy();
  shaderInputs.destroy();
  caster.destroy();
  renderer.destroy();
  t.end();
});

async function compileWGSL(
  t: {
    equal: (actual: unknown, expected: unknown, message?: string) => void;
    comment: (message: string) => void;
  },
  source: string,
  name: string
): Promise<void> {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment(`WebGPU unavailable; ${name} reflection-only`);
    return;
  }
  const shader = device.createShader({id: name, source});
  const messages = await shader.getCompilationInfo();
  const errors = messages
    .filter(message => message.type === 'error')
    .map(message => message.message)
    .join('\n');
  t.equal(errors, '', `${name} compiles${errors ? `\n${errors}` : ''}`);
  shader.destroy();
}

async function readPixels(texture: Texture, width: number, height: number): Promise<number[]> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    texture.device.submit();
    const data = new Uint8Array(await buffer.readAsync(0, layout.byteLength));
    return Array.from(data.slice(0, width * height * 4));
  } finally {
    buffer.destroy();
  }
}
