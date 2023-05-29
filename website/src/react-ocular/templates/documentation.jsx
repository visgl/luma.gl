import React from 'react';
import {graphql} from 'gatsby';

import Markdown from '../components/markdown';

import {MarkdownBody} from '../styled/typography';

// Query for the markdown doc by slug
export const query = graphql`
  query DocBySlug($slug: String!) {
    docBySlug: mdx(fields: {slug: {eq: $slug}}) {
      body
      timeToRead
      excerpt
      frontmatter {
        title
      }
    }
  }
`;

export default class DocTemplate extends React.Component {
  render() {
    const {body} = this.props.data.docBySlug;
    const {relativeLinks} = this.props.pageContext;
    return (
      <div style={{position: 'relative'}}>
        <MarkdownBody>
          <Markdown
            path={this.props.location.pathname}
            relativeLinks={relativeLinks}
            config={this.props.config}
            body={body}
          />
        </MarkdownBody>
      </div>
    );
  }
}
