import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as Demos from '../../contents/demos.js';

import {updateMeta, useParams} from '../actions/app-actions';

class Context extends Component {

  componentDidMount() {
    const demo = Demos[this.props.demo];
    if (demo) {
      demo.start({canvas: 'lumagl-canvas'});
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
        /* global document */
        const controlPanel = document.querySelector('.control-panel');
        const node = controlPanel;
        while (node && node.firstChild) {
          node.removeChild(node.firstChild);
        }
        demo.start({canvas: 'lumagl-canvas'});
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
    return (
      <canvas id="lumagl-canvas" style={{width: '100%', height: '100%', padding: 0, border: 0}}/>
    );
  }

}

const mapStateToProps = state => ({
  viewport: state.viewport,
  ...state.vis
});

export default connect(
  mapStateToProps,
  {updateMeta, useParams}
)(Context);
