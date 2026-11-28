// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WebMercatorViewport, type LayerContext, type PickingInfo} from '@deck.gl/core';
import type {RenderPass} from '@luma.gl/core';
import type {MaterializedMapPointSource} from '../projection/materialized-map-frame';
import {GPULineLayer, type GPULineLayerProps} from './gpu-line-layer';
import type {GPUVectorLayerPickingInfo} from './gpu-vector-layer-utils';

/** Draws one straight segment per source row, with source row and batch identity in picks. */
export type GPUMaterializedMapLineLayerProps = Omit<
  GPULineLayerProps,
  | 'getSourcePosition'
  | 'getTargetPosition'
  | 'sourceValidity'
  | 'targetValidity'
  | 'coordinateSystem'
  | 'coordinateOrigin'
  | 'modelMatrix'
  | 'wrapLongitude'
> & {
  /** Caller-owned materialized start vertices. */
  start: MaterializedMapPointSource;
  /** Caller-owned end vertices in the same frame and batch layout as start. */
  end: MaterializedMapPointSource;
  /** Optional CPU metadata lookup that maps a picked segment row to its source feature index. */
  getFeatureIndex?: (segmentRow: number) => number | undefined;
};

/** Segment provenance with an optional application-supplied feature index. */
export type GPUMaterializedMapLinePickingInfo = GPUVectorLayerPickingInfo & {
  /** Source feature index for the picked segment when metadata is available. */
  featureIndex?: number;
};

/** Draws and picks resident, materialized two-vertex paths in a 2D Web Mercator viewport. */
export class GPUMaterializedMapLineLayer extends GPULineLayer {
  /** Base render props plus the optional segment-to-feature lookup. */
  declare readonly props: GPULineLayer['props'] &
    Pick<GPUMaterializedMapLineLayerProps, 'getFeatureIndex'>;

  /** Deck layer name. */
  static override layerName = 'GPUMaterializedMapLineLayer';

  /** Uses both endpoint masks and Deck's common-space rebasing. */
  constructor(...propObjects: Partial<GPUMaterializedMapLineLayerProps>[]) {
    const props: Partial<GPUMaterializedMapLineLayerProps> = Object.assign({}, ...propObjects);
    const {start, end} = props;
    if (
      !start ||
      !end ||
      start.commonOrigin.some((axis, index) => axis !== end.commonOrigin[index])
    ) {
      throw new Error('Materialized map lines require both endpoints in the same map frame');
    }
    if (start.positions.length > 0xffffff) {
      throw new Error('Materialized map line picking exceeds 24-bit row IDs');
    }
    super({
      ...props,
      getSourcePosition: start.positions,
      getTargetPosition: end.positions,
      sourceValidity: start.validity,
      targetValidity: end.validity,
      coordinateSystem: 'cartesian',
      coordinateOrigin: [...start.commonOrigin],
      modelMatrix: null,
      wrapLongitude: false
    });
  }

  /** Validates the map frame before creating the renderer. */
  override initializeState(context: LayerContext): void {
    this.validateViewport();
    super.initializeState(context);
  }

  /** Draws retained endpoints without rescheduling projection. */
  override draw(options: {renderPass: RenderPass}): void {
    this.validateViewport();
    super.draw(options);
  }

  /** Adds feature metadata without replacing physical segment row provenance. */
  override getPickingInfo(parameters: {info: PickingInfo}): GPUMaterializedMapLinePickingInfo {
    const info: GPUMaterializedMapLinePickingInfo = super.getPickingInfo(parameters);
    if (info.index >= 0 && this.props.getFeatureIndex) {
      info.featureIndex = this.props.getFeatureIndex(info.index);
    }
    return info;
  }

  /** Map common coordinates require a Web Mercator viewport. */
  private validateViewport(): void {
    if (!(this.context.viewport instanceof WebMercatorViewport)) {
      throw new Error('GPUMaterializedMapLineLayer requires a WebMercatorViewport');
    }
  }
}
