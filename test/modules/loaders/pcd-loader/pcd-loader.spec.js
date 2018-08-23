/* eslint-disable max-len */
import test from 'tape-catch';
import {PCDLoader} from 'loaders.gl';
import {TextEncoder} from 'loaders.gl/common/loader-utils';

import PCD from './simple-ascii.pcd';

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD);

  const data = PCDLoader.parseBinary(binaryPCD);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.position.length, 639, 'position attribute was found');
  t.equal(data.attributes.color.length, 639, 'Color attribute was found');

  t.end();
});
