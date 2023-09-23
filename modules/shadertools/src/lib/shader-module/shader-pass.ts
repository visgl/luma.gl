import type {ShaderModule, UniformValue} from './shader-module';

/**
 * A shaderpass is a shader module with additional information
 * on how to run 
 */
export type ShaderPass<UniformsT extends Record<string, UniformValue>> = ShaderModule<UniformsT> & {
  passes?: ShaderPassData[];
};

type ShaderPassData = {
  sampler?: boolean;
  filter?: boolean;
}
