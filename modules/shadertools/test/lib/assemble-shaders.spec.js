import {createTestContext} from '@luma.gl/test-utils';
import {assembleShaders, picking, fp64, pbr} from '@luma.gl/shadertools';

import test from 'tape-promise/tape';

const fixture = {
  gl1: createTestContext({webgl2: false, webgl1: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};

const VS_GLSL_300 = `\
#version 300 es

in vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;

const FS_GLSL_300 = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const VS_GLSL_300_2 = `\
#version 300 es

in vec4 positions;
in vec2 uvs;
in vec3 normals;

out vec2 vUV;
out vec3 vNormal;

// Make sure in and out args don't get transpiled
void setPosition1(in vec4 inPosition, out vec4 outPosition) {
  outPosition = inPosition;
}

void setPosition2(
  in vec4 inPosition,
  out vec4 outPosition
) {
  outPosition = inPosition;
}

void main(void) {
  vUV = uvs;
  vNormal = normals;

  setPosition1(positions, gl_Position);
  setPosition2(positions, gl_Position);
}
`;

const FS_GLSL_300_2 = `\
#version 300 es

precision highp float;

uniform sampler2D tex;

in vec2 vUV;
in vec3 vNormal;

out vec4 fragmentColor;

void main(void) {
  fragmentColor = texture(tex, vUV) * vec4(vNormal, 1.0);
}
`;

// deck.gl mesh layer shaders
// TODO - broken tests
/*
const VS_GLSL_300_DECK = `#version 300 es
#define SHADER_NAME simple-mesh-layer-vs

// Scale the model
uniform float sizeScale;
uniform bool composeModelMatrix;

// Primitive attributes
in vec3 positions;
in vec3 normals;
in vec2 texCoords;

// Instance attributes
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in mat3 instanceModelMatrix;
in vec3 instanceTranslation;

// Outputs to fragment shader
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;

void main(void) {
  vTexCoord = texCoords;
  cameraPosition = vec3(1.0);
  normals_commonspace = vec3(1.0);
  vColor = instanceColors;

  vec3 pos = (instanceModelMatrix * positions) * sizeScale + instanceTranslation;

  if (composeModelMatrix) {
    gl_Position = vec4(1.0);
  }
  else {
    gl_Position = vec4(1.0);
  }
}
`;

const FS_GLSL_300_DECK = `#version 300 es
#define SHADER_NAME simple-mesh-layer-fs

precision highp float;

uniform bool hasTexture;
uniform sampler2D sampler;
uniform bool flatShading;
uniform float opacity;

in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
  vec3 normal;
  if (flatShading) {
    normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
  } else {
    normal = normals_commonspace;
  }

  vec4 color = hasTexture ? texture(sampler, vTexCoord) : vColor;
  vec3 lightColor = vec3(1.0);
  fragColor = vec4(lightColor, color.a * opacity);
}
`;
*/

const VS_GLSL_300_GLTF = `#version 300 es

#if (__VERSION__ < 300)
  #define _attr attribute
#else
  #define _attr in
#endif

  _attr vec4 POSITION;

  #ifdef HAS_NORMALS
    _attr vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    _attr vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    _attr vec2 TEXCOORD_0;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = NORMAL;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = TEXCOORD_0;
    #endif

    pbr_setPositionNormalTangentUV(POSITION, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = u_MVPMatrix * POSITION;
  }
`;

const FS_GLSL_300_GLTF = `#version 300 es

  out vec4 fragmentColor;

  void main(void) {
    fragmentColor = pbr_filterColor(vec4(0));
  }
`;

const TEST_MODULE = {
  name: 'TEST_MODULE',
  inject: {
    'vs:#decl': `uniform float vsFloat;`,
    // Hook function has access to injected variable
    'vs:HOOK_FUNCTION': 'value = vsFloat;',

    'fs:#decl': `uniform vec4 fsVec4;`,
    // Hook function has access to injected variable
    'fs:HOOK_FUNCTION': 'value = fsVec4;'
  }
};

const VS_GLSL_300_MODULES = `\
#version 300 es

in float floatAttribute;

out float floatVarying;

void main(void) {
  HOOK_FUNCTION(floatVarying);
}
`;

const FS_GLSL_300_MODULES = `\
#version 300 es
precision highp float;

in float floatVarying;

out vec4 fragmentColor;

void main(void) {
  HOOK_FUNCTION(fragmentColor);
}
`;

test('assembleShaders#import', (t) => {
  t.ok(assembleShaders !== undefined, 'assembleShaders import successful');
  t.end();
});

test('assembleShaders#version_directive', (t) => {
  const assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking]
  });
  // Verify version directive remains as first line.
  t.equal(
    assembleResult.vs.indexOf('#version 300 es'),
    0,
    'version directive should be first statement'
  );
  t.equal(
    assembleResult.fs.indexOf('#version 300 es'),
    0,
    'version directive should be first statement'
  );
  t.end();
});

test('assembleShaders#getUniforms', (t) => {
  // inject spy into the picking module's getUniforms
  // const module = getShaderModule(picking);
  // const getUniformsSpy = makeSpy(module, 'getUniforms');

  let assembleResult;

  // Without shader modules
  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300
  });
  // Verify getUniforms is function
  t.is(typeof assembleResult.getUniforms, 'function', 'getUniforms should be function');

  // With shader modules
  const testModule = {
    name: 'test-module',
    vs: '',
    fs: '',
    getUniforms: (opts, context) => {
      // Check a uniform generated by its dependency
      t.ok(context.picking_uActive, 'module getUniforms is called with correct context');
      return {};
    },
    dependencies: [picking]
  };

  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking, testModule, fp64]
  });

  // Verify getUniforms is function
  t.is(typeof assembleResult.getUniforms, 'function', 'getUniforms should be function');

  t.end();
});

test('assembleShaders#defines', (t) => {
  const assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    defines: {IS_TEST: true}
  });

  t.ok(assembleResult.vs.indexOf('#define IS_TEST true') > 0, 'has application defines');
  t.ok(assembleResult.fs.indexOf('#define IS_TEST true') > 0, 'has application defines');

  t.end();
});

test('assembleShaders#shaderhooks', (t) => {
  const hookFunctions = [
    'vs:LUMAGL_pickColor(inout vec4 color)',
    {
      hook: 'fs:LUMAGL_fragmentColor(inout vec4 color)',
      header: 'if (color.a == 0.0) discard;\n',
      footer: 'color.a *= 1.2;\n'
    }
  ];

  const pickingInject = Object.assign(
    {
      inject: {
        'vs:LUMAGL_pickColor': 'picking_setPickingColor(color.rgb);',
        'fs:LUMAGL_fragmentColor': {
          injection: 'color = picking_filterColor(color);',
          order: Number.POSITIVE_INFINITY
        },
        'fs:#main-end': 'gl_FragColor = picking_filterColor(gl_FragColor);'
      }
    },
    picking
  );

  const testInject = {
    name: 'test-injection',
    inject: {
      'fs:LUMAGL_fragmentColor': 'color.r = 1.0;'
    }
  };

  let assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    hookFunctions
  });
  // Verify version directive remains as first line.
  t.ok(
    assembleResult.vs.indexOf('LUMAGL_pickColor') > -1,
    'hook function injected into vertex shader'
  );
  t.ok(
    assembleResult.fs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );
  t.ok(
    assembleResult.fs.indexOf('if (color.a == 0.0) discard;') > -1,
    'hook header injected into fragment shader'
  );
  t.ok(
    assembleResult.vs.indexOf('picking_setPickingColor(color.rgb)') === -1,
    'injection code not included in vertex shader without module'
  );
  t.ok(
    assembleResult.fs.indexOf('color = picking_filterColor(color)') === -1,
    'injection code not included in fragment shader without module'
  );

  t.ok(
    assembleResult.fs.indexOf('fragmentColor = picking_filterColor(fragmentColor)') === -1,
    'regex injection code not included in fragment shader without module'
  );

  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [pickingInject],
    hookFunctions
  });
  // Verify version directive remains as first line.
  t.ok(
    assembleResult.vs.indexOf('LUMAGL_pickColor') > -1,
    'hook function injected into vertex shader'
  );
  t.ok(
    assembleResult.fs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );
  t.ok(
    assembleResult.vs.indexOf('picking_setPickingColor(color.rgb)') > -1,
    'injection code included in vertex shader with module'
  );
  t.ok(
    assembleResult.fs.indexOf('color = picking_filterColor(color)') > -1,
    'injection code included in fragment shader with module'
  );
  t.ok(
    assembleResult.fs.indexOf('color.a *= 1.2;') >
      assembleResult.fs.indexOf('color = picking_filterColor(color)'),
    'hook footer injected after injection code'
  );
  t.ok(
    assembleResult.fs.indexOf('fragmentColor = picking_filterColor(fragmentColor)') > -1,
    'regex injection code included in fragment shader with module'
  );

  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    },
    modules: [pickingInject],
    hookFunctions
  });

  t.ok(
    assembleResult.vs.indexOf('color *= 0.1') > -1,
    'argument injection code included in shader hook'
  );
  t.ok(
    assembleResult.fs.indexOf('color += 0.1') > -1,
    'argument injection code included in shader hook'
  );
  t.ok(
    assembleResult.fs.indexOf('color += 0.1') <
      assembleResult.fs.indexOf('color = picking_filterColor(color)'),
    'argument injection code injected in the correct order'
  );

  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [pickingInject, testInject],
    hookFunctions
  });

  t.ok(
    assembleResult.fs.indexOf('color.r = 1.0') > -1,
    'module injection code included in shader hook'
  );
  t.ok(
    assembleResult.fs.indexOf('color.r = 1.0') <
      assembleResult.fs.indexOf('color = picking_filterColor(color)'),
    'module injection code injected in the correct order'
  );

  assembleResult = assembleShaders(fixture.gl1, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    inject: {
      'fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);': 'fragmentColor -= 0.1;'
    },
    hookFunctions
  });

  t.ok(
    assembleResult.fs.indexOf('fragmentColor -= 0.1;') > -1,
    'regex injection code included in shader hook'
  );

  t.end();
});

test('assembleShaders#injection order', (t) => {
  const gl = fixture.gl1;

  let assembleResult = assembleShaders(gl, {
    vs: VS_GLSL_300_MODULES,
    fs: FS_GLSL_300_MODULES,
    inject: {
      'vs:#decl': `uniform float vsFloat;`,
      // Hook function has access to injected variable
      'vs:HOOK_FUNCTION': 'value = vsFloat;',

      'fs:#decl': `uniform vec4 fsVec4;`,
      // Hook function has access to injected variable
      'fs:HOOK_FUNCTION': 'value = fsVec4;'
    },
    transpileToGLSL100: true,
    hookFunctions: ['vs:HOOK_FUNCTION(inout float value)', 'fs:HOOK_FUNCTION(inout vec4 value)']
  });

  let vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);

  let fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);

  let program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  t.ok(
    gl.getProgramParameter(program, gl.LINK_STATUS),
    'Hook functions have access to injected variables.'
  );

  assembleResult = assembleShaders(gl, {
    vs: VS_GLSL_300_MODULES,
    fs: FS_GLSL_300_MODULES,
    modules: [TEST_MODULE],
    transpileToGLSL100: true,
    hookFunctions: ['vs:HOOK_FUNCTION(inout float value)', 'fs:HOOK_FUNCTION(inout vec4 value)']
  });

  vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);

  fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);

  program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  t.ok(
    gl.getProgramParameter(program, gl.LINK_STATUS),
    'Hook functions have access to injected variables through modules.'
  );

  t.end();
});

test('assembleShaders#transpilation', (t) => {
  const gl = fixture.gl1;
  let assembleResult = assembleShaders(gl, {
    vs: VS_GLSL_300,
    fs: FS_GLSL_300,
    modules: [picking],
    transpileToGLSL100: true
  });

  t.ok(assembleResult.vs.indexOf('#version 300 es') === -1, 'es 3.0 version directive removed');
  t.ok(!assembleResult.vs.match(/\bin vec4\b/), '"in" keyword removed');

  t.ok(assembleResult.fs.indexOf('#version 300 es') === -1, 'es 3.0 version directive removed');
  t.ok(!assembleResult.fs.match(/\bout vec4\b/), '"out" keyword removed');

  let vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);

  let fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);

  let program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  t.ok(gl.getProgramParameter(program, gl.LINK_STATUS), 'Transpile 300 to 100 valid program');

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  assembleResult = assembleShaders(gl, {
    vs: VS_GLSL_300_2,
    fs: FS_GLSL_300_2,
    modules: [picking],
    transpileToGLSL100: true
  });

  vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);

  fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);

  program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  t.ok(gl.getProgramParameter(program, gl.LINK_STATUS), 'Transpile 300 to 100 valid program');

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  /* TODO - broken test, common_space varying broken
  if (gl.getExtension('OES_standard_derivatives')) {
    assembleResult = assembleShaders(gl, {
      vs: VS_GLSL_300_DECK,
      fs: FS_GLSL_300_DECK,
      transpileToGLSL100: true
    });

    vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, assembleResult.vs);
    gl.compileShader(vShader);
    let compileStatus = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
    if (!compileStatus) {
      const infoLog = gl.getShaderInfoLog(vShader);
      t.comment(`VS INFOLOG: ${infoLog}`);
    }

    fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, assembleResult.fs);
    gl.compileShader(fShader);
    compileStatus = gl.getShaderParameter(fShader, gl.COMPILE_STATUS);
    if (!compileStatus) {
      const infoLog = gl.getShaderInfoLog(fShader);
      t.comment(`FS INFOLOG: ${infoLog}`);
    }

    program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linkStatus) {
      const infoLog = gl.getProgramInfoLog(program);
      t.comment(`LINKLOG ${infoLog}`);
    }
    gl.validateProgram(program);
    const validateStatus = gl.getProgramParameter(this.handle, gl.VALIDATE_STATUS);
    if (!linkStatus) {
      const infoLog = gl.getProgramInfoLog(program);
      t.comment(`VALIDATELOG ${infoLog}`);
    }

    t.ok(
      gl.getProgramParameter(program, gl.LINK_STATUS),
      'Deck shaders transpile 300 to 100 valid program'
    );

    process.exit(1);
  }
  */

  assembleResult = assembleShaders(gl, {
    vs: VS_GLSL_300_GLTF,
    fs: FS_GLSL_300_GLTF,
    modules: [pbr],
    transpileToGLSL100: true
  });

  vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, assembleResult.vs);
  gl.compileShader(vShader);

  fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, assembleResult.fs);
  gl.compileShader(fShader);

  program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  t.ok(
    gl.getProgramParameter(program, gl.LINK_STATUS),
    'GLTF shaders transpile 300 to 100 valid program'
  );

  if (fixture.gl2) {
    const gl2 = fixture.gl2;

    assembleResult = assembleShaders(gl2, {
      vs: VS_GLSL_300_GLTF,
      fs: FS_GLSL_300_GLTF,
      modules: [pbr],
      transpileToGLSL100: false
    });

    vShader = gl2.createShader(gl2.VERTEX_SHADER);
    gl2.shaderSource(vShader, assembleResult.vs);
    gl2.compileShader(vShader);

    fShader = gl2.createShader(gl2.FRAGMENT_SHADER);
    gl2.shaderSource(fShader, assembleResult.fs);
    gl2.compileShader(fShader);

    program = gl2.createProgram();
    gl2.attachShader(program, vShader);
    gl2.attachShader(program, fShader);
    gl2.linkProgram(program);

    t.ok(
      gl2.getProgramParameter(program, gl2.LINK_STATUS),
      'GLTF shaders transpile 300 to 300 valid program'
    );
  }

  t.end();
});
