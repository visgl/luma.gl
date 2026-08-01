const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;

export function parseUSDZArchive(arrayBuffer: ArrayBuffer): Map<string, ArrayBuffer> {
  const view = new DataView(arrayBuffer);
  const directoryOffset = findCentralDirectory(view);
  const entryCount = view.getUint16(directoryOffset + 10, true);
  let entryOffset = view.getUint32(directoryOffset + 16, true);
  const files = new Map<string, ArrayBuffer>();
  const textDecoder = new TextDecoder();

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
    if (view.getUint32(entryOffset, true) !== CENTRAL_DIRECTORY_ENTRY) {
      throw new Error('USDZ archive contains an invalid ZIP central-directory entry.');
    }

    const compression = view.getUint16(entryOffset + 10, true);
    const compressedLength = view.getUint32(entryOffset + 20, true);
    const filenameLength = view.getUint16(entryOffset + 28, true);
    const extraLength = view.getUint16(entryOffset + 30, true);
    const commentLength = view.getUint16(entryOffset + 32, true);
    const localOffset = view.getUint32(entryOffset + 42, true);
    const filename = textDecoder.decode(
      new Uint8Array(arrayBuffer, entryOffset + 46, filenameLength)
    );

    if (compression !== 0) {
      throw new Error(`USDZ entry "${filename}" is compressed; USDZ requires stored ZIP entries.`);
    }
    if (view.getUint32(localOffset, true) !== LOCAL_FILE_HEADER) {
      throw new Error(`USDZ entry "${filename}" has an invalid local ZIP header.`);
    }

    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const contentOffset = localOffset + 30 + localNameLength + localExtraLength;
    files.set(filename, arrayBuffer.slice(contentOffset, contentOffset + compressedLength));
    entryOffset += 46 + filenameLength + extraLength + commentLength;
  }

  return files;
}

function findCentralDirectory(view: DataView): number {
  const minimumOffset = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset--) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  throw new Error('USDZ archive does not contain a ZIP end-of-central-directory record.');
}
