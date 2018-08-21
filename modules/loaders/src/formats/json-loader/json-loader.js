
function parseText(text, options) {
  if (options.fast) {
    return JSON.parse(text);
  }
  throw new Error('JSONLoader');
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: null,
  parseText
};
