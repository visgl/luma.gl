import Compiler from 'glsl-transpiler';

function normalize(source) {
  return source
    // prepr does not like #define without value
    .replace(/^(#define \w+) *$/gm, ($0, $1) => `${$1} 1`);
}

function getVersion(source) {
  return source.slice(0, 9) === '#version ' ? '300 es' : '100 es';
}

// @returns JavaScript function of the transpiled shader
export function compileVertexShader(shaderName, source) {
  source = normalize(source);

  const compileVS = Compiler({
    uniform: name => `uniforms.${name}`,
    attribute: name => `attributes.${name}`,
    version: getVersion(source)
  });

  const compiledSource = compileVS(source);
  const {compiler} = compileVS;

  return evalScript(
    `function vs(uniforms, attributes) {
  var gl_Position;
  ${compiledSource}
  /* End of shader code */
  main();
  return {
    gl_Position,
    varyings: {${Object.keys(compiler.varyings).join(', ')}}
  };
}`,
    shaderName
  );
}

// @returns JavaScript function of the transpiled shader
export function compileFragmentShader(shaderName, source) {
  source = normalize(source);

  const compileFS = Compiler({
    uniform: name => `uniforms.${name}`,
    attribute: name => `attributes.${name}`,
    varying: name => `varyings.${name}`,
    version: getVersion(source)
  });

  const compiledSource = compileFS(source);

  return evalScript(
    `function fs(uniforms, varyings) {
  var gl_FragColor;
  var isDiscarded = false;
  function discard() {
    isDiscarded = true;
  }
  ${compiledSource}
  /* End of shader code */
  main();
  return {
    gl_FragColor,
    isDiscarded
  };
}`,
    shaderName
  );
}

/* eslint-disable no-eval */
function evalScript(value, name) {
  const script = `(function() { return ${value}; })()
//# sourceURL=${name}.js`;
  return eval(script);
}
