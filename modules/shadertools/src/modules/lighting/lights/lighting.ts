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

/** Supported light source descriptions accepted by the lighting shader module. */
export type Light = AmbientLight | PointLight | SpotLight | DirectionalLight;

/** Ambient light contribution shared across the entire scene. */
export type AmbientLight = {
  /** Discriminator used to identify ambient lights in `lights: Light[]`. */
  type: 'ambient';
  /** RGB light color in the existing `0..255` convention used by luma.gl materials. */
  color?: Readonly<NumberArray3>;
  /** Scalar intensity multiplier applied to the light color. */
  intensity?: number;
};

/** Omnidirectional point light emitted from a world-space position. */
export type PointLight = {
  /** Discriminator used to identify point lights in `lights: Light[]`. */
  type: 'point';
  /** World-space light position. */
  position: Readonly<NumberArray3>;
  /** RGB light color in the existing `0..255` convention used by luma.gl materials. */
  color?: Readonly<NumberArray3>;
  /** Scalar intensity multiplier applied to the light color. */
  intensity?: number;
  /** Constant, linear, and quadratic attenuation coefficients. */
  attenuation?: Readonly<NumberArray3>;
};

/** Directional light defined only by its incoming world-space direction. */
export type DirectionalLight = {
  /** Discriminator used to identify directional lights in `lights: Light[]`. */
  type: 'directional';
  /** World-space light direction. */
  direction: Readonly<NumberArray3>;
  /** RGB light color in the existing `0..255` convention used by luma.gl materials. */
  color?: Readonly<NumberArray3>;
  /** Scalar intensity multiplier applied to the light color. */
  intensity?: number;
};

/** Cone-shaped light emitted from a position and focused along a direction. */
export type SpotLight = {
  /** Discriminator used to identify spot lights in `lights: Light[]`. */
  type: 'spot';
  /** World-space light position. */
  position: Readonly<NumberArray3>;
  /** World-space light direction. */
  direction: Readonly<NumberArray3>;
  /** RGB light color in the existing `0..255` convention used by luma.gl materials. */
  color?: Readonly<NumberArray3>;
  /** Scalar intensity multiplier applied to the light color. */
  intensity?: number;
  /** Constant, linear, and quadratic attenuation coefficients. */
  attenuation?: Readonly<NumberArray3>;
  /** Inner spotlight cone angle in radians. */
  innerConeAngle?: number;
  /** Outer spotlight cone angle in radians. */
  outerConeAngle?: number;
};

/** Public JavaScript props accepted by the `lighting` shader module. */
export type LightingProps = {
  /** Enables or disables lighting calculations for the module. */
  enabled?: boolean;
  /** Preferred API for supplying mixed ambient, point, spot, and directional lights. */
  lights?: Light[];
  /**
   * Legacy ambient-light prop.
   * @deprecated Use `lights` with `{type: 'ambient', ...}` entries instead.
   */
  ambientLight?: AmbientLight;
  /**
   * Legacy point-light prop.
   * @deprecated Use `lights` with `{type: 'point', ...}` entries instead.
   */
  pointLights?: PointLight[];
  /**
   * Legacy spot-light prop.
   * @deprecated Use `lights` with `{type: 'spot', ...}` entries instead.
   */
  spotLights?: SpotLight[];
  /**
   * Legacy directional-light prop.
   * @deprecated Use `lights` with `{type: 'directional', ...}` entries instead.
   */
  directionalLights?: DirectionalLight[];
};

/** Packed per-light data written into the module's fixed-size uniform array. */
export type LightingLightUniform = {
  /** Light color converted to normalized shader-space RGB. */
  color: Readonly<NumberArray3>;
  /** World-space light position or a default placeholder for non-positional lights. */
  position: Readonly<NumberArray3>;
  /** World-space light direction or a default placeholder for positional lights. */
  direction: Readonly<NumberArray3>;
  /** Constant, linear, and quadratic attenuation coefficients. */
  attenuation: Readonly<NumberArray3>;
  /** Cosines of the inner and outer spotlight cone angles. */
  coneCos: Readonly<NumberArray2>;
};

/** Fully normalized uniform values produced by the `lighting` shader module. */
export type LightingUniforms = {
  /** `1` when lighting is enabled, otherwise `0`. */
  enabled: number;
  /** Number of packed directional lights in the `lights` array. */
  directionalLightCount: number;
  /** Number of packed point lights in the `lights` array. */
  pointLightCount: number;
  /** Number of packed spot lights in the `lights` array. */
  spotLightCount: number;
  /** Accumulated ambient color converted to normalized shader-space RGB. */
  ambientColor: Readonly<NumberArray3>;
  /** Packed trailing array of non-ambient light structs. */
  lights: ReadonlyArray<LightingLightUniform>;
};

const LIGHT_UNIFORM_TYPE = {
  color: 'vec3<f32>',
  position: 'vec3<f32>',
  direction: 'vec3<f32>',
  attenuation: 'vec3<f32>',
  coneCos: 'vec2<f32>'
} as const;

/**
 * Portable lighting shader module shared by the Phong, Gouraud, and PBR material modules.
 *
 * The public JavaScript API accepts `lights: Light[]`, while the uniform buffer packs
 * non-ambient lights into a fixed-size trailing array for portability across WebGL2 and WebGPU.
 */
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
  bindingLayout: [{name: 'lighting', group: 2}],
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
