// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';

/** The event stream position and step represented by a recovered overlap snapshot. */
export type GPURigidBodyEventSnapshot = {
  /** Resume delta reads after this sequence. */
  sequence: number;
  /** Most recent step published by this ring. */
  step: number;
  /** Saturated counters require reconstructing the world to resume the stream. */
  saturated: boolean;
};

/** A pair present in the contact publisher's current history. */
export type GPURigidBodyActiveContact = {
  bodies: [number, number];
  colliders: [number, number];
};

/** Contact stream recovery point and its complete active pair set. */
export type GPURigidBodyContactSnapshot = GPURigidBodyEventSnapshot & {
  contacts: GPURigidBodyActiveContact[];
};

/** An active target with its current representative sensor/target collider pair. */
export type GPURigidBodyActiveTrigger = {
  trigger: number;
  body: number;
  collider: number;
  triggerCollider: number;
};

/** Trigger stream recovery point and its complete active overlap set. */
export type GPURigidBodyTriggerSnapshot = GPURigidBodyEventSnapshot & {
  overlaps: GPURigidBodyActiveTrigger[];
};

/** Copy the ring header and published history in queue order as one coherent readback. */
export async function readRigidBodyEventSnapshot<Result extends GPURigidBodyEventSnapshot>(
  device: Device,
  ring: Buffer,
  history: Buffer,
  decode: (snapshot: GPURigidBodyEventSnapshot, rows: Uint32Array) => Result
): Promise<Result> {
  /** The snapshot omits retained event payloads and never reads poses or manifolds. */
  const staging = device.createBuffer({
    id: `${ring.id}-snapshot`,
    byteLength: 16 + history.byteLength,
    usage: Buffer.MAP_READ | Buffer.COPY_DST
  });
  try {
    /** All prior submissions complete before both copies; later submissions cannot interleave. */
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer({sourceBuffer: ring, destinationBuffer: staging, size: 16});
    encoder.copyBufferToBuffer({
      sourceBuffer: history,
      destinationBuffer: staging,
      destinationOffset: 16,
      size: history.byteLength
    });
    device.submit(encoder.finish());
    return await staging.mapAndReadAsync(buffer => {
      /** The mapped bytes are consumed synchronously before the staging buffer is unmapped. */
      const words = new Uint32Array(buffer);
      return decode(
        {sequence: words[0], step: words[1], saturated: words[2] !== 0},
        words.subarray(4)
      );
    });
  } finally {
    staging.destroy();
  }
}
