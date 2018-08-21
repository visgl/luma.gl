import parseXML, {parseXMLSupported} from './parse-xml';

const XML_HEADER = '<?xml';

function testText(text) {
  return text.startsWith(XML_HEADER);
}

export default {
  name: 'KML',
  extension: 'kml',
  supported: parseXMLSupported(),
  testText,
  parseText: parseXML,
  browserOnly: true,
  worker: false
};

