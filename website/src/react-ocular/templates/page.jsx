import React from 'react';
import Markdown from '../components/markdown';

import {MarkdownBody} from '../styled/typography';

export default class PageTemplate extends React.Component {
  render() {
    const {content} = this.props.pageContext;
    return (
      <div style={{position: 'relative'}}>
        <MarkdownBody>
          <Markdown path={this.props.location.pathname} body={content.body} />
        </MarkdownBody>
      </div>
    );
  }
}
