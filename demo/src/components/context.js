import React, {Component} from 'react';
import {connect} from 'react-redux';
import autobind from 'autobind-decorator';

import * as Demos from '../example-demos.js';

import {updateMeta, useParams} from '../actions/app-actions';

class Context extends Component {

  componentDidMount() {
    this._loadDemo(this.props.demo, false);
  }

  componentWillReceiveProps(nextProps) {
    const {demo} = nextProps;
    if (demo !== this.props.demo) {
      this._loadDemo(demo, true);
    }
  }

  componentWillUnmount() {
    const Demo = Demos[this.props.demo];
    if (Demo) Demo().stop();
  }

  _loadDemo(demo, useTransition) {
    const Demo = Demos[demo];

    if (Demo) {
      // this.props.useParams(Demo.parameters);
      Demo().start();
    }
  }

  render() {
    return (
      <div className="luma-context">
        <canvas id="lumagl-canvas"></canvas>
      </div>
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
