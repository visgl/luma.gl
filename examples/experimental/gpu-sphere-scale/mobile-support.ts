// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

export default {
  id: 'experimental/gpu-sphere-scale',
  mobileMode: 'unsupported',
  mobileProfile: 'standard',
  unsupportedReason: 'This large-count benchmark targets desktop WebGPU adapters.',
  requirements: {backends: ['webgpu']}
} satisfies ExampleSupportDefinition;
