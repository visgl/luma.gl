// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

/** Bound queued simulation batches without copying unused body state back to the CPU. */
export async function waitForSubmittedPhysicsWork(device: Device): Promise<void> {
  const fence = device.createFence();
  try {
    await fence.signaled;
  } finally {
    fence.destroy();
  }
}
