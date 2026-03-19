// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lightingUniformsGLSL} from './lighting-glsl';
import {lightingUniformsWGSL} from './lighting-wgsl';
import type {NumberArray2, NumberArray3} from '@math.gl/core';

/** Max number of supported lights (in addition to ambient light */
const MAX_LIGHTS = 5;

/** Whether to divide */
const COLOR_FACTOR = 255.0;

/** Lighting helper types */

export type Light = AmbientLight | PointLight | SpotLight | DirectionalLight;

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
  attenuation?: Readonly<NumberArray3>;
};

export type DirectionalLight = {
  type: 'directional';
  direction: Readonly<NumberArray3>;
  color?: Readonly<NumberArray3>;
  intensity?: number;
};

export type SpotLight = {
  type: 'spot';
  position: Readonly<NumberArray3>;
  direction: Readonly<NumberArray3>;
  color?: Readonly<NumberArray3>;
  intensity?: number;
  attenuation?: Readonly<NumberArray3>;
  innerConeAngle?: number;
  outerConeAngle?: number;
};

export type LightingProps = {
  enabled?: boolean;
  lights?: Light[];
  /** @deprecated */
  ambientLight?: AmbientLight;
  /** @deprecated */
  pointLights?: PointLight[];
  /** @deprecated */
  spotLights?: SpotLight[];
  /** @deprecated */
  directionalLights?: DirectionalLight[];
};

export type LightingLightUniform = {
  color: Readonly<NumberArray3>;
  position: Readonly<NumberArray3>;
  direction: Readonly<NumberArray3>;
  attenuation: Readonly<NumberArray3>;
  coneCos: Readonly<NumberArray2>;
};

export type LightingUniforms = {
  enabled: number;
  directionalLightCount: number;
  pointLightCount: number;
  spotLightCount: number;
  ambientColor: Readonly<NumberArray3>;
  lights: ReadonlyArray<LightingLightUniform>;
};

const LIGHT_UNIFORM_TYPE = {
  color: 'vec3<f32>',
  position: 'vec3<f32>',
  direction: 'vec3<f32>',
  attenuation: 'vec3<f32>',
  coneCos: 'vec2<f32>'
} as const;

/** UBO ready lighting module */
export const lighting = {
  props: {} as LightingProps,
  uniforms: {} as LightingUniforms,

  name: 'lighting',

  defines: {
    // MAX_LIGHTS
  },

  uniformTypes: {
    enabled: 'i32',
    directionalLightCount: 'i32',
    pointLightCount: 'i32',
    spotLightCount: 'i32',
    ambientColor: 'vec3<f32>',
    lights: [LIGHT_UNIFORM_TYPE, MAX_LIGHTS]
  },

  defaultUniforms: createDefaultLightingUniforms(),
  source: lightingUniformsWGSL,
  vs: lightingUniformsGLSL,
  fs: lightingUniformsGLSL,

  getUniforms
} as const satisfies ShaderModule<LightingProps, LightingUniforms, {}>;

function getUniforms(
  props?: LightingProps,
  _prevUniforms: Partial<LightingUniforms> = {}
): LightingUniforms {
  // Copy props so we can modify
  props = props ? {...props} : props;

  // TODO legacy
  if (!props) {
    return createDefaultLightingUniforms();
  }
  // Support for array of lights. Type of light is detected by type field
  if (props.lights) {
    props = {...props, ...extractLightTypes(props.lights), lights: undefined};
  }

  // Specify lights separately
  const {ambientLight, pointLights, spotLights, directionalLights} = props || {};
  const hasLights =
    ambientLight ||
    (pointLights && pointLights.length > 0) ||
    (spotLights && spotLights.length > 0) ||
    (directionalLights && directionalLights.length > 0);

  // TODO - this may not be the correct decision
  if (!hasLights) {
    return {
      ...createDefaultLightingUniforms(),
      enabled: 0
    };
  }

  const uniforms = {
    ...createDefaultLightingUniforms(),
    ...getLightSourceUniforms({ambientLight, pointLights, spotLights, directionalLights})
  };

  if (props.enabled !== undefined) {
    uniforms.enabled = props.enabled ? 1 : 0;
  }

  return uniforms;
}

function getLightSourceUniforms({
  ambientLight,
  pointLights = [],
  spotLights = [],
  directionalLights = []
}: LightingProps): Omit<LightingUniforms, 'enabled'> {
  const lights = createDefaultLightUniforms();

  let currentLight = 0;
  let pointLightCount = 0;
  let spotLightCount = 0;
  let directionalLightCount = 0;

  for (const pointLight of pointLights) {
    if (currentLight >= MAX_LIGHTS) {
      break;
    }

    lights[currentLight] = {
      ...lights[currentLight],
      color: convertColor(pointLight),
      position: pointLight.position,
      attenuation: pointLight.attenuation || [1, 0, 0]
    };
    currentLight++;
    pointLightCount++;
  }

  for (const spotLight of spotLights) {
    if (currentLight >= MAX_LIGHTS) {
      break;
    }

    lights[currentLight] = {
      ...lights[currentLight],
      color: convertColor(spotLight),
      position: spotLight.position,
      direction: spotLight.direction,
      attenuation: spotLight.attenuation || [1, 0, 0],
      coneCos: getSpotConeCos(spotLight)
    };
    currentLight++;
    spotLightCount++;
  }

  for (const directionalLight of directionalLights) {
    if (currentLight >= MAX_LIGHTS) {
      break;
    }

    lights[currentLight] = {
      ...lights[currentLight],
      color: convertColor(directionalLight),
      direction: directionalLight.direction
    };
    currentLight++;
    directionalLightCount++;
  }

  if (pointLights.length + spotLights.length + directionalLights.length > MAX_LIGHTS) {
    log.warn(`MAX_LIGHTS exceeded, truncating to ${MAX_LIGHTS}`)();
  }

  return {
    ambientColor: convertColor(ambientLight),
    directionalLightCount,
    pointLightCount,
    spotLightCount,
    lights
  };
}

function extractLightTypes(lights: Light[]): LightingProps {
  const lightSources: LightingProps = {pointLights: [], spotLights: [], directionalLights: []};
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
      case 'spot':
        lightSources.spotLights?.push(light);
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

function createDefaultLightingUniforms(): LightingUniforms {
  return {
    enabled: 1,
    directionalLightCount: 0,
    pointLightCount: 0,
    spotLightCount: 0,
    ambientColor: [0.1, 0.1, 0.1],
    lights: createDefaultLightUniforms()
  };
}

function createDefaultLightUniforms(): LightingLightUniform[] {
  return Array.from({length: MAX_LIGHTS}, () => createDefaultLightUniform());
}

function createDefaultLightUniform(): LightingLightUniform {
  return {
    color: [1, 1, 1],
    position: [1, 1, 2],
    direction: [1, 1, 1],
    attenuation: [1, 0, 0],
    coneCos: [1, 0]
  };
}

function getSpotConeCos(spotLight: SpotLight): NumberArray2 {
  const innerConeAngle = spotLight.innerConeAngle ?? 0;
  const outerConeAngle = spotLight.outerConeAngle ?? Math.PI / 4;
  return [Math.cos(innerConeAngle), Math.cos(outerConeAngle)];
}
