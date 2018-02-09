import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';

import { t } from 'i18n';
import { FullWidthSegment } from 'components/common/box.jsx';
import { PrimaryButton } from 'components/common/buttons';
import { LoadingContainer, NoData } from 'components/common/loading';
import { Modal } from 'components/common/modal/index.jsx';
import containerUtils from 'utilities/containers.js';
import ChannelsState from 'state/channels';

import BadgesState from 'state/badges';
import { CreateBadgeModal, EditBadgeModal } from './modal.jsx';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap'
  },
  badge: {
    display: 'flex',
    margin: '10px 20px 10px 0px',
    cursor: 'pointer'
  },
  image: {
    height: 110,
    marginRight: 10
  },
  createBadge: {
    height: 110,
    width: 110,
    margin: '10px 0',
    cursor: 'pointer',
    borderRadius: 3,
    border: '1px solid #eee',
    // backgroundColor: '#eee',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: '0.3s all',
    ':hover': {
      backgroundColor: '#eee'
    }
  },
  addPlus: {
    fontSize: '5rem',
    color: '#999'
  },
  addText: {
    textAlign: 'center',
    marginTop: 10
  },
  titleContainer: {
    display: 'flex'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: 4,
    marginRight: 10
  },
  plansContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    maxHeight: 90,
    maxWidth: 400,
    overflowY: 'auto'
  },
  plan: {
    backgroundColor: '#eee',
    borderRadius: 100,
    margin: '0px 6px 4px 0px',
    padding: '2px 10px'
  }
};

class BadgeItem extends React.Component {
  static propTypes = {
    badge: React.PropTypes.instanceOf(Im.Map).isRequired,
    channel: React.PropTypes.instanceOf(Im.Map).isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    trainingPlanTrainingUnits: React.PropTypes.instanceOf(Im.List).isRequired
  };
  onArchiveClick = e => {
    e.stopPropagation();
    this.refs.archiveModal.show();
  };
  doArchive = () => {
    BadgesState.ActionCreators.update(this.props.badge.get('id'), {
      badge_active: false
    });
  };
  editBadge = e => {
    e.stopPropagation();
    this.refs.editModal.show();
  };
  render() {
    const key = 1;
    const activePlans = _.filter(this.props.badge.get('training_plans'), plan => !plan.deactivated);

    return (
      <div onClick={this.editBadge}>
        <div style={styles.badge}>
          <img src={this.props.badge.get('badge_image')} style={styles.image} />
          <div>
            <div style={styles.titleContainer}>
              <div style={styles.title}>{this.props.badge.get('name')}</div>
              <span onClick={this.onArchiveClick}>
                <i className="ui icon remove" />
              </span>
            </div>
            <div style={styles.plansContainer}>
              {activePlans.map(tp => (
                <div style={styles.plan} key={tp.id}>
                  {tp.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Modal
          content={t('badge_archive_info')}
          onConfirm={this.doArchive}
          ref="archiveModal"
          basic
        />
        <EditBadgeModal
          ref="editModal"
          channel={this.props.channel}
          trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
          currentUser={this.props.currentUser}
          badge={this.props.badge}
        />
      </div>
    );
  }
}

@Radium
class BadgesInner extends React.Component {
  showCreateBadgeModal = () => {
    if (this.props.trainingPlanTrainingUnits.count() > 0) {
      this.refs.createBadgeModal.show();
    } else {
      this.refs.noTrainingPlansModal.show();
    }
  };
  render() {
    return (
      <div>
        {this.props.badges &&
          this.props.trainingPlanTrainingUnits && (
            <div style={styles.container}>
              {this.props.badges.map(b => (
                <BadgeItem
                  key={b.get('id')}
                  badge={b}
                  channel={this.props.channel}
                  trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
                  currentUser={this.props.currentUser}
                />
              ))}
              <div onClick={this.showCreateBadgeModal} style={styles.createBadge}>
                <div style={styles.addPlus}>+</div>
                <div style={styles.addText}>{t('add_badge')}</div>
              </div>
            </div>
          )}
        <CreateBadgeModal
          ref="createBadgeModal"
          channel={this.props.channel || new Im.Map()}
          trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
          currentUser={this.props.currentUser}
        />
        <Modal
          ref="noTrainingPlansModal"
          header={t('no_plans')}
          content={t('must_add_plans_to_channel_before_creating_badge')}
          message
          basic
        />
      </div>
    );
  }
}

export const Badges = Marty.createContainer(BadgesInner, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [BadgesState.Store, ChannelsState.Store],
  fetch: {
    badges() {
      return BadgesState.Store.getItems(
        {
          training_unit: this.props.channel.get('id'),
          badge_active: true,
          fields: [
            'name',
            'description',
            'badge_image',
            'badge_active',
            'discount_code',
            'discount_url',
            'unique_codes',
            'used_unique_codes',
            'training_plans.name',
            'training_plans.url',
            'training_plans.deactivated'
          ]
        },
        {
          dependantOn: ChannelsState.Store
        }
      );
    }
  },
  pending() {
    return containerUtils.defaultPending(this, BadgesInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, BadgesInner, errors);
  }
});
