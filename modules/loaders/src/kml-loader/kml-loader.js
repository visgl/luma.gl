import KMLReader from './kml-reader';
import {parseXMLSupported} from './parse-xml';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseText(text) {
  const kmlLoader = new KMLReader(text);
  return kmlLoader.parse();
}

export default {
  name: 'KML',
  extension: 'kml',
  supported: parseXMLSupported(),
  testText,
  parseText,
  browserOnly: true,
  worker: false
};

