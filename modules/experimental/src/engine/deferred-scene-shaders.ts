// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Canonical-PBR material capture used by the reusable WebGPU deferred scene renderer. */
export const DEFERRED_SCENE_WGSL_SHADER = /* wgsl */ `
struct DeferredSceneVertexInputs {
  @location(0) positions: vec3f,
#ifdef HAS_NORMALS
  @location(1) normals: vec3f,
#endif
#ifdef HAS_TANGENTS
  @location(2) TANGENT: vec4f,
#endif
#ifdef HAS_UV
  @location(3) texCoords: vec2f,
#endif
#ifdef HAS_UV_1
  @location(4) texCoords1: vec2f,
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  @location(7) colors: vec4f,
#else
  @location(7) colors: vec3f,
#endif
#endif
  @location(8) instanceModelMatrixCol0: vec4f,
  @location(9) instanceModelMatrixCol1: vec4f,
  @location(10) instanceModelMatrixCol2: vec4f,
  @location(11) instanceModelMatrixCol3: vec4f,
};

struct DeferredSceneVertexOutputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) color: vec4f,
  @location(3) textureCoordinates: vec2f,
  @location(4) secondTextureCoordinates: vec2f,
#ifdef HAS_TANGENTS
  @location(5) worldTangent: vec4f,
#endif
};

struct DeferredSceneFragmentOutputs {
  @location(0) color: vec4f,
  @location(1) normalRoughness: vec4f,
  @location(2) baseColorMetallic: vec4f,
  @location(3) emissiveOcclusion: vec4f,
};

fn getDeferredSceneNormalMatrix(matrix: mat3x3f) -> mat3x3f {
  let firstCofactor = cross(matrix[1], matrix[2]);
  let inverseDeterminant = 1.0 / dot(matrix[0], firstCofactor);
  return mat3x3f(
    firstCofactor,
    cross(matrix[2], matrix[0]),
    cross(matrix[0], matrix[1])
  ) * inverseDeterminant;
}

@vertex
fn vertexMain(inputs: DeferredSceneVertexInputs) -> DeferredSceneVertexOutputs {
  let modelMatrix = mat4x4f(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
  let worldPosition = modelMatrix * vec4f(inputs.positions, 1.0);
  let normalMatrix = getDeferredSceneNormalMatrix(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));

  var outputs: DeferredSceneVertexOutputs;
  outputs.position = pbrProjection.modelViewProjectionMatrix * worldPosition;
  outputs.worldPosition = worldPosition.xyz;
  outputs.worldNormal = vec3f(0.0, 0.0, 1.0);
  outputs.textureCoordinates = vec2f(0.0);
  outputs.secondTextureCoordinates = vec2f(0.0);
  outputs.color = vec4f(1.0);

#ifdef HAS_NORMALS
  outputs.worldNormal = normalize(normalMatrix * inputs.normals);
#endif
#ifdef HAS_UV
  outputs.textureCoordinates = inputs.texCoords;
#endif
#ifdef HAS_UV_1
  outputs.secondTextureCoordinates = inputs.texCoords1;
#endif
#ifdef HAS_COLORS
#ifdef HAS_RGBA_COLORS
  outputs.color = inputs.colors;
#else
  outputs.color = vec4f(inputs.colors, 1.0);
#endif
#endif
#ifdef HAS_TANGENTS
  outputs.worldTangent = vec4f(
    normalize((modelMatrix * vec4f(inputs.TANGENT.xyz, 0.0)).xyz),
    inputs.TANGENT.w
  );
#endif
  return outputs;
}

@fragment
fn fragmentMain(inputs: DeferredSceneVertexOutputs) -> DeferredSceneFragmentOutputs {
  fragmentInputs.pbr_vPosition = inputs.worldPosition;
  fragmentInputs.pbr_vNormal = normalize(inputs.worldNormal);
  fragmentInputs.pbr_vUV0 = inputs.textureCoordinates;
  fragmentInputs.pbr_vUV1 = inputs.secondTextureCoordinates;
#ifdef HAS_TANGENTS
  let tangent = normalize(inputs.worldTangent.xyz);
  let bitangent = normalize(cross(inputs.worldNormal, tangent)) * inputs.worldTangent.w;
  fragmentInputs.pbr_vTBN = mat3x3f(tangent, bitangent, inputs.worldNormal);
#endif

  let normalCoordinates = getMaterialUV(pbrMaterial.normalUVSet, pbrMaterial.normalUVTransform);
  let worldNormal = getNormal(getTBN(normalCoordinates), normalCoordinates);
  let viewNormal = normalize((pbrScene.viewMatrix * vec4f(worldNormal, 0.0)).xyz);

  var baseColor = pbrMaterial.baseColorFactor * inputs.color;
#ifdef HAS_BASECOLORMAP
  let baseColorCoordinates = getMaterialUV(
    pbrMaterial.baseColorUVSet,
    pbrMaterial.baseColorUVTransform
  );
  baseColor *= SRGBtoLINEAR(textureSample(
    pbr_baseColorSampler,
    pbr_baseColorSamplerSampler,
    baseColorCoordinates
  ));
#endif
#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  var metallic = pbrMaterial.metallicRoughnessValues.x;
  var roughness = pbrMaterial.metallicRoughnessValues.y;
#ifdef HAS_METALROUGHNESSMAP
  let metallicRoughnessCoordinates = getMaterialUV(
    pbrMaterial.metallicRoughnessUVSet,
    pbrMaterial.metallicRoughnessUVTransform
  );
  let metallicRoughness = textureSample(
    pbr_metallicRoughnessSampler,
    pbr_metallicRoughnessSamplerSampler,
    metallicRoughnessCoordinates
  );
  roughness *= metallicRoughness.g;
  metallic *= metallicRoughness.b;
#endif

  var emissive = pbrMaterial.emissiveFactor * pbrMaterial.emissiveStrength;
#ifdef HAS_EMISSIVEMAP
  let emissiveCoordinates = getMaterialUV(
    pbrMaterial.emissiveUVSet,
    pbrMaterial.emissiveUVTransform
  );
  emissive *= SRGBtoLINEAR(textureSample(
    pbr_emissiveSampler,
    pbr_emissiveSamplerSampler,
    emissiveCoordinates
  )).rgb;
#endif

  var occlusion = 1.0;
#ifdef HAS_OCCLUSIONMAP
  let occlusionCoordinates = getMaterialUV(
    pbrMaterial.occlusionUVSet,
    pbrMaterial.occlusionUVTransform
  );
  let sampledOcclusion = textureSample(
    pbr_occlusionSampler,
    pbr_occlusionSamplerSampler,
    occlusionCoordinates
  ).r;
  occlusion = mix(1.0, sampledOcclusion, pbrMaterial.occlusionStrength);
#endif

  var outputs: DeferredSceneFragmentOutputs;
  outputs.color = vec4f(baseColor.rgb * 0.015 + emissive, baseColor.a);
  outputs.normalRoughness = vec4f(viewNormal * 0.5 + 0.5, clamp(roughness, 0.045, 1.0));
  outputs.baseColorMetallic = vec4f(baseColor.rgb, clamp(metallic, 0.0, 1.0));
  outputs.emissiveOcclusion = vec4f(max(emissive, vec3f(0.0)), clamp(occlusion, 0.0, 1.0));
  return outputs;
}
`;
