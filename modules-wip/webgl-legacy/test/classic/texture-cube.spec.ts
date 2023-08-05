import test from 'tape-promise/tape';
import {TextureCube} from '@luma.gl/webgl-legacy';
import {GL} from '@luma.gl/constants';

import {fixture} from 'test/setup';

test('WebGL#TextureCube construct/delete', (t) => {
  const {gl} = fixture;

  t.throws(
    // @ts-expect-error
    () => new TextureCube(),
    /.*WebGLRenderingContext.*/,
    'TextureCube throws on missing gl context'
  );

  const texture = new TextureCube(gl);
  t.ok(texture instanceof TextureCube, 'TextureCube construction successful');

  t.comment(JSON.stringify(texture.getParameters({keys: true})));

  texture.destroy();
  t.ok(texture instanceof TextureCube, 'TextureCube delete successful');

  texture.destroy();
  t.ok(texture instanceof TextureCube, 'TextureCube repeated delete successful');

  t.end();
});

test('WebGL#TextureCube buffer update', (t) => {
  const {gl} = fixture;

  let texture = new TextureCube(gl);
  t.ok(texture instanceof TextureCube && texture.handle, 'TextureCube construction successful');

  texture.destroy();
  t.ok(texture instanceof TextureCube && !texture.handle, 'TextureCube delete successful');

  t.end();
});

test('WebGL#TextureCube multiple LODs', (t) => {
  const {gl} = fixture;

  const texture = new TextureCube(gl, {
    data: {
      [GL.TEXTURE_CUBE_MAP_POSITIVE_X]: [],
      [GL.TEXTURE_CUBE_MAP_NEGATIVE_X]: [],
      [GL.TEXTURE_CUBE_MAP_POSITIVE_Y]: [],
      [GL.TEXTURE_CUBE_MAP_NEGATIVE_Y]: [],
      [GL.TEXTURE_CUBE_MAP_POSITIVE_Z]: [],
      [GL.TEXTURE_CUBE_MAP_NEGATIVE_Z]: []
    }
  });
  t.ok(texture instanceof TextureCube, 'TextureCube construction successful');

  t.end();
});
