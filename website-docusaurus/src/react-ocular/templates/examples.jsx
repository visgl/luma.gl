import React, {Component} from 'react';
import {withPrefix} from 'gatsby';

import {
  MainExamples,
  ExamplesGroup,
  ExampleCard,
  ExampleHeader,
  ExampleTitle
} from '../styled/example';

export default class Examples extends Component {
  renderExample({title, path, image}) {
    return (
      <ExampleCard key={title} to={`/${path}`}>
        {image ? <img width="100%" src={withPrefix(image)} alt={title} /> : null}
        <ExampleTitle>
          <span>{title}</span>
        </ExampleTitle>
      </ExampleCard>
    );
  }

  renderCategory(item) {
    if (item.entries) {
      return [
        <ExampleHeader key={`${item.title}-header`}>{item.title}</ExampleHeader>,
        <ExamplesGroup key={item.title}>
          {item.entries.map((entry) => this.renderExample(entry))}
        </ExamplesGroup>
      ];
    }
    return this.renderExample(item);
  }

  render() {
    const {
      pageContext: {toc}
    } = this.props;

    if (toc.length === 1) {
      return (
        <MainExamples>
          <ExamplesGroup>{toc[0].entries.map((entry) => this.renderExample(entry))}</ExamplesGroup>
        </MainExamples>
      );
    }

    return (
      <MainExamples>{toc.map((exampleData) => this.renderCategory(exampleData))}</MainExamples>
    );
  }
}
