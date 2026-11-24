// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ExampleSupportDefinition} from '../../example-support';

/** Device policy shared by both authored physics examples. */
const authoredSceneStressSupport = {
  id: 'gltf/authored-scene-stress',
  mobileMode: 'full',
  mobileProfile: 'standard',
  requirements: {backends: ['webgpu']}
} satisfies ExampleSupportDefinition;

export default authoredSceneStressSupport;

/** Catalog alias for the separate marionette entry point in this workspace. */
export const marionetteTheaterSupport = {
  ...authoredSceneStressSupport,
  id: 'gltf/marionette-theater',
  sourceDirectory: 'gltf/authored-scene-stress'
} satisfies ExampleSupportDefinition;
