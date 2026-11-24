// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

export const sceneProbeCamera = {
  name: 'sceneProbeCamera',
  source: `@group(0) @binding(auto) var<storage, read> sceneProbeOrigin: array<vec4f>;`,
  bindingLayout: [{name: 'sceneProbeOrigin', group: 0}]
} as const satisfies ShaderModule;
