const logFunctions = new Set([
  'warn',
  'error',
  'deprecated',
  'removed',
  'probe',
  'log',
  'info',
  'once',
  'table',
  'image',
  'time',
  'timeEnd',
  'timeStamp',
  'group',
  'groupCollapsed',
  'groupEnd',
  'withGroup'
]);

module.exports = {
  create: (context) => {
    return {
      CallExpression: (node) => {
        if (
          node.callee &&
          node.callee.object &&
          node.callee.object.name === 'log' &&
          logFunctions.has(node.callee.property.name) &&
          node.parent &&
          node.parent.type !== 'CallExpression'
        ) {
          context.report({
            node,
            message: `Use log.${node.callee.property.name}(...)()`,
            fix: (fixer) => {
              return fixer.insertTextAfter(node, '()');
            }
          });
        }
      }
    };
  }
};
