import test from 'tape-promise/tape';
import {UniformBufferLayout} from '@luma.gl/core';

/** Tests that UniformBufferLayout can handle struct and array composite types */
test('UniformBufferLayout#composite types', t => {
  const layout = new UniformBufferLayout({
    settings: {
      members: {
        brightness: 'f32',
        contrast: 'f32'
      }
    },
    offsets: {type: 'vec4<f32>', length: 2}
  });

  t.ok(layout.has('settings.brightness'), 'struct member brightness present');
  t.ok(layout.has('settings.contrast'), 'struct member contrast present');
  t.ok(layout.has('offsets[0]'), 'array element 0 present');
  t.ok(layout.has('offsets[1]'), 'array element 1 present');

  const data = layout.getData({
    settings: {brightness: 1, contrast: 2},
    offsets: [
      [1, 2, 3, 4],
      [5, 6, 7, 8]
    ]
  });

  const f32 = new Float32Array(data.buffer, 0, layout.byteLength / 4);
  t.equal(f32[layout.get('settings.brightness')!.offset], 1, 'brightness value written');
  t.equal(f32[layout.get('settings.contrast')!.offset], 2, 'contrast value written');
  t.deepEqual(
    Array.from(
      f32.slice(
        layout.get('offsets[0]')!.offset,
        layout.get('offsets[0]')!.offset + 4
      )
    ),
    [1, 2, 3, 4],
    'offsets[0] value written'
  );
  t.deepEqual(
    Array.from(
      f32.slice(
        layout.get('offsets[1]')!.offset,
        layout.get('offsets[1]')!.offset + 4
      )
    ),
    [5, 6, 7, 8],
    'offsets[1] value written'
  );
  t.end();
});
