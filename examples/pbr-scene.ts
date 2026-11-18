// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device, RenderPass, TextureFormatColor} from '@luma.gl/core';
import {GroupNode, MaterialFactory, Model, ModelNode} from '@luma.gl/engine';
import type {DynamicTexture} from '@luma.gl/core/dynamic';
import type {Geometry} from '@luma.gl/engine';
import {pbrMaterial} from '@luma.gl/shaders';
import type {LightingProps, PBRMaterialProps, PBRProjectionProps} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';

const source = /* wgsl */ `
struct Surface {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

@vertex
fn vertexMain(
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) texCoords: vec2f
#ifdef HAS_INSTANCES
  , @location(3) instanceCenterAndScale: vec4f
#endif
) -> Surface {
  var position = vec4f(positions, 1.0);
#ifdef HAS_INSTANCES
  position = vec4f(positions * instanceCenterAndScale.w + instanceCenterAndScale.xyz, 1.0);
#endif
  return Surface(
    pbrProjection.modelViewProjectionMatrix * position,
    (pbrProjection.modelMatrix * position).xyz,
    normalize((pbrProjection.normalMatrix * vec4f(normals, 0.0)).xyz),
    texCoords
  );
}

@fragment
fn fragmentMain(surface: Surface) -> @location(0) vec4f {
  fragmentInputs.pbr_vPosition = surface.worldPosition;
  fragmentInputs.pbr_vNormal = surface.normal;
  fragmentInputs.pbr_vUV0 = surface.uv;
  fragmentInputs.pbr_vUV1 = vec2f(0.0);
  return pbr_filterColor(vec4f(1.0));
}
`;

const vs = /* glsl */ `#version 300 es
in vec3 positions;
in vec3 normals;
in vec2 texCoords;
#ifdef HAS_INSTANCES
in vec4 instanceCenterAndScale;
#endif

void main() {
  vec4 position = vec4(positions, 1.0);
#ifdef HAS_INSTANCES
  position = vec4(positions * instanceCenterAndScale.w + instanceCenterAndScale.xyz, 1.0);
#endif
  pbr_setPositionNormalTangentUV(position, vec4(normals, 0.0), vec4(0.0), texCoords, vec2(0.0));
  gl_Position = pbrProjection.modelViewProjectionMatrix * position;
}
`;

const fs = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;

void main() {
  fragmentColor = pbr_filterColor(vec4(1.0));
}
`;

/** Creates a lit mesh from geometry with positions, normals, and a UV set. */
export function createPBRMesh(
  device: Device,
  geometry: Geometry,
  materialProps: PBRMaterialProps,
  {
    baseColorTexture,
    instances,
    colorAttachmentFormat
  }: {
    baseColorTexture?: DynamicTexture;
    instances?: {buffer: Buffer; count: number};
    colorAttachmentFormat?: TextureFormatColor;
  } = {}
): ModelNode {
  const factory = new MaterialFactory(device, {modules: [pbrMaterial]});
  const material = factory.createMaterial({
    bindings: baseColorTexture ? {pbr_baseColorSampler: baseColorTexture} : {}
  });
  material.setProps({
    pbrMaterial: {...materialProps, baseColorMapEnabled: Boolean(baseColorTexture)}
  });

  const model = new Model(device, {
    geometry,
    source,
    vs,
    fs,
    modules: [pbrMaterial],
    material,
    colorAttachmentFormats: colorAttachmentFormat ? [colorAttachmentFormat] : undefined,
    ...(instances && {
      attributes: {instanceCenterAndScale: instances.buffer},
      bufferLayout: [{name: 'instanceCenterAndScale', format: 'float32x4', stepMode: 'instance'}],
      instanceCount: instances.count,
      isInstanced: true
    }),
    defines: {
      HAS_NORMALS: true,
      HAS_INSTANCES: Boolean(instances),
      HAS_UV: true,
      HAS_BASECOLORMAP: Boolean(baseColorTexture),
      MANUAL_SRGB: true,
      USE_LIGHTS: true
    },
    parameters: {
      depthFormat: 'depth24plus',
      depthCompare: 'less-equal',
      depthWriteEnabled: true,
      cullMode: 'back'
    }
  });

  return new ModelNode({model, managedResources: [material]});
}

/** Draws the PBR meshes with a shared camera and world-space lights. */
export function drawPBRScene(
  scene: GroupNode,
  renderPass: RenderPass,
  viewProjectionMatrix: Matrix4,
  camera: PBRProjectionProps['camera'],
  lighting: LightingProps
): void {
  scene.traverse((node, {worldMatrix}) => {
    if (node instanceof ModelNode) {
      const modelMatrix = new Matrix4(worldMatrix).multiplyRight(node.matrix);
      node.model.shaderInputs.setProps({
        lighting,
        pbrProjection: {
          camera,
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose(),
          modelViewProjectionMatrix: new Matrix4(viewProjectionMatrix).multiplyRight(modelMatrix)
        }
      });
      node.draw(renderPass);
    }
  });
}
