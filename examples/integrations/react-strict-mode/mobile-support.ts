// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

const exampleSupport = {
  id: 'integrations/react-strict-mode',
  mobileMode: 'full',
  mobileProfile: 'standard',
  requirements: {backends: ['webgl2']}
} satisfies ExampleSupportDefinition;

export default exampleSupport;
