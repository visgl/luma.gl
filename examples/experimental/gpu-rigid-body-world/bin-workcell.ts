// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CubeGeometry, GroupNode, type ScenegraphTransformBinding} from '@luma.gl/engine';
import {makePhysicsControllerScene, type PhysicsBodyOptions} from '@luma.gl/engine/physics';
import {SceneMeshNode} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core/matrix';
import type {Buffer} from '@luma.gl/core';

export const BIN_ANGLES = [-0.68, 0, 0.68] as const;
export const BIN_DESTINATION = 1.65;
export type BinScenario = {target: number; obstructed?: boolean; offset?: number; drop?: boolean};
type Vector = [number, number, number];

/** Cook and render the same registered scene nodes. Selection only sets the actuator trajectory. */
export function makeBinWorkcell(bin: BinScenario, reach: number, mass: number) {
  const root = new GroupNode({id: 'bin-workcell'});
  const geometry = new CubeGeometry();
  const definitions = new Map<SceneMeshNode, PhysicsBodyOptions>();
  const localScales = new Map<SceneMeshNode, Matrix4>();
  function box(
    id: string,
    position: Vector,
    yaw: number,
    size: Vector,
    weight: number,
    color: Vector
  ) {
    const local = new Matrix4().scale(size);
    const matrix = new Matrix4().translate(position).rotateZ(yaw).multiplyRight(local);
    const node = new SceneMeshNode({
      id,
      geometry,
      matrix,
      material: {
        id: id + '-finish',
        uniforms: {baseColorFactor: [...color, 1], metallicRoughnessValues: [0.15, 0.4]}
      }
    });
    root.add(node);
    localScales.set(node, local);
    definitions.set(node, {
      motion: weight ? 'dynamic' : 'static',
      mass: weight,
      friction: weight ? 1 : 0.65 ** 2,
      restitution: 0
    });
  }
  box('bench', [0, 0, -0.12], 0, [2.4, 2.4, 0.12], 0, [0.27, 0.32, 0.34]);
  const colors: Vector[] = [
    [0.035, 0.55, 0.5],
    [0.92, 0.29, 0.045],
    [0.42, 0.56, 0.84]
  ];
  for (const [index, angle] of BIN_ANGLES.entries()) {
    const split = bin.obstructed && index < 2;
    const yaw = bin.drop && index === 2 ? BIN_DESTINATION : split ? BIN_ANGLES[bin.target] : angle;
    const lateral = split ? (index === 0 ? -0.23 : 0.23) : 0;
    const radial = reach + (index === bin.target ? (bin.offset ?? 0) : 0);
    box(
      'workpiece-' + index,
      [
        radial * Math.cos(yaw) - lateral * Math.sin(yaw),
        radial * Math.sin(yaw) + lateral * Math.cos(yaw),
        0.24
      ],
      yaw,
      [0.19, split ? 0.105 : 0.2, 0.24],
      mass,
      colors[index]
    );
  }
  const x = reach * Math.cos(BIN_DESTINATION),
    y = reach * Math.sin(BIN_DESTINATION);
  for (const sign of [-1, 1]) {
    box(
      'tray-x-' + sign,
      [x + sign * 0.47, y, 0.045],
      0,
      [0.025, 0.49, 0.045],
      0,
      [0.12, 0.18, 0.2]
    );
    box(
      'tray-y-' + sign,
      [x, y + sign * 0.47, 0.045],
      0,
      [0.445, 0.025, 0.045],
      0,
      [0.12, 0.18, 0.2]
    );
  }
  const {definition} = makePhysicsControllerScene(root, definitions, {});
  return {
    root,
    bodies: definition.world.bodies,
    bind(matrices: Buffer, count: number, ordered: boolean) {
      const bindings = new Map<SceneMeshNode, ScenegraphTransformBinding>();
      for (const [node, localMatrix] of localScales) {
        const index = definition.bodies.get(node)!;
        bindings.set(node, {matrixIndex: ordered && index > 0 ? index + 5 : index, localMatrix});
      }
      root.transformSource = {
        getFrame: () => ({matrices, matrixCount: count, revision: 0, bindings})
      };
    }
  };
}
