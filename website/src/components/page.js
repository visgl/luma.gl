/* global window */
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import autobind from 'autobind-decorator';

import DemoRunner from './demo-runner';
import InfoPanel from './info-panel';
import MarkdownPage from './markdown-page';
import {loadContent, updateViewport} from '../actions/app-actions';

import {setPathPrefix} from 'luma.gl';

// table-of-contents width (_gallery.scss)
const TOC_MIN_WIDTH = 768;
const TOC_WIDTH = 240;
const HEADER_HEIGHT = 64;

const contextTypes = {
  router: PropTypes.object
};

const propTypes = {
  route: PropTypes.any,
  location: PropTypes.any,
  loadContent: PropTypes.any,
  updateViewport: PropTypes.any,
  contents: PropTypes.any
};

class Page extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tabs: this._loadContent(props.route.content)
    };
  }

  componentDidMount() {
    window.onresize = this._resizeContext;
    this._resizeContext();
  }

  componentWillReceiveProps(nextProps) {
    const {route} = nextProps;
    if (this.props.route !== route) {
      this.setState({
        tabs: this._loadContent(route.content)
      });
    }
  }

  componentWillUnmount() {
    window.onresize = null;
  }

  _loadContent(content) {
    if (typeof content !== 'object') {
      content = {content};
    }

    if (content.path) {
      setPathPrefix(content.path);
    }

    // grab text contents
    Object.keys(content).forEach(key => {
      if (key === 'demo') {
        return;
      }

      const src = content[key];
      if (typeof src === 'string') {
        this.props.loadContent(src);
      }
    });

    return content;
  }

  _getCanvasSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: w <= TOC_MIN_WIDTH ? w : w - TOC_WIDTH,
      height: h - HEADER_HEIGHT
    };
  }

  @autobind _resizeContext() {
    this.props.updateViewport(this._getCanvasSize());
  }

  _setActiveTab(tabName) {
    const {location: {pathname}} = this.props;
    this.context.router.replace(`${pathname}?tab=${tabName}`);
  }

  _renderChild(child, tabKey) {
    const {location} = this.props;
    const {tabs} = this.state;
    const activeTab = location.query.tab || Object.keys(tabs)[0];

    return (
      <div key={tabKey} className={`tab ${tabKey === activeTab ? 'active' : ''}`}>
        {child}
      </div>
    );
  }

  _renderDemo(name, fullSize) {
    const {width, height} = this._getCanvasSize();
    return (
      <div className={`demo ${fullSize ? '' : 'embedded'}`}>
        <DemoRunner width={width} height={height} demo={name} />
        <InfoPanel demo={name} />
      </div>
    );
  }

  _renderTabContent() {
    const {contents, route: {embedded}} = this.props;
    const {tabs} = this.state;

    return Object.keys(tabs).map(tabKey => {
      const tab = tabs[tabKey];

      if (tabKey === 'demo') {
        const child = this._renderDemo(tab, true);
        return this._renderChild(child, tabKey);
      } else if (typeof tab === 'string') {
        const child = (
          <div>
            { embedded && this._renderDemo(embedded, false) }
            <MarkdownPage content={contents[tab]} />
          </div>
        );
        return this._renderChild(child, tabKey);
      }

      return this._renderChild(React.createElement(tab), tabKey);

    });
  }

  _renderTabs() {
    const {location} = this.props;
    const {tabs} = this.state;
    const activeTab = location.query.tab || Object.keys(tabs)[0];

    return (
      <ul className="tabs">

        {Object.keys(tabs).map(tabName => (
          <li key={tabName} className={`${tabName === activeTab ? 'active' : ''}`}>
            <button onClick={this._setActiveTab.bind(this, tabName)}>
              {tabName}
            </button>
          </li>
        ))}

      </ul>
    );
  }

  render() {
    const {tabs} = this.state;

    return (
      <div className="page">
        {Object.keys(tabs).length > 1 && this._renderTabs()}
        {this._renderTabContent()}
      </div>
    );
  }
}

Page.contextTypes = contextTypes;
Page.propTypes = propTypes;

function mapStateToProps(state, ownProps) {
  return {
    ...ownProps,
    contents: state.contents
  };
}

export default connect(mapStateToProps, {loadContent, updateViewport})(Page);
