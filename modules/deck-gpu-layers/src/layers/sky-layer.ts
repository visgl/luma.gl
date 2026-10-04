// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  _GlobeViewport,
  type LayerProps,
  type UpdateParameters
} from '@deck.gl/core';
import {getSunPosition, getSkyDirection, skyDirectionToGlobe, type SkyObserver} from '@math.gl/sun';
import type {CloudProps, GlobeCloudProps, AtmosphereProps} from '@luma.gl/shadertools';
import {SunLayer, type SunLayerProps} from './sun-layer';
import {MoonLayer, type MoonLayerProps} from './moon-layer';
import {StarfieldLayer, type StarfieldLayerProps} from './starfield-layer';
import {AtmosphereLayer} from './atmosphere-layer';
import {CloudLayer} from './cloud-layer';
import {GlobeCloudLayer} from './globe-cloud-layer';
import {getSkyObserver} from './sky-coordinates';

export type SkyLayerProps = LayerProps & {
  /** One astronomy clock for every component. Animation remains controlled by the application. */
  timestamp?: number | Date;
  observer?: SkyObserver;
  /** Cloud elapsed seconds, separate from astronomical time. */
  time?: number;
  sun?: boolean | Partial<SunLayerProps>;
  moon?: boolean | Partial<MoonLayerProps>;
  stars?: boolean | Partial<StarfieldLayerProps>;
  clouds?: boolean | (CloudProps & GlobeCloudProps);
  /** Existing local scattering sky. Globe views use the application's space background. */
  atmosphere?: boolean | AtmosphereProps;
};

/** One observer and clock for sun, moon, stars, atmosphere and view-appropriate clouds.
 * Draw before opaque scene geometry; all celestial components retain foreground depth occlusion.
 */
export class SkyLayer extends CompositeLayer<SkyLayerProps> {
  static override layerName = 'SkyLayer';
  static override defaultProps = {
    timestamp: undefined,
    observer: undefined,
    time: 0,
    sun: true,
    moon: true,
    stars: true,
    clouds: true,
    atmosphere: true,
    pickable: false
  };
  override shouldUpdateState({changeFlags}: UpdateParameters<this>): boolean {
    return changeFlags.somethingChanged;
  }
  override renderLayers() {
    const {sun, moon, stars, clouds, atmosphere, time} = this.props;
    const observer = getSkyObserver(
      this.context.viewport,
      this.props.observer,
      this.props.coordinateOrigin
    );
    const timestamp = this.props.timestamp ?? Date.now();
    const position = getSunPosition(timestamp, observer.latitude, observer.longitude);
    const direction = getSkyDirection(position.altitude, position.azimuth);
    const globe = this.context.viewport instanceof _GlobeViewport;
    const sunDirection = globe ? skyDirectionToGlobe(direction, observer) : direction;
    const shared = {timestamp, observer};
    return [
      atmosphere && !globe
        ? new AtmosphereLayer(
            this.getSubLayerProps({id: 'atmosphere'}),
            typeof atmosphere === 'object' ? atmosphere : {},
            {sunDirection: direction}
          )
        : null,
      stars
        ? new StarfieldLayer(
            this.getSubLayerProps({id: 'stars'}),
            typeof stars === 'object' ? stars : {},
            shared
          )
        : null,
      sun
        ? new SunLayer(
            this.getSubLayerProps({id: 'sun'}),
            typeof sun === 'object' ? sun : {},
            shared
          )
        : null,
      moon
        ? new MoonLayer(
            this.getSubLayerProps({id: 'moon'}),
            typeof moon === 'object' ? moon : {},
            shared
          )
        : null,
      clouds
        ? globe
          ? new GlobeCloudLayer(
              this.getSubLayerProps({id: 'clouds'}),
              typeof clouds === 'object' ? clouds : {},
              {time, sunDirection}
            )
          : new CloudLayer(
              this.getSubLayerProps({id: 'clouds'}),
              typeof clouds === 'object' ? clouds : {},
              {time, sunDirection}
            )
        : null
    ];
  }
}
