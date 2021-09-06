import GL from '@luma.gl/constants';
import luma from '@luma.gl/webgl/init';
// TODO - Model test should not depend on Cube
import {Model, ProgramManager} from '@luma.gl/engine';
import {Buffer} from '@luma.gl/webgl';
import {CubeGeometry} from '@luma.gl/engine';
import {picking} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';
import {fixture} from 'test/setup';

import {getBuffersFromGeometry} from '@luma.gl/engine/lib/model-utils';

const stats = luma.stats.get('Resource Counts');

const DUMMY_VS = `
  void main() { gl_Position = vec4(1.0); }
`;

const DUMMY_FS = `
  precision highp float;
  void main() { gl_FragColor = vec4(1.0); }
`;

const VS_300 = `#version 300 es

  in vec4 positions;
  in vec2 uvs;

  out vec2 vUV;

  void main() {
    vUV = uvs;
    gl_Position = positions;
  }
`;

const FS_300 = `#version 300 es
  precision highp float;

  in vec2 vUV;

  uniform sampler2D tex;

  out vec4 fragColor;
  void main() {
    fragColor = texture(tex, vUV);
  }
`;

test('Model#construct/destruct', (t) => {
  const {gl} = fixture;

  // Avoid re-using program from ProgramManager
  const vs = '/* DO_NOT_CACHE Model#construct/destruct */ void main() {gl_Position = vec4(0.0);}';
  const fs = '/* DO_NOT_CACHE Model#construct/destruct */ void main() {gl_FragColor = vec4(0.0);}';

  const model = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  t.ok(model, 'Model constructor does not throw errors');
  t.ok(model.id, 'Model has an id');
  t.ok(model.getProgram().handle, 'Created new program');

  model.delete();
  t.notOk(model.vertexArray.handle, 'Deleted vertexArray');
  t.notOk(model.program.handle, 'Deleted program');

  t.end();
});

test('Model#multiple delete', (t) => {
  const {gl} = fixture;

  // Avoid re-using program from ProgramManager
  const vs = '/* DO_NOT_CACHE Model#construct/destruct */ void main() {gl_Position = vec4(0.0);}';
  const fs = '/* DO_NOT_CACHE Model#construct/destruct */ void main() {gl_FragColor = vec4(0.0);}';

  const model1 = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  const model2 = new Model(gl, {
    drawMode: GL.POINTS,
    vertexCount: 0,
    vs,
    fs
  });

  model1.delete();
  t.ok(model2.program.handle, 'program still in use');
  model1.delete();
  t.ok(model2.program.handle, 'program still in use');
  model2.delete();
  t.notOk(model2.program.handle, 'program is released');

  t.end();
});

test('Model#setAttribute', (t) => {
  const {gl} = fixture;

  const buffer1 = new Buffer(gl, {accessor: {size: 2}, data: new Float32Array(4).fill(1)});
  const buffer2 = new Buffer(gl, {data: new Float32Array(8)});

  const initialActiveBuffers = stats.get('Buffers Active').count;

  const model = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS, geometry: new CubeGeometry()});

  t.is(
    stats.get('Buffers Active').count - initialActiveBuffers,
    4,
    'Created new buffers for attributes'
  );

  model.setAttributes({
    instanceSizes: [buffer1, {size: 1}],
    instancePositions: buffer2,
    instanceWeight: new Float32Array([10]),
    instanceColors: {getValue: () => new Float32Array([0, 0, 0, 1])}
  });

  t.deepEqual(model.getAttributes(), {}, 'no longer stores local attributes');

  t.is(stats.get('Buffers Active').count - initialActiveBuffers, 4, 'Did not create new buffers');

  model.delete();

  buffer1.delete();
  buffer2.delete();

  t.end();
});

test('Model#setters, getters', (t) => {
  const {gl} = fixture;

  const model = new Model(gl, {vs: DUMMY_VS, fs: DUMMY_FS});

  model.setUniforms({
    isPickingActive: 1
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  model.setInstanceCount(4);
  t.is(model.getInstanceCount(), 4, 'instance count is set');

  model.setDrawMode(1);
  t.is(model.getDrawMode(), 1, 'draw mode is set');

  model.delete();

  t.end();
});

test('Model#draw', (t) => {
  const {gl} = fixture;

  const model = new Model(gl, {
    vs: DUMMY_VS,
    fs: DUMMY_FS,
    geometry: new CubeGeometry(),
    timerQueryEnabled: true
  });

  model.draw();

  model.render({
    isPickingActive: 1
  });
  t.deepEqual(model.getUniforms(), {isPickingActive: 1}, 'uniforms are set');

  t.end();
});

test('Model#program management', (t) => {
  const {gl} = fixture;

  const pm = new ProgramManager(gl);

  const vs = `
    uniform float x;

    void main() {
      gl_Position = vec4(x);
    }
  `;

  const fs = `
    void main() {
      gl_FragColor = vec4(1.0);
    }
  `;

  const model1 = new Model(gl, {
    programManager: pm,
    vs,
    fs,
    uniforms: {
      x: 0.5
    }
  });

  const model2 = new Model(gl, {
    programManager: pm,
    vs,
    fs,
    uniforms: {
      x: -0.5
    }
  });

  t.ok(model1.program === model2.program, 'Programs are shared.');

  model1.draw();
  t.deepEqual(model1.getUniforms(), model1.program.uniforms, 'Program uniforms set');

  model2.draw();
  t.deepEqual(model2.getUniforms(), model2.program.uniforms, 'Program uniforms set');

  model2.setProgram({
    vs,
    fs,
    defines: {
      MY_DEFINE: true
    }
  });

  t.ok(model1.program === model2.program, 'Program not updated before draw.');

  model2.draw();
  t.ok(model1.program !== model2.program, 'Program updated after draw.');
  t.deepEqual(model2.getUniforms(), model2.program.uniforms, 'Program uniforms set');

  // This part is checking that the use counts
  // don't get bloated by multiple checks.
  const model3 = new Model(gl, {
    programManager: pm,
    vs,
    fs,
    defines: {
      MODEL3_DEFINE1: true
    }
  });

  const oldProgram = model3.program;

  // Check for program updates a few times
  model3.draw();
  model3.draw();

  model3.setProgram({
    vs,
    fs,
    defines: {
      MODEL3_DEFINE2: true
    }
  });

  model3.draw();
  t.ok(model3.program !== oldProgram, 'Program updated after draw.');
  t.ok(oldProgram.handle === null, 'Old program released after update');

  t.end();
});

test('Model#program management - getModuleUniforms', (t) => {
  const {gl} = fixture;

  const pm = new ProgramManager(gl);

  const vs = 'void main() {}';
  const fs = 'void main() {}';

  const model = new Model(gl, {
    programManager: pm,
    vs,
    fs
  });

  t.deepEqual(model.getModuleUniforms(), {}, 'Module uniforms empty with no modules');

  model.setProgram({
    vs,
    fs,
    modules: [picking]
  });

  t.deepEqual(
    model.getModuleUniforms(),
    picking.getUniforms(),
    'Module uniforms correct after update'
  );

  t.end();
});

test('Model#getBuffersFromGeometry', (t) => {
  const {gl} = fixture;

  let buffers = getBuffersFromGeometry(gl, {
    indices: new Uint16Array([0, 1, 2, 3]),
    attributes: {
      positions: {size: 3, value: new Float32Array(12)},
      colors: {constant: true, value: [255, 255, 255, 255]},
      uvs: {size: 2, value: new Float32Array(8)}
    }
  });

  t.deepEqual(buffers.colors, [255, 255, 255, 255], 'colors mapped');
  t.ok(buffers.positions[0] instanceof Buffer, 'positions mapped');
  t.is(buffers.positions[1].size, 3, 'positions mapped');
  t.ok(buffers.uvs[0] instanceof Buffer, 'uvs mapped');
  t.is(buffers.uvs[1].size, 2, 'uvs mapped');
  t.ok(buffers.indices[0] instanceof Buffer, 'indices mapped');

  buffers.positions[0].delete();
  buffers.uvs[0].delete();
  buffers.indices[0].delete();

  // Inferring attribute size
  buffers = getBuffersFromGeometry(gl, {
    attributes: {
      indices: {value: new Uint16Array([0, 1, 2, 3])},
      normals: {value: new Float32Array(12)},
      texCoords: {value: new Float32Array(8)}
    }
  });
  t.is(buffers.indices[1].size, 1, 'texCoords size');
  t.is(buffers.normals[1].size, 3, 'normals size');
  t.is(buffers.texCoords[1].size, 2, 'texCoords size');

  buffers.indices[0].delete();
  buffers.normals[0].delete();
  buffers.texCoords[0].delete();

  t.throws(
    () =>
      getBuffersFromGeometry(gl, {
        indices: [0, 1, 2, 3]
      }),
    'invalid indices'
  );

  t.throws(
    () =>
      getBuffersFromGeometry(gl, {
        attributes: {
          heights: {value: new Float32Array([0, 1, 2, 3])}
        }
      }),
    'invalid size'
  );

  t.end();
});

test('Model#transpileToGLSL100', (t) => {
  const {gl} = fixture;

  let model;

  t.throws(() => {
    model = new Model(gl, {
      vs: VS_300,
      fs: FS_300
    });
  }, "Can't compile 300 shader with WebGL 1");

  t.doesNotThrow(() => {
    model = new Model(gl, {
      vs: VS_300,
      fs: FS_300,
      transpileToGLSL100: true
    });
  }, 'Can compile transpiled 300 shader with WebGL 1');

  t.ok(model.program, 'Created a program');
  t.end();
});
