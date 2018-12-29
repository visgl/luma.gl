// import log, {COLOR} from '../utils/log';

import createPages from './create-pages';
import {processNewMarkdownNode, cleanupMarkdownNode, addSiblingNodes} from './process-nodes-markdown';
import {processNewDocsJsonNode} from './process-nodes-json';

// TODO/ib - avoid globals
let globalOptions = {};
const docNodes = {};

export function onCreateWebpackConfig({ actions }) {
  // log.log({color: COLOR.BLUE}, 'Updating webpack config')();
  actions.setWebpackConfig(Object.assign({
  	// nulling out `fs` avoids issues with certain node modules getting bundled,
  	// e.g. headless-gl gets bundled by luma.gl if installed in root folder
    node: { fs: 'empty' },
  }, globalOptions.webpack));
}

export function onCreateNode({ node, actions, getNode }) {
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

export function setFieldsOnGraphQLNodeType({ type, actions }) {
  const { name } = type;
  const { createNodeField } = actions;
  if (name === "MarkdownRemark") {
    addSiblingNodes(createNodeField);
  }
};

// gatsby-node default implementation, user can just export these from gatsby-node
export default function getGatsbyConfig(options = {}) {
  globalOptions = options;
  return {
    onCreateWebpackConfig,
    onCreateNode,
    setFieldsOnGraphQLNodeType,
    createPages
  };
}
