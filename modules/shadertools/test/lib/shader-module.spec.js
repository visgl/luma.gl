import test from 'tape-catch';
import ShaderModule from '@luma.gl/shadertools/lib/shader-module';

test('ShaderModule', t => {
  let shaderModule = new ShaderModule({name: 'empty-shader-module'});

  t.ok(shaderModule.getModuleSource('vs', 300), 'returns vs shader');
  t.ok(shaderModule.getModuleSource('fs', 300), 'returns fs shader');

  shaderModule = new ShaderModule({
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

  t.ok(shaderModule.getModuleSource('vs', 300), 'returns vs shader');
  t.ok(shaderModule.getModuleSource('fs', 300), 'returns fs shader');
  t.throws(() => shaderModule.getModuleSource('', 300), 'unknown shader type');

  t.end();
});

test('ShaderModule#checkDeprecations', t => {
  const shaderModule = new ShaderModule({
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
