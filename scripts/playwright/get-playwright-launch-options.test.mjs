// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';

test('getPlaywrightLaunchOptions selects Dawn SwiftShader for WebGPU', () => {
  const launchOptions = getPlaywrightLaunchOptions({
    backend: 'webgpu-core',
    headless: true,
    platform: 'darwin',
    softwareGpu: true
  });

  assert.deepEqual(launchOptions, {
    channel: 'chromium',
    headless: true,
    args: [
      '--enable-unsafe-webgpu',
      '--ignore-gpu-blocklist',
      '--use-webgpu-adapter=swiftshader',
      '--use-gpu-in-tests',
      '--enable-accelerated-2d-canvas',
      '--enable-unsafe-swiftshader'
    ]
  });
});

test('getPlaywrightLaunchOptions preserves ANGLE and enables Vulkan presentation for Linux WebGPU', () => {
  const launchOptions = getPlaywrightLaunchOptions({
    backend: 'webgpu-core',
    headless: true,
    platform: 'linux',
    softwareGpu: true
  });

  assert.deepEqual(launchOptions, {
    channel: 'chromium',
    headless: true,
    args: [
      '--enable-unsafe-webgpu',
      '--ignore-gpu-blocklist',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-gpu',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader'
    ]
  });
});

test('getPlaywrightLaunchOptions selects ANGLE SwiftShader for WebGL', () => {
  const launchOptions = getPlaywrightLaunchOptions({
    backend: 'webgl2',
    headless: true,
    softwareGpu: true
  });

  assert.deepEqual(launchOptions, {
    channel: 'chromium',
    headless: true,
    args: [
      '--enable-unsafe-webgpu',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ]
  });
});

test('getPlaywrightLaunchOptions selects both software adapters without a requested backend', () => {
  const launchOptions = getPlaywrightLaunchOptions({softwareGpu: true, platform: 'darwin'});

  assert(launchOptions.args.includes('--use-angle=swiftshader'));
  assert(launchOptions.args.includes('--use-webgpu-adapter=swiftshader'));
});

test('getPlaywrightLaunchOptions deduplicates custom software GPU arguments', () => {
  const launchOptions = getPlaywrightLaunchOptions({
    launchOptions: {
      args: ['--use-gl=angle', '--custom-argument']
    },
    softwareGpu: true
  });

  assert.equal(launchOptions.args.filter(argument => argument === '--use-gl=angle').length, 1);
  assert(launchOptions.args.includes('--custom-argument'));
});

test('mixed Linux backends retain ANGLE and use Vulkan compositing', () => {
  const launchOptions = getPlaywrightLaunchOptions({softwareGpu: true, platform: 'linux'});
  assert(launchOptions.args.includes('--use-angle=swiftshader'));
  assert(launchOptions.args.includes('--use-vulkan=swiftshader'));
  assert(!launchOptions.args.includes('--use-webgpu-adapter=swiftshader'));
  assert.equal(new Set(launchOptions.args).size, launchOptions.args.length);
});
