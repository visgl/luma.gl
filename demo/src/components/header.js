import React, {Component} from 'react';
import {Link} from 'react-router';

export default class Header extends Component {

  render() {
    const {isMenuOpen, opacity, toggleMenu} = this.props;

    return (
      <header className={ isMenuOpen ? 'open' : '' } style={{opacity: 1, backgroundColor: '#000'}}>
        <div className="bg" style={{opacity}} />
        <div className="container">
          <a className="logo" href="#">luma.gl</a>
          <div className="menu-toggle" onClick={ () => toggleMenu(!isMenuOpen) }>
            <i className={`icon icon-${isMenuOpen ? 'close' : 'menu'}`} />
          </div>
          <div className="links">
            <Link activeClassName="active" to="examples">Examples</Link>
            <Link activeClassName="active" to="documentation">Documentation</Link>
            <Link activeClassName="active" href="https://github.com/uber/luma.gl">
              Github<i className="icon icon-github" />
            </Link>
          </div>
        </div>
      </header>
    );
  }
}
