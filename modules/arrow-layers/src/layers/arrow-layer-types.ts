// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PickingInfo} from '@deck.gl/core';
import type {Model} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';

/** Deck draw parameters that preserve the Arrow renderers' alpha blending defaults. */
export const DECK_ARROW_ALPHA_BLEND_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const;

/** WGSL helpers that mirror deck.gl's GLSL color, opacity, highlighting, and picking hooks. */
export const DECK_ARROW_WGSL_COLOR_UTILS = /* wgsl */ `
fn deck_encodePickingColor(objectIndex: u32) -> vec3<f32> {
  let colorIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(colorIndex % 256u),
    f32((colorIndex / 256u) % 256u),
    f32((colorIndex / 65536u) % 256u)
  );
}

fn deck_filterColor(color: vec4<f32>, pickingColor: vec3<f32>) -> vec4<f32> {
  let normalizedPickingColor = picking_normalizeColor(pickingColor);
  if (picking.isActive > 0.5) {
    return vec4<f32>(normalizedPickingColor, 1.0);
  }

  var filteredColor = vec4<f32>(color.rgb, color.a * layer.opacity);
  let normalizedHighlightColor = picking_normalizeColor(picking.highlightedObjectColor);
  let isHighlighted = picking.isHighlightActive > 0.5 &&
    distance(normalizedPickingColor, normalizedHighlightColor) < 0.00001;
  if (isHighlighted) {
    let highlightAlpha = picking.highlightColor.a;
    let blendedAlpha = highlightAlpha + filteredColor.a * (1.0 - highlightAlpha);
    if (blendedAlpha > 0.0) {
      let highlightRatio = highlightAlpha / blendedAlpha;
      filteredColor = vec4<f32>(
        mix(filteredColor.rgb, picking.highlightColor.rgb, highlightRatio),
        blendedAlpha
      );
    }
  }
  return filteredColor;
}
`;

/** Minimal cartesian Deck viewport projection used until deck's WGSL shader hooks are complete. */
export const deckArrowViewport = {
  name: 'deckArrowViewport',
  source: /* wgsl */ `
struct DeckArrowViewportUniforms {
  center: vec2<f32>,
  worldToClipScale: vec2<f32>,
  pixelToClipScale: vec2<f32>,
};

@group(0) @binding(auto) var<uniform> deckArrowViewport: DeckArrowViewportUniforms;

fn deck_projectPosition(position: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(
    (position.xy - deckArrowViewport.center) * deckArrowViewport.worldToClipScale,
    position.z,
    1.0
  );
}
`,
  uniformTypes: {
    center: 'vec2<f32>',
    worldToClipScale: 'vec2<f32>',
    pixelToClipScale: 'vec2<f32>'
  },
  defaultUniforms: {
    center: [0, 0],
    worldToClipScale: [1, -1],
    pixelToClipScale: [1, 1]
  }
} as const satisfies ShaderModule;

/** Updates one model with the matrix and pixel scale of the active Deck viewport. */
export function setDeckArrowViewport(
  model: Model,
  viewport: {
    width: number;
    height: number;
    target?: readonly number[];
    zoom?: number;
    zoomX?: number;
    zoomY?: number;
    flipY?: boolean;
  }
): void {
  const zoomX = viewport.zoomX ?? viewport.zoom ?? 0;
  const zoomY = viewport.zoomY ?? viewport.zoom ?? 0;
  const target = viewport.target ?? [0, 0];
  model.shaderInputs.setProps({
    deckArrowViewport: {
      center: [target[0] ?? 0, target[1] ?? 0],
      worldToClipScale: [
        (2 * 2 ** zoomX) / Math.max(viewport.width, 1),
        ((viewport.flipY === false ? 2 : -2) * 2 ** zoomY) / Math.max(viewport.height, 1)
      ],
      pixelToClipScale: [2 / Math.max(viewport.width, 1), 2 / Math.max(viewport.height, 1)]
    }
  });
}

/** Arrow row identity attached to deck.gl picking results. */
export type ArrowLayerPickingInfo = PickingInfo & {
  arrow?: {
    /** Source row across all loaded record batches. */
    rowIndex: number;
    /** Source record-batch index. */
    batchIndex: number;
    /** Row index inside the source record batch. */
    batchRowIndex: number;
  };
};

/** Returns a stable aspect ratio for luma renderers that need one. */
export function getViewportAspect(viewport: {width: number; height: number}): number {
  return viewport.width / Math.max(viewport.height, 1);
}

/** Requests a Deck redraw after an asynchronous WebGPU pipeline links, or reports its diagnostics. */
export function watchDeckArrowModelPipeline(
  model: Model,
  onReady: () => void,
  onError: (error: Error) => void
): void {
  if (model.device.type !== 'webgpu') {
    onReady();
    return;
  }
  const pipeline = model.pipeline;
  const shaders =
    pipeline.fs && pipeline.fs !== pipeline.vs ? [pipeline.vs, pipeline.fs] : [pipeline.vs];
  void Promise.all(shaders.map(shader => shader.asyncCompilationStatus)).then(async () => {
    for (let attempt = 0; attempt < 100 && pipeline.linkStatus === 'pending'; attempt++) {
      await new Promise<void>(resolve => setTimeout(resolve, 10));
    }
    if (pipeline.isErrored || pipeline.linkStatus !== 'success') {
      const diagnostics = await Promise.all(shaders.map(shader => shader.getCompilationInfo()));
      onError(
        new Error(`${model.id} WebGPU pipeline failed: ${JSON.stringify(diagnostics.flat())}`)
      );
      return;
    }
    onReady();
  });
}
