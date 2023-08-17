import test from 'tape-promise/tape';
import {ShaderModuleInstance} from '@luma.gl/shadertools/lib/shader-module/shader-module-instance';
import {normalizeShaderModule} from '@luma.gl/shadertools';

test('ShaderModuleInstance', (t) => {
  let shaderModule = new ShaderModuleInstance({name: 'empty-shader-module'});

  t.ok(shaderModule.getModuleSource('vs'), 'returns vs shader');
  t.ok(shaderModule.getModuleSource('fs'), 'returns fs shader');

  shaderModule = new ShaderModuleInstance({
    name: 'test-shader-module',
    vs: `
uniform mat4 uProjectMatrix;
uniform mat4 uViewMatrix;
varying float vClipped;
`,
    fs: `
varying float vClipped;
`
  });

  t.ok(shaderModule.getModuleSource('vs'), 'returns vs shader');
  t.ok(shaderModule.getModuleSource('fs'), 'returns fs shader');
  // @ts-expect-error
  t.throws(() => shaderModule.getModuleSource(''), 'unknown shader type');

  t.end();
});

test('ShaderModuleInstance#checkDeprecations', (t) => {
  const shaderModule = new ShaderModuleInstance({
    name: 'test-shader-module',
    deprecations: [
      {type: 'function', old: 'project', new: 'project_to_clipspace', deprecated: true},
      {type: 'vec4', old: 'viewMatrix', new: 'uViewMatrix'}
    ]
  });
  const testShader = `
uniform vec4 viewMatrix;
attribute vec3 instancePositions;
varying vec4 vPos;
void main() {
  vPos = viewMatrix * vec4(instancePositions, 1.0);
  gl_Position = project(instancePositions);
}
`;

  const log = {
    deprecatedCalled: [],
    deprecated: function deprecated() {
      this.deprecatedCalled.push(Array.from(arguments));
      return () => {};
    },
    removedCalled: [],
    removed: function removed() {
      this.removedCalled.push(Array.from(arguments));
      return () => {};
    }
  };

  shaderModule.checkDeprecations(testShader, log);

  t.deepEqual(
    log.deprecatedCalled[0],
    ['project', 'project_to_clipspace'],
    'log.deprecated called'
  );
  t.deepEqual(log.removedCalled[0], ['viewMatrix', 'uViewMatrix'], 'log.removed called');

  t.end();
});

test('normalizeShaderModule', (t) => {
  const module = {
    name: 'test-shader-module',
    uniforms: {
      center: [0.5, 0.5],
      strength: {type: 'number', value: 0.3, min: 0, max: 1},
      enabled: false,
      sampler: null,
      range: {value: new Float32Array([0, 1]), private: true}
    }
  };
  normalizeShaderModule(module);

  // @ts-expect-error
  t.deepEqual(module.getUniforms(), {
    center: [0.5, 0.5],
    strength: 0.3,
    enabled: false,
    sampler: null,
    range: [0, 1]
  });

  t.deepEqual(
    // @ts-expect-error
    module.getUniforms({
      center: new Float32Array([0, 0]),
      sampler: {},
      range: [0, 2]
    }),
    {
      center: [0, 0],
      strength: 0.3,
      enabled: false,
      sampler: {},
      range: [0, 1]
    }
  );

  // @ts-expect-error
  t.throws(() => module.getUniforms({strength: -1}), 'invalid uniform');
  // @ts-expect-error
  t.throws(() => module.getUniforms({strength: 2}), 'invalid uniform');
  // @ts-expect-error
  t.throws(() => module.getUniforms({center: 0.5}), 'invalid uniform');

  t.end();
});
