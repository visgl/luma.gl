// This plugin is not needed for babel 7
const COLOR_RESET = '\x1b[0m';
const COLOR_YELLOW = '\x1b[33m';

// Mark transpiled classes as __PURE__ so that UglifyJS can remove them
module.exports = function _() {
  return {
    visitor: {
      ClassExpression: function ClassExpression(path) {
        const name = path && path.parent && path.parent.id && path.parent.id.name;
        // eslint-disable-next-line
        console.error(`  ==> emitting __PURE__ class ${COLOR_YELLOW}${name}${COLOR_RESET}`);
        path.addComment('leading', '#__PURE__');
      }
    }
  };
};
