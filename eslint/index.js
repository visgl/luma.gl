module.exports = {
  rules: {
    'check-log-call': {
      create: function(context) {
        return {
          CallExpression(node) {
            if (
              node.callee &&
              node.callee.object &&
              node.callee.object.name === 'log' &&
              node.parent &&
              node.parent.type !== 'CallExpression'
            ) {
              context.report(node, 'Use log.' + node.callee.property.name + '(...)()');
            }
          }
        };
      }
    }
  }
};
