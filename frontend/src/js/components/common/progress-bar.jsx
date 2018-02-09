import React from 'react';
import { t } from 'i18n';
import Style from 'style';

const HEIGHT = 16;

const styles = {
  container: {
    width: '100%',
    height: HEIGHT,
    backgroundColor: '#f3f3f3'
  },
  bar: {
    backgroundColor: Style.vars.colors.get('green'),
    height: HEIGHT,
    position: 'relative'
  },
  text: {
    position: 'relative',
    fontSize: '0.8rem',
    padding: '0px 10px',
    marginTop: '-1px',
    zIndex: 2
  },
  leftText: {
    float: 'left',
    color: '#fff'
  },
  rightText: {
    float: 'right',
    color: '#888'
  }
};

export class ProgressBar extends React.Component {
  render() {
    let percent =
      !this.props.total || !this.props.completed ? 0 : this.props.completed / this.props.total;

    if (this.bar && this.bar.clientWidth && this.bar.clientWidth < HEIGHT) {
      percent = HEIGHT / this.container.clientWidth;
    }

    const textStyle = percent > 0.5 ? styles.leftText : styles.rightText;

    return (
      <div style={styles.container} ref={c => (this.container = c)}>
        <div style={{ ...styles.text, ...textStyle }}>
          {this.props.completed} / {this.props.total} &nbsp;{t('complete')}
        </div>
        <div
          ref={b => (this.bar = b)}
          style={{
            ...styles.bar,
            width: `${percent * 100}%`
          }}
        />
      </div>
    );
  }
}
