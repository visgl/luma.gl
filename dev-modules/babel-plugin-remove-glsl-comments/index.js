const minimatch = require('minimatch');

// inline comment is only safe to remove if it's followed by a return (i.e. end of comment)
const INLINE_COMMENT_REGEX = /\s*\/\/.*[\n\r]/g;
const BLOCK_COMMENT_REGEX = /\s*\/\*(\*(?!\/)|[^*])*\*\//g;
const DEFAULT_PATTERNS = ['**/*.js'];

module.exports = function _(opts) {
  return {
    visitor: {
      TemplateLiteral(path, state) {
        if (filterFile(state)) {
          path.node.quasis.forEach((node) => {
            node.value = {
              raw: handleString(node.value.raw),
              cooked: handleString(node.value.cooked)
            };
          });
        }
      },
      StringLiteral(path, state) {
        if (filterFile(state)) {
          path.node.value = handleString(path.node.value);
        }
      }
    }
  };
};

function filterFile(state) {
  const {filename} = state;
  const patterns = state.opts.patterns || DEFAULT_PATTERNS;

  return patterns.some((p) => {
    return minimatch(filename, p);
  });
}

function handleString(str) {
  return str.replace(INLINE_COMMENT_REGEX, '\n').replace(BLOCK_COMMENT_REGEX, '');
}
