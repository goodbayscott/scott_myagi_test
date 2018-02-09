import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import { Modal } from 'components/common/modal';
import { ChannelsModal } from './modal/modal';
import Im from 'immutable';
import Style from 'style';

import Marty from 'marty';
import $y from 'utilities/yaler';
import PageState from './state';
import CompaniesState from 'state/companies';
import TrainingPlansState from 'state/training-plans';
import ChannelsState from 'state/channels';
import containerUtils from 'utilities/containers';
import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';
import { LoadingContainer } from 'components/common/loading';
import { EditButton } from '../../../common/edit-button';

const styles = {
  container: {},
  channel: {
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    borderRadius: 5,
    border: '1px solid #fff',
    cursor: 'pointer',
    padding: 4,
    ':hover': {
      transform: 'translateX(5px)'
    }
  },
  title: {
    fontWeight: '200',
    fontSize: '1.6rem',
    marginBottom: 10
  },
  img: {
    height: 50,
    width: 50,
    marginRight: 10,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  name: {
    color: '#111'
  }
};

@Radium
export class ChannelsSectionInner extends React.Component {
  static data = {
    channels: {
      required: true,
      fields: [
        'id',
        'name',
        'url',
        'logo',
        'training_plans.url',
        'training_plans.training_units',
        'subscribed_companies_count'
      ]
    }
  };

  planChannels = () =>
    this.props.channels.filter(c => {
      const planURLS = c.get('training_plans').map(plan => plan.url);
      return planURLS.indexOf(this.props.plan.get('url')) > -1;
    });

  render() {
    const channels = this.planChannels();

    return (
      <div style={styles.container}>
        <div>
          <div style={styles.title}>Channels</div>
          {channels.map(c => (
            <Link to={resolve('channel', { channelId: c.get('id') })} key={c.get('id')}>
              <div style={styles.channel} key={c.get('id')}>
                <div style={{ ...styles.img, backgroundImage: `url(${c.get('logo')})` }} />
                <div style={styles.name}>{c.get('name')}</div>
              </div>
            </Link>
          ))}
          <EditButton
            onClick={() => {
              this.refs.channelModal.show();
            }}
            length={channels.size}
          />
        </div>

        <Modal ref="channelModal" header={t('select_channels')}>
          <ChannelsModal {...this.props} />
        </Modal>
      </div>
    );
  }
}

export class ChannelsSectionContainer extends React.Component {
  render() {
    return (
      <LoadingContainer
        loadingProps={{
          channels: this.props.channels
        }}
        createComponent={props => <ChannelsSectionInner {...this.props} />}
      />
    );
  }
}

export const ChannelsSection = Marty.createContainer(ChannelsSectionContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [
    TrainingPlansState.Store,
    CompaniesState.Store,
    ChannelsState.Store,
    PageState.Store,
    TrainingPlanTrainingUnitsState.Store
  ],
  fetch: {
    channels() {
      const learner = this.props.currentUser.get('learner');
      if (!learner) return;
      const co = learner.company;
      if (!co) return;
      const q = ChannelsState.Store.getItems(
        {
          company: co.id,
          fields: $y.getFields(ChannelsSectionInner, 'channels'),
          limit: 0,
          ordering: 'name',
          // We don't want to show team channels here, because
          // that will clutter the channels list.
          learner_group__isnull: true
        },
        { dependantOn: TrainingPlanTrainingUnitsState.Store }
      );
      return q;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelsSectionContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelsSectionContainer, errors);
  }
});
