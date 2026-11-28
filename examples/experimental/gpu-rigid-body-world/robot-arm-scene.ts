// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {
  CubeGeometry,
  CylinderGeometry,
  SphereGeometry,
  GroupNode,
  type Geometry,
  type ScenegraphNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {SceneRenderer, SceneMeshNode, type SceneMaterial} from '@luma.gl/anari';
import type {GPURigidBody} from '@luma.gl/graph/gpu-physics';
import {Matrix4} from '@math.gl/core/matrix';

/** Render all mechanical parts from the same published transforms used by the shadow pass. */
export class RobotArmScene {
  private readonly root = new GroupNode({id: 'bench-arm'});
  private readonly renderer: SceneRenderer;

  constructor(
    device: Device,
    world: {poseMatrices: Buffer | null; count: number},
    treeBodies?: GPURigidBody[],
    gripper = false,
    workcell?: ReturnType<typeof import('./bin-workcell').makeBinWorkcell>,
    binMatrices?: Buffer | null
  ) {
    this.renderer = new SceneRenderer(device);
    const bindings = new Map<ScenegraphNode, ScenegraphTransformBinding>();
    this.root.transformSource = {
      getFrame: () => ({
        matrices: world.poseMatrices!,
        matrixCount: world.count,
        revision: 0,
        bindings
      })
    };
    if (workcell) {
      workcell.bind(
        binMatrices ?? world.poseMatrices!,
        binMatrices ? workcell.bodies.length : world.count,
        !binMatrices
      );
      this.root.add(workcell.root);
    }
    const cube = new CubeGeometry();
    const hub = new CylinderGeometry({height: 2, radius: 1, topCap: true, bottomCap: true});
    const sphere = new SphereGeometry({nlat: 24, nlong: 32});
    const material = (
      id: string,
      color: [number, number, number, number],
      metal: number,
      roughness: number
    ): SceneMaterial => ({
      id,
      uniforms: {baseColorFactor: color, metallicRoughnessValues: [metal, roughness]}
    });
    const enamel = material('arm-enamel', [0.9, 0.21, 0.026, 1], 0.22, 0.32);
    const graphite = material('arm-graphite', [0.095, 0.12, 0.13, 1], 0.22, 0.45);
    const steel = material('arm-metal', [0.58, 0.66, 0.7, 1], 0.55, 0.3);
    const bench = material('arm-bench', [0.27, 0.32, 0.34, 1], 0.06, 0.65);
    const add = (
      id: string,
      body: number,
      geometry: Geometry,
      surface: SceneMaterial,
      offset: [number, number, number],
      scale: [number, number, number]
    ) => {
      const isStatic = treeBodies && !treeBodies[body].mass;
      const matrix = new Matrix4();
      if (isStatic) matrix.translate(treeBodies[body].position);
      matrix.translate(offset).scale(scale);
      const node = new SceneMeshNode({id, geometry, material: surface, matrix});
      this.root.add(node);
      if (!isStatic)
        bindings.set(node, {matrixIndex: treeBodies ? body - 2 : body, localMatrix: matrix});
    };
    if (gripper) {
      const teal = material('payload-teal', [0.034, 0.57, 0.52, 1], 0.18, 0.31);
      if (!workcell) add('workbench', 0, cube, bench, [0, 0, 0], [2.4, 2.4, 0.12]);
      for (const angle of workcell ? [] : [0, 1]) {
        const center = [1.4 * Math.cos(angle), 1.4 * Math.sin(angle)];
        for (const sign of [-1, 1]) {
          add(
            'bay-x-' + angle + '-' + sign,
            0,
            cube,
            steel,
            [center[0] + sign * 0.34, center[1], 0.122],
            [0.009, 0.35, 0.002]
          );
          add(
            'bay-y-' + angle + '-' + sign,
            0,
            cube,
            steel,
            [center[0], center[1] + sign * 0.34, 0.122],
            [0.35, 0.009, 0.002]
          );
        }
      }
      add('pedestal', 1, cube, graphite, [0, 0, 0.05], [0.15, 0.16, 0.46]);
      add('foot', 1, cube, steel, [0, 0, -0.35], [0.26, 0.26, 0.05]);
      add('turret', 2, sphere, steel, [0, 0, 0], [0.16, 0.16, 0.16]);
      const telescoping = Boolean(workcell?.ring);
      add(
        'boom',
        3,
        cube,
        enamel,
        [telescoping ? -0.24 : 0, 0, 0],
        [telescoping ? 0.46 : 0.7, 0.09, 0.085]
      );
      if (telescoping) add('extension', 4, cube, steel, [-0.3, 0, 0], [0.3, 0.066, 0.06]);
      add(
        'palm',
        telescoping ? 4 : 3,
        cube,
        graphite,
        [telescoping ? 0 : 0.7, 0, 0],
        [0.1, 0.46, 0.075]
      );
      for (const body of telescoping ? [5, 6] : [4, 5]) {
        add('finger-' + body, body, cube, steel, [0, 0, 0.37], [0.046, 0.043, 0.37]);
        add('pad-' + body, body, sphere, graphite, [0, 0, 0], [0.095, 0.095, 0.095]);
        add('knuckle-' + body, body, sphere, enamel, [0, 0, 0.74], [0.095, 0.095, 0.095]);
      }
      if (workcell) return;
      add('free-workpiece', 6, cube, teal, [0, 0, 0], [0.19, 0.2, 0.24]);
      add('workpiece-stripe', 6, cube, steel, [0, 0, 0.14], [0.191, 0.201, 0.012]);
      return;
    }
    add('bench', 0, cube, bench, [0, 0, 0], [6, 3, 0.15]);
    add('column', 1, cube, graphite, [0, 0, 0], [0.22, 0.32, 1]);
    add('mounting-plate', 1, cube, steel, [0, 0, -0.94], [0.45, 0.44, 0.06]);
    for (let index = 0; index < 4; index++) {
      const body = index + 2;
      add(`link-${index}`, body, cube, enamel, [0, 0, 0], [0.48, 0.12, 0.12]);
      add(`spine-${index}`, body, cube, graphite, [0, 0, 0.105], [0.34, 0.095, 0.025]);
      add(`gearbox-${index}`, body, hub, graphite, [-0.5, 0, 0], [0.16, 0.19, 0.16]);
      for (const side of [-1, 1])
        add(
          `hub-${index}-${side}`,
          body,
          hub,
          steel,
          [-0.5, side * 0.19, 0],
          [0.095, 0.012, 0.095]
        );
    }
    add('payload', 6, sphere, steel, [0, 0, 0], [0.25, 0.25, 0.25]);
    add('work-stop', 7, cube, graphite, [0, 0, 0], [0.6, 0.5, 0.52]);
    add('stop-face', 7, cube, steel, [0, 0, 0.51], [0.6, 0.5, 0.01]);
  }

  draw(view: Matrix4, projection: Matrix4, eye: [number, number, number]): void {
    const spot = {
      type: 'spot',
      position: [1, -4, 8],
      direction: [0, 4, -8],
      color: [1, 0.95, 0.85],
      intensity: 7,
      innerConeAngle: 0.38,
      outerConeAngle: 0.78
    } as const;
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
      lights: [{type: 'ambient', color: [0.84, 0.9, 1], intensity: 0.8}, spot],
      background: [0.095, 0.125, 0.14, 1],
      spotShadows: {
        spotLights: [
          {
            position: spot.position,
            direction: spot.direction,
            outerConeAngle: spot.outerConeAngle,
            range: 24,
            normalBias: 0.008,
            sourceRadius: 0.04
          }
        ]
      }
    });
  }
  destroy(): void {
    this.renderer.destroy();
    this.root.destroy();
  }
}
