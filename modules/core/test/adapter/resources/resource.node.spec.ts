// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Resource, DeviceResource} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';

class TestResource extends Resource {
  constructor(
    readonly name = 'resource',
    readonly events: string[] = [],
    readonly before?: () => void,
    readonly cleanup?: () => void
  ) {
    super();
  }

  protected override onBeforeDestroy(): void {
    this.events.push(`before:${this.name}`);
    this.before?.();
  }

  protected override onDestroy(): void {
    this.events.push(`destroy:${this.name}`);
    this.cleanup?.();
  }
}

it('Resource transfers exclusive ownership and exposes only snapshots', () => {
  const first = new TestResource();
  const second = new TestResource();
  const child = new TestResource();
  expect(child.owner).toBe(null);
  expect(child.transferOwnershipTo(first)).toBe(child);
  child.transferOwnershipTo(first);
  expect(first.ownedResources).toEqual([child]);
  (first.ownedResources as Resource[]).length = 0;
  expect(first.ownedResources).toEqual([child]);
  child.transferOwnershipTo(second);
  expect(first.ownedResources).toEqual([]);
  expect(second.ownedResources).toEqual([child]);
  first.destroy();
  expect(child.destroyed).toBe(false);
  child.transferOwnershipTo(null);
  second.destroy();
  expect(child.destroyed).toBe(false);
  child.destroy();
});

it('Resource rejects cycles and dead endpoints without changing ownership', () => {
  const root = new TestResource();
  const child = new TestResource().transferOwnershipTo(root);
  const grandchild = new TestResource().transferOwnershipTo(child);
  expect(() => root.transferOwnershipTo(root)).toThrow();
  expect(() => root.transferOwnershipTo(grandchild)).toThrow();
  expect(root.owner).toBe(null);
  expect(child.owner).toBe(root);
  const dead = new TestResource();
  dead.destroy();
  expect(() => child.transferOwnershipTo(dead)).toThrow();
  expect(() => dead.transferOwnershipTo(root)).toThrow();
  expect(child.owner).toBe(root);
  root.destroy();
});

it('Resource destroys descendants first, unregisters children, and tolerates reentrancy', () => {
  const events: string[] = [];
  const root = new TestResource('root', events);
  const child = new TestResource('child', events, () => root.destroy());
  const grandchild = new TestResource('grandchild', events);
  child.transferOwnershipTo(root);
  grandchild.transferOwnershipTo(child);
  root.destroy();
  root.destroy();
  expect(events).toEqual([
    'before:root',
    'before:child',
    'before:grandchild',
    'destroy:grandchild',
    'destroy:child',
    'destroy:root'
  ]);
  for (const resource of [root, child, grandchild]) {
    expect(resource.destroyed).toBe(true);
    expect(resource.owner).toBe(null);
    expect(resource.ownedResources).toEqual([]);
  }
  const owner = new TestResource();
  const independent = new TestResource().transferOwnershipTo(owner);
  independent.destroy();
  expect(owner.ownedResources).toEqual([]);
  owner.destroy();
});

it('Resource continues cleanup after failures and rejects transfers during teardown', () => {
  const events: string[] = [];
  const spare = new TestResource();
  const root = new TestResource(
    'root',
    events,
    () => {
      expect(() => spare.transferOwnershipTo(root)).toThrow();
      throw new Error('prepare failed');
    },
    () => {
      throw new Error('parent cleanup failed');
    }
  );
  const child = new TestResource(
    'child',
    events,
    () => {
      expect(() => child.transferOwnershipTo(null)).toThrow();
      expect(() => sibling.transferOwnershipTo(spare)).toThrow();
    },
    () => {
      throw new Error('child cleanup failed');
    }
  ).transferOwnershipTo(root);
  const sibling = new TestResource('sibling', events).transferOwnershipTo(root);
  expect(() => root.destroy()).toThrow(AggregateError);
  expect(events).toContain('destroy:sibling');
  expect(events.at(-1)).toBe('destroy:root');
  expect([root, child, sibling].every(resource => resource.destroyed)).toBe(true);
  expect(root.ownedResources).toEqual([]);
  expect(() => root.destroy()).not.toThrow();
  spare.destroy();
});

it('Resource attachment compatibility methods respect exclusive ownership', () => {
  const first = new TestResource();
  const second = new TestResource();
  const child = new TestResource();
  first.attachResource(child);
  second.attachResource(child);
  first.detachResource(child);
  first.destroyAttachedResource(child);
  expect(child.owner).toBe(second);
  expect(child.destroyed).toBe(false);
  second.detachResource(child);
  expect(child.owner).toBe(null);
  second.attachResource(child);
  second.destroyAttachedResources();
  expect(second.destroyed).toBe(false);
  expect(child.destroyed).toBe(true);
  expect(second.ownedResources).toEqual([]);
  first.destroy();
  second.destroy();
});

it('DeviceResource participates in device-free ownership and balances statistics', () => {
  const device = new NullDevice({});
  const counts = device.statsManager.getStats('GPU Resource Counts');
  const memory = device.statsManager.getStats('GPU Time and Memory');
  const activeBefore = counts.get('Resources Active').count;
  const memoryBefore = memory.get('GPU Memory').count;
  const scope = new TestResource();
  const buffer = device.createBuffer({byteLength: 16}).transferOwnershipTo(scope);
  const texture = device.createTexture({width: 2, height: 2}).transferOwnershipTo(scope);
  const view = texture.view;
  expect(buffer).toBeInstanceOf(DeviceResource);
  expect(buffer).toBeInstanceOf(Resource);
  expect(view.owner).toBe(texture);
  scope.destroy();
  scope.destroy();
  expect(buffer.destroyed).toBe(true);
  expect(view.destroyed).toBe(true);
  expect(counts.get('Resources Active').count).toBe(activeBefore);
  expect(memory.get('GPU Memory').count).toBe(memoryBefore);
  device.destroy();
});

it('DeviceResource finalizes statistics when native cleanup fails', () => {
  const device = new NullDevice({});
  const counts = device.statsManager.getStats('GPU Resource Counts');
  const memory = device.statsManager.getStats('GPU Time and Memory');
  const activeBefore = counts.get('Resources Active').count;
  const memoryBefore = memory.get('GPU Memory').count;
  const child = new TestResource();
  class FailingResource extends DeviceResource {
    readonly handle = null;
    override get [Symbol.toStringTag](): string {
      return 'FailingResource';
    }
    constructor(readonly device: NullDevice) {
      super(device, {}, DeviceResource.defaultProps);
      this.trackAllocatedMemory(16);
      child.transferOwnershipTo(this);
    }
    protected override destroyHandle(): void {
      expect(child.destroyed).toBe(true);
      throw new Error('native cleanup failed');
    }
  }
  const resource = new FailingResource(device);
  expect(() => resource.destroy()).toThrow(AggregateError);
  expect(resource.destroyed).toBe(true);
  expect(resource.ownedResources).toEqual([]);
  resource.destroy();
  expect(counts.get('Resources Active').count).toBe(activeBefore);
  expect(memory.get('GPU Memory').count).toBe(memoryBefore);
  device.destroy();
});

it.each([
  false,
  true
])('Resource defers parent destruction during child-only cleanup (failure: %s)', fail => {
  const events: string[] = [];
  const parent = new TestResource('parent', events);
  const child = new TestResource(
    'child',
    events,
    () => {
      parent.destroy();
      parent.destroy();
      expect(parent.destroyed).toBe(false);
      expect(events).not.toContain('destroy:parent');
    },
    () => {
      expect(parent.destroyed).toBe(false);
      if (fail) throw new Error('child cleanup failed');
    }
  ).transferOwnershipTo(parent);
  const sibling = new TestResource('sibling', events).transferOwnershipTo(parent);
  if (fail) {
    expect(() => parent.destroyAttachedResources()).toThrow(AggregateError);
  } else {
    parent.destroyAttachedResources();
  }
  expect(events).toEqual([
    'before:child',
    'destroy:child',
    'before:sibling',
    'destroy:sibling',
    'before:parent',
    'destroy:parent'
  ]);
  expect([parent, child, sibling].every(resource => resource.destroyed)).toBe(true);
  expect(parent.ownedResources).toEqual([]);
  expect(() => parent.destroy()).not.toThrow();
});
