import React, {Component} from 'react';
import {connect} from 'react-redux';

import GenericInput from './input';
import * as Demos from '../example-demos.js';
import {updateParam} from '../actions/app-actions';

class InfoPanel extends Component {

  render() {
    const {demo, info, hasFocus, onInteract, params, owner, meta} = this.props;
    const Demo = Demos[demo];
    const metaLoaded = owner === demo ? meta : {};

    return (
      <div className={`options-panel top-right ${hasFocus ? 'focus' : ''}`} onClick={onInteract}>

        {/*
        // TODO: if this is useful for luma.gl, reimplement.
        // deck.gl demo site relied on Demos as React components,
        // but luma.gl examples/demos are not React components,
        // so demo info needs to be provided differently.
        */}
        {Demo.renderInfo && Demo.renderInfo(metaLoaded)}

        {Object.keys(params).length > 0 && <hr />}

        {Object.keys(params).map((name, i) => (
          <GenericInput key={i}
            name={name}
            {...params[name]}
            onChange={this.props.updateParam} />
        ))}

      </div>
    );
  }
}

export default connect(state => state.vis, {updateParam})(InfoPanel);
