import log, {COLOR} from '../utils/log';
import {getSiteConfig} from '../gatsby-config/site-config';

const path = require("path");

// PATHS TO REACT PAGES
const INDEX_PAGE = path.resolve(__dirname, '../pages/index.jsx');

// PATHS TO REACT COMPONENTS
const DOC_PAGE = path.resolve(__dirname, '../templates/doc.jsx');
const EXAMPLE_PAGE = path.resolve(__dirname, '../templates/example.jsx');

// const POST_PAGE = path.resolve('../src/templates/post.jsx');
// const TAG_PAGE = path.resolve(__dirname, '../src/templates/tag.jsx');
// const CATEGORY_PAGE = path.resolve(__dirname, '../src/templates/category.jsx');

// This is a main gatsby entry point
// Here we get to programmatically create pages after all nodes are created
// by gatsby.
// We use graphgl to query for nodes and iterate
export default function createPages({ graphql, actions }) {
  log.log({color: COLOR.BLUE}, 'ocular generating pages')();

  createStaticPages({ graphql, actions });

  createExamplePages({ graphql, actions });

  const promise = Promise.all([
    createDocPages({ graphql, actions })
  ]);

  return promise;
}

function createStaticPages({ graphql, actions }) {
  const { createPage } = actions;

  createPage({
    component: INDEX_PAGE,
    path: '/'
  });
}

function createExamplePages({ graphql, actions }) {
  const { createPage } = actions;

  const {DEMOS} = getSiteConfig();

  for (const demoName in DEMOS) {
    const demo = DEMOS[demoName];

    log.log({color: COLOR.CYAN}, `Creating example page ${JSON.stringify(demo)}`)();

    createPage({
      path: demo.path,
      component: EXAMPLE_PAGE,
      context: {
        slug: demoName
      }
    });
  }

}

// Walks all markdown nodes and creates a doc page for each node
function createDocPages({ graphql, actions }) {
  const { createPage } = actions;

  // for (const key in docNodes) {
  //   const node = docNodes[key];
  //   console.log(node.fields.slug, node.fields.path);
  // }

  return new Promise((resolve, reject) => {
    resolve(
      graphql(
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
      ).then(result => {
        if (result.errors) {
          /* eslint no-console: "off" */
          console.log(result.errors);
          reject(result.errors);
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
              slug: edge.node.fields.path
            }
          });
        });

      })
    );
  });
};
