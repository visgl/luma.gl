// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Resource} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/core/test-utils';

class ResourceScope extends Resource {}

it('Resource ownership cascades through GPU attachments and balances backend statistics', async () => {
  for (const device of await getTestDevices()) {
    // Materialize a potentially device-cached sampler before the baseline.
    device.createTexture({width: 1, height: 1}).destroy();
    const counts = device.statsManager.getStats('GPU Resource Counts');
    const memory = device.statsManager.getStats('GPU Time and Memory');
    const activeBefore = counts.get('Resources Active').count;
    const memoryBefore = memory.get('GPU Memory').count;
    const scope = new ResourceScope();
    const framebuffer = device
      .createFramebuffer({
        width: 2,
        height: 2,
        colorAttachments: ['rgba8unorm'],
        depthStencilAttachment: 'depth16unorm'
      })
      .transferOwnershipTo(scope);
    const texture = framebuffer.colorAttachments[0].texture;
    const view = texture.view;
    expect(texture.owner).toBe(framebuffer);
    expect(view.owner).toBe(texture);
    scope.destroy();
    scope.destroy();
    expect(view.destroyed).toBe(true);
    expect(texture.destroyed).toBe(true);
    expect(framebuffer.destroyed).toBe(true);
    expect(counts.get('Resources Active').count).toBe(activeBefore);
    expect(memory.get('GPU Memory').count).toBe(memoryBefore);
  }
});

it('Resource ownership preserves borrowed attachments and supplied samplers', async () => {
  for (const device of await getTestDevices()) {
    const sampler = device.createSampler({});
    const texture = device.createTexture({width: 2, height: 2, sampler});
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    expect(texture.owner).toBe(null);
    framebuffer.destroy();
    expect(texture.destroyed).toBe(false);
    const first = new ResourceScope();
    const second = new ResourceScope();
    texture.transferOwnershipTo(first);
    texture.transferOwnershipTo(second);
    first.destroy();
    expect(texture.destroyed).toBe(false);
    second.destroy();
    expect(texture.destroyed).toBe(true);
    expect(sampler.destroyed).toBe(false);
    sampler.destroy();
  }
});
