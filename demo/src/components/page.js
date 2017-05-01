/* global window */
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import autobind from 'autobind-decorator';

import Context from './context';
import InfoPanel from './info-panel';
import MarkdownPage from './markdown-page';
import {loadContent, updateContext} from '../actions/app-actions';

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
  
  @autobind _resizeContext() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.props.updateContext({
      width: w <= 768 ? w : w - 240,  // table-of-contents width (_gallery.scss)
      height: h - 64
    });
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
    return (
      <div className={`demo ${fullSize ? '' : 'embedded'}`}>
        <Context
          demo={name} />
        <InfoPanel
          demo={name} />
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

        {/*activeTab === 'demo' && (
          <li><span className="bg-black tip">Hold down shift key to rotate</span></li>
        )*/}

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

Page.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state) {
  return {
    contents: state.contents
  };
}

export default connect(mapStateToProps, {loadContent, updateContext})(Page);
