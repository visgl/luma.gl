// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, type RenderPipelineParameters, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  BackgroundTextureModel,
  SphereGeometry,
  Model,
  OrbitControls,
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

import {SCENE_FS_GLSL, SCENE_GLSL, SCENE_WGSL} from './shaders';

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
  orbitControls: OrbitControls | null = null;

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
          this.settingsPanel.makePanel(),
          makeHtmlCustomPanel({
            id: 'a-buffer-background',
            title: 'Background',
            html: A_BUFFER_BACKGROUND_HTML
          })
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

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        distance: Math.hypot(45, 15),
        yaw: (Math.PI * 5) / 6,
        pitch: Math.atan2(15, 45),
        minDistance: 18,
        maxDistance: 90,
        autoRotate: this.rotationEnabled,
        autoRotateSpeed: (-Math.PI * 2) / ORBIT_DURATION_SECONDS
      });
    }
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
    this.orbitControls?.destroy();
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
    this.orbitControls?.update(time);
    const cameraPosition = this.orbitControls?.getEyePosition() || [22.5, 15, -Math.sqrt(3) * 22.5];
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
      this.orbitControls?.setAutoRotate(rotationEnabled);
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

import {A_BUFFER_BACKGROUND_HTML, A_BUFFER_DESCRIPTION_HTML} from './app-ui';

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
