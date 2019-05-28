import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

const ITEM_HEIGHT = 40;

const getContentHeight = page =>
  page.children
    ? page.children.reduce((height, child) => height + getContentHeight(child), ITEM_HEIGHT)
    : ITEM_HEIGHT;

export default class TableOfContents extends Component {
  _renderPage(parentRoute, page, i) {
    const {children, name} = page;
    const path = `${parentRoute}/${page.path}`;

    if (children) {
      const maxHeight = getContentHeight(page);
      return (
        <div key={`page-${i}`}>
          <Link className="list-header" activeClassName="active" key={`group-header${i}`} to={path}>
            {name}
          </Link>
          <ul key={`group-list${i}`} style={{maxHeight: `${maxHeight}px`}}>
            {children.map(this._renderPage.bind(this, path))}
          </ul>
        </div>
      );
    }

    return (
      <li key={`page-${i}`}>
        <Link className="link" to={path} activeClassName="active">
          {page.name}
        </Link>
      </li>
    );
  }

  render() {
    const {pages, parentRoute, isOpen} = this.props;

    return (
      <div className={`toc ${isOpen ? 'open' : ''}`}>
        <div>{pages.map(this._renderPage.bind(this, parentRoute))}</div>
      </div>
    );
  }
}

TableOfContents.propTypes = {
  isOpen: PropTypes.bool,
  parentRoute: PropTypes.string.isRequired,
  pages: PropTypes.arrayOf(PropTypes.object).isRequired
};
