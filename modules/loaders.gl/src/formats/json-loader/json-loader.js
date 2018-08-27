
function parseText(text, options) {
  return JSON.parse(text);
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: null,
  parseText
};
