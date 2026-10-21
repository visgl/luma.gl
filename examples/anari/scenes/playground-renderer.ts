// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ANARIDevice, ANARIFrame, ANARIRendererSubtype} from '@luma.gl/anari';
import {getRayTracingQualityPreset, type RayTracingQualityPreset} from '@luma.gl/experimental';
import {ANARIRendererSchema} from '@luma.gl/anari/schemas';
import type {JSONRendererDeclaration} from './playground-scene';

export function makePlaygroundRenderer(
  renderer: JSONRendererDeclaration | undefined,
  subtype: ANARIRendererSubtype
): JSONRendererDeclaration {
  const schema = ANARIRendererSchema.options.find(
    option => option.shape['@@type'].value === subtype
  );
  if (!schema) throw new Error(`Unknown renderer: ${subtype}`);
  return schema.strip().parse({...renderer, '@@type': subtype});
}

export function getPlaygroundRendererSubtype(
  renderer: JSONRendererDeclaration | undefined,
  webgpuAvailable: boolean
): ANARIRendererSubtype {
  const subtype = renderer?.['@@type'] ?? 'default';
  if (!webgpuAvailable && (subtype === 'raytrace' || subtype === 'deferred')) {
    throw new Error(`${subtype} rendering requires WebGPU. Choose a supported renderer.`);
  }
  return subtype;
}

/** Adjust quality without replacing the world, camera, frame, or retained placements. */
export function applyPlaygroundQualityPreset(
  device: ANARIDevice,
  frame: ANARIFrame,
  preset: RayTracingQualityPreset
): void {
  const settings = getRayTracingQualityPreset(preset);
  const renderer = frame.getParameter('renderer');
  if (renderer?.subtype === 'raytrace') {
    renderer.setParameters(settings).commitParameters();
  } else {
    // Release the previous runtime's per-frame targets while preserving the retained frame.
    device.destroyFrame(frame);
    frame
      .setParameter(
        'renderer',
        device.newRenderer('raytrace', {...renderer?.getParameters(), ...settings})
      )
      .commitParameters();
  }
}
