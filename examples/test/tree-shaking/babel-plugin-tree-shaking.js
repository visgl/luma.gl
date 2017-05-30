'use strict';

// Mark transpiled classes as __PURE__ so that UglifyJS can remove them
module.exports = function () {
  return {
    visitor: {
      ClassExpression: function ClassExpression(path) {
        path.addComment('leading', '#__PURE__');
      }
    }
  };
};
