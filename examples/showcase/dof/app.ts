// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/*
  Based on: https://github.com/tsherif/picogl.js/blob/master/examples/dof.html
  Original algorithm: http://www.nutty.ca/?page_id=352&link=depth_of_field
*/

import type {NumberArray, TextureFormatColor, TextureFormatDepthStencil} from '@luma.gl/core';
import {Buffer, Framebuffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  DynamicTexture,
  loadImageBitmap,
  Model,
  ShaderInputs,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {dofShaderPassPipeline} from '@luma.gl/effects';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

const INFO_HTML = `\
<div>
  <p><b>Depth of Field</b></p>
  <p>Several instanced cubes rendered with a depth-driven postprocessing blur.</p>
</div>
<div style="display: grid; gap: 10px; min-width: 280px;">
  <label style="display: grid; gap: 4px;">
    <span style="font-size: 12px; font-weight: 600;">Focus Distance</span>
    <input type="range" id="dof-focus-distance" min="0.1" max="10.0" step="0.1">
  </label>
  <label style="display: grid; gap: 4px;">
    <span style="font-size: 12px; font-weight: 600;">Lens Aperture</span>
    <input type="range" id="dof-f-stop" min="0.1" max="10.0" step="0.1">
  </label>
  <label style="display: grid; gap: 4px;">
    <span style="font-size: 12px; font-weight: 600;">Focal Length</span>
    <input type="range" id="dof-focal-length" min="0.1" max="10.0" step="0.1">
  </label>
</div>
`;

const NUM_ROWS = 5;
const CUBES_PER_ROW = 20;
const NUM_CUBES = NUM_ROWS * CUBES_PER_ROW;
const NEAR = 0.1;
const FAR = 30;
const INSTANCE_MATRIX_STRIDE = 16;
const INSTANCE_MATRIX_BUFFER_BYTE_LENGTH =
  NUM_CUBES * INSTANCE_MATRIX_STRIDE * Float32Array.BYTES_PER_ELEMENT;
const VIS_LOGO_TEXTURE_URL = 'vis-logo.png';

type AppUniforms = {
  projectionMatrix: NumberArray;
  viewMatrix: NumberArray;
};

type DofUniforms = {
  depthRange: [number, number];
  focusDistance: number;
  blurCoefficient: number;
  pixelsPerMillimeter: number;
};

const appShaderModule: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>'
  }
};

// Pass 1 renders cubes into an offscreen color + depth framebuffer. The color target stores
// shaded surface color while the depth attachment remains the visibility buffer used by the GPU
// during rasterization.
const SCENE_WGSL = /* wgsl */ `\
struct AppUniforms {
  projectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var cubeTexture: texture_2d<f32>;
@group(0) @binding(auto) var cubeTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) texCoords: vec2<f32>,
  @location(3) instanceModelMatrixCol0: vec4<f32>,
  @location(4) instanceModelMatrixCol1: vec4<f32>,
  @location(5) instanceModelMatrixCol2: vec4<f32>,
  @location(6) instanceModelMatrixCol3: vec4<f32>,
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) tint: vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
  let modelMatrix = mat4x4<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );

  let worldPosition = modelMatrix * vec4<f32>(inputs.positions, 1.0);
  let worldNormal = normalize((modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  let depthTint = clamp((-modelMatrix[3].z) / 20.0, 0.0, 1.0);

  var outputs: VertexOutputs;
  outputs.position = app.projectionMatrix * app.viewMatrix * worldPosition;
  outputs.normal = worldNormal;
  outputs.uv = inputs.texCoords;
  outputs.tint = mix(vec3<f32>(0.18, 0.55, 0.95), vec3<f32>(1.0, 0.56, 0.18), depthTint);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let textureColor = textureSample(cubeTexture, cubeTextureSampler, inputs.uv).rgb;
  let baseColor = mix(inputs.tint * 0.55, textureColor, 0.75);
  let light = clamp(dot(normalize(inputs.normal), normalize(vec3<f32>(1.0, 1.0, 0.35))), 0.0, 1.0);
  return vec4<f32>(baseColor * (light + 0.12), 1.0);
}
`;

const SCENE_VERTEX_SHADER = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;

uniform appUniforms {
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

uniform sampler2D cubeTexture;

out vec3 vNormal;
out vec2 vUv;
out vec3 vTint;

void main(void) {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );

  vec4 worldPosition = modelMatrix * vec4(positions, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;

  vec3 worldNormal = normalize(mat3(modelMatrix) * normals);
  float depthTint = clamp((-modelMatrix[3].z) / 20.0, 0.0, 1.0);

  vNormal = worldNormal;
  vUv = texCoords;
  vTint = mix(vec3(0.18, 0.55, 0.95), vec3(1.0, 0.56, 0.18), depthTint);
}
`;

const SCENE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D cubeTexture;

in vec3 vNormal;
in vec2 vUv;
in vec3 vTint;

out vec4 fragColor;

void main(void) {
  vec3 textureColor = texture(cubeTexture, vec2(vUv.x, 1.0 - vUv.y)).rgb;
  vec3 baseColor = mix(vTint * 0.55, textureColor, 0.75);
  float light = clamp(dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 0.35))), 0.0, 1.0);
  fragColor = vec4(baseColor * (light + 0.12), 1.0);
}
`;

type CubeTransform = {
  matrix: Matrix4;
  rotate: [number, number, number];
  scale: [number, number, number];
  translate: [number, number, number];
};

function createColorTexture(
  device: AnimationProps['device'],
  id: string,
  format: TextureFormatColor,
  width: number,
  height: number
) {
  return device.createTexture({
    id,
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

function createDepthTexture(
  device: AnimationProps['device'],
  id: string,
  format: TextureFormatDepthStencil,
  width: number,
  height: number
) {
  // The post-process pass samples the depth attachment directly, so this must be a texture-backed
  // depth buffer rather than a transient renderbuffer-style attachment.
  return device.createTexture({
    id,
    format,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST,
    sampler: {
      minFilter: 'nearest',
      magFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    }
  });
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  focalLength = 2;
  focusDistance = 3;
  fStop = 2.8;

  appShaderInputs = new ShaderInputs<{app: AppUniforms}>({app: appShaderModule});

  sceneModel: Model;
  cubeTexture: DynamicTexture;
  shaderPassRenderer: ShaderPassRenderer;

  instanceMatrixBuffer: Buffer;
  instanceMatrices = new Float32Array(NUM_CUBES * INSTANCE_MATRIX_STRIDE);
  cubeTransforms: CubeTransform[] = [];

  sceneFramebuffer: Framebuffer;

  controlsInitialized = false;
  controlCleanup: Array<() => void> = [];

  constructor({device, width, height}: AnimationProps) {
    super();
    const offscreenColorFormat = getOffscreenColorFormat(device);
    // WebGPU uses a deeper depth format here because the blur radius is derived from depth
    // deltas, and low precision shows up as visible banding in far-field blur.
    const depthTextureFormat: TextureFormatDepthStencil =
      device.type === 'webgpu' ? 'depth24plus' : 'depth16unorm';

    this.instanceMatrixBuffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: INSTANCE_MATRIX_BUFFER_BYTE_LENGTH
    });
    this.cubeTexture = new DynamicTexture(device, {
      usage: Texture.SAMPLE | Texture.COPY_DST,
      data: loadImageBitmap(VIS_LOGO_TEXTURE_URL, {imageOrientation: 'flipY'}),
      mipmaps: true,
      sampler: device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear'
      })
    });

    this.sceneModel = new Model(device, {
      id: 'dof-scene',
      shaderInputs: this.appShaderInputs,
      ...(device.info.shadingLanguage === 'wgsl'
        ? {
            source: SCENE_WGSL,
            colorAttachmentFormats: [offscreenColorFormat],
            depthStencilAttachmentFormat: depthTextureFormat
          }
        : {
            vs: SCENE_VERTEX_SHADER,
            fs: SCENE_FRAGMENT_SHADER
          }),
      geometry: new CubeGeometry({indices: true}),
      instanceCount: NUM_CUBES,
      bufferLayout: [
        {
          name: 'instanceMatrices',
          stepMode: 'instance',
          byteStride: 64,
          attributes: [
            {attribute: 'instanceModelMatrixCol0', format: 'float32x4', byteOffset: 0},
            {attribute: 'instanceModelMatrixCol1', format: 'float32x4', byteOffset: 16},
            {attribute: 'instanceModelMatrixCol2', format: 'float32x4', byteOffset: 32},
            {attribute: 'instanceModelMatrixCol3', format: 'float32x4', byteOffset: 48}
          ]
        }
      ],
      attributes: {
        instanceMatrices: this.instanceMatrixBuffer
      },
      bindings: {
        cubeTexture: this.cubeTexture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });

    this.sceneFramebuffer = device.createFramebuffer({
      width,
      height,
      colorAttachments: [
        createColorTexture(device, 'dof-scene-color', offscreenColorFormat, width, height)
      ],
      depthStencilAttachment: createDepthTexture(
        device,
        'dof-scene-depth',
        depthTextureFormat,
        width,
        height
      )
    });

    this.shaderPassRenderer = new ShaderPassRenderer(device, {
      shaderPasses: [dofShaderPassPipeline]
    });

    this.initializeCubeTransforms();
    this.writeInstanceMatrices();
  }

  onFinalize(): void {
    for (const cleanup of this.controlCleanup) {
      cleanup();
    }
    this.controlCleanup = [];

    this.sceneModel.destroy();
    this.cubeTexture.destroy();
    this.shaderPassRenderer.destroy();
    this.instanceMatrixBuffer.destroy();
    this.sceneFramebuffer.destroy();
  }

  onRender({device, width, height, aspect}: AnimationProps): void {
    this.initializeControls();

    // Keep offscreen targets matched to the presentation size so blur radius stays stable in
    // texel space as the canvas resizes.
    this.sceneFramebuffer.resize({width, height});
    this.shaderPassRenderer.resize([width, height]);

    this.updateCubeTransforms();
    this.writeInstanceMatrices();

    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(75),
      aspect,
      near: NEAR,
      far: FAR
    });
    const viewMatrix = new Matrix4().lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});

    this.appShaderInputs.setProps({
      app: {
        projectionMatrix,
        viewMatrix
      }
    });

    // Geometry pass: rasterize cubes into offscreen color + depth attachments. This is where the
    // GPU resolves visibility and writes the authoritative scene depth buffer that later drives
    // the circle-of-confusion estimate in the post-processing passes.
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });
    this.sceneModel.draw(sceneRenderPass);
    sceneRenderPass.end();

    const magnification =
      this.focalLength / Math.max(0.1, Math.abs(this.focusDistance - this.focalLength));
    const blurCoefficient = (this.focalLength * magnification) / this.fStop;
    const pixelsPerMillimeter = Math.sqrt(width * width + height * height) / 35;
    const depthTexture = this.sceneFramebuffer.depthStencilAttachment?.texture;
    if (!depthTexture) {
      return;
    }

    this.shaderPassRenderer.renderToScreen({
      sourceTexture: this.sceneFramebuffer.colorAttachments[0].texture,
      bindings: {depthTexture},
      uniforms: {
        dof: {
          depthRange: [NEAR, FAR],
          focusDistance: this.focusDistance,
          blurCoefficient,
          pixelsPerMillimeter
        } satisfies DofUniforms
      }
    });
  }

  initializeCubeTransforms(): void {
    let cubeIndex = 0;

    for (let rowIndex = 0; rowIndex < NUM_ROWS; rowIndex++) {
      const rowOffset = rowIndex - Math.floor(NUM_ROWS / 2);

      for (let columnIndex = 0; columnIndex < CUBES_PER_ROW; columnIndex++) {
        const translate: [number, number, number] = [
          -columnIndex + 2 - rowOffset,
          0,
          -columnIndex + 2 + rowOffset
        ];
        const rotate: [number, number, number] = [
          -Math.random() * Math.PI,
          Math.random() * Math.PI * 0.25,
          Math.random() * Math.PI
        ];
        const scale: [number, number, number] = [0.4, 0.4, 0.4];

        this.cubeTransforms[cubeIndex++] = {
          translate,
          rotate,
          scale,
          matrix: new Matrix4().translate(translate).rotateXYZ(rotate).scale(scale)
        };
      }
    }
  }

  updateCubeTransforms(): void {
    let matrixOffset = 0;

    for (const cubeTransform of this.cubeTransforms) {
      cubeTransform.rotate[0] += 0.01;
      cubeTransform.rotate[1] += 0.02;
      cubeTransform.matrix
        .identity()
        .translate(cubeTransform.translate)
        .rotateXYZ(cubeTransform.rotate)
        .scale(cubeTransform.scale);

      this.instanceMatrices.set(cubeTransform.matrix, matrixOffset);
      matrixOffset += INSTANCE_MATRIX_STRIDE;
    }
  }

  writeInstanceMatrices(): void {
    this.instanceMatrixBuffer.write(this.instanceMatrices);
  }

  initializeControls(): void {
    if (this.controlsInitialized || typeof document === 'undefined') {
      return;
    }

    const sliderConfigs = [
      {
        id: 'dof-focal-length',
        value: this.focalLength,
        onInput: (value: number) => {
          this.focalLength = value;
        }
      },
      {
        id: 'dof-focus-distance',
        value: this.focusDistance,
        onInput: (value: number) => {
          this.focusDistance = value;
        }
      },
      {
        id: 'dof-f-stop',
        value: this.fStop,
        onInput: (value: number) => {
          this.fStop = value;
        }
      }
    ];

    for (const sliderConfig of sliderConfigs) {
      const element = document.getElementById(sliderConfig.id) as HTMLInputElement | null;
      if (!element) {
        return;
      }

      element.value = String(sliderConfig.value);
      const onInput = () => sliderConfig.onInput(Number(element.value));
      element.addEventListener('input', onInput);
      this.controlCleanup.push(() => element.removeEventListener('input', onInput));
    }

    this.controlsInitialized = true;
  }
}

function getOffscreenColorFormat(device: AnimationProps['device']): TextureFormatColor {
  return device.type === 'webgpu' ? device.preferredColorFormat : 'rgba8unorm';
}
