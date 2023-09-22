// luma.gl, MIT license

import type {NumberArray} from '@math.gl/types';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lightingUniforms} from './lighting-uniforms.glsl';

/** Max number of supported lights (in addition to ambient light */
const MAX_LIGHTS = 5;

/** Whether to divide */
const COLOR_FACTOR = 255.0;

/** Shader type field for lights */
enum LIGHT_TYPE {
  POINT = 0,
  DIRECTIONAL = 1
}

/** Lighting helper types */

type Color = Readonly<NumberArray>;

export type Light = AmbientLight | PointLight | DirectionalLight;

export type AmbientLight = {
  type: 'ambient';
  color?: Color;
  intensity?: number;
}

export type PointLight = {
  type: 'point';
  position: NumberArray;
  color?: Color;
  intensity?: number;
  attenuation?: number;
}

export type DirectionalLight = {
  type: 'directional';
  position: NumberArray;
  direction: NumberArray;
  color?: Color;
  intensity?: number;
}

export type LightingModuleProps = {
  enabled?: boolean;
  lights?: Light[];
  ambientLight?: AmbientLight;
  pointLights?: PointLight[];
  directionalLights?: DirectionalLight[];
};

export type LightingModuleUniforms = {
  enabled: boolean;
  ambientLightColor: Color;
  numberOfLights: number;
  lightType: LIGHT_TYPE[];
  lightColor: Color[];
  lightPosition: Readonly<NumberArray>[];
  lightDirection: Readonly<NumberArray>[];
  lightAttenuation: Readonly<NumberArray>[];
};

/** UBO ready lighting module */
export const lighting: ShaderModule<LightingModuleUniforms, LightingModuleProps> = {
  name: 'lighting',
  vs: lightingUniforms,
  fs: lightingUniforms,
  getUniforms,

  defines: {
    MAX_LIGHTS
  },

  uniformTypes: {
    enabled: 'i32',
    ambientLightColor: 'vec3<f32>',
    numberOfLights: 'i32', // , array: MAX_LIGHTS,
    lightType: 'i32', // , array: MAX_LIGHTS,
    lightColor: 'vec3<f32>', // , array: MAX_LIGHTS,
    lightPosition: 'vec3<f32>', // , array: MAX_LIGHTS,
    // TODO - could combine direction and attenuation
    lightDirection: 'vec3<f32>', // , array: MAX_LIGHTS,
    lightAttenuation: 'vec3<f32>' // , array: MAX_LIGHTS},
  },
  
  // TODO - should we keep these?
  uniforms: {
    enabled: {format: 'i32'},
    ambientLightColor: {format: 'vec3<f32>'},
    numberOfLights: {format: 'i32'}, // , array: MAX_LIGHTS},
    lightType: {format: 'i32'}, // , array: MAX_LIGHTS},
    lightColor: {format: 'vec3<f32>'}, // , array: MAX_LIGHTS},
    lightPosition: {format: 'vec3<f32>'}, // , array: MAX_LIGHTS},
    // TODO - could combine direction and attenuation
    lightDirection: {format: 'vec3<f32>'}, // , array: MAX_LIGHTS},
    lightAttenuation: {format: 'vec3<f32>'}, // , array: MAX_LIGHTS},
  },

  defaultUniforms: { 
    enabled: true,
    ambientLightColor: [0.1, 0.1, 0.1],
    numberOfLights: 0,
    lightType: [],
    lightColor: [],
    lightPosition: [],
    // TODO - could combine direction and attenuation
    lightDirection: [],
    lightAttenuation: [],
  }
};

function getUniforms(props?: LightingModuleProps): LightingModuleUniforms {
  // TODO legacy
  if (!props) {
    return {...lighting.defaultUniforms};
  }
  // Support for array of lights. Type of light is detected by type field
  if (props.lights) {
    const lighting = extractLightTypes(props.lights);
    // Call the `props.lighting`` version
    return getUniforms(lighting);
  }

  // Specify lights separately
  const {ambientLight, pointLights, directionalLights} = props || {};
  const hasLights =
    ambientLight ||
    (pointLights && pointLights.length > 0) ||
    (directionalLights && directionalLights.length > 0);

  // TODO - this may not be the correct decision
  if (!hasLights) {
    return {...lighting.defaultUniforms, enabled: false};
  }

  return {
    ...lighting.defaultUniforms,
    ...getLightSourceUniforms({ambientLight, pointLights, directionalLights}),
    enabled: true
  };
}

function getLightSourceUniforms({
  ambientLight,
  pointLights = [],
  directionalLights = []
}: LightingModuleProps): Partial<LightingModuleUniforms> {
  const lightSourceUniforms: Partial<LightingModuleUniforms> = {
    lightType: new Array(MAX_LIGHTS).fill(0),
    lightColor: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    lightPosition: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    lightDirection: new Array(MAX_LIGHTS).fill([0, 0, 0]),
    lightAttenuation: new Array(MAX_LIGHTS).fill([0, 0, 0])
  };

  lightSourceUniforms.ambientLightColor = convertColor(ambientLight);

  let currentLight = 0;

  for (const pointLight of pointLights) {
    lightSourceUniforms.lightType[currentLight] = LIGHT_TYPE.POINT;
    lightSourceUniforms.lightColor[currentLight] = convertColor(pointLight);
    lightSourceUniforms.lightPosition[currentLight] = pointLight.position;
    lightSourceUniforms.lightAttenuation[currentLight] = [pointLight.attenuation || 1, 0, 0];
    currentLight++;
  }

  for (const directionalLight of directionalLights) {
    lightSourceUniforms.lightType[currentLight] = LIGHT_TYPE.DIRECTIONAL;
    lightSourceUniforms.lightColor[currentLight] = convertColor(directionalLight);
    lightSourceUniforms.lightPosition[currentLight] = directionalLight.position;
    lightSourceUniforms.lightDirection[currentLight] = directionalLight.direction;
    currentLight++;
  }

  lightSourceUniforms.numberOfLights = currentLight;

  return lightSourceUniforms;
}

function extractLightTypes(lights: Light[]): LightingModuleProps {
  const lightSources: LightingModuleProps = {pointLights: [], directionalLights: []};
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
function convertColor(colorDef: {color?: Readonly<NumberArray>, intensity?: number} = {}): NumberArray {
  const {color = [0, 0, 0], intensity = 1.0} = colorDef;
  return color.map((component) => (component * intensity) / COLOR_FACTOR);
}
