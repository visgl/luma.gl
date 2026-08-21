export const FOUNDATION_JOURNEY = [
  {id: 'shadertools', label: 'Shadertools', summary: 'Assemble reusable shader behavior.', detail: 'Modules declare source, dependencies, props, hooks, and injections. The assembler resolves them into WGSL or GLSL.'},
  {id: 'engine', label: 'Engine', summary: 'Connect data and shaders through Model.', detail: 'Geometry describes attributes, ShaderInputs owns module values, and Model manages pipelines, bindings, draw state, and redraw needs.'},
  {id: 'core', label: 'Core', summary: 'Own resources and submit GPU commands.', detail: 'Device creates buffers and pipelines. Encoders and passes record work; submission sends it to the selected WebGPU or WebGL adapter.'},
] as const;

/** Returns the immutable teaching model used by the cross-module guide. */
export function getFoundationJourney(): typeof FOUNDATION_JOURNEY {
  return FOUNDATION_JOURNEY;
}
