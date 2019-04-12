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
      content: this._loadContent(props.route.content)
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
        content: this._loadContent(route.content)
      });
    }
  }

  componentWillUnmount() {
    window.onresize = null;
  }

  _loadContent(content) {
    if (content.path) {
      setPathPrefix(content.path);
    }
    if (typeof content === 'string') {
      this.props.loadContent(content);
    }
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
    this.forceUpdate();
    this.props.updateViewport(this._getCanvasSize());
  }

  _renderDemo(name, sourceLink) {
    const {width, height} = this._getCanvasSize();
    return (
      <div className="demo">
        <DemoRunner width={width} height={height} demo={name} />
        <InfoPanel demo={name} >
          {sourceLink && (<div className="source-link">
            <a href={sourceLink} target="_new">View Code ↗</a>
          </div>)}
        </InfoPanel>
      </div>
    );
  }

  render() {
    const {contents} = this.props;
    const {content} = this.state;

    let child;

    if (content.demo) {
      child = this._renderDemo(content.demo, content.code);
    } else if (typeof content === 'string') {
      child = <MarkdownPage content={contents[content]} />;
    }

    return <div className="page">{child}</div>;
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
