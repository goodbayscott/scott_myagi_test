import React from 'react';
import Style from 'style';

const styles = {
  container: {
    maxWidth: 400,
    marginBottom: 10
  },
  title: {
    fontWeight: 'bold'
  },

  info: {
    color: Style.vars.colors.get('darkGrey'),
    lineHeight: 1.7,
    marginTop: 10
  }
};

export class DescriptionBox extends React.Component {
  static propTypes = {
    title: React.PropTypes.string.isRequired,
    info: React.PropTypes.string.isRequired
  };

  static defautProps = {
    title: '',
    info: ''
  };

  render() {
    return (
      <div
        className="description-box"
        style={Style.funcs.merge(styles.container, this.props.style)}
      >
        <div style={styles.title}>{this.props.title}</div>

        <div style={styles.info}>{this.props.info}</div>
      </div>
    );
  }
}
