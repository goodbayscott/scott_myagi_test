import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';

export const IMAGE_HEIGHT = 80;
export const IMAGE_WIDTH = IMAGE_HEIGHT * (16 / 9);

import { Modal } from 'components/common/modal';
import ModuleCreationState from 'state/module-creation';

const styles = {
  container: {
    margin: '0 0 0 15px'
  },
  icon: {
    fontSize: '1.5rem',
    transition: 'all .2s ease',
    color: '#999',
    ':hover': {
      color: 'red',
      transform: 'scale(1.1)'
    }
  }
};

@Radium
export class DeleteButton extends React.Component {
  confirm = () => {
    ModuleCreationState.ActionCreators.removePage(this.props.page.get('id'));
    this.confirmDeleteModal.hide();
  };

  render() {
    return (
      <div style={styles.container}>
        <div onClick={() => this.confirmDeleteModal.show()}>
          <i className="ui icon trash outline" style={styles.icon} />
        </div>
        <Modal
          ref={m => (this.confirmDeleteModal = m)}
          onConfirm={this.confirm}
          header={t('are_you_sure')}
          basic
        >
          <div className="content">{t('you_will_not_reverse')}</div>
        </Modal>
      </div>
    );
  }
}
