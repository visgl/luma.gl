// Attributions
// * Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng

const mimeTypeMap = new Map([
  ['image/png', getPngSize],
  ['image/jpeg', getJpegSize],
  ['image/gif', getGifSize],
  ['image/bmp', getBmpSize]
]);

const ERR_INVALID_TYPE = `Invalid MIME type. Supported MIME types are: ${Array.from(
  mimeTypeMap.keys()
).join(', ')}`;

/**
 * Sniffs the contents of a file to attempt to deduce the image type and extract image size.
 * Supported image types are PNG, JPEG, GIF and BMP.
 *
 * @param {Buffer} contents
 * @param {string} [mimeType]
 */
export function getImageSize(contents, mimeType) {
  // Looking for only a specific MIME type.
  if (mimeType) {
    const handler = mimeTypeMap.get(mimeType);
    if (!handler) {
      throw new Error(ERR_INVALID_TYPE);
    }

    const result = handler(contents);
    if (!result) {
      throw new Error(`invalid image data for type: ${mimeType}`);
    }
    return result;
  }

  // Loop through each file type and see if they work.
  for (const [supportedMimeType, handler] of mimeTypeMap.entries()) {
    const result = handler(contents);
    if (result) {
      result.mimeType = supportedMimeType;
      return result;
    }
  }

  // Seems not :(
  throw new Error(ERR_INVALID_TYPE);
}

/**
 * Extract size from a binary PNG file
 * @param {Buffer} contents
 */
function getPngSize(contents) {
  // Check file contains the first 4 bytes of the PNG signature.
  if (contents.readUInt32BE(0) !== 0x89504e47) {
    return null;
  }

  return {
    width: contents.readUInt32BE(16),
    height: contents.readUInt32BE(20)
  };
}

/**
 * Extract size from a binary GIF file
 * @param {Buffer} contents
 * TODO: GIF is not this simple
 */
function getGifSize(contents) {
  // Check first 4 bytes of the GIF signature ("GIF8").
  if (contents.readUInt32BE(0) !== 0x47494638) {
    return null;
  }

  // GIF is little endian.
  return {
    width: contents.readUInt16LE(6),
    height: contents.readUInt16LE(8)
  };
}

/**
 * @param {Buffer} contents
 * TODO: BMP is not this simple
 */
function getBmpSize(contents) {
  // Check magic number is valid (first 2 characters should be "BM").
  if (contents.readUInt16BE(0) !== 0x424d) {
    return null;
  }

  // BMP is little endian.
  return {
    width: contents.readUInt32LE(18),
    height: contents.readUInt32LE(22)
  };
}

/**
 * Extract size from a binary JPEG file
 * @param {Buffer} contents
 */
function getJpegSize(contents) {
  // Check file contains the JPEG "start of image" (SOI) marker.
  if (contents.readUInt16BE(0) !== 0xffd8) {
    return null;
  }

  const {tableMarkers, sofMarkers} = getJpegMarkers();

  // Exclude the two byte SOI marker.
  let i = 2;
  while (i < contents.length) {
    const marker = contents.readUInt16BE(i);

    // The frame that contains the width and height of the JPEG image.
    if (sofMarkers.has(marker)) {
      return {
        height: contents.readUInt16BE(i + 5), // Number of lines
        width: contents.readUInt16BE(i + 7) // Number of pixels per line
      };
    }

    // Miscellaneous tables/data preceding the frame header.
    if (!tableMarkers.has(marker)) {
      return null;
    }

    // Length includes size of length parameter but not the two byte header.
    i += 2;
    i += contents.readUInt16BE(i);
  }

  return null;
}

function getJpegMarkers() {
  // Tables/misc header markers.
  // DQT, DHT, DAC, DRI, COM, APP_n
  const tableMarkers = new Set([0xffdb, 0xffc4, 0xffcc, 0xffdd, 0xfffe]);
  for (let i = 0xffe0; i < 0xfff0; ++i) {
    tableMarkers.add(i);
  }

  // SOF markers and DHP marker.
  // These markers are after tables/misc data.
  const sofMarkers = new Set([
    0xffc0,
    0xffc1,
    0xffc2,
    0xffc3,
    0xffc5,
    0xffc6,
    0xffc7,
    0xffc9,
    0xffca,
    0xffcb,
    0xffcd,
    0xffce,
    0xffcf,
    0xffde
  ]);

  return {tableMarkers, sofMarkers};
}
