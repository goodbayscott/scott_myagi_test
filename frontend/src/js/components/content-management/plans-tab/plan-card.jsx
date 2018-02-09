import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';

import { t } from 'i18n';

import TrainingPlansState from 'state/training-plans';

import $y from 'utilities/yaler';
import { momentToISO } from 'utilities/time';

import Style from 'style';

import { Info } from 'components/common/info';
import { Modal } from 'components/common/modal';
import { EnrollWithSelectedPlansModal } from 'components/enrollments/enroll-modal';
import { Dropdown } from 'components/common/dropdown.jsx';
import { orderingStyles } from 'components/common/ordering';

import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const WIDTH = 330;
const IMG_HEIGHT = 9 / 16 * WIDTH; // ratio should be 16:9 with width

const style = {
  container: Style.funcs.merge(
    {
      width: WIDTH,
      margin: '12px 12px 25px 12px',
      display: 'flex',
      flexDirection: 'column',
      color: Style.vars.colors.get('black'),
      backgroundColor: 'white'
    },
    Style.funcs.makeTransitionAll()
  ),
  extraPadding: {
    padding: 5
  },
  img: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'flex-end',
    height: IMG_HEIGHT,
    width: '100%',
    cursor: 'pointer',
    ':hover': {}
  },
  companyNameRow: {
    marginTop: 8,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  companyNameContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  companyLogo: {
    maxWidth: 26,
    maxHeight: 20,
    marginRight: 5
  },
  companyName: {
    fontSize: 12,
    maxWidth: 200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#888'
  },
  description: {
    color: 'grey'
  },
  iconsList: {
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    marginLeft: 5
  },
  greenIcon: {
    color: Style.vars.colors.get('oliveGreen')
  },
  redIcon: {
    color: Style.vars.colors.get('red')
  },
  blackIcon: {
    color: '#666'
  },
  greyIcon: {
    color: '#bbb'
  },
  trainingPlanName: {
    margin: '5px 15px 5px 0',
    fontSize: 18,
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  trainingPlanNameHover: {
    textDecoration: 'underline'
  },
  badgeImage: {
    margin: 7,
    height: 50,
    width: 50,
    borderRadius: 3,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#f7f7f7',
    border: '3px solid #f7f7f7',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0 0 12px'
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap-reverse',
    alignItems: 'flex-end',
    width: '100%',
    minHeight: 34
  },
  dropdown: {
    float: 'right',
    height: 0
  },
  dropdownIcon: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.9)',
    padding: '7px 7px 7px 12px',
    width: 35,
    height: 35,
    margin: 0,
    borderBottomLeftRadius: 27
  },
  unpublishedContainer: {
    height: 0
  },
  unpublished: {
    position: 'relative',
    top: 0,
    display: 'inline-block',
    padding: '6px 20px 7px 10px',
    backgroundColor: 'rgba(236, 21, 21, 0.72)',
    color: '#fff',
    borderBottomRightRadius: 27
  }
};

@Radium
export class PlanCardDetails extends React.Component {
  static data = {
    trainingPlan: {
      fields: [
        'id',
        'modules',
        'deactivated',
        'is_published',
        'name',
        'auto_enroll',
        'owner.company_name',
        'badges.name',
        'badges.badge_name',
        'badges.id',
        'badges.badge_image',
        'thumbnail_url',
        'custom_thumbnail',
        'custom_thumbnail_small',
        'num_enrolled_users',
        'num_enrolled_users_in_own_company'
      ]
    }
  };

  getIcons() {
    const learner = this.props.currentUser.get('learner');
    const enableGroupsAndAreas = learner.company.subscription.groups_and_areas_enabled;
    const icons = [];
    if (!enableGroupsAndAreas) return [];
    const deactivated = this.props.trainingPlan.get('deactivated');
    if (deactivated) return [];

    if (learner.is_company_admin) {
      const planInCompanyAutoEnroll = _.includes(
        learner.company.auto_enroll_plans,
        this.props.trainingPlan.get('url')
      );

      if (this.props.trainingPlan.get('auto_enroll') || planInCompanyAutoEnroll) {
        // Auto enroll vs individually enrolled have the same icon. Auto enroll just turns it green
        icons.push({
          info: 'Auto enroll on',
          el: <i className="ui icon student" style={style.greenIcon} />
        });
        // }
      }
      const enrolled = this.props.trainingPlan.get('num_enrolled_users_in_own_company');
      const total = learner.company.user_count;

      if (!planInCompanyAutoEnroll) {
        icons.push({
          info: 'Users enrolled in your company',
          el: (
            <div style={style.blackIcon}>
              <i className="ui icon student" />
              {parseInt(100 * enrolled / total)}%
            </div>
          )
        });
      }
    }
    return icons;
  }

  render() {
    const trainingPlan = this.props.trainingPlan;
    const containerHover = Radium.getState(this.state, 'container', ':hover');
    const deactivated = Boolean(this.props.trainingPlan.get('deactivated'));
    const customThumbnail = trainingPlan.get('custom_thumbnail_small')
      ? trainingPlan.get('custom_thumbnail_small')
      : trainingPlan.get('thumbnail_url');

    return (
      <div
        style={[
          style.container,
          // This is added for sortable plan card because it makes the card look better
          // when it is highlighted
          this.props.addPadding && style.extraPadding,
          this.props.highlight && orderingStyles.highlight
        ]}
      >
        {!this.props.highlight &&
          this.props.dropDownItems.length > 0 && (
            <Dropdown className="ui pointing top right dropdown" style={style.dropdown}>
              <i className="icon ellipsis vertical" style={style.dropdownIcon} key="dropdownIcon" />
              <div className="menu">
                {_.map(this.props.dropDownItems, i => (
                  <div key={i.label} className="item" onClick={i.action}>
                    {i.label}
                  </div>
                ))}
              </div>
            </Dropdown>
          )}

        {!this.props.trainingPlan.get('is_published') &&
          !deactivated && (
            <div style={style.unpublishedContainer}>
              <div style={style.unpublished}>{t('unpublished')}</div>
            </div>
          )}

        {deactivated && (
          <div style={style.unpublishedContainer}>
            <div style={style.unpublished}>{t('archived')}</div>
          </div>
        )}

        <div
          key="container"
          style={[
            {
              ...style.img,
              backgroundImage: `url(${customThumbnail || PLACEHOLDER_IMAGE})`
            },
            this.props.highlight && orderingStyles.moveable
          ]}
          onClick={this.props.showTrainingPlanDetails}
        >
          <div style={style.badgeContainer}>
            {trainingPlan.get('badges').map(badge => (
              <Info
                key={badge.id}
                content={t('this_plan_contributes_to_earning_the', {
                  badgeName: badge.name
                })}
              >
                <div
                  style={{
                    ...style.badgeImage,
                    backgroundImage: `url(${badge.badge_image})`
                  }}
                />
              </Info>
            ))}
          </div>
        </div>

        <div style={style.companyNameRow}>
          <div style={style.companyNameContainer}>
            <img style={style.companyLogo} src={trainingPlan.get('owner').company_logo} />
            <div style={style.companyName}>{trainingPlan.get('owner').company_name}</div>
          </div>
          <div style={style.iconsList}>
            {this.getIcons().map((icon, i) => (
              <Info content={icon.info} key={i}>
                <div style={style.icon}>{icon.el}</div>
              </Info>
            ))}
          </div>
        </div>

        <div
          onClick={this.props.showTrainingPlanDetails}
          style={[
            {
              ...style.trainingPlanName,
              ...(containerHover ? style.trainingPlanNameHover : {})
            },
            this.props.highlight && orderingStyles.moveable
          ]}
        >
          {trainingPlan.get('name')}
        </div>
      </div>
    );
  }
}

export class PlanCard extends React.Component {
  static data = {
    trainingPlan: {
      required: true,
      fields: [
        'id',
        'url',
        'modules.id',
        'modules.url',
        'owner.url',
        'owner.company_name',
        'owner.company_logo',
        'training_units.learner_group',
        $y.getFields(PlanCardDetails, 'trainingPlan')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(PlanCard, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super();
    let autoEnrollPlans = [];
    if (props.currentUser.get('learner').company) {
      autoEnrollPlans = props.currentUser.get('learner').company.auto_enroll_plans;
    }
    this.state = {
      auto_enroll_plans: autoEnrollPlans
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false;
    _.each(this.props, (val, key) => {
      if (nextProps[key] !== val) {
        shouldUpdate = true;
      }
    });
    return shouldUpdate;
  }

  getDropdownItems() {
    const learner = this.props.currentUser.get('learner');
    const tp = this.props.trainingPlan;
    const lg =
      tp.get('training_units') &&
      tp.get('training_units')[0] &&
      tp.get('training_units')[0].learner_group;
    const items = [];

    if (
      tp.get('deactivated') &&
      learner.can_manage_training_content &&
      learner.company.url === tp.get('owner').url
    ) {
      items.push({
        label: t('restore_from_archive'),
        action: this.showRestorePlanModal
      });
      return items;
    }
    if (!tp.get('deactivated')) {
      if (learner.company.subscription.groups_and_areas_enabled) {
        items.push({
          label: t('enroll'),
          action: this.enrollWithSelectedPlan
        });
      }
      if (learner.company.url === tp.get('owner').url) {
        items.push({
          label: t('details'),
          action: this.editPlan
        });
        if (learner.is_learner_group_admin && lg !== learner.learner_group) {
          items.pop({
            label: t('details'),
            action: this.editPlan
          });
        }
        if (
          learner.can_manage_training_content ||
          (learner.is_learner_group_admin && lg === learner.learner_group)
        ) {
          items.push({
            label: t('archive'),
            action: this.deletePlan
          });
        }
      }
    }

    return items;
  }

  editPlan = () => {
    this.context.router.push(`${resolve('plan-management', {
      planId: this.props.trainingPlan.get('id')
    })}`);
  };

  showRestorePlanModal = () => {
    this.refs.restorePlanModal.show();
  };

  currentCompanyAutoEnrollPlans = () =>
    this.props.currentUser.get('learner').company.auto_enroll_plans;

  restorePlanConfirmClick = () => {
    TrainingPlansState.ActionCreators.update(this.props.trainingPlan.get('id'), {
      deactivated: null
    });
    this.refs.restorePlanModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
  };

  startEnrollment = () => {
    this.context.router.push(`${resolve('plan-management', {
      planId: this.props.trainingPlan.get('id')
    })}?tab=Plan Enrollment`);
  };

  enrollWithSelectedPlan = () => {
    this.refs.enrollModal.show();
  };

  deletePlan = () => {
    this.refs.deletePlanModal.show();
  };

  deleteConfirmClick = () => {
    const now = momentToISO(moment());
    this.refs.deletePlanModal.hide();
    const message = 'Plan archived';
    const planName = this.props.trainingPlan.get('name');
    TrainingPlansState.ActionCreators.update(this.props.trainingPlan.get('id'), {
      deactivated: now
    }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Plan archived',
        body: `Plan <b>${this.props.trainingPlan.get('name')}</b> has been archived`
      });
    });
  };

  addModule = () => {
    this.context.router.push(resolve('create-module', { planId: this.props.trainingPlan.get('id') }));
  };

  viewEnrollments = () => {
    this.context.router.push(resolve('training-plan-enrollments', {
      planId: this.props.trainingPlan.get('id')
    }));
  };

  showNoModulesWarning = () => {
    this.refs.noModulesWarningModal.show();
  };

  showPlanDetails = plan => {
    this.props.showTrainingPlanDetails
      ? this.props.showTrainingPlanDetails()
      : this.props.openTrainingPlanModal(plan);
  };

  render() {
    return (
      <div>
        <PlanCardDetails
          trainingPlan={this.props.trainingPlan}
          currentUser={this.props.currentUser}
          showTrainingPlanDetails={this.showPlanDetails.bind(this, this.props.trainingPlan)}
          addPadding={this.props.addPadding}
          highlight={this.props.highlight}
          dropDownItems={
            this.props.dropdownItems ? this.props.dropdownItems : this.getDropdownItems()
          }
        />
        <Modal ref="noModulesWarningModal" header={t('this_plan_has_no_lessons')} basic message>
          <div className="content">{t('lessons_must_be_added')}</div>
        </Modal>
        <EnrollWithSelectedPlansModal
          ref="enrollModal"
          currentUser={this.props.currentUser}
          selectedTrainingPlans={[this.props.trainingPlan]}
        />
        <Modal
          ref="deletePlanModal"
          onConfirm={this.deleteConfirmClick}
          header={t('sure_you_want_to_archive')}
          basic
        />

        <Modal
          ref="restorePlanModal"
          onConfirm={this.restorePlanConfirmClick}
          header={t('want_to_restore_from_archive')}
          basic
        />
      </div>
    );
  }
}
