import {Device} from '@luma.gl/core';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';

export type CpuHotspotProfiler = {
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
  defaultSubmitCount?: number;
  defaultSubmitTimeMs?: number;
  queryReadbackSubmitCount?: number;
  queryReadbackSubmitTimeMs?: number;
  statsBookkeepingCalls?: number;
  statsBookkeepingTimeMs?: number;
  errorScopePushCount?: number;
  errorScopePopCount?: number;
  errorScopeTimeMs?: number;
  textureViewReinitializeCount?: number;
  textureViewReinitializeTimeMs?: number;
  transientCanvasResourceCreates?: number;
  transientCanvasTextureCreates?: number;
  transientCanvasTextureViewCreates?: number;
  transientCanvasSamplerCreates?: number;
  transientCanvasFramebufferCreates?: number;
};

type CpuHotspotProfilerApi = {
  enable: () => void;
  disable: () => void;
  reset: () => void;
  report: () => Record<string, Record<string, number>>;
  getRaw: () => Record<string, CpuHotspotProfiler>;
};

type CpuHotspotProfilerTargets = {
  device?: Device;
  presentationDevice?: Device;
  exampleDevice?: Device | null;
};

declare global {
  interface Window {
    lumaCpuHotspotProfiler?: CpuHotspotProfilerApi;
  }
}

// Website-only optional debug tooling. Keep this module isolated so the console hook can be
// removed later without touching store or example rendering logic.
let cpuHotspotProfilerTargets: CpuHotspotProfilerTargets = {};
let isCpuHotspotProfilerEnabled = false;

/** Installs the website-only `window.lumaCpuHotspotProfiler` console helper once. */
export function installCpuHotspotProfilerApi(): void {
  if (typeof window === 'undefined' || window.lumaCpuHotspotProfiler) {
    return;
  }

  window.lumaCpuHotspotProfiler = {
    enable: () => {
      isCpuHotspotProfilerEnabled = true;
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.device, true);
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.presentationDevice, true);
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.exampleDevice, true);
      console.info('Enabled luma CPU hotspot profiler for website devices.');
    },
    disable: () => {
      isCpuHotspotProfilerEnabled = false;
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.device, false);
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.presentationDevice, false);
      setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.exampleDevice, false);
      console.info('Disabled luma CPU hotspot profiler for website devices.');
    },
    reset: () => {
      resetCpuHotspotProfiler(cpuHotspotProfilerTargets.device);
      resetCpuHotspotProfiler(cpuHotspotProfilerTargets.presentationDevice);
      resetCpuHotspotProfiler(cpuHotspotProfilerTargets.exampleDevice);
      console.info('Reset luma CPU hotspot profiler counters.');
    },
    report: () => {
      const summary = {
        exampleDevice: summarizeCpuHotspotProfiler(
          getCpuHotspotProfiler(cpuHotspotProfilerTargets.exampleDevice)
        ),
        device: summarizeCpuHotspotProfiler(getCpuHotspotProfiler(cpuHotspotProfilerTargets.device)),
        presentationDevice: summarizeCpuHotspotProfiler(
          getCpuHotspotProfiler(cpuHotspotProfilerTargets.presentationDevice)
        )
      };
      console.table(summary);
      return summary;
    },
    getRaw: () => ({
      exampleDevice: {...(getCpuHotspotProfiler(cpuHotspotProfilerTargets.exampleDevice) || {})},
      device: {...(getCpuHotspotProfiler(cpuHotspotProfilerTargets.device) || {})},
      presentationDevice: {
        ...(getCpuHotspotProfiler(cpuHotspotProfilerTargets.presentationDevice) || {})
      }
    })
  };
}

/** Updates the shared website devices targeted by the console profiler helper. */
export function updateCpuHotspotProfilerTargets(targets: {
  device?: Device;
  presentationDevice?: Device;
}): void {
  cpuHotspotProfilerTargets = {
    ...cpuHotspotProfilerTargets,
    ...targets
  };

  if (isCpuHotspotProfilerEnabled) {
    setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.device, true);
    setCpuHotspotProfilerEnabled(cpuHotspotProfilerTargets.presentationDevice, true);
  }
}

/** Points the profiler helper at the currently rendered example device. */
export function setActiveCpuHotspotProfilerDevice(device: Device | null): void {
  cpuHotspotProfilerTargets.exampleDevice = device;
  if (isCpuHotspotProfilerEnabled) {
    setCpuHotspotProfilerEnabled(device, true);
  }
}

/** Clears the example device target when that device is torn down. */
export function clearActiveCpuHotspotProfilerDevice(device: Device | null): void {
  if (cpuHotspotProfilerTargets.exampleDevice === device) {
    cpuHotspotProfilerTargets.exampleDevice = null;
  }
}

function getCpuHotspotProfiler(device: Device | undefined | null): CpuHotspotProfiler | null {
  if (!device) {
    return null;
  }

  device.userData[CPU_HOTSPOT_PROFILER_MODULE] ||= {};
  return device.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler;
}

function resetCpuHotspotProfiler(device: Device | undefined | null): void {
  const profiler = getCpuHotspotProfiler(device);
  if (!profiler) {
    return;
  }

  for (const key of Object.keys(profiler) as (keyof CpuHotspotProfiler)[]) {
    delete profiler[key];
  }
}

function setCpuHotspotProfilerEnabled(device: Device | undefined | null, enabled: boolean): void {
  const profiler = getCpuHotspotProfiler(device);
  if (!profiler) {
    return;
  }

  if (enabled) {
    resetCpuHotspotProfiler(device);
    profiler.enabled = true;
  } else {
    profiler.enabled = false;
  }
}

function average(total = 0, count = 0): number {
  return count > 0 ? total / count : 0;
}

function summarizeCpuHotspotProfiler(profiler: CpuHotspotProfiler | null): Record<string, number> {
  if (!profiler) {
    return {};
  }

  const errorScopeCallCount = (profiler.errorScopePushCount || 0) + (profiler.errorScopePopCount || 0);

  return {
    averageFramebufferAcquireTimeMs: average(
      profiler.framebufferAcquireTimeMs,
      profiler.framebufferAcquireCount
    ),
    averageCurrentTextureAcquireTimeMs: average(
      profiler.currentTextureAcquireTimeMs,
      profiler.currentTextureAcquireCount
    ),
    averageRenderPassSetupTimeMs: average(
      profiler.renderPassSetupTimeMs,
      profiler.renderPassSetupCount
    ),
    averageRenderPassDescriptorAssemblyTimeMs: average(
      profiler.renderPassDescriptorAssemblyTimeMs,
      profiler.renderPassDescriptorAssemblyCount
    ),
    averageRenderPassBeginTimeMs: average(
      profiler.renderPassBeginTimeMs,
      profiler.renderPassBeginCount
    ),
    averageTextureViewReinitializeTimeMs: average(
      profiler.textureViewReinitializeTimeMs,
      profiler.textureViewReinitializeCount
    ),
    averageSubmitTimeMs: average(profiler.submitTimeMs, profiler.submitCount),
    averageQueueSubmitTimeMs: average(profiler.queueSubmitTimeMs, profiler.queueSubmitCount),
    averageSubmitResolveKickoffTimeMs: average(
      profiler.submitResolveKickoffTimeMs,
      profiler.submitResolveKickoffCount
    ),
    averageCommandBufferDestroyTimeMs: average(
      profiler.commandBufferDestroyTimeMs,
      profiler.commandBufferDestroyCount
    ),
    averageDefaultSubmitTimeMs: average(profiler.defaultSubmitTimeMs, profiler.defaultSubmitCount),
    averageQueryReadbackSubmitTimeMs: average(
      profiler.queryReadbackSubmitTimeMs,
      profiler.queryReadbackSubmitCount
    ),
    averageStatsBookkeepingTimeMs: average(
      profiler.statsBookkeepingTimeMs,
      profiler.statsBookkeepingCalls
    ),
    averageErrorScopeTimeMs: average(profiler.errorScopeTimeMs, errorScopeCallCount),
    framebufferAcquireCount: profiler.framebufferAcquireCount || 0,
    currentTextureAcquireCount: profiler.currentTextureAcquireCount || 0,
    submitCount: profiler.submitCount || 0,
    queueSubmitCount: profiler.queueSubmitCount || 0,
    submitResolveKickoffCount: profiler.submitResolveKickoffCount || 0,
    commandBufferDestroyCount: profiler.commandBufferDestroyCount || 0,
    defaultSubmitCount: profiler.defaultSubmitCount || 0,
    queryReadbackSubmitCount: profiler.queryReadbackSubmitCount || 0,
    defaultFramebufferRenderPassCount: profiler.defaultFramebufferRenderPassCount || 0,
    explicitFramebufferRenderPassCount: profiler.explicitFramebufferRenderPassCount || 0,
    renderPassDescriptorAssemblyCount: profiler.renderPassDescriptorAssemblyCount || 0,
    renderPassBeginCount: profiler.renderPassBeginCount || 0,
    textureViewReinitializeCount: profiler.textureViewReinitializeCount || 0,
    transientCanvasResourceCreates: profiler.transientCanvasResourceCreates || 0,
    transientCanvasTextureCreates: profiler.transientCanvasTextureCreates || 0,
    transientCanvasTextureViewCreates: profiler.transientCanvasTextureViewCreates || 0,
    transientCanvasSamplerCreates: profiler.transientCanvasSamplerCreates || 0,
    transientCanvasFramebufferCreates: profiler.transientCanvasFramebufferCreates || 0
  };
}
