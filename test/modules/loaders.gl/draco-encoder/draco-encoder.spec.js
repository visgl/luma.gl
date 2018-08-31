// const fs = require('fs');
// const path = require('path');

// import {DRACOEncoder} from 'loaders.gl';

import test from 'tape-catch';

test('pack-and-unpack-buffers', t => {
  /*
  const dracoCompressor = new DRACOEncoder();

  fs.readFile(path.resolve(__dirname, './bunny.drc'), (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Decoding file of size ${data.byteLength}...`);

    // Decode mesh
    const decodedGeometry = dracoCompressor.decodeDracoData(data, decoder);

    // Encode mesh
    const outputBuffer = dracoCompressor.encodeMesh(decodedGeometry, decoder);

    // Write to file. You can view the the file using webgl_loader_draco.html
    // example.
    fs.writeFile('bunny_10.drc', Buffer(outputBuffer), 'binary', err => {
      if (err) {
        t.fail(err);
      } else {
        t.pass('The file was saved!');
      }
    });

    decoderModule.destroy(decoder);
    decoderModule.destroy(decodedGeometry);
  });

  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  */
  t.end();
});
