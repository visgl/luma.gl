// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from './device';

/** A single use of a device. Release is valid even while initialization is pending. */
export interface DeviceLease {
  /** Resolves to the shared device once initialization succeeds. */
  readonly device: Promise<Device>;
  /** Ends this acquisition. Repeated calls have no effect. */
  release(): void;
}

// Backend and API entry points can be bundled independently. Keep the acquisition
// capability on the device so both entry points see the same registration.
const ACQUIRE = Symbol.for('luma.gl.device.acquire');
type ManagedDevice = Device & {[ACQUIRE]?: () => DeviceLease};

/** Acquires a managed device or borrows an externally managed raw device. */
export function acquireDevice(device: Device): DeviceLease {
  if (device.isLost) {
    throw new Error('Cannot acquire a lost device');
  }
  return (device as ManagedDevice)[ACQUIRE]?.() ?? {device: Promise.resolve(device), release() {}};
}

/** @internal Reject direct destruction while a device is managed by its owner. */
export function assertDeviceCanBeDestroyed(device: Device): void {
  if ((device as ManagedDevice)[ACQUIRE]) {
    throw new Error('Managed device: release your lease or dispose its owner');
  }
}

/** Owns one device generation. Share the owner across remounts of the same canvas. */
export class DeviceOwner {
  private pending?: Promise<Device>;
  private device?: Device;
  private uses = 0;
  private disposed = false;

  /** @internal Construct through luma.createDeviceOwner(). */
  constructor(private readonly create: () => Promise<Device>) {}

  /** Reserves a use synchronously and shares in-flight initialization. */
  acquire(): DeviceLease {
    if (this.disposed) {
      throw new Error('Device owner has been disposed');
    }
    this.uses++;
    this.pending ??= Promise.resolve()
      .then(this.create)
      .then(
        device => {
          this.device = device;
          (device as ManagedDevice)[ACQUIRE] = () => this.acquire();
          this.finishDisposal();
          return device;
        },
        error => {
          this.pending = undefined;
          this.uses = 0;
          throw error;
        }
      );
    const generation = this.pending;
    let released = false;
    return {
      device: this.pending,
      release: () => {
        if (!released && generation === this.pending) {
          released = true;
          this.uses--;
          this.finishDisposal();
        }
      }
    };
  }

  /** Permanently closes acquisition and destroys the device after its final release. */
  dispose(): void {
    this.disposed = true;
    this.finishDisposal();
  }

  private finishDisposal(): void {
    if (this.disposed && this.uses === 0 && this.device) {
      const device = this.device;
      this.device = undefined;
      this.pending = undefined;
      delete (device as ManagedDevice)[ACQUIRE];
      device.destroy();
    }
  }
}
