// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {opticalLighting} from './optical-lighting';
export type {
  OpticalCausticLens,
  OpticalCausticLensUniform,
  OpticalCausticsProps,
  OpticalCausticsUniforms
} from './optical-caustics';
export {
  MAX_OPTICAL_CAUSTIC_LENSES,
  opticalCaustics,
  opticalCausticsPlugin
} from './optical-caustics';
export type {
  OpticalPointLight,
  OpticalPointLightUniform,
  OpticalPointLightsProps,
  OpticalPointLightsUniforms
} from './optical-point-lights';
export {
  MAX_OPTICAL_POINT_LIGHTS,
  opticalPointLights,
  opticalPointLightsPlugin
} from './optical-point-lights';
export type {
  EmissiveMaterialProps,
  EmissiveMaterialUniforms
} from './emissive-material';
export {emissiveMaterial, emissiveMaterialPlugin} from './emissive-material';
export type {
  GlassMaterialBindings,
  GlassMaterialProps,
  GlassMaterialUniforms
} from './glass-material';
export {glassMaterial, glassMaterialPlugin} from './glass-material';
export type {
  GlassTransmissionBindings,
  GlassTransmissionProps,
  GlassTransmissionUniforms
} from './glass-transmission';
export {glassTransmission, glassTransmissionPlugin} from './glass-transmission';
export type {
  ReflectiveMaterialProps,
  ReflectiveMaterialUniforms
} from './reflective-material';
export {reflectiveMaterial, reflectiveMaterialPlugin} from './reflective-material';
