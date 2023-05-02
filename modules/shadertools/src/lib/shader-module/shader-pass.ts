import type {ShaderModule} from './shader-module';

/**
 * A shaderpass is a shader module with additional information
 * on how to run */
export type ShaderPass = ShaderModule & {
  passes?: object[];
};
