// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CubeGeometry,
  RingGeometry,
  GroupNode,
  type ScenegraphTransformBinding
} from '@luma.gl/engine';
import {makePhysicsControllerScene, type PhysicsBodyOptions} from '@luma.gl/engine/physics';
import {SceneMeshNode, type SceneMaterial} from '@luma.gl/anari';
import {Matrix4} from '@math.gl/core/matrix';
import type {Buffer} from '@luma.gl/core';

export const BIN_ANGLES = [-0.68, 0, 0.68] as const;
export const BIN_LIFT_ANGLE = -0.55;
export const STACK_RELEASE_ANGLE = -0.32;
export const FINGER_LENGTH = 0.74;
export const BIN_DESTINATION = 1.65;
export const RING_RETRACTION = 0.44;
export type BinScenario = {
  target: number;
  ring?: boolean;
  parts?: 64 | 256;
  gate?: boolean;
  obstructed?: boolean;
  offset?: number;
  drop?: boolean;
};
type Vector = [number, number, number];

function finish(id: string, color: Vector, metallic = 0.15, roughness = 0.4): SceneMaterial {
  return {
    id,
    uniforms: {baseColorFactor: [...color, 1], metallicRoughnessValues: [metallic, roughness]}
  };
}
const graphite = finish('graphite', [0.27, 0.32, 0.34]);
const steel = finish('steel', [0.12, 0.18, 0.2]);
const stock = [
  finish('brushed-aluminum', [0.74, 0.76, 0.78], 0.54, 0.34),
  finish('satin-nickel', [0.61, 0.59, 0.55], 0.51, 0.38),
  finish('gunmetal', [0.35, 0.39, 0.42], 0.48, 0.31)
];
export const RING_PIECES: {name: string; size: Vector; mass: number}[] = [
  {name: 'Shim', size: [0.15, 0.18, 0.16], mass: 0.35},
  {name: 'Spacer', size: [0.18, 0.17, 0.22], mass: 0.55},
  {name: 'Billet', size: [0.22, 0.2, 0.19], mass: 0.8},
  {name: 'Die', size: [0.18, 0.21, 0.25], mass: 2.5},
  {name: 'Gauge block', size: [0.23, 0.19, 0.21], mass: 4.8},
  {name: 'Counterweight', size: [0.21, 0.22, 0.27], mass: 12}
];
export const ringAngle = (index: number) =>
  ((index - (RING_PIECES.length - 1) / 2) * 2 * Math.PI) / RING_PIECES.length;

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
    material: SceneMaterial
  ) {
    const local = new Matrix4().scale(size);
    const matrix = new Matrix4().translate(position).rotateZ(yaw).multiplyRight(local);
    const node = new SceneMeshNode({id, geometry, matrix, material});
    root.add(node);
    localScales.set(node, local);
    definitions.set(node, {
      motion: weight ? 'dynamic' : 'static',
      mass: weight,
      friction: weight ? 1 : 0.65 ** 2,
      restitution: 0
    });
  }
  box('bench', [0, 0, -0.12], 0, [2.4, 2.4, 0.12], 0, graphite);
  if (bin.ring) {
    const marker = new RingGeometry({innerRadius: 0.299, outerRadius: 0.312, height: 0.0015});
    const marking = finish('inlaid-target', [0.78, 0.76, 0.69], 0.18, 0.64);
    for (const [index, piece] of RING_PIECES.entries()) {
      const yaw = ringAngle(index);
      const innerRadius = reach - RING_RETRACTION;
      root.add(
        new SceneMeshNode({
          id: 'target-' + index,
          geometry: marker,
          material: marking,
          matrix: new Matrix4()
            .translate([innerRadius * Math.cos(yaw), innerRadius * Math.sin(yaw), 0.002])
            .rotateX(Math.PI / 2)
        })
      );
      box(
        piece.name,
        [reach * Math.cos(yaw), reach * Math.sin(yaw), piece.size[2]],
        yaw,
        piece.size,
        mass * piece.mass,
        stock[index % stock.length]
      );
    }
  } else
    for (const [index, angle] of BIN_ANGLES.entries()) {
      const split = bin.obstructed && index < 2;
      const yaw =
        bin.drop && index === 2 ? BIN_DESTINATION : split ? BIN_ANGLES[bin.target] : angle;
      const lateral = split ? (index === 0 ? -0.23 : 0.23) : 0;
      // Raising the boom moves the tip forward because the fingers hang below its axis.
      const radial =
        bin.parts && bin.drop && index === 2
          ? reach * Math.cos(STACK_RELEASE_ANGLE) - FINGER_LENGTH * Math.sin(STACK_RELEASE_ANGLE)
          : reach + (index === bin.target ? (bin.offset ?? 0) : 0);
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
        stock[index]
      );
    }
  if (bin.parts) {
    let seed = 139;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const side = Math.ceil(Math.sqrt(bin.parts) * 1.25);
    let added = 3;
    for (let row = 0; row < side && added < bin.parts; row++)
      for (let column = 0; column < side && added < bin.parts; column++) {
        const x = ((column - (side - 1) / 2) * 4.5) / side;
        const y = ((row - (side - 1) / 2) * 4.5) / side;
        if (
          Math.abs(x) > 2.28 ||
          Math.abs(y) > 2.28 ||
          Math.hypot(x, y) < 0.48 ||
          [...BIN_ANGLES, BIN_DESTINATION].some(
            angle => Math.hypot(x - reach * Math.cos(angle), y - reach * Math.sin(angle)) < 0.55
          )
        )
          continue;
        const scale = 0.8 / side;
        const size: Vector = [
          scale * (0.55 + random() * 0.4),
          scale * (0.55 + random() * 0.4),
          scale * (0.7 + random())
        ];
        box(
          'stock-' + added,
          [x, y, size[2]],
          random() * Math.PI,
          size,
          0.15 + random() * 0.2,
          stock[added % stock.length]
        );
        added++;
      }
    if (bin.gate)
      box(
        'forearm-stop',
        [0.73, 0.34, 0.78],
        0,
        [0.08, 0.09, 0.78],
        0,
        finish('ochre', [0.88, 0.56, 0.06])
      );
  }
  const x = reach * Math.cos(BIN_DESTINATION),
    y = reach * Math.sin(BIN_DESTINATION);
  if (!bin.ring)
    for (const sign of [-1, 1]) {
      box('tray-x-' + sign, [x + sign * 0.47, y, 0.045], 0, [0.025, 0.49, 0.045], 0, steel);
      box('tray-y-' + sign, [x, y + sign * 0.47, 0.045], 0, [0.445, 0.025, 0.045], 0, steel);
    }
  const {definition} = makePhysicsControllerScene(root, definitions, {});
  return {
    root,
    ring: Boolean(bin.ring),
    bodies: definition.world.bodies,
    bind(matrices: Buffer, count: number, ordered: boolean) {
      const bindings = new Map<SceneMeshNode, ScenegraphTransformBinding>();
      for (const [node, localMatrix] of localScales) {
        const index = definition.bodies.get(node)!;
        bindings.set(node, {
          matrixIndex: ordered && index > 0 ? index + (bin.ring ? 6 : 5) : index,
          localMatrix
        });
      }
      root.transformSource = {
        getFrame: () => ({matrices, matrixCount: count, revision: 0, bindings})
      };
    }
  };
}
