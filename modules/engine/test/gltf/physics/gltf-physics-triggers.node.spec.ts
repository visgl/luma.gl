// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {parseGLTFPhysics, type GLTFPhysicsDocument} from '../../../src/gltf/physics';

function makeDocument(): GLTFPhysicsDocument {
  const geometry = {shape: 0};
  return {
    scenes: [{nodes: [0, 3, 4]}],
    nodes: [
      {
        children: [1],
        extensions: {KHR_physics_rigid_bodies: {trigger: {nodes: [1], collisionFilter: 0}}}
      },
      {children: [2], extensions: {KHR_physics_rigid_bodies: {trigger: {nodes: [2]}}}},
      {extensions: {KHR_physics_rigid_bodies: {trigger: {geometry}}}},
      {extensions: {KHR_physics_rigid_bodies: {collider: {geometry, collisionFilter: 1}}}},
      {extensions: {KHR_physics_rigid_bodies: {collider: {geometry, collisionFilter: 2}}}}
    ],
    extensions: {
      KHR_implicit_shapes: {shapes: [{type: 'sphere', sphere: {radius: 1}}]},
      KHR_physics_rigid_bodies: {
        collisionFilters: [
          {collideWithSystems: ['accepted']},
          {collisionSystems: ['accepted']},
          {collisionSystems: ['rejected']}
        ]
      }
    }
  };
}

it('imports nested trigger unions with per-collider transitions and parent filtering', () => {
  const source = makeDocument();
  const original = structuredClone(source);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const outer = description.triggers.find(trigger => trigger.nodeIndex === 0)!.trigger;
  expect(outer.perCollider).toBe(true);
  expect(outer.colliders).toHaveLength(1);
  expect(outer.targets?.map(index => description.colliders[index].nodeIndex)).toEqual([3]);
  const inner = description.triggers.find(trigger => trigger.nodeIndex === 1)!.trigger;
  expect(inner.targets).toHaveLength(2);
  expect(source).toEqual(original);
});

it('rejects compound trigger references outside the descendant hierarchy', () => {
  const source = makeDocument();
  source.nodes = [
    {...source.nodes![0], extensions: {KHR_physics_rigid_bodies: {trigger: {nodes: [3]}}}},
    ...source.nodes!.slice(1)
  ];
  expect(
    parseGLTFPhysics(source).issues.some(issue => issue.code === 'unsupported-or-invalid-trigger')
  ).toBe(true);
});

it('preserves intermediate branch filters without narrowing sibling trigger branches', () => {
  const source = makeDocument();
  source.nodes![0].extensions = {KHR_physics_rigid_bodies: {trigger: {nodes: [1, 5]}}};
  source.nodes![0].children = [1, 5];
  source.nodes![1].extensions = {
    KHR_physics_rigid_bodies: {trigger: {nodes: [2], collisionFilter: 0}}
  };
  source.nodes!.push({extensions: {KHR_physics_rigid_bodies: {trigger: {geometry: {shape: 0}}}}});
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const outer = description.triggers.find(trigger => trigger.nodeIndex === 0)!.trigger;
  expect(outer.targets?.map(index => description.colliders[index].nodeIndex)).toEqual([3, 4]);
  expect(
    outer.excludedPairs?.map(pair => pair.map(index => description.colliders[index].nodeIndex))
  ).toEqual([[2, 4]]);
  const sibling = description.triggers.find(trigger => trigger.nodeIndex === 5)!.trigger;
  expect(sibling.excludedPairs).toEqual([]);
});
