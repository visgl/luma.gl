import DRACODecoder from './draco-decoder';

function parseDRACO(arrayBuffer, options) {
  const dracoDecoder = new DRACODecoder();
  return dracoDecoder.decode(arrayBuffer, options);
}

export default {
  name: 'DRACO',
  extension: 'drc',
  parseBinary: parseDRACO
};
