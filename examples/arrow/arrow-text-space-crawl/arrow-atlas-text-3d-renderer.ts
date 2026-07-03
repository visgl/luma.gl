// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowTextRenderer, createArrowTextShaderInputs} from '@luma.gl/arrow';
import {type CommandEncoder, type Device, type RenderPass} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {type FontAtlas, type TextGlyphLayout} from '@luma.gl/text';
import type {Text3DBounds} from '@luma.gl/text/text-3d';
import type {NumberArray16} from '@math.gl/core';
import type {ArrowText3DAppUniforms} from './arrow-text-3d-renderer';
import {
  getArrowAtlasText3DBounds,
  getRequiredArrowTextColumn,
  makeArrowAtlasText3DTextTable,
  type ArrowAtlasText3DTextTable
} from './arrow-atlas-text-3d-data';

/** Atlas-backed text renderer construction props for the crawl example. */
export type ArrowAtlasText3DRendererProps = {
  /** Arrow Utf8 rows expanded into atlas glyph quads. */
  textRows: readonly string[];
  /** Bitmap or SDF atlas forwarded through the common text `fontAtlas` prop. */
  fontAtlas: FontAtlas;
};

const TARGET_CRAWL_LINE_HEIGHT = 64;
const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const app: ShaderModule = {
  name: 'app',
  source: /* wgsl */ `\
struct AppUniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  normalMatrix : mat4x4<f32>,
  time : f32,
  crawlColor : vec4<f32>,
  fade : vec4<f32>,
  glyphWorldScale : f32,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;
`,
  vs: /* glsl */ `\
layout(std140) uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 crawlColor;
  vec4 fade;
  float glyphWorldScale;
} app;
`,
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    time: 'f32',
    crawlColor: 'vec4<f32>',
    fade: 'vec4<f32>',
    glyphWorldScale: 'f32'
  }
};

const WGSL_CRAWL_VERTEX_INJECTION = /* wgsl */ `
let crawlLocalPosition = vec3<f32>(
  worldPosition.x * app.glyphWorldScale,
  -worldPosition.y * app.glyphWorldScale,
  0.0
);
let crawlWorldPosition = app.modelMatrix * vec4<f32>(crawlLocalPosition, 1.0);
(*outputs).Position = app.projectionMatrix * app.viewMatrix * crawlWorldPosition;
(*outputs).textureCoordinate.y = (glyphFrame.y + corner.y * glyphSize.y) / atlasSize.y;
let crawlFadeIn = smoothstep(app.fade.x, app.fade.y, crawlWorldPosition.y);
let crawlFadeOut = 1.0 - smoothstep(app.fade.z, app.fade.w, crawlWorldPosition.y);
let crawlFade = clamp(crawlFadeIn * crawlFadeOut, 0.0, 1.0);
let crawlGlow = 1.0 + 0.08 * sin(app.time * 0.35);
(*outputs).textColor = vec4<f32>(
  app.crawlColor.rgb * crawlGlow,
  app.crawlColor.a * crawlFade
);
`;

const GLSL_CRAWL_VERTEX_INJECTION = /* glsl */ `
vec3 crawlLocalPosition = vec3(
  worldPosition.x * app.glyphWorldScale,
  -worldPosition.y * app.glyphWorldScale,
  0.0
);
vec4 crawlWorldPosition = app.modelMatrix * vec4(crawlLocalPosition, 1.0);
position = app.projectionMatrix * app.viewMatrix * crawlWorldPosition;
textureCoordinate.y = (glyphFrame.y + corner.y * glyphSize.y) / atlasSize.y;
float crawlFadeIn = smoothstep(app.fade.x, app.fade.y, crawlWorldPosition.y);
float crawlFadeOut = 1.0 - smoothstep(app.fade.z, app.fade.w, crawlWorldPosition.y);
float crawlFade = clamp(crawlFadeIn * crawlFadeOut, 0.0, 1.0);
float crawlGlow = 1.0 + 0.08 * sin(app.time * 0.35);
textColor = vec4(app.crawlColor.rgb * crawlGlow, app.crawlColor.a * crawlFade);
`;

/** Adds a perspective crawl transform to the shared Arrow atlas-text renderer. */
export class ArrowAtlasText3DRenderer {
  /** Arrow Utf8 crawl rows plus label style attributes consumed by the text renderer. */
  readonly textTable: ArrowAtlasText3DTextTable;
  /** Positioned visible glyph bounds before crawl world transforms. */
  readonly bounds: Text3DBounds;
  /** Font-unit to crawl-world conversion so fonts with different atlas sizes compare directly. */
  readonly glyphWorldScale: number;
  /** Common Arrow text facade configured with the attribute text model path. */
  readonly textRenderer: ArrowTextRenderer;

  /** Creates Arrow label data and injects the crawl transform into the shared atlas shader. */
  static async create(
    device: Device,
    props: ArrowAtlasText3DRendererProps
  ): Promise<ArrowAtlasText3DRenderer> {
    const {fontAtlas} = props;
    const glyphWorldScale = TARGET_CRAWL_LINE_HEIGHT / fontAtlas.lineHeight;
    const textTable = makeArrowAtlasText3DTextTable(props.textRows, fontAtlas);
    const crawlApp = getCrawlAppModule(device);
    const shaderInputs = createArrowTextShaderInputs();
    const textRenderer = await ArrowTextRenderer.create(device, {
      id: 'arrow-atlas-text-3d',
      positions: getRequiredArrowTextColumn(textTable, 'positions'),
      texts: getRequiredArrowTextColumn(textTable, 'texts'),
      clipRects: getRequiredArrowTextColumn(textTable, 'clipRects'),
      colors: getRequiredArrowTextColumn(textTable, 'colors'),
      model: 'attribute',
      fontAtlas,
      modelProps: {
        modules: [crawlApp],
        shaderInputs
      }
    });
    shaderInputs.setProps({
      textViewport: {
        cameraOffset: [0, 0],
        viewportScale: [1, 1],
        glyphWorldScale: 1,
        time: 0,
        clippingEnabled: 0,
        colorsEnabled: 0
      }
    });
    setCrawlAppProps(shaderInputs, {
      modelMatrix: IDENTITY_MATRIX,
      viewMatrix: IDENTITY_MATRIX,
      projectionMatrix: IDENTITY_MATRIX,
      normalMatrix: IDENTITY_MATRIX,
      time: 0,
      crawlColor: [1, 1, 1, 1],
      fade: [0, 0, 0, 0],
      glyphWorldScale
    });
    return new ArrowAtlasText3DRenderer(textTable, textRenderer, glyphWorldScale);
  }

  private constructor(
    textTable: ArrowAtlasText3DTextTable,
    textRenderer: ArrowTextRenderer,
    glyphWorldScale: number
  ) {
    this.textTable = textTable;
    this.textRenderer = textRenderer;
    this.glyphWorldScale = glyphWorldScale;
    this.bounds = getArrowAtlasText3DBounds(
      textTable,
      getArrowTextGlyphLayout(textRenderer),
      glyphWorldScale
    );
  }

  /** Replaces frame-varying crawl uniforms. */
  setProps(props: {app: ArrowText3DAppUniforms}): void {
    setCrawlAppProps(this.textRenderer.shaderInputs, props.app);
  }

  /** Flushes frame uniforms before opening a WebGPU render pass. */
  predraw(commandEncoder: CommandEncoder): void {
    this.textRenderer.predraw(commandEncoder);
  }

  /** Draws atlas glyph quads through the shared Arrow text facade. */
  draw(renderPass: RenderPass): void {
    this.textRenderer.draw(renderPass);
  }

  /** Releases generated glyph buffers and the atlas texture owned by the text renderer. */
  destroy(): void {
    this.textRenderer.destroy();
  }
}

function getCrawlAppModule(device: Device): ShaderModule {
  return {
    ...app,
    inject: {
      'vs:TEXT_ATTRIBUTE_VERTEX_TRANSFORM':
        device.type === 'webgpu' ? WGSL_CRAWL_VERTEX_INJECTION : GLSL_CRAWL_VERTEX_INJECTION
    }
  };
}

function setCrawlAppProps(
  shaderInputs: ArrowTextRenderer['shaderInputs'],
  props: ArrowText3DAppUniforms
): void {
  shaderInputs.setProps({app: props} as never);
}

function getArrowTextGlyphLayout(textRenderer: ArrowTextRenderer): TextGlyphLayout {
  if (!('glyphLayout' in textRenderer.model)) {
    throw new Error('Atlas text crawl requires the Arrow attribute text model');
  }
  return textRenderer.model.glyphLayout;
}
