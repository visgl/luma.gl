export type ShaderModule = {
  vs?: string;
  fs?: string;
  getUniforms()
}

export type ShaderPass = {
  vs?: string;
  fs?: string;
  getUniforms()
}

// Shader Modules
export const fp32: ShaderModule;
export const fp64: ShaderModule;
export const fp64arithmetic: ShaderModule;
export const project: ShaderModule;
export const lights: ShaderModule;
export const dirlight: ShaderModule;
export const picking: ShaderModule;
export const gouraudLighting: ShaderModule;
export const phongLighting: ShaderModule;
export const pbr: ShaderModule;

// Shader Passes

export const brightnessContrast: ShaderPass;
export const denoise: ShaderPass;
export const hueSaturation: ShaderPass;
export const noise: ShaderPass;
export const sepia: ShaderPass;
export const vibrance: ShaderPass;
export const vignette: ShaderPass;

// glfx BLUR shader modules
export const tiltShift: ShaderPass;
export const triangleBlur: ShaderPass;
export const zoomBlur: ShaderPass;

// glfx FUN shader modules
export const colorHalftone: ShaderPass;
export const dotScreen: ShaderPass;
export const edgeWork: ShaderPass;
export const hexagonalPixelate: ShaderPass;
export const ink: ShaderPass;

// glfx WARP shader modules
export const bulgePinch: ShaderPass;
export const swirl: ShaderPass;

// Postprocessing
export const fxaa: ShaderPass;

// experimental
export const _transform: ShaderPass;
