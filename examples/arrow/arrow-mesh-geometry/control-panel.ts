// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function makeArrowMeshGeometryControlPanelHtml(cubeCount: number): string {
  return `
<p>Builds indexed Mesh Arrow data from <code>CubeGeometry</code> face ids, then renders ${cubeCount} transformed cube instances from one Arrow <code>matrix</code> <code>mat4x4</code> column. WebGPU reads the matrix column as <code>array&lt;mat4x4&lt;f32&gt;&gt;</code>; WebGL lowers the same Arrow column into four instanced <code>vec4</code> attributes.</p>
`;
}
