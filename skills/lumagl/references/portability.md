# Backend Portability

## Decide the support contract first

Identify whether the feature is:

- portable across WebGPU and WebGL 2;
- WebGPU-first with a reduced WebGL 2 path; or
- intentionally WebGPU-only.

Do not promise WebGL 2 support for compute shaders, storage textures, storage buffers,
or other missing capabilities. Make the unsupported behavior explicit and testable.

## Device and adapter boundary

Supply the adapters the application supports and select them at device creation. Keep
backend selection near startup rather than spreading raw backend checks across the
render path.

Use the default core WebGPU feature level for a portable baseline. Request maximum or
optional WebGPU features only when the feature needs them, and feature-detect before
creating dependent resources.

## Portable shader contract

luma.gl does not translate application WGSL into GLSL or GLSL into WGSL. Portable
rendering normally uses matching sources with one application-facing contract:

- WGSL source for WebGPU;
- GLSL ES 3.00 vertex and fragment sources for WebGL 2;
- aligned attribute names and formats;
- aligned logical binding names;
- aligned module props, defaults, and uniform types;
- aligned varyings and observable rendering behavior.

When shadertools assembles WGSL, prefer named `@binding(auto)` resources and bind them
by name. Raw WebGPU code that bypasses shadertools still needs concrete binding
numbers. Keep buffer layout, shader layout, and runtime bindings consistent.

## Backend comparison

For portable work:

1. Force WebGPU and record the actual device, errors, and screenshot.
2. Force WebGL 2 and record the same evidence.
3. Compare more than pixels: initialization, warnings, feature choices, resource
   formats, binding names, draw counts, blending, depth state, and cleanup.
4. If output differs, reduce to the smallest resource and draw path that reproduces
   the difference.

Do not treat a fallback from a failed WebGPU attempt as a WebGPU pass. Report the
selected backend explicitly.

## Primary documentation

- `https://luma.gl/docs/api-guide/background/webgpu-vs-webgl.md`
- `https://luma.gl/docs/api-guide/shaders/writing-portable-shaders.md`
- `https://luma.gl/docs/api-guide/gpu/gpu-bindings.md`
- `https://luma.gl/docs/api-reference/core/device-features.md`
- `https://luma.gl/docs/api-reference/core/shader-layout.md`
