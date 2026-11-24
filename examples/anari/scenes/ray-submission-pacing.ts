// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GPUCommandGraphSubmissionPacer} from '@luma.gl/graph/gpu-core';

/** Submits the current example frame and releases its fence after the pacer observes it. */
export function submitPacedRayFrame(
  device: Device,
  pacer: GPUCommandGraphSubmissionPacer
): Promise<void> {
  device.submit();
  const fence = device.createFence();
  return pacer.trackSubmission(fence.signaled).finally(() => fence.destroy());
}
