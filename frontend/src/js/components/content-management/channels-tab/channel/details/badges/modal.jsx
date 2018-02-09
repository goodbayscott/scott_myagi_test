import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import BadgesState from 'state/badges';
import { Modal } from 'components/common/modal';

import {
  BadgeDetailsFormFirstPage,
  BadgeDetailsFormSecondPage,
  BadgeDetailsFormThirdPage
} from './details-form';

const BadgeModalMixin = {
  contextTypes: {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      data: {},
      loading: false
    };
  },
  onFirstPageSubmitAndValid(data) {
    _.extend(this.state.data, data);
    // Need to call cleanup explicitly as Semantic UI
    // does not do it automatically when one modal
    // overlays another
    this.refs.firstPageModal.hide();
    this.refs.secondPageModal.show();
  },
  onSecondPageSubmitAndValid(data) {
    _.extend(this.state.data, data);
    // Need to call cleanup explicitly as Semantic UI
    // does not do it automatically when one modal
    // overlays another
    this.refs.secondPageModal.hide();
    this.refs.thirdPageModal.show();
  },
  show() {
    this.refs.firstPageModal.show();
  },
  hide() {
    this.refs.firstPageModal.hide();
    this.refs.secondPageModal.hide();
    this.refs.thirdPageModal.hide();
  },
  render() {
    return (
      <div>
        <Modal
          ref="firstPageModal"
          closeOnDimmerClick
          header={this.props.badge ? 'Edit Badge' : 'Create Badge'}
        >
          <div className="content">
            <BadgeDetailsFormFirstPage
              onSubmitAndValid={this.onFirstPageSubmitAndValid}
              badge={this.props.badge}
            />
          </div>
        </Modal>
        <Modal
          ref="secondPageModal"
          closeOnDimmerClick
          header={this.props.badge ? 'Edit Badge' : 'Create Badge'}
        >
          <div className="content">
            <BadgeDetailsFormSecondPage
              onSubmitAndValid={this.onSecondPageSubmitAndValid}
              badge={this.props.badge}
            />
          </div>
        </Modal>
        <Modal
          ref="thirdPageModal"
          closeOnDimmerClick
          header={this.props.badge ? 'Edit Badge' : 'Create Badge'}
        >
          <div className="content">
            <BadgeDetailsFormThirdPage
              onSubmitAndValid={this.onThirdPageSubmitAndValid}
              currentUser={this.props.currentUser}
              trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
              loading={this.state.loading}
              badge={this.props.badge}
            />
          </div>
        </Modal>
      </div>
    );
  }
};

export const CreateBadgeModal = React.createClass({
  mixins: [BadgeModalMixin],
  propTypes: {
    trainingPlanTrainingUnits: React.PropTypes.instanceOf(Im.List),
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  onThirdPageSubmitAndValid(data) {
    const plans = data.training_plans;
    data = this.state.data;
    data.training_plans = plans;
    data.training_unit = this.props.channel.get('url');
    this.setState({ loading: true });
    BadgesState.ActionCreators.create(data).then(() => {
      this.hide();
      this.context.displayTempPositiveMessage({
        heading: 'Created badge for channel'
      });
      this.setState(this.getInitialState());
    });
  }
});

export const EditBadgeModal = React.createClass({
  mixins: [BadgeModalMixin],
  propTypes: {
    trainingPlanTrainingUnits: React.PropTypes.instanceOf(Im.List),
    channel: React.PropTypes.instanceOf(Im.Map).isRequired,
    badge: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  onThirdPageSubmitAndValid(data) {
    const plans = data.training_plans;
    data = this.state.data;
    data.training_plans = plans;
    data.training_unit = this.props.channel.get('url');
    data.discount_url = data.discount_url ? data.discount_url : '';
    // If badge_image is just a URL, do not send it back to the server.
    // Otherwise, will get a 400.
    if (data.badge_image === this.props.badge.get('badge_image')) {
      delete data.badge_image;
    }
    this.setState({ loading: true });
    // Hide immediately to avoid errors
    this.hide();
    BadgesState.ActionCreators.update(this.props.badge.get('id'), data).then(() => {
      this.context.displayTempPositiveMessage({
        heading: 'Badge updated'
      });
      this.setState(this.getInitialState());
    });
  }
});
