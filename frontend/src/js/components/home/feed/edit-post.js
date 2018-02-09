import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';

import PostActivitiesState from 'state/post-activities';
import UserTimelineState from 'state/user-timeline';

import { Modal } from 'components/common/modal';
import { NeutralMessage } from 'components/common/message';
import { Form, TextInput, SubmitButton } from 'components/common/form';

import { SendButton } from './common';

const styles = {
  input: {
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderRadius: 0
  }
};

@Radium
export default class EditPostModal extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor() {
    super();
    this.state = {
      hasVal: false
    };
  }

  onSubmit = data => {
    PostActivitiesState.ActionCreators.update(
      this.props.activity.get('object').get('id'),
      data
    ).then(() => {
      UserTimelineState.ActionCreators.resetLocalData();
      this.modal.hide();
    });
  };

  triggerSubmit = () => {
    this.form.doSubmit();
  };

  onInputChange = (evt, val) => {
    if (val && val.length) this.setState({ hasVal: true });
    else this.setState({ hasVal: false });
  };

  show() {
    this.modal.show();
  }

  render() {
    const post = this.props.activity.get('object');
    return (
      <Modal
        basic
        ref={e => (this.modal = e)}
        leftText={t('cancel')}
        rightText={t('submit')}
        onConfirm={this.triggerSubmit}
        header={t('edit_your_post')}
      >
        <Form ref={e => (this.form = e)} onSubmitAndValid={this.onSubmit}>
          <TextInput
            initialValue={post.get('body')}
            name="body"
            style={styles.input}
            onChange={this.onInputChange}
            initialIsAcceptable
          />
        </Form>
      </Modal>
    );
  }
}
