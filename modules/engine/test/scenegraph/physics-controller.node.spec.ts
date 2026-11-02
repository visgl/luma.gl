// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {Matrix4} from '@math.gl/core';
import {
  CubeGeometry,
  SphereGeometry,
  GroupNode,
  ScenegraphNode,
  Model,
  ModelNode
} from '@luma.gl/engine';
import {PhysicsController, PhysicsGeometryNode} from '@luma.gl/engine/physics';
import {makePhysicsControllerScene} from '../../src/graph/physics/physics-controller-geometry';
import type {PhysicsBodyOptions} from '@luma.gl/engine/physics';

test('physics paths resolve once to stable references and reject ambiguity before GPU setup', async () => {
  const first = new ScenegraphNode({id: 'ball'}),
    second = new ScenegraphNode({id: 'ball'});
  const left = new GroupNode({id: 'left', children: [first]});
  const right = new GroupNode({id: 'right', children: [second]});
  const scene = new GroupNode({children: [left, right]});
  const device = new NullDevice({});
  const physics = new PhysicsController(device, {scene});
  expect(() => physics.addBody('ball')).toThrow('Ambiguous scenegraph path');
  expect(() => physics.addBody('missing')).toThrow('Physics node not found');
  const body = physics.addBody('/left/ball', {collider: {type: 'sphere', radius: 1}});
  expect(physics.getBody(first)).toBe(body);
  expect(physics.getBody('left/ball')).toBe(body);
  expect(() => physics.addBody(first)).toThrow('already attached');
  left.remove(first);
  right.add(first);
  expect(body.node).toBe(first);
  expect(physics.getBody('/left/ball')).toBeUndefined();
  expect(physics.removeBody(first)).toBe(true);
  expect(physics.removeBody(first)).toBe(false);
  expect(() => physics.update(0.1)).toThrow();
  const destruction = physics.destroy();
  expect(physics.destroy()).toBe(destruction);
  await destruction;
  expect(physics.getBody(first)).toBeUndefined();
  expect(() => physics.addBody(first)).toThrow();
  device.destroy();
});

test('physics cooking includes hidden geometry, bakes scale, and separates nested bodies', () => {
  const box = new PhysicsGeometryNode({
    id: 'box',
    geometry: new CubeGeometry(),
    scale: [2, 3, 4],
    display: false
  });
  const sphere = new PhysicsGeometryNode({
    id: 'sphere',
    geometry: new SphereGeometry({radius: 0.5}),
    position: [5, 0, 0]
  });
  const parent = new GroupNode({id: 'body', position: [1, 2, 3], children: [box, sphere]});
  const scene = new GroupNode({children: [parent]});
  const definitions = new Map<ScenegraphNode, PhysicsBodyOptions>([
    [parent, {motion: 'static'}],
    [sphere, {mass: 2}]
  ]);
  const cooked = makePhysicsControllerScene(scene, definitions, {});
  const [first, second] = cooked.definition.world.bodies;
  expect(first.position).toEqual([1, 2, 3]);
  expect(first.colliders).toHaveLength(1);
  expect(first.colliders?.[0].shape).toEqual({type: 'box', halfExtents: [2, 3, 4]});
  expect(second.position).toEqual([6, 2, 3]);
  expect(second.mass).toBe(2);
  const sphereShape = second.colliders?.[0].shape;
  expect(sphereShape?.type).toBe('sphere');
  if (sphereShape?.type === 'sphere') expect(sphereShape.radius).toBeCloseTo(0.5, 6);
  expect(cooked.definition.bodies.get(sphere)).toBe(1);
});

test('physics cooking reads borrowed Model source geometry and honors explicit overrides', () => {
  const device = new NullDevice({});
  const geometry = new CubeGeometry();
  const model = new Model(device, {
    geometry,
    vs: '#version 300 es\nvoid main() {gl_Position=vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() {color=vec4(1.0);}'
  });
  const node = new ModelNode({id: 'model', model, scale: [2, 2, 2]});
  const scene = new GroupNode([node]);
  expect(model.sourceGeometry).toBe(geometry);
  const definitions = new Map<ScenegraphNode, PhysicsBodyOptions>([[node, {}]]);
  expect(
    makePhysicsControllerScene(scene, definitions, {}).definition.world.bodies[0].colliders?.[0]
      .shape
  ).toEqual({type: 'box', halfExtents: [2, 2, 2]});
  definitions.set(node, {collider: {type: 'sphere', radius: 0.25}});
  expect(
    makePhysicsControllerScene(scene, definitions, {}).definition.world.bodies[0].colliders?.[0]
      .shape
  ).toEqual({type: 'sphere', radius: 0.5});
  const replacement = new CubeGeometry();
  model.setGeometry(replacement);
  expect(model.sourceGeometry).toBe(replacement);
  node.destroy();
  expect(model.sourceGeometry).toBeNull();
  expect(geometry.attributes['POSITION'].value.length).toBeGreaterThan(0);
  device.destroy();
});

test('joint paths resolve to shared engine attachments and compile a fixed world anchor', async () => {
  const device = new NullDevice({});
  const attachment = new ScenegraphNode({id: 'attachment', position: [0, 1, 0]});
  const ball = new GroupNode({id: 'ball', children: [attachment]});
  const anchor = new ScenegraphNode({id: 'anchor', position: [0, 2, 0]});
  const scene = new GroupNode({children: [ball, anchor]});
  const physics = new PhysicsController(device, {scene});
  const joint = physics.addJoint({
    first: 'ball/attachment',
    second: '/anchor',
    limits: [{axes: [0, 1, 2], minimum: 0, maximum: 0}]
  });
  expect(joint.first).toBe(attachment);
  expect(joint.second).toBe(anchor);
  const cooked = makePhysicsControllerScene(
    scene,
    new Map([[ball, {collider: {type: 'sphere', radius: 0.5}}]]),
    {},
    [joint]
  );
  expect(cooked.definition.world.bodies).toHaveLength(2);
  expect(cooked.definition.world.bodies[1].colliders).toEqual([]);
  expect(cooked.definition.world.joints?.[0].first).toBe(0);
  expect(cooked.definition.world.joints?.[0].second).toBe(1);
  expect(physics.removeJoint(joint)).toBe(true);
  expect(physics.removeJoint(joint)).toBe(false);
  await physics.destroy();
  device.destroy();
});

test('physics cooking rejects detached, empty, cyclic and unsupported geometry authoring', () => {
  const node = new ScenegraphNode({id: 'node'});
  const scene = new GroupNode([node]);
  expect(() => makePhysicsControllerScene(scene, new Map(), {})).toThrow('no bodies');
  expect(() => makePhysicsControllerScene(scene, new Map([[node, {}]]), {})).toThrow(
    'No CPU collision geometry'
  );
  expect(() =>
    makePhysicsControllerScene(scene, new Map([[new ScenegraphNode(), {}]]), {})
  ).toThrow('outside');
  scene.add(scene);
  expect(() => makePhysicsControllerScene(scene, new Map([[node, {}]]), {})).toThrow();
});

test('physics cooking preserves reflected triangle winding and explicit convex geometry', () => {
  const node = new PhysicsGeometryNode({geometry: new CubeGeometry(), scale: [-2, 3, 4]});
  const scene = new GroupNode([node]);
  for (const geometryMode of ['convex-hull', 'triangle-mesh'] as const) {
    const cooked = makePhysicsControllerScene(scene, new Map([[node, {geometryMode}]]), {});
    const shape = cooked.definition.world.bodies[0].colliders?.[0].shape;
    expect(shape?.type).toBe(geometryMode);
    if (shape?.type === 'convex-hull' || shape?.type === 'triangle-mesh') {
      expect(shape.geometry.closed).toBe(true);
      expect(shape.geometry.volume).toBeCloseTo(192, 4);
      expect(shape.geometry.minimum).toEqual([-2, -3, -4]);
      expect(shape.geometry.maximum).toEqual([2, 3, 4]);
    }
  }
});

test('physics cooking includes declared render instances in compound shapes and visual bounds', () => {
  const device = new NullDevice({});
  const geometry = new CubeGeometry();
  const model = new Model(device, {
    geometry,
    vs: '#version 300 es\nvoid main() {gl_Position=vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float; out vec4 color; void main() {color=vec4(1.0);}'
  });
  const node = new ModelNode({
    model,
    instanceMatrices: [new Matrix4().translate([-2, 0, 0]), new Matrix4().translate([2, 0, 0])]
  });
  const cooked = makePhysicsControllerScene(new GroupNode([node]), new Map([[node, {}]]), {});
  expect(cooked.definition.world.bodies[0].colliders).toHaveLength(2);
  expect(cooked.localBounds?.get(node)).toEqual([
    [-3, -1, -1],
    [3, 1, 1]
  ]);
  node.destroy();
  device.destroy();
});

test('explicit mesh overrides support unit scale and reflected nonuniform scale without mutation', () => {
  const node = new PhysicsGeometryNode({geometry: new CubeGeometry()});
  const scene = new GroupNode([node]);
  for (const geometryMode of ['convex-hull', 'triangle-mesh'] as const) {
    node.setScale([1, 1, 1]).updateMatrix();
    const source = makePhysicsControllerScene(scene, new Map([[node, {geometryMode}]]), {})
      .definition.world.bodies[0].colliders?.[0].shape;
    if (source?.type !== 'convex-hull' && source?.type !== 'triangle-mesh')
      throw new Error('Expected mesh');
    const positions = [...source.geometry.positions];
    for (const scale of [
      [1, 1, 1],
      [-2, 3, 4]
    ]) {
      node.setScale(scale).updateMatrix();
      const shape = makePhysicsControllerScene(scene, new Map([[node, {collider: source}]]), {})
        .definition.world.bodies[0].colliders?.[0].shape;
      expect(shape?.type).toBe(geometryMode);
      if (shape?.type === 'convex-hull' || shape?.type === 'triangle-mesh') {
        expect(shape.geometry.volume).toBeCloseTo(scale[0] === 1 ? 8 : 192, 4);
        expect(shape.geometry.closed).toBe(true);
      }
    }
    expect(source.geometry.positions).toEqual(positions);
  }
});
