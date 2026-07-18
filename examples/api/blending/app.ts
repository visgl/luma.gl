// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Texture,
  UniformStore,
  type BlendFactor,
  type BlendOperation,
  type Device,
  type Framebuffer,
  type RenderPipelineParameters,
  type Texture as TextureResource
} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps, Model} from '@luma.gl/engine';
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

export const title = 'Blending';
export const description = 'Experiment with luma.gl color and alpha blending state.';

type Color = [number, number, number, number];
type BlendPreset =
  | 'straight-alpha'
  | 'premultiplied-alpha'
  | 'additive'
  | 'multiply'
  | 'screen'
  | 'subtractive'
  | 'custom';

type BlendSettings = {
  preset: BlendPreset;
  blend: boolean;
  blendColorOperation: BlendOperation;
  blendColorSrcFactor: BlendFactor;
  blendColorDstFactor: BlendFactor;
  blendAlphaOperation: BlendOperation;
  blendAlphaSrcFactor: BlendFactor;
  blendAlphaDstFactor: BlendFactor;
  blendConstant: Color;
  sourceColor: Color;
  destinationColor: Color;
  colorMaskRed: boolean;
  colorMaskGreen: boolean;
  colorMaskBlue: boolean;
  colorMaskAlpha: boolean;
  swapDrawOrder: boolean;
};

type SolidUniforms = {
  rect: Color;
  color: Color;
};

type DisplayUniforms = {
  rect: Color;
  options: Color;
};

const OFFSCREEN_SIZE = 512;
const SOURCE_RECT: Color = [0.18, 0.12, 1.15, 1.05];
const DESTINATION_RECT: Color = [-0.18, -0.1, 1.15, 1.05];
const RGB_DISPLAY_RECT: Color = [0.5, 0, 0.92, 1.55];
const ALPHA_DISPLAY_RECT: Color = [-0.5, 0, 0.92, 1.55];

const BLEND_OPERATIONS: BlendOperation[] = ['add', 'subtract', 'reverse-subtract', 'min', 'max'];
const BLEND_FACTORS: BlendFactor[] = [
  'zero',
  'one',
  'src',
  'one-minus-src',
  'src-alpha',
  'one-minus-src-alpha',
  'dst',
  'one-minus-dst',
  'dst-alpha',
  'one-minus-dst-alpha',
  'src-alpha-saturated',
  'constant',
  'one-minus-constant',
  'src1',
  'one-minus-src1',
  'src1-alpha',
  'one-minus-src1-alpha'
];
const ALPHA_BLEND_FACTORS = new Set<BlendFactor>([
  'zero',
  'one',
  'src-alpha',
  'one-minus-src-alpha',
  'dst-alpha',
  'one-minus-dst-alpha',
  'constant',
  'one-minus-constant',
  'src1-alpha',
  'one-minus-src1-alpha'
]);
const DUAL_SOURCE_FACTORS = new Set<BlendFactor>([
  'src1',
  'one-minus-src1',
  'src1-alpha',
  'one-minus-src1-alpha'
]);

const DEFAULT_SETTINGS: BlendSettings = {
  preset: 'straight-alpha',
  blend: true,
  blendColorOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaOperation: 'add',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha',
  blendConstant: [0.5, 0.5, 0.5, 0.5],
  sourceColor: [0.95, 0.25, 0.15, 0.65],
  destinationColor: [0.1, 0.45, 0.95, 1],
  colorMaskRed: true,
  colorMaskGreen: true,
  colorMaskBlue: true,
  colorMaskAlpha: true,
  swapDrawOrder: false
};

const PRESETS: Record<Exclude<BlendPreset, 'custom'>, Partial<BlendSettings>> = {
  'straight-alpha': {
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'src-alpha',
    blendColorDstFactor: 'one-minus-src-alpha',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  },
  'premultiplied-alpha': {
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one-minus-src-alpha',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  },
  additive: {
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'src-alpha',
    blendColorDstFactor: 'one',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one'
  },
  multiply: {
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'dst',
    blendColorDstFactor: 'zero',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  },
  screen: {
    blend: true,
    blendColorOperation: 'add',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one-minus-src',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  },
  subtractive: {
    blend: true,
    blendColorOperation: 'reverse-subtract',
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one',
    blendAlphaOperation: 'add',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  }
};

const SOLID_MODULE = {
  uniformTypes: {
    rect: 'vec4<f32>',
    color: 'vec4<f32>'
  }
} as const;

const DISPLAY_MODULE = {
  uniformTypes: {
    rect: 'vec4<f32>',
    options: 'vec4<f32>'
  }
} as const;

const SOLID_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
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
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(app.rect.xy + localPosition * app.rect.zw, 0.0, 1.0);
  return outputs;
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return app.color;
}
`;

const DUAL_SOURCE_SOLID_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
};

struct FragmentOutputs {
  @location(0) @blend_src(0) color: vec4<f32>,
  @location(0) @blend_src(1) secondaryColor: vec4<f32>,
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
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(app.rect.xy + localPosition * app.rect.zw, 0.0, 1.0);
  return outputs;
}

@fragment
fn fragmentMain() -> FragmentOutputs {
  var outputs: FragmentOutputs;
  outputs.color = app.color;
  outputs.secondaryColor = vec4<f32>(vec3<f32>(1.0) - app.color.rgb, app.color.a);
  return outputs;
}
`;

const SOLID_VS_GLSL = /* glsl */ `#version 300 es
uniform appUniforms {
  vec4 rect;
  vec4 color;
} app;

const vec2 POSITIONS[6] = vec2[6](
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, 0.5),
  vec2(-0.5, 0.5),
  vec2(0.5, -0.5),
  vec2(0.5, 0.5)
);

void main(void) {
  gl_Position = vec4(app.rect.xy + POSITIONS[gl_VertexID] * app.rect.zw, 0.0, 1.0);
}
`;

const SOLID_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform appUniforms {
  vec4 rect;
  vec4 color;
} app;

out vec4 fragColor;

void main(void) {
  fragColor = app.color;
}
`;

const DISPLAY_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
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
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(app.rect.xy + localPosition * app.rect.zw, 0.0, 1.0);
  outputs.uv = localPosition + vec2<f32>(0.5);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let color = textureSample(uTexture, uTextureSampler, vec2<f32>(inputs.uv.x, 1.0 - inputs.uv.y));
  if (app.options.x > 0.5) {
    return vec4<f32>(vec3<f32>(color.a), 1.0);
  }
  let checkerIndex = floor(inputs.uv.x * 12.0) + floor(inputs.uv.y * 12.0);
  let checker = select(vec3<f32>(0.18), vec3<f32>(0.42), fract(checkerIndex * 0.5) > 0.25);
  return vec4<f32>(mix(checker, color.rgb, color.a), 1.0);
}
`;

const DISPLAY_VS_GLSL = /* glsl */ `#version 300 es
uniform appUniforms {
  vec4 rect;
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
  gl_Position = vec4(app.rect.xy + localPosition * app.rect.zw, 0.0, 1.0);
  vUV = localPosition + vec2(0.5);
}
`;

const DISPLAY_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform appUniforms {
  vec4 rect;
  vec4 options;
} app;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  vec4 color = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  if (app.options.x > 0.5) {
    fragColor = vec4(vec3(color.a), 1.0);
    return;
  }
  float checkerIndex = floor(vUV.x * 12.0) + floor(vUV.y * 12.0);
  vec3 checker = fract(checkerIndex * 0.5) > 0.25 ? vec3(0.42) : vec3(0.18);
  fragColor = vec4(mix(checker, color.rgb, color.a), 1.0);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly device: Device;
  readonly offscreenTexture: TextureResource;
  readonly framebuffer: Framebuffer;
  readonly destinationUniformStore: UniformStore<{app: SolidUniforms}>;
  readonly sourceUniformStore: UniformStore<{app: SolidUniforms}>;
  readonly rgbDisplayUniformStore: UniformStore<{app: DisplayUniforms}>;
  readonly alphaDisplayUniformStore: UniformStore<{app: DisplayUniforms}>;
  readonly destinationModel: Model;
  sourceModel: Model;
  readonly rgbDisplayModel: Model;
  readonly alphaDisplayModel: Model;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  settings: BlendSettings = cloneSettings(DEFAULT_SETTINGS);
  private sourceModelUsesDualSource = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.offscreenTexture = device.createTexture({
      id: 'blending-result',
      width: OFFSCREEN_SIZE,
      height: OFFSCREEN_SIZE,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.RENDER,
      sampler: {minFilter: 'linear', magFilter: 'linear'}
    });
    this.framebuffer = device.createFramebuffer({
      id: 'blending-result-framebuffer',
      width: OFFSCREEN_SIZE,
      height: OFFSCREEN_SIZE,
      colorAttachments: [this.offscreenTexture]
    });

    this.destinationUniformStore = new UniformStore(device, {app: SOLID_MODULE});
    this.sourceUniformStore = new UniformStore(device, {app: SOLID_MODULE});
    this.rgbDisplayUniformStore = new UniformStore(device, {app: DISPLAY_MODULE});
    this.alphaDisplayUniformStore = new UniformStore(device, {app: DISPLAY_MODULE});

    this.destinationModel = this.makeSolidModel(
      'blending-destination',
      this.destinationUniformStore,
      false
    );
    this.sourceModel = this.makeSolidModel('blending-source', this.sourceUniformStore, false);
    this.rgbDisplayModel = this.makeDisplayModel(
      'blending-rgb-display',
      this.rgbDisplayUniformStore
    );
    this.alphaDisplayModel = this.makeDisplayModel(
      'blending-alpha-display',
      this.alphaDisplayUniformStore
    );

    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'blending-settings',
      schema: makeSettingsSchema(this.device),
      settings: toSettingsState(this.settings),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.applySettings();
  }

  onFinalize(): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.destinationModel.destroy();
    this.sourceModel.destroy();
    this.rgbDisplayModel.destroy();
    this.alphaDisplayModel.destroy();
    this.destinationUniformStore.destroy();
    this.sourceUniformStore.destroy();
    this.rgbDisplayUniformStore.destroy();
    this.alphaDisplayUniformStore.destroy();
    this.framebuffer.destroy();
    this.offscreenTexture.destroy();
  }

  onRender({device}: AnimationProps): void {
    this.updateUniforms();

    const offscreenPass = device.beginRenderPass({
      framebuffer: this.framebuffer,
      clearColor: [0, 0, 0, 0]
    });
    this.destinationModel.draw(offscreenPass);
    offscreenPass.setParameters({blendConstant: this.settings.blendConstant});
    this.sourceModel.draw(offscreenPass);
    offscreenPass.end();

    const screenPass = device.beginRenderPass({clearColor: [0.035, 0.04, 0.06, 1]});
    this.rgbDisplayModel.draw(screenPass);
    this.alphaDisplayModel.draw(screenPass);
    screenPass.end();
  }

  private makeSolidModel(
    id: string,
    uniformStore: UniformStore<{app: SolidUniforms}>,
    dualSource: boolean
  ): Model {
    return new Model(this.device, {
      id,
      source: dualSource ? DUAL_SOURCE_SOLID_WGSL : SOLID_WGSL,
      vs: SOLID_VS_GLSL,
      fs: SOLID_FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 6,
      bindings: {app: uniformStore.getManagedUniformBuffer('app')},
      parameters: {blend: false}
    });
  }

  private makeDisplayModel(id: string, uniformStore: UniformStore<{app: DisplayUniforms}>): Model {
    return new Model(this.device, {
      id,
      source: DISPLAY_WGSL,
      vs: DISPLAY_VS_GLSL,
      fs: DISPLAY_FS_GLSL,
      topology: 'triangle-list',
      vertexCount: 6,
      bindings: {
        app: uniformStore.getManagedUniformBuffer('app'),
        uTexture: this.offscreenTexture
      },
      parameters: {blend: false}
    });
  }

  private updateUniforms(): void {
    const destinationColor = this.settings.swapDrawOrder
      ? this.settings.sourceColor
      : this.settings.destinationColor;
    const sourceColor = this.settings.swapDrawOrder
      ? this.settings.destinationColor
      : this.settings.sourceColor;
    this.destinationUniformStore.setUniforms({
      app: {rect: DESTINATION_RECT, color: destinationColor}
    });
    this.sourceUniformStore.setUniforms({app: {rect: SOURCE_RECT, color: sourceColor}});
    this.rgbDisplayUniformStore.setUniforms({
      app: {rect: RGB_DISPLAY_RECT, options: [0, 0, 0, 0]}
    });
    this.alphaDisplayUniformStore.setUniforms({
      app: {rect: ALPHA_DISPLAY_RECT, options: [1, 0, 0, 0]}
    });
  }

  private applySettings(): void {
    const usesDualSource = this.usesDualSourceFactors();
    if (usesDualSource !== this.sourceModelUsesDualSource) {
      this.sourceModel.destroy();
      this.sourceModel = this.makeSolidModel(
        'blending-source',
        this.sourceUniformStore,
        usesDualSource
      );
      this.sourceModelUsesDualSource = usesDualSource;
    }
    this.sourceModel.setParameters(makeBlendParameters(this.settings));
  }

  private usesDualSourceFactors(): boolean {
    return (
      supportsDualSourceBlending(this.device) &&
      [
        this.settings.blendColorSrcFactor,
        this.settings.blendColorDstFactor,
        this.settings.blendAlphaSrcFactor,
        this.settings.blendAlphaDstFactor
      ].some(factor => DUAL_SOURCE_FACTORS.has(factor))
    );
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'blending-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'blending-status',
          title: '',
          html: makeStatusHtml(this.device, this.settings)
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private syncPanel(): void {
    this.settingsPanel.setSchemaAndSettings(
      makeSettingsSchema(this.device),
      toSettingsState(this.settings)
    );
    this.panels.setPanel(this.makePanel());
  }

  private readonly handleSettingsChange = (
    nextSettings: SettingsState,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const presetChange = getChangedSetting(changedSettings, 'preset')?.nextValue;
    if (isPreset(presetChange) && presetChange !== 'custom') {
      this.settings = {
        ...this.settings,
        ...PRESETS[presetChange],
        preset: presetChange
      };
    } else {
      this.settings = readSettings(nextSettings, this.settings, this.device);
      if (changedSettings?.some(change => change.name !== 'preset')) {
        this.settings.preset = 'custom';
      }
    }
    this.applySettings();
    this.syncPanel();
  };
}

function makeBlendParameters(settings: BlendSettings): RenderPipelineParameters {
  return {
    blend: settings.blend,
    blendColorOperation: settings.blendColorOperation,
    blendColorSrcFactor: settings.blendColorSrcFactor,
    blendColorDstFactor: settings.blendColorDstFactor,
    blendAlphaOperation: settings.blendAlphaOperation,
    blendAlphaSrcFactor: settings.blendAlphaSrcFactor,
    blendAlphaDstFactor: settings.blendAlphaDstFactor,
    colorMask:
      (settings.colorMaskRed ? 1 : 0) |
      (settings.colorMaskGreen ? 2 : 0) |
      (settings.colorMaskBlue ? 4 : 0) |
      (settings.colorMaskAlpha ? 8 : 0)
  };
}

function makeSettingsSchema(device: Device): SettingsSchema {
  const colorFactorOptions = makeBlendFactorOptions(device, false);
  const alphaFactorOptions = makeBlendFactorOptions(device, true);
  const operationOptions = BLEND_OPERATIONS.map(operation => ({
    label: operation,
    value: operation
  }));
  const colorSettings = [
    makeNumberSetting('sourceColorR', 'Source red', 'Colors'),
    makeNumberSetting('sourceColorG', 'Source green', 'Colors'),
    makeNumberSetting('sourceColorB', 'Source blue', 'Colors'),
    makeNumberSetting('sourceColorA', 'Source alpha', 'Colors'),
    makeNumberSetting('destinationColorR', 'Destination red', 'Colors'),
    makeNumberSetting('destinationColorG', 'Destination green', 'Colors'),
    makeNumberSetting('destinationColorB', 'Destination blue', 'Colors'),
    makeNumberSetting('destinationColorA', 'Destination alpha', 'Colors')
  ];
  return {
    title: 'Blend settings',
    sections: [
      {
        id: 'blending',
        name: '',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'preset',
            label: 'Preset',
            group: 'Blend',
            type: 'select',
            options: [
              {label: 'Straight alpha', value: 'straight-alpha'},
              {label: 'Premultiplied alpha', value: 'premultiplied-alpha'},
              {label: 'Additive', value: 'additive'},
              {label: 'Multiply', value: 'multiply'},
              {label: 'Screen', value: 'screen'},
              {label: 'Subtractive', value: 'subtractive'},
              {label: 'Custom', value: 'custom'}
            ],
            defaultValue: DEFAULT_SETTINGS.preset
          },
          {
            name: 'blend',
            label: 'Enable blending',
            group: 'Blend',
            type: 'boolean',
            defaultValue: DEFAULT_SETTINGS.blend
          },
          {
            name: 'blendColorOperation',
            label: 'Color operation',
            group: 'Color equation',
            type: 'select',
            options: operationOptions,
            defaultValue: DEFAULT_SETTINGS.blendColorOperation
          },
          {
            name: 'blendColorSrcFactor',
            label: 'Color source factor',
            group: 'Color equation',
            type: 'select',
            options: colorFactorOptions,
            defaultValue: DEFAULT_SETTINGS.blendColorSrcFactor
          },
          {
            name: 'blendColorDstFactor',
            label: 'Color destination factor',
            group: 'Color equation',
            type: 'select',
            options: colorFactorOptions,
            defaultValue: DEFAULT_SETTINGS.blendColorDstFactor
          },
          {
            name: 'blendAlphaOperation',
            label: 'Alpha operation',
            group: 'Alpha equation',
            type: 'select',
            options: operationOptions,
            defaultValue: DEFAULT_SETTINGS.blendAlphaOperation
          },
          {
            name: 'blendAlphaSrcFactor',
            label: 'Alpha source factor',
            group: 'Alpha equation',
            type: 'select',
            options: alphaFactorOptions,
            defaultValue: DEFAULT_SETTINGS.blendAlphaSrcFactor
          },
          {
            name: 'blendAlphaDstFactor',
            label: 'Alpha destination factor',
            group: 'Alpha equation',
            type: 'select',
            options: alphaFactorOptions,
            defaultValue: DEFAULT_SETTINGS.blendAlphaDstFactor
          },
          makeNumberSetting('blendConstantR', 'Constant red', 'Blend constant'),
          makeNumberSetting('blendConstantG', 'Constant green', 'Blend constant'),
          makeNumberSetting('blendConstantB', 'Constant blue', 'Blend constant'),
          makeNumberSetting('blendConstantA', 'Constant alpha', 'Blend constant'),
          ...colorSettings,
          {
            name: 'swapDrawOrder',
            label: 'Swap source/destination',
            group: 'Scene',
            type: 'boolean',
            defaultValue: DEFAULT_SETTINGS.swapDrawOrder
          },
          {
            name: 'colorMaskRed',
            label: 'Write red',
            group: 'Color mask',
            type: 'boolean',
            defaultValue: true
          },
          {
            name: 'colorMaskGreen',
            label: 'Write green',
            group: 'Color mask',
            type: 'boolean',
            defaultValue: true
          },
          {
            name: 'colorMaskBlue',
            label: 'Write blue',
            group: 'Color mask',
            type: 'boolean',
            defaultValue: true
          },
          {
            name: 'colorMaskAlpha',
            label: 'Write alpha',
            group: 'Color mask',
            type: 'boolean',
            defaultValue: true
          }
        ]
      }
    ]
  };
}

function makeNumberSetting(name: string, label: string, group: string) {
  return {
    name,
    label,
    group,
    type: 'number' as const,
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.5
  };
}

function makeBlendFactorOptions(device: Device, alpha: boolean): SettingOption[] {
  return BLEND_FACTORS.filter(factor => !alpha || ALPHA_BLEND_FACTORS.has(factor))
    .filter(factor => !DUAL_SOURCE_FACTORS.has(factor) || supportsDualSourceBlending(device))
    .map(factor => ({
      label: factor,
      value: factor,
      description: DUAL_SOURCE_FACTORS.has(factor)
        ? 'Uses the complementary secondary source emitted by the WebGPU shader.'
        : undefined
    }));
}

function supportsDualSourceBlending(device: Device): boolean {
  return device.type === 'webgpu' && device.features.has('dual-source-blending');
}

function readSettings(
  state: SettingsState,
  previous: BlendSettings,
  device: Device
): BlendSettings {
  const next: BlendSettings = {
    ...previous,
    preset: isPreset(state.preset) ? state.preset : previous.preset,
    blend: readBoolean(state.blend, previous.blend),
    blendColorOperation: readBlendOperation(
      state.blendColorOperation,
      previous.blendColorOperation
    ),
    blendColorSrcFactor: readBlendFactor(
      state.blendColorSrcFactor,
      previous.blendColorSrcFactor,
      device,
      false
    ),
    blendColorDstFactor: readBlendFactor(
      state.blendColorDstFactor,
      previous.blendColorDstFactor,
      device,
      false
    ),
    blendAlphaOperation: readBlendOperation(
      state.blendAlphaOperation,
      previous.blendAlphaOperation
    ),
    blendAlphaSrcFactor: readBlendFactor(
      state.blendAlphaSrcFactor,
      previous.blendAlphaSrcFactor,
      device,
      true
    ),
    blendAlphaDstFactor: readBlendFactor(
      state.blendAlphaDstFactor,
      previous.blendAlphaDstFactor,
      device,
      true
    ),
    blendConstant: readColor(state, 'blendConstant', previous.blendConstant),
    sourceColor: readColor(state, 'sourceColor', previous.sourceColor),
    destinationColor: readColor(state, 'destinationColor', previous.destinationColor),
    colorMaskRed: readBoolean(state.colorMaskRed, previous.colorMaskRed),
    colorMaskGreen: readBoolean(state.colorMaskGreen, previous.colorMaskGreen),
    colorMaskBlue: readBoolean(state.colorMaskBlue, previous.colorMaskBlue),
    colorMaskAlpha: readBoolean(state.colorMaskAlpha, previous.colorMaskAlpha),
    swapDrawOrder: readBoolean(state.swapDrawOrder, previous.swapDrawOrder)
  };
  return next;
}

function toSettingsState(settings: BlendSettings): SettingsState {
  return {
    ...settings,
    blendConstantR: settings.blendConstant[0],
    blendConstantG: settings.blendConstant[1],
    blendConstantB: settings.blendConstant[2],
    blendConstantA: settings.blendConstant[3],
    sourceColorR: settings.sourceColor[0],
    sourceColorG: settings.sourceColor[1],
    sourceColorB: settings.sourceColor[2],
    sourceColorA: settings.sourceColor[3],
    destinationColorR: settings.destinationColor[0],
    destinationColorG: settings.destinationColor[1],
    destinationColorB: settings.destinationColor[2],
    destinationColorA: settings.destinationColor[3]
  };
}

function readColor(state: SettingsState, prefix: string, fallback: Color): Color {
  return [
    readUnitNumber(state[`${prefix}R`], fallback[0]),
    readUnitNumber(state[`${prefix}G`], fallback[1]),
    readUnitNumber(state[`${prefix}B`], fallback[2]),
    readUnitNumber(state[`${prefix}A`], fallback[3])
  ];
}

function readBlendOperation(value: unknown, fallback: BlendOperation): BlendOperation {
  return typeof value === 'string' && BLEND_OPERATIONS.includes(value as BlendOperation)
    ? (value as BlendOperation)
    : fallback;
}

function readBlendFactor(
  value: unknown,
  fallback: BlendFactor,
  device: Device,
  alpha: boolean
): BlendFactor {
  if (
    typeof value !== 'string' ||
    !BLEND_FACTORS.includes(value as BlendFactor) ||
    (alpha && !ALPHA_BLEND_FACTORS.has(value as BlendFactor)) ||
    (DUAL_SOURCE_FACTORS.has(value as BlendFactor) && !supportsDualSourceBlending(device))
  ) {
    return fallback;
  }
  return value as BlendFactor;
}

function readUnitNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isPreset(value: unknown): value is BlendPreset {
  return (
    value === 'straight-alpha' ||
    value === 'premultiplied-alpha' ||
    value === 'additive' ||
    value === 'multiply' ||
    value === 'screen' ||
    value === 'subtractive' ||
    value === 'custom'
  );
}

function cloneSettings(settings: BlendSettings): BlendSettings {
  return {
    ...settings,
    blendConstant: [...settings.blendConstant],
    sourceColor: [...settings.sourceColor],
    destinationColor: [...settings.destinationColor]
  };
}

function makeStatusHtml(device: Device, settings: BlendSettings): string {
  const parameters = makeBlendParameters(settings);
  const notes: string[] = [
    '<b>Left:</b> resulting alpha. <b>Right:</b> RGB over checkerboard.',
    `Backend: <code>${escapeHtml(device.type)}${device.info.featureLevel ? ` (${device.info.featureLevel})` : ''}</code>.`
  ];
  if (!settings.blend) {
    notes.push('Blending is disabled; source fragments replace destination fragments.');
  }
  if (settings.blendColorOperation === 'min' || settings.blendColorOperation === 'max') {
    notes.push('Color source and destination factors are ignored by min/max operations.');
  }
  if (settings.blendAlphaOperation === 'min' || settings.blendAlphaOperation === 'max') {
    notes.push('Alpha source and destination factors are ignored by min/max operations.');
  }
  if (!supportsDualSourceBlending(device)) {
    notes.push('Dual-source src1 factors require a WebGPU MAX device with dual-source-blending.');
  } else {
    notes.push('src1 factors use a complementary secondary source color emitted by the shader.');
  }
  return `
    <p style="margin:0 0 8px"><b>Blend playground</b></p>
    <p style="margin:0 0 8px">${notes.join('<br/>')}</p>
    <p style="margin:0 0 4px"><b>Formula</b>: ${escapeHtml(makeFormula(settings))}</p>
    <pre style="margin:0;max-height:180px;overflow:auto;font-size:11px;white-space:pre-wrap">${escapeHtml(
      JSON.stringify(parameters, null, 2)
    )}</pre>
  `;
}

function makeFormula(settings: BlendSettings): string {
  if (!settings.blend) {
    return 'result = source';
  }
  return `color: ${settings.blendColorOperation}(source × ${settings.blendColorSrcFactor}, destination × ${settings.blendColorDstFactor}); alpha: ${settings.blendAlphaOperation}(source × ${settings.blendAlphaSrcFactor}, destination × ${settings.blendAlphaDstFactor})`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
