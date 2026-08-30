// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const TEMPEST_OCEAN_SCENE_PARAMETERS = /* wgsl */ `\
struct TempestOceanSceneParameters {
  viewProjectionMatrix: mat4x4f,
  inverseViewProjectionMatrix: mat4x4f,
  cameraAndTime: vec4f,
  sunAndStorm: vec4f,
  surface: vec4f,
};
@group(0) @binding(auto) var<uniform> tempestOceanScene: TempestOceanSceneParameters;
`;

const TEMPEST_OCEAN_ATMOSPHERE = /* wgsl */ `\
fn tempestHash(position: vec2f) -> f32 {
  let hashPosition = fract(position * vec2f(123.34, 456.21));
  let mixed = hashPosition + dot(hashPosition, hashPosition + vec2f(45.32));
  return fract(mixed.x * mixed.y);
}

fn tempestNoise(position: vec2f) -> f32 {
  let cell = floor(position);
  let local = fract(position);
  let blend = local * local * (3.0 - 2.0 * local);
  return mix(
    mix(tempestHash(cell), tempestHash(cell + vec2f(1.0, 0.0)), blend.x),
    mix(tempestHash(cell + vec2f(0.0, 1.0)), tempestHash(cell + vec2f(1.0)), blend.x),
    blend.y
  );
}

fn tempestCloudNoise(position: vec2f) -> f32 {
  var coordinate = position;
  var value = 0.0;
  var weight = 0.52;
  for (var octave = 0u; octave < 4u; octave++) {
    value += tempestNoise(coordinate) * weight;
    coordinate = mat2x2f(1.55, 1.21, -1.21, 1.55) * coordinate + vec2f(2.7, -1.9);
    weight *= 0.5;
  }
  return value;
}

fn getTempestSkyColor(directionInput: vec3f) -> vec3f {
  let direction = normalize(vec3f(directionInput.x, max(directionInput.y, -0.08), directionInput.z));
  let sunDirection = normalize(tempestOceanScene.sunAndStorm.xyz);
  let storm = tempestOceanScene.sunAndStorm.w;
  let time = tempestOceanScene.cameraAndTime.w;
  let elevation = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
  let horizon = pow(1.0 - abs(direction.y), 4.0);
  let zenithColor = mix(vec3f(0.018, 0.04, 0.075), vec3f(0.03, 0.085, 0.16), 1.0 - storm);
  let horizonColor = mix(vec3f(0.17, 0.145, 0.16), vec3f(0.22, 0.32, 0.42), 1.0 - storm);
  var color = mix(horizonColor, zenithColor, smoothstep(0.46, 0.88, elevation));

  let cloudProjection = direction.xz / max(direction.y + 0.32, 0.09);
  let cloudCoordinate = cloudProjection * 0.68 + vec2f(time * 0.011, -time * 0.006);
  let cloudNoise = tempestCloudNoise(cloudCoordinate);
  let cloudMask = smoothstep(0.48, 0.74, cloudNoise + horizon * 0.08) * storm;
  let cloudShade = mix(vec3f(0.055, 0.07, 0.095), vec3f(0.19, 0.21, 0.24), cloudNoise);
  color = mix(color, cloudShade, cloudMask * (0.68 + 0.22 * elevation));

  let sunAlignment = max(dot(direction, sunDirection), 0.0);
  let sunDisk = smoothstep(0.99976, 0.99994, sunAlignment);
  let sunHalo = pow(sunAlignment, 720.0);
  let horizontalDirection = direction.xz / max(length(direction.xz), 0.00001);
  let horizontalSunDirection = sunDirection.xz / max(length(sunDirection.xz), 0.00001);
  let sunBreak = pow(max(dot(horizontalDirection, horizontalSunDirection), 0.0), 8.0) *
    exp(-abs(direction.y - sunDirection.y) * 13.0);
  let cloudTransmission = 1.0 - cloudMask * 0.68;
  color += vec3f(1.35, 0.68, 0.2) * sunHalo * cloudTransmission;
  color += vec3f(10.0, 6.0, 2.15) * sunDisk * cloudTransmission;
  color += vec3f(0.24, 0.095, 0.028) * sunBreak * (0.25 + horizon * 0.75);
  return max(color, vec3f(0.0));
}
`;

/** Fullscreen procedural HDR stormfront and low sun. */
export const TEMPEST_OCEAN_SKY_SHADER = /* wgsl */ `\
${TEMPEST_OCEAN_SCENE_PARAMETERS}
${TEMPEST_OCEAN_ATMOSPHERE}

struct SkyFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) clipPosition: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> SkyFragmentInputs {
  let positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  let clipPosition = positions[vertexIndex];
  var output: SkyFragmentInputs;
  output.position = vec4f(clipPosition, 1.0, 1.0);
  output.clipPosition = clipPosition;
  return output;
}

@fragment fn fragmentMain(inputs: SkyFragmentInputs) -> @location(0) vec4f {
  let farClip = vec4f(inputs.clipPosition, 1.0, 1.0);
  let worldPositionHomogeneous = tempestOceanScene.inverseViewProjectionMatrix * farClip;
  let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
  let direction = normalize(worldPosition - tempestOceanScene.cameraAndTime.xyz);
  return vec4f(getTempestSkyColor(direction), 1.0);
}
`;

/** Procedural tiled grid that consumes the reusable simulation storage buffers directly. */
export const TEMPEST_OCEAN_SURFACE_SHADER = /* wgsl */ `\
${TEMPEST_OCEAN_SCENE_PARAMETERS}
${TEMPEST_OCEAN_ATMOSPHERE}

@group(0) @binding(0) var<storage, read> oceanDisplacements: array<vec4f>;
@group(0) @binding(1) var<storage, read> oceanNormalFoam: array<vec4f>;

struct OceanSurfaceSample {
  displacement: vec3f,
  normal: vec3f,
  foam: f32,
};

struct OceanFragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) foam: f32,
};

fn getOceanIndex(coordinate: vec2u, resolution: u32) -> u32 {
  let wrapped = coordinate % vec2u(resolution);
  return wrapped.y * resolution + wrapped.x;
}

fn sampleOceanSurface(uv: vec2f) -> OceanSurfaceSample {
  let resolution = u32(tempestOceanScene.surface.y);
  let samplePosition = fract(uv) * f32(resolution);
  let baseCoordinate = vec2u(floor(samplePosition));
  let blend = fract(samplePosition);
  let index00 = getOceanIndex(baseCoordinate, resolution);
  let index10 = getOceanIndex(baseCoordinate + vec2u(1u, 0u), resolution);
  let index01 = getOceanIndex(baseCoordinate + vec2u(0u, 1u), resolution);
  let index11 = getOceanIndex(baseCoordinate + vec2u(1u), resolution);
  let displacementBottom = mix(oceanDisplacements[index00].xyz, oceanDisplacements[index10].xyz, blend.x);
  let displacementTop = mix(oceanDisplacements[index01].xyz, oceanDisplacements[index11].xyz, blend.x);
  let normalFoamBottom = mix(oceanNormalFoam[index00], oceanNormalFoam[index10], blend.x);
  let normalFoamTop = mix(oceanNormalFoam[index01], oceanNormalFoam[index11], blend.x);
  let normalFoam = mix(normalFoamBottom, normalFoamTop, blend.y);
  var sample: OceanSurfaceSample;
  sample.displacement = mix(displacementBottom, displacementTop, blend.y);
  sample.normal = normalize(normalFoam.xyz);
  sample.foam = clamp(normalFoam.w, 0.0, 1.0);
  return sample;
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> OceanFragmentInputs {
  let cornerPattern = array<vec2u, 6>(
    vec2u(0u, 0u), vec2u(1u, 1u), vec2u(1u, 0u),
    vec2u(0u, 0u), vec2u(0u, 1u), vec2u(1u, 1u)
  );
  let gridResolution = u32(tempestOceanScene.surface.z);
  let cellResolution = gridResolution - 1u;
  let cellIndex = vertexIndex / 6u;
  let cellCoordinate = vec2u(cellIndex % cellResolution, cellIndex / cellResolution);
  let gridCoordinate = cellCoordinate + cornerPattern[vertexIndex % 6u];
  let uv = vec2f(gridCoordinate) / f32(cellResolution);
  let patchSize = tempestOceanScene.surface.x;
  let tileCount = u32(tempestOceanScene.surface.w);
  let halfTileCount = i32(tileCount / 2u);
  let tileCoordinate = vec2i(
    i32(instanceIndex % tileCount) - halfTileCount,
    i32(instanceIndex / tileCount) - halfTileCount
  );
  let tileOffset = vec2f(tileCoordinate) * patchSize;
  let surfaceSample = sampleOceanSurface(uv);
  let basePosition = vec3f(
    (uv.x - 0.5) * patchSize + tileOffset.x,
    0.0,
    (uv.y - 0.5) * patchSize + tileOffset.y
  );
  let worldPosition = basePosition + surfaceSample.displacement;
  var output: OceanFragmentInputs;
  output.position = tempestOceanScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = surfaceSample.normal;
  output.foam = surfaceSample.foam;
  return output;
}

@fragment fn fragmentMain(inputs: OceanFragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let cameraPosition = tempestOceanScene.cameraAndTime.xyz;
  let viewDirection = normalize(cameraPosition - inputs.worldPosition);
  let sunDirection = normalize(tempestOceanScene.sunAndStorm.xyz);
  let halfDirection = normalize(viewDirection + sunDirection);
  let normalView = max(dot(normal, viewDirection), 0.0);
  let normalSun = max(dot(normal, sunDirection), 0.0);
  let fresnel = 0.018 + 0.982 * pow(1.0 - normalView, 5.0);
  let reflectionDirection = reflect(-viewDirection, normal);
  let reflectedSky = getTempestSkyColor(reflectionDirection);
  let slopeEnergy = 1.0 - clamp(normal.y, 0.0, 1.0);
  let deepWater = vec3f(0.014, 0.07, 0.115);
  let crestWater = vec3f(0.045, 0.235, 0.315);
  var color = mix(deepWater, crestWater, clamp(slopeEnergy * 2.3 + normalSun * 0.22, 0.0, 1.0));
  color = mix(color, reflectedSky, clamp(fresnel * 0.88 + slopeEnergy * 0.18, 0.0, 1.0));

  let sunSpecular = pow(max(dot(normal, halfDirection), 0.0), mix(168.0, 42.0, inputs.foam));
  color += vec3f(7.5, 4.4, 1.55) * sunSpecular * normalSun * (1.0 - inputs.foam * 0.58);
  let foamCompression = clamp(inputs.foam + slopeEnergy * 0.35, 0.0, 1.0);
  let foamWidth = max(fwidth(foamCompression) * 1.05, 0.015);
  let foamContour = smoothstep(0.18 - foamWidth, 0.5 + foamWidth, foamCompression);
  let foamNoise = tempestNoise(
    inputs.worldPosition.xz * 0.13 + vec2f(tempestOceanScene.cameraAndTime.w * 0.31, -tempestOceanScene.cameraAndTime.w * 0.19)
  );
  let foamMask = clamp(foamContour * mix(0.5, 0.95, smoothstep(0.28, 0.72, foamNoise)), 0.0, 1.0);
  let foamColor = vec3f(0.56, 0.76, 0.94) * (0.72 + normalSun * 0.5) +
    reflectedSky * 0.13 + vec3f(0.7, 0.38, 0.12) * sunSpecular;
  color = mix(color, foamColor, foamMask * (0.7 + slopeEnergy * 0.18));

  let horizontalDistance = length(inputs.worldPosition.xz - cameraPosition.xz);
  let patchSize = tempestOceanScene.surface.x;
  let horizonFog = smoothstep(patchSize * 0.72, patchSize * 1.48, horizontalDistance);
  let horizonDirection = normalize(vec3f(
    inputs.worldPosition.x - cameraPosition.x,
    0.035 * patchSize,
    inputs.worldPosition.z - cameraPosition.z
  ));
  color = mix(color, getTempestSkyColor(horizonDirection), horizonFog * 0.84);
  return vec4f(max(color, vec3f(0.0)), 1.0);
}
`;
