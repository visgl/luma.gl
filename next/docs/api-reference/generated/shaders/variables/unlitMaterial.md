# Variable: unlitMaterial

> `const` **unlitMaterial**: [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)<`Record`<`string`, `never`>>

Defined in: [modules/lighting/unlit-material/unlit-material.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/unlit-material/unlit-material.ts#L35)

Preserves surface RGBA without lighting dependencies, uniforms, or bindings. Use instead of a lit material module when lighting is never needed. The caller supplies color/texture sampling and remains responsible for output color space and alpha conventions. Available in both vertex and fragment stages.
