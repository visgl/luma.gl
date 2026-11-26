// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

const exampleSupport = {
  id: 'v10/gpu-simple-graph',
  mobileMode: 'reduced',
  mobileProfile: 'large-data',
  requirements: {backends: ['webgpu', 'webgl2']}
} satisfies ExampleSupportDefinition;

export default exampleSupport;
