// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {
  CubeGeometry,
  SphereGeometry,
  GroupNode,
  type ScenegraphNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {ReflectionProbe} from '@luma.gl/engine/lighting';
import {
  SceneRenderer,
  SceneMeshNode,
  type SceneMaterial,
  type SceneEnvironment
} from '@luma.gl/anari';
import type {GPURigidBodyWorld, GPURigidBody} from '@luma.gl/graph/gpu-physics';
import {Matrix4} from '@math.gl/core';
import {createLabEnvironment} from './lab-material';
import {WRECKING_BALL_BODY_INDEX} from './wrecking-ball';
import {LAB_SPOTLIGHT} from './rigid-body-shadows';

const LIGHTS = [
  {...LAB_SPOTLIGHT, color: [1, 230 / 255, 194 / 255] as const},
  {type: 'ambient' as const, color: [1, 1, 1] as const, intensity: 0.3}
];
const BACKGROUND = [0.9, 0.92, 0.89, 1] as const;

/** Batched retained geometry; physics buffers are borrowed by the shared renderer. */
export class WreckingBallScene {
  readonly root = new GroupNode({id: 'wrecking-ball'});
  private readonly renderer: SceneRenderer;
  private readonly environment;
  private readonly probe: ReflectionProbe;
  private readonly captureRoots: GroupNode[];
  private captureMatrices?: Buffer;
  private ball?: SceneMeshNode;
  private readonly reflectionEnvironments = new Map<
    NonNullable<ReflectionProbe['texture']>,
    SceneEnvironment
  >();
  constructor(
    device: Device,
    private readonly world: GPURigidBodyWorld,
    bodies: readonly GPURigidBody[]
  ) {
    this.renderer = new SceneRenderer(device);
    this.environment = createLabEnvironment(device);
    this.probe = new ReflectionProbe(device, {
      size: 64,
      sampleCount: 8,
      mipLevels: 2,
      refreshMode: 'same-frame'
    });
    const bindings = new Map<ScenegraphNode, ScenegraphTransformBinding>();
    this.root.transformSource = {
      getFrame: () => ({
        matrices: world.poseMatrices!,
        matrixCount: world.count,
        revision: 0,
        bindings
      })
    };
    const cube = new CubeGeometry();
    const sphere = new SphereGeometry({nlat: 24, nlong: 48});
    const materials: SceneMaterial[] = [
      {
        id: 'plinth',
        uniforms: {baseColorFactor: [0.45, 0.43, 0.38, 1], metallicRoughnessValues: [0, 0.8]}
      },
      {
        id: 'frame',
        uniforms: {baseColorFactor: [0.2, 0.23, 0.26, 1], metallicRoughnessValues: [0.7, 0.3]}
      },
      {
        id: 'ball',
        uniforms: {baseColorFactor: [0.54, 0.57, 0.61, 1], metallicRoughnessValues: [0.96, 0.15]}
      },
      {
        id: 'blocks',
        uniforms: {baseColorFactor: [0.65, 0.36, 0.13, 1], metallicRoughnessValues: [0, 0.65]}
      }
    ];
    const captureNodes: SceneMeshNode[] = [];
    for (const [index, body] of bodies.entries()) {
      const shape = body.shape!;
      if (shape.type !== 'box' && shape.type !== 'sphere')
        throw new Error('Wrecking ball requires primitives');
      const localMatrix = new Matrix4().scale(
        shape.type === 'box' ? shape.halfExtents : [shape.radius, shape.radius, shape.radius]
      );
      const node = new SceneMeshNode({
        id: `body-${index}`,
        geometry: shape.type === 'sphere' ? sphere : cube,
        material: materials[index === 0 ? 0 : index === 2 ? 2 : index < 6 ? 1 : 3],
        matrix: new Matrix4().translate(body.position ?? [0, 0, 0]).multiplyRight(localMatrix)
      });
      bindings.set(node, {matrixIndex: index, localMatrix});
      this.root.add(node);
      if (index === WRECKING_BALL_BODY_INDEX) this.ball = node;
      // The nearby suspension can dominate the reflection. Capture the plinth and blocks.
      if (index === 0 || index >= 6) captureNodes.push(node);
    }
    this.root.add(
      new SceneMeshNode({
        id: 'pendulum',
        geometry: cube,
        material: materials[1],
        connection: {first: 1, second: 2, radius: 0.025}
      })
    );
    this.captureRoots = Array.from(
      {length: 6},
      () =>
        new GroupNode({
          children: captureNodes,
          transformSource: {
            getFrame: () => ({
              matrices: this.captureMatrices!,
              matrixCount: world.count,
              revision: 0,
              bindings
            })
          }
        })
    );
  }

  draw(
    view: Matrix4,
    projection: Matrix4,
    eye: [number, number, number],
    {frameMilliseconds, advanced}: {frameMilliseconds?: number; advanced: boolean} = {
      advanced: true
    }
  ): void {
    this.probe.update({
      matrices: this.world.poseMatrices!,
      matrixIndex: WRECKING_BALL_BODY_INDEX,
      frameMilliseconds,
      refresh: advanced,
      viewDirections: [[view[2], view[6], view[10]]],
      draw: face => {
        this.captureMatrices = face.matrices;
        this.renderer.render({
          scene: this.captureRoots[face.face],
          framebuffer: face.framebuffer,
          camera: {
            viewMatrix: face.viewMatrix,
            projectionMatrix: face.projectionMatrix,
            position: [0, 0, 0],
            gpuOrigin: face.origin
          },
          environment: this.environment,
          lights: LIGHTS,
          background: BACKGROUND,
          transmission: false,
          toneMapMode: 0,
          outputColorSpace: 'linear'
        });
      }
    });
    if (
      this.ball &&
      this.probe.texture &&
      this.ball.environment?.specularTexture !== this.probe.texture
    ) {
      const texture = this.probe.texture;
      let environment = this.reflectionEnvironments.get(texture);
      if (!environment) {
        environment = {...this.environment, specularTexture: texture};
        this.reflectionEnvironments.set(texture, environment);
      }
      this.ball.environment = environment;
    }
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
      environment: this.environment,
      lights: LIGHTS,
      background: BACKGROUND,
      spotShadows: {
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
        ]
      }
    });
  }
  destroy(): void {
    this.renderer.destroy();
    this.probe.destroy();
    this.root.destroy();
    this.environment.destroy();
  }
}
