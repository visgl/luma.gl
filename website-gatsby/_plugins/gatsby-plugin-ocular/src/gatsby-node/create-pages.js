const path = require('path');
const assert = require('assert');

const {log, COLOR} = require('../utils/log');

// PATHS TO REACT PAGES
const INDEX_PAGE = path.resolve(__dirname, '../templates/index.jsx');

const DOC_PAGE = path.resolve(__dirname, '../templates/doc-n.jsx');

const EXAMPLES_PAGE = path.resolve(__dirname, '../templates/examples.jsx');
const EXAMPLE_PAGE = path.resolve(__dirname, '../templates/example-n.jsx');

assert(INDEX_PAGE && DOC_PAGE && EXAMPLES_PAGE && EXAMPLE_PAGE);

// const POST_PAGE = path.resolve('../src/templates/post.jsx');
// const TAG_PAGE = path.resolve(__dirname, '../src/templates/tag.jsx');
// const CATEGORY_PAGE = path.resolve(__dirname, '../src/templates/category.jsx');

// This is a main gatsby entry point
// Here we get to programmatically create pages after all nodes are created
// by gatsby.
// We use graphgl to query for nodes and iterate
module.exports = function createPages({ graphql, actions }, pluginOptions, x, y) {
  log.log({color: COLOR.CYAN}, 'ocular generating pages', pluginOptions, x, y)();

  const {
    docPages = true,
    examplePages = true // TODO - autodetect based on DEMOS config
  } = pluginOptions;

  createStaticPages({ graphql, actions });

  let docPromise;
  if (docPages) {
    docPromise = createDocPages({ graphql, actions });
  }

  let examplesPromise;
  if (examplePages) {
    examplesPromise = createExamplePages({ graphql, actions });
  }

  return Promise.all([docPromise, examplesPromise]);
}

// Create static pages
// NOTE: gatsby does automatically build pages from **top level** `/pages`, folder
// but in ocular we keep those pages in the installed structure so gatsby can't see them

function createStaticPages({ graphql, actions }) {
  const { createPage } = actions;

  createPage({
    component: INDEX_PAGE,
    path: '/',
  });

}

function createExamplePages({ graphql, actions }) {
  const { createPage } = actions;

  return graphql(`
    {
      site {
        siteMetadata {
          config {
            EXAMPLES {
              title
              path
            }
          }
        }
      }
    }
  `)
  .then(result => {
    console.log(result);

    if (result.errors) {
      /* eslint no-console: "off" */
      console.log(result.errors);
      throw new Error(result.errors);
    }

    const {EXAMPLES} = result.data.site.siteMetadata.config;


    createPage({
      component: EXAMPLES_PAGE,
      path: '/examples',
      context: {
        toc: 'examples'
      }
    });

    for (const demo of EXAMPLES) {
      const demoName = demo.title;

      log.log({color: COLOR.CYAN}, `Creating example page ${JSON.stringify(demo)}`)();

      createPage({
        path: demo.path,
        component: EXAMPLE_PAGE,
        context: {
          slug: demoName,
          toc: 'examples'
        }
      });
    }
  });
}

// Walks all markdown nodes and creates a doc page for each node
function createDocPages({ graphql, actions }) {
  const { createPage } = actions;

  return graphql(
    `
      {
        allMarkdownRemark {
          edges {
            node {
              fileAbsolutePath
              frontmatter {
                tags
                category
              }
              fields {
                slug
                path
              }
            }
          }
        }
      }
    `
  )
  .then(result => {
    if (result.errors) {
      /* eslint no-console: "off" */
      console.log(result.errors);
      throw new Error(result.errors);
    }

    const tagSet = new Set();
    const categorySet = new Set();
    result.data.allMarkdownRemark.edges.forEach(edge => {
      if (edge.node.frontmatter.tags) {
        edge.node.frontmatter.tags.forEach(tag => {
          tagSet.add(tag);
        });
      }

      if (edge.node.frontmatter.category) {
        categorySet.add(edge.node.frontmatter.category);
      }

      // console.log('Creating doc page at', edge.node.fields.path);

      createPage({
        path: edge.node.fields.path,
        component: DOC_PAGE,
        context: {
          slug: edge.node.fields.path,
          toc: 'docs'
        }
      });
    });
  });
}
