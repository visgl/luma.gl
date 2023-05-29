import React from 'react';
import debounce from 'lodash.debounce';
import SearchIcon from '../components/search';

import WebsiteConfigConsumer from '../components/website-config';
import {
  MainSearch,
  SearchContainer,
  IconContainer,
  SearchInput,
  SearchResultItem,
  SearchResultLink,
  SearchResultHighlight,
  SearchResultPager
} from '../styled/search';

const RESULTS_PER_PAGE = 10;
const MAX_EXCERPT_LENGTH = 200;

function renderHighlightedText(lines, regex, lineNumber = 0) {
  if (Array.isArray(lines)) {
    return lines.map((line, i) => {
      const elements = renderHighlightedText(line, regex, i);
      elements.unshift(<br key={i} />);
      return elements;
    });
  }

  return lines.split(regex).map((part, i) => {
    return i % 2 === 0 ? (
      <span key={`${lineNumber}-${i}`}>{part}</span>
    ) : (
      <SearchResultHighlight key={`${lineNumber}-${i}`}>{part}</SearchResultHighlight>
    );
  });
}

export default class SearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentQuery: '',
      lastQuery: '',
      visibleResultsCount: RESULTS_PER_PAGE,
      results: []
    };
    this.findResults = debounce(this.findResults.bind(this), 250);
    this.handleChange = this.handleChange.bind(this);
  }

  findResults(currentQuery) {
    const {lastQuery} = this.state;
    const {pathContext} = this.props;
    this.setState({debouncing: false});
    currentQuery = currentQuery
      .replace(/[^\w-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (currentQuery === lastQuery) {
      return;
    }
    let regex = null;
    const results = [];
    if (currentQuery) {
      regex = new RegExp(`(${currentQuery})`, 'i');

      for (let i = 0; i < pathContext.data.length; i++) {
        const node = pathContext.data[i];
        const matches = [];
        let priority = Infinity;
        if (node.title && regex.test(node.title)) {
          priority = 0;
        }
        if (node.headings) {
          let totalLength = 0;
          for (const heading of node.headings) {
            if (regex.test(heading.value)) {
              priority = Math.min(priority, heading.depth);
              totalLength += heading.value.length;
              matches.push(heading.value);
            }
            if (totalLength >= MAX_EXCERPT_LENGTH) {
              break;
            }
          }
        }
        if (!Number.isFinite(priority) && node.excerpt) {
          const index = node.excerpt.search(regex);
          if (index >= 0) {
            priority = 100;
            let excerpt = node.excerpt.slice(index - 30);
            excerpt = excerpt.slice(excerpt.indexOf(' ') + 1).slice(0, MAX_EXCERPT_LENGTH) + '...';
            matches.push(excerpt);
          }
        }
        if (Number.isFinite(priority)) {
          results.push({node, priority, matches});
        }
      }
    }
    results.sort((r1, r2) => r1.priority - r2.priority);
    this.setState({
      results,
      regex,
      visibleResultsCount: RESULTS_PER_PAGE,
      lastQuery: currentQuery
    });
  }

  handleChange(event) {
    const currentQuery = event.target.value;
    this.setState({currentQuery, debouncing: true});
    this.findResults(currentQuery);
  }

  renderResults() {
    const {results, regex, visibleResultsCount} = this.state;

    return results.slice(0, visibleResultsCount).map((result) => {
      if (!result.element) {
        result.element = (
          <SearchResultItem key={result.node.slug}>
            <SearchResultLink to={`/${result.node.slug}`}>{result.node.title}</SearchResultLink>
            {renderHighlightedText(result.matches, regex)}
          </SearchResultItem>
        );
      }
      return result.element;
    });
  }

  renderPage() {
    // Note: The Layout "wrapper" component adds header and footer etc
    const {debouncing, results, visibleResultsCount, currentQuery} = this.state;
    const {pathContext} = this.props;
    return (
      <MainSearch>
        <SearchContainer>
          <IconContainer>
            <SearchIcon width={24} height={24} />
          </IconContainer>
          <SearchInput
            type="text"
            placeholder="Search"
            onChange={this.handleChange}
            value={currentQuery}
          />
        </SearchContainer>

        {debouncing ? <div>Searching...</div> : null}
        <div>
          {currentQuery && !debouncing && (
            <div>
              {results.length ? `${results.length} articles found.` : `No result for this query.`}
            </div>
          )}

          {!currentQuery && !debouncing && (
            <div>{pathContext.data ? `${pathContext.data.length} articles indexed.` : ''}</div>
          )}
          <div>{this.renderResults()}</div>
          {visibleResultsCount < results.length && (
            <SearchResultPager
              onClick={() =>
                this.setState({
                  visibleResultsCount: visibleResultsCount + RESULTS_PER_PAGE
                })
              }
            >
              Load more...
            </SearchResultPager>
          )}
        </div>
      </MainSearch>
    );
  }

  render() {
    return <WebsiteConfigConsumer>{() => this.renderPage()}</WebsiteConfigConsumer>;
  }
}
