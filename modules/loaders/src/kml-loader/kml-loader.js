import XMLLoader from '../formats/xml-loader/xml-loader';
import KMLParser from './kml-parser';
import normalizeKML from './kml-normalizer';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

const DEFAULT_KML_OPTIONS = {
  normalize: true
};

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseText(text, options = DEFAULT_KML_OPTIONS) {
  const xml = XMLLoader.parseText(text);
  const kmlLoader = new KMLParser(xml);
  const kml = kmlLoader.parse();
  return options.normalize ? normalizeKML(kml) : kml;
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

