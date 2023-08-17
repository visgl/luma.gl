import test from 'tape-promise/tape';
import {ShaderAssembler, PlatformInfo, glsl, picking, dirlight} from '@luma.gl/shadertools';

const platformInfo: PlatformInfo = {
  gpu: 'test-gpu',
  features: new Set()
}

const vs = glsl`\
attribute vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;

const fs = glsl`\
precision highp float;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const VS_300 = glsl`\
#version 300 es

  in vec4 positions;
  in vec2 uvs;

  out vec2 vUV;

  void main() {
    vUV = uvs;
    gl_Position = positions;
  }
`;

const FS_300 = glsl`\
#version 300 es
  precision highp float;

  in vec2 vUV;

  uniform sampler2D tex;

  out vec4 fragColor;
  void main() {
    fragColor = texture(tex, vUV);
  }
`;

test.only('ShaderAssembler#hooks', (t) => {
  const shaderAssembler = new ShaderAssembler();

  const preHookShaders = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  shaderAssembler.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  shaderAssembler.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const assemblyResults = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  t.ok(preHookShaders !== assemblyResults, 'Adding hooks changes hash');

  const pickingInjection = Object.assign(
    {
      inject: {
        'vs:LUMAGL_pickColor': 'picking_setPickingColor(color.rgb);',
        'fs:LUMAGL_fragmentColor': {
          injection: 'color = picking_filterColor(color);',
          order: Number.POSITIVE_INFINITY
        }
      }
    },
    picking
  );

  const noModuleProgram = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  t.ok(preHookShaders !== noModuleProgram, 'Adding hooks changes hash');

  const noModuleVs = noModuleProgram.vs;
  const noModuleFs = noModuleProgram.fs;

  t.ok(noModuleVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader');
  t.ok(
    noModuleFs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );

  t.ok(
    noModuleVs.indexOf('picking_setPickingColor(color.rgb)') === -1,
    'injection code not included in vertex shader without module'
  );
  t.ok(
    noModuleFs.indexOf('color = picking_filterColor(color)') === -1,
    'injection code not included in fragment shader without module'
  );

  const modulesProgram = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    modules: [pickingInjection]
  });
  const modulesVs = modulesProgram.vs;
  const modulesFs = modulesProgram.fs;

  t.ok(modulesVs.indexOf('LUMAGL_pickColor') > -1, 'hook function injected into vertex shader');
  t.ok(
    modulesFs.indexOf('LUMAGL_fragmentColor') > -1,
    'hook function injected into fragment shader'
  );

  t.ok(
    modulesVs.indexOf('picking_setPickingColor(color.rgb)') > -1,
    'injection code included in vertex shader with module'
  );
  t.ok(
    modulesFs.indexOf('color = picking_filterColor(color)') > -1,
    'injection code included in fragment shader with module'
  );
  t.ok(
    modulesFs.indexOf('if (color.a == 0.0) discard;') > -1,
    'hook header injected into fragment shader'
  );
  t.ok(
    modulesFs.indexOf('color.a *= 1.2;') > modulesFs.indexOf('color = picking_filterColor(color)'),
    'hook footer injected after injection code'
  );

  const injectedShaders = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    }
  });
  const injectVs = injectedShaders.vs;
  const injectFs = injectedShaders.fs;

  t.ok(injectVs.indexOf('color *= 0.1') > -1, 'argument injection code included in shader hook');
  t.ok(injectFs.indexOf('color += 0.1') > -1, 'argument injection code included in shader hook');

  const injectDefineProgram1 = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;'
    }
  });

  const injectDefineProgram2 = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    defines: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;'
    }
  });

  t.ok(injectDefineProgram1 !== injectDefineProgram2, 'Injects and defines hashed separately.');

  t.end();
});

test('ShaderAssembler#defaultModules', (t) => {
  const shaderAssembler = new ShaderAssembler();

  const program = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  const preDefaultModuleProgram = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    modules: [dirlight]
  });

  const preDefaultModuleSource = preDefaultModuleProgram.fs;

  shaderAssembler.addDefaultModule(dirlight);

  const defaultModuleProgram = shaderAssembler.assembleShaders(platformInfo, {vs, fs});
  const moduleProgram = shaderAssembler.assembleShaders(platformInfo, {
    vs,
    fs,
    modules: [dirlight]
  });

  t.ok(program !== defaultModuleProgram, 'Program with new default module properly cached');
  t.ok(
    preDefaultModuleProgram !== defaultModuleProgram,
    'Adding a default module changes the program hash'
  );
  t.ok(
    preDefaultModuleProgram.fs === defaultModuleProgram.fs,
    'Default module injected correctly'
  );
  t.ok(
    moduleProgram === defaultModuleProgram,
    'Program with new default module matches regular module'
  );

  shaderAssembler.removeDefaultModule(dirlight);

  const noDefaultModuleProgram = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  t.ok(program.fs === noDefaultModuleProgram.fs, 'Default module was removed');
  t.ok(moduleProgram.fs !== noDefaultModuleProgram.fs, 'Default module was removed');

  // Reset program manager

  shaderAssembler.addDefaultModule(dirlight);
  const uncachedProgram = shaderAssembler.assembleShaders(platformInfo, {vs, fs});
  const defaultModuleSource = uncachedProgram.fs;

  t.ok(defaultModuleProgram !== uncachedProgram, 'Program is not cached');
  t.ok(preDefaultModuleSource === defaultModuleSource, 'Default modules create correct source');

  t.end();
});

test('ShaderAssembler#release', (t) => {
  const shaderAssembler = new ShaderAssembler();

  const program1 = shaderAssembler.assembleShaders(platformInfo, {vs, fs});
  const program2 = shaderAssembler.assembleShaders(platformInfo, {vs, fs});

  t.equal(program1, program2, 'Program not deleted when still referenced.');

  t.end();
});

test('ShaderAssembler#transpileToGLSL100', (t) => {
  const shaderAssembler = new ShaderAssembler();

  t.throws(() => {
    shaderAssembler.assembleShaders(platformInfo, {
      vs: VS_300,
      fs: FS_300
    });
  }, 'Can\'t compile 300 shader with WebGL 1');

  t.doesNotThrow(() => {
    shaderAssembler.assembleShaders(platformInfo, {
      vs: VS_300,
      fs: FS_300,
      transpileToGLSL100: true
    });
  }, 'Can compile transpiled 300 shader with WebGL 1');

  const programTranspiled = shaderAssembler.assembleShaders(platformInfo, {vs, fs, transpileToGLSL100: true});
  const programUntranspiled = shaderAssembler.assembleShaders(platformInfo, {vs, fs});
  const programTranspiled2 = shaderAssembler.assembleShaders(platformInfo, {vs, fs, transpileToGLSL100: true});

  t.equals(programTranspiled, programTranspiled2, 'Transpiled programs match');
  t.notEquals(
    programTranspiled,
    programUntranspiled,
    'Transpiled program does not match untranspiled program'
  );

  t.end();
});
