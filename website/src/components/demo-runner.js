import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {updateMeta, useParams} from '../actions/app-actions';

/* global window */
window.website = true;
const Demos = require('../../contents/demos.js');

const propTypes = {
  demo: PropTypes.string,
  canvas: PropTypes.string
};

const defaultProps = {
  canvas: 'demo-canvas'
};

class DemoRunner extends Component {

  componentDidMount() {
    const demo = Demos[this.props.demo];
    if (demo) {
      demo.start({
        canvas: this.props.canvas
        // debug: true
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.demo !== this.props.demo) {
      let demo = Demos[this.props.demo];
      if (demo) {
        demo.stop();
      }
      demo = Demos[nextProps.demo];
      if (demo) {
        demo.start({canvas: this.props.canvas});
      }
    }
  }

  componentWillUnmount() {
    const demo = Demos[this.props.demo];
    if (demo) {
      demo.stop();
    }
  }

  render() {
    const {width, height} = this.props;
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
