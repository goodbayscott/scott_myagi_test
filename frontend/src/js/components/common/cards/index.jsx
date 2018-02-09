import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import { t } from 'i18n';
import _ from 'lodash';
import $ from 'vendor/jquery/semantic';
import reactMixin from 'react-mixin';

import Style from 'style/index';

import { Image } from 'components/common/image.jsx';

import { JQueryComponentMixin } from 'components/common/jquery-component-mixin.jsx';

import { Dropdown } from 'components/common/dropdown.jsx';

const cardStyleSheet = {
  width: '230px',
  textAlign: 'center',
  backgroundColor: Style.vars.colors.get('white'),
  borderTopLeftRadius: 6,
  borderBottomLeftRadius: 6,
  borderBottomRightRadius: 6
};

export class Card extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/views/card.html#card
  */
  static propTypes = {
    onClick: React.PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      style: {
        card: _.extend(
          {},
          cardStyleSheet,
          { cursor: this.props.onClick ? 'pointer' : 'auto' },
          Style.funcs.makeTransition('background-color 150ms linear'),
          this.props.style
        )
      }
    };
  }

  onMouseOverCard = () => {
    if (!this.props.onClick) return;
    const style = this.state.style;
    style.card.backgroundColor = Style.vars.colors.get('lightGrey');
    this.setState({ style });
  };

  onMouseLeaveCard = () => {
    if (!this.props.onClick) return;
    const style = this.state.style;
    style.card.backgroundColor = Style.vars.colors.get('white');
    this.setState({ style });
  };

  render() {
    return (
      <div
        onMouseOver={this.onMouseOverCard}
        onMouseLeave={this.onMouseLeaveCard}
        className="card"
        onClick={this.props.onClick}
        style={this.state.style.card}
      >
        {this.props.children}
      </div>
    );
  }
}

const cardCollectionStyleSheet = {
  centered: {
    justifyContent: 'center'
  }
};

export class CardCollection extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/views/card.html#cards.
    Takes a list of `entities`, then iterates over list and uses
    supplised `createCard` func to generate a card for each
    entity.
  */
  static propTypes = {
    entities: React.PropTypes.instanceOf(Im.List).isRequired,
    createCard: React.PropTypes.func.isRequired,
    centered: React.PropTypes.bool
  };

  render() {
    const style = Style.funcs.mergeIf(this.props.centered, cardCollectionStyleSheet.centered);
    return (
      <div className="ui cards" style={Style.funcs.merge(style, this.props.style)}>
        {this.props.entities.map(entity => this.props.createCard(entity)).toArray()}
      </div>
    );
  }
}

const imageStyle = {
  thumbImg: {
    height: '12em'
  },
  imgContainer: {
    margin: '10px',
    cursor: 'pointer'
  }
};

export class CardImage extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/views/card.html#image
  */
  static propTypes = {
    src: React.PropTypes.string
  };

  render() {
    return (
      <div
        className="image"
        style={Style.funcs.merge(imageStyle.imgContainer, this.props.containerStyle)}
        onClick={this.props.onClick}
      >
        <Image
          src={this.props.src}
          style={Style.funcs.merge(imageStyle.thumbImg, this.props.imageStyle)}
        />
      </div>
    );
  }
}

@reactMixin.decorate(JQueryComponentMixin)
export class DimmableCardImage extends React.Component {
  getDimmableEl() {
    return $(ReactDOM.findDOMNode(this)).find('.dimmable.image');
  }
  manipulateDOMWithJQuery() {
    this.$el = this.getDimmableEl().dimmer({
      on: 'hover'
    });
  }
  componentDidUpdate(prevProps) {
    this.refresh();
  }
  renderJQueryControlledContent() {
    const dStyle = {};
    if (this.props.onClick) dStyle.cursor = 'pointer';
    return (
      <div className="dimmable image" onClick={this.props.onClick} style={dStyle}>
        <div className="ui inverted dimmer">
          <div className="content">
            <div className="center">{this.props.children}</div>
          </div>
        </div>
        <CardImage src={this.props.src} imageStyle={this.props.imageStyle} />
      </div>
    );
  }
}

export class CornerRemoveIcon extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/elements/label.html#corner with
    remove icon. Often added to cards as delete buttons.
  */
  render() {
    return (
      <a className="ui bottom corner label" onClick={this.props.onClick}>
        <i className="remove icon" style={{ cursor: 'pointer' }} />
      </a>
    );
  }
}

export class CornerCheckmarkIcon extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/elements/label.html#corner with
    tick icon.
  */
  render() {
    return (
      <a className="ui bottom corner green label" onClick={this.props.onClick}>
        <i className="checkmark icon" />
      </a>
    );
  }
}

const cdStyle = {
  icon: {
    margin: 0,
    padding: '20px',
    paddingBottom: '30px',
    marginTop: '-18px',
    marginLeft: '-4px',
    outline: 'none',
    textShadow: 'none'
  },
  label: {
    zIndex: 10
  }
};

export class CornerDropdown extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/elements/label.html#corner with
    dropdown attached. Useful for menus on UI cards.
  */
  static propTypes = {
    items: React.PropTypes.array.isRequired
  };

  onItemClick(item, evt) {
    evt.stopPropagation();
    evt.preventDefault();
    // NOTE - This is an unfortunate hack because `stopPropagation`
    // does not appear to work all the time.
    // Related to https://github.com/facebook/react/issues/1691.
    evt._ignore = true;
    item.action();
  }

  getItemEl = item => (
    <div
      key={item.label}
      data-value={item.label}
      className="item"
      onClick={_.partial(this.onItemClick, item)}
    >
      {item.label}
    </div>
  );

  render() {
    return (
      <a className="ui bottom corner label" style={cdStyle.label}>
        <Dropdown className="ui dropdown" dropdownOpts={{ action: 'hide' }} ref="dropdown">
          <i className="dropdown icon" style={cdStyle.icon} />
          <div className="menu">{_.map(this.props.items, this.getItemEl)}</div>
        </Dropdown>
      </a>
    );
  }
}
