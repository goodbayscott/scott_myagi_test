import React from 'react';
import { resolve } from 'react-router-named-routes';

import ModuleState from 'state/modules';

import { t } from 'i18n';
import { TextInput } from 'components/common/form';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { LoadingSpinner } from 'components/common/loading';

import { ANALYTICS_EVENTS } from 'core/constants';

const styles = {
  container: {
    padding: '25'
  },
  button: {
    display: 'block',
    width: 100,
    marginLeft: 0
  },
  spinner: {
    height: 30,
    width: 100
  },
  header: {
    borderBottom: 'none',
    paddingBottom: 0,
    fontSize: 24
  }
};

export class AddNewLessonModal extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      error: false,
      submitted: false
    };
  }

  show() {
    this.refs.addLessonModal.show();
  }

  createPlan = () => {
    const name = this.input.refs.input.value;
    if (name && name.length > 0) {
      this.setState({ ...this.state, error: false, submitted: true });
      const data = {
        name,
        description: '',
        training_plans: [this.props.plan.get('url')]
      };

      ModuleState.ActionCreators.create(data).then(res => {
        this.refs.addLessonModal.hide();
        analytics.track(ANALYTICS_EVENTS.START_MODULE_CREATION, { lessonId: res.body.id });
        this.context.router.push(resolve('lesson-management', { lessonId: res.body.id }));
      });
    } else {
      this.setState({ ...this.state, error: true, submitting: false });
    }
  };

  render() {
    // TODO: Translations
    return (
      <Modal
        ref="addLessonModal"
        header="Create Your Lesson - What is this lesson about?"
        headerStyle={styles.header}
      >
        <div>
          <p>
            Lessons can consist of a combination of videos, PDFs, web pages and multiple choice
            questions.
          </p>
          <TextInput type="text" ref={c => (this.input = c)} placeholder="eg. Myagi Runner X2000" />
          {this.state.error && (
            <div className="ui negative message">{t('please_enter_a_valid_name')}</div>
          )}
          {this.state.submitted ? (
            <LoadingSpinner containerStyle={styles.spinner} />
          ) : (
            <PrimaryButton style={styles.button} onClick={this.createPlan}>
              {t('next')}
            </PrimaryButton>
          )}
        </div>
      </Modal>
    );
  }
}
