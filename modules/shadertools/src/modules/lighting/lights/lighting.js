// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { log } from '@luma.gl/core';
import { lightingUniformsGLSL } from './lighting-glsl';
import { lightingUniformsWGSL } from './lighting-wgsl';
/** Max number of supported lights (in addition to ambient light */
const MAX_LIGHTS = 5;
/** Whether to divide */
const COLOR_FACTOR = 255.0;
/** Shader type field for lights */
// eslint-disable-next-line no-shadow
export var LIGHT_TYPE;
(function (LIGHT_TYPE) {
    LIGHT_TYPE[LIGHT_TYPE["POINT"] = 0] = "POINT";
    LIGHT_TYPE[LIGHT_TYPE["DIRECTIONAL"] = 1] = "DIRECTIONAL";
})(LIGHT_TYPE || (LIGHT_TYPE = {}));
/** UBO ready lighting module */
export const lighting = {
    props: {},
    uniforms: {},
    name: 'lighting',
    defines: {
    // MAX_LIGHTS
    },
    uniformTypes: {
        enabled: 'i32',
        lightType: 'i32',
        directionalLightCount: 'i32',
        pointLightCount: 'i32',
        ambientColor: 'vec3<f32>',
        // TODO define as arrays once we have appropriate uniformTypes
        lightColor0: 'vec3<f32>',
        lightPosition0: 'vec3<f32>',
        // TODO - could combine direction and attenuation
        lightDirection0: 'vec3<f32>',
        lightAttenuation0: 'vec3<f32>',
        lightColor1: 'vec3<f32>',
        lightPosition1: 'vec3<f32>',
        lightDirection1: 'vec3<f32>',
        lightAttenuation1: 'vec3<f32>',
        lightColor2: 'vec3<f32>',
        lightPosition2: 'vec3<f32>',
        lightDirection2: 'vec3<f32>',
        lightAttenuation2: 'vec3<f32>'
    },
    defaultUniforms: {
        enabled: 1,
        lightType: LIGHT_TYPE.POINT,
        directionalLightCount: 0,
        pointLightCount: 0,
        ambientColor: [0.1, 0.1, 0.1],
        lightColor0: [1, 1, 1],
        lightPosition0: [1, 1, 2],
        // TODO - could combine direction and attenuation
        lightDirection0: [1, 1, 1],
        lightAttenuation0: [1, 0, 0],
        lightColor1: [1, 1, 1],
        lightPosition1: [1, 1, 2],
        lightDirection1: [1, 1, 1],
        lightAttenuation1: [1, 0, 0],
        lightColor2: [1, 1, 1],
        lightPosition2: [1, 1, 2],
        lightDirection2: [1, 1, 1],
        lightAttenuation2: [1, 0, 0]
    },
    source: lightingUniformsWGSL,
    vs: lightingUniformsGLSL,
    fs: lightingUniformsGLSL,
    getUniforms
};
function getUniforms(props, prevUniforms = {}) {
    // Copy props so we can modify
    props = props ? { ...props } : props;
    // TODO legacy
    if (!props) {
        return { ...lighting.defaultUniforms };
    }
    // Support for array of lights. Type of light is detected by type field
    if (props.lights) {
        props = { ...props, ...extractLightTypes(props.lights), lights: undefined };
    }
    // Specify lights separately
    const { ambientLight, pointLights, directionalLights } = props || {};
    const hasLights = ambientLight ||
        (pointLights && pointLights.length > 0) ||
        (directionalLights && directionalLights.length > 0);
    // TODO - this may not be the correct decision
    if (!hasLights) {
        return { ...lighting.defaultUniforms, enabled: 0 };
    }
    const uniforms = {
        ...lighting.defaultUniforms,
        ...prevUniforms,
        ...getLightSourceUniforms({ ambientLight, pointLights, directionalLights })
    };
    if (props.enabled !== undefined) {
        uniforms.enabled = props.enabled ? 1 : 0;
    }
    return uniforms;
}
function getLightSourceUniforms({ ambientLight, pointLights = [], directionalLights = [] }) {
    const lightSourceUniforms = {};
    lightSourceUniforms.ambientColor = convertColor(ambientLight);
    let currentLight = 0;
    for (const pointLight of pointLights) {
        lightSourceUniforms.lightType = LIGHT_TYPE.POINT;
        const i = currentLight;
        lightSourceUniforms[`lightColor${i}`] = convertColor(pointLight);
        lightSourceUniforms[`lightPosition${i}`] = pointLight.position;
        lightSourceUniforms[`lightAttenuation${i}`] = pointLight.attenuation || [1, 0, 0];
        currentLight++;
    }
    for (const directionalLight of directionalLights) {
        lightSourceUniforms.lightType = LIGHT_TYPE.DIRECTIONAL;
        const i = currentLight;
        lightSourceUniforms[`lightColor${i}`] = convertColor(directionalLight);
        lightSourceUniforms[`lightDirection${i}`] = directionalLight.direction;
        currentLight++;
    }
    if (currentLight > MAX_LIGHTS) {
        log.warn('MAX_LIGHTS exceeded')();
    }
    lightSourceUniforms.directionalLightCount = directionalLights.length;
    lightSourceUniforms.pointLightCount = pointLights.length;
    return lightSourceUniforms;
}
function extractLightTypes(lights) {
    const lightSources = { pointLights: [], directionalLights: [] };
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
function convertColor(colorDef = {}) {
    const { color = [0, 0, 0], intensity = 1.0 } = colorDef;
    return color.map(component => (component * intensity) / COLOR_FACTOR);
}
