import test from 'tape-catch';
import {Texture3D} from 'luma.gl';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#Texture3D construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Texture3D(),
    /.*WebGLRenderingContext.*/,
    'Texture3D throws on missing gl context');

  const texture = new Texture3D(gl);
  t.ok(texture instanceof Texture3D, 'Texture3D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.delete();
  t.ok(texture instanceof Texture3D, 'Texture3D delete successful');

  texture.delete();
  t.ok(texture instanceof Texture3D, 'Texture3D repeated delete successful');

  t.end();
});

test('WebGL#Texture3D buffer update', t => {
  const {gl} = fixture;

  let texture = new Texture3D(gl);
  t.ok(texture instanceof Texture3D, 'Texture3D construction successful');

  texture = texture.delete();
  t.ok(texture instanceof Texture3D, 'Texture3D delete successful');

  t.end();
});
