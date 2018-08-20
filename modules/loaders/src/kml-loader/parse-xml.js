/* global DOMParser */
export default function parseXML(xml) {
  if (window.DOMParser) {
    const xmlDoc = new window.DOMParser().parseFromString(xml, 'application/xml');
    const parseError = isXMLParseError(xmlDoc);
    if (parseError) {
      throw new Error(parseError);
    }
    return xmlDoc;
  }

  if (typeof window.ActiveXObject !== 'undefined') {
    const xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
    if (xmlDoc) {
      xmlDoc.async = 'false';
      xmlDoc.loadXML(xml);
      return xmlDoc;
    }
  }

  throw new Error('No XML parser available');
}

export function parseXMLSupported() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.DOMParser) {
    return true;
  }

  if (typeof window.ActiveXObject !== 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
    return true;
  }

  return false;
}

function isXMLParseError(parsedDocument) {
  const parser = new DOMParser();
  const erroneousParse = parser.parseFromString('<', 'text/xml');
  const parsererrorNS = erroneousParse.getElementsByTagName('parsererror')[0].namespaceURI;

  if (parsererrorNS === 'http://www.w3.org/1999/xhtml') {
    // In PhantomJS the parseerror element doesn't seem to have a special namespace,
    // so we are just guessing here :(
    const errorElements = parsedDocument.getElementsByTagName('parsererror');
    return errorElements.length ? errorElements[0].innerHTML : null;
  }

  return parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0;
}

