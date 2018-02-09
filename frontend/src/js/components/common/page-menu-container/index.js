import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import cx from 'classnames';

const styles = {
  pageMenuContainer: {
    justifyContent: 'center',
    display: 'flex',
    width: '100%',
    marginTop: 20,
    marginBottom: 20
  },
  pageMenu: {
    boxShadow: 'none'
  }
};

export default class PageMenuContainer extends React.Component {
  static propTypes = {
    currentPage: React.PropTypes.number.isRequired,
    goToPage: React.PropTypes.func.isRequired,
    numAvailablePages: React.PropTypes.number.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      numPages: props.numAvailablePages,
      curPageIdx: props.currentPage
    };
  }

  componentWillReceiveProps(newProps) {
    // Often, numAvailablePages gets set to null while a new page is being
    // fetched. To prevent the page menu from disappearing and re-appearing
    // in that time, we only update numPages if it changes to a truthy value.
    if (newProps.numAvailablePages) {
      this.setState({ numPages: newProps.numAvailablePages, curPageIdx: newProps.currentPage });
    }
  }

  componentDidUpdate() {
    if (this._contentContainer) {
      const height = ReactDOM.findDOMNode(this._contentContainer).clientHeight;
      // Prevents the main content container from constantly changing height
      // as we switch pages.
      if (height <= 0) return;
      if (!this.state.containerHeight || height > this.state.containerHeight) {
        this.setState({ containerHeight: height });
      }
    }
  }

  renderItem = num => {
    const classes = cx('item', { active: num === this.state.curPageIdx });
    return (
      <a className={classes} onClick={() => this.props.goToPage(num)}>
        {num + 1}
      </a>
    );
  };

  renderPageMenu() {
    if (!this.state.numPages || this.state.numPages <= 1) return null;
    return (
      <div style={styles.pageMenuContainer}>
        <div className="ui pagination menu" style={styles.pageMenu}>
          {_.range(this.state.numPages).map(this.renderItem)}
        </div>
      </div>
    );
  }

  render() {
    // This prevents the page height from changing constantly when
    // we switch page.
    const conStyle = {
      minHeight: this.state.containerHeight
    };
    return (
      <div>
        {this.renderPageMenu()}
        <div style={conStyle} ref={i => (this._contentContainer = i)}>
          {this.props.children}
        </div>
        {this.renderPageMenu()}
      </div>
    );
  }
}
