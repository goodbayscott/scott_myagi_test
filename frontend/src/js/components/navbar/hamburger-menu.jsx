import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import Radium from 'radium';

import $ from 'vendor/jquery/semantic';

import { ClickOutsideContainer } from 'components/common/click-outside-container';
import { SearchBarContainer } from 'components/common/universal-search-bar';
import Style from 'style/index.js';
import { MOBILE_WIDTH } from 'components/navbar';

const styles = {
  mobileDropdownIcon: {
    color: 'white',
    fontSize: 25,
    display: 'flex !important',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 22,
    marginLeft: 25,
    [MOBILE_WIDTH]: {
      display: 'block'
    }
  },
  mobileMenuDropdownIconNew: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  mobileMenu: {
    display: 'block',
    backgroundColor: Style.vars.colors.get('navBackground'),
    marginTop: 15
  },
  mobileMenuNew: {
    backgroundColor: Style.vars.colors.get('white')
  },
  search: {
    fontSize: 12,
    height: '2.4em',
    borderRadius: 20,
    order: '1',
    height: '100%',
    container: {
      width: '90vw',
      margin: '0 auto 20px auto'
    }
  }
};

@Radium
export class HamburgerMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  onToggle = () => {
    this.setState({ open: !this.state.open });
  };

  onClickOutside = () => {
    if (this.state.open) {
      this.onToggle();
    }
  };

  render() {
    const isUsingNewHome = this.props.currentUser.get('learner').tmp_new_home_page_enabled;
    const children = this.props.children.map((child, i) => (
      <div key={i} onClick={this.onToggle}>
        {child}
      </div>
    ));
    return (
      <ClickOutsideContainer onClickOutside={this.onClickOutside}>
        <div className="ui top left dropdown">
          <i
            className="ui icon content"
            style={Style.funcs.mergeIf(
              isUsingNewHome,
              styles.mobileDropdownIcon,
              styles.mobileMenuDropdownIconNew
            )}
            onClick={this.onToggle}
          />
          {this.state.open ? (
            <div
              className="menu"
              style={{
                ...Style.funcs.mergeIf(isUsingNewHome, styles.mobileMenu, styles.mobileMenuNew),
                width: window.innerWidth
              }}
            >
              {children}
              <SearchBarContainer style={styles.search} onSearch={this.onClickOutside} />
            </div>
          ) : null}
        </div>
      </ClickOutsideContainer>
    );
  }
}
