// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WebGPUDeviceFeatureLevel, WebGPUFeatureLevel} from './device';

/** Identifies the stage at which GPU device creation failed. */
export type DeviceCreationPhase =
  | 'adapter-selection'
  | 'adapter-request'
  | 'device-request'
  | 'wrapper-initialization'
  | 'canvas-initialization';

/** One attempted backend/profile during device creation. */
export type DeviceCreationAttempt = {
  backend: 'webgpu' | 'webgl' | 'null' | 'unknown';
  featureLevel?: WebGPUFeatureLevel;
  software: boolean;
  phase: DeviceCreationPhase;
  error: Error;
};

/** Diagnostics retained on a successfully created device. */
export type DeviceCreationInfo = {
  requestedType: string;
  selected: {
    backend: DeviceCreationAttempt['backend'];
    featureLevel?: WebGPUDeviceFeatureLevel;
    software: boolean;
  } | null;
  attempts: readonly DeviceCreationAttempt[];
};

/** Error thrown after one or more device creation attempts fail. */
export class DeviceCreationError extends Error {
  readonly attempts: readonly DeviceCreationAttempt[];
  readonly phase: DeviceCreationPhase;

  constructor(
    message: string,
    attempts: readonly DeviceCreationAttempt[],
    cause: unknown = attempts[attempts.length - 1]?.error
  ) {
    super(message, {cause});
    this.name = 'DeviceCreationError';
    this.attempts = attempts;
    this.phase = attempts[attempts.length - 1]?.phase || 'wrapper-initialization';
  }
}

/** Wraps an adapter-specific failure without losing an existing structured error. */
export function wrapDeviceCreationError(
  error: unknown,
  attempt: Omit<DeviceCreationAttempt, 'error'>,
  message: string
): DeviceCreationError {
  if (error instanceof DeviceCreationError) {
    return error;
  }
  const cause = error instanceof Error ? error : new Error(String(error));
  return new DeviceCreationError(message, [{...attempt, error: cause}], cause);
}
