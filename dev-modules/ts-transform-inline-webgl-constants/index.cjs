// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Bootstrap this constants-only bundle before compiling core. Loading the complete
// core package here would require the build output that this transformer produces.
const {GL} = require('../../modules/core/dist/webgl-constants/index.cjs');

module.exports = function inlineWebGLConstants(program, pluginConfig, {ts: typescript}) {
  return context => sourceFile => {
    function visitNode(node) {
      if (
        (typescript.isPropertyAccessExpression(node) || typescript.isElementAccessExpression(node)) &&
        typescript.isIdentifier(node.expression) &&
        (node.expression.text === 'GL' || node.expression.text === 'gl')
      ) {
        const isPropertyAccess = typescript.isPropertyAccessExpression(node);
        const property = isPropertyAccess ? node.name : node.argumentExpression;
        const isConstantName = isPropertyAccess
          ? typescript.isIdentifier(property)
          : typescript.isStringLiteral(property);
        if (isConstantName && property.text in GL) {
          return context.factory.createNumericLiteral(GL[property.text]);
        }
      }
      return typescript.visitEachChild(node, visitNode, context);
    }
    return typescript.visitNode(sourceFile, visitNode);
  };
};
