// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
import {MaterialFactory, Model, ModelNode, type ModelProps} from '@luma.gl/engine';
import {pbrMaterial, type LightingProps, type PBRProjectionProps} from '@luma.gl/shaders';

const lighting: LightingProps = {
  useByteColors: false,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.45},
    {type: 'directional', color: [1, 1, 1], direction: [0.5, 0.3, -0.8], intensity: 1.6}
  ]
};

export function createPBRBuildingMesh(device: Device, props: ModelProps): ModelNode {
  const factory = new MaterialFactory(device, {modules: [pbrMaterial]});
  const material = factory.createMaterial();
  material.setProps({pbrMaterial: {metallicRoughnessValues: [0, 0.8]}});
  try {
    const model = new Model(device, {
      ...props,
      material,
      defines: {...props.defines, HAS_NORMALS: true, USE_LIGHTS: true}
    });
    model.shaderInputs.setProps({lighting});
    return new ModelNode({model, managedResources: [material]});
  } catch (error) {
    material.destroy();
    throw error;
  }
}

export function drawPBRBuildingMesh(node: ModelNode, renderPass: RenderPass): void {
  // Deck updates its projection uniforms for each viewport and render pass.
  const project = node.model.shaderInputs.getUniformValues()['project'] as
    | {cameraPosition?: PBRProjectionProps['camera']}
    | undefined;
  node.model.shaderInputs.setProps({
    pbrProjection: {camera: project?.cameraPosition ?? [0, 0, 0]}
  });
  node.draw(renderPass);
}

export const buildingPBRFragmentWGSL = /* wgsl */ `
fn shadeBuilding(input: CityVertex, windowCoverage: f32, baseColor: vec3f) -> vec3f {
  fragmentInputs.pbr_vPosition = input.commonPosition;
  fragmentInputs.pbr_vNormal = input.commonNormal;
  fragmentInputs.pbr_vUV0 = vec2f(0.0);
  fragmentInputs.pbr_vUV1 = vec2f(0.0);
  let color = pbr_filterColor(vec4f(baseColor, 1.0)).rgb;
  return riverfrontWindowReflection(color, input.commonNormal,
    pbrProjection.camera - input.commonPosition, vec3f(1.0), windowCoverage);
}
`;

export const buildingPBRVertexGLSL = /* glsl */ `
  pbr_vPosition = project_position(position);
  pbr_vNormal = project_normal(normal);
  pbr_vUV0 = vec2(0.0);
  pbr_vUV1 = vec2(0.0);
`;

export const buildingPBRFragmentGLSL = /* glsl */ `
vec4 shadeBuilding(vec3 facade, vec4 baseColor) {
  vec4 color = pbr_filterColor(baseColor);
  color.rgb = riverfrontWindowReflection(color.rgb, pbr_vNormal,
    pbrProjection.camera - pbr_vPosition, vec3(1.0), riverfrontWindowCoverage(facade));
  return color;
}
`;
