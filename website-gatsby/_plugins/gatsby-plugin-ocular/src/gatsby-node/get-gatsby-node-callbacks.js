const {log, COLOR} = require('../utils/log');

const createPages = require('./create-pages');
const {processNewMarkdownNode, cleanupMarkdownNode, addSiblingNodes} = require('./process-nodes-markdown');
const {processNewDocsJsonNode} = require('./process-nodes-json');

// TODO/ib - avoid globals
const docNodes = {};

function onCreateWebpackConfig({ actions }, pluginOptions) {
  log.log({color: COLOR.CYAN}, 'Updating webpack config')(); //, pluginOptions.webpack)();
  actions.setWebpackConfig(Object.assign({
  	// nulling out `fs` avoids issues with certain node modules getting bundled,
  	// e.g. headless-gl gets bundled by luma.gl if installed in root folder
    node: { fs: 'empty' },
  }, pluginOptions.webpack));
}

function onCreateNode({ node, actions, getNode }) {
  // log.log({color: COLOR.CYAN}, `Processed node`)();

  // Add missing fields to markdown nodes
  cleanupMarkdownNode({ node, actions, getNode });

  switch (node.internal.type) {
  case "MarkdownRemark":
    // Note: MarkdownRemark nodes are created by the gatsby-transformer-remark
    // markdown parser. These are different from the original file nodes
    // for the markdown files created by the gatsby-source-filesystem plugin.
    processNewMarkdownNode({ node, actions, getNode }, docNodes);
    break;

  case 'DocsJson':
    processNewDocsJsonNode({ node, actions, getNode }, docNodes);
    break;

  default:
  }
}

function setFieldsOnGraphQLNodeType({ type, actions }) {
  const { name } = type;
  const { createNodeField } = actions;
  if (name === "MarkdownRemark") {
    addSiblingNodes(createNodeField);
  }
};

// gatsby-node default implementation, user can just export these from gatsby-node
module.exports = function getGatsbyNodeCallbacks() {
  return {
    onCreateWebpackConfig,
    onCreateNode,
    setFieldsOnGraphQLNodeType,
    createPages
  };
}
