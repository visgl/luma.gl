// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {log} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {gouraudMaterial} from '@luma.gl/shadertools';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// References a GLSL bool member (`material.unlit`) and struct array members
// (`lighting.lights[i]`) so both module blocks stay active after linking.
const LIGHTING_VS = /* glsl */ `\
#version 300 es
out vec3 vColor;
void main() {
  vColor = lighting.ambientColor + lighting.lights[0].color + lighting.lights[4].position;
  if (material.unlit) {
    vColor = vec3(material.ambient);
  }
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const LIGHTING_FS = /* glsl */ `\
#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

it('Model validates gouraudMaterial and lighting uniform blocks against WebGL reflection', async () => {
  const webglDevice = await getWebGLTestDevice();
  const fallbackMessages: string[] = [];
  const logOnce = vi.spyOn(log, 'once').mockImplementation((_level, message) => {
    fallbackMessages.push(String(message));
    return () => {};
  });

  try {
    const model = new Model(webglDevice, {
      id: 'uniform-block-reflection-test',
      topology: 'point-list',
      vertexCount: 0,
      vs: LIGHTING_VS,
      fs: LIGHTING_FS,
      modules: [gouraudMaterial]
    });

    const uniformBlockNames = model.pipeline.shaderLayout.bindings
      .filter(binding => binding.type === 'uniform')
      .map(binding => binding.name);
    expect(uniformBlockNames, 'module uniform blocks are active').toEqual(
      expect.arrayContaining(['gouraudMaterialUniforms', 'lightingUniforms'])
    );
    expect(
      fallbackMessages.filter(message => message.includes('uniform block reflection failed')),
      'reflected layouts match the module std140 metadata'
    ).toEqual([]);

    model.destroy();
  } finally {
    logOnce.mockRestore();
  }
});
