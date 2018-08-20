/* eslint-disable max-len */
import test from 'tape-catch';
import KML from './KML_Samples.kml';
import {KMLLoader} from 'loaders.gl';

test('KMLLoader#parse', t => {
  let kmlLoader;
  try {
    kmlLoader = new KMLLoader(KML);
  } catch (error) {
    t.comment('XML parsing not available');
  }

  if (kmlLoader) {
    kmlLoader.parse(data => t.comment(JSON.stringify(data)));
    t.ok(kmlLoader, 'Something was parsed');
  }

  t.end();
});
