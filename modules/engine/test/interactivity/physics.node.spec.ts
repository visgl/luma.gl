// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Interactivity, type InteractivityPhysics} from '../../src';

it('continues asynchronous physics query flows with the query payload', async () => {
  const impulses: number[][] = [];
  const physics: InteractivityPhysics = {
    applyImpulse: (node, linear, angular) => {
      impulses.push([node, ...linear, ...angular]);
    },
    applyPointImpulse: () => {},
    isTriggerNode: () => true,
    rayCast: async () => ({node: 7, fraction: 0.5, normal: [0, 1, 0]})
  };
  const behavior = new Interactivity(
    {
      graphs: [
        {
          declarations: [
            {op: 'event/onStart'},
            {op: 'rigid_body/rayCast', extension: 'KHR_physics_rigid_bodies'},
            {op: 'rigid_body/applyImpulse', extension: 'KHR_physics_rigid_bodies'}
          ],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {
              declaration: 1,
              values: {rayStart: {value: [0, 0, 0]}, rayEnd: {value: [10, 0, 0]}},
              flows: {hit: {node: 2}}
            },
            {
              declaration: 2,
              values: {
                nodeIndex: {node: 1, socket: 'hitNodeIndex'},
                linearImpulse: {node: 1, socket: 'hitNormal'}
              }
            }
          ]
        }
      ]
    },
    {physics}
  );
  behavior.start();
  expect(impulses).toEqual([]);
  await behavior.flushPhysics();
  expect(impulses).toEqual([[7, 0, 1, 0, 0, 0, 0]]);
});

it('rejects duplicate trigger event subscriptions', () => {
  const physics: InteractivityPhysics = {
    applyImpulse: () => {},
    applyPointImpulse: () => {},
    rayCast: async () => null,
    isTriggerNode: () => true
  };
  expect(
    () =>
      new Interactivity(
        {
          graphs: [
            {
              declarations: [
                {op: 'event/rigid_body_triggerEntered', extension: 'KHR_physics_rigid_bodies'}
              ],
              nodes: [
                {declaration: 0, configuration: {nodeIndex: {value: [2]}}},
                {declaration: 0, configuration: {nodeIndex: {value: [2]}}}
              ]
            }
          ]
        },
        {physics}
      )
  ).toThrow('duplicate');
});

it('preserves each trigger activation across overlapping and nested ray continuations', async () => {
  type Hit = Awaited<ReturnType<InteractivityPhysics['rayCast']>>;
  const queries: ((hit: Hit) => void)[] = [];
  const impulses: number[][] = [];
  const physics: InteractivityPhysics = {
    applyImpulse: (node, linear) => {
      impulses.push([node, ...linear]);
    },
    applyPointImpulse: () => {},
    isTriggerNode: () => true,
    rayCast: () => new Promise(resolve => queries.push(resolve))
  };
  const behavior = new Interactivity(
    {
      graphs: [
        {
          declarations: [
            {op: 'event/rigid_body_triggerEntered', extension: 'KHR_physics_rigid_bodies'},
            {op: 'rigid_body/rayCast', extension: 'KHR_physics_rigid_bodies'},
            {op: 'rigid_body/applyImpulse', extension: 'KHR_physics_rigid_bodies'}
          ],
          nodes: [
            {declaration: 0, configuration: {nodeIndex: {value: [2]}}, flows: {out: {node: 1}}},
            {
              declaration: 1,
              values: {rayStart: {value: [0, 0, 0]}, rayEnd: {value: [1, 0, 0]}},
              flows: {hit: {node: 2}}
            },
            {
              declaration: 1,
              values: {rayStart: {value: [0, 0, 0]}, rayEnd: {value: [1, 0, 0]}},
              flows: {miss: {node: 3}}
            },
            {
              declaration: 2,
              values: {
                nodeIndex: {node: 0, socket: 'colliderNodeIndex'},
                linearImpulse: {node: 1, socket: 'hitNormal'}
              }
            }
          ]
        }
      ]
    },
    {physics}
  );
  behavior.notifyPhysicsTrigger('enter', 2, 10, 0);
  behavior.notifyPhysicsTrigger('enter', 2, 11, 1);
  queries[1]({node: 21, fraction: 0.5, normal: [0, 1, 0]});
  await Promise.resolve();
  queries[0]({node: 20, fraction: 0.5, normal: [1, 0, 0]});
  await Promise.resolve();
  expect(queries).toHaveLength(4);
  queries[3](null);
  queries[2](null);
  await behavior.flushPhysics();
  expect(impulses).toEqual([
    [10, 1, 0, 0],
    [11, 0, 1, 0]
  ]);
  expect(behavior.evaluate(0, 'colliderNodeIndex')).toEqual([11]);
});
