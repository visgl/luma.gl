// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

const exampleSupport = {
  id: 'experimental/html-ui-prism',
  mobileMode: 'reduced',
  mobileProfile: 'effects',
  requirements: {backends: ['webgpu', 'webgl2']}
} satisfies ExampleSupportDefinition;

export default exampleSupport;
