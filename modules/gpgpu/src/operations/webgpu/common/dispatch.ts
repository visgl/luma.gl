// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type WebGPUDispatchLayout = {
  x: number;
  y: number;
  z: number;
};

const WEBGPU_MINIMUM_MAX_COMPUTE_WORKGROUPS_PER_DIMENSION = 65_535;

export function getWebGPUDispatchLayout(
  workgroupCount: number,
  maxWorkgroupsPerDimension?: number
): WebGPUDispatchLayout {
  const maximumWorkgroupsPerDimension = getMaximumWorkgroupsPerDimension(maxWorkgroupsPerDimension);
  const totalWorkgroupCount = Math.max(1, Math.ceil(workgroupCount));
  const x = Math.min(totalWorkgroupCount, maximumWorkgroupsPerDimension);
  const y = Math.min(Math.ceil(totalWorkgroupCount / x), maximumWorkgroupsPerDimension);
  const z = Math.ceil(totalWorkgroupCount / x / y);

  if (z > maximumWorkgroupsPerDimension) {
    throw new Error(
      `WebGPU dispatch requires ${totalWorkgroupCount} workgroups, exceeding the 3D dispatch limit of ${maximumWorkgroupsPerDimension} per dimension`
    );
  }

  return {x, y, z};
}

export function getWebGPUDispatchWorkgroupIndex(
  layout: WebGPUDispatchLayout,
  workgroupId: string = 'workgroupId'
): string {
  return (
    `((${workgroupId}.z * ${layout.y}u + ${workgroupId}.y) * ` + `${layout.x}u + ${workgroupId}.x)`
  );
}

export function getWebGPUDispatchRowIndex(
  layout: WebGPUDispatchLayout,
  workgroupSize: number,
  workgroupId: string = 'workgroupId',
  localId: string = 'localId'
): string {
  return (
    `(${getWebGPUDispatchWorkgroupIndex(layout, workgroupId)} * ` +
    `${workgroupSize}u + ${localId}.x)`
  );
}

function getMaximumWorkgroupsPerDimension(maxWorkgroupsPerDimension?: number): number {
  if (Number.isFinite(maxWorkgroupsPerDimension) && maxWorkgroupsPerDimension! > 0) {
    return Math.floor(maxWorkgroupsPerDimension!);
  }
  return WEBGPU_MINIMUM_MAX_COMPUTE_WORKGROUPS_PER_DIMENSION;
}
