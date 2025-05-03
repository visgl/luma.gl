import type {Texture, Parameters} from '@luma.gl/core';
import {PBRMaterialBindings, PBRMaterialUniforms, PBRProjectionProps} from '@luma.gl/shadertools';

export type ParsedPBRMaterial = {
  readonly defines: Record<string, boolean>;
  readonly bindings: Partial<PBRMaterialBindings>;
  readonly uniforms: Partial<PBRProjectionProps & PBRMaterialUniforms>;
  readonly parameters: Parameters;
  /** @deprecated Use parameters */
  readonly glParameters: Record<string, any>;
  /** List of all generated textures, makes it easy to destroy them later */
  readonly generatedTextures: Texture[];
};
