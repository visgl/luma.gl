// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

export default {
  id: 'experimental/offroad-buggy',
  mobileMode: 'unsupported',
  mobileProfile: 'standard',
  unsupportedReason: 'Manual driving requires a keyboard.',
  requirements: {backends: ['webgpu']}
} satisfies ExampleSupportDefinition;
