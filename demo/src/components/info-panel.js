import React, {Component} from 'react';
import {connect} from 'react-redux';

// import GenericInput from './input';

import * as Demos from '../../contents/demos.js';
import {updateParam} from '../actions/app-actions';

class InfoPanel extends Component {

  componentDidMount() {
    // const demo = Demos[this.props.demo];
    // if (demo && demo.addControls) {
    //   demo.addControls({parent: 'options-panel'});
    // }
  }

  componentWillReceiveProps(nextProps) {
    // if (nextProps.demo !== this.props.demo) {
    //   let demo = Demos[this.props.demo];

    //   /* global document */
    //   const node = document.getElementById('options-panel');
    //   while (node && node.firstChild) {
    //     node.removeChild(node.firstChild);
    //   }

    //   demo = Demos[nextProps.demo];
    //   if (demo && demo.addControls) {
    //     demo.addControls({parent: 'options-panel'});
    //   }
    // }
  }

  componentWillUnmount() {
    // const demo = Demos[this.props.demo];
    // if (demo) {
    //   demo.stop();
    // }
  }

  render() {
    const {demo, info, hasFocus, onInteract, params, owner, meta} = this.props;
    const demo_ = Demos[demo];
    const metaLoaded = owner === demo ? meta : {};

    return (
      <div
        ref="optionsPanel"
        className={`options-panel top-right ${hasFocus ? 'focus' : ''}`}
        onClick={onInteract}>

        <h2>{demo}</h2>
        <br/>

        <div className="control-panel" id="control-panel"/>

        {
        /*
        { demo_.onAddControls &&
          demo_.onAddControls({metaLoaded, div: 'options-panel'}) }
        {Object.keys(params).length > 0 && <hr />}

        {Object.keys(params).map((name, i) => (
          <GenericInput key={i}
            name={name}
            {...params[name]}
            onChange={this.props.updateParam} />
        ))}
        */
        }

      </div>
    );
  }
}

export default connect(state => state.vis, {updateParam})(InfoPanel);
