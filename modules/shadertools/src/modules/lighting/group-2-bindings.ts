// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Reserved start of the scene-uniform range in bind group 2. */
export const GROUP_2_SCENE_UNIFORM_RANGE_START = 0;

/** Reserved start of the scene-buffer expansion range in bind group 2. */
export const GROUP_2_SCENE_BUFFER_RANGE_START = 16;

/** Reserved start of the scene-texture and sampler range in bind group 2. */
export const GROUP_2_SCENE_TEXTURE_RANGE_START = 32;

/** Binding slot for the shared scene lighting uniform block in bind group 2. */
export const GROUP_2_LIGHTING_BINDING = GROUP_2_SCENE_UNIFORM_RANGE_START;

/** Binding slot for the simple directional-light uniform block in bind group 2. */
export const GROUP_2_DIRLIGHT_BINDING = GROUP_2_SCENE_BUFFER_RANGE_START;

/** Base binding slot for scene IBL textures and samplers in bind group 2. */
export const GROUP_2_IBL_BASE_BINDING = GROUP_2_SCENE_TEXTURE_RANGE_START;
