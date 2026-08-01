// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const ANARI_DEFERRED_WGSL_SHADER = /* wgsl */ `
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

struct ANARIFragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) velocity: vec2f,
  @location(3) baseColorMetallic: vec4f,
  @location(4) emissiveOcclusion: vec4f,
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
fn fragmentMain(inputs: ANARIVertexOutputs) -> ANARIFragmentOutputs {
  let worldNormal = anariGetMappedNormal(
    inputs.worldPosition,
    normalize(inputs.worldNormal),
    inputs.textureCoordinates
  );
  let viewNormal = normalize((anariApp.viewMatrix * vec4f(worldNormal, 0.0)).xyz);

  var materialColor = anariMaterial.baseColor * inputs.color;
  if (anariMaterial.baseColorTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.baseColorUVTransform, inputs.textureCoordinates);
    materialColor *= textureSample(anariBaseColorTexture, anariBaseColorTextureSampler, coordinates).rgb;
  }

  var metallic = anariMaterial.metallic;
  var roughness = anariMaterial.roughness;
  if (anariMaterial.metallicRoughnessTextureEnabled != 0) {
    let coordinates = anariTransformUV(
      anariMaterial.metallicRoughnessUVTransform,
      inputs.textureCoordinates
    );
    let materialSample = textureSample(
      anariMetallicRoughnessTexture,
      anariMetallicRoughnessTextureSampler,
      coordinates
    );
    roughness *= materialSample.g;
    metallic *= materialSample.b;
  }

  var emissive = anariMaterial.emissiveColor;
  if (anariMaterial.emissiveTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.emissiveUVTransform, inputs.textureCoordinates);
    emissive *= textureSample(anariEmissiveTexture, anariEmissiveTextureSampler, coordinates).rgb;
  }

  var occlusion = 1.0;
  if (anariMaterial.occlusionTextureEnabled != 0) {
    let coordinates = anariTransformUV(anariMaterial.occlusionUVTransform, inputs.textureCoordinates);
    let sampledOcclusion = textureSample(anariOcclusionTexture, anariOcclusionTextureSampler, coordinates).r;
    occlusion = mix(1.0, sampledOcclusion, anariMaterial.occlusionStrength);
  }

  let opacity = clamp(anariMaterial.opacity, 0.0, 1.0);
  if (opacity < 0.01) {
    discard;
  }

  var outputs: ANARIFragmentOutputs;
  outputs.color = vec4f(materialColor * 0.015 + emissive, opacity);
  outputs.normalRoughness = vec4f(viewNormal * 0.5 + 0.5, clamp(roughness, 0.045, 1.0));
  outputs.velocity = vec2f(0.0);
  outputs.baseColorMetallic = vec4f(materialColor, clamp(metallic, 0.0, 1.0));
  outputs.emissiveOcclusion = vec4f(max(emissive, vec3f(0.0)), clamp(occlusion, 0.0, 1.0));
  return outputs;
}
`;
