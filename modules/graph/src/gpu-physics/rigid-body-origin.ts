// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/gpgpu';

/** Translate persistent world-space points; local anchors and directions are unchanged. */
export function shiftRigidBodyBuffers(
  device: Device,
  id: string,
  buffers: readonly Buffer[],
  bodyCount: number,
  colliderCount: number,
  maximumPairs: number,
  eventCapacity: number,
  shift: readonly [number, number, number]
): void {
  const plans = [
    {name: 'positions', count: bodyCount, stride: 1, offset: 0, contacts: false},
    {name: 'targets', count: bodyCount, stride: 2, offset: 0, contacts: false},
    {name: 'manifolds', count: maximumPairs * 4, stride: 0, offset: 0, contacts: true},
    {name: 'trigger-previous', count: colliderCount, stride: 1, offset: 0, contacts: false},
    {name: 'contact-events', count: eventCapacity, stride: 4, offset: 3, contacts: false}
  ];
  // CCD previous poses and rollback snapshots are overwritten before their next use.
  const computations: Computation[] = [];
  const settings = device.createBuffer({
    data: new Float32Array([...shift, 0]),
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  try {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    for (const plan of plans) {
      const buffer = buffers.find(candidate => candidate.id === `${id}-${plan.name}`);
      if (!buffer || !plan.count) continue;
      const horizontal = Math.min(
        Math.ceil(plan.count / 64),
        device.limits.maxComputeWorkgroupsPerDimension
      );
      const computation = new Computation(device, {
        source: /* wgsl */ `
@group(0) @binding(0) var<storage,read_write> values:array<vec4f>;
@group(0) @binding(1) var<uniform> shift:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u) {
 let index=invocation.x+invocation.y*${horizontal * 64}u;
 if(index>=${plan.count}u){return;}
 let address=${plan.contacts ? '(index/4u)*26u+(index%4u)*6u' : `${plan.offset}u+index*${plan.stride}u`};
 values[address]=vec4f(values[address].xyz-shift.xyz,values[address].w);
}`,
        shaderLayout: {
          bindings: [
            {name: 'values', group: 0, location: 0, type: 'storage'},
            {name: 'shift', group: 0, location: 1, type: 'uniform'}
          ]
        },
        bindings: {values: buffer, shift: settings}
      });
      computations.push(computation);
      computation.dispatch(pass, horizontal, Math.ceil(plan.count / (horizontal * 64)));
    }
    pass.end();
    device.submit(encoder.finish());
  } finally {
    for (const computation of computations) computation.destroy();
    settings.destroy();
  }
}
