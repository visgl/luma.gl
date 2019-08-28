/* eslint-disable camelcase */
import {ProgramManager} from '@luma.gl/core';
import {dirlight, picking} from '@luma.gl/shadertools';
import {fixture} from 'test/setup';
import test from 'tape-catch';

const vs = `\
attribute vec4 positions;

void main(void) {
  gl_Position = positions;
}
`;
const fs = `\
precision highp float;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

test('ProgramManager#import', t => {
  t.ok(ProgramManager !== undefined, 'ProgramManager import successful');
  t.end();
});

test('ProgramManager#basic', t => {
  const {gl} = fixture;
  const pm = new ProgramManager(gl);

  const program1 = pm.get({vs, fs});

  t.ok(program1, 'Got a program');

  const program2 = pm.get({vs, fs});

  t.ok(program1 === program2, 'Got cached program');

  const defineProgram1 = pm.get({
    vs,
    fs,
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== defineProgram1, 'Define triggers new program');

  const defineProgram2 = pm.get({
    vs,
    fs,
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(defineProgram1 === defineProgram2, 'Got cached program with defines');

  const moduleProgram1 = pm.get({
    vs,
    fs,
    modules: [picking]
  });

  t.ok(program1 !== moduleProgram1, 'Module triggers new program');
  t.ok(defineProgram1 !== moduleProgram1, 'Module triggers new program');

  const moduleProgram2 = pm.get({
    vs,
    fs,
    modules: [picking]
  });

  t.ok(moduleProgram1 === moduleProgram2, 'Got cached program with modules');

  const defineModuleProgram1 = pm.get({
    vs,
    fs,
    modules: [picking],
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== defineModuleProgram1, 'Module and define triggers new program');
  t.ok(defineProgram1 !== defineModuleProgram1, 'Module and define triggers new program');
  t.ok(moduleProgram1 !== defineModuleProgram1, 'Module and define triggers new program');

  const defineModuleProgram2 = pm.get({
    vs,
    fs,
    modules: [picking],
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(
    defineModuleProgram1 === defineModuleProgram2,
    'Got cached program with modules and defines'
  );

  t.end();
});

test('ProgramManager#hooks', t => {
  const {gl} = fixture;
  const pm = new ProgramManager(gl);

  const preHookProgram = pm.get({vs, fs});

  pm.addShaderHook('vs:LUMAGL_pickColor(inout vec4 color)');
  pm.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {
    header: 'if (color.a == 0.0) discard;\n',
    footer: 'color.a *= 1.2;\n'
  });

  const postHookProgram = pm.get({vs, fs});

  t.ok(preHookProgram !== postHookProgram, 'Adding hooks changes hash');

  pm.addModuleInjection(picking, {
    hook: 'vs:LUMAGL_pickColor',
    injection: 'picking_setPickingColor(color.rgb);'
  });
  pm.addModuleInjection(picking, {
    hook: 'fs:LUMAGL_fragmentColor',
    injection: 'color = picking_filterColor(color);',
    order: Number.POSITIVE_INFINITY
  });

  const postInjectionProgram = pm.get({vs, fs});
  t.ok(preHookProgram !== postInjectionProgram, 'Adding hooks and injections changes hash');
  t.ok(postHookProgram !== postInjectionProgram, 'Adding injections changes hash');

  const noModuleProgram = pm.get({vs, fs});

  t.ok(preHookProgram !== noModuleProgram, 'Adding hooks changes hash');

  const noModuleVs = noModuleProgram.vs.source;
  const noModuleFs = noModuleProgram.fs.source;

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

  const modulesProgram = pm.get({
    vs,
    fs,
    modules: [picking]
  });
  const modulesVs = modulesProgram.vs.source;
  const modulesFs = modulesProgram.fs.source;

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

  const injectProgram = pm.get({
    vs,
    fs,
    inject: {
      'vs:LUMAGL_pickColor': 'color *= 0.1;',
      'fs:LUMAGL_fragmentColor': 'color += 0.1;'
    }
  });
  const injectVs = injectProgram.vs.source;
  const injectFs = injectProgram.fs.source;

  t.ok(injectVs.indexOf('color *= 0.1') > -1, 'argument injection code included in shader hook');
  t.ok(injectFs.indexOf('color += 0.1') > -1, 'argument injection code included in shader hook');

  t.end();
});

test('ProgramManager#defaultModules', t => {
  const {gl} = fixture;
  const pm = new ProgramManager(gl);

  const program = pm.get({vs, fs});

  const moduleProgram = pm.get({
    vs,
    fs,
    modules: [dirlight]
  });

  const moduleSource = moduleProgram.fs.source;

  pm.addDefaultModule(dirlight);

  const defaultModuleProgram = pm.get({vs, fs});

  t.ok(program !== defaultModuleProgram, 'Program with new default module properly cached');
  t.ok(
    moduleProgram === defaultModuleProgram,
    'Program with new default module matches regular module'
  );

  pm.removeDefaultModule(dirlight);

  const noDefaultModuleProgram = pm.get({vs, fs});

  t.ok(program === noDefaultModuleProgram, 'Default module was removed');
  t.ok(moduleProgram !== noDefaultModuleProgram, 'Default module was removed');

  // Reset program manager
  pm.release(program);
  pm.release(moduleProgram);
  pm.release(defaultModuleProgram);
  pm.release(noDefaultModuleProgram);

  pm.addDefaultModule(dirlight);
  const uncachedProgram = pm.get({vs, fs});
  const defaultModuleSource = uncachedProgram.fs.source;

  t.ok(defaultModuleProgram !== uncachedProgram, 'Program is not cached');
  t.ok(moduleSource === defaultModuleSource, 'Default modules create correct source');

  t.end();
});

test('ProgramManager#release', t => {
  const {gl} = fixture;
  const pm = new ProgramManager(gl);

  const program1 = pm.get({vs, fs});
  const program2 = pm.get({vs, fs});

  pm.release(program1);

  t.ok(program1.handle !== null, 'Program not deleted when still referenced.');

  pm.release(program2);

  t.ok(program2.handle === null, 'Program deleted when all references released.');

  t.end();
});
