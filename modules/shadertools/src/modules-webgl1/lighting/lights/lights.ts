// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray} from '../../../types';
import {lightingShader} from './lights-glsl';

/* eslint-disable camelcase */

type LightSources = {
  ambientLight?: {
    color: Readonly<NumberArray>;
    intensity: number;
  };
  pointLights?: {
    color: Readonly<NumberArray>;
    intensity: number;
    position: NumberArray;
    attenuation: number;
  }[];
  directionalLights?: {
    color: Readonly<NumberArray>;
    intensity: number;
    position: NumberArray;
    direction: NumberArray;
  }[];
};

export type LightsOptions = {
  lightSources?: LightSources;
};

const INITIAL_MODULE_OPTIONS: Required<LightsOptions> = {
  lightSources: {}
};

// Take color 0-255 and intensity as input and output 0.0-1.0 range
function convertColor(
  colorDef: {color?: Readonly<NumberArray>; intensity?: number} = {}
): NumberArray {
  const {color = [0, 0, 0], intensity = 1.0} = colorDef;
  return color.map(component => (component * intensity) / 255.0);
}

function getLightSourceUniforms({
  ambientLight,
  pointLights = [],
  directionalLights = []
}: LightSources): Record<string, any> {
  const lightSourceUniforms: Record<string, any> = {};

  if (ambientLight) {
    lightSourceUniforms['lighting_uAmbientLight.color'] = convertColor(ambientLight);
  } else {
    lightSourceUniforms['lighting_uAmbientLight.color'] = [0, 0, 0];
  }

  pointLights.forEach((pointLight, index) => {
    lightSourceUniforms[`lighting_uPointLight[${index}].color`] = convertColor(pointLight);
    lightSourceUniforms[`lighting_uPointLight[${index}].position`] = pointLight.position;
    lightSourceUniforms[`lighting_uPointLight[${index}].attenuation`] = pointLight.attenuation || [
      1, 0, 0
    ];
  });
  lightSourceUniforms.lighting_uPointLightCount = pointLights.length;

  directionalLights.forEach((directionalLight, index) => {
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].color`] =
      convertColor(directionalLight);
    lightSourceUniforms[`lighting_uDirectionalLight[${index}].direction`] =
      directionalLight.direction;
  });
  lightSourceUniforms.lighting_uDirectionalLightCount = directionalLights.length;

  return lightSourceUniforms;
}

// eslint-disable-next-line complexity
function getUniforms(opts: LightsOptions = INITIAL_MODULE_OPTIONS): Record<string, any> {
  // Specify lights separately
  if ('lightSources' in opts) {
    const {ambientLight, pointLights, directionalLights} = opts.lightSources || {};
    const hasLights =
      ambientLight ||
      (pointLights && pointLights.length > 0) ||
      (directionalLights && directionalLights.length > 0);

    if (!hasLights) {
      return {lighting_uEnabled: false};
    }

    return Object.assign(
      {},
      getLightSourceUniforms({ambientLight, pointLights, directionalLights}),
      {
        lighting_uEnabled: true
      }
    );
  }

  // Support for array of lights. Type of light is detected by type field
  if ('lights' in opts) {
    const lightSources: LightSources = {pointLights: [], directionalLights: []};
    // @ts-expect-error
    for (const light of opts.lights || []) {
      switch (light.type) {
        case 'ambient':
          // Note: Only uses last ambient light
          // TODO - add ambient light sources on CPU?
          lightSources.ambientLight = light;
          break;
        case 'directional':
          lightSources.directionalLights?.push(light);
          break;
        case 'point':
          lightSources.pointLights?.push(light);
          break;
        default:
        // eslint-disable-next-line
        // console.warn(light.type);
      }
    }

    // Call the `opts.lightSources`` version
    return getUniforms({lightSources});
  }

  return {};
}

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const lights = {
  name: 'lights',
  vs: lightingShader,
  fs: lightingShader,
  getUniforms,
  defines: {
    MAX_LIGHTS: 3
  }
};
