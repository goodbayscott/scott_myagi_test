import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import cx from 'classnames';
import Style from 'style';

const styles = {
  editButton: {
    backgroundColor: '#eee',
    color: '#444',
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 4,
    margin: '4px 8px 4px 0px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: Style.vars.colors.get('primary'),
      color: Style.vars.colors.get('primaryFontColor')
    }
  }
};

@Radium
export class EditButton extends React.Component {
  render() {
    const classes = cx('ui icon circle', {
      add: this.props.length == 0,
      pencil: this.props.length > 0
    });
    return (
      <div key={this.props.id} style={styles.editButton} onClick={this.props.onClick}>
        <i className={classes} />
        {this.props.length === 0 ? t('add') : t('edit')}
      </div>
    );
  }
}
