/* eslint-disable max-len */
import test from 'tape-catch';
import {OBJLoader, KMLLoader, smartParse} from 'loaders.gl';

import KML from '../data/kml/KML_Samples.kml';

const LOADERS = [
  OBJLoader, KMLLoader
];

test('smartFetch', t => {
  if (!KMLLoader.supported) {
    t.comment('XML parsing not available');
  } else {
    const data = smartParse(KML, 'KML_Samples.kml', LOADERS);
    t.equal(data.documents.length, 2, 'Documents were found');
    t.equal(data.markers.length, 4, 'Markers were found');
    t.equal(data.lines.length, 6, 'Lines were found');
    t.equal(data.polygons.length, 9, 'Polygons were found');
    t.equal(data.overlays.length, 1, 'Overlay was found');
    for (const key in data) {
      for (const object of data[key]) {
        t.comment(`${key}: ${JSON.stringify(object)}`);
      }
    }
  }
  t.end();
});
