// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
import test from 'tape-catch';
import {getImageSize} from 'loaders.gl/common/loader-utils/get-image-size';

import path from 'path';

let testFiles;

// only load test files under node.js for now
function loadTestFiles() {
  const fs = module.require && module.require('fs');
  if (!testFiles && fs) {
    testFiles = new Map(['png', 'jpeg', 'gif', 'bmp', 'tiff'].map(type => {
      const imagePath = path.resolve(__dirname, `../../data/images/img1-preview.${type}`);
      const image = fs.readFileSync(imagePath);
      return [type, image];
    }));
  }
  return testFiles;
}

function testImage(t, typeToTest, acceptableTypes, canThrow) {
  const files = loadTestFiles();
  if (!files) {
    t.comment('get-image-size tests currently only work under Node.js');
    return;
  }

  acceptableTypes = new Set(acceptableTypes);
  for (const [type, image] of files) {
    const shouldPass = acceptableTypes.has(type);
    const buffer = image;

    const mimeType = typeToTest !== 'all' ? `image/${typeToTest}` : undefined;
    if (shouldPass) {
      const dimensions = getImageSize(buffer, mimeType);
      t.equals(dimensions.width, 480, `width, should work with ${type.toUpperCase()} files`);
      t.equals(dimensions.height, 320, `height, should work with ${type.toUpperCase()} files`);
    } else if (canThrow) {
      t.throws(() => getImageSize(buffer, mimeType),
        `should not work with ${type.toUpperCase()} files`);
    // } else {
    //   t.equals(getImageSize[typeToTest](buffer), null,
    //     `should not work with ${type.toUpperCase()} files`);
    }
  }
}

test('getImageSize#png', t => {
  testImage(t, 'png', ['png']);
  t.end();
});

test('getImageSize#jpeg', t => {
  testImage(t, 'jpeg', ['jpeg']);
  t.end();
});

test('getImageSize#gif', t => {
  testImage(t, 'gif', ['gif']);
  t.end();
});

test('getImageSize#bmp', t => {
  testImage(t, 'bmp', ['bmp']);
  t.end();
});

test('getImageSize#all', t => {
  testImage(t, 'all', ['png', 'jpeg', 'gif', 'bmp'], true);
  t.end();
});
