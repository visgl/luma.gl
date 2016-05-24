import test from '../../setup';
import {loadImage} from '../../../src';

/* eslint-disable max-len */
const PNG_BITS = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=';
/* eslint-enable max-len */
const DATA_URL = `data:image/png;base64,${PNG_BITS}`;

test('io#read-image', t => {
  loadImage(DATA_URL)
  .then(image => {
    t.equals(image.width, 2, 'width');
    t.equals(image.height, 2, 'height');
    t.end();
  });
});
