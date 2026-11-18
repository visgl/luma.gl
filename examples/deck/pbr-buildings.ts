// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {project, type ProjectProps} from '@deck.gl/core';
import type {Device, RenderPass} from '@luma.gl/core';
import {MaterialFactory, Model, ModelNode, type ModelProps} from '@luma.gl/engine';
import {pbrMaterial, type LightingProps} from '@luma.gl/shaders';

/** Daylight shared by the fixed-lighting façade demos. */
const BUILDING_LIGHTING: LightingProps = {
  useByteColors: false,
  lights: [
    {type: 'ambient', color: [1, 1, 1], intensity: 0.45},
    {type: 'directional', color: [1, 1, 1], direction: [0.5, 0.3, -0.8], intensity: 1.6}
  ]
};

/** Creates a building node that owns its PBR material and borrows the vertex buffer. */
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
    model.shaderInputs.setProps({lighting: BUILDING_LIGHTING});
    return new ModelNode({model, managedResources: [material]});
  } catch (error) {
    material.destroy();
    throw error;
  }
}

/** Draws a building with Deck's current camera in the shader's common coordinate space. */
export function drawPBRBuildingMesh(
  node: ModelNode,
  renderPass: RenderPass,
  projection: ProjectProps
): void {
  const uniforms = project.getUniforms(projection);
  if ('cameraPosition' in uniforms) {
    node.model.shaderInputs.setProps({pbrProjection: {camera: uniforms.cameraPosition}});
  }
  node.draw(renderPass);
}

/** Shared WGSL material and window evaluation for a projected façade fragment. */
export const BUILDING_FRAGMENT_WGSL = /* wgsl */ `
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

/** Writes the GLSL PBR interpolants in Deck common coordinates. */
export const BUILDING_VERTEX_GLSL = /* glsl */ `
  pbr_vPosition = project_position(position);
  pbr_vNormal = project_normal(normal);
  pbr_vUV0 = vec2(0.0);
  pbr_vUV1 = vec2(0.0);
`;

/** Shared GLSL material and window evaluation for a projected façade fragment. */
export const BUILDING_FRAGMENT_GLSL = /* glsl */ `
vec4 shadeBuilding(vec3 facade, vec4 baseColor) {
  vec4 color = pbr_filterColor(baseColor);
  color.rgb = riverfrontWindowReflection(color.rgb, pbr_vNormal,
    pbrProjection.camera - pbr_vPosition, vec3(1.0), riverfrontWindowCoverage(facade));
  return color;
}
`;
