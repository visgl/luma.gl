// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Framebuffer, Sampler, SamplerProps, Texture, TextureView} from '@luma.gl/core';
import {Texture as TextureResource, UniformStore} from '@luma.gl/core';
import {fxaa} from '@luma.gl/effects';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  ClipSpace,
  DynamicTexture,
  Geometry,
  Model,
  ShaderPassRenderer
} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  ColumnPanel,
  type Panel,
  type SettingsSchema,
  type SettingsState
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';
import {ComparisonSplitter} from '../../experimental/advanced-effects/comparison-splitter';

export const title = 'Antialiasing Techniques';
export const description =
  'Compare single-sample rendering, FXAA, supersampling, and texture sampling modes.';

const TECHNIQUES = ['None', 'FXAA', '2x supersampling', '4x supersampling'] as const;
const TEXTURE_SAMPLING_MODES = ['Nearest', 'Linear', 'Linear + mipmaps', 'Anisotropic'] as const;
const OUTPUT_MODES = ['Color', 'Depth visualization'] as const;

type Technique = (typeof TECHNIQUES)[number];
type TextureSamplingMode = (typeof TEXTURE_SAMPLING_MODES)[number];
type OutputMode = (typeof OUTPUT_MODES)[number];

type AntialiasingSettings = {
  technique: Technique;
  textureSampling: TextureSamplingMode;
  animate: boolean;
  output: OutputMode;
  zoom: number;
  split: number;
};

type AppUniforms = {
  time: number;
  viewMode: number;
  zoom: number;
};

type ComparisonUniforms = {
  split: number;
};

type RenderTarget = {
  framebuffer: Framebuffer;
  colorTexture: Texture;
  colorAttachmentView: TextureView;
  depthTexture: Texture;
  width: number;
  height: number;
  sampleLod: number;
};

const LINEAR_SAMPLER_PROPS: SamplerProps = {
  minFilter: 'linear',
  magFilter: 'linear',
  mipmapFilter: 'none',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge'
};

const COMPARISON_SPLITTER_STYLE = `
#antialiasing-comparison-splitter {
  position: fixed;
  width: 24px;
  transform: translateX(-50%);
  cursor: col-resize;
  touch-action: none;
  z-index: 10;
  outline: none;
}

#antialiasing-comparison-splitter::before {
  position: absolute;
  inset: 0 auto 0 11px;
  width: 2px;
  content: '';
  background: rgb(255 217 51 / 85%);
  box-shadow: 0 0 8px rgb(255 217 51 / 75%);
}

#antialiasing-comparison-splitter::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 48px;
  content: '';
  transform: translate(-50%, -50%);
  border: 2px solid rgb(255 245 190 / 95%);
  border-radius: 7px;
  background: rgb(59 47 8 / 92%);
  box-shadow: 0 2px 12px rgb(0 0 0 / 45%);
}

#antialiasing-comparison-splitter:hover::before,
#antialiasing-comparison-splitter:focus-visible::before,
#antialiasing-comparison-splitter[data-dragging='true']::before {
  width: 3px;
  background: #fff;
}
`;

const DEFAULT_SETTINGS: AntialiasingSettings = {
  technique: '4x supersampling',
  textureSampling: 'Nearest',
  animate: true,
  output: 'Color',
  zoom: 1,
  split: 0.5
};

const appShaderModule = {
  name: 'app',
  uniformTypes: {
    time: 'f32',
    viewMode: 'f32',
    zoom: 'f32'
  }
} as const satisfies ShaderModule<AppUniforms>;

const comparisonShaderModule = {
  name: 'comparison',
  uniformTypes: {
    split: 'f32'
  }
} as const satisfies ShaderModule<ComparisonUniforms>;

const SCENE_WGSL = /* wgsl */ `\
struct AppUniforms {
  time: f32,
  viewMode: f32,
  zoom: f32,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var checkerTexture: texture_2d<f32>;
@group(0) @binding(auto) var checkerTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) kinds: f32,
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) @interpolate(flat) kind: f32,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
  let offset = vec2<f32>(
    sin(app.time * 1.1 + inputs.kinds * 2.7) * 0.025,
    cos(app.time * 0.8 + inputs.kinds * 1.9) * 0.018
  );
  let halfCenter = select(0.5, -0.5, inputs.positions.x < 0.0);
  let center = vec2<f32>(halfCenter, 0.0);
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(
    center + (inputs.positions.xy + offset - center) * app.zoom,
    inputs.positions.z,
    1.0
  );
  outputs.uv = inputs.texCoords;
  outputs.kind = inputs.kinds;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let checker = textureSample(checkerTexture, checkerTextureSampler, inputs.uv);

  if (app.viewMode > 0.5) {
    let depth = 1.0 - inputs.position.z;
    return vec4<f32>(vec3<f32>(depth), 1.0);
  }

  if (inputs.kind < 0.5) {
    return vec4<f32>(0.98, 0.22, 0.16, 1.0);
  }
  if (inputs.kind < 1.5) {
    return vec4<f32>(0.08, 0.74, 0.95, 1.0);
  }
  if (inputs.kind < 2.5) {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  }

  if (inputs.kind < 3.5) {
    return vec4<f32>(checker.rgb, 1.0);
  }

  if (checker.a < 0.5) {
    discard;
  }
  let cutoutColor = mix(checker.rgb, vec3<f32>(1.0, 0.82, 0.12), 0.55);
  return vec4<f32>(cutoutColor, 1.0);
}
`;

const SCENE_VERTEX_SHADER = /* glsl */ `\
#version 300 es

layout(location = 0) in vec3 positions;
layout(location = 1) in vec2 texCoords;
layout(location = 2) in float kinds;

uniform appUniforms {
  float time;
  float viewMode;
  float zoom;
} app;

out vec2 uv;
flat out float kind;

void main(void) {
  vec2 offset = vec2(
    sin(app.time * 1.1 + kinds * 2.7) * 0.025,
    cos(app.time * 0.8 + kinds * 1.9) * 0.018
  );
  float halfCenter = positions.x < 0.0 ? -0.5 : 0.5;
  vec2 center = vec2(halfCenter, 0.0);
  gl_Position = vec4(center + (positions.xy + offset - center) * app.zoom, positions.z, 1.0);
  uv = texCoords;
  kind = kinds;
}
`;

const SCENE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D checkerTexture;
uniform appUniforms {
  float time;
  float viewMode;
  float zoom;
} app;

in vec2 uv;
flat in float kind;

out vec4 fragColor;

void main(void) {
  if (app.viewMode > 0.5) {
    float depth = 1.0 - gl_FragCoord.z;
    fragColor = vec4(vec3(depth), 1.0);
    return;
  }

  if (kind < 0.5) {
    fragColor = vec4(0.98, 0.22, 0.16, 1.0);
    return;
  }
  if (kind < 1.5) {
    fragColor = vec4(0.08, 0.74, 0.95, 1.0);
    return;
  }
  if (kind < 2.5) {
    fragColor = vec4(1.0);
    return;
  }

  vec4 checker = texture(checkerTexture, uv);
  if (kind < 3.5) {
    fragColor = vec4(checker.rgb, 1.0);
    return;
  }

  if (checker.a < 0.5) {
    discard;
  }
  vec3 cutoutColor = mix(checker.rgb, vec3(1.0, 0.82, 0.12), 0.55);
  fragColor = vec4(cutoutColor, 1.0);
}
`;

const COMPARISON_WGSL = /* wgsl */ `\
struct ComparisonUniforms {
  split: f32,
};

@group(0) @binding(auto) var<uniform> comparison: ComparisonUniforms;
@group(0) @binding(auto) var baselineTexture: texture_2d<f32>;
@group(0) @binding(auto) var baselineTextureSampler: sampler;
@group(0) @binding(auto) var techniqueTexture: texture_2d<f32>;
@group(0) @binding(auto) var techniqueTextureSampler: sampler;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let baselineColor = textureSample(baselineTexture, baselineTextureSampler, inputs.uv);
  let techniqueColor = textureSample(techniqueTexture, techniqueTextureSampler, inputs.uv);
  let separator = abs(inputs.uv.x - comparison.split) < 0.0025;
  if (separator) {
    return vec4<f32>(1.0, 0.85, 0.2, 1.0);
  }
  if (inputs.uv.x < comparison.split) {
    return baselineColor;
  }
  return techniqueColor;
}
`;

const COMPARISON_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform comparisonUniforms {
  float split;
} comparison;
uniform sampler2D baselineTexture;
uniform sampler2D techniqueTexture;

in vec2 uv;
out vec4 fragColor;

void main(void) {
  if (abs(uv.x - comparison.split) < 0.0025) {
    fragColor = vec4(1.0, 0.85, 0.2, 1.0);
    return;
  }
  fragColor = uv.x < comparison.split ? texture(baselineTexture, uv) : texture(techniqueTexture, uv);
}
`;

export default class AntialiasingAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  private readonly device: AnimationProps['device'];
  private readonly sceneModel: Model;
  private readonly comparisonModel: ClipSpace;
  private readonly uniformStore: UniformStore<{app: AppUniforms}>;
  private readonly comparisonUniformStore: UniformStore<{comparison: ComparisonUniforms}>;
  private readonly fxaaRenderer: ShaderPassRenderer;
  private readonly linearSampler: Sampler;
  private readonly checkerTextures: Record<TextureSamplingMode, DynamicTexture>;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private readonly panels: ExamplePanelManager;
  private readonly comparisonSplitter: ComparisonSplitter | null;
  private readonly comparisonSplitterStyle: HTMLStyleElement;

  private settings: AntialiasingSettings = {...DEFAULT_SETTINGS};
  private baselineTarget: RenderTarget | null = null;
  private supersampledTarget: RenderTarget | null = null;
  private effectiveSupersampleScale: 1 | 2 | 4 = 1;
  private fxaaSize: [number, number] | null = null;
  private frozenTime = 0;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.uniformStore = new UniformStore(device, {app: appShaderModule});
    this.comparisonUniformStore = new UniformStore(device, {
      comparison: comparisonShaderModule
    });
    this.linearSampler = device.createSampler(LINEAR_SAMPLER_PROPS);
    this.checkerTextures = makeCheckerTextures(device);
    this.sceneModel = new Model(device, {
      id: 'antialiasing-scene',
      source: SCENE_WGSL,
      vs: SCENE_VERTEX_SHADER,
      fs: SCENE_FRAGMENT_SHADER,
      geometry: makeSceneGeometry(),
      bindings: {
        app: this.uniformStore.getManagedUniformBuffer('app'),
        checkerTexture: this.checkerTextures[this.settings.textureSampling]
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        depthFormat: 'depth24plus'
      }
    });
    this.comparisonModel = new ClipSpace(device, {
      id: 'antialiasing-comparison',
      source: COMPARISON_WGSL,
      fs: COMPARISON_FRAGMENT_SHADER,
      bindings: {
        comparison: this.comparisonUniformStore.getManagedUniformBuffer('comparison'),
        baselineTexture: this.checkerTextures.Nearest,
        techniqueTexture: this.checkerTextures.Nearest
      }
    });
    this.fxaaRenderer = new ShaderPassRenderer(device, {shaderPasses: [fxaa]});
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'antialiasing-settings',
      schema: makeSettingsSchema(),
      settings: makeSettingsState(this.settings),
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
    this.comparisonSplitterStyle = document.createElement('style');
    this.comparisonSplitterStyle.textContent = COMPARISON_SPLITTER_STYLE;
    document.head.append(this.comparisonSplitterStyle);
    const canvas = device.getDefaultCanvasContext().canvas;
    this.comparisonSplitter =
      canvas instanceof HTMLCanvasElement
        ? new ComparisonSplitter({
            canvas,
            id: 'antialiasing-comparison-splitter',
            value: this.settings.split,
            onChange: split => {
              this.settings = {...this.settings, split};
            },
            onCommit: split => {
              this.settings = {...this.settings, split};
              this.settingsPanel.setSettingValue('split', split);
            }
          })
        : null;
  }

  onFinalize(): void {
    this.destroyTargets();
    this.sceneModel.destroy();
    this.comparisonModel.destroy();
    this.uniformStore.destroy();
    this.comparisonUniformStore.destroy();
    this.fxaaRenderer.destroy();
    this.linearSampler.destroy();
    for (const checkerTexture of Object.values(this.checkerTextures)) {
      checkerTexture.destroy();
    }
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.comparisonSplitter?.destroy();
    this.comparisonSplitterStyle.remove();
  }

  onRender({device, width, height, tick}: AnimationProps): void {
    this.comparisonSplitter?.updateLayout();
    const checkerTexture = this.checkerTextures[this.settings.textureSampling];
    if (!checkerTexture.isReady) {
      return;
    }

    this.ensureTargets(width, height);
    if (!this.baselineTarget) {
      return;
    }

    if (this.settings.animate) {
      this.frozenTime = tick / 1000;
    }
    this.uniformStore.setUniforms({
      app: {
        time: this.frozenTime,
        viewMode: this.settings.output === 'Depth visualization' ? 1 : 0,
        zoom: this.settings.zoom
      }
    });
    this.sceneModel.setBindings({checkerTexture});

    this.renderScene(this.baselineTarget);
    let techniqueTexture = this.baselineTarget.colorTexture;
    const supersampleScale = this.effectiveSupersampleScale;

    if (supersampleScale > 1 && this.supersampledTarget) {
      this.renderScene(this.supersampledTarget);
      generateMipmaps(this.device, this.supersampledTarget.colorTexture);
      techniqueTexture = this.supersampledTarget.colorTexture;
    } else if (this.settings.technique === 'FXAA') {
      this.resizeFxaaRenderer(width, height);
      techniqueTexture =
        this.fxaaRenderer.renderToTexture({sourceTexture: this.baselineTarget.colorTexture}) ||
        this.baselineTarget.colorTexture;
    }

    this.comparisonModel.setBindings({
      baselineTexture: this.baselineTarget.colorTexture,
      techniqueTexture
    });
    this.comparisonUniformStore.setUniforms({
      comparison: {split: this.settings.split}
    });
    const renderPass = device.beginRenderPass({clearColor: [0.02, 0.02, 0.03, 1]});
    this.comparisonModel.draw(renderPass);
    renderPass.end();
  }

  private renderScene(renderTarget: RenderTarget): void {
    const renderPass = this.device.beginRenderPass({
      framebuffer: renderTarget.framebuffer,
      clearColor: [0.02, 0.02, 0.03, 1],
      clearDepth: 1
    });
    this.sceneModel.draw(renderPass);
    renderPass.end();
  }

  private ensureTargets(width: number, height: number): void {
    if (
      !this.baselineTarget ||
      this.baselineTarget.width !== width ||
      this.baselineTarget.height !== height
    ) {
      destroyRenderTarget(this.baselineTarget);
      this.baselineTarget = createRenderTarget(this.device, width, height, 'baseline');
    }

    const supersampleScale = getSupportedSupersampleScale(
      this.device,
      width,
      height,
      this.settings.technique
    );
    if (supersampleScale !== this.effectiveSupersampleScale) {
      this.effectiveSupersampleScale = supersampleScale;
      this.panels.setPanel(this.makePanel());
    }
    if (supersampleScale === 1) {
      destroyRenderTarget(this.supersampledTarget);
      this.supersampledTarget = null;
      return;
    }

    const supersampledWidth = Math.max(1, Math.round(width * supersampleScale));
    const supersampledHeight = Math.max(1, Math.round(height * supersampleScale));
    const sampleLod = Math.log2(supersampleScale);
    if (
      !this.supersampledTarget ||
      this.supersampledTarget.width !== supersampledWidth ||
      this.supersampledTarget.height !== supersampledHeight ||
      this.supersampledTarget.sampleLod !== sampleLod
    ) {
      destroyRenderTarget(this.supersampledTarget);
      this.supersampledTarget = createRenderTarget(
        this.device,
        supersampledWidth,
        supersampledHeight,
        'supersampled',
        sampleLod
      );
    }
  }

  private resizeFxaaRenderer(width: number, height: number): void {
    if (this.fxaaSize?.[0] === width && this.fxaaSize[1] === height) {
      return;
    }
    this.fxaaRenderer.resize([width, height]);
    this.fxaaRenderer.swapFramebuffers.current.colorAttachments[0].texture.setSampler(
      this.linearSampler
    );
    this.fxaaRenderer.swapFramebuffers.next.colorAttachments[0].texture.setSampler(
      this.linearSampler
    );
    this.fxaaSize = [width, height];
  }

  private destroyTargets(): void {
    destroyRenderTarget(this.baselineTarget);
    destroyRenderTarget(this.supersampledTarget);
    this.baselineTarget = null;
    this.supersampledTarget = null;
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'antialiasing-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'antialiasing-description',
          title: '',
          html: makeDescriptionHtml(this.settings, this.effectiveSupersampleScale)
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (settings: SettingsState): void => {
    this.settings = {
      technique: isTechnique(settings.technique) ? settings.technique : this.settings.technique,
      textureSampling: isTextureSamplingMode(settings.textureSampling)
        ? settings.textureSampling
        : this.settings.textureSampling,
      animate: typeof settings.animate === 'boolean' ? settings.animate : this.settings.animate,
      output: isOutputMode(settings.output) ? settings.output : this.settings.output,
      zoom: typeof settings.zoom === 'number' ? clampZoom(settings.zoom) : this.settings.zoom,
      split:
        typeof settings.split === 'number'
          ? clampComparisonSplit(settings.split)
          : this.settings.split
    };
    this.comparisonSplitter?.setValue(this.settings.split);
    this.panels.setPanel(this.makePanel());
  };
}

function createRenderTarget(
  device: AnimationProps['device'],
  width: number,
  height: number,
  id: string,
  sampleLod = 0
): RenderTarget {
  const usesMipmaps = sampleLod > 0;
  const colorTexture = device.createTexture({
    id: 'antialiasing-' + id + '-color',
    format: 'rgba8unorm',
    width,
    height,
    mipLevels: usesMipmaps ? getMipLevelCount(width, height) : 1,
    usage: TextureResource.SAMPLE | TextureResource.RENDER | TextureResource.COPY_DST,
    sampler: {
      ...LINEAR_SAMPLER_PROPS,
      minFilter: usesMipmaps ? 'linear' : 'nearest',
      magFilter: usesMipmaps ? 'linear' : 'nearest',
      mipmapFilter: usesMipmaps ? 'linear' : 'none',
      lodMinClamp: sampleLod,
      lodMaxClamp: sampleLod
    }
  });
  const depthTexture = device.createTexture({
    id: 'antialiasing-' + id + '-depth',
    format: 'depth24plus',
    width,
    height,
    usage: TextureResource.RENDER
  });
  const colorAttachmentView = colorTexture.createView({
    id: 'antialiasing-' + id + '-color-attachment-view',
    baseMipLevel: 0,
    mipLevelCount: 1,
    baseArrayLayer: 0,
    arrayLayerCount: 1
  });
  const framebuffer = device.createFramebuffer({
    id: 'antialiasing-' + id + '-framebuffer',
    width,
    height,
    colorAttachments: [colorAttachmentView],
    depthStencilAttachment: depthTexture
  });
  return {
    framebuffer,
    colorTexture,
    colorAttachmentView,
    depthTexture,
    width,
    height,
    sampleLod
  };
}

function generateMipmaps(device: AnimationProps['device'], texture: Texture): void {
  if (device.type === 'webgpu') {
    device.generateMipmapsWebGPU(texture);
  } else {
    texture.generateMipmapsWebGL();
  }
}

function getMipLevelCount(width: number, height: number): number {
  return Math.floor(Math.log2(Math.max(width, height))) + 1;
}

function destroyRenderTarget(renderTarget: RenderTarget | null): void {
  if (!renderTarget) {
    return;
  }
  renderTarget.framebuffer.destroy();
  renderTarget.colorAttachmentView.destroy();
  renderTarget.colorTexture.destroy();
  renderTarget.depthTexture.destroy();
}

function makeCheckerTextures(
  device: AnimationProps['device']
): Record<TextureSamplingMode, DynamicTexture> {
  const textureData = makeCheckerTextureData(256);
  return {
    Nearest: makeCheckerTexture(device, 'nearest', textureData, {
      minFilter: 'nearest',
      magFilter: 'nearest',
      mipmapFilter: 'none'
    }),
    Linear: makeCheckerTexture(device, 'linear', textureData, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'none'
    }),
    'Linear + mipmaps': makeCheckerTexture(device, 'mipmaps', textureData, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear'
    }),
    Anisotropic: makeCheckerTexture(device, 'anisotropic', textureData, {
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      maxAnisotropy: 8
    })
  };
}

function makeCheckerTexture(
  device: AnimationProps['device'],
  id: string,
  textureData: {data: Uint8Array; width: number; height: number},
  sampler: SamplerProps
): DynamicTexture {
  return new DynamicTexture(device, {
    id: 'antialiasing-checker-' + id,
    format: 'rgba8unorm',
    width: textureData.width,
    height: textureData.height,
    data: textureData,
    mipmaps: true,
    mipLevels: 'auto',
    sampler: {
      ...sampler,
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    }
  });
}

function makeCheckerTextureData(size: number): {data: Uint8Array; width: number; height: number} {
  const data = new Uint8Array(size * size * 4);
  const checkerSize = Math.max(1, Math.round(size / 32));
  const stripePeriod = Math.max(2, Math.round(size / 8));
  const diamondRadius = size * 0.58;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const checker = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
      const stripe = (x + y) % stripePeriod < stripePeriod / 2;
      const diamondDistance = Math.abs(x - size / 2) + Math.abs(y - size / 2);
      data[index] = checker ? 238 : 18;
      data[index + 1] = stripe ? 238 : 48;
      data[index + 2] = checker ? 255 : 24;
      data[index + 3] = diamondDistance <= diamondRadius ? 255 : 0;
    }
  }
  return {data, width: size, height: size};
}

function makeSceneGeometry(): Geometry {
  const positions: number[] = [];
  const texCoords: number[] = [];
  const kinds: number[] = [];

  appendTriangle(
    positions,
    texCoords,
    kinds,
    [
      [-0.98, -0.78, 0.78],
      [-0.1, 0.82, 0.78],
      [0.0, -0.78, 0.78]
    ],
    0
  );
  appendTriangle(
    positions,
    texCoords,
    kinds,
    [
      [-0.84, -0.62, 0.24],
      [-0.28, 0.64, 0.24],
      [-0.06, -0.62, 0.24]
    ],
    1
  );
  appendTriangle(
    positions,
    texCoords,
    kinds,
    [
      [0.02, -0.78, 0.78],
      [0.9, 0.82, 0.78],
      [1.0, -0.78, 0.78]
    ],
    0
  );
  appendTriangle(
    positions,
    texCoords,
    kinds,
    [
      [0.16, -0.62, 0.24],
      [0.72, 0.64, 0.24],
      [0.94, -0.62, 0.24]
    ],
    1
  );
  appendQuad(
    positions,
    texCoords,
    kinds,
    [
      [-1.0, -0.98, 0.68],
      [1.0, -0.98, 0.68],
      [0.7, -0.28, 0.68],
      [-0.7, -0.28, 0.68]
    ],
    [
      [0, 0],
      [96, 0],
      [96, 24],
      [0, 24]
    ],
    3
  );
  appendQuad(
    positions,
    texCoords,
    kinds,
    [
      [-0.94, 0.12, 0.12],
      [-0.34, 0.12, 0.12],
      [-0.28, 0.74, 0.12],
      [-0.88, 0.74, 0.12]
    ],
    [
      [0, 0],
      [5, 0],
      [5, 2],
      [0, 2]
    ],
    4
  );
  appendQuad(
    positions,
    texCoords,
    kinds,
    [
      [0.06, 0.12, 0.12],
      [0.66, 0.12, 0.12],
      [0.72, 0.74, 0.12],
      [0.12, 0.74, 0.12]
    ],
    [
      [0, 0],
      [5, 0],
      [5, 2],
      [0, 2]
    ],
    4
  );

  for (let lineIndex = 0; lineIndex < 7; lineIndex++) {
    const lineOffset = (lineIndex - 3) * 0.045;
    appendThinLine(
      positions,
      texCoords,
      kinds,
      [-0.94, -0.2 + lineOffset, 0.04],
      [-0.06, 0.1 + lineOffset, 0.04],
      0.008,
      2
    );
    appendThinLine(
      positions,
      texCoords,
      kinds,
      [0.06, -0.2 + lineOffset, 0.04],
      [0.94, 0.1 + lineOffset, 0.04],
      0.008,
      2
    );
  }

  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      positions: {size: 3, value: new Float32Array(positions)},
      texCoords: {size: 2, value: new Float32Array(texCoords)},
      kinds: {size: 1, value: new Float32Array(kinds)}
    }
  });
}

function appendTriangle(
  positions: number[],
  texCoords: number[],
  kinds: number[],
  vertices: [number, number, number][],
  kind: number
): void {
  for (const vertex of vertices) {
    positions.push(...vertex);
    texCoords.push(0, 0);
    kinds.push(kind);
  }
}

function appendThinLine(
  positions: number[],
  texCoords: number[],
  kinds: number[],
  start: [number, number, number],
  end: [number, number, number],
  width: number,
  kind: number
): void {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const lineLength = Math.hypot(deltaX, deltaY);
  const halfWidth = width / 2;
  const normalX = (-deltaY / lineLength) * halfWidth;
  const normalY = (deltaX / lineLength) * halfWidth;
  appendQuad(
    positions,
    texCoords,
    kinds,
    [
      [start[0] - normalX, start[1] - normalY, start[2]],
      [end[0] - normalX, end[1] - normalY, end[2]],
      [end[0] + normalX, end[1] + normalY, end[2]],
      [start[0] + normalX, start[1] + normalY, start[2]]
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ],
    kind
  );
}

function appendQuad(
  positions: number[],
  texCoords: number[],
  kinds: number[],
  vertices: [number, number, number][],
  textureCoordinates: [number, number][],
  kind: number
): void {
  const indices = [0, 1, 2, 0, 2, 3];
  for (const index of indices) {
    positions.push(...vertices[index]);
    texCoords.push(...textureCoordinates[index]);
    kinds.push(kind);
  }
}

function getSupersampleScale(technique: Technique): 1 | 2 | 4 {
  switch (technique) {
    case '2x supersampling':
      return 2;
    case '4x supersampling':
      return 4;
    default:
      return 1;
  }
}

function getSupportedSupersampleScale(
  device: AnimationProps['device'],
  width: number,
  height: number,
  technique: Technique
): 1 | 2 | 4 {
  const requestedScale = getSupersampleScale(technique);
  const maxDimension = device.limits.maxTextureDimension2D;
  if (width * requestedScale <= maxDimension && height * requestedScale <= maxDimension) {
    return requestedScale;
  }
  if (requestedScale === 4 && width * 2 <= maxDimension && height * 2 <= maxDimension) {
    return 2;
  }
  return 1;
}

function makeSettingsSchema(): SettingsSchema {
  return {
    title: 'Antialiasing',
    sections: [
      {
        id: 'comparison',
        name: 'Comparison',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'technique',
            label: 'After',
            type: 'select',
            persist: 'none',
            options: [...TECHNIQUES]
          },
          {
            name: 'textureSampling',
            label: 'Texture sampling',
            type: 'select',
            persist: 'none',
            options: [...TEXTURE_SAMPLING_MODES]
          },
          {
            name: 'output',
            label: 'Output',
            type: 'select',
            persist: 'none',
            options: [...OUTPUT_MODES]
          },
          {
            name: 'zoom',
            label: 'Zoom',
            type: 'number',
            persist: 'none',
            min: 0.5,
            max: 4,
            step: 0.05
          },
          {
            name: 'split',
            label: 'Before / After',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.01
          },
          {name: 'animate', label: 'Animate scene', type: 'boolean', persist: 'none'}
        ]
      }
    ]
  };
}

function makeSettingsState(settings: AntialiasingSettings): SettingsState {
  return {...settings};
}

function makeDescriptionHtml(
  settings: AntialiasingSettings,
  effectiveSupersampleScale: 1 | 2 | 4
): string {
  const requestedSupersampleScale = getSupersampleScale(settings.technique);
  const supersampleLimitNote =
    requestedSupersampleScale > effectiveSupersampleScale
      ? `<p>Requested ${requestedSupersampleScale}x supersampling is capped to ${effectiveSupersampleScale}x by the device texture-size limit.</p>`
      : '';
  return (
    '<p><b>Before:</b> single-sample baseline. <b>After:</b> ' +
    settings.technique +
    '. Use Zoom, then move or drag the divider to compare them.</p><p>The scene combines thin geometry, minified texture detail, alpha cutouts, and depth discontinuities. ' +
    'Canvas antialiasing and explicit MSAA are documented separately: WebGPU <code>Texture.samples</code> still needs the managed resolve workflow proposed in RFC #2741, while WebGL uses context or renderbuffer paths.</p>' +
    supersampleLimitNote
  );
}

function isTechnique(value: unknown): value is Technique {
  return typeof value === 'string' && TECHNIQUES.includes(value as Technique);
}

function isTextureSamplingMode(value: unknown): value is TextureSamplingMode {
  return typeof value === 'string' && TEXTURE_SAMPLING_MODES.includes(value as TextureSamplingMode);
}

function isOutputMode(value: unknown): value is OutputMode {
  return typeof value === 'string' && OUTPUT_MODES.includes(value as OutputMode);
}

function clampComparisonSplit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampZoom(value: number): number {
  return Math.min(4, Math.max(0.5, value));
}
