import test from 'tape-promise/tape';
import {cloneTextureFrom} from '@luma.gl/webgl-legacy/webgl-utils/texture-utils';
import {Texture2D} from '@luma.gl/webgl-legacy';
import {fixture} from 'test/setup';
import GL from '@luma.gl/constants';

test('texture-utils#cloneTextureFrom', (t) => {
  const {gl} = fixture;
  const refTextureOptions = {
    width: 10,
    height: 20,
    glFormat: GL.RGBA,
    dataFormat: GL.RGBA,
    type: GL.UNSIGNED_BYTE
  };
  const overrides = {
    width: 100,
    height: 50
  };
  const expected = Object.assign({}, refTextureOptions, overrides);

  const ref2DTexture = new Texture2D(gl, refTextureOptions);
  const cloned2DTexture = cloneTextureFrom(ref2DTexture, overrides);
  t.ok(cloned2DTexture instanceof Texture2D, 'Texture2D object should be created');
  for (const name in expected) {
    t.equal(cloned2DTexture[name], expected[name], `Should set correct value for ${name}`);
  }
  t.end();
});
