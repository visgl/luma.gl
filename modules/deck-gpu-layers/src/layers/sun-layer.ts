// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SkyBodyLayer, type SkyBodyLayerProps} from './sky-body-layer';

export type SunLayerProps = SkyBodyLayerProps & {haloIntensity?: number};

/** A camera-relative solar disk with a bounded halo, occluded by foreground geometry. */
export class SunLayer extends SkyBodyLayer<SunLayerProps> {
  static override layerName = 'SunLayer';
  static override defaultProps = {
    ...SkyBodyLayer.defaultProps,
    haloIntensity: {type: 'number', value: 0.3, min: 0}
  };
  protected override getBodySettings() {
    return {moon: 0, phase: 0.5, limbAngle: 0, halo: this.props.haloIntensity!};
  }
}
