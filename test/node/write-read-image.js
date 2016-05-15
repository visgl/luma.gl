import test from 'tape';
import io from '../../io'
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

const TEST_DIR = path.join(__dirname, '..', 'data');
const TEST_FILE = path.join(TEST_DIR, 'test.png');

test('io#read-write-image', t => {
  t.plan(1);

  const image = {
    width: 2,
    height: 3,
    data: new Uint8Array([
      255, 0, 0, 255, 0, 255, 255, 255,
      0, 0, 255, 255, 255, 255, 0, 255,
      0, 255, 0, 255, 255, 0, 255, 255
    ])
  };

  mkdirp(TEST_DIR, (err) => {
    if (err) {
      throw err;
    }
    const file = fs.createWriteStream(TEST_FILE);
    file.on('close', (err) => {
      io.loadImage(TEST_FILE)
        .then((result) => {
          t.same(result, image)
        });
    });
    io.compressImage(image).pipe(file);
  });
});
