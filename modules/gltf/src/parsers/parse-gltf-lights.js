import { Matrix4 } from '@math.gl/core';
/** Parse KHR_lights_punctual extension into luma.gl light definitions */
export function parseGLTFLights(gltf) {
    const lightDefs = gltf.extensions?.['KHR_lights_punctual']?.['lights'];
    if (!lightDefs || !Array.isArray(lightDefs) || lightDefs.length === 0) {
        return [];
    }
    const lights = [];
    for (const node of gltf.nodes || []) {
        const nodeLight = node.extensions?.KHR_lights_punctual;
        if (!nodeLight || typeof nodeLight.light !== 'number') {
            // eslint-disable-next-line no-continue
            continue;
        }
        const gltfLight = lightDefs[nodeLight.light];
        if (!gltfLight) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const color = (gltfLight.color || [1, 1, 1]);
        const intensity = gltfLight.intensity ?? 1;
        const range = gltfLight.range;
        switch (gltfLight.type) {
            case 'directional':
                lights.push(parseDirectionalLight(node, color, intensity));
                break;
            case 'point':
                lights.push(parsePointLight(node, color, intensity, range));
                break;
            case 'spot':
                lights.push(parsePointLight(node, color, intensity, range));
                break;
            default:
                // Unsupported light type
                break;
        }
    }
    return lights;
}
function parsePointLight(node, color, intensity, range) {
    const position = node.translation
        ? [...node.translation]
        : [0, 0, 0];
    let attenuation = [1, 0, 0];
    if (range !== undefined && range > 0) {
        attenuation = [1, 0, 1 / (range * range)];
    }
    return {
        type: 'point',
        position,
        color,
        intensity,
        attenuation
    };
}
function parseDirectionalLight(node, color, intensity) {
    let direction = [0, 0, -1];
    if (node.rotation) {
        const orientation = new Matrix4().fromQuaternion(node.rotation);
        direction = orientation.transformDirection([0, 0, -1]);
    }
    return {
        type: 'directional',
        direction,
        color,
        intensity
    };
}
