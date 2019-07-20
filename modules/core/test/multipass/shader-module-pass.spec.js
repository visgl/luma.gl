// import {Model} from '@luma.gl/core';
import {_ShaderModulePass as ShaderModulePass, Framebuffer} from '@luma.gl/core';
import {edgeWork} from '@luma.gl/effects';
// import {normalizeShaderModule} from '@luma.gl/shadertools';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('ShaderModulePass#constructor', t => {
  const {gl} = fixture;

  let sp = new ShaderModulePass(gl, edgeWork);
  t.ok(sp instanceof ShaderModulePass, 'should construct TexturePass object');

  sp = null;
  sp = new ShaderModulePass(
    gl,
    edgeWork,
    {enable: false},
    'should construct TexturePass object with custom props'
  );
  t.end();
});

test('ShaderModulePass#_renderPass', t => {
  const {gl} = fixture;

  const sp = new ShaderModulePass(gl, edgeWork);

  t.doesNotThrow(
    () =>
      sp._renderPass({
        inputBuffer: new Framebuffer(gl),
        swapBuffers: () => {}
      }),
    'render should work'
  );
  t.end();
});
