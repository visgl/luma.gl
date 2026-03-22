import {expect, test} from 'vitest';
import type { ShaderModule } from '@luma.gl/shadertools';
import { initializeShaderModule, checkShaderModuleDeprecations, getShaderModuleUniforms, getShaderModuleSource } from '@luma.gl/shadertools';
test('ShaderModule', () => {
  let shaderModule: ShaderModule = {
    name: 'empty-shader-module',
    uniformTypes: {}
  };
  expect(getShaderModuleSource(shaderModule, 'vertex'), 'returns vertex shader').toBeTruthy();
  expect(getShaderModuleSource(shaderModule, 'fragment'), 'returns fragment shader').toBeTruthy();
  shaderModule = {
    name: 'test-shader-module',
    uniformTypes: {},
    vs: `
uniform mat4 uProjectMatrix;
uniform mat4 uViewMatrix;
varying float vClipped;
`,
    fs: `
varying float vClipped;
`
  };
  initializeShaderModule(shaderModule);
  expect(getShaderModuleSource(shaderModule, 'vertex'), 'returns vertex shader').toBeTruthy();
  expect(getShaderModuleSource(shaderModule, 'fragment'), 'returns fragment shader').toBeTruthy();
  // @ts-expect-error
  expect(() => getShaderModuleSource(shaderModule, ''), 'unknown shader type').toThrow();
});
test('checkShader', () => {
  const shaderModule = {
    name: 'test-shader-module',
    uniformTypes: {},
    deprecations: [{
      type: 'function',
      old: 'project',
      new: 'project_to_clipspace',
      deprecated: true
    }, {
      type: 'vec4',
      old: 'viewMatrix',
      new: 'uViewMatrix'
    }]
  };
  initializeShaderModule(shaderModule);
  const testShader = `
uniform vec4 viewMatrix;
in vec3 instancePositions;
out vec4 vPos;
void main() {
  vPos = viewMatrix * vec4(instancePositions, 1.0);
  gl_Position = project(instancePositions);
}
`;
  const log = {
    deprecatedCalled: [],
    deprecated: function deprecated(...args) {
      this.deprecatedCalled.push(args);
      return () => {};
    },
    removedCalled: [],
    removed: function removed(...args) {
      this.removedCalled.push(args);
      return () => {};
    }
  };
  checkShaderModuleDeprecations(shaderModule, testShader, log);
  expect(log.deprecatedCalled[0], 'log.deprecated called').toEqual(['project', 'project_to_clipspace']);
  expect(log.removedCalled[0], 'log.removed called').toEqual(['viewMatrix', 'uViewMatrix']);
});
test('initializeShaderModule', () => {
  const module: ShaderModule = {
    name: 'test-shader-module',
    propTypes: {
      // @ts-expect-error
      center: [0.5, 0.5],
      strength: {
        type: 'number',
        value: 0.3,
        min: 0,
        max: 1
      },
      // @ts-expect-error
      enabled: false,
      // @ts-ignore
      sampler: null,
      range: {
        value: new Float32Array([0, 1]),
        private: true
      }
    }
  };
  initializeShaderModule(module);
  let uniforms = getShaderModuleUniforms(module, {});
  expect(uniforms).toEqual({
    center: [0.5, 0.5],
    strength: 0.3,
    enabled: false,
    sampler: null,
    range: [0, 1]
  });
  uniforms = getShaderModuleUniforms(module, {
    center: new Float32Array([0, 0]),
    sampler: {},
    range: [0, 2]
  });
  expect(uniforms).toEqual({
    center: [0, 0],
    strength: 0.3,
    enabled: false,
    sampler: {},
    range: [0, 1]
  });
  expect(() => getShaderModuleUniforms(module, {
    strength: -1
  }), 'invalid uniform').toThrow();
  expect(() => getShaderModuleUniforms(module, {
    strength: 2
  }), 'invalid uniform').toThrow();
  expect(() => getShaderModuleUniforms(module, {
    center: 0.5
  }), 'invalid uniform').toThrow();
});
