import React from 'react';
import { t } from 'i18n';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';

export class AddLessonModal extends React.Component {
  show = () => {
    this.refs.addOrCreateLessonModal.show();
  };

  hide = () => {
    this.refs.addOrCreateLessonModal.hide();
  };

  render() {
    return (
      <Modal
        ref="addOrCreateLessonModal"
        header={t('add_a_lesson_to_the_plan', { name: this.props.plan.get('name') })}
      >
        <div className="content" style={{ textAlign: 'center' }}>
          <PrimaryButton style={{ display: 'inline-block' }} onClick={this.props.createNewLesson}>
            {t('create_a_new_lesson')}
          </PrimaryButton>
          <div className="ui horizontal divider">{t('or')}</div>
          <PrimaryButton style={{ display: 'inline-block' }} onClick={this.props.addExistingLesson}>
            {t('add_existing_lesson')}
          </PrimaryButton>
        </div>
      </Modal>
    );
  }
}
