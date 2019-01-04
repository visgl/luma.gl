// This is the top-level "Layout" component that doesn't get unmounted between
// page loads. This component is wrapped around the react component returned by
// each page using the gatsby browser/SSR `wrapPage` callback.

import React from 'react'
import Helmet from 'react-helmet'
import styled from 'styled-components'
import { StaticQuery, graphql } from 'gatsby'

import {TopLevelLayout} from 'gatsby-plugin-ocular/components';

// Note: gatsby-plugin-sass will process these files automatically when it sees this import
import 'gatsby-plugin-ocular/styles/main.scss'

// All common metadata, table-of-contents etc are queried here and put in React context
const QUERY = graphql`
  fragment SiteConfigFragment on Site {
    siteMetadata {
      config {
        PROJECT_NAME,
        PROJECT_TYPE,
        PROJECT_DESC,
        HOME_HEADING,
        HOME_BULLETS {
          text
          desc
          img
        },
        EXAMPLES {
          title,
          path
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

  query ConfigQuery {
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

// The Layout instance is shared between pages. It queries common, static data
// and makes it available on React context
export default class Layout extends React.Component {

  queryComplete(data) {
    const {children} = this.props;
    const {config} = data.site.siteMetadata;
    const {tableOfContents, allMarkdown} = data;

    console.log('StaticQuery result', config, tableOfContents, allMarkdown);

    return (
      <TopLevelLayout {...this.props}
        config={config}
        tableOfContents={tableOfContents}
        allMarkdown={allMarkdown} >

        { children }

      </TopLevelLayout>
    );
  }

  render() {
    return (
      <StaticQuery query={QUERY} render={this.queryComplete.bind(this)} />
    );
  }
}
