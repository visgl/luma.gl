import DRACODecompressor from '../draco-compression/draco-decompressor';

export default function parseDRACO(
  arrayBuffer, dracoDecoder, callback, attributeUniqueIdMap, attributeTypeMap
) {
  const dracoDecompressor = new DRACODecompressor();

  const dracoGeometry = dracoDecompressor.decompressGeometry(arrayBuffer);

  // Here is how to use Draco Javascript decoder and get the geometry.
  try {
    normalizeDRACOGeometry(dracoGeometry);
  } finally {
    dracoDecompressor.destroyGeometry(dracoGeometry);
    dracoDecompressor.destroy();
  }
}

function normalizeDRACOGeometry(dracoGeometry) {
  // console.error(dracoGeometry);
  // const decoder = new dracoDecoder.Decoder();
  // const geometryType = decoder.GetEncodedGeometryType(buffer);

  // switch (geometryType) {

  //   case dracoDecoder.TRIANGULAR_MESH:
  //     if (options.verbosity > 0) {
  //       console.log('Loaded a mesh.');
  //     }
  //     break;

  //   case dracoDecoder.POINT_CLOUD:
  //     if (options.verbosity > 0) {
  //       console.log('Loaded a point cloud.');
  //     }
  //     break;

  //   default:
  //     const errorMsg = 'DRACOLoader: Unknown geometry type.';
  //     console.error(errorMsg);
  //     throw new Error(errorMsg);
  // }

  // callback(this.convertDracoGeometryTo3JS(dracoDecoder, decoder,
  //     geometryType, buffer, attributeUniqueIdMap, attributeTypeMap));

}
