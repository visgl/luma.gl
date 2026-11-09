// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {ShadowMapRenderer} from '@luma.gl/anari';
import type {SpotLight} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';
import {rigidBodyPose} from './rigid-body-shaders';

/** One light definition drives both canonical PBR illumination and shadow projection. */
export const LAB_SPOTLIGHT = {
  type: 'spot',
  position: [-8, -12, 32],
  direction: [8, 12, -32],
  color: [255, 230, 194],
  intensity: 24,
  attenuation: [1, 0, 0.004],
  innerConeAngle: 0.38,
  outerConeAngle: 0.48
} as const satisfies SpotLight;

/** Shared shadow renderer, using exactly the visible renderer's geometry and GPU poses. */
export class RigidBodyShadows {
  private renderer: ShadowMapRenderer;
  private caster: Model;

  constructor(
    device: Device,
    bindings: Record<string, Buffer>,
    vertexSource: string,
    counts: {vertexCount: number; instanceCount: number}
  ) {
    this.renderer = new ShadowMapRenderer(device, {
      quality: 'balanced',
      directionalLightCapacity: 0,
      spotLightCapacity: 1,
      pointLightCapacity: 0,
      spotMapSize: 2048
    });
    this.caster = new Model(device, {
      id: 'rigid-body-shadow-casters',
      modules: [rigidBodyPose],
      source: vertexSource + '\n@fragment fn fragmentMain(){}',
      ...counts,
      colorAttachmentFormats: [],
      depthStencilAttachmentFormat: 'depth32float',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'},
      bindings
    });
  }

  render(view: Matrix4, projection: Matrix4) {
    return this.renderer.render({
      camera: {
        viewMatrix: view,
        projectionMatrix: projection,
        near: 0.1,
        far: 200,
        clipDepth: 'zero-to-one'
      },
      spotLights: [
        {
          position: LAB_SPOTLIGHT.position,
          direction: LAB_SPOTLIGHT.direction,
          outerConeAngle: LAB_SPOTLIGHT.outerConeAngle,
          range: 80,
          normalBias: 0.008,
          sourceRadius: 0.025,
          depthBias: 2,
          depthBiasSlopeScale: 2
        }
      ],
      drawShadowCasters: shadowView => {
        this.caster.shaderInputs.setProps({
          rigidBodyPose: {matrix: shadowView.viewProjectionMatrix}
        });
        // Procedural box faces use mixed winding; retain every face in the depth silhouette.
        this.caster.setParameters({...shadowView.rasterParameters, cullMode: 'none'});
        this.caster.draw(shadowView.renderPass);
      }
    });
  }

  destroy(): void {
    this.caster.destroy();
    this.renderer.destroy();
  }
}
