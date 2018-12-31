import React from 'react'
import styled from 'styled-components'

import { graphql } from 'gatsby'

/* eslint no-undef: "off" */
export const query = graphql`
  query DocBySlug($slug: String!) {
    docBySlug: markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      excerpt
      frontmatter {
        title
        cover
        category
        tags
      }
    }
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
    site {
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
  }
`;

export default class DocTemplate extends React.Component {
  render() {
    const {data, pathContext, pageContext} = this.props;
    const {config} = data.site.siteMetadata;

    const {tableOfContents} = data;

    const { slug } = pathContext
    const docNode = data.docBySlug
    const doc = docNode.frontmatter
    if (!doc.id) {
      doc.id = slug
    }
    if (!doc.id) {
      doc.category_id = config.postDefaultCategoryID
    }
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: docNode.html }} />
      </div>
    )
  }
}
