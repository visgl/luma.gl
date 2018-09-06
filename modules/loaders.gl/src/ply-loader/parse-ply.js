// PLY Loader, adapted from THREE.js (MIT license)
//
// Attributions per original THREE.js source file:
//
// @author Wei Meng / http://about.me/menway
//
// Description: A loader for PLY ASCII files (known as the Polygon File Format
// or the Stanford Triangle Format).
//
// Limitations: ASCII decoding assumes file is UTF-8.
//
// If the PLY file uses non standard property names, they can be mapped while
// loading. For example, the following maps the properties
// “diffuse_(red|green|blue)” in the file to standard color names.
//
// parsePLY(data, {
//   propertyNameMapping: {
//     diffuse_red: 'red',
//     diffuse_green: 'green',
//     diffuse_blue: 'blue'
//   }
// });

import TextDecoder from '../common/loader-utils/text-decoder';

export default function parsePLY(data, options = {}) {
  let attributes;
  let header;

  if (data instanceof ArrayBuffer) {
    const text = new TextDecoder().decode(data);
    header = parseHeader(text, options);
    attributes = header.format === 'ascii' ? parseASCII(text, header) : parseBinary(data, header);
  } else {
    header = parseHeader(data, options);
    attributes = parseASCII(data, header);
  }

  return {
    header,
    attributes,
    accessors: normalizeAttributes(attributes)
  };
}

function normalizeAttributes(attributes) {
  const accessors = {};

  // mandatory attributes data

  if (attributes.indices.length > 0) {
    accessors.indices = {value: attributes.indices, size: 1};
  }

  accessors.position = {value: attributes.vertices, size: 3};

  // optional attributes data

  if (attributes.normals.length > 0) {
    accessors.normal = {value: attributes.normals, size: 3};
  }

  if (attributes.uvs.length > 0) {
    accessors.uv = {value: attributes.uvs, size: 2};
  }

  if (attributes.colors.length > 0) {
    accessors.color = {value: attributes.colors, size: 3};
  }

  return accessors;

}

function parseHeader(data, options) {

  const patternHeader = /ply([\s\S]*)end_header\s/;
  let headerText = '';
  let headerLength = 0;
  const result = patternHeader.exec(data);

  if (result !== null) {
    headerText = result[1];
    headerLength = result[0].length;
  }

  const header = {
    comments: [],
    elements: [],
    headerLength
  };

  const lines = headerText.split('\n');
  let currentElement;
  let lineType;
  let lineValues;

  for (let i = 0; i < lines.length; i++) {

    let line = lines[i];
    line = line.trim();

    if (line === '') {
      // eslint-disable-next-line
      continue;
    }

    lineValues = line.split(/\s+/);
    lineType = lineValues.shift();
    line = lineValues.join(' ');

    switch (lineType) {
    case 'format':
      header.format = lineValues[0];
      header.version = lineValues[1];
      break;

    case 'comment':
      header.comments.push(line);
      break;

    case 'element':
      if (currentElement !== undefined) {
        header.elements.push(currentElement);
      }

      currentElement = {};
      currentElement.name = lineValues[0];
      currentElement.count = parseInt(lineValues[1], 10);
      currentElement.properties = [];
      break;

    case 'property':
      currentElement.properties.push(
        makePLYElementProperty(lineValues, options.propertyNameMapping)
      );
      break;

    default:
      // eslint-disable-next-line
      console.log('unhandled', lineType, lineValues);
    }

  }

  if (currentElement !== undefined) {
    header.elements.push(currentElement);
  }

  return header;
}

function makePLYElementProperty(propertValues, propertyNameMapping) {
  const property = {
    type: propertValues[0]
  };

  if (property.type === 'list') {
    property.name = propertValues[3];
    property.countType = propertValues[1];
    property.itemType = propertValues[2];
  } else {
    property.name = propertValues[1];
  }

  if (propertyNameMapping && property.name in propertyNameMapping) {
    property.name = propertyNameMapping[property.name];
  }

  return property;
}

// eslint-disable-next-line complexity
function parseASCIINumber(n, type) {
  switch (type) {
  case 'char':
  case 'uchar':
  case 'short':
  case 'ushort':
  case 'int':
  case 'uint':
  case 'int8':
  case 'uint8':
  case 'int16':
  case 'uint16':
  case 'int32':
  case 'uint32':
    return parseInt(n, 10);

  case 'float':
  case 'double':
  case 'float32':
  case 'float64':
    return parseFloat(n);

  default:
    throw new Error(type);
  }
}

function parseASCIIElement(properties, line) {

  const values = line.split(/\s+/);

  const element = {};

  for (let i = 0; i < properties.length; i++) {

    if (properties[i].type === 'list') {

      const list = [];
      const n = parseASCIINumber(values.shift(), properties[i].countType);

      for (let j = 0; j < n; j++) {
        list.push(parseASCIINumber(values.shift(), properties[i].itemType));
      }

      element[properties[i].name] = list;

    } else {

      element[properties[i].name] = parseASCIINumber(values.shift(), properties[i].type);

    }

  }

  return element;
}

function parseASCII(data, header) {

  // PLY ascii format specification, as per http://en.wikipedia.org/wiki/PLY_(file_format)

  const attributes = {
    indices: [],
    vertices: [],
    normals: [],
    uvs: [],
    colors: []
  };

  let result;

  const patternBody = /end_header\s([\s\S]*)$/;
  let body = '';
  if ((result = patternBody.exec(data)) !== null) {
    body = result[1];
  }

  const lines = body.split('\n');
  let currentElement = 0;
  let currentElementCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.trim();

    if (line !== '') {
      if (currentElementCount >= header.elements[currentElement].count) {
        currentElement++;
        currentElementCount = 0;
      }

      const element = parseASCIIElement(header.elements[currentElement].properties, line);
      handleElement(attributes, header.elements[currentElement].name, element);
      currentElementCount++;
    }
  }

  return attributes;
}

function handleElement(buffer, elementName, element) {

  if (elementName === 'vertex') {

    buffer.vertices.push(element.x, element.y, element.z);

    if ('nx' in element && 'ny' in element && 'nz' in element) {
      buffer.normals.push(element.nx, element.ny, element.nz);
    }

    if ('s' in element && 't' in element) {
      buffer.uvs.push(element.s, element.t);
    }

    if ('red' in element && 'green' in element && 'blue' in element) {
      buffer.colors.push(element.red / 255.0, element.green / 255.0, element.blue / 255.0);
    }
  } else if (elementName === 'face') {
    const vertexIndices = element.vertex_indices || element.vertex_index; // issue #9338

    if (vertexIndices.length === 3) {
      buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[2]);
    } else if (vertexIndices.length === 4) {
      buffer.indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[3]);
      buffer.indices.push(vertexIndices[1], vertexIndices[2], vertexIndices[3]);
    }
  }
}

// eslint-disable-next-line complexity
function binaryRead(dataview, at, type, littleEndian) {

  switch (type) {

  // corespondences for non-specific length types here match rply:
  case 'int8':
  case 'char':
    return [dataview.getInt8(at), 1];
  case 'uint8':
  case 'uchar':
    return [dataview.getUint8(at), 1];
  case 'int16':
  case 'short':
    return [dataview.getInt16(at, littleEndian), 2];
  case 'uint16':
  case 'ushort':
    return [dataview.getUint16(at, littleEndian), 2];
  case 'int32':
  case 'int':
    return [dataview.getInt32(at, littleEndian), 4];
  case 'uint32':
  case 'uint':
    return [dataview.getUint32(at, littleEndian), 4];
  case 'float32':
  case 'float':
    return [dataview.getFloat32(at, littleEndian), 4];
  case 'float64':
  case 'double':
    return [dataview.getFloat64(at, littleEndian), 8];

  default:
    throw new Error(type);
  }

}

function binaryReadElement(dataview, at, properties, littleEndian) {
  const element = {};
  let result;
  let read = 0;

  for (let i = 0; i < properties.length; i++) {

    if (properties[i].type === 'list') {

      const list = [];

      result = binaryRead(dataview, at + read, properties[i].countType, littleEndian);
      const n = result[0];
      read += result[1];

      for (let j = 0; j < n; j++) {
        result = binaryRead(dataview, at + read, properties[i].itemType, littleEndian);
        list.push(result[0]);
        read += result[1];
      }

      element[properties[i].name] = list;

    } else {

      result = binaryRead(dataview, at + read, properties[i].type, littleEndian);
      element[properties[i].name] = result[0];
      read += result[1];

    }

  }

  return [element, read];

}

function parseBinary(data, header) {
  const attributes = {
    indices: [],
    vertices: [],
    normals: [],
    uvs: [],
    colors: []
  };

  const littleEndian = (header.format === 'binary_littleEndian');
  const body = new DataView(data, header.headerLength);
  let result;
  let loc = 0;

  for (let currentElement = 0; currentElement < header.elements.length; currentElement++) {
    const count = header.elements[currentElement].count;
    for (let currentElementCount = 0; currentElementCount < count; currentElementCount++) {

      result = binaryReadElement(
        body, loc, header.elements[currentElement].properties, littleEndian);
      loc += result[1];
      const element = result[0];

      handleElement(attributes, header.elements[currentElement].name, element);

    }

  }

  return attributes;
}
