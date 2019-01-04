import React, {Component} from 'react'
import styled from 'styled-components'

import { graphql } from 'gatsby';

import ExampleTableOfContents from '../components/layout/example-table-of-contents'

/* eslint no-undef: "off" */

/*
class Gallery extends Component {

  render() {
    // const {children, route: {path, pages}, isMenuOpen} = this.props;

    return (
      <div className="gallery-wrapper">
        { /* TODO - add thumbnails
        <div className={'flexbox-item flexbox-item--fill'}>
          { children }
        </div>
        * }
      </div>
    );
  }
}
*/

export default class Examples extends Component {
  render() {
    return (
      <main>
        { // TODO/ib Add example thumbnail gallery <Gallery />
        }
      </main>
    );
  }
}
