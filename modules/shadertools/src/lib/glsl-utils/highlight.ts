// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// SHADER HELPERS

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export const glsl = (x: TemplateStringsArray) => `${x}`;
