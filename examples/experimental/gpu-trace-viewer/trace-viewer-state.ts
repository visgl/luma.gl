// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Owns cancellation identity for asynchronous dataset generation and upload work. */
export class TraceGenerationState {
  private generation = 0;
  private finalized = false;

  get current(): number {
    return this.generation;
  }

  begin(): number {
    this.generation++;
    return this.generation;
  }

  finalize(): void {
    this.finalized = true;
    this.generation++;
  }

  isCurrent(generation: number): boolean {
    return !this.finalized && generation === this.generation;
  }
}

/** Returns true only when a frame can publish new GPU output. */
export function shouldRenderTraceFrame(options: {
  gpuFrameInFlight: boolean;
  renderSignature: string;
  lastRenderSignature: string;
}): boolean {
  return !options.gpuFrameInFlight && options.renderSignature !== options.lastRenderSignature;
}

export type TraceViewerURLPreset = {
  spanCapacity?: number;
  dependencyCapacity?: number;
};

function getSupportedCapacity(
  value: string | null,
  supportedCapacities: readonly number[]
): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }
  const capacity = Number(value);
  return Number.isSafeInteger(capacity) && supportedCapacities.includes(capacity)
    ? capacity
    : undefined;
}

/** Reads a device-qualified dataset preset from an example URL. */
export function getTraceViewerURLPreset(
  search: string,
  spanCapacities: readonly number[],
  dependencyCapacities: readonly number[]
): TraceViewerURLPreset {
  const parameters = new URLSearchParams(search);
  return {
    spanCapacity: getSupportedCapacity(parameters.get('spans'), spanCapacities),
    dependencyCapacity: getSupportedCapacity(parameters.get('dependencies'), dependencyCapacities)
  };
}

/** Keeps full-page trace settings shareable without changing embedded documentation URLs. */
export function updateTraceViewerURLPreset(
  locationLike: Pick<Location, 'pathname' | 'search' | 'hash'>,
  historyLike: Pick<History, 'replaceState'>,
  preset: Required<TraceViewerURLPreset>
): void {
  if (!locationLike.pathname.includes('/examples/experimental/gpu-trace-viewer')) {
    return;
  }
  const parameters = new URLSearchParams(locationLike.search);
  parameters.set('spans', String(preset.spanCapacity));
  parameters.set('dependencies', String(preset.dependencyCapacity));
  historyLike.replaceState(
    null,
    '',
    `${locationLike.pathname}?${parameters.toString()}${locationLike.hash}`
  );
}
