// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {ShadowMapRenderer} from '@luma.gl/experimental';
import {Matrix4} from '@math.gl/core';

export const DOMINO_LIGHT_POSITION = [-8, -12, 32] as const;

/** One instanced depth draw consumes the same GPU poses as the visible dominoes. */
export class DominoShadows {
  private renderer: ShadowMapRenderer;
  private matrix: Buffer;
  private caster: Model;

  constructor(
    device: Device,
    positions: Buffer,
    orientations: Buffer,
    shapes: Buffer,
    count: number
  ) {
    this.renderer = new ShadowMapRenderer(device, {
      quality: 'balanced',
      directionalLightCapacity: 0,
      spotLightCapacity: 1,
      pointLightCapacity: 0,
      spotMapSize: 2048
    });
    this.matrix = device.createBuffer({byteLength: 64, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.caster = new Model(device, {
      id: 'domino-shadow-casters',
      source: `
@group(0) @binding(0) var<uniform> matrix:mat4x4f;
@group(0) @binding(1) var<storage,read> positions:array<vec4f>;
@group(0) @binding(2) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(3) var<storage,read> shapes:array<vec4f>;
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@vertex fn vertexMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) body:u32)->@builtin(position) vec4f{
 let corners=array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
 let corner=corners[vertex%6u];let face=vertex/6u;let axis=face/2u;var point=vec3f(0);
 point[axis]=select(-1.0,1.0,face%2u==0u);point[(axis+1u)%3u]=corner.x*2.0-1.0;point[(axis+2u)%3u]=corner.y*2.0-1.0;
 return matrix*vec4f(positions[body].xyz+rotate(orientations[body],point*shapes[body].xyz),1);
}
@fragment fn fragmentMain(){}
`,
      vertexCount: 36,
      instanceCount: count,
      colorAttachmentFormats: [],
      depthStencilAttachmentFormat: 'depth32float',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'},
      bindings: {matrix: this.matrix, positions, orientations, shapes},
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'matrix', group: 0, location: 0, type: 'uniform'},
          ...['positions', 'orientations', 'shapes'].map((name, index) => ({
            name,
            group: 0,
            location: index + 1,
            type: 'read-only-storage' as const,
            visibility: 1
          }))
        ]
      }
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
          position: DOMINO_LIGHT_POSITION,
          direction: [8, 12, -32],
          outerConeAngle: 0.48,
          range: 80,
          normalBias: 0.008,
          sourceRadius: 0.025,
          depthBias: 2,
          depthBiasSlopeScale: 2
        }
      ],
      drawShadowCasters: shadowView => {
        this.matrix.write(new Float32Array(shadowView.viewProjectionMatrix));
        // Procedural box faces use mixed winding; retain every face in the depth silhouette.
        this.caster.setParameters({...shadowView.rasterParameters, cullMode: 'none'});
        this.caster.draw(shadowView.renderPass);
      }
    });
  }

  destroy(): void {
    this.caster.destroy();
    this.matrix.destroy();
    this.renderer.destroy();
  }
}
