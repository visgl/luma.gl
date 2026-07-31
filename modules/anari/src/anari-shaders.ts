import type {ShaderModule} from '@luma.gl/shadertools';
import {lighting} from '@luma.gl/shadertools';
import type {Matrix4, NumberArray3, NumberArray9, NumberArray16} from '@math.gl/core';

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
  sheenColor: Readonly<NumberArray3>;
  metallic: number;
  roughness: number;
  opacity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  transmission: number;
  indexOfRefraction: number;
  sheenRoughness: number;
  normalScale: number;
  occlusionStrength: number;
  baseColorTextureEnabled: number;
  normalTextureEnabled: number;
  metallicRoughnessTextureEnabled: number;
  emissiveTextureEnabled: number;
  occlusionTextureEnabled: number;
  clearcoatTextureEnabled: number;
  transmissionTextureEnabled: number;
  sheenColorTextureEnabled: number;
  baseColorUVTransform: Readonly<NumberArray9>;
  normalUVTransform: Readonly<NumberArray9>;
  metallicRoughnessUVTransform: Readonly<NumberArray9>;
  emissiveUVTransform: Readonly<NumberArray9>;
  occlusionUVTransform: Readonly<NumberArray9>;
  clearcoatUVTransform: Readonly<NumberArray9>;
  transmissionUVTransform: Readonly<NumberArray9>;
  sheenColorUVTransform: Readonly<NumberArray9>;
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
  sheenColor: vec3f,
  metallic: f32,
  roughness: f32,
  opacity: f32,
  clearcoat: f32,
  clearcoatRoughness: f32,
  iridescence: f32,
  transmission: f32,
  indexOfRefraction: f32,
  sheenRoughness: f32,
  normalScale: f32,
  occlusionStrength: f32,
  baseColorTextureEnabled: i32,
  normalTextureEnabled: i32,
  metallicRoughnessTextureEnabled: i32,
  emissiveTextureEnabled: i32,
  occlusionTextureEnabled: i32,
  clearcoatTextureEnabled: i32,
  transmissionTextureEnabled: i32,
  sheenColorTextureEnabled: i32,
  baseColorUVTransform: mat3x3f,
  normalUVTransform: mat3x3f,
  metallicRoughnessUVTransform: mat3x3f,
  emissiveUVTransform: mat3x3f,
  occlusionUVTransform: mat3x3f,
  clearcoatUVTransform: mat3x3f,
  transmissionUVTransform: mat3x3f,
  sheenColorUVTransform: mat3x3f,
};

@group(3) @binding(auto) var<uniform> anariMaterial: anariMaterialUniforms;
@group(3) @binding(auto) var anariBaseColorTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariBaseColorTextureSampler: sampler;
@group(3) @binding(auto) var anariNormalTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariNormalTextureSampler: sampler;
@group(3) @binding(auto) var anariMetallicRoughnessTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariMetallicRoughnessTextureSampler: sampler;
@group(3) @binding(auto) var anariEmissiveTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariEmissiveTextureSampler: sampler;
@group(3) @binding(auto) var anariOcclusionTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariOcclusionTextureSampler: sampler;
@group(3) @binding(auto) var anariClearcoatTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariClearcoatTextureSampler: sampler;
@group(3) @binding(auto) var anariTransmissionTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariTransmissionTextureSampler: sampler;
@group(3) @binding(auto) var anariSheenColorTexture: texture_2d<f32>;
@group(3) @binding(auto) var anariSheenColorTextureSampler: sampler;

fn anariTransformUV(transform: mat3x3f, coordinates: vec2f) -> vec2f {
  return (transform * vec3f(coordinates, 1.0)).xy;
}

fn anariGetMappedNormal(
  worldPosition: vec3f,
  worldNormal: vec3f,
  coordinates: vec2f
) -> vec3f {
  if (anariMaterial.normalTextureEnabled == 0) {
    return normalize(worldNormal);
  }
  let textureCoordinates = anariTransformUV(anariMaterial.normalUVTransform, coordinates);
  let sampledNormal = textureSample(anariNormalTexture, anariNormalTextureSampler, textureCoordinates).xyz *
    2.0 - vec3f(1.0);
  let tangentNormal = normalize(vec3f(sampledNormal.xy * anariMaterial.normalScale, sampledNormal.z));
  let positionDerivativeX = dpdx(worldPosition);
  let positionDerivativeY = dpdy(worldPosition);
  let uvDerivativeX = dpdx(textureCoordinates);
  let uvDerivativeY = dpdy(textureCoordinates);
  let tangent = normalize(positionDerivativeX * uvDerivativeY.y - positionDerivativeY * uvDerivativeX.y);
  let bitangent = normalize(positionDerivativeY * uvDerivativeX.x - positionDerivativeX * uvDerivativeY.x);
  return normalize(mat3x3f(tangent, bitangent, normalize(worldNormal)) * tangentNormal);
}

fn anariEvaluateLight(
  normalDirection: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  lightColor: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32,
  clearcoat: f32,
  sheenColor: vec3f
) -> vec3f {
  let halfDirection = normalize(viewDirection + lightDirection);
  let normalLight = max(dot(normalDirection, lightDirection), 0.0);
  let normalView = max(dot(normalDirection, viewDirection), 0.001);
  let normalHalf = max(dot(normalDirection, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
  let perceptualRoughness = max(roughness, 0.045);
  let alpha = perceptualRoughness * perceptualRoughness;
  let alphaSquared = alpha * alpha;
  let denominator = normalHalf * normalHalf * (alphaSquared - 1.0) + 1.0;
  let distribution = alphaSquared / max(3.14159265 * denominator * denominator, 0.0001);
  let geometryFactor = (perceptualRoughness + 1.0) * (perceptualRoughness + 1.0) * 0.125;
  let visibilityView = normalView / (normalView * (1.0 - geometryFactor) + geometryFactor);
  let visibilityLight = normalLight / (normalLight * (1.0 - geometryFactor) + geometryFactor);
  let dielectricReflectance = pow(
    (anariMaterial.indexOfRefraction - 1.0) / (anariMaterial.indexOfRefraction + 1.0),
    2.0
  );
  let reflectance = mix(vec3f(dielectricReflectance), baseColor, metallic);
  let fresnel = reflectance + (vec3f(1.0) - reflectance) * pow(1.0 - viewHalf, 5.0);
  let specular = distribution * visibilityView * visibilityLight * fresnel /
    max(4.0 * normalView * normalLight, 0.001);
  let diffuse = (vec3f(1.0) - fresnel) * (1.0 - metallic) * baseColor /
    3.14159265;
  let clearcoatExponent = mix(220.0, 18.0, anariMaterial.clearcoatRoughness);
  let clearcoatSpecular = vec3f(pow(normalHalf, clearcoatExponent) * clearcoat * 0.36);
  let sheen = sheenColor * pow(1.0 - viewHalf, mix(6.0, 1.8, anariMaterial.sheenRoughness));
  return (diffuse + specular + clearcoatSpecular + sheen * (1.0 - metallic)) * lightColor * normalLight;
}

fn anariShade(
  worldPosition: vec3f,
  worldNormal: vec3f,
  cameraPosition: vec3f,
  vertexColor: vec3f,
  textureCoordinates: vec2f
) -> vec3f {
  let normalDirection = anariGetMappedNormal(worldPosition, worldNormal, textureCoordinates);
  let viewDirection = normalize(cameraPosition - worldPosition);
  let fresnelAngle = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 2.0);
  let spectralPhase = fresnelAngle * 9.0 + worldPosition.y * 0.22;
  let spectralColor = 0.5 + 0.5 * cos(vec3f(0.0, 2.094, 4.188) + vec3f(spectralPhase));
  var materialColor = anariMaterial.baseColor * vertexColor;
  if (anariMaterial.baseColorTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.baseColorUVTransform, textureCoordinates);
    materialColor *= textureSample(anariBaseColorTexture, anariBaseColorTextureSampler, coordinates).rgb;
  }
  var metallic = anariMaterial.metallic;
  var roughness = anariMaterial.roughness;
  if (anariMaterial.metallicRoughnessTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.metallicRoughnessUVTransform, textureCoordinates);
    let materialSample = textureSample(
      anariMetallicRoughnessTexture,
      anariMetallicRoughnessTextureSampler,
      coordinates
    );
    roughness *= materialSample.g;
    metallic *= materialSample.b;
  }
  var clearcoat = anariMaterial.clearcoat;
  if (anariMaterial.clearcoatTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.clearcoatUVTransform, textureCoordinates);
    clearcoat *= textureSample(anariClearcoatTexture, anariClearcoatTextureSampler, coordinates).r;
  }
  var sheenColor = anariMaterial.sheenColor;
  if (anariMaterial.sheenColorTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.sheenColorUVTransform, textureCoordinates);
    sheenColor *= textureSample(anariSheenColorTexture, anariSheenColorTextureSampler, coordinates).rgb;
  }
  let baseColor = mix(materialColor, spectralColor, anariMaterial.iridescence * fresnelAngle);
  let skyFactor = normalDirection.y * 0.5 + 0.5;
  let skyColor = mix(vec3f(0.10, 0.12, 0.17), vec3f(0.34, 0.42, 0.59), skyFactor);
  var occlusion = 1.0;
  if (anariMaterial.occlusionTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.occlusionUVTransform, textureCoordinates);
    let sampledOcclusion = textureSample(anariOcclusionTexture, anariOcclusionTextureSampler, coordinates).r;
    occlusion = mix(1.0, sampledOcclusion, anariMaterial.occlusionStrength);
  }
  var shadedColor = baseColor * (lighting.ambientColor * occlusion + skyColor * 0.22);

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
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
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
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
    );
  }

  for (var lightIndex = 0; lightIndex < lighting.directionalLightCount; lightIndex++) {
    let light = lighting_getDirectionalLight(lightIndex);
    shadedColor += anariEvaluateLight(
      normalDirection,
      viewDirection,
      normalize(-light.direction),
      light.color,
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
    );
  }

  var emissive = anariMaterial.emissiveColor;
  if (anariMaterial.emissiveTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.emissiveUVTransform, textureCoordinates);
    emissive *= textureSample(anariEmissiveTexture, anariEmissiveTextureSampler, coordinates).rgb;
  }
  var transmission = anariMaterial.transmission;
  if (anariMaterial.transmissionTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.transmissionUVTransform, textureCoordinates);
    transmission *= textureSample(anariTransmissionTexture, anariTransmissionTextureSampler, coordinates).r;
  }
  shadedColor = mix(shadedColor, baseColor * skyColor * 0.42, transmission * 0.74);
  return shadedColor + emissive;
}
`;

const ANARI_MATERIAL_GLSL = /* glsl */ `
layout(std140) uniform anariMaterialUniforms {
  vec3 baseColor;
  vec3 emissiveColor;
  vec3 sheenColor;
  float metallic;
  float roughness;
  float opacity;
  float clearcoat;
  float clearcoatRoughness;
  float iridescence;
  float transmission;
  float indexOfRefraction;
  float sheenRoughness;
  float normalScale;
  float occlusionStrength;
  int baseColorTextureEnabled;
  int normalTextureEnabled;
  int metallicRoughnessTextureEnabled;
  int emissiveTextureEnabled;
  int occlusionTextureEnabled;
  int clearcoatTextureEnabled;
  int transmissionTextureEnabled;
  int sheenColorTextureEnabled;
  mat3 baseColorUVTransform;
  mat3 normalUVTransform;
  mat3 metallicRoughnessUVTransform;
  mat3 emissiveUVTransform;
  mat3 occlusionUVTransform;
  mat3 clearcoatUVTransform;
  mat3 transmissionUVTransform;
  mat3 sheenColorUVTransform;
} anariMaterial;

uniform sampler2D anariBaseColorTexture;
uniform sampler2D anariNormalTexture;
uniform sampler2D anariMetallicRoughnessTexture;
uniform sampler2D anariEmissiveTexture;
uniform sampler2D anariOcclusionTexture;
uniform sampler2D anariClearcoatTexture;
uniform sampler2D anariTransmissionTexture;
uniform sampler2D anariSheenColorTexture;

vec2 anariTransformUV(mat3 transform, vec2 coordinates) {
  return (transform * vec3(coordinates, 1.0)).xy;
}

vec3 anariGetMappedNormal(vec3 worldPosition, vec3 worldNormal, vec2 coordinates) {
  if (anariMaterial.normalTextureEnabled == 0) {
    return normalize(worldNormal);
  }
  vec2 textureCoordinates = anariTransformUV(anariMaterial.normalUVTransform, coordinates);
  vec3 sampledNormal = texture(anariNormalTexture, textureCoordinates).xyz * 2.0 - vec3(1.0);
  vec3 tangentNormal = normalize(vec3(sampledNormal.xy * anariMaterial.normalScale, sampledNormal.z));
  vec3 positionDerivativeX = dFdx(worldPosition);
  vec3 positionDerivativeY = dFdy(worldPosition);
  vec2 uvDerivativeX = dFdx(textureCoordinates);
  vec2 uvDerivativeY = dFdy(textureCoordinates);
  vec3 tangent = normalize(positionDerivativeX * uvDerivativeY.y - positionDerivativeY * uvDerivativeX.y);
  vec3 bitangent = normalize(positionDerivativeY * uvDerivativeX.x - positionDerivativeX * uvDerivativeY.x);
  return normalize(mat3(tangent, bitangent, normalize(worldNormal)) * tangentNormal);
}

vec3 anariEvaluateLight(
  vec3 normalDirection,
  vec3 viewDirection,
  vec3 lightDirection,
  vec3 lightColor,
  vec3 baseColor,
  float metallic,
  float roughness,
  float clearcoat,
  vec3 sheenColor
) {
  vec3 halfDirection = normalize(viewDirection + lightDirection);
  float normalLight = max(dot(normalDirection, lightDirection), 0.0);
  float normalView = max(dot(normalDirection, viewDirection), 0.001);
  float normalHalf = max(dot(normalDirection, halfDirection), 0.0);
  float viewHalf = max(dot(viewDirection, halfDirection), 0.0);
  float perceptualRoughness = max(roughness, 0.045);
  float alpha = perceptualRoughness * perceptualRoughness;
  float alphaSquared = alpha * alpha;
  float denominator = normalHalf * normalHalf * (alphaSquared - 1.0) + 1.0;
  float distribution = alphaSquared / max(3.14159265 * denominator * denominator, 0.0001);
  float geometryFactor = (perceptualRoughness + 1.0) * (perceptualRoughness + 1.0) * 0.125;
  float visibilityView = normalView / (normalView * (1.0 - geometryFactor) + geometryFactor);
  float visibilityLight = normalLight / (normalLight * (1.0 - geometryFactor) + geometryFactor);
  float dielectricReflectance = pow(
    (anariMaterial.indexOfRefraction - 1.0) / (anariMaterial.indexOfRefraction + 1.0),
    2.0
  );
  vec3 reflectance = mix(vec3(dielectricReflectance), baseColor, metallic);
  vec3 fresnel = reflectance + (vec3(1.0) - reflectance) * pow(1.0 - viewHalf, 5.0);
  vec3 specular = distribution * visibilityView * visibilityLight * fresnel /
    max(4.0 * normalView * normalLight, 0.001);
  vec3 diffuse = (vec3(1.0) - fresnel) * (1.0 - metallic) * baseColor /
    3.14159265;
  float clearcoatExponent = mix(220.0, 18.0, anariMaterial.clearcoatRoughness);
  vec3 clearcoatSpecular = vec3(pow(normalHalf, clearcoatExponent) * clearcoat * 0.36);
  vec3 sheen = sheenColor * pow(1.0 - viewHalf, mix(6.0, 1.8, anariMaterial.sheenRoughness));
  return (diffuse + specular + clearcoatSpecular + sheen * (1.0 - metallic)) * lightColor * normalLight;
}

vec3 anariShade(
  vec3 worldPosition,
  vec3 worldNormal,
  vec3 cameraPosition,
  vec3 vertexColor,
  vec2 textureCoordinates
) {
  vec3 normalDirection = anariGetMappedNormal(worldPosition, worldNormal, textureCoordinates);
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  float fresnelAngle = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 2.0);
  float spectralPhase = fresnelAngle * 9.0 + worldPosition.y * 0.22;
  vec3 spectralColor = 0.5 + 0.5 * cos(vec3(0.0, 2.094, 4.188) + vec3(spectralPhase));
  vec3 materialColor = anariMaterial.baseColor * vertexColor;
  if (anariMaterial.baseColorTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.baseColorUVTransform, textureCoordinates);
    materialColor *= texture(anariBaseColorTexture, coordinates).rgb;
  }
  float metallic = anariMaterial.metallic;
  float roughness = anariMaterial.roughness;
  if (anariMaterial.metallicRoughnessTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.metallicRoughnessUVTransform, textureCoordinates);
    vec4 materialSample = texture(anariMetallicRoughnessTexture, coordinates);
    roughness *= materialSample.g;
    metallic *= materialSample.b;
  }
  float clearcoat = anariMaterial.clearcoat;
  if (anariMaterial.clearcoatTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.clearcoatUVTransform, textureCoordinates);
    clearcoat *= texture(anariClearcoatTexture, coordinates).r;
  }
  vec3 sheenColor = anariMaterial.sheenColor;
  if (anariMaterial.sheenColorTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.sheenColorUVTransform, textureCoordinates);
    sheenColor *= texture(anariSheenColorTexture, coordinates).rgb;
  }
  vec3 baseColor = mix(materialColor, spectralColor, anariMaterial.iridescence * fresnelAngle);
  float skyFactor = normalDirection.y * 0.5 + 0.5;
  vec3 skyColor = mix(vec3(0.10, 0.12, 0.17), vec3(0.34, 0.42, 0.59), skyFactor);
  float occlusion = 1.0;
  if (anariMaterial.occlusionTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.occlusionUVTransform, textureCoordinates);
    float sampledOcclusion = texture(anariOcclusionTexture, coordinates).r;
    occlusion = mix(1.0, sampledOcclusion, anariMaterial.occlusionStrength);
  }
  vec3 shadedColor = baseColor * (lighting.ambientColor * occlusion + skyColor * 0.22);

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
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
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
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
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
      baseColor,
      metallic,
      roughness,
      clearcoat,
      sheenColor
    );
  }

  vec3 emissive = anariMaterial.emissiveColor;
  if (anariMaterial.emissiveTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.emissiveUVTransform, textureCoordinates);
    emissive *= texture(anariEmissiveTexture, coordinates).rgb;
  }
  float transmission = anariMaterial.transmission;
  if (anariMaterial.transmissionTextureEnabled != 0) {
    vec2 coordinates = anariTransformUV(anariMaterial.transmissionUVTransform, textureCoordinates);
    transmission *= texture(anariTransmissionTexture, coordinates).r;
  }
  shadedColor = mix(shadedColor, baseColor * skyColor * 0.42, transmission * 0.74);
  return shadedColor + emissive;
}
`;

export const anariMaterialModule = {
  name: 'anariMaterial',
  bindingLayout: [
    {name: 'anariMaterial', group: 3},
    {name: 'anariBaseColorTexture', group: 3},
    {name: 'anariNormalTexture', group: 3},
    {name: 'anariMetallicRoughnessTexture', group: 3},
    {name: 'anariEmissiveTexture', group: 3},
    {name: 'anariOcclusionTexture', group: 3},
    {name: 'anariClearcoatTexture', group: 3},
    {name: 'anariTransmissionTexture', group: 3},
    {name: 'anariSheenColorTexture', group: 3}
  ],
  dependencies: [lighting],
  source: ANARI_MATERIAL_WGSL,
  vs: '',
  fs: ANARI_MATERIAL_GLSL,
  uniformTypes: {
    baseColor: 'vec3<f32>',
    emissiveColor: 'vec3<f32>',
    sheenColor: 'vec3<f32>',
    metallic: 'f32',
    roughness: 'f32',
    opacity: 'f32',
    clearcoat: 'f32',
    clearcoatRoughness: 'f32',
    iridescence: 'f32',
    transmission: 'f32',
    indexOfRefraction: 'f32',
    sheenRoughness: 'f32',
    normalScale: 'f32',
    occlusionStrength: 'f32',
    baseColorTextureEnabled: 'i32',
    normalTextureEnabled: 'i32',
    metallicRoughnessTextureEnabled: 'i32',
    emissiveTextureEnabled: 'i32',
    occlusionTextureEnabled: 'i32',
    clearcoatTextureEnabled: 'i32',
    transmissionTextureEnabled: 'i32',
    sheenColorTextureEnabled: 'i32',
    baseColorUVTransform: 'mat3x3<f32>',
    normalUVTransform: 'mat3x3<f32>',
    metallicRoughnessUVTransform: 'mat3x3<f32>',
    emissiveUVTransform: 'mat3x3<f32>',
    occlusionUVTransform: 'mat3x3<f32>',
    clearcoatUVTransform: 'mat3x3<f32>',
    transmissionUVTransform: 'mat3x3<f32>',
    sheenColorUVTransform: 'mat3x3<f32>'
  },
  defaultUniforms: {
    baseColor: [0.8, 0.8, 0.8],
    emissiveColor: [0, 0, 0],
    sheenColor: [0, 0, 0],
    metallic: 0,
    roughness: 0.45,
    opacity: 1,
    clearcoat: 0,
    clearcoatRoughness: 0.18,
    iridescence: 0,
    transmission: 0,
    indexOfRefraction: 1.5,
    sheenRoughness: 0.5,
    normalScale: 1,
    occlusionStrength: 1,
    baseColorTextureEnabled: 0,
    normalTextureEnabled: 0,
    metallicRoughnessTextureEnabled: 0,
    emissiveTextureEnabled: 0,
    occlusionTextureEnabled: 0,
    clearcoatTextureEnabled: 0,
    transmissionTextureEnabled: 0,
    sheenColorTextureEnabled: 0,
    baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    normalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    metallicRoughnessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    emissiveUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    occlusionUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    clearcoatUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    transmissionUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    sheenColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  }
} as const satisfies ShaderModule<ANARIMaterialUniforms>;

export const ANARI_VERTEX_SHADER = /* glsl */ `#version 300 es
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
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
out vec3 fragmentColorAttribute;
out vec2 fragmentTextureCoordinates;

void main() {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );
  vec4 worldPosition = modelMatrix * vec4(positions, 1.0);
  mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
  fragmentWorldPosition = worldPosition.xyz;
  fragmentWorldNormal = normalize(normalMatrix * normals);
  fragmentColorAttribute = colors;
  fragmentTextureCoordinates = texCoords;
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
in vec3 fragmentColorAttribute;
in vec2 fragmentTextureCoordinates;
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

  vec3 shadedColor = anariShade(
    fragmentWorldPosition,
    normalDirection,
    anariApp.cameraPosition,
    fragmentColorAttribute,
    fragmentTextureCoordinates
  );
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
  @location(2) colors: vec3f,
  @location(3) texCoords: vec2f,
  @location(4) instanceModelMatrixCol0: vec4f,
  @location(5) instanceModelMatrixCol1: vec4f,
  @location(6) instanceModelMatrixCol2: vec4f,
  @location(7) instanceModelMatrixCol3: vec4f,
};

struct ANARIVertexOutputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) color: vec3f,
  @location(3) textureCoordinates: vec2f,
};

fn getInverseTranspose3x3(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: ANARIVertexInputs) -> ANARIVertexOutputs {
  let modelMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4f(inputs.positions, 1.0);
  let normalMatrix = getInverseTranspose3x3(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));
  var outputs: ANARIVertexOutputs;
  outputs.position = anariApp.projectionMatrix * anariApp.viewMatrix * worldPosition;
  outputs.worldPosition = worldPosition.xyz;
  outputs.worldNormal = normalize(normalMatrix * inputs.normals);
  outputs.color = inputs.colors;
  outputs.textureCoordinates = inputs.texCoords;
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

  var shadedColor = anariShade(
    inputs.worldPosition,
    normalDirection,
    anariApp.cameraPosition,
    inputs.color,
    inputs.textureCoordinates
  );
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
