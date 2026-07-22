// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Texture,
  UniformStore,
  type CompareFunction,
  type Device,
  type Framebuffer,
  type Sampler,
  type SamplerProps,
  type SamplerAddressMode
} from '@luma.gl/core';
import {AnimationLoopTemplate, DynamicTexture, type AnimationProps, Model} from '@luma.gl/engine';
import {
  ColumnPanel,
  type Panel,
  type SettingOption,
  type SettingsChangeDescriptor,
  type SettingsSchema,
  type SettingsState
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

export const title = 'Texture Sampling';
export const description = 'Experiment with mipmaps, filtering, wrapping, and comparison samplers.';

type Vec4 = [number, number, number, number];
type SampleMode = 'color-texture' | 'depth-comparison';
type TexturePreset = 'nearest-pixels' | 'bilinear' | 'trilinear' | 'anisotropic' | 'custom';
type MipChain = 'generated' | 'single-level';
type AddressMode = SamplerAddressMode;
type FilterMode = 'nearest' | 'linear';
type MipmapFilter = 'none' | 'nearest' | 'linear';

type TextureSamplingSettings = {
  sampleMode: SampleMode;
  preset: TexturePreset;
  mipChain: MipChain;
  addressModeU: AddressMode;
  addressModeV: AddressMode;
  magFilter: FilterMode;
  minFilter: FilterMode;
  mipmapFilter: MipmapFilter;
  lodMinClamp: number;
  lodMaxClamp: number;
  maxAnisotropy: number;
  uvScale: number;
  uvOffsetU: number;
  uvOffsetV: number;
  zoom: number;
  tilt: number;
  compare: CompareFunction;
  reference: number;
};

type SampleUniforms = {
  rect: Vec4;
  uvTransform: Vec4;
  options: Vec4;
};

const TEXTURE_SIZE = 256;
const MAX_MIP_LEVEL = 8;
const MAGNIFIED_RECT: Vec4 = [-0.5, 0, 0.92, 1.58];
const RECEDING_RECT: Vec4 = [0.5, 0, 0.92, 1.58];

const PORTABLE_ADDRESS_MODES: AddressMode[] = ['clamp-to-edge', 'repeat', 'mirror-repeat'];
const FILTER_MODES: FilterMode[] = ['nearest', 'linear'];
const MIPMAP_FILTERS: MipmapFilter[] = ['none', 'nearest', 'linear'];
const ANISOTROPY_VALUES = [1, 2, 4, 8, 16];
const COMPARE_FUNCTIONS: CompareFunction[] = [
  'never',
  'less',
  'equal',
  'less-equal',
  'greater',
  'not-equal',
  'greater-equal',
  'always'
];

const DEFAULT_SETTINGS: TextureSamplingSettings = {
  sampleMode: 'color-texture',
  preset: 'trilinear',
  mipChain: 'generated',
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  magFilter: 'linear',
  minFilter: 'linear',
  mipmapFilter: 'linear',
  lodMinClamp: 0,
  lodMaxClamp: MAX_MIP_LEVEL,
  maxAnisotropy: 1,
  uvScale: 4,
  uvOffsetU: 0,
  uvOffsetV: 0,
  zoom: 1,
  tilt: 0.65,
  compare: 'less-equal',
  reference: 0.5
};

const PRESETS: Record<Exclude<TexturePreset, 'custom'>, Partial<TextureSamplingSettings>> = {
  'nearest-pixels': {
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'none',
    maxAnisotropy: 1
  },
  bilinear: {
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'none',
    maxAnisotropy: 1
  },
  trilinear: {
    mipChain: 'generated',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 1
  },
  anisotropic: {
    mipChain: 'generated',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 8
  }
};

const SAMPLE_MODULE = {
  uniformTypes: {
    rect: 'vec4<f32>',
    uvTransform: 'vec4<f32>',
    options: 'vec4<f32>'
  }
} as const;

const COLOR_SAMPLE_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  uvTransform: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var uTexture: texture_2d<f32>;
@group(0) @binding(auto) var uTextureSampler: sampler;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let localPositions = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(0.5, 0.5)
  );
  let localPosition = localPositions[vertexIndex];
  let normalizedUv = localPosition + vec2<f32>(0.5);
  let effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  let transformedUv = (normalizedUv - vec2<f32>(0.5)) * effectiveScale +
    vec2<f32>(0.5) + app.uvTransform.zw;
  let perspective = select(
    1.0,
    mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y),
    app.options.x > 0.5
  );
  let screenPosition = app.rect.xy + localPosition * app.rect.zw;
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(screenPosition * perspective, 0.0, perspective);
  outputs.uv = transformedUv;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return textureSample(uTexture, uTextureSampler, inputs.uv);
}
`;

const COLOR_SAMPLE_VS_GLSL = /* glsl */ `#version 300 es
uniform appUniforms {
  vec4 rect;
  vec4 uvTransform;
  vec4 options;
} app;

const vec2 POSITIONS[6] = vec2[6](
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, 0.5),
  vec2(-0.5, 0.5),
  vec2(0.5, -0.5),
  vec2(0.5, 0.5)
);

out vec2 vUV;

void main(void) {
  vec2 localPosition = POSITIONS[gl_VertexID];
  vec2 normalizedUv = localPosition + vec2(0.5);
  float effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  vUV = (normalizedUv - vec2(0.5)) * effectiveScale + vec2(0.5) + app.uvTransform.zw;
  float perspective = app.options.x > 0.5
    ? mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y)
    : 1.0;
  vec2 screenPosition = app.rect.xy + localPosition * app.rect.zw;
  gl_Position = vec4(screenPosition * perspective, 0.0, perspective);
}
`;

const COLOR_SAMPLE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  fragColor = texture(uTexture, vUV);
}
`;

const DEPTH_WRITE_WGSL = /* wgsl */ `
struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );
  let position = positions[vertexIndex];
  var outputs: VertexOutputs;
  outputs.uv = position * 0.5 + vec2<f32>(0.5);
  outputs.position = vec4<f32>(position, 0.1 + outputs.uv.x * 0.8, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.uv.x, inputs.uv.y, 0.2, 1.0);
}
`;

const DEPTH_WRITE_VS_GLSL = /* glsl */ `#version 300 es
const vec2 POSITIONS[6] = vec2[6](
  vec2(-1.0, -1.0),
  vec2(1.0, -1.0),
  vec2(-1.0, 1.0),
  vec2(-1.0, 1.0),
  vec2(1.0, -1.0),
  vec2(1.0, 1.0)
);

out vec2 vUV;

void main(void) {
  vec2 position = POSITIONS[gl_VertexID];
  vUV = position * 0.5 + vec2(0.5);
  gl_Position = vec4(position, vUV.x * 1.6 - 0.8, 1.0);
}
`;

const DEPTH_WRITE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(vUV, 0.2, 1.0);
}
`;

const COMPARISON_SAMPLE_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  uvTransform: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var uDepthTexture: texture_depth_2d;
@group(0) @binding(auto) var uDepthTextureSampler: sampler_comparison;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let localPositions = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(0.5, 0.5)
  );
  let localPosition = localPositions[vertexIndex];
  let normalizedUv = localPosition + vec2<f32>(0.5);
  let effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  let transformedUv = (normalizedUv - vec2<f32>(0.5)) * effectiveScale +
    vec2<f32>(0.5) + app.uvTransform.zw;
  let perspective = select(
    1.0,
    mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y),
    app.options.x > 0.5
  );
  let screenPosition = app.rect.xy + localPosition * app.rect.zw;
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(screenPosition * perspective, 0.0, perspective);
  outputs.uv = transformedUv;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let comparison = textureSampleCompare(
    uDepthTexture,
    uDepthTextureSampler,
    inputs.uv,
    app.options.w
  );
  let failColor = vec3<f32>(0.08, 0.12, 0.24);
  let passColor = vec3<f32>(0.95, 0.58, 0.16);
  return vec4<f32>(mix(failColor, passColor, comparison), 1.0);
}
`;

const COMPARISON_SAMPLE_VS_GLSL = COLOR_SAMPLE_VS_GLSL;

const COMPARISON_SAMPLE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DShadow;

uniform sampler2DShadow uDepthTexture;
uniform appUniforms {
  vec4 rect;
  vec4 uvTransform;
  vec4 options;
} app;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  float comparison = texture(uDepthTexture, vec3(vUV, app.options.w));
  vec3 failColor = vec3(0.08, 0.12, 0.24);
  vec3 passColor = vec3(0.95, 0.58, 0.16);
  fragColor = vec4(mix(failColor, passColor, comparison), 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly magnifiedUniformStore: UniformStore<{app: SampleUniforms}>;
  readonly recedingUniformStore: UniformStore<{app: SampleUniforms}>;
  readonly comparisonMagnifiedUniformStore: UniformStore<{app: SampleUniforms}>;
  readonly comparisonRecedingUniformStore: UniformStore<{app: SampleUniforms}>;
  readonly colorMagnifiedModel: Model;
  readonly colorRecedingModel: Model;
  readonly comparisonMagnifiedModel: Model;
  readonly comparisonRecedingModel: Model;
  readonly depthWriteModel: Model;
  readonly depthColorTexture: Texture;
  readonly depthTexture: Texture;
  readonly depthFramebuffer: Framebuffer;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  colorTexture: DynamicTexture;
  settings: TextureSamplingSettings = cloneSettings(DEFAULT_SETTINGS);
  private activeColorSampler: Sampler | null = null;
  private activeComparisonSampler: Sampler | null = null;
  private depthTextureInitialized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.colorTexture = this.makeColorTexture(this.settings.mipChain);

    this.magnifiedUniformStore = new UniformStore(device, {app: SAMPLE_MODULE});
    this.recedingUniformStore = new UniformStore(device, {app: SAMPLE_MODULE});
    this.comparisonMagnifiedUniformStore = new UniformStore(device, {app: SAMPLE_MODULE});
    this.comparisonRecedingUniformStore = new UniformStore(device, {app: SAMPLE_MODULE});

    this.colorMagnifiedModel = this.makeColorSampleModel(
      'texture-sampling-magnified',
      this.magnifiedUniformStore
    );
    this.colorRecedingModel = this.makeColorSampleModel(
      'texture-sampling-receding',
      this.recedingUniformStore
    );

    this.depthColorTexture = device.createTexture({
      id: 'texture-sampling-depth-color',
      width: TEXTURE_SIZE,
      height: TEXTURE_SIZE,
      format: 'rgba8unorm',
      usage: Texture.RENDER
    });
    this.depthTexture = device.createTexture({
      id: 'texture-sampling-depth',
      width: TEXTURE_SIZE,
      height: TEXTURE_SIZE,
      format: 'depth24plus',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    this.depthFramebuffer = device.createFramebuffer({
      id: 'texture-sampling-depth-framebuffer',
      width: TEXTURE_SIZE,
      height: TEXTURE_SIZE,
      colorAttachments: [this.depthColorTexture],
      depthStencilAttachment: this.depthTexture
    });
    this.depthWriteModel = new Model(device, {
      id: 'texture-sampling-depth-writer',
      source: DEPTH_WRITE_WGSL,
      vs: DEPTH_WRITE_VS_GLSL,
      fs: DEPTH_WRITE_FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 6,
      parameters: {
        depthFormat: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
    this.comparisonMagnifiedModel = this.makeComparisonSampleModel(
      'texture-sampling-comparison-magnified',
      this.comparisonMagnifiedUniformStore
    );
    this.comparisonRecedingModel = this.makeComparisonSampleModel(
      'texture-sampling-comparison-receding',
      this.comparisonRecedingUniformStore
    );

    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'texture-sampling-settings',
      schema: makeSettingsSchema(this.device, this.settings),
      settings: toSettingsState(this.settings),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    void this.applyColorSampler();
    this.applyComparisonSampler();
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.colorMagnifiedModel.destroy();
    this.colorRecedingModel.destroy();
    this.comparisonMagnifiedModel.destroy();
    this.comparisonRecedingModel.destroy();
    this.depthWriteModel.destroy();
    this.magnifiedUniformStore.destroy();
    this.recedingUniformStore.destroy();
    this.comparisonMagnifiedUniformStore.destroy();
    this.comparisonRecedingUniformStore.destroy();
    this.activeColorSampler?.destroy();
    this.activeComparisonSampler?.destroy();
    this.colorTexture.destroy();
    this.depthFramebuffer.destroy();
    this.depthColorTexture.destroy();
    this.depthTexture.destroy();
  }

  onRender({device}: AnimationProps): void {
    this.updateUniforms();
    if (!this.depthTextureInitialized) {
      this.renderDepthTexture(device);
      this.depthTextureInitialized = true;
    }

    const renderPass = device.beginRenderPass({clearColor: [0.025, 0.03, 0.05, 1]});
    if (this.settings.sampleMode === 'depth-comparison') {
      this.comparisonMagnifiedModel.draw(renderPass);
      this.comparisonRecedingModel.draw(renderPass);
    } else {
      this.colorMagnifiedModel.draw(renderPass);
      this.colorRecedingModel.draw(renderPass);
    }
    renderPass.end();
  }

  private makeColorTexture(mipChain: MipChain): DynamicTexture {
    return new DynamicTexture(this.device, {
      id: `texture-sampling-color-${mipChain}`,
      format: 'rgba8unorm',
      width: TEXTURE_SIZE,
      height: TEXTURE_SIZE,
      data: makeDiagnosticTextureData(TEXTURE_SIZE),
      mipmaps: mipChain === 'generated',
      mipLevels: mipChain === 'generated' ? 'auto' : 1,
      sampler: makeColorSamplerProps(this.settings, this.device)
    });
  }

  private makeColorSampleModel(
    id: string,
    uniformStore: UniformStore<{app: SampleUniforms}>
  ): Model {
    return new Model(this.device, {
      id,
      source: COLOR_SAMPLE_WGSL,
      vs: COLOR_SAMPLE_VS_GLSL,
      fs: COLOR_SAMPLE_FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 6,
      bindings: {
        app: uniformStore.getManagedUniformBuffer('app'),
        uTexture: this.colorTexture
      }
    });
  }

  private makeComparisonSampleModel(
    id: string,
    uniformStore: UniformStore<{app: SampleUniforms}>
  ): Model {
    return new Model(this.device, {
      id,
      source: COMPARISON_SAMPLE_WGSL,
      vs: COMPARISON_SAMPLE_VS_GLSL,
      fs: COMPARISON_SAMPLE_FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 6,
      bindings: {
        app: uniformStore.getManagedUniformBuffer('app'),
        uDepthTexture: this.depthTexture
      }
    });
  }

  private renderDepthTexture(device: Device): void {
    const depthPass = device.beginRenderPass({
      framebuffer: this.depthFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });
    this.depthWriteModel.draw(depthPass);
    depthPass.end();
  }

  private updateUniforms(): void {
    const uvTransform: Vec4 = [
      this.settings.uvScale,
      0,
      this.settings.uvOffsetU,
      this.settings.uvOffsetV
    ];
    const magnifiedOptions: Vec4 = [
      0,
      this.settings.zoom,
      this.settings.tilt,
      this.settings.reference
    ];
    const recedingOptions: Vec4 = [
      1,
      this.settings.zoom,
      this.settings.tilt,
      this.settings.reference
    ];
    this.magnifiedUniformStore.setUniforms({
      app: {rect: MAGNIFIED_RECT, uvTransform, options: magnifiedOptions}
    });
    this.recedingUniformStore.setUniforms({
      app: {rect: RECEDING_RECT, uvTransform, options: recedingOptions}
    });
    this.comparisonMagnifiedUniformStore.setUniforms({
      app: {rect: MAGNIFIED_RECT, uvTransform, options: magnifiedOptions}
    });
    this.comparisonRecedingUniformStore.setUniforms({
      app: {rect: RECEDING_RECT, uvTransform, options: recedingOptions}
    });
  }

  private async applyColorSampler(): Promise<void> {
    const texture = this.colorTexture;
    await texture.ready;
    if (texture !== this.colorTexture) {
      return;
    }
    const nextSampler = this.device.createSampler(
      makeColorSamplerProps(this.settings, this.device)
    );
    texture.setSampler(nextSampler);
    this.colorMagnifiedModel.setBindings({uTexture: texture});
    this.colorRecedingModel.setBindings({uTexture: texture});
    const previousSampler = this.activeColorSampler;
    this.activeColorSampler = nextSampler;
    previousSampler?.destroy();
  }

  private applyComparisonSampler(): void {
    const nextSampler = this.device.createSampler(makeComparisonSamplerProps(this.settings));
    this.depthTexture.setSampler(nextSampler);
    this.comparisonMagnifiedModel.setBindings({uDepthTexture: this.depthTexture});
    this.comparisonRecedingModel.setBindings({uDepthTexture: this.depthTexture});
    const previousSampler = this.activeComparisonSampler;
    this.activeComparisonSampler = nextSampler;
    previousSampler?.destroy();
  }

  private recreateColorTexture(): void {
    const previousTexture = this.colorTexture;
    const previousSampler = this.activeColorSampler;
    this.activeColorSampler = null;
    const nextTexture = this.makeColorTexture(this.settings.mipChain);
    this.colorTexture = nextTexture;
    this.colorMagnifiedModel.setBindings({uTexture: nextTexture});
    this.colorRecedingModel.setBindings({uTexture: nextTexture});
    void nextTexture.ready.then(() => {
      if (nextTexture !== this.colorTexture) {
        nextTexture.destroy();
        return;
      }
      previousSampler?.destroy();
      previousTexture.destroy();
      void this.applyColorSampler();
    });
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'texture-sampling-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'texture-sampling-status',
          title: '',
          html: makeStatusHtml(this.device, this.settings)
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private syncPanel(): void {
    this.settingsPanel.setSchemaAndSettings(
      makeSettingsSchema(this.device, this.settings),
      toSettingsState(this.settings)
    );
    this.panels.setPanel(this.makePanel());
  }

  private readonly handleSettingsChange = (
    nextSettings: SettingsState,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const previousMipChain = this.settings.mipChain;
    const presetChange = getChangedSetting(changedSettings, 'preset')?.nextValue;
    if (isTexturePreset(presetChange) && presetChange !== 'custom') {
      this.settings = normalizeSettings(
        {
          ...this.settings,
          ...PRESETS[presetChange],
          preset: presetChange
        },
        this.device
      );
    } else {
      this.settings = readSettings(nextSettings, this.settings, this.device);
      if (changedSettings?.some(change => change.name !== 'preset')) {
        this.settings.preset = 'custom';
      }
    }

    if (this.settings.mipChain !== previousMipChain) {
      this.recreateColorTexture();
    } else {
      void this.applyColorSampler();
    }
    this.applyComparisonSampler();
    this.syncPanel();
  };
}

function makeSettingsSchema(device: Device, settings: TextureSamplingSettings): SettingsSchema {
  const isColor = settings.sampleMode === 'color-texture';
  const hasMipmaps = isColor && settings.mipChain === 'generated';
  const commonSettings = [
    {
      name: 'sampleMode',
      label: 'Sample mode',
      group: 'Scene',
      type: 'select' as const,
      options: [
        {label: 'Color texture', value: 'color-texture'},
        {label: 'Depth comparison', value: 'depth-comparison'}
      ],
      defaultValue: DEFAULT_SETTINGS.sampleMode
    },
    makeRangeSetting('uvScale', 'UV scale', 'Scene', 0.25, 16, 0.25, DEFAULT_SETTINGS.uvScale),
    makeRangeSetting('uvOffsetU', 'UV offset U', 'Scene', -2, 2, 0.05, 0),
    makeRangeSetting('uvOffsetV', 'UV offset V', 'Scene', -2, 2, 0.05, 0),
    makeRangeSetting('zoom', 'Zoom', 'Scene', 0.25, 4, 0.05, DEFAULT_SETTINGS.zoom),
    makeRangeSetting('tilt', 'Perspective tilt', 'Scene', 0, 1, 0.01, DEFAULT_SETTINGS.tilt)
  ];
  const samplingSettings = [
    makeSelectSetting(
      'addressModeU',
      'Address U',
      'Sampler',
      getSupportedAddressModes(device),
      DEFAULT_SETTINGS.addressModeU
    ),
    makeSelectSetting(
      'addressModeV',
      'Address V',
      'Sampler',
      getSupportedAddressModes(device),
      DEFAULT_SETTINGS.addressModeV
    ),
    makeSelectSetting(
      'magFilter',
      'Mag filter',
      'Sampler',
      FILTER_MODES,
      DEFAULT_SETTINGS.magFilter
    ),
    makeSelectSetting(
      'minFilter',
      'Min filter',
      'Sampler',
      FILTER_MODES,
      DEFAULT_SETTINGS.minFilter
    )
  ];
  const modeSettings = isColor
    ? [
        {
          name: 'preset',
          label: 'Preset',
          group: 'Color texture',
          type: 'select' as const,
          options: [
            {label: 'Nearest pixels', value: 'nearest-pixels'},
            {label: 'Bilinear', value: 'bilinear'},
            {label: 'Trilinear mipmaps', value: 'trilinear'},
            {label: 'Anisotropic', value: 'anisotropic'},
            {label: 'Custom', value: 'custom'}
          ],
          defaultValue: DEFAULT_SETTINGS.preset
        },
        {
          name: 'mipChain',
          label: 'Mip chain',
          group: 'Color texture',
          type: 'select' as const,
          options: [
            {label: 'Generated', value: 'generated'},
            {label: 'Single level', value: 'single-level'}
          ],
          defaultValue: DEFAULT_SETTINGS.mipChain
        },
        ...(hasMipmaps
          ? [
              makeSelectSetting(
                'mipmapFilter',
                'Mipmap filter',
                'Sampler',
                MIPMAP_FILTERS,
                DEFAULT_SETTINGS.mipmapFilter
              ),
              makeRangeSetting('lodMinClamp', 'Minimum LOD', 'Sampler', 0, MAX_MIP_LEVEL, 0.25, 0),
              makeRangeSetting(
                'lodMaxClamp',
                'Maximum LOD',
                'Sampler',
                0,
                MAX_MIP_LEVEL,
                0.25,
                MAX_MIP_LEVEL
              )
            ]
          : []),
        {
          name: 'maxAnisotropy',
          label: 'Max anisotropy',
          group: 'Sampler',
          type: 'select' as const,
          options: getAnisotropyOptions(device, hasMipmaps),
          defaultValue: 1
        }
      ]
    : [
        makeSelectSetting(
          'compare',
          'Compare function',
          'Depth comparison',
          COMPARE_FUNCTIONS,
          DEFAULT_SETTINGS.compare
        ),
        makeRangeSetting(
          'reference',
          'Reference depth',
          'Depth comparison',
          0,
          1,
          0.01,
          DEFAULT_SETTINGS.reference
        )
      ];
  return {
    title: 'Texture sampling',
    sections: [
      {
        id: 'texture-sampling',
        name: '',
        initiallyCollapsed: false,
        settings: [...commonSettings, ...modeSettings, ...samplingSettings]
      }
    ]
  };
}

function makeRangeSetting(
  name: string,
  label: string,
  group: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number
) {
  return {name, label, group, type: 'number' as const, min, max, step, defaultValue};
}

function makeSelectSetting(
  name: string,
  label: string,
  group: string,
  values: readonly string[],
  defaultValue: string
) {
  return {
    name,
    label,
    group,
    type: 'select' as const,
    options: values.map(value => ({label: value, value})),
    defaultValue
  };
}

function getAnisotropyOptions(device: Device, hasMipmaps: boolean): SettingOption[] {
  const values = hasMipmaps ? getSupportedAnisotropyValues(device) : [1];
  return values.map(value => ({label: String(value), value}));
}

function getSupportedAnisotropyValues(device: Device): number[] {
  if (device.type === 'webgpu') {
    return ANISOTROPY_VALUES;
  }
  if (!device.features.has('texture-filterable-anisotropic-webgl')) {
    return [1];
  }
  const gl = device.handle;
  if (!(gl instanceof WebGL2RenderingContext)) {
    return [1];
  }
  const anisotropyExtension = gl.getExtension('EXT_texture_filter_anisotropic');
  if (!anisotropyExtension) {
    return [1];
  }
  const maxAnisotropy = Number(gl.getParameter(anisotropyExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
  const values = ANISOTROPY_VALUES.filter(value => value <= maxAnisotropy);
  return values.length > 0 ? values : [1];
}

function makeColorSamplerProps(settings: TextureSamplingSettings, device: Device): SamplerProps {
  const normalized = normalizeSettings(settings, device);
  return {
    addressModeU: normalized.addressModeU,
    addressModeV: normalized.addressModeV,
    magFilter: normalized.magFilter,
    minFilter: normalized.minFilter,
    mipmapFilter: normalized.mipChain === 'generated' ? normalized.mipmapFilter : 'none',
    lodMinClamp: normalized.mipChain === 'generated' ? normalized.lodMinClamp : 0,
    lodMaxClamp: normalized.mipChain === 'generated' ? normalized.lodMaxClamp : 0,
    maxAnisotropy: normalized.maxAnisotropy
  };
}

function makeComparisonSamplerProps(settings: TextureSamplingSettings): SamplerProps {
  return {
    type: 'comparison-sampler',
    addressModeU: settings.addressModeU,
    addressModeV: settings.addressModeV,
    magFilter: settings.magFilter,
    minFilter: settings.minFilter,
    mipmapFilter: 'none',
    compare: settings.compare,
    maxAnisotropy: 1
  };
}

function readSettings(
  state: SettingsState,
  previous: TextureSamplingSettings,
  device: Device
): TextureSamplingSettings {
  return normalizeSettings(
    {
      ...previous,
      sampleMode: readSampleMode(state.sampleMode, previous.sampleMode),
      preset: readTexturePreset(state.preset, previous.preset),
      mipChain: readMipChain(state.mipChain, previous.mipChain),
      addressModeU: readAddressMode(state.addressModeU, previous.addressModeU, device),
      addressModeV: readAddressMode(state.addressModeV, previous.addressModeV, device),
      magFilter: readFilterMode(state.magFilter, previous.magFilter),
      minFilter: readFilterMode(state.minFilter, previous.minFilter),
      mipmapFilter: readMipmapFilter(state.mipmapFilter, previous.mipmapFilter),
      lodMinClamp: readNumber(state.lodMinClamp, previous.lodMinClamp),
      lodMaxClamp: readNumber(state.lodMaxClamp, previous.lodMaxClamp),
      maxAnisotropy: readNumber(state.maxAnisotropy, previous.maxAnisotropy),
      uvScale: readNumber(state.uvScale, previous.uvScale),
      uvOffsetU: readNumber(state.uvOffsetU, previous.uvOffsetU),
      uvOffsetV: readNumber(state.uvOffsetV, previous.uvOffsetV),
      zoom: readNumber(state.zoom, previous.zoom),
      tilt: readNumber(state.tilt, previous.tilt),
      compare: readCompareFunction(state.compare, previous.compare),
      reference: readNumber(state.reference, previous.reference)
    },
    device
  );
}

function normalizeSettings(
  settings: TextureSamplingSettings,
  device: Device
): TextureSamplingSettings {
  const next = cloneSettings(settings);
  const supportedAddressModes = getSupportedAddressModes(device);
  if (!supportedAddressModes.includes(next.addressModeU)) {
    next.addressModeU = 'clamp-to-edge';
  }
  if (!supportedAddressModes.includes(next.addressModeV)) {
    next.addressModeV = 'clamp-to-edge';
  }
  next.uvScale = clamp(next.uvScale, 0.25, 16);
  next.uvOffsetU = clamp(next.uvOffsetU, -2, 2);
  next.uvOffsetV = clamp(next.uvOffsetV, -2, 2);
  next.zoom = clamp(next.zoom, 0.25, 4);
  next.tilt = clamp(next.tilt, 0, 1);
  next.reference = clamp(next.reference, 0, 1);
  next.lodMinClamp = clamp(next.lodMinClamp, 0, MAX_MIP_LEVEL);
  next.lodMaxClamp = clamp(next.lodMaxClamp, next.lodMinClamp, MAX_MIP_LEVEL);
  if (next.mipChain === 'single-level') {
    next.mipmapFilter = 'none';
  }
  const anisotropyValues =
    next.mipChain === 'generated' ? getSupportedAnisotropyValues(device) : [1];
  const supportedAnisotropyValues = anisotropyValues.filter(value => value <= next.maxAnisotropy);
  next.maxAnisotropy = supportedAnisotropyValues[supportedAnisotropyValues.length - 1] ?? 1;
  if (next.maxAnisotropy > 1) {
    next.magFilter = 'linear';
    next.minFilter = 'linear';
    next.mipmapFilter = next.mipChain === 'generated' ? 'linear' : 'none';
  }
  if (next.mipmapFilter === 'none') {
    next.lodMinClamp = 0;
    next.lodMaxClamp = 0;
  }
  return next;
}

function toSettingsState(settings: TextureSamplingSettings): SettingsState {
  return {...settings};
}

function readSampleMode(value: unknown, fallback: SampleMode): SampleMode {
  return value === 'color-texture' || value === 'depth-comparison' ? value : fallback;
}

function readTexturePreset(value: unknown, fallback: TexturePreset): TexturePreset {
  return isTexturePreset(value) ? value : fallback;
}

function isTexturePreset(value: unknown): value is TexturePreset {
  return (
    value === 'nearest-pixels' ||
    value === 'bilinear' ||
    value === 'trilinear' ||
    value === 'anisotropic' ||
    value === 'custom'
  );
}

function readMipChain(value: unknown, fallback: MipChain): MipChain {
  return value === 'generated' || value === 'single-level' ? value : fallback;
}

function readAddressMode(value: unknown, fallback: AddressMode, device: Device): AddressMode {
  return typeof value === 'string' &&
    getSupportedAddressModes(device).includes(value as AddressMode)
    ? (value as AddressMode)
    : fallback;
}

/** Returns portable modes plus the WebGL-only extension mode when the device exposes it. */
function getSupportedAddressModes(device: Device): AddressMode[] {
  return device.type === 'webgl' && device.features.has('texture-mirror-clamp-to-edge-webgl')
    ? [...PORTABLE_ADDRESS_MODES, 'mirror-clamp-to-edge-webgl']
    : PORTABLE_ADDRESS_MODES;
}

function readFilterMode(value: unknown, fallback: FilterMode): FilterMode {
  return typeof value === 'string' && FILTER_MODES.includes(value as FilterMode)
    ? (value as FilterMode)
    : fallback;
}

function readMipmapFilter(value: unknown, fallback: MipmapFilter): MipmapFilter {
  return typeof value === 'string' && MIPMAP_FILTERS.includes(value as MipmapFilter)
    ? (value as MipmapFilter)
    : fallback;
}

function readCompareFunction(value: unknown, fallback: CompareFunction): CompareFunction {
  return typeof value === 'string' && COMPARE_FUNCTIONS.includes(value as CompareFunction)
    ? (value as CompareFunction)
    : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneSettings(settings: TextureSamplingSettings): TextureSamplingSettings {
  return {...settings};
}

function makeDiagnosticTextureData(size: number): {
  data: Uint8Array;
  width: number;
  height: number;
} {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
      const stripe = (x + y) % 16 < 8;
      const quadrantX = x < size / 2 ? 0 : 1;
      const quadrantY = y < size / 2 ? 0 : 1;
      const border = x % 64 < 3 || y % 64 < 3;
      const fineDetail = x % 4 < 2 !== y % 4 < 2;
      const base = checker ? 224 : 28;
      const red = quadrantX ? base : stripe ? 240 : 40;
      const green = quadrantY ? base : fineDetail ? 210 : 55;
      const blue = quadrantX === quadrantY ? base : stripe ? 48 : 220;
      data[index] = border ? 255 : red;
      data[index + 1] = border ? 255 : green;
      data[index + 2] = border ? 255 : blue;
      data[index + 3] = 255;
    }
  }
  return {data, width: size, height: size};
}

function makeStatusHtml(device: Device, settings: TextureSamplingSettings): string {
  const isColor = settings.sampleMode === 'color-texture';
  const sampler = isColor
    ? makeColorSamplerProps(settings, device)
    : makeComparisonSamplerProps(settings);
  const notes = [
    '<b>Left:</b> magnified flat quad. <b>Right:</b> receding minified plane.',
    `Backend: <code>${escapeHtml(device.type)}${device.info.featureLevel ? ` (${device.info.featureLevel})` : ''}</code>.`,
    'addressModeW is not applicable because this example samples 2D textures.'
  ];
  if (settings.sampleMode === 'depth-comparison') {
    notes.push(
      'Depth comparison uses a single-level depth24plus texture; mipmap and anisotropy controls are intentionally unavailable.'
    );
  } else if (settings.mipChain === 'single-level') {
    notes.push('Single-level allocation forces mipmapFilter to none and both LOD clamps to 0.');
  } else if (settings.mipmapFilter === 'none') {
    notes.push('No mipmap filtering forces both LOD clamps to 0.');
  }
  if (device.type === 'webgl' && !device.features.has('texture-filterable-anisotropic-webgl')) {
    notes.push('EXT_texture_filter_anisotropic is unavailable; maxAnisotropy is fixed at 1.');
  }
  if (device.type === 'webgl' && device.features.has('texture-mirror-clamp-to-edge-webgl')) {
    notes.push(
      'EXT_texture_mirror_clamp_to_edge adds the mirror-clamp-to-edge-webgl address mode.'
    );
  }
  return `
    <p style="margin:0 0 8px"><b>Texture sampling playground</b></p>
    <p style="margin:0 0 8px">${notes.join('<br/>')}</p>
    <pre style="margin:0;max-height:180px;overflow:auto;font-size:11px;white-space:pre-wrap">${escapeHtml(
      JSON.stringify(sampler, null, 2)
    )}</pre>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
