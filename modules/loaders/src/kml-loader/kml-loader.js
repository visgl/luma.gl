import XMLLoader from '../formats/xml-loader/xml-loader';
import KMLParser from './kml-parser';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseText(text) {
  const xml = XMLLoader.parseText(text);
  const kmlLoader = new KMLParser(xml);
  return kmlLoader.parse();
}

export default {
  name: 'KML',
  extension: 'kml',
  supported: XMLLoader.supported,
  testText,
  parseText,
  browserOnly: true,
  worker: false
};

