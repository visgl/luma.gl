// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lightingUniformsGLSL} from './lighting-uniforms-glsl';
import {lightingUniformsWGSL} from './lighting-uniforms-wgsl';
import type {NumberArray3} from '@math.gl/core';

/** Max number of supported lights (in addition to ambient light */
const MAX_LIGHTS = 5;

/** Whether to divide */
const COLOR_FACTOR = 255.0;

/** Shader type field for lights */
// eslint-disable-next-line no-shadow
export enum LIGHT_TYPE {
  POINT = 0,
  DIRECTIONAL = 1
}

/** Lighting helper types */

export type Light = AmbientLight | PointLight | DirectionalLight;

export type AmbientLight = {
  type: 'ambient';
  color?: Readonly<NumberArray3>;
  intensity?: number;
};

export type PointLight = {
  type: 'point';
  position: Readonly<NumberArray3>;
  color?: Readonly<NumberArray3>;
  intensity?: number;
  attenuation?: number;
};

export type DirectionalLight = {
  type: 'directional';
  position: Readonly<NumberArray3>;
  direction: Readonly<NumberArray3>;
  color?: Readonly<NumberArray3>;
  intensity?: number;
};

export type LightingProps = {
  enabled?: boolean;
  lights?: Light[];
  /** @deprecated */
  ambientLight?: AmbientLight;
  /** @deprecated */
  pointLights?: PointLight[];
  /** @deprecated */
  directionalLights?: DirectionalLight[];
};

export type LightingUniforms = {
  enabled: number;
  ambientLightColor: Readonly<NumberArray3>;
  directionalLightCount: number;
  pointLightCount: number;
  lightType: number; // [];
  lightColor: Readonly<NumberArray3>; // [];
  lightPosition: Readonly<NumberArray3>; // [];
  lightDirection: Readonly<NumberArray3>; // [];
  lightAttenuation: Readonly<NumberArray3>; // [];
};

/** UBO ready lighting module */
export const lighting = {
  props: {} as LightingProps,
  uniforms: {} as LightingUniforms,

  name: 'lighting',

  defines: {
    MAX_LIGHTS
  },

  uniformTypes: {
    enabled: 'i32',
    lightType: 'i32', // , array: MAX_LIGHTS,

    directionalLightCount: 'i32', // , array: MAX_LIGHTS,
    pointLightCount: 'i32', // , array: MAX_LIGHTS,

    ambientLightColor: 'vec3<f32>',
    lightColor: 'vec3<f32>', // , array: MAX_LIGHTS,
    lightPosition: 'vec3<f32>', // , array: MAX_LIGHTS,
    // TODO - could combine direction and attenuation
    lightDirection: 'vec3<f32>', // , array: MAX_LIGHTS,
    lightAttenuation: 'vec3<f32>' // , array: MAX_LIGHTS},
  },

  defaultUniforms: {
    enabled: 1,
    lightType: LIGHT_TYPE.POINT,

    directionalLightCount: 0,
    pointLightCount: 0,

    ambientLightColor: [0.1, 0.1, 0.1],
    lightColor: [1, 1, 1],
    lightPosition: [1, 1, 2],
    // TODO - could combine direction and attenuation
    lightDirection: [1, 1, 1],
    lightAttenuation: [1, 1, 1]
  },
  source: lightingUniformsWGSL,
  vs: lightingUniformsGLSL,
  fs: lightingUniformsGLSL,

  getUniforms
} as const satisfies ShaderModule<LightingProps, LightingUniforms, {}>;

function getUniforms(
  props?: LightingProps,
  prevUniforms: Partial<LightingUniforms> = {}
): LightingUniforms {
  // Copy props so we can modify
  props = props ? {...props} : props;

  // TODO legacy
  if (!props) {
    return {...lighting.defaultUniforms};
  }
  // Support for array of lights. Type of light is detected by type field
  if (props.lights) {
    props = {...props, ...extractLightTypes(props.lights), lights: undefined};
  }

  // Specify lights separately
  const {ambientLight, pointLights, directionalLights} = props || {};
  const hasLights =
    ambientLight ||
    (pointLights && pointLights.length > 0) ||
    (directionalLights && directionalLights.length > 0);

  // TODO - this may not be the correct decision
  if (!hasLights) {
    return {...lighting.defaultUniforms, enabled: 0};
  }

  const uniforms = {
    ...lighting.defaultUniforms,
    ...prevUniforms,
    ...getLightSourceUniforms({ambientLight, pointLights, directionalLights})
  };

  if (props.enabled !== undefined) {
    uniforms.enabled = props.enabled ? 1 : 0;
  }

  return uniforms;
}

function getLightSourceUniforms({
  ambientLight,
  pointLights = [],
  directionalLights = []
}: LightingProps): Partial<LightingUniforms> {
  const lightSourceUniforms: Partial<LightingUniforms> = {
    // lightType: new Array(MAX_LIGHTS).fill(0),
    // lightColor: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    // lightPosition: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    // lightDirection: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    // lightAttenuation: new Array(MAX_LIGHTS).fill([0, 0, 0])
  };

  lightSourceUniforms.ambientLightColor = convertColor(ambientLight);

  let currentLight = 0;

  for (const pointLight of pointLights) {
    // lightSourceUniforms.lightType[currentLight] = LIGHT_TYPE.POINT;
    // lightSourceUniforms.lightColor[currentLight] = convertColor(pointLight);
    // lightSourceUniforms.lightPosition[currentLight] = pointLight.position;
    // lightSourceUniforms.lightAttenuation[currentLight] = [pointLight.attenuation || 1, 0, 0];
    lightSourceUniforms.lightType = LIGHT_TYPE.POINT;
    lightSourceUniforms.lightColor = convertColor(pointLight);
    lightSourceUniforms.lightPosition = pointLight.position;
    lightSourceUniforms.lightAttenuation = [pointLight.attenuation || 1, 0, 0];
    currentLight++;
  }

  for (const directionalLight of directionalLights) {
    // lightSourceUniforms.lightType[currentLight] = LIGHT_TYPE.DIRECTIONAL;
    // lightSourceUniforms.lightColor[currentLight] = convertColor(directionalLight);
    // lightSourceUniforms.lightPosition[currentLight] = directionalLight.position;
    // lightSourceUniforms.lightDirection[currentLight] = directionalLight.direction;
    lightSourceUniforms.lightType = LIGHT_TYPE.DIRECTIONAL;
    lightSourceUniforms.lightColor = convertColor(directionalLight);
    lightSourceUniforms.lightPosition = directionalLight.position;
    lightSourceUniforms.lightDirection = directionalLight.direction;
    currentLight++;
  }

  lightSourceUniforms.directionalLightCount = directionalLights.length;
  lightSourceUniforms.pointLightCount = pointLights.length;

  return lightSourceUniforms;
}

function extractLightTypes(lights: Light[]): LightingProps {
  const lightSources: LightingProps = {pointLights: [], directionalLights: []};
  for (const light of lights || []) {
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
  return lightSources;
}

/** Take color 0-255 and intensity as input and output 0.0-1.0 range */
function convertColor(
  colorDef: {color?: Readonly<NumberArray3>; intensity?: number} = {}
): NumberArray3 {
  const {color = [0, 0, 0], intensity = 1.0} = colorDef;
  return color.map(component => (component * intensity) / COLOR_FACTOR) as NumberArray3;
}
