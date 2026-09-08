// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

const exampleSupport = {
  id: 'arrow/arrow-text-2d',
  mobileMode: 'reduced',
  mobileProfile: 'dense',
  requirements: {backends: ['webgpu', 'webgl2']}
} satisfies ExampleSupportDefinition;

export default exampleSupport;
