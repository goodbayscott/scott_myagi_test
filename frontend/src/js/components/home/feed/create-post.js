import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';

import PostActivitiesState from 'state/post-activities';
import UserTimelineState from 'state/user-timeline';

import { Modal } from 'components/common/modal/index';
import { NeutralMessage } from 'components/common/message';
import { Form, TextInput, SubmitButton } from 'components/common/form';
import { SendButton } from './common';

const FEED_REFRESH_DELAY = 0;

const styles = {
  input: {
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderRadius: 0
  }
};

@Radium
export default class CreatePostForm extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor() {
    super();
    this.state = {
      hasVal: false,
      submitCount: 0,
      loading: false
    };
  }

  onSubmit = data => {
    // Create the post and then reset the user timeline.
    // Assuming that user's feed follows have been set up correctly,
    // they should see the post in their feed as the first item
    if (this.state.loading) return;
    this.setState({ loading: true });
    PostActivitiesState.ActionCreators.create({
      ...data,
      user: this.context.currentUser.get('url')
    }).then(() =>
      _.delay(() => {
        this.props.refreshData();
        this.setState({ loading: false, submitCount: this.state.submitCount + 1 });
      }, FEED_REFRESH_DELAY));
  };

  onInputChange = (evt, val) => {
    if (val && val.length) this.setState({ hasVal: true });
    else this.setState({ hasVal: false });
  };

  render() {
    return (
      <div>
        <Form
          ref={e => (this.form = e)}
          onSubmitAndValid={this.onSubmit}
          key={this.state.submitCount}
        >
          <TextInput
            placeholder={t('add_text_here')}
            name="body"
            style={styles.input}
            onChange={this.onInputChange}
            actionComponent={
              <SendButton
                isValid={this.state.hasVal}
                onClick={() => this.form.doSubmit()}
                loading={this.state.loading}
              />
            }
          />
        </Form>
      </div>
    );
  }
}
