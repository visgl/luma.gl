import test from 'tape';
import io from '../../io'
import bl from 'bl';

const PNG_BITS = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII='
const DATA_URL = 'data:image/png;base64,' + PNG_BITS

test('io#read-write-image', t => {
  t.plan(3)
  io.loadImage(DATA_URL)
    .then((image) => {
      t.equals(image.width, 2, 'width')
      t.equals(image.height, 2, 'height')
      io.compressImage(image).pipe(bl(function (err, data) {
        t.equals(data.toString('base64'), PNG_BITS, 'data')
      }))
    });
});
