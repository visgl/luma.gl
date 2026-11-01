// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {
  CubeGeometry,
  SphereGeometry,
  GroupNode,
  ModelNode,
  Model,
  type Geometry
} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRModel,
  PBREnvironmentGenerator,
  ShadowMapRenderer,
  shadow
} from '@luma.gl/anari';
import type {SpotLight, ShaderModule} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';
import {CradleGeometryNode} from './cradle-geometry';
import {captureReflectionProbe} from './reflection-probe';

const CRADLE_SPOTLIGHT = {
  type: 'spot',
  position: [0, -10, 30],
  direction: [0, 10, -30],
  color: [255, 244, 230],
  intensity: 16.4,
  attenuation: [1, 0, 0.004],
  innerConeAngle: 0.127,
  outerConeAngle: 0.209
} as const satisfies SpotLight;

// World poses remain GPU-owned. A negative body index denotes an authored static node.
const pose = {
  name: 'cradlePose',
  uniformTypes: {
    matrix: 'mat4x4<f32>',
    viewProjection: 'mat4x4<f32>',
    view: 'mat4x4<f32>',
    body: 'i32',
    anchor: 'i32'
  },
  source: `struct CradlePose {matrix:mat4x4f,viewProjection:mat4x4f,view:mat4x4f,body:i32,anchor:i32};
@group(0) @binding(auto) var<uniform> cradlePose:CradlePose;
@group(0) @binding(auto) var<storage,read> bodyPositions:array<vec4f>;
@group(0) @binding(auto) var<storage,read> bodyOrientations:array<vec4f>;
@group(0) @binding(auto) var<storage,read> bodyMatrices:array<mat4x4f>;`,
  bindingLayout: [
    {name: 'bodyPositions', group: 0},
    {name: 'bodyOrientations', group: 0},
    {name: 'bodyMatrices', group: 0}
  ]
} as const satisfies ShaderModule;

const vertexSource = `
struct Output {@builtin(position) position:vec4f,@location(0) point:vec3f,@location(1) normal:vec3f,@location(2) uv:vec2f,@location(3) viewDepth:f32};
fn rotate(rotation:vec4f,vector:vec3f)->vec3f {return vector+2.0*cross(rotation.xyz,cross(rotation.xyz,vector)+rotation.w*vector);}
@vertex fn vertexMain(@location(0) positions:vec3f,@location(1) normals:vec3f,@location(3) texCoords:vec2f)->Output {
 var point=(cradlePose.matrix*vec4f(positions,1)).xyz;
 // All authored scales are axis-aligned. Apply inverse scale to normals.
 var normal=normalize((cradlePose.matrix*vec4f(normals / vec3f(dot(cradlePose.matrix[0].xyz,cradlePose.matrix[0].xyz),dot(cradlePose.matrix[1].xyz,cradlePose.matrix[1].xyz),dot(cradlePose.matrix[2].xyz,cradlePose.matrix[2].xyz)),0)).xyz);
 if(cradlePose.body>=0){
  let rotation=bodyOrientations[u32(cradlePose.body)];
  point=(bodyMatrices[u32(cradlePose.body)]*vec4f(point,1)).xyz;
  normal=rotate(rotation,normal);
 }
 if(cradlePose.anchor>=0){
  let first=bodyPositions[u32(cradlePose.anchor)].xyz;
  let second=bodyPositions[u32(cradlePose.body)].xyz;
  let direction=normalize(second-first);
  let tangent=normalize(cross(direction,vec3f(0,1,0)));
  let bitangent=cross(direction,tangent);
  point=mix(first,second,(positions.z+1.0)*0.5)+(tangent*positions.x+bitangent*positions.y)*0.018;
  normal=normalize(tangent*normals.x+bitangent*normals.y+direction*normals.z);
 }
 var output:Output;output.point=point;output.normal=normal;output.uv=texCoords;
 output.position=cradlePose.viewProjection*vec4f(point,1);
 output.viewDepth=-(cradlePose.view*vec4f(point,1)).z;return output;
}`;
const fragmentSource = `
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 fragmentInputs.pbr_vPosition=input.point;fragmentInputs.pbr_vNormal=normalize(input.normal);
 fragmentInputs.pbr_vUV0=input.uv;fragmentInputs.pbr_vUV1=input.uv;
 let visibility=shadow_getSpotFactor(0,input.point,normalize(input.normal));
 return pbr_filterColorWithSpotShadows(vec4f(1),vec4f(visibility,1,1,1));
}`;

type Placement = {
  id: string;
  geometry: Geometry;
  matrix: Matrix4;
  body?: number;
  anchor?: number;
  material: 'stone' | 'steel' | 'table' | 'thread';
};

/** Retained scenegraph; draw and shadow passes consume the same GPU body poses. */
export class CradleScene {
  readonly root = new GroupNode({id: 'newtons-cradle'});
  private shadows: ShadowMapRenderer;
  private casters: {model: Model; node: ModelNode; placement: Placement}[][] = [[]];
  private placements = new Map<ModelNode, Placement>();
  private environment;
  private reflectionEnvironment;
  private materials;
  private textures;

  constructor(
    private device: Device,
    positions: Buffer,
    orientations: Buffer,
    matrices: Buffer,
    frame: GroupNode
  ) {
    // Asset-free studio panorama, integrated by the shared GGX IBL generator.
    const pixels = new Uint8Array(256 * 128 * 4);
    for (let row = 0; row < 128; row++)
      for (let column = 0; column < 256; column++) {
        const offset = (row * 256 + column) * 4;
        const softbox =
          (column > 25 && column < 65 && row > 20 && row < 65) ||
          (column > 155 && column < 180 && row > 35 && row < 100);
        const value = softbox ? 255 : row > 64 ? 145 : 100;
        pixels.set([value, value, Math.min(255, value + 8), 255], offset);
      }
    const panorama = device.createTexture({
      width: 256,
      height: 128,
      format: 'rgba8unorm',
      data: pixels
    });
    const generator = new PBREnvironmentGenerator(device);
    this.environment = generator.prepare({
      source: panorama,
      sourceEncoding: 'srgb',
      size: 64,
      sampleCount: 64
    });
    generator.destroy();
    panorama.destroy();
    const normalPixels = new Uint8Array(128 * 128 * 4);
    const roughnessPixels = new Uint8Array(normalPixels.length);
    for (let row = 0; row < 128; row++)
      for (let column = 0; column < 128; column++) {
        const offset = (row * 128 + column) * 4;
        const grain = Math.sin(column * 0.31 + Math.sin(row * 0.23) * 3) * Math.cos(row * 0.27);
        normalPixels.set(
          [
            128 + Math.round(grain * 16),
            128 + Math.round(Math.cos(column * 0.29 + row * 0.37) * 16),
            253,
            255
          ],
          offset
        );
        roughnessPixels.set([255, Math.round(160 + grain * 25), 0, 255], offset);
      }
    const sampler = {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    } as const;
    const normal = device.createTexture({
      width: 128,
      height: 128,
      format: 'rgba8unorm',
      data: normalPixels,
      sampler
    });
    const roughness = device.createTexture({
      width: 128,
      height: 128,
      format: 'rgba8unorm',
      data: roughnessPixels,
      sampler
    });
    this.textures = [normal, roughness];
    this.materials = {
      stone: createPBRMaterial(device, {
        uniforms: {
          baseColorFactor: [0.16, 0.18, 0.2, 1],
          metallicRoughnessValues: [0, 1],
          normalScale: 0.5,
          IBLenabled: true
        },
        bindings: {pbr_normalSampler: normal, pbr_metallicRoughnessSampler: roughness}
      }),
      steel: createPBRMaterial(device, {
        uniforms: {
          baseColorFactor: [0.8, 0.82, 0.85, 1],
          metallicRoughnessValues: [1, 0.07],
          IBLenabled: true
        }
      }),
      table: createPBRMaterial(device, {
        uniforms: {
          baseColorFactor: [0.55, 0.52, 0.47, 1],
          metallicRoughnessValues: [0, 0.85],
          IBLenabled: true
        }
      }),
      thread: createPBRMaterial(device, {
        uniforms: {
          baseColorFactor: [0.1, 0.12, 0.14, 1],
          metallicRoughnessValues: [0.5, 0.4],
          IBLenabled: true
        }
      })
    };
    this.shadows = new ShadowMapRenderer(device, {
      quality: 'balanced',
      directionalLightCapacity: 0,
      spotMapSize: 2048,
      spotLightCapacity: 1,
      pointLightCapacity: 0
    });
    const cube = new CubeGeometry();
    const sphere = new SphereGeometry({nlat: 32, nlong: 64});
    const placements: Placement[] = [
      {
        id: 'table',
        geometry: cube,
        matrix: new Matrix4().translate([0, 0, -0.5]).scale([8, 8, 0.5]),
        material: 'table'
      }
    ];
    frame.traverse((node, {worldMatrix}) => {
      if (!(node instanceof CradleGeometryNode)) return;
      placements.push({
        id: node.id,
        geometry: node.geometry,
        matrix: new Matrix4(worldMatrix).multiplyRight(node.matrix),
        material: 'stone'
      });
    });
    for (let index = 0; index < 5; index++) {
      placements.push({
        id: `ball-${index}`,
        geometry: sphere,
        matrix: new Matrix4().scale([0.4, 0.4, 0.4]),
        body: index * 2 + 2,
        material: 'steel'
      });
      placements.push({
        id: `tether-${index}`,
        geometry: cube,
        matrix: new Matrix4(),
        body: index * 2 + 2,
        anchor: index * 2 + 1,
        material: 'thread'
      });
    }
    for (const placement of placements) {
      const model = createPBRModel(device, {
        id: placement.id,
        geometry: placement.geometry,
        material: this.materials[placement.material],
        source: vertexSource + fragmentSource,
        modules: [pose, shadow],
        defines: {
          USE_LIGHTS: true,
          USE_IBL: true,
          USE_TEX_LOD: true,
          USE_SCENE_ENVIRONMENT: true,
          USE_SCENE_COLOR_MANAGEMENT: true
        },
        bindings: {
          bodyPositions: positions,
          bodyOrientations: orientations,
          bodyMatrices: matrices
        },
        parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'},
        depthStencilAttachmentFormat: 'depth24plus'
      });
      model.shaderInputs.setProps({
        ibl: {
          pbr_diffuseEnvSampler: this.environment.diffuseTexture,
          pbr_specularEnvSampler: this.environment.specularTexture,
          pbr_brdfLUT: this.environment.brdfLUTTexture
        },
        lighting: {
          lights: [CRADLE_SPOTLIGHT]
        },
        pbrScene: {
          environmentIntensity: placement.material === 'steel' ? 2.5 : 1,
          environmentRotation: 0,
          environmentMipCount: this.environment.specularTexture.mipLevels
        }
      });
      const node = new ModelNode({id: placement.id, model, matrix: placement.matrix});
      this.root.add(node);
      this.placements.set(node, placement);
      for (const cascade of this.casters)
        cascade.push({
          node,
          placement,
          model: new Model(device, {
            id: `${placement.id}-shadow`,
            geometry: placement.geometry,
            source: vertexSource + '\n@fragment fn fragmentMain() {}',
            modules: [pose],
            bindings: {
              bodyPositions: positions,
              bodyOrientations: orientations,
              bodyMatrices: matrices
            },
            colorAttachmentFormats: [],
            depthStencilAttachmentFormat: 'depth32float',
            parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'}
          })
        });
    }
    // Exclude the reflective balls themselves to avoid recursive/self reflections.
    const captureModels = placements
      .filter(placement => placement.body === undefined)
      .map(placement => {
        const model = createPBRModel(device, {
          id: `${placement.id}-reflection`,
          geometry: placement.geometry,
          material: this.materials[placement.material],
          modules: [pose],
          source:
            vertexSource +
            `
@fragment fn fragmentMain(input:Output)->@location(0) vec4f {
 fragmentInputs.pbr_vPosition=input.point;fragmentInputs.pbr_vNormal=normalize(input.normal);
 fragmentInputs.pbr_vUV0=input.uv;fragmentInputs.pbr_vUV1=input.uv;
 return pbr_filterColor(vec4f(1));
}`,
          defines: {
            USE_LIGHTS: true,
            USE_IBL: true,
            USE_TEX_LOD: true,
            USE_SCENE_ENVIRONMENT: true,
            USE_SCENE_COLOR_MANAGEMENT: true
          },
          bindings: {
            bodyPositions: positions,
            bodyOrientations: orientations,
            bodyMatrices: matrices
          },
          colorAttachmentFormats: ['rgba16float'],
          depthStencilAttachmentFormat: 'depth24plus',
          parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'}
        });
        model.shaderInputs.setProps({
          ibl: {
            pbr_diffuseEnvSampler: this.environment.diffuseTexture,
            pbr_specularEnvSampler: this.environment.specularTexture,
            pbr_brdfLUT: this.environment.brdfLUTTexture
          },
          lighting: {lights: [CRADLE_SPOTLIGHT]},
          pbrScene: {
            environmentIntensity: 1,
            environmentRotation: 0,
            environmentMipCount: this.environment.specularTexture.mipLevels,
            outputEncoding: 0,
            toneMapMode: 0
          }
        });
        return {model, placement};
      });
    const probePosition: [number, number, number] = [0, 0, 1.5];
    this.reflectionEnvironment = captureReflectionProbe(
      device,
      probePosition,
      (pass, view, projection) => {
        for (const {model, placement} of captureModels) {
          model.shaderInputs.setProps({
            cradlePose: {
              matrix: placement.matrix,
              viewProjection: new Matrix4(projection).multiplyRight(view),
              view,
              body: -1,
              anchor: -1
            },
            pbrProjection: {camera: probePosition}
          });
          model.draw(pass);
        }
      }
    );
    for (const {model} of captureModels) model.destroy();
    for (const [node, placement] of this.placements) {
      if (placement.material !== 'steel') continue;
      node.model.shaderInputs.setProps({
        ibl: {
          pbr_diffuseEnvSampler: this.reflectionEnvironment.diffuseTexture,
          pbr_specularEnvSampler: this.reflectionEnvironment.specularTexture,
          pbr_brdfLUT: this.reflectionEnvironment.brdfLUTTexture
        },
        pbrScene: {
          environmentIntensity: 1,
          environmentMipCount: this.reflectionEnvironment.specularTexture.mipLevels
        }
      });
    }
  }

  draw(view: Matrix4, projection: Matrix4, eye: [number, number, number]): void {
    const viewProjection = new Matrix4(projection).multiplyRight(view);
    const shadowProps = this.shadows.render({
      camera: {
        viewMatrix: view,
        projectionMatrix: projection,
        near: 0.1,
        far: 200,
        clipDepth: 'zero-to-one'
      },
      spotLights: [
        {
          position: CRADLE_SPOTLIGHT.position,
          direction: CRADLE_SPOTLIGHT.direction,
          outerConeAngle: CRADLE_SPOTLIGHT.outerConeAngle,
          range: 60,
          normalBias: 0.015,
          sourceRadius: 0.025,
          depthBias: 2,
          depthBiasSlopeScale: 2
        }
      ],
      drawShadowCasters: shadowView => {
        for (const {model, node, placement} of this.casters[shadowView.cascadeIndex ?? 0]) {
          model.shaderInputs.setProps({
            cradlePose: {
              matrix: node.matrix,
              viewProjection: shadowView.viewProjectionMatrix,
              view,
              body: placement.body ?? -1,
              anchor: placement.anchor ?? -1
            }
          });
          model.setParameters(shadowView.rasterParameters);
          model.draw(shadowView.renderPass);
        }
      }
    });
    const pass = this.device.beginRenderPass({clearColor: [0.025, 0.03, 0.04, 1], clearDepth: 1});
    this.root.traverse(node => {
      if (!(node instanceof ModelNode)) return;
      const placement = this.placements.get(node)!;
      node.model.shaderInputs.setProps({
        shadow: shadowProps,
        cradlePose: {
          matrix: node.matrix,
          viewProjection,
          view,
          body: placement.body ?? -1,
          anchor: placement.anchor ?? -1
        },
        pbrProjection: {camera: eye}
      });
      node.model.draw(pass);
    });
    pass.end();
  }
  destroy(): void {
    this.root.destroy();
    for (const cascade of this.casters) for (const {model} of cascade) model.destroy();
    this.shadows.destroy();
    for (const material of Object.values(this.materials)) material.destroy();
    for (const texture of this.textures) texture.destroy();
    this.environment.destroy();
    this.reflectionEnvironment.destroy();
  }
}
