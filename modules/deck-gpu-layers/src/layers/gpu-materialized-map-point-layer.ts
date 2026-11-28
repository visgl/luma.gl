// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WebMercatorViewport} from '@deck.gl/core';
import type {MaterializedMapPointSource} from '../projection/materialized-map-frame';
import {
  GPUMaterializedPointLayer,
  type GPUMaterializedPointLayerProps
} from './gpu-materialized-point-layer';

/** Props for drawing retained map positions in a 2D Web Mercator viewport. */
export type GPUMaterializedMapPointLayerProps = Omit<
  GPUMaterializedPointLayerProps,
  | 'positions'
  | 'validity'
  | 'transform'
  | 'coordinateSystem'
  | 'coordinateOrigin'
  | 'modelMatrix'
  | 'wrapLongitude'
> & {
  /** Caller-owned materialized source. Call updateChunks when its resident inputs change. */
  source: MaterializedMapPointSource;
};

/** Draws retained positions using Deck's Cartesian rebasing in a Web Mercator map. */
export class GPUMaterializedMapPointLayer extends GPUMaterializedPointLayer {
  /** Deck layer name. */
  static override layerName = 'GPUMaterializedMapPointLayer';

  /** Derives all coordinate props from the source's fixed map frame. */
  constructor(...propObjects: Partial<GPUMaterializedMapPointLayerProps>[]) {
    const props: Partial<GPUMaterializedMapPointLayerProps> = Object.assign({}, ...propObjects);
    const {source} = props;
    if (!source) {
      throw new Error('GPUMaterializedMapPointLayer requires a source');
    }
    super({
      ...props,
      positions: source.positions,
      validity: source.validity,
      transform: source.transform,
      coordinateSystem: 'cartesian',
      coordinateOrigin: [...source.commonOrigin],
      modelMatrix: null,
      wrapLongitude: false
    });
  }

  /** Restricts the ground-plane map frame to a WebGPU Web Mercator viewport. */
  protected override validateFrame(): void {
    if (
      this.context.device.type !== 'webgpu' ||
      !(this.context.viewport instanceof WebMercatorViewport)
    ) {
      throw new Error('GPUMaterializedMapPointLayer requires a WebGPU WebMercatorViewport');
    }
  }
}
