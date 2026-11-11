// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  CubeGeometry,
  SphereGeometry,
  GroupNode,
  type Geometry,
  type ScenegraphTransformBinding,
  type ScenegraphNode
} from '@luma.gl/engine';
import {
  SceneRenderer,
  SceneMeshNode,
  type SceneMaterial,
  PBREnvironmentGenerator
} from '@luma.gl/anari';
import type {SpotLight} from '@luma.gl/shaders';
import type {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';
import {Matrix4} from '@math.gl/core';
import {CradleGeometryNode} from './cradle-geometry';
import {captureReflectionProbe} from './reflection-probe';

const CRADLE_SPOTLIGHT = {
  type: 'spot',
  position: [0, -10, 30],
  direction: [0, 10, -30],
  color: [1, 244 / 255, 230 / 255],
  intensity: 16.4,
  attenuation: [1, 0, 0.004],
  innerConeAngle: 0.127,
  outerConeAngle: 0.209
} as const satisfies SpotLight;

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
  private readonly renderer: SceneRenderer;
  private environment;
  private reflectionEnvironment;
  private materials;
  private textures;

  constructor(device: Device, world: GPURigidBodyWorld, frame: GroupNode) {
    this.renderer = new SceneRenderer(device);
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
      stone: {
        id: 'cradle-stone',
        uniforms: {
          baseColorFactor: [0.16, 0.18, 0.2, 1],
          metallicRoughnessValues: [0, 1],
          normalScale: 0.5,
          IBLenabled: true
        },
        bindings: {pbr_normalSampler: normal, pbr_metallicRoughnessSampler: roughness}
      },
      steel: {
        id: 'cradle-steel',
        uniforms: {
          baseColorFactor: [0.8, 0.82, 0.85, 1],
          metallicRoughnessValues: [1, 0.07],
          IBLenabled: true
        }
      },
      table: {
        id: 'cradle-table',
        uniforms: {
          baseColorFactor: [0.55, 0.52, 0.47, 1],
          metallicRoughnessValues: [0, 0.85],
          IBLenabled: true
        }
      },
      thread: {
        id: 'cradle-thread',
        uniforms: {
          baseColorFactor: [0.1, 0.12, 0.14, 1],
          metallicRoughnessValues: [0.5, 0.4],
          IBLenabled: true
        }
      }
    } satisfies Record<Placement['material'], SceneMaterial>;
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
    const bindings = new Map<ScenegraphNode, ScenegraphTransformBinding>();
    this.root.transformSource = {
      getFrame: () => ({
        matrices: world.poseMatrices!,
        matrixCount: world.count,
        revision: 0,
        bindings
      })
    };
    const capture = new GroupNode({id: 'cradle-reflection'});
    const steelNodes: SceneMeshNode[] = [];
    for (const placement of placements) {
      const node = new SceneMeshNode({
        id: placement.id,
        geometry: placement.geometry,
        material: this.materials[placement.material],
        matrix: placement.matrix,
        ...(placement.anchor !== undefined
          ? {connection: {first: placement.anchor, second: placement.body!, radius: 0.018}}
          : {})
      });
      this.root.add(node);
      if (placement.body !== undefined)
        bindings.set(node, {matrixIndex: placement.body, localMatrix: placement.matrix});
      else capture.add(node);
      if (placement.material === 'steel') steelNodes.push(node);
    }
    // Static surfaces only: exclude the reflective balls from their own probe.
    const captureRenderer = new SceneRenderer(device);
    const probePosition: [number, number, number] = [0, 0, 1.5];
    this.reflectionEnvironment = captureReflectionProbe(
      device,
      probePosition,
      (framebuffer, view, projection) => {
        captureRenderer.render({
          scene: capture,
          framebuffer,
          camera: {viewMatrix: view, projectionMatrix: projection, position: probePosition},
          lights: [CRADLE_SPOTLIGHT],
          environment: this.environment,
          background: [0.787, 0.828, 0.768, 1],
          outputColorSpace: 'linear',
          toneMapMode: 0
        });
      }
    );
    captureRenderer.destroy();
    for (const node of steelNodes) node.environment = this.reflectionEnvironment;
  }

  draw(view: Matrix4, projection: Matrix4, eye: [number, number, number]): void {
    this.renderer.render({
      scene: this.root,
      camera: {
        viewMatrix: view,
        projectionMatrix: projection,
        position: eye,
        near: 0.1,
        far: 200,
        clipDepth: 'zero-to-one'
      },
      lights: [CRADLE_SPOTLIGHT],
      environment: this.environment,
      background: [0.025, 0.03, 0.04, 1],
      spotShadows: {
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
        ]
      }
    });
  }
  destroy(): void {
    this.renderer.destroy();
    this.root.destroy();
    for (const texture of this.textures) texture.destroy();
    this.environment.destroy();
    this.reflectionEnvironment.destroy();
  }
}
