/* eslint-disable max-len */
import test from 'tape-catch';
import {PLYLoader} from 'loaders.gl';

import PLY from '../data/ply/cube_att.ply.js';

test('PLYLoader#parseText', t => {
  const data = PLYLoader.parseText(PLY);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.vertices.length, 72, 'position attribute was found');
  t.equal(data.attributes.normals.length, 72, 'Color attribute was found');
  t.equal(data.attributes.indices.length, 36, 'Color attribute was found');

  t.end();
});

test('PLYLoader#parseBinary', t => {
  const path = require('path');
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
    return;
  }

  const file = fs.readFileSync(path.resolve(__dirname, '../data/ply/bun_zipper.ply'));
  // const binaryPLY = toArrayBuffer(file);

  const data = PLYLoader.parseText(file);

  t.ok(data.header, 'Documents were found');

  t.end();
});
