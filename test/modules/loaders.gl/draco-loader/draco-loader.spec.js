/* eslint-disable max-len */
import test from 'tape-catch';
import {DRACOLoader} from 'loaders.gl';
import {toArrayBuffer} from 'loaders.gl/common/loader-utils';

// import PCD from '../data/pcd/simple-ascii.pcd';

// test('DRACOLoader#parseText', t => {
//   const binaryPCD = new TextEncoder().encode(PCD);

//   const data = DRACOLoader.parseBinary(binaryPCD);

//   t.ok(data.header, 'Documents were found');
//   t.equal(data.attributes.position.length, 639, 'position attribute was found');
//   t.equal(data.attributes.color.length, 639, 'Color attribute was found');

//   t.end();
// });

test('DRACOLoader#parseBinary', t => {
  const path = require('path');
  const fs = module.require && module.require('fs');
  if (!fs) {
    t.comment('binary data tests only available under Node.js');
    t.end();
    return;
  }

  const file = fs.readFileSync(path.resolve(__dirname, '../data/draco/bunny.drc'));
  const binary = toArrayBuffer(file);

  const data = DRACOLoader.parseBinary(binary);

  t.ok(data.header, 'Documents were found');
  // t.comment(JSON.stringify(data));
  t.equal(data.attributes.POSITION.length, 104502, 'position attribute was found');

  t.end();
});
