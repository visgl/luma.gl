// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SkyBodyLayer, type SkyBodyLayerProps} from './sky-body-layer';

export type MoonLayerProps = SkyBodyLayerProps & {
  /** Lunation: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase?: number;
  /** Bright-limb rotation, counterclockwise in the billboard plane, in radians. */
  limbAngle?: number;
};

/** A phase-shaded lunar disk with a subtle procedural surface, at infinite sky distance. */
export class MoonLayer extends SkyBodyLayer<MoonLayerProps> {
  static override layerName = 'MoonLayer';
  static override defaultProps = {
    ...SkyBodyLayer.defaultProps,
    color: {type: 'color', value: [215, 224, 235, 255]},
    phase: {type: 'number', value: 0.5, min: 0, max: 1},
    limbAngle: 0
  };
  protected override getBodySettings() {
    return {moon: 1, phase: this.props.phase!, limbAngle: this.props.limbAngle!, halo: 0};
  }
}
