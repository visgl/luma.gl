// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/gpgpu';

/** One template-sized GPU reset image; no per-instance snapshots or pose readback. */
export function makeEnsembleReset(
  device: Device,
  id: string,
  buffers: readonly Buffer[],
  bodyCount: number,
  bodiesPerInstance: number,
  collidersPerInstance: number,
  maximumPairs: number
) {
  const find = (name: string) => buffers.find(buffer => buffer.id === `${id}-${name}`)!;
  const plans = [
    ...['positions', 'orientations', 'velocities', 'angular-velocities', 'sleep'].map(name => ({
      name,
      offset: 0,
      size: bodiesPerInstance * 16
    })),
    {name: 'targets', offset: 0, size: bodiesPerInstance * 32},
    {name: 'bodies', offset: 0, size: bodiesPerInstance * 48},
    {name: 'bodies', offset: bodyCount * 48, size: collidersPerInstance * 96},
    {name: 'object-attributes', offset: 0, size: collidersPerInstance * 4},
    {name: 'pose-metadata', offset: 0, size: bodiesPerInstance * 48}
  ].filter(plan => find(plan.name));
  const snapshots: Buffer[] = [];
  const settings = device.createBuffer({byteLength: 32, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  let computation: Computation | undefined;
  try {
    const encoder = device.createCommandEncoder();
    for (const plan of plans) {
      const snapshot = device.createBuffer({
        byteLength: plan.size,
        usage: Buffer.COPY_SRC | Buffer.COPY_DST
      });
      snapshots.push(snapshot);
      encoder.copyBufferToBuffer({
        sourceBuffer: find(plan.name),
        sourceOffset: plan.offset,
        destinationBuffer: snapshot,
        size: plan.size
      });
    }
    device.submit(encoder.finish());
    const history = find('contact-history');
    computation = new Computation(device, {
      source: /* wgsl */ `
@group(0) @binding(0) var<uniform> settings:Settings;
struct Settings {selection:vec4u, shift:vec4f}
@group(0) @binding(6) var<storage,read_write> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read_write> metadata:array<u32>;
@group(0) @binding(2) var<storage,read_write> attributes:array<u32>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<u32>;
@group(0) @binding(4) var<storage,read_write> targets:array<u32>;
${history ? '@group(0) @binding(5) var<storage,read_write> history:array<u32>;' : ''}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;let selection=settings.selection;
 if(index==0u){targets[${bodyCount * 8 + 8 + maximumPairs * 2}u+selection.x/${bodiesPerInstance}u]=0u;}
 if(index<${bodiesPerInstance}u){
  let body=selection.x+index;positions[body]=vec4f(positions[body].xyz-settings.shift.xyz,positions[body].w);
  for(var axis=0u;axis<3u;axis++){let address=body*8u+axis;targets[address]=bitcast<u32>(bitcast<f32>(targets[address])-settings.shift[axis]);}
 }
 if(index<${collidersPerInstance}u){
  let collider=selection.y+index;let address=${bodyCount * 12}u+collider*24u+7u;
  metadata[address]=bitcast<u32>(bitcast<f32>(metadata[address])+f32(selection.x));
  attributes[collider]=(attributes[collider]&0xffff0000u)|((attributes[collider]&0xffffu)+selection.x);
 }
 if(index>=${maximumPairs}u){return;}
 let key=targets[${bodyCount * 8 + 8}u+index*2u];
 if(key==0u||key==0xffffffffu){return;}
 let address=index*104u;let collider=manifolds[address+97u];
 if(collider<selection.y||collider>=selection.y+${collidersPerInstance}u){return;}
 for(var word=0u;word<104u;word++){manifolds[address+word]=0u;}
 targets[${bodyCount * 8 + 8}u+index*2u]=0xffffffffu;
 targets[${bodyCount * 8 + 9}u+index*2u]=0u;
 ${history ? 'for(var word=0u;word<4u;word++){history[index*4u+word]=0u;}' : ''}
}`,
      shaderLayout: {
        bindings: [
          {name: 'settings', group: 0, location: 0, type: 'uniform'},
          {name: 'positions', group: 0, location: 6, type: 'storage'},
          ...[
            'metadata',
            'attributes',
            'manifolds',
            'targets',
            ...(history ? ['history'] : [])
          ].map((name, index) => ({name, group: 0, location: index + 1, type: 'storage' as const}))
        ]
      },
      bindings: {
        settings,
        positions: find('positions'),
        metadata: find('bodies'),
        attributes: find('object-attributes'),
        manifolds: find('manifolds'),
        targets: find('targets'),
        ...(history ? {history} : {})
      }
    });
  } catch (error) {
    for (const snapshot of snapshots) snapshot.destroy();
    settings.destroy();
    computation?.destroy();
    throw error;
  }
  return {
    byteLength: snapshots.reduce((total, buffer) => total + buffer.byteLength, settings.byteLength),
    reset(instance: number, shift: readonly number[]) {
      const data = new ArrayBuffer(32);
      new Uint32Array(data).set([instance * bodiesPerInstance, instance * collidersPerInstance]);
      new Float32Array(data).set(shift, 4);
      settings.write(new Uint8Array(data));
      const encoder = device.createCommandEncoder();
      for (const [index, plan] of plans.entries())
        encoder.copyBufferToBuffer({
          sourceBuffer: snapshots[index],
          destinationBuffer: find(plan.name),
          destinationOffset: plan.offset + instance * plan.size,
          size: plan.size
        });
      const pass = encoder.beginComputePass();
      computation!.dispatch(
        pass,
        Math.ceil(Math.max(maximumPairs, collidersPerInstance, bodiesPerInstance) / 64)
      );
      pass.end();
      device.submit(encoder.finish());
    },
    destroy() {
      computation!.destroy();
      settings.destroy();
      for (const snapshot of snapshots) snapshot.destroy();
    }
  };
}
