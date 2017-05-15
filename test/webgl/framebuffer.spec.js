import test from 'tape-catch';
import 'luma.gl/headless';
import {createGLContext, Framebuffer, makeDebugContext} from 'luma.gl';

const fixture = {
  gl: makeDebugContext(createGLContext())
};

test('WebGL#Framebuffer construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Framebuffer(),
    /.*WebGLRenderingContext.*/,
    'Framebuffer throws on missing gl context');

  const framebuffer = new Framebuffer(gl);
  t.ok(framebuffer instanceof Framebuffer,
    'Framebuffer construction successful');

  framebuffer.delete();
  t.ok(framebuffer instanceof Framebuffer,
    'Framebuffer delete successful');

  framebuffer.delete();
  t.ok(framebuffer instanceof Framebuffer,
    'Framebuffer repeated delete successful');

  t.end();
});

test('WebGL#Framebuffer resize', t => {
  const {gl} = fixture;

  const framebuffer = new Framebuffer(gl);
  t.ok(framebuffer instanceof Framebuffer,
    'Framebuffer construction successful');

  framebuffer.resize({width: 1000, height: 1000});
  t.doesNotThrow(() => framebuffer.checkStatus(),
    'Framebuffer resize successful');

  framebuffer.resize({width: 100, height: 100});
  t.doesNotThrow(() => framebuffer.checkStatus(),
    'Framebuffer resize successful');

  t.end();
});
