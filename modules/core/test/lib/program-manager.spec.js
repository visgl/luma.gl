/* eslint-disable camelcase */
import {ProgramManager} from '@luma.gl/core';
import {picking} from '@luma.gl/shadertools';
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

  const program1 = pm.get(vs, fs);

  t.ok(program1, 'Got a program');

  const program2 = pm.get(vs, fs);

  t.ok(program1 === program2, 'Got cached program');

  const defineProgram1 = pm.get(vs, fs, {
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(program1 !== defineProgram1, 'Define triggers new program');

  const defineProgram2 = pm.get(vs, fs, {
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(defineProgram1 === defineProgram2, 'Got cached program with defines');

  const moduleProgram1 = pm.get(vs, fs, {
    modules: [picking]
  });

  t.ok(program1 !== moduleProgram1, 'Module triggers new program');

  const moduleProgram2 = pm.get(vs, fs, {
    modules: [picking]
  });

  t.ok(moduleProgram1 === moduleProgram2, 'Got cached program with modules');

  t.end();
});
