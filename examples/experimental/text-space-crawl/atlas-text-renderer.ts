// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowTextRenderer,
  createArrowTextShaderInputs,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {measureFontAtlasText, type FontAtlas, type TextGlyphLayout} from '@luma.gl/text';
import type {TextAttributeModel} from '@luma.gl/text/experimental';
import type {Text3DBounds} from '@luma.gl/text/text-3d';
import * as arrow from 'apache-arrow';
import {
  IDENTITY_MATRIX,
  type TextSpaceCrawlRenderer,
  type TextSpaceCrawlUniforms
} from './crawl-renderer';

export type AtlasTextRendererProps = {
  textRows: readonly string[];
  fontAtlas: FontAtlas;
};

type AtlasTextColumns = {
  positions: arrow.FixedSizeList<arrow.Float32>;
  texts: arrow.Utf8;
  clipRects: arrow.FixedSizeList<arrow.Int16>;
  colors: arrow.FixedSizeList<arrow.Uint8>;
};

type AtlasTextTable = arrow.Table<AtlasTextColumns>;

const TARGET_CRAWL_LINE_HEIGHT = 64;
const DISABLED_CLIP_RECT = [0, 0, -1, -1] as const;
const OPAQUE_WHITE = [255, 255, 255, 255] as const;

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

/** Shared quad renderer for bitmap, SDF, and MSDF font atlases. */
export class AtlasTextRenderer implements TextSpaceCrawlRenderer {
  readonly bounds: Text3DBounds;
  readonly glyphWorldScale: number;
  readonly textRenderer: ArrowTextRenderer;

  static async create(device: Device, props: AtlasTextRendererProps): Promise<AtlasTextRenderer> {
    const {fontAtlas, textRows} = props;
    const glyphWorldScale = TARGET_CRAWL_LINE_HEIGHT / fontAtlas.lineHeight;
    const textTable = makeAtlasTextTable(textRows, fontAtlas);
    const crawlApp = getCrawlAppModule(device);
    const shaderInputs = createArrowTextShaderInputs();
    const textRenderer = await ArrowTextRenderer.create(device, {
      id: 'atlas-text-crawl',
      positions: getRequiredColumn(textTable, 'positions'),
      texts: getRequiredColumn(textTable, 'texts'),
      clipRects: getRequiredColumn(textTable, 'clipRects'),
      colors: getRequiredColumn(textTable, 'colors'),
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
    return new AtlasTextRenderer(
      textRenderer,
      glyphWorldScale,
      measureAtlasTextBounds(textTable, getTextGlyphLayout(textRenderer), glyphWorldScale)
    );
  }

  private constructor(
    textRenderer: ArrowTextRenderer,
    glyphWorldScale: number,
    bounds: Text3DBounds
  ) {
    this.textRenderer = textRenderer;
    this.glyphWorldScale = glyphWorldScale;
    this.bounds = bounds;
  }

  setProps(props: {app: TextSpaceCrawlUniforms}): void {
    setCrawlAppProps(this.textRenderer.shaderInputs, props.app);
  }

  predraw(commandEncoder: CommandEncoder): void {
    this.textRenderer.predraw(commandEncoder);
  }

  draw(renderPass: RenderPass): void {
    this.textRenderer.draw(renderPass);
  }

  destroy(): void {
    this.textRenderer.destroy();
  }
}

function makeAtlasTextTable(textRows: readonly string[], fontAtlas: FontAtlas): AtlasTextTable {
  const positions = new Float32Array(textRows.length * 2);
  const clipRects = new Float32Array(textRows.length * DISABLED_CLIP_RECT.length);
  const colors = new Uint8Array(textRows.length * OPAQUE_WHITE.length);
  for (const [rowIndex, textRow] of textRows.entries()) {
    const metrics = measureFontAtlasText(textRow, fontAtlas);
    positions[rowIndex * 2] = -(metrics.bounds.min[0] + metrics.bounds.max[0]) / 2;
    positions[rowIndex * 2 + 1] = rowIndex * fontAtlas.lineHeight;
    clipRects.set(DISABLED_CLIP_RECT, rowIndex * DISABLED_CLIP_RECT.length);
    colors.set(OPAQUE_WHITE, rowIndex * OPAQUE_WHITE.length);
  }
  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    texts: arrow.vectorFromArray([...textRows], new arrow.Utf8()) as arrow.Vector<arrow.Utf8>,
    clipRects: makeArrowFixedSizeListVector(new arrow.Float32(), 4, clipRects),
    colors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors)
  });
}

function getRequiredColumn<KeyT extends keyof AtlasTextColumns>(
  table: AtlasTextTable,
  columnName: KeyT
): arrow.Vector<AtlasTextColumns[KeyT]> {
  const column = table.getChild(columnName);
  if (!column) {
    throw new Error(`Atlas text crawl requires "${columnName}"`);
  }
  return column as arrow.Vector<AtlasTextColumns[KeyT]>;
}

function measureAtlasTextBounds(
  textTable: AtlasTextTable,
  glyphLayout: TextGlyphLayout,
  glyphWorldScale: number
): Text3DBounds {
  const positions = getRequiredColumn(textTable, 'positions');
  const bounds: Text3DBounds = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, 0]
  };

  for (let rowIndex = 0; rowIndex < textTable.numRows; rowIndex++) {
    const position = positions.get(rowIndex);
    if (!position) {
      continue;
    }
    const positionX = position.get(0) ?? 0;
    const positionY = position.get(1) ?? 0;
    const glyphStart = glyphLayout.startIndices[rowIndex] ?? 0;
    const glyphEnd = glyphLayout.startIndices[rowIndex + 1] ?? glyphStart;

    for (let glyphIndex = glyphStart; glyphIndex < glyphEnd; glyphIndex++) {
      const glyphOffsetIndex = glyphIndex * 2;
      const glyphFrameIndex = glyphIndex * 4;
      const glyphOffsetX = glyphLayout.glyphOffsets[glyphOffsetIndex] ?? 0;
      const glyphOffsetY = glyphLayout.glyphOffsets[glyphOffsetIndex + 1] ?? 0;
      const glyphWidth = glyphLayout.glyphFrames[glyphFrameIndex + 2] ?? 0;
      const glyphHeight = glyphLayout.glyphFrames[glyphFrameIndex + 3] ?? 0;
      extendBounds(bounds, [
        (positionX + glyphOffsetX) * glyphWorldScale,
        -(positionY + glyphOffsetY + glyphHeight) * glyphWorldScale,
        0
      ]);
      extendBounds(bounds, [
        (positionX + glyphOffsetX + glyphWidth) * glyphWorldScale,
        -(positionY + glyphOffsetY) * glyphWorldScale,
        0
      ]);
    }
  }
  return bounds.min.every(Number.isFinite) && bounds.max.every(Number.isFinite)
    ? bounds
    : {min: [0, 0, 0], max: [0, 0, 0]};
}

function getTextGlyphLayout(textRenderer: ArrowTextRenderer): TextGlyphLayout {
  if (!('attributeState' in textRenderer.model)) {
    throw new Error('Atlas text crawl requires the attribute text model');
  }
  return (textRenderer.model as TextAttributeModel).attributeState.glyphLayout;
}

function extendBounds(bounds: Text3DBounds, point: [number, number, number]): void {
  for (let coordinateIndex = 0; coordinateIndex < point.length; coordinateIndex++) {
    bounds.min[coordinateIndex] = Math.min(bounds.min[coordinateIndex], point[coordinateIndex]);
    bounds.max[coordinateIndex] = Math.max(bounds.max[coordinateIndex], point[coordinateIndex]);
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
  props: TextSpaceCrawlUniforms
): void {
  shaderInputs.setProps({app: props} as never);
}
