import test from 'tape-catch';
import {Texture3D} from 'luma.gl';

import {fixture} from 'test/setup';
/* eslint-disable */
test.only('WebGL#Texture3D construct/delete', t => {
  const gl = fixture.gl2;

  console.log(gl);

  t.throws(
    () => new Texture3D(),
    /.*WebGLRenderingContext.*/,
    'Texture3D throws on missing gl context'
  );

  let texture = new Texture3D(gl);
  t.ok(texture instanceof Texture3D, 'Texture3D construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture = new Texture3D(gl, {
    width: 1,
    height: 1,
    depth: 1,
    pixels: new Uint8Array(1),
    format: gl.RED,
    dataFormat: gl.R8
  });

  t.ok(gl.getError() === gl.NO_ERROR, 'Texture3D construction produces no errors');

  texture.delete();
  t.ok(!gl.isTexture(texture.handle), `Texture GL object was deleted`);
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
