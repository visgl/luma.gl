// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GroupNode, JointController, type ScenegraphJoint} from '../../src';

it('resolves joint attachment identity independently of node names', () => {
  const first = new GroupNode({id: 'duplicate', position: [1, 0, 0], scale: [2, 2, 2]});
  const attachment = new GroupNode({id: 'duplicate', position: [0, 1, 0]});
  first.add(attachment);
  const second = new GroupNode({id: 'duplicate', position: [1, 2, 0]});
  const joint: ScenegraphJoint = {
    first: attachment,
    second,
    limits: [{axes: [0, 1, 2], maximum: 0}]
  };
  const controller = new JointController([joint]);
  const [resolved] = controller.resolve([first, second], new Set([first]));
  expect(resolved.first.body).toBe(first);
  expect(resolved.first.position).toEqual([0, 2, 0]);
  expect(resolved.second.body).toBe(null);
  expect(resolved.second.position).toEqual([1, 2, 0]);
  expect(resolved.joint).toBe(joint);
});

it('rejects detached attachments and multiply-parented scenes', () => {
  const first = new GroupNode();
  const second = new GroupNode();
  const controller = new JointController([{first, second}]);
  expect(() => controller.resolve([first], new Set())).toThrow('outside the scene');
  expect(() => controller.resolve([new GroupNode([first, second]), first], new Set())).toThrow(
    'tree'
  );
});
