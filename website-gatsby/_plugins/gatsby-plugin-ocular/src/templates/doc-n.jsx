import React from 'react'
import styled from 'styled-components'

import { graphql } from 'gatsby'

// Query for the markdown doc by slug
// (Note: We could just search the allMarkdown from WebsiteConfig ourselves)
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
  }
`;

export default class DocTemplate extends React.Component {
  render() {
    const {data, pathContext} = this.props;
    const { slug } = pathContext
    const docNode = data.docBySlug
    const doc = docNode.frontmatter
    // if (!doc.id) {
    //   doc.id = slug
    // }
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: docNode.html }} />
      </div>
    )
  }
}
