import React from 'react';
import ReactDOM from 'react-dom';

export class ClickOutsideContainer extends React.Component {
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('touchstart', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('touchstart', this.handleClickOutside);
  }

  handleClickOutside = event => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.props.onClickOutside();
    }
  };

  setWrapperRef = node => {
    this.wrapperRef = node;
  };

  render() {
    return (
      <div ref={this.setWrapperRef} style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}
