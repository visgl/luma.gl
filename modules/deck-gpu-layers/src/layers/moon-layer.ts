// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import {getMoonPosition, getMoonIllumination, getSkyDirection} from '@math.gl/sun';
import {SkyBodyLayer, type SkyBodyLayerProps} from './sky-body-layer';

export type MoonLayerProps = SkyBodyLayerProps & {
  /** Lunation: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. Defaults to astronomy time. */
  phase?: number;
  /** Bright-limb rotation, counterclockwise in the billboard plane, in radians. */
  limbAngle?: number;
};

/** Phase-shaded lunar disk with automatic map/globe positions and a procedural surface. */
export class MoonLayer extends SkyBodyLayer<MoonLayerProps> {
  static override layerName = 'MoonLayer';
  static override defaultProps = {
    ...SkyBodyLayer.defaultProps,
    color: {type: 'color', value: [215, 224, 235, 255]},
    phase: undefined,
    limbAngle: undefined
  };
  protected override getBodyDirection(): Readonly<NumberArray3> {
    if (this.props.direction) return this.props.direction;
    const observer = this.getObserver();
    const position = getMoonPosition(
      this.props.timestamp ?? Date.now(),
      observer.latitude,
      observer.longitude
    );
    return getSkyDirection(position.altitude, position.azimuth);
  }
  protected override getBodySettings() {
    const observer = this.getObserver();
    const timestamp = this.props.timestamp ?? Date.now();
    const illumination = getMoonIllumination(timestamp);
    const position = getMoonPosition(timestamp, observer.latitude, observer.longitude);
    return {
      moon: 1,
      phase: this.props.phase ?? (this.props.direction ? 0.5 : illumination.phase),
      limbAngle:
        this.props.limbAngle ??
        (this.props.direction
          ? 0
          : Math.PI / 2 +
            illumination.angle -
            position.parallacticAngle -
            (illumination.phase > 0.5 ? Math.PI : 0)),
      halo: 0
    };
  }
}
