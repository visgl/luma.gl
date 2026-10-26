// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const DEFAULT_PLAYWRIGHT_CHANNEL = 'chromium';
const DEFAULT_PLAYWRIGHT_ARGS = ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'];
const ANGLE_SWIFTSHADER_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader'
];
// Retain ANGLE for WebGL parity; Vulkan compositing enables WebGPU capture.
// Linux headless presentation also requires an X display (xvfb-run in CI).
const LINUX_WEBGPU_SWIFTSHADER_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--enable-gpu',
  '--enable-features=Vulkan',
  '--use-vulkan=swiftshader'
];
const WEBGPU_SWIFTSHADER_ARGS = [
  '--use-webgpu-adapter=swiftshader',
  '--use-gpu-in-tests',
  '--enable-accelerated-2d-canvas',
  '--enable-unsafe-swiftshader'
];

export function getPlaywrightLaunchOptions(options = {}) {
  const ocularConfig = options.ocularConfig || {};
  const playwrightConfig = ocularConfig.devtools?.playwright || {};
  const customLaunchOptions = options.launchOptions || {};
  const args = dedupeValues([
    ...DEFAULT_PLAYWRIGHT_ARGS,
    ...(playwrightConfig.args || []),
    ...(customLaunchOptions.args || []),
    ...(options.softwareGpu || playwrightConfig.softwareGpu
      ? getSoftwareGPUArguments(options.backend, options.platform ?? process.platform)
      : [])
  ]);

  const launchOptions = {
    ...playwrightConfig.launchOptions,
    ...customLaunchOptions,
    channel: options.channel || playwrightConfig.channel || customLaunchOptions.channel || DEFAULT_PLAYWRIGHT_CHANNEL,
    args
  };

  if (options.headless !== undefined) {
    launchOptions.headless = options.headless;
  }

  return launchOptions;
}

function getSoftwareGPUArguments(backend, platform) {
  if (backend?.startsWith('webgpu')) {
    return platform === 'linux' ? LINUX_WEBGPU_SWIFTSHADER_ARGS : WEBGPU_SWIFTSHADER_ARGS;
  }
  if (backend?.startsWith('webgl')) {
    return ANGLE_SWIFTSHADER_ARGS;
  }
  return platform === 'linux'
    ? [...ANGLE_SWIFTSHADER_ARGS, ...LINUX_WEBGPU_SWIFTSHADER_ARGS]
    : [...ANGLE_SWIFTSHADER_ARGS, ...WEBGPU_SWIFTSHADER_ARGS];
}

function dedupeValues(values) {
  return [...new Set(values.filter(Boolean))];
}
