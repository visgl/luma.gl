import type {Texture, Parameters} from '@luma.gl/core';
import {PBRMaterialBindings, PBRMaterialUniforms, PBRProjectionProps} from '@luma.gl/shadertools';

/** Material state extracted from a glTF primitive for consumption by the PBR shader module. */
export type ParsedPBRMaterial = {
  /** Shader defines inferred from geometry and material features. */
  readonly defines: Record<string, boolean>;
  /** Texture and sampler bindings for the PBR shader module. */
  readonly bindings: Partial<PBRMaterialBindings>;
  /** Uniform values for the projection and PBR shader modules. */
  readonly uniforms: Partial<PBRProjectionProps & PBRMaterialUniforms>;
  /** Render pipeline parameters derived from the glTF material. */
  readonly parameters: Parameters;
  /** @deprecated Use parameters */
  readonly glParameters: Record<string, any>;
  /** List of all generated textures, makes it easy to destroy them later */
  readonly generatedTextures: Texture[];
};
