import type {ShaderModule} from '@luma.gl/shadertools';
import {lighting} from '@luma.gl/shadertools';
import type {Matrix4, NumberArray3, NumberArray16} from '@math.gl/core';

export type ANARIAppUniforms = {
  viewMatrix: Readonly<NumberArray16 | Matrix4>;
  projectionMatrix: Readonly<NumberArray16 | Matrix4>;
  cameraPosition: Readonly<NumberArray3>;
  exposure: number;
  fogColor: Readonly<NumberArray3>;
  fogDensity: number;
  renderMode: number;
  highDynamicRange: number;
  time: number;
};

export type ANARIMaterialUniforms = {
  baseColor: Readonly<NumberArray3>;
  emissiveColor: Readonly<NumberArray3>;
  metallic: number;
  roughness: number;
  opacity: number;
  clearcoat: number;
  iridescence: number;
};

export const anariAppModule = {
  name: 'anariApp',
  uniformTypes: {
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    exposure: 'f32',
    fogColor: 'vec3<f32>',
    fogDensity: 'f32',
    renderMode: 'i32',
    highDynamicRange: 'i32',
    time: 'f32'
  }
} as const satisfies ShaderModule<ANARIAppUniforms>;

const ANARI_MATERIAL_WGSL = /* wgsl */ `
struct anariMaterialUniforms {
  baseColor: vec3f,
  emissiveColor: vec3f,
  metallic: f32,
  roughness: f32,
  opacity: f32,
  clearcoat: f32,
  iridescence: f32,
};

@group(3) @binding(auto) var<uniform> anariMaterial: anariMaterialUniforms;

fn anariEvaluateLight(
  normalDirection: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  lightColor: vec3f,
  baseColor: vec3f
) -> vec3f {
  let halfDirection = normalize(viewDirection + lightDirection);
  let normalLight = max(dot(normalDirection, lightDirection), 0.0);
  let normalView = max(dot(normalDirection, viewDirection), 0.001);
  let normalHalf = max(dot(normalDirection, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
  let roughness = max(anariMaterial.roughness, 0.065);
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let denominator = normalHalf * normalHalf * (alphaSquared - 1.0) + 1.0;
  let distribution = alphaSquared / max(3.14159265 * denominator * denominator, 0.0001);
  let geometryFactor = (roughness + 1.0) * (roughness + 1.0) * 0.125;
  let visibilityView = normalView / (normalView * (1.0 - geometryFactor) + geometryFactor);
  let visibilityLight = normalLight / (normalLight * (1.0 - geometryFactor) + geometryFactor);
  let reflectance = mix(vec3f(0.045), baseColor, anariMaterial.metallic);
  let fresnel = reflectance + (vec3f(1.0) - reflectance) * pow(1.0 - viewHalf, 5.0);
  let specular = distribution * visibilityView * visibilityLight * fresnel /
    max(4.0 * normalView * normalLight, 0.001);
  let diffuse = (vec3f(1.0) - fresnel) * (1.0 - anariMaterial.metallic) * baseColor /
    3.14159265;
  let clearcoatHalf = pow(normalHalf, mix(24.0, 240.0, anariMaterial.clearcoat));
  let clearcoat = vec3f(clearcoatHalf * anariMaterial.clearcoat * 0.32);
  return (diffuse + specular + clearcoat) * lightColor * normalLight;
}

fn anariShade(worldPosition: vec3f, worldNormal: vec3f, cameraPosition: vec3f) -> vec3f {
  let normalDirection = normalize(worldNormal);
  let viewDirection = normalize(cameraPosition - worldPosition);
  let fresnelAngle = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 2.0);
  let spectralPhase = fresnelAngle * 9.0 + worldPosition.y * 0.22;
  let spectralColor = 0.5 + 0.5 * cos(vec3f(0.0, 2.094, 4.188) + vec3f(spectralPhase));
  let baseColor = mix(anariMaterial.baseColor, spectralColor, anariMaterial.iridescence * fresnelAngle);
  let skyFactor = normalDirection.y * 0.5 + 0.5;
  let skyColor = mix(vec3f(0.10, 0.12, 0.17), vec3f(0.34, 0.42, 0.59), skyFactor);
  var shadedColor = baseColor * (lighting.ambientColor + skyColor * 0.22);

  for (var lightIndex = 0; lightIndex < lighting.pointLightCount; lightIndex++) {
    let light = lighting_getPointLight(lightIndex);
    let lightOffset = light.position - worldPosition;
    let lightDistance = length(lightOffset);
    let attenuation = getPointLightAttenuation(light, lightDistance);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(lightOffset),
      light.color / max(attenuation, 0.01),
      baseColor
    );
  }

  for (var lightIndex = 0; lightIndex < lighting.spotLightCount; lightIndex++) {
    let light = lighting_getSpotLight(lightIndex);
    let attenuation = getSpotLightAttenuation(light, worldPosition);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(light.position - worldPosition),
      light.color / max(attenuation, 0.01),
      baseColor
    );
  }

  for (var lightIndex = 0; lightIndex < lighting.directionalLightCount; lightIndex++) {
    let light = lighting_getDirectionalLight(lightIndex);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(-light.direction),
      light.color,
      baseColor
    );
  }

  return shadedColor + anariMaterial.emissiveColor;
}
`;

const ANARI_MATERIAL_GLSL = /* glsl */ `
layout(std140) uniform anariMaterialUniforms {
  vec3 baseColor;
  vec3 emissiveColor;
  float metallic;
  float roughness;
  float opacity;
  float clearcoat;
  float iridescence;
} anariMaterial;

vec3 anariEvaluateLight(
  vec3 normalDirection,
  vec3 viewDirection,
  vec3 lightDirection,
  vec3 lightColor,
  vec3 baseColor
) {
  vec3 halfDirection = normalize(viewDirection + lightDirection);
  float normalLight = max(dot(normalDirection, lightDirection), 0.0);
  float normalView = max(dot(normalDirection, viewDirection), 0.001);
  float normalHalf = max(dot(normalDirection, halfDirection), 0.0);
  float viewHalf = max(dot(viewDirection, halfDirection), 0.0);
  float roughness = max(anariMaterial.roughness, 0.065);
  float alpha = roughness * roughness;
  float alphaSquared = alpha * alpha;
  float denominator = normalHalf * normalHalf * (alphaSquared - 1.0) + 1.0;
  float distribution = alphaSquared / max(3.14159265 * denominator * denominator, 0.0001);
  float geometryFactor = (roughness + 1.0) * (roughness + 1.0) * 0.125;
  float visibilityView = normalView / (normalView * (1.0 - geometryFactor) + geometryFactor);
  float visibilityLight = normalLight / (normalLight * (1.0 - geometryFactor) + geometryFactor);
  vec3 reflectance = mix(vec3(0.045), baseColor, anariMaterial.metallic);
  vec3 fresnel = reflectance + (vec3(1.0) - reflectance) * pow(1.0 - viewHalf, 5.0);
  vec3 specular = distribution * visibilityView * visibilityLight * fresnel /
    max(4.0 * normalView * normalLight, 0.001);
  vec3 diffuse = (vec3(1.0) - fresnel) * (1.0 - anariMaterial.metallic) * baseColor /
    3.14159265;
  float clearcoatHalf = pow(normalHalf, mix(24.0, 240.0, anariMaterial.clearcoat));
  vec3 clearcoat = vec3(clearcoatHalf * anariMaterial.clearcoat * 0.32);
  return (diffuse + specular + clearcoat) * lightColor * normalLight;
}

vec3 anariShade(vec3 worldPosition, vec3 worldNormal, vec3 cameraPosition) {
  vec3 normalDirection = normalize(worldNormal);
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  float fresnelAngle = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 2.0);
  float spectralPhase = fresnelAngle * 9.0 + worldPosition.y * 0.22;
  vec3 spectralColor = 0.5 + 0.5 * cos(vec3(0.0, 2.094, 4.188) + vec3(spectralPhase));
  vec3 baseColor = mix(anariMaterial.baseColor, spectralColor, anariMaterial.iridescence * fresnelAngle);
  float skyFactor = normalDirection.y * 0.5 + 0.5;
  vec3 skyColor = mix(vec3(0.10, 0.12, 0.17), vec3(0.34, 0.42, 0.59), skyFactor);
  vec3 shadedColor = baseColor * (lighting.ambientColor + skyColor * 0.22);

  for (int lightIndex = 0; lightIndex < 5; lightIndex++) {
    if (lightIndex >= lighting.pointLightCount) {
      break;
    }
    PointLight light = lighting_getPointLight(lightIndex);
    vec3 lightOffset = light.position - worldPosition;
    float lightDistance = length(lightOffset);
    float attenuation = getPointLightAttenuation(light, lightDistance);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(lightOffset),
      light.color / max(attenuation, 0.01),
      baseColor
    );
  }

  for (int lightIndex = 0; lightIndex < 5; lightIndex++) {
    if (lightIndex >= lighting.spotLightCount) {
      break;
    }
    SpotLight light = lighting_getSpotLight(lightIndex);
    float attenuation = getSpotLightAttenuation(light, worldPosition);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(light.position - worldPosition),
      light.color / max(attenuation, 0.01),
      baseColor
    );
  }

  for (int lightIndex = 0; lightIndex < 5; lightIndex++) {
    if (lightIndex >= lighting.directionalLightCount) {
      break;
    }
    DirectionalLight light = lighting_getDirectionalLight(lightIndex);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(-light.direction),
      light.color,
      baseColor
    );
  }

  return shadedColor + anariMaterial.emissiveColor;
}
`;

export const anariMaterialModule = {
  name: 'anariMaterial',
  bindingLayout: [{name: 'anariMaterial', group: 3}],
  dependencies: [lighting],
  source: ANARI_MATERIAL_WGSL,
  vs: ANARI_MATERIAL_GLSL,
  fs: ANARI_MATERIAL_GLSL,
  uniformTypes: {
    baseColor: 'vec3<f32>',
    emissiveColor: 'vec3<f32>',
    metallic: 'f32',
    roughness: 'f32',
    opacity: 'f32',
    clearcoat: 'f32',
    iridescence: 'f32'
  },
  defaultUniforms: {
    baseColor: [0.8, 0.8, 0.8],
    emissiveColor: [0, 0, 0],
    metallic: 0,
    roughness: 0.45,
    opacity: 1,
    clearcoat: 0,
    iridescence: 0
  }
} as const satisfies ShaderModule<ANARIMaterialUniforms>;

export const ANARI_VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 positions;
in vec3 normals;
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;

uniform anariAppUniforms {
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 cameraPosition;
  float exposure;
  vec3 fogColor;
  float fogDensity;
  int renderMode;
  int highDynamicRange;
  float time;
} anariApp;

out vec3 fragmentWorldPosition;
out vec3 fragmentWorldNormal;

void main() {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  vec4 worldPosition = modelMatrix * vec4(positions, 1.0);
  fragmentWorldPosition = worldPosition.xyz;
  fragmentWorldNormal = normalize(mat3(modelMatrix) * normals);
  gl_Position = anariApp.projectionMatrix * anariApp.viewMatrix * worldPosition;
}
`;

export const ANARI_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

uniform anariAppUniforms {
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 cameraPosition;
  float exposure;
  vec3 fogColor;
  float fogDensity;
  int renderMode;
  int highDynamicRange;
  float time;
} anariApp;

in vec3 fragmentWorldPosition;
in vec3 fragmentWorldNormal;
out vec4 fragmentColor;

void main() {
  vec3 normalDirection = normalize(fragmentWorldNormal);
  float cameraDistance = distance(anariApp.cameraPosition, fragmentWorldPosition);
  if (anariApp.renderMode == 1) {
    fragmentColor = vec4(normalDirection * 0.5 + 0.5, 1.0);
    return;
  }
  if (anariApp.renderMode == 2) {
    float depth = exp(-cameraDistance * 0.075);
    fragmentColor = vec4(vec3(depth), 1.0);
    return;
  }

  vec3 shadedColor = anariShade(fragmentWorldPosition, normalDirection, anariApp.cameraPosition);
  float fogAmount = 1.0 - exp(-cameraDistance * cameraDistance * anariApp.fogDensity);
  shadedColor = mix(shadedColor, anariApp.fogColor, clamp(fogAmount, 0.0, 0.93));
  shadedColor *= anariApp.exposure;
  vec3 standardColor = shadedColor / (shadedColor + vec3(1.0));
  shadedColor = anariApp.highDynamicRange == 1
    ? standardColor + max(shadedColor - vec3(1.0), vec3(0.0)) * 0.28
    : standardColor;
  shadedColor = pow(shadedColor, vec3(1.0 / 2.2));
  fragmentColor = vec4(shadedColor, anariMaterial.opacity);
}
`;

export const ANARI_WGSL_SHADER = /* wgsl */ `
struct anariAppUniforms {
  viewMatrix: mat4x4f,
  projectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  exposure: f32,
  fogColor: vec3f,
  fogDensity: f32,
  renderMode: i32,
  highDynamicRange: i32,
  time: f32,
};

@group(0) @binding(auto) var<uniform> anariApp: anariAppUniforms;

struct ANARIVertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instanceModelMatrixCol0: vec4f,
  @location(3) instanceModelMatrixCol1: vec4f,
  @location(4) instanceModelMatrixCol2: vec4f,
  @location(5) instanceModelMatrixCol3: vec4f,
};

struct ANARIVertexOutputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
};

@vertex
fn vertexMain(inputs: ANARIVertexInputs) -> ANARIVertexOutputs {
  let modelMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4f(inputs.positions, 1.0);
  var outputs: ANARIVertexOutputs;
  outputs.position = anariApp.projectionMatrix * anariApp.viewMatrix * worldPosition;
  outputs.worldPosition = worldPosition.xyz;
  outputs.worldNormal = normalize((modelMatrix * vec4f(inputs.normals, 0.0)).xyz);
  return outputs;
}

@fragment
fn fragmentMain(inputs: ANARIVertexOutputs) -> @location(0) vec4f {
  let normalDirection = normalize(inputs.worldNormal);
  let cameraDistance = distance(anariApp.cameraPosition, inputs.worldPosition);
  if (anariApp.renderMode == 1) {
    return vec4f(normalDirection * 0.5 + 0.5, 1.0);
  }
  if (anariApp.renderMode == 2) {
    let depth = exp(-cameraDistance * 0.075);
    return vec4f(vec3f(depth), 1.0);
  }

  var shadedColor = anariShade(inputs.worldPosition, normalDirection, anariApp.cameraPosition);
  let fogAmount = 1.0 - exp(-cameraDistance * cameraDistance * anariApp.fogDensity);
  shadedColor = mix(shadedColor, anariApp.fogColor, clamp(fogAmount, 0.0, 0.93));
  shadedColor *= anariApp.exposure;
  let standardColor = shadedColor / (shadedColor + vec3f(1.0));
  if (anariApp.highDynamicRange == 1) {
    shadedColor = standardColor + max(shadedColor - vec3f(1.0), vec3f(0.0)) * 0.28;
  } else {
    shadedColor = standardColor;
  }
  shadedColor = pow(shadedColor, vec3f(1.0 / 2.2));
  return vec4f(shadedColor, anariMaterial.opacity);
}
`;
