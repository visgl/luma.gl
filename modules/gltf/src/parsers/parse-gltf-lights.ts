import {Matrix4} from '@math.gl/core';
import type {GLTFNodePostprocessed, GLTFPostprocessed} from '@loaders.gl/gltf';
import type {DirectionalLight, Light, PointLight, SpotLight} from '@luma.gl/shadertools';

const GLTF_COLOR_FACTOR = 255;

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
  const parentNodeById = createParentNodeMap(gltf.nodes || []);
  const worldMatrixByNodeId = new Map<string, Matrix4>();

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

    const color = normalizeGLTFLightColor(
      (gltfLight.color || [1, 1, 1]) as [number, number, number]
    );
    const intensity = gltfLight.intensity ?? 1;
    const range = gltfLight.range;
    const worldMatrix = getNodeWorldMatrix(node, parentNodeById, worldMatrixByNodeId);

    switch (gltfLight.type) {
      case 'directional':
        lights.push(parseDirectionalLight(worldMatrix, color, intensity));
        break;
      case 'point':
        lights.push(parsePointLight(worldMatrix, color, intensity, range));
        break;
      case 'spot':
        lights.push(parseSpotLight(worldMatrix, color, intensity, range, gltfLight.spot));
        break;
      default:
        // Unsupported light type
        break;
    }
  }

  return lights;
}

/**
 * Converts glTF colors from the 0-1 spec range to luma.gl's 0-255 light convention.
 */
function normalizeGLTFLightColor(color: [number, number, number]): [number, number, number] {
  return color.map(component => component * GLTF_COLOR_FACTOR) as [number, number, number];
}

/**
 * Converts a glTF punctual light attached to a node into a point light.
 */
function parsePointLight(
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number,
  range?: number
): PointLight {
  const position = getLightPosition(worldMatrix);

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
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number
): DirectionalLight {
  const direction = getLightDirection(worldMatrix);

  return {
    type: 'directional',
    direction,
    color,
    intensity
  };
}

/**
 * Converts a glTF punctual light attached to a node into a spot light.
 */
function parseSpotLight(
  worldMatrix: Matrix4,
  color: [number, number, number],
  intensity: number,
  range?: number,
  spot: {innerConeAngle?: number; outerConeAngle?: number} = {}
): SpotLight {
  const position = getLightPosition(worldMatrix);
  const direction = getLightDirection(worldMatrix);

  let attenuation: Readonly<[number, number, number]> = [1, 0, 0];
  if (range !== undefined && range > 0) {
    attenuation = [1, 0, 1 / (range * range)] as [number, number, number];
  }

  return {
    type: 'spot',
    position,
    direction,
    color,
    intensity,
    attenuation,
    innerConeAngle: spot.innerConeAngle ?? 0,
    outerConeAngle: spot.outerConeAngle ?? Math.PI / 4
  };
}

/**
 * Builds a parent lookup so punctual lights can be resolved in world space.
 */
function createParentNodeMap(nodes: GLTFNodePostprocessed[]): Map<string, GLTFNodePostprocessed> {
  const parentNodeById = new Map<string, GLTFNodePostprocessed>();

  for (const node of nodes) {
    for (const childNode of node.children || []) {
      parentNodeById.set(childNode.id, node);
    }
  }

  return parentNodeById;
}

/**
 * Resolves a glTF node's world matrix from its local transform and parent chain.
 */
function getNodeWorldMatrix(
  node: GLTFNodePostprocessed,
  parentNodeById: Map<string, GLTFNodePostprocessed>,
  worldMatrixByNodeId: Map<string, Matrix4>
): Matrix4 {
  const cachedWorldMatrix = worldMatrixByNodeId.get(node.id);
  if (cachedWorldMatrix) {
    return cachedWorldMatrix;
  }

  const localMatrix = getNodeLocalMatrix(node);
  const parentNode = parentNodeById.get(node.id);
  const worldMatrix = parentNode
    ? new Matrix4(
        getNodeWorldMatrix(parentNode, parentNodeById, worldMatrixByNodeId)
      ).multiplyRight(localMatrix)
    : localMatrix;

  worldMatrixByNodeId.set(node.id, worldMatrix);
  return worldMatrix;
}

/**
 * Resolves a glTF node's local matrix from its matrix or TRS components.
 */
function getNodeLocalMatrix(node: GLTFNodePostprocessed): Matrix4 {
  if (node.matrix) {
    return new Matrix4(node.matrix);
  }

  const matrix = new Matrix4();

  if (node.translation) {
    matrix.translate(node.translation);
  }

  if (node.rotation) {
    matrix.multiplyRight(new Matrix4().fromQuaternion(node.rotation));
  }

  if (node.scale) {
    matrix.scale(node.scale);
  }

  return matrix;
}

/**
 * Resolves the world-space position of a glTF light node.
 */
function getLightPosition(worldMatrix: Matrix4): [number, number, number] {
  return worldMatrix.transformAsPoint([0, 0, 0]) as [number, number, number];
}

/**
 * Resolves the world-space forward direction of a glTF light node.
 */
function getLightDirection(worldMatrix: Matrix4): [number, number, number] {
  return worldMatrix.transformDirection([0, 0, -1]) as [number, number, number];
}
