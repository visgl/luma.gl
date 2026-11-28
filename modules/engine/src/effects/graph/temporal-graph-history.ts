// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Texture, type TextureFormat} from '@luma.gl/core';
import type {GPUCommandGraph, GPUTextureHistory, GraphTextureView} from '@luma.gl/graph/gpu-core';

/** Stable graph views for the previous and current roles of a borrowed history pair. */
export type TemporalGraphHistory<Format extends TextureFormat = TextureFormat> = {
  /** Sampled before the effect writes the current frame. */
  previous: GraphTextureView<Format>;
  /** Written during this frame and available to later graph passes. */
  current: GraphTextureView<Format>;
  /** Current physical bindings to pass to the compiled graph on each encoding. */
  getBindings(): Record<string, Texture>;
};

/**
 * Adds a borrowed history pair to a command graph. The caller advances the pair after submitting
 * a successful frame. A discarded encoding leaves the roles unchanged.
 */
export function importTemporalGraphHistory<Frame, Format extends TextureFormat>(
  graph: GPUCommandGraph<Frame>,
  id: string,
  history: GPUTextureHistory<Format>
): TemporalGraphHistory<Format> {
  assert(graph.device === history.device);
  const previousId = id + '/previous';
  const currentId = id + '/current';
  const previousTexture = history.previousTexture;
  const descriptor = {
    format: previousTexture.format as Format,
    width: previousTexture.width,
    height: previousTexture.height,
    depth: previousTexture.depth,
    dimension: previousTexture.dimension,
    mipLevels: previousTexture.mipLevels,
    samples: previousTexture.samples,
    usage: previousTexture.props.usage
  };
  return {
    previous: graph.createTextureView(graph.importTexture({...descriptor, id: previousId})),
    current: graph.createTextureView(graph.importTexture({...descriptor, id: currentId})),
    getBindings: () => history.getBindings(previousId, currentId)
  };
}
