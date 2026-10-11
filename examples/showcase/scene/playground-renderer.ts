// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ANARIRendererSubtype} from '@luma.gl/scene';
import {ANARIRendererSchema} from '@luma.gl/scene/schemas';
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
