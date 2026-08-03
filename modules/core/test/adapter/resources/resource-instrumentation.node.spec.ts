// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type ResourceInstrumentation} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';

test('ResourceInstrumentation observes resource lifecycle and allocation events', t => {
  const events: string[] = [];
  const instrumentation: ResourceInstrumentation = {
    recordResourceCreated(_device, _resource, resourceType) {
      events.push(`created:${resourceType}`);
    },
    recordResourceDestroyed(_device, _resource, resourceType) {
      events.push(`destroyed:${resourceType}`);
    },
    recordResourceAllocation(_device, _resource, byteLength, resourceType) {
      events.push(`allocated:${resourceType}:${byteLength}`);
    },
    recordResourceDeallocation(_device, _resource, byteLength, resourceType) {
      events.push(`deallocated:${resourceType}:${byteLength}`);
    }
  };
  const device = new NullDevice({resourceInstrumentation: instrumentation});
  events.length = 0;

  const buffer = device.createBuffer({byteLength: 16, usage: Buffer.COPY_DST});
  buffer.destroy();

  t.deepEqual(events, [
    'created:Buffer',
    'allocated:Buffer:16',
    'destroyed:Buffer',
    'deallocated:Buffer:16'
  ]);
  t.end();
});
