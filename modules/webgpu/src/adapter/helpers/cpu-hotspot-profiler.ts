/**
 * Internal WebGPU CPU hotspot profiler helpers.
 *
 * Keep the profiler key and accessors localized here so the adapter-level
 * instrumentation can be reduced or removed without touching every call site.
 */
export const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';
export const CPU_HOTSPOT_SUBMIT_REASON = 'cpu-hotspot-submit-reason';

export type CpuHotspotProfiler = {
  enabled?: boolean;
  framebufferAcquireCount?: number;
  framebufferAcquireTimeMs?: number;
  currentTextureAcquireCount?: number;
  currentTextureAcquireTimeMs?: number;
  activeDefaultFramebufferAcquireDepth?: number;
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
  errorScopePushCount?: number;
  errorScopePopCount?: number;
  errorScopeTimeMs?: number;
  textureViewReinitializeCount?: number;
  textureViewReinitializeTimeMs?: number;
};

type UserDataOwner = {
  userData: Record<string, unknown>;
};

/** Returns the enabled profiler payload attached to a WebGPU userData owner. */
export function getCpuHotspotProfiler(owner: UserDataOwner): CpuHotspotProfiler | null {
  const profiler = owner.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler | undefined;
  return profiler?.enabled ? profiler : null;
}

/** Returns the optional submit reason tag used to split submit timing buckets. */
export function getCpuHotspotSubmitReason(owner: UserDataOwner): string | null {
  return (owner.userData[CPU_HOTSPOT_SUBMIT_REASON] as string | undefined) || null;
}

/** Updates the optional submit reason tag used by the profiler. */
export function setCpuHotspotSubmitReason(
  owner: UserDataOwner,
  submitReason: string | undefined
): void {
  owner.userData[CPU_HOTSPOT_SUBMIT_REASON] = submitReason;
}

/** Shared timestamp helper for low-overhead CPU-side instrumentation. */
export function getTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}
