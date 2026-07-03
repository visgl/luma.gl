// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, type RenderPipelineParameters, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  BackgroundTextureModel,
  SphereGeometry,
  Model,
  ShaderInputs
} from '@luma.gl/engine';
import {
  ABufferRenderer,
  WBOITRenderer,
  aBuffer,
  aBufferPlugin,
  getABufferSupport,
  getWBOITSupport,
  type ABufferShaderModuleProps,
  type WBOITShaderModuleProps,
  wboit,
  wboitPlugin
} from '@luma.gl/experimental';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {type SettingsChangeDescriptor, type SettingsSchema} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel,
  makeExampleTabbedPanel
} from '../../example-panels';

const OPAQUE_INSTANCE_COUNT = 2;
const TRANSLUCENT_INSTANCE_COUNT = 7;
const ORBIT_DURATION_SECONDS = 90;

type TransparencyMode = 'a-buffer' | 'weighted-blended' | 'alpha-blending';

type SceneUniforms = {
  viewProjectionMatrix: Matrix4;
  opacity: number;
  sphereSize: number;
  gridStart: number;
  gridStride: number;
};

const scene = {
  name: 'scene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    opacity: 'f32',
    sphereSize: 'f32',
    gridStart: 'u32',
    gridStride: 'u32'
  }
} as const satisfies ShaderModule<SceneUniforms>;

const SCENE_WGSL = /* wgsl */ `\
struct SceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  opacity: f32,
  sphereSize: f32,
  gridStart: u32,
  gridStride: u32,
};

@group(0) @binding(auto) var<uniform> scene: SceneUniforms;

struct VertexInputs {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) @interpolate(flat) gridIndex: u32,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let gridIndex = scene.gridStart + inputs.instanceIndex * scene.gridStride;
  let row = gridIndex / 3u;
  let column = gridIndex % 3u;
  let offset = vec3<f32>(
    (f32(column) - 1.0) * 9.0,
    (1.0 - f32(row)) * 8.0,
    0.0
  );

  var outputs: FragmentInputs;
  outputs.Position = scene.viewProjectionMatrix * vec4<f32>(inputs.positions * scene.sphereSize + offset, 1.0);
  outputs.normal = inputs.normals;
  outputs.gridIndex = gridIndex;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let colors = array<vec3<f32>, 6>(
    vec3<f32>(0.96, 0.18, 0.24),
    vec3<f32>(0.20, 0.78, 0.36),
    vec3<f32>(0.16, 0.48, 0.98),
    vec3<f32>(0.86, 0.22, 0.92),
    vec3<f32>(1.0, 0.72, 0.12),
    vec3<f32>(0.08, 0.78, 0.88)
  );
  let baseColor = colors[inputs.gridIndex % 6u];
  let lightDirection = normalize(vec3<f32>(0.7, 1.0, -0.4));
  let lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(inputs.normal), lightDirection));
  let color = vec4<f32>(baseColor * lighting, scene.opacity);

#if A_BUFFER_ENABLED
  return aBuffer_captureStraightColor(color, inputs.Position);
#else
#if WBOIT_ENABLED
  return wboit_captureStraightColor(color, inputs.Position);
#else
  return color;
#endif
#endif
}
`;

const SCENE_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 positions;
in vec3 normals;

out vec3 vNormal;
flat out uint vGridIndex;

void main(void) {
  uint gridIndex = scene.gridStart + uint(gl_InstanceID) * scene.gridStride;
  uint row = gridIndex / 3u;
  uint column = gridIndex % 3u;
  vec3 offset = vec3((float(column) - 1.0) * 9.0, (1.0 - float(row)) * 8.0, 0.0);

  gl_Position = scene.viewProjectionMatrix * vec4(positions * scene.sphereSize + offset, 1.0);
  vNormal = normals;
  vGridIndex = gridIndex;
}
`;

const SCENE_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sceneUniforms {
  mat4 viewProjectionMatrix;
  float opacity;
  float sphereSize;
  uint gridStart;
  uint gridStride;
} scene;

in vec3 vNormal;
flat in uint vGridIndex;

out vec4 fragColor;

void main(void) {
  vec3 colors[6] = vec3[6](
    vec3(0.96, 0.18, 0.24),
    vec3(0.20, 0.78, 0.36),
    vec3(0.16, 0.48, 0.98),
    vec3(0.86, 0.22, 0.92),
    vec3(1.0, 0.72, 0.12),
    vec3(0.08, 0.78, 0.88)
  );
  vec3 baseColor = colors[vGridIndex % 6u];
  vec3 lightDirection = normalize(vec3(0.7, 1.0, -0.4));
  float lighting = 0.36 + 0.64 * (0.5 + 0.5 * dot(normalize(vNormal), lightDirection));
  vec4 color = vec4(baseColor * lighting, scene.opacity);

#if WBOIT_ENABLED
  fragColor = wboit_captureStraightColor(color, gl_FragCoord);
#else
  fragColor = color;
#endif
}
`;

const OPAQUE_PARAMETERS = {
  depthWriteEnabled: true,
  depthCompare: 'less-equal',
  cullMode: 'back'
} as const satisfies RenderPipelineParameters;

const TRANSLUCENT_PARAMETERS = {
  depthWriteEnabled: false,
  depthCompare: 'less-equal',
  cullMode: 'back',
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies RenderPipelineParameters;

export default class OrderIndependentTransparencyExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  static props = {useDevicePixels: true, createFramebuffer: true};

  readonly device: Device;
  readonly supportsABuffer: boolean;
  readonly supportsWeightedBlendedOit: boolean;
  readonly aBufferRenderer: ABufferRenderer | null;
  readonly wboitRenderer: WBOITRenderer | null;
  readonly opaqueShaderInputs = new ShaderInputs<{scene: SceneUniforms}>({scene});
  readonly alphaShaderInputs = new ShaderInputs<{scene: SceneUniforms}>({scene});
  readonly wboitShaderInputs = new ShaderInputs<{
    scene: SceneUniforms;
    wboit: WBOITShaderModuleProps;
  }>({scene, wboit});
  readonly aBufferShaderInputs = new ShaderInputs<{
    scene: SceneUniforms;
    aBuffer: ABufferShaderModuleProps;
  }>({scene, aBuffer});
  readonly opaqueModel: Model;
  readonly alphaModel: Model;
  readonly wboitModel: Model | null;
  readonly aBufferModel: Model | null;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  private sceneFramebuffer: Framebuffer;
  private readonly presentModel: BackgroundTextureModel;

  transparencyMode: TransparencyMode = 'a-buffer';
  opacity = 0.34;
  sphereSize = 6.5;
  rotationEnabled = true;
  orbitRadians = Math.PI / 6;
  lastRenderTimeSeconds: number | null = null;

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.supportsABuffer = getABufferSupport(device).supported;
    this.supportsWeightedBlendedOit = getWBOITSupport(device).supported;
    this.transparencyMode = this.getDefaultTransparencyMode();
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'a-buffer-settings',
      schema: makeABufferSettingsSchema(this.supportsABuffer, this.supportsWeightedBlendedOit),
      settings: {
        transparencyMode: this.transparencyMode,
        opacity: this.opacity,
        sphereSize: this.sphereSize,
        rotationEnabled: this.rotationEnabled
      },
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({
      panel: makeExampleTabbedPanel({
        id: 'a-buffer-tabs',
        title: 'Order-independent transparency',
        panels: [
          makeHtmlCustomPanel({
            id: 'a-buffer-description',
            title: 'Description',
            html: A_BUFFER_DESCRIPTION_HTML
          }),
          this.settingsPanel.makePanel()
        ]
      })
    });
    this.aBufferRenderer = this.supportsABuffer
      ? new ABufferRenderer(device, {
          averageFragmentsPerPixel: 4,
          maxFragmentsPerPixel: 16,
          maxBufferByteLength: 64 * 1024 * 1024
        })
      : null;
    this.wboitRenderer = this.supportsWeightedBlendedOit ? new WBOITRenderer(device) : null;
    this.opaqueModel = this.createModel({
      id: 'a-buffer-opaque',
      instanceCount: OPAQUE_INSTANCE_COUNT,
      shaderInputs: this.opaqueShaderInputs,
      parameters: OPAQUE_PARAMETERS
    });
    this.alphaModel = this.createModel({
      id: 'a-buffer-alpha',
      instanceCount: TRANSLUCENT_INSTANCE_COUNT,
      shaderInputs: this.alphaShaderInputs,
      parameters: TRANSLUCENT_PARAMETERS
    });
    this.wboitModel = this.supportsWeightedBlendedOit
      ? this.createModel({
          id: 'wboit-capture',
          instanceCount: TRANSLUCENT_INSTANCE_COUNT,
          shaderInputs: this.wboitShaderInputs,
          parameters: TRANSLUCENT_PARAMETERS,
          wboitEnabled: true
        })
      : null;
    this.aBufferModel = this.supportsABuffer
      ? this.createModel({
          id: 'a-buffer-capture',
          instanceCount: TRANSLUCENT_INSTANCE_COUNT,
          shaderInputs: this.aBufferShaderInputs,
          parameters: TRANSLUCENT_PARAMETERS,
          aBufferEnabled: true
        })
      : null;
    this.sceneFramebuffer = createSceneFramebuffer(device, 1, 1);
    this.presentModel = new BackgroundTextureModel(device, {
      id: 'oit-present',
      backgroundTexture: this.sceneFramebuffer.colorAttachments[0].texture,
      flipY: device.type === 'webgpu'
    });
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
  }

  override onRender({aspect, time}: AnimationProps): void {
    const viewProjectionMatrix = this.getViewProjectionMatrix(aspect, time);
    const opaqueProps = this.getSceneProps(viewProjectionMatrix, false);
    const translucentProps = this.getSceneProps(viewProjectionMatrix, true);
    const aBufferRenderer = this.aBufferRenderer;
    const aBufferModel = this.aBufferModel;
    const [width, height] = this.device.getCanvasContext().getDrawingBufferSize();
    this.resizeSceneFramebuffer(width, height);

    this.opaqueShaderInputs.setProps({scene: opaqueProps});
    this.opaqueModel.predraw(this.device.commandEncoder);
    const basePass = this.device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.004, 0.008, 0.018, 1],
      clearDepth: 1
    });
    this.opaqueModel.draw(basePass);
    basePass.end();

    let outputTexture = this.sceneFramebuffer.colorAttachments[0].texture;

    if (this.transparencyMode === 'a-buffer' && aBufferRenderer && aBufferModel) {
      outputTexture = aBufferRenderer.render({
        sourceTexture: outputTexture,
        opaqueDepthTexture: this.sceneFramebuffer.depthStencilAttachment!,
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
          this.aBufferShaderInputs.setProps({scene: translucentProps, aBuffer: shaderModuleProps});
          aBufferModel.setParameters({...TRANSLUCENT_PARAMETERS, ...captureParameters});
          aBufferModel.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          aBufferModel.draw(renderPass);
        }
      });
    } else if (
      this.transparencyMode === 'weighted-blended' &&
      this.wboitRenderer &&
      this.wboitModel
    ) {
      outputTexture = this.wboitRenderer.render({
        sourceTexture: outputTexture,
        prepareOpaqueDepth: commandEncoder => {
          this.opaqueModel.predraw(commandEncoder);
        },
        drawOpaqueDepth: renderPass => {
          this.opaqueModel.draw(renderPass);
        },
        prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {
          this.wboitShaderInputs.setProps({scene: translucentProps, wboit: shaderModuleProps});
          this.wboitModel?.setParameters({...TRANSLUCENT_PARAMETERS, ...captureParameters});
          this.wboitModel?.predraw(commandEncoder);
        },
        drawTranslucent: renderPass => {
          this.wboitModel?.draw(renderPass);
        }
      });
    } else {
      this.alphaShaderInputs.setProps({scene: translucentProps});
      this.alphaModel.predraw(this.device.commandEncoder);
      const alphaPass = this.device.beginRenderPass({
        framebuffer: this.sceneFramebuffer,
        clearColor: false,
        clearDepth: false
      });
      this.alphaModel.draw(alphaPass);
      alphaPass.end();
    }

    this.presentModel.setProps({backgroundTexture: outputTexture});
    this.presentModel.predraw(this.device.commandEncoder);
    const presentPass = this.device.beginRenderPass({
      clearColor: [0.004, 0.008, 0.018, 1],
      clearDepth: 1
    });
    this.presentModel.draw(presentPass);
    presentPass.end();
  }

  override onFinalize(): void {
    this.panels.finalize();
    this.settingsPanel.finalize();
    this.opaqueModel.destroy();
    this.alphaModel.destroy();
    this.wboitModel?.destroy();
    this.aBufferModel?.destroy();
    this.opaqueShaderInputs.destroy();
    this.alphaShaderInputs.destroy();
    this.wboitShaderInputs.destroy();
    this.aBufferShaderInputs.destroy();
    this.aBufferRenderer?.destroy();
    this.wboitRenderer?.destroy();
    destroySceneFramebuffer(this.sceneFramebuffer);
    this.presentModel.destroy();
  }

  private resizeSceneFramebuffer(width: number, height: number): void {
    if (this.sceneFramebuffer.width === width && this.sceneFramebuffer.height === height) {
      return;
    }
    destroySceneFramebuffer(this.sceneFramebuffer);
    this.sceneFramebuffer = createSceneFramebuffer(this.device, width, height);
  }

  private createModel(options: {
    id: string;
    instanceCount: number;
    shaderInputs: ShaderInputs<any>;
    parameters: Readonly<RenderPipelineParameters>;
    aBufferEnabled?: boolean;
    wboitEnabled?: boolean;
  }): Model {
    const aBufferEnabled = options.aBufferEnabled ?? false;
    const wboitEnabled = options.wboitEnabled ?? false;
    return new Model(this.device, {
      id: options.id,
      source: SCENE_WGSL,
      vs: SCENE_GLSL,
      fs: SCENE_FS_GLSL,
      shaderInputs: options.shaderInputs,
      defines: {
        A_BUFFER_ENABLED: aBufferEnabled ? 1 : 0,
        WBOIT_ENABLED: wboitEnabled ? 1 : 0
      },
      plugins: aBufferEnabled ? [aBufferPlugin] : wboitEnabled ? [wboitPlugin] : [],
      geometry: new SphereGeometry({nlat: 32, nlong: 48}),
      instanceCount: options.instanceCount,
      parameters: options.parameters
    });
  }

  private getDefaultTransparencyMode(): TransparencyMode {
    if (this.supportsABuffer) {
      return 'a-buffer';
    }
    if (this.supportsWeightedBlendedOit) {
      return 'weighted-blended';
    }
    return 'alpha-blending';
  }

  private getSceneProps(viewProjectionMatrix: Matrix4, translucent: boolean): SceneUniforms {
    return {
      viewProjectionMatrix,
      opacity: translucent ? this.opacity : 1,
      sphereSize: this.sphereSize,
      gridStart: translucent ? 1 : 0,
      gridStride: translucent ? 1 : 8
    };
  }

  private getViewProjectionMatrix(aspect: number, time: number): Matrix4 {
    const timeSeconds = time / 1000;
    if (this.lastRenderTimeSeconds === null) {
      this.lastRenderTimeSeconds = timeSeconds;
    }
    const elapsedSeconds = Math.max(timeSeconds - this.lastRenderTimeSeconds, 0);
    this.lastRenderTimeSeconds = timeSeconds;
    if (this.rotationEnabled) {
      this.orbitRadians += (elapsedSeconds * Math.PI * 2) / ORBIT_DURATION_SECONDS;
    }

    const cameraPosition: [number, number, number] = [
      Math.sin(this.orbitRadians) * 45,
      15,
      -Math.cos(this.orbitRadians) * 45
    ];
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(58),
      aspect,
      near: 1,
      far: 240
    });
    const viewMatrix = new Matrix4().lookAt({
      eye: cameraPosition,
      center: [0, 0, 0],
      up: [0, 1, 0]
    });
    return projectionMatrix.multiplyRight(viewMatrix);
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const transparencyMode = getChangedSetting(changedSettings, 'transparencyMode')?.nextValue;
    const opacity = getChangedSetting(changedSettings, 'opacity')?.nextValue;
    const sphereSize = getChangedSetting(changedSettings, 'sphereSize')?.nextValue;
    const rotationEnabled = getChangedSetting(changedSettings, 'rotationEnabled')?.nextValue;

    if (isTransparencyMode(transparencyMode)) {
      this.transparencyMode = transparencyMode;
    }
    if (typeof opacity === 'number') {
      this.opacity = opacity;
    }
    if (typeof sphereSize === 'number') {
      this.sphereSize = sphereSize;
    }
    if (typeof rotationEnabled === 'boolean') {
      this.rotationEnabled = rotationEnabled;
    }
  };
}

function makeABufferSettingsSchema(
  supportsABuffer: boolean,
  supportsWeightedBlendedOit: boolean
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'rendering',
        name: 'Rendering',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'transparencyMode',
            label: 'Transparency',
            type: 'select',
            persist: 'none',
            options: [
              ...(supportsABuffer ? [{label: 'A-buffer OIT', value: 'a-buffer'}] : []),
              ...(supportsWeightedBlendedOit
                ? [{label: 'Weighted blended OIT', value: 'weighted-blended'}]
                : []),
              {label: 'Standard alpha blending', value: 'alpha-blending'}
            ]
          },
          {
            name: 'opacity',
            label: 'Opacity',
            type: 'number',
            min: 0.1,
            max: 0.7,
            step: 0.01,
            persist: 'none'
          },
          {
            name: 'sphereSize',
            label: 'Sphere size',
            type: 'number',
            min: 3,
            max: 10,
            step: 0.1,
            persist: 'none'
          },
          {name: 'rotationEnabled', label: 'Rotate camera', type: 'boolean', persist: 'none'}
        ]
      }
    ]
  };
}

function isTransparencyMode(value: unknown): value is TransparencyMode {
  return value === 'a-buffer' || value === 'weighted-blended' || value === 'alpha-blending';
}

const A_BUFFER_DESCRIPTION_HTML = `\
<p>Compare exact per-pixel linked-list OIT, approximate weighted blended OIT, and unsorted alpha blending on the same interleaved scene.</p>
<p>The dropdown renders the same unsorted translucent spheres with three different blending strategies.</p>
<div style="display: grid; gap: 8px;">
  <div><strong>A-buffer OIT</strong><br>Captures every translucent fragment into GPU storage, sorts fragments per pixel, then composites them back-to-front. It is the most accurate option here and is available on WebGPU.</div>
  <div><strong>Weighted blended OIT</strong><br>Accumulates weighted color and revealage into floating-point offscreen targets, then composites once. It avoids sorting and works on WebGPU or WebGL2 when float render-target blending is available, but it is approximate.</div>
  <div><strong>Standard alpha blending</strong><br>Blends translucent draws directly into the framebuffer in submission order. It is the cheapest fallback, but unsorted overlaps produce visibly incorrect results.</div>
</div>`;

function createSceneFramebuffer(device: Device, width: number, height: number): Framebuffer {
  const colorTexture = device.createTexture({
    id: 'oit-scene-color',
    width,
    height,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  const depthTexture = device.createTexture({
    id: 'oit-scene-depth',
    width,
    height,
    format: 'depth24plus',
    usage: Texture.SAMPLE | Texture.RENDER
  });
  return device.createFramebuffer({
    id: 'oit-scene-framebuffer',
    width,
    height,
    colorAttachments: [colorTexture],
    depthStencilAttachment: depthTexture
  });
}

function destroySceneFramebuffer(framebuffer: Framebuffer): void {
  const colorTexture = framebuffer.colorAttachments[0].texture;
  const depthTexture = framebuffer.depthStencilAttachment?.texture;
  framebuffer.destroy();
  colorTexture.destroy();
  depthTexture?.destroy();
}
