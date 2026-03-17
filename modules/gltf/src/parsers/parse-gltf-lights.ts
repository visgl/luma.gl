import {Matrix4} from '@math.gl/core';
import type {GLTFNodePostprocessed, GLTFPostprocessed} from '@loaders.gl/gltf';
import type {DirectionalLight, Light, PointLight} from '@luma.gl/shadertools';

/** Parse KHR_lights_punctual extension into luma.gl light definitions */
export function parseGLTFLights(gltf: GLTFPostprocessed): Light[] {
  const lightDefs =
    // `postProcessGLTF()` moves KHR_lights_punctual into `gltf.lights`.
    (gltf as GLTFPostprocessed & {lights?: any[]}).lights ||
    gltf.extensions?.['KHR_lights_punctual']?.['lights'];
  if (!lightDefs || !Array.isArray(lightDefs) || lightDefs.length === 0) {
    return [];
  }

  const lights: Light[] = [];

  for (const node of gltf.nodes || []) {
    const lightIndex =
      (node as GLTFNodePostprocessed & {light?: number}).light ??
      node.extensions?.KHR_lights_punctual?.light;
    if (typeof lightIndex !== 'number') {
      // eslint-disable-next-line no-continue
      continue;
    }
    const gltfLight = lightDefs[lightIndex];
    if (!gltfLight) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const color = (gltfLight.color || [1, 1, 1]) as [number, number, number];
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

/**
 * Converts a glTF punctual light attached to a node into a point light.
 */
function parsePointLight(
  node: GLTFNodePostprocessed,
  color: [number, number, number],
  intensity: number,
  range?: number
): PointLight {
  const position = getNodePosition(node);

  let attenuation: Readonly<[number, number, number]> = [1, 0, 0];
  if (range !== undefined && range > 0) {
    attenuation = [1, 0, 1 / (range * range)] as [number, number, number];
  }

  return {
    type: 'point',
    position,
    color,
    intensity,
    attenuation
  };
}

/**
 * Converts a glTF punctual light attached to a node into a directional light.
 */
function parseDirectionalLight(
  node: GLTFNodePostprocessed,
  color: [number, number, number],
  intensity: number
): DirectionalLight {
  const direction = getNodeDirection(node);

  return {
    type: 'directional',
    direction,
    color,
    intensity
  };
}

/**
 * Resolves the world-space position of a glTF node from its matrix or translation.
 */
function getNodePosition(node: GLTFNodePostprocessed): [number, number, number] {
  if (node.matrix) {
    return new Matrix4(node.matrix).transformAsPoint([0, 0, 0]) as [number, number, number];
  }

  if (node.translation) {
    return [...node.translation] as [number, number, number];
  }

  return [0, 0, 0];
}

/**
 * Resolves the forward direction of a glTF node from its matrix or rotation.
 */
function getNodeDirection(node: GLTFNodePostprocessed): [number, number, number] {
  if (node.matrix) {
    return new Matrix4(node.matrix).transformDirection([0, 0, -1]) as [number, number, number];
  }

  if (node.rotation) {
    return new Matrix4().fromQuaternion(node.rotation).transformDirection([0, 0, -1]) as [
      number,
      number,
      number
    ];
  }

  return [0, 0, -1];
}
