import parseXML, {parseXMLSupported} from './parse-xml';

const XML_HEADER = '<?xml';

function testText(text) {
  return text.startsWith(XML_HEADER);
}

function parseText(text) {
  return parseXML(text);
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

