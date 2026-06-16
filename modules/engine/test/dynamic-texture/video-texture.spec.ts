// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Device} from '@luma.gl/core';
import {getNullTestDevice} from '@luma.gl/test-utils';
import {VideoTexture} from '../../src';

const TEXTURE_BINDING = {
  type: 'texture',
  name: 'videoTexture',
  group: 0,
  location: 0
} as const;
const EXTERNAL_TEXTURE_BINDING = {
  type: 'external-texture',
  name: 'videoTexture',
  group: 0,
  location: 0
} as const;

test('VideoTexture resolves copied VideoFrame bindings without owning frames', async t => {
  const device = await getNullTestDevice();
  const firstFrame = makeFakeVideoFrame(1);
  const videoTexture = new VideoTexture(device, {source: firstFrame.frame});

  t.true(videoTexture.isReady, 'VideoFrame source is ready immediately');
  const firstResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.ok(firstResolution, 'ready frame resolves to copied texture');
  const firstTexture = firstResolution!;
  const firstGeneration = videoTexture.generation;
  const firstTimestamp = videoTexture.updateTimestamp;

  const sameFrameResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);
  t.equal(sameFrameResolution, firstTexture, 'same frame reuses copied texture');
  t.equal(videoTexture.generation, firstGeneration, 'same binding preserves generation');

  const secondFrame = makeFakeVideoFrame(2);
  videoTexture.setSource(secondFrame.frame);
  const replacementGeneration = videoTexture.generation;
  const secondResolution = videoTexture.resolveTextureBinding(TEXTURE_BINDING);

  t.ok(replacementGeneration > firstGeneration, 'source replacement advances generation');
  t.equal(secondResolution, firstTexture, 'same-size replacement frame reuses texture');
  t.equal(
    videoTexture.generation,
    replacementGeneration,
    'same-size content upload preserves binding generation'
  );
  t.ok(videoTexture.updateTimestamp > firstTimestamp, 'replacement frame updates timestamp');
  t.equal(firstFrame.closeCount, 0, 'replaced frame remains caller-owned');

  videoTexture.destroy();
  t.equal(secondFrame.closeCount, 0, 'destroy does not close caller-owned frame');
  t.end();
});

test('VideoTexture waits for HTMLVideoElement current frame data', async t => {
  const device = await getNullTestDevice();
  const video = makeFakeVideoElement();
  const videoTexture = new VideoTexture(device, {source: video as HTMLVideoElement});

  t.false(videoTexture.isReady, 'video without current frame is not ready');

  video.videoWidth = 4;
  video.videoHeight = 2;
  video.readyState = 2;
  video.dispatchEvent(new Event('loadeddata'));
  await videoTexture.ready;

  t.true(videoTexture.isReady, 'video becomes ready with dimensions and current frame');
  t.ok(videoTexture.resolveTextureBinding(TEXTURE_BINDING), 'ready video resolves binding');

  videoTexture.destroy();
  t.end();
});

test('VideoTexture does not bind copied textures through WebGPU external slots', t => {
  const videoTexture = new VideoTexture(makeFakeWebGPUDevice(), {
    source: makeFakeVideoFrame(1).frame
  });

  t.throws(
    () => videoTexture.resolveTextureBinding(EXTERNAL_TEXTURE_BINDING),
    /use texture_2d for copied video path/,
    'native external import failure requires a copied texture shader slot'
  );

  videoTexture.destroy();
  t.end();
});

test('VideoTexture rejects WebGPU copied mipmaps during draw binding resolution', t => {
  const videoTexture = new VideoTexture(makeFakeWebGPUDevice(), {
    source: makeFakeVideoFrame(1).frame,
    mipmaps: true
  });

  t.throws(
    () => videoTexture.resolveTextureBinding(TEXTURE_BINDING),
    /cannot generate WebGPU video mipmaps during draw binding resolution/,
    'WebGPU copied mipmaps need preparation before the render pass'
  );

  videoTexture.destroy();
  t.end();
});

function makeFakeVideoFrame(timestamp: number): {frame: VideoFrame; closeCount: number} {
  const result = {
    closeCount: 0,
    frame: {
      displayWidth: 2,
      displayHeight: 2,
      timestamp,
      close: () => {
        result.closeCount++;
      }
    } as unknown as VideoFrame
  };
  return result;
}

function makeFakeVideoElement(): EventTarget & {
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  currentTime: number;
} {
  return Object.assign(new EventTarget(), {
    videoWidth: 0,
    videoHeight: 0,
    readyState: 0,
    currentTime: 0
  });
}

function makeFakeWebGPUDevice(): Device {
  let timestamp = 0;
  return {
    type: 'webgpu',
    incrementTimestamp: () => ++timestamp,
    createExternalTexture: () => {
      throw new Error('native external textures unavailable');
    }
  } as unknown as Device;
}
