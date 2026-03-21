// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Device, RenderPassProps} from '@luma.gl/core';
import {luma} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';
const WARMUP_FRAME_COUNT = 2;
const MEASURED_FRAME_COUNT = 20;

type CpuHotspotProfiler = {
  enabled?: boolean;
  framebufferAcquireCount?: number;
  framebufferAcquireTimeMs?: number;
  currentTextureAcquireCount?: number;
  currentTextureAcquireTimeMs?: number;
  defaultFramebufferRenderPassCount?: number;
  explicitFramebufferRenderPassCount?: number;
  renderPassSetupCount?: number;
  renderPassSetupTimeMs?: number;
  renderPassDescriptorAssemblyCount?: number;
  renderPassDescriptorAssemblyTimeMs?: number;
  renderPassBeginCount?: number;
  renderPassBeginTimeMs?: number;
  submitCount?: number;
  submitTimeMs?: number;
  queueSubmitCount?: number;
  queueSubmitTimeMs?: number;
  submitResolveKickoffCount?: number;
  submitResolveKickoffTimeMs?: number;
  commandBufferDestroyCount?: number;
  commandBufferDestroyTimeMs?: number;
  errorScopePushCount?: number;
  errorScopePopCount?: number;
  errorScopeTimeMs?: number;
  statsBookkeepingCalls?: number;
  statsBookkeepingTimeMs?: number;
  transientCanvasResourceCreates?: number;
  transientCanvasTextureCreates?: number;
  transientCanvasTextureViewCreates?: number;
  textureViewReinitializeCount?: number;
  textureViewReinitializeTimeMs?: number;
  transientCanvasSamplerCreates?: number;
  transientCanvasFramebufferCreates?: number;
};

type BenchmarkSummary = {
  averageFrameTimeMs: number;
  profiler: CpuHotspotProfiler;
};

test('WebGPU CPU hotspot benchmark distinguishes default canvas and explicit framebuffer paths', async t => {
  const webglDevice = await getWebGLTestDevice();
  const webgpuDevice = await getWebGPUTestDevice();

  const webglDefaultSummary = measureScenario(webglDevice, () => renderEmptyFrame(webglDevice, {}));
  t.comment(formatSummary('webgl default canvas', webglDefaultSummary));

  if (!webgpuDevice) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const webgpuDefaultSummary = measureScenario(webgpuDevice, () =>
    renderEmptyFrame(webgpuDevice, {})
  );

  const explicitFramebuffer = webgpuDevice.createFramebuffer({
    width: 1,
    height: 1,
    colorAttachments: ['rgba8unorm']
  });
  const webgpuExplicitSummary = measureScenario(webgpuDevice, () =>
    renderEmptyFrame(webgpuDevice, {framebuffer: explicitFramebuffer})
  );

  t.comment(formatSummary('webgpu default canvas', webgpuDefaultSummary));
  t.comment(formatSummary('webgpu explicit framebuffer', webgpuExplicitSummary));

  t.equal(
    webgpuDefaultSummary.profiler.defaultFramebufferRenderPassCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records default-framebuffer render passes'
  );
  t.equal(
    webgpuDefaultSummary.profiler.explicitFramebufferRenderPassCount || 0,
    0,
    'webgpu default canvas path does not record explicit-framebuffer render passes'
  );
  t.equal(
    webgpuDefaultSummary.profiler.framebufferAcquireCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records framebuffer acquisition per frame'
  );
  t.equal(
    webgpuDefaultSummary.profiler.currentTextureAcquireCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records GPUCanvasContext.getCurrentTexture() per frame'
  );
  t.equal(
    webgpuDefaultSummary.profiler.transientCanvasTextureCreates || 0,
    0,
    'webgpu default canvas path reuses the cached swapchain texture wrapper after warmup'
  );
  t.equal(
    webgpuDefaultSummary.profiler.transientCanvasTextureViewCreates || 0,
    0,
    'webgpu default canvas path reuses the cached texture view wrapper after warmup'
  );
  t.equal(
    webgpuDefaultSummary.profiler.transientCanvasSamplerCreates || 0,
    0,
    'webgpu default canvas path does not allocate transient sampler wrappers after warmup'
  );
  t.equal(
    webgpuDefaultSummary.profiler.transientCanvasFramebufferCreates || 0,
    0,
    'webgpu default canvas path reuses the cached framebuffer wrapper after warmup'
  );

  t.equal(
    webgpuExplicitSummary.profiler.defaultFramebufferRenderPassCount || 0,
    0,
    'webgpu explicit framebuffer path does not record default-framebuffer render passes'
  );
  t.equal(
    webgpuExplicitSummary.profiler.explicitFramebufferRenderPassCount,
    MEASURED_FRAME_COUNT,
    'webgpu explicit framebuffer path records explicit-framebuffer render passes'
  );
  t.equal(
    webgpuExplicitSummary.profiler.framebufferAcquireCount || 0,
    0,
    'webgpu explicit framebuffer path bypasses default framebuffer acquisition'
  );
  t.equal(
    webgpuExplicitSummary.profiler.currentTextureAcquireCount || 0,
    0,
    'webgpu explicit framebuffer path bypasses current texture acquisition'
  );
  t.equal(
    webgpuExplicitSummary.profiler.transientCanvasResourceCreates || 0,
    0,
    'webgpu explicit framebuffer path does not create transient default-canvas wrappers'
  );
  t.equal(
    webgpuDefaultSummary.profiler.textureViewReinitializeCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records texture view reinitialization per frame after warmup'
  );
  t.equal(
    webgpuDefaultSummary.profiler.renderPassDescriptorAssemblyCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records render-pass descriptor assembly per frame'
  );
  t.equal(
    webgpuDefaultSummary.profiler.renderPassBeginCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records beginRenderPass timing per frame'
  );

  t.ok(
    (webgpuDefaultSummary.profiler.statsBookkeepingTimeMs || 0) >= 0,
    'webgpu default canvas path records stats bookkeeping time'
  );
  t.ok(
    (webgpuDefaultSummary.profiler.errorScopeTimeMs || 0) >= 0,
    'webgpu default canvas path records error-scope overhead'
  );
  t.ok(
    webgpuDefaultSummary.averageFrameTimeMs >= 0 && webgpuExplicitSummary.averageFrameTimeMs >= 0,
    'benchmark reports average CPU frame time for both WebGPU paths'
  );
  t.equal(
    webgpuDefaultSummary.profiler.queueSubmitCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records queue.submit timing per frame'
  );
  t.equal(
    webgpuDefaultSummary.profiler.commandBufferDestroyCount,
    MEASURED_FRAME_COUNT,
    'webgpu default canvas path records command buffer destroy timing per frame'
  );

  explicitFramebuffer.destroy();
  t.end();
});

test('WebGPU error-scope profiler only records scoped validation in debug mode', async t => {
  const debugDevice = await getWebGPUTestDevice();
  const nonDebugDevice = await makeWebGPUHotspotTestDevice('webgpu-hotspot-nondebug', false);

  if (!debugDevice || !nonDebugDevice) {
    t.comment('WebGPU is not available');
    nonDebugDevice?.destroy();
    t.end();
    return;
  }

  const debugSummary = measureScenario(debugDevice, () => renderEmptyFrame(debugDevice, {}));
  const nonDebugSummary = measureScenario(nonDebugDevice, () =>
    renderEmptyFrame(nonDebugDevice, {})
  );

  t.ok(
    (debugSummary.profiler.errorScopePushCount || 0) > 0,
    'webgpu debug device records pushErrorScope calls'
  );
  t.ok(
    (debugSummary.profiler.errorScopePopCount || 0) > 0,
    'webgpu debug device records popErrorScope calls'
  );
  t.ok(
    (debugSummary.profiler.errorScopeTimeMs || 0) >= 0,
    'webgpu debug device records scoped validation time'
  );

  t.equal(
    nonDebugSummary.profiler.errorScopePushCount || 0,
    0,
    'webgpu non-debug device does not record pushErrorScope calls'
  );
  t.equal(
    nonDebugSummary.profiler.errorScopePopCount || 0,
    0,
    'webgpu non-debug device does not record popErrorScope calls'
  );
  t.equal(
    nonDebugSummary.profiler.errorScopeTimeMs || 0,
    0,
    'webgpu non-debug device does not record scoped validation time'
  );

  nonDebugDevice.destroy();
  t.end();
});

function measureScenario(device: Device, renderFrame: () => void): BenchmarkSummary {
  for (let frameIndex = 0; frameIndex < WARMUP_FRAME_COUNT; frameIndex++) {
    renderFrame();
  }

  resetProfiler(device);
  const startTime = getTimestamp();
  for (let frameIndex = 0; frameIndex < MEASURED_FRAME_COUNT; frameIndex++) {
    renderFrame();
  }
  const totalTimeMs = getTimestamp() - startTime;

  const profiler = {...getProfiler(device)};
  profiler.enabled = false;

  return {
    averageFrameTimeMs: totalTimeMs / MEASURED_FRAME_COUNT,
    profiler
  };
}

function renderEmptyFrame(device: Device, renderPassProps: Partial<RenderPassProps>): void {
  const renderPass = device.beginRenderPass({
    clearColor: [0, 0, 0, 0],
    ...renderPassProps
  });
  renderPass.end();
  device.submit();
}

function resetProfiler(device: Device): void {
  const profiler = getProfiler(device);
  for (const key of Object.keys(profiler)) {
    delete profiler[key as keyof CpuHotspotProfiler];
  }
  profiler.enabled = true;
}

function getProfiler(device: Device): CpuHotspotProfiler {
  device.userData[CPU_HOTSPOT_PROFILER_MODULE] ||= {};
  return device.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler;
}

function formatSummary(name: string, summary: BenchmarkSummary): string {
  const {profiler} = summary;
  return [
    name,
    `avgFrame=${summary.averageFrameTimeMs.toFixed(3)}ms`,
    `acquire=${average(profiler.framebufferAcquireTimeMs, profiler.framebufferAcquireCount).toFixed(
      3
    )}ms`,
    `renderPass=${average(profiler.renderPassSetupTimeMs, profiler.renderPassSetupCount).toFixed(
      3
    )}ms`,
    `submit=${average(profiler.submitTimeMs, profiler.submitCount).toFixed(3)}ms`,
    `queueSubmit=${average(profiler.queueSubmitTimeMs, profiler.queueSubmitCount).toFixed(3)}ms`,
    `submitResolve=${average(
      profiler.submitResolveKickoffTimeMs,
      profiler.submitResolveKickoffCount
    ).toFixed(3)}ms`,
    `commandBufferDestroy=${average(
      profiler.commandBufferDestroyTimeMs,
      profiler.commandBufferDestroyCount
    ).toFixed(3)}ms`,
    `stats=${average(profiler.statsBookkeepingTimeMs, profiler.statsBookkeepingCalls).toFixed(
      3
    )}ms`,
    `errorScopes=${averageErrorScopeTime(profiler).toFixed(3)}ms`,
    `transient=${profiler.transientCanvasResourceCreates || 0}`
  ].join(' ');
}

function average(total = 0, count = 0): number {
  return count > 0 ? total / count : 0;
}

function averageErrorScopeTime(profiler: CpuHotspotProfiler): number {
  const totalScopeCalls = (profiler.errorScopePushCount || 0) + (profiler.errorScopePopCount || 0);
  return average(profiler.errorScopeTimeMs, totalScopeCalls);
}

function getTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

async function makeWebGPUHotspotTestDevice(
  id: string,
  debug: boolean
): Promise<WebGPUDevice | null> {
  try {
    return (await luma.createDevice({
      id,
      type: 'webgpu',
      adapters: [webgpuAdapter],
      createCanvasContext: {width: 1, height: 1},
      debug
    })) as WebGPUDevice;
  } catch {
    return null;
  }
}
