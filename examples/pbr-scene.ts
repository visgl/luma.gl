// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device, RenderPass, TextureFormatColor} from '@luma.gl/core';
import {GroupNode, ModelNode} from '@luma.gl/engine';
import type {DynamicTexture} from '@luma.gl/core/dynamic';
import type {Geometry} from '@luma.gl/engine';
import {createPBRMaterial, createPBRModel} from '@luma.gl/engine/lighting';
import type {PBRMaterialUniforms} from '@luma.gl/shaders';
import type {LightingProps, PBRProjectionProps} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core/matrix';

/** Creates a lit mesh from geometry with positions, normals, and a UV set. */
export function createPBRMesh(
  device: Device,
  geometry: Geometry,
  materialProps: PBRMaterialUniforms,
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
  const material = createPBRMaterial(device, {
    bindings: baseColorTexture ? {pbr_baseColorSampler: baseColorTexture} : {},
    uniforms: materialProps
  });
  const model = createPBRModel(device, {
    geometry,
    material,
    colorAttachmentFormats: colorAttachmentFormat ? [colorAttachmentFormat] : undefined,
    ...(instances && {
      attributes: {instanceMatrices: instances.buffer},
      bufferLayout: [
        {
          name: 'instanceMatrices',
          byteStride: 64,
          stepMode: 'instance',
          attributes: [0, 1, 2, 3].map(column => ({
            attribute: `instanceModelMatrixCol${column}`,
            format: 'float32x4' as const,
            byteOffset: column * 16
          }))
        }
      ],
      instanceCount: instances.count,
      isInstanced: true
    }),
    defines: {
      HAS_INSTANCING: Boolean(instances),
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
        pbrScene: {outputEncoding: 1},
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
