/* eslint-disable max-len */
import test from 'tape-catch';
import {PCDLoader} from 'loaders.gl';
import {TextEncoder, toArrayBuffer} from 'loaders.gl/common/loader-utils';

import PCD from '../data/pcd/simple-ascii.pcd.js';

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD);

  const data = PCDLoader.parseBinary(binaryPCD);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.position.length, 639, 'position attribute was found');
  t.equal(data.attributes.color.length, 639, 'Color attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const path = require('path');
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
    return;
  }

  const file = fs.readFileSync(path.resolve(__dirname, '../data/pcd/Zaghetto.pcd'));
  const binaryPCD = toArrayBuffer(file);

  const data = PCDLoader.parseBinary(binaryPCD);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.position.length, 179250, 'position attribute was found');

  t.end();
});
