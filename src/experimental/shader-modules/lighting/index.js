import {readFileSync} from 'fs';
import {join} from 'path';
import {Vector3} from '../../../packages/math';

const commonShader = readFileSync(join(__dirname, './lighting-common.glsl'));

export const name = 'lighting';

export const config = {
  MAX_POINT_LIGHTS: 4
};

export const vertexShader = `\
${commonShader}
${readFileSync(join(__dirname, './lighting-vertex.glsl'))}
`;

export const fragmentShader = `\
${commonShader}
${readFileSync(join(__dirname, './lighting-fragment.glsl'))}
`;

// Setup the lighting system: ambient, directional, point lights.
export function getUniforms({
  lightingEnable = false,

  // ambient light
  lightingAmbientColor = [0.2, 0.2, 0.2],

  // directional light
  lightingDirection = [1, 1, 1],
  lightingDirectionalColor = [0, 0, 0],

  // point lights
  lightingPointLights = []
}) {
  // Set light uniforms. Ambient, directional and point lights.
  return {
    lightingEnable,
    // Ambient
    lightingAmbientColor,
    ...getDirectionalUniforms(lightingDirection),
    ...getPointUniforms(lightingPointLights)
  };
}

function getDirectionalUniforms({color, direction}) {
  // Normalize lighting direction vector
  const dir = new Vector3(direction.x, direction.y, direction.z)
    .normalize()
    .scale(-1, -1, -1);

  return {
    directionalColor: [color.r, color.g, color.b],
    lightingDirection: [dir.x, dir.y, dir.z]
  };
}

function getPointUniforms(points) {
  points = points instanceof Array ? points : [points];
  const numberPoints = points.length;
  const pointLocations = [];
  const pointColors = [];
  const enableSpecular = [];
  const pointSpecularColors = [];
  for (const point of points) {
    const {position, color, diffuse, specular} = point;
    const pointColor = color || diffuse;

    pointLocations.push(position.x, position.y, position.z);
    pointColors.push(pointColor.r, pointColor.g, pointColor.b);

    // Add specular color
    enableSpecular.push(Number(Boolean(specular)));
    if (specular) {
      pointSpecularColors.push(specular.r, specular.g, specular.b);
    } else {
      pointSpecularColors.push(0, 0, 0);
    }
  }

  return {
    numberPoints,
    pointLocation: pointLocations,
    pointColor: pointColors,
    enableSpecular,
    pointSpecularColor: pointSpecularColors
  };
}
