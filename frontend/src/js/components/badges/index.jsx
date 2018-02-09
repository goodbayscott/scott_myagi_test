// TODO: Doesn't look like this is being used anymore. Remove this
import React from 'react';
import Marty from 'marty';
import Style from 'style';
import containerUtils from 'utilities/containers';

import TrainingPlansState from 'state/training-plans';

import { t } from 'i18n';
import { Modal } from 'components/common/modal/index';
import { TrainingPlanCard } from 'components/training/plans/plan-card';
import { TrainingPlanCardDetails } from 'components/training/plans/plan-card/card';
import { LoadingSpinner } from 'components/common/loading';
import { ViewTrainingPlanModal } from 'components/training/plans/plan-modal';

const TRAINING_PLAN_WIDTH = 100;

const styles = {
  badgeCard: {
    width: 50,
    boxShadow: 'none',
    padding: 5,
    margin: 5,
    border: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    borderRadius: 4
  },
  header: {
    display: 'flex',
    alignItems: 'center'
  },
  description: {
    marginBottom: 30,
    paddingBottom: 30,
    borderBottom: '1px solid #eee'
  },
  badgeImage: {
    height: 50,
    width: 50,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    marginRight: 20
  },
  trainingPlans: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  trainingPlan: {
    width: 16 / 9 * TRAINING_PLAN_WIDTH,
    display: 'flex',
    flexDirection: 'column',
    margin: 10
  },
  trainingPlanThumbnail: {
    height: TRAINING_PLAN_WIDTH,
    width: 16 / 9 * TRAINING_PLAN_WIDTH,
    backgroundColor: 'black',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
};

class BadgeAwardModalInner extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedPlan: null
    };
  }

  show = () => {
    // for some reason when we wrap the render in a <div> with the ViewTrainingPlanModal
    // the badge requires two clicks to show the modal, should figure out why
    _.defer(() => this.refs.modal.show());
  };

  render() {
    const badgeAward = this.props.badgeAward;
    if (!badgeAward) return <Modal ref="modal" />;

    const badge = badgeAward.get('badge');
    let discountCode;

    if (badge.discount_code) discountCode = badge.discount_code;
    if (badgeAward.get('unique_code')) discountCode = badgeAward.get('unique_code');

    return (
      <div>
        <Modal
          ref="modal"
          header={
            <div style={styles.header}>
              <div style={{ ...styles.badgeImage, backgroundImage: `url(${badge.badge_image})` }} />
              <div>{badge.name}</div>
            </div>
          }
        >
          <div className="content">
            <div style={styles.description}>
              {t('congratulations_you_earned_this_badge')}
              <br />
              {badge.description}
              {badge.discount_url || discountCode ? <div className="ui divider" /> : null}
              {badge.discount_url ? (
                <p>
                  <b>{t('reward_url')}:</b>{' '}
                  <a href={badge.discount_url} target="_blank">
                    {t('click_here_to_access_the_reward')}
                  </a>
                </p>
              ) : null}
              {discountCode ? (
                <p>
                  <b>{t('reward_code')}:</b> {discountCode}
                </p>
              ) : null}
            </div>

            <div style={styles.trainingPlans}>
              {this.props.training_plans &&
                this.props.training_plans.map(tp => (
                  <TrainingPlanCardDetails
                    key={tp.get('id')}
                    trainingPlan={tp}
                    currentUser={this.props.currentUser}
                    dropDownItems={[]}
                  />
                ))}

              {this.props.training_plans === undefined && <LoadingSpinner />}

              {this.props.training_plans &&
                this.props.training_plans.size == 0 && (
                  <div>{t('the_plans_for_this_badge_are_no_longer')}</div>
                )}
            </div>
          </div>
        </Modal>
        <ViewTrainingPlanModal
          ref="viewTrainingPlanModal"
          trainingPlan={this.state.selectedPlan}
          channels={[]}
          currentUser={this.props.currentUser}
        />
      </div>
    );
  }
}

export const BadgeAwardModal = Marty.createContainer(BadgeAwardModalInner, {
  listenTo: [TrainingPlansState.Store],

  fetch: {
    training_plans() {
      if (this.props.badgeAward) {
        return TrainingPlansState.Store.getItems({
          badges: this.props.badgeAward.get('badge').id,
          fields: TrainingPlanCard.data.trainingPlan.fields
        });
      }
    }
  },

  show() {
    this.refs.innerComponent.show();
  },

  pending() {
    return containerUtils.defaultPending(this, BadgeAwardModalInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, BadgeAwardModalInner, errors);
  }
});
