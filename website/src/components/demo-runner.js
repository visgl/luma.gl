import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {updateMeta, useParams} from '../actions/app-actions';

/* global window */
window.website = true;
const Demos = require('../../contents/demos.js');
let currentDemo = null;

const propTypes = {
  demo: PropTypes.string,
  canvas: PropTypes.string
};

const defaultProps = {
  canvas: 'demo-canvas'
};

const DEFAULT_ALT_TEXT = 'THIS DEMO IS NOT SUPPORTED';

class DemoRunner extends Component {
  componentDidMount() {
    const Demo = Demos[this.props.demo];
    currentDemo = new Demo();
    if (currentDemo) {
      currentDemo.start({
        canvas: this.props.canvas
        // debug: true
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.demo !== this.props.demo) {
      if (currentDemo) {
        currentDemo.stop();
      }
      const Demo = Demos[nextProps.demo];
      currentDemo = new Demo();
      if (currentDemo) {
        currentDemo.start({canvas: this.props.canvas});
      }
    }
  }

  componentWillUnmount() {
    if (currentDemo) {
      currentDemo.stop();
    }
  }

  render() {
    const {width, height} = this.props;

    if (currentDemo) {
      const notSupported = currentDemo.isSupported && !currentDemo.isSupported();

      if (notSupported) {
        const altText = currentDemo.getAltText ? currentDemo.getAltText() : DEFAULT_ALT_TEXT;
        return (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
            <h2> {altText} </h2>
          </div>
        );
      }
    }

    return (
      <canvas id={this.props.canvas} style={{width, height, padding: 0, border: 0}}/>
    );
  }

}

const mapStateToProps = (state, ownProps) => ({
  ...ownProps,
  viewport: state.viewport,
  ...state.vis
});

DemoRunner.propTypes = propTypes;
DemoRunner.defaultProps = defaultProps;

export default connect(
  mapStateToProps,
  {updateMeta, useParams}
)(DemoRunner);
