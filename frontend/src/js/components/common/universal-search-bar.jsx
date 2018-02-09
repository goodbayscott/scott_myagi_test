import React from 'react';
import Radium from 'radium';
import Style from 'style/index.js';

import { ANALYTICS_EVENTS } from 'core/constants';
import { StyleRoot } from 'radium';
import { Form, TextInput, SubmitButton } from 'components/common/form';
import { ClickOutsideContainer } from 'components/common/click-outside-container';
import { MOBILE_WIDTH } from 'components/navbar';

const styles = {
  searchContainer: {
    width: '16vw',
    justifyContent: 'center',
    margin: '0px 45px 0px 0px',
    [MOBILE_WIDTH]: {
      width: '90vw',
      position: 'relative',
      top: 0,
      right: 0,
      transform: 'none',
      margin: '0 auto 10px auto'
    }
  },
  form: {
    margin: 0,
    display: 'flex'
  },
  searchInput: {
    borderRadius: 20,
    container: {
      margin: 0,
      width: '100%'
    }
  },
  buttonContainer: {
    position: 'absolute',
    right: '.15em',
    top: '.2em'
  },
  button: {
    backgroundColor: Style.vars.colors.get('white'),
    color: Style.vars.colors.get('xxDarkGrey'),
    borderRadius: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '2em',
    padding: '0 15px',
    margin: 0,
    width: '100%'
  }
};

export class SearchBarContainer extends React.Component {
  // I had to create this container as wrapping <NavBar/> with 'StyleRoot' in the App component didn't work
  render() {
    return (
      <StyleRoot>
        <SearchBar
          style={this.props.style}
          onChange={this.props.onChange}
          onSearch={this.props.onSearch}
        />
      </StyleRoot>
    );
  }
}

@Radium
export class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { search: '', initialValue: 'Search...' };
  }

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  onChange = e => {
    this.setState({ search: e.target.value, initialValue: '' });
  };

  onSearch = e => {
    const userInput = this.state.search;
    if (userInput === '') {
      return;
    }
    analytics.track(ANALYTICS_EVENTS.EXECUTED_SEARCH, { Search: userInput });
    let path = `/views/search/?search=${userInput}`;
    if (this.context.location.pathname.startsWith('/views/search/')) {
      const path_split = this.context.location.pathname.split('/');
      const tab =
        path_split[path_split.length - 1] === ''
          ? path_split[path_split.length - 2]
          : path_split[path_split.length - 1];
      path = `/views/search/${tab}/?search=${userInput}`;
    }
    this.context.router.push(path);
    // Close hamburger menu on search
    if (this.props.onSearch) {
      this.props.onSearch();
    }
    this.refs.search.refs.searchInput.reset();
    this.setState({ search: '', initialValue: 'Search...' });
  };

  onUnfocus = () => {
    this.setState({ initialValue: 'Search...' });
  };

  render() {
    return (
      <div style={{ ...styles.searchContainer, ...this.props.style }}>
        <Form onSubmitAndValid={this.onSearch} ref="search" style={styles.form}>
          <ClickOutsideContainer onClickOutside={this.onUnfocus} style={{ width: '100%' }}>
            <TextInput
              initialValue={this.state.initialValue}
              onChange={this.onChange}
              style={styles.searchInput}
              ref="searchInput"
            />
          </ClickOutsideContainer>
          <div style={styles.buttonContainer}>
            <SubmitButton
              text={<i className="search icon" style={{ margin: 0 }} />}
              style={styles.button}
            />
          </div>
        </Form>
      </div>
    );
  }
}
