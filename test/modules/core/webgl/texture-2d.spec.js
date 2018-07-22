import test from 'tape-catch';
import {Texture2D} from 'luma.gl';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#Texture2D construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Texture2D(),
    /.*WebGLRenderingContext.*/,
    'Texture2D throws on missing gl context');

  const texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D repeated delete successful');

  t.end();
});

test('WebGL#Texture2D buffer update', t => {
  const {gl} = fixture;

  let texture = new Texture2D(gl);
  t.ok(texture instanceof Texture2D, 'Texture2D construction successful');

  texture = texture.delete();
  t.ok(texture instanceof Texture2D, 'Texture2D delete successful');

  t.end();
});
