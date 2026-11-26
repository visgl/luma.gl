// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  opticalLighting,
  MAX_OPTICAL_CAUSTIC_LENSES,
  opticalCaustics,
  opticalCausticsPlugin,
  MAX_OPTICAL_POINT_LIGHTS,
  opticalPointLights,
  opticalPointLightsPlugin,
  emissiveMaterial,
  emissiveMaterialPlugin,
  glassMaterial,
  glassMaterialPlugin,
  glassTransmission,
  glassTransmissionPlugin,
  reflectiveMaterial,
  reflectiveMaterialPlugin
} from './experimental/materials/index';
export type {
  OpticalCausticLens,
  OpticalCausticLensUniform,
  OpticalCausticsProps,
  OpticalCausticsUniforms,
  OpticalPointLight,
  OpticalPointLightUniform,
  OpticalPointLightsProps,
  OpticalPointLightsUniforms,
  EmissiveMaterialProps,
  EmissiveMaterialUniforms,
  GlassMaterialBindings,
  GlassMaterialProps,
  GlassMaterialUniforms,
  GlassTransmissionBindings,
  GlassTransmissionProps,
  GlassTransmissionUniforms,
  ReflectiveMaterialProps,
  ReflectiveMaterialUniforms
} from './experimental/materials/index';
