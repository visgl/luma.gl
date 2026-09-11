// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUValueArena, GPUValueFormat} from './gpu-value-arena';

export type GPUValueArenaSlotInfo={id:string;format:GPUValueFormat;byteOffset:number;wordOffset:number};
export type GPUValueArenaInfo={id:string;bufferId:string;usedByteLength:number;capacityByteLength:number;availableByteLength:number;utilization:number;slotCount:number;slots:readonly GPUValueArenaSlotInfo[]};

/** Returns a stable, serializable description of graph-resident small-value state for inspectors/traces. */
export function inspectGPUValueArena(arena:GPUValueArena):GPUValueArenaInfo{
  const slots=arena.getSlots().map(slot=>Object.freeze({id:slot.id,format:slot.format,byteOffset:slot.byteOffset,wordOffset:slot.byteOffset>>>2}));
  return Object.freeze({id:arena.id,bufferId:arena.buffer.id,usedByteLength:arena.byteLength,capacityByteLength:arena.capacityByteLength,availableByteLength:arena.availableByteLength,utilization:arena.byteLength/arena.capacityByteLength,slotCount:arena.size,slots:Object.freeze(slots)});
}

/** Human-readable layout useful in graph diagnostics and bug reports. */
export function formatGPUValueArenaLayout(info:GPUValueArenaInfo):string{
  const header=`${info.id}: ${info.slotCount} values, ${info.usedByteLength}/${info.capacityByteLength} bytes (${(info.utilization*100).toFixed(1)}%)`;
  return [header,...info.slots.map(slot=>`  ${slot.id} ${slot.format} @ ${slot.byteOffset}`)].join('\n');
}
