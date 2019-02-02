import test from 'tape-catch';
import {Texture2DArray} from 'luma.gl2';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#Texture2DArray', tt => {
  if (!Texture2DArray.isSupported(fixture.gl)) {
    tt.comment('- Texture2DArray not supported, skipping tests');
    tt.end();
    return;
  }

  test('WebGL#Texture2DArray construct/delete', t => {
    const {gl2} = fixture;

    t.throws(
      () => new Texture2DArray(),
      /.*WebGLRenderingContext.*/,
      'Texture2DArray throws on missing gl context'
    );

    const texture = new Texture2DArray(gl2);
    t.ok(texture instanceof Texture2DArray, 'Texture2DArray construction successful');

    texture.delete();
    t.ok(texture instanceof Texture2DArray, 'Texture2DArray delete successful');

    texture.delete();
    t.ok(texture instanceof Texture2DArray, 'Texture2DArray repeated delete successful');

    t.end();
  });

  test('WebGL#Texture2DArray parameters', t => {
    const {gl2} = fixture;

    const texture = new Texture2DArray(gl2);
    t.ok(texture instanceof Texture2DArray, 'Texture2DArray construction successful');

    const params = texture.getParameters({keys: true});
    t.comment(JSON.stringify(params));

    t.end();
  });
});
