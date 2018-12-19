const minimatch = require("minimatch")
const path = require('path');

const INLINE_COMMENT_REGEX = /\s*\/\/.*/g;
const BLOCK_COMMENT_REGEX = /\s*\/\*(\*(?!\/)|[^*])*\*\//g;
const DEFAULT_PATTERNS = ['*.js'];

module.exports = function _(opts) {
  return {
    visitor: {
      StringLiteral(path, state) {
        if(filterFile(state)) {
          path.node.value = path.node.value.replace(INLINE_COMMENT_REGEX, '').replace(BLOCK_COMMENT_REGEX, '');
        }
      }
    }
  };
};

function filterFile(state) {
  const filename = state.file.opts.filename;
  const patterns = state.opts.patterns || DEFAULT_PATTERNS;

  return patterns.some(function(p) {
    if (p[0] === '.') {
      p = path.resolve(p);
    }
    return minimatch(filename, p);
  });
}
