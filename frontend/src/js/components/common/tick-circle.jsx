import React from 'react';

import Style from 'style';

const tcStyle = {
  circle: {
    width: '30px',
    height: '30px',
    border: `1px solid ${Style.vars.colors.get('darkGrey')}`,
    borderColor: Style.vars.colors.get('darkGrey'),
    borderRadius: '15px',
    float: 'right',
    transition: 'background-color 0.2s ease-in'
  },
  selectedCircle: {
    backgroundColor: Style.vars.colors.get('green'),
    borderColor: Style.vars.colors.get('green')
  },
  selectedIcon: {
    marginLeft: '6px',
    marginTop: '5px',
    color: 'white'
  }
};

export class TickCircle extends React.Component {
  /*
      Simple selection UI element. If the `isSelected` prop is false, then will just render
      an empty circle. If `isSelected` is true then it will render a green circle with a
      tick in the center. Pass in an `onClick` handler if necessary to update the
      `isSelected value in the parent component.
  */

  render() {
    let selectedIcon = null;
    const circleStyle = Style.funcs.mergeIf(
      this.props.isSelected,
      tcStyle.circle,
      tcStyle.selectedCircle
    );
    if (this.props.isSelected) {
      selectedIcon = <i className="ui checkmark icon" style={tcStyle.selectedIcon} />;
    }
    if (this.props.onClick) circleStyle.cursor = 'pointer';
    return (
      <div style={Style.funcs.merge(circleStyle, this.props.style)} onClick={this.props.onClick}>
        {selectedIcon}
      </div>
    );
  }
}
