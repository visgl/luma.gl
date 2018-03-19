import test from 'tape-catch';
import {createGLContext, TextureCube} from 'luma.gl';

const fixture = {
  gl: createGLContext()
};

test('WebGL#TextureCube construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new TextureCube(),
    /.*WebGLRenderingContext.*/,
    'TextureCube throws on missing gl context');

  const texture = new TextureCube(gl);
  t.ok(texture instanceof TextureCube, 'TextureCube construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.delete();
  t.ok(texture instanceof TextureCube, 'TextureCube delete successful');

  texture.delete();
  t.ok(texture instanceof TextureCube, 'TextureCube repeated delete successful');

  t.end();
});

test('WebGL#TextureCube buffer update', t => {
  const {gl} = fixture;

  let texture = new TextureCube(gl);
  t.ok(texture instanceof TextureCube, 'TextureCube construction successful');

  texture = texture.delete();
  t.ok(texture instanceof TextureCube, 'TextureCube delete successful');

  t.end();
});
