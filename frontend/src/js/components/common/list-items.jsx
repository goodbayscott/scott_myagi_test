import React from 'react';
import reactMixin from 'react-mixin';

import Style from 'style';

import { HoverMixin } from 'components/common/hover';

import { CornerRemoveIcon as RemoveIcon } from 'components/common/cards';

const listItemStyle = {
  container: {
    marginTop: '20px'
  },
  listItem: {
    width: '100%',
    minHeight: '60px',
    margin: '0 auto',
    marginBottom: '10px',
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '#ececec 2px 2px 4px'
  },
  listItemHover: {
    transform: 'scale(1.008)',
    boxShadow: '#ddd 2px 2px 30px',
    // Lift item above adjacent elements
    zIndex: 10
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'black',
    marginTop: 0
  },
  description: {
    fontSize: '12px',
    fontWeight: 'normal',
    marginBottom: 0
  }
};

export class Title extends React.Component {
  render() {
    return (
      <h3 style={Style.funcs.merge(listItemStyle.title, this.props.style)}>
        {this.props.children}
      </h3>
    );
  }
}

export class Description extends React.Component {
  render() {
    return <p style={listItemStyle.description}>{this.props.children}</p>;
  }
}

@reactMixin.decorate(HoverMixin)
export class ListItem extends React.Component {
  /*
    Very simple component which displays the semantic-ui
    list item component.
  */

  render() {
    let style = Style.funcs.merge(listItemStyle.listItem, this.props.style);
    if (this.props.onClick) {
      const hoverStyle = Style.funcs.merge(listItemStyle.listItemHover, this.props.hoverStyle);
      style = this.getHoverStyle(style, hoverStyle);
    }
    return (
      <div
        className="ui segment"
        onClick={this.props.onClick}
        style={style}
        {...this.getHoverProps()}
      >
        {this.props.children}
      </div>
    );
  }
}

export class ListItemCollection extends React.Component {
  static propTypes = {
    createListItem: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <div style={Style.funcs.merge(listItemStyle.container, this.props.style)}>
        {this.props.entities.map(entity => this.props.createListItem(entity)).toArray()}
      </div>
    );
  }
}

// Proxy this for sake of consistency when
// creating list item components.
export const CornerRemoveIcon = RemoveIcon;
