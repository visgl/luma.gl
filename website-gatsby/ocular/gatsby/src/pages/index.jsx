import React from 'react'
import { graphql } from 'gatsby'
import {ContextConsumerComponent} from '../components/layout/persistent-layout';

import Home from '../components/home';

import '../components/layout/graphql-fragments';

export const query = graphql`
  fragment SiteConfigFragment on Site {
    siteMetadata {
      config {
        siteTitle,
        siteLogo,
        siteDescription,
        PROJECT_NAME,
        PROJECT_TYPE,
        HOME_HEADING,
        HOME_BULLETS {
          text
          desc
          img
        }
      }
    }
  }

  fragment MarkdownNodeFragment on MarkdownRemark {
    id
    fields {
      slug
    }
    frontmatter {
      title
    }
  }

  query IndexQuery {
    site {
      ...SiteConfigFragment
    },

    allMarkdown: allMarkdownRemark(
      limit: 2000
    ) {
      edges {
        node {
          ...MarkdownNodeFragment
        }
      }
    },

    tableOfContents: docsJson {
      chapters {
        title
        level
        chapters {
          title
          level
          entries {
            id
            childMarkdownRemark {
              id
              frontmatter {
                title
              }
              fields {
                slug
              }
            }
          }
        }
        entries {
          id
          childMarkdownRemark {
            id
            frontmatter {
              title
            }
            fields {
              slug
            }
          }
        }
      }
    }
  }
`;

export default class Index extends React.Component {
  render() {
    // const {pageContext} = this.props;

    const {data} = this.props;
    const {config = {}} = data.site.siteMetadata;
    const {tableOfContents} = data;
    const allSEOMarkdown = data.allMarkdown.edges;

    // Note: Layout adds header and footer etc
    return (
      <ContextConsumerComponent>
        {({ set, data: contextData }) => {
          // TODO - this is a bad hack until we can get StaticQuery in persistent-layout to work
          if (!contextData.initialized) {
            set({
              initialized: true,
              config,
              tableOfContents,
              allSEOMarkdown
            });
          }

          return (
            <main>
              <Home config={config} />
            </main>
          );
        }}
      </ContextConsumerComponent>
    )
  }
}
