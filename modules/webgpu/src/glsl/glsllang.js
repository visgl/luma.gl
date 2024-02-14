// Inspired by webgpu samples at https://github.com/austinEng/webgpu-samples/blob/master/src/glslang.ts
// under BSD 3-clause license
let glslang;
/** Dynamically load the GLSL compiler */
export async function loadGlslangModule() {
    if (!glslang) {
        // @ts-ignore
        const glslangModule = await import(/* webpackIgnore: true */ 'https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js');
        glslang = await glslangModule.default();
    }
    return glslang;
}
