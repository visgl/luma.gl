import type {ShaderModule} from './shader-module';

/**
 * A shaderpass is a shader module with additional information
 * on how to run 
 */
export type ShaderPass<Uniforms extends Record<string, unknown>> = ShaderModule<Uniforms> & {
  passes?: ShaderPassData[];
};

type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
}
