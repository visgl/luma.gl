// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  CubeGeometry,
  SphereGeometry,
  GroupNode,
  type ScenegraphNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {SceneRenderer, SceneMeshNode, type SceneMaterial} from '@luma.gl/anari';
import type {GPURigidBodyWorld, GPURigidBody} from '@luma.gl/graph/gpu-physics';
import {Matrix4} from '@math.gl/core';
import {createLabEnvironment} from './lab-material';
import {LAB_SPOTLIGHT} from './rigid-body-shadows';

/** Batched retained geometry; physics buffers are borrowed by the shared renderer. */
export class WreckingBallScene {
  readonly root = new GroupNode({id: 'wrecking-ball'});
  private readonly renderer: SceneRenderer;
  private readonly environment;
  constructor(device: Device, world: GPURigidBodyWorld, bodies: readonly GPURigidBody[]) {
    this.renderer = new SceneRenderer(device);
    this.environment = createLabEnvironment(device);
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
    const sphere = new SphereGeometry({nlat: 12, nlong: 16});
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
        uniforms: {baseColorFactor: [0.65, 0.67, 0.7, 1], metallicRoughnessValues: [0.7, 0.22]}
      },
      {
        id: 'blocks',
        uniforms: {baseColorFactor: [0.65, 0.36, 0.13, 1], metallicRoughnessValues: [0, 0.65]}
      }
    ];
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
    }
    this.root.add(
      new SceneMeshNode({
        id: 'pendulum',
        geometry: cube,
        material: materials[1],
        connection: {first: 1, second: 2, radius: 0.025}
      })
    );
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
      environment: this.environment,
      lights: [
        {...LAB_SPOTLIGHT, color: [1, 230 / 255, 194 / 255]},
        {type: 'ambient', intensity: 0.3}
      ],
      background: [0.9, 0.92, 0.89, 1],
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
    this.root.destroy();
    this.environment.destroy();
  }
}
