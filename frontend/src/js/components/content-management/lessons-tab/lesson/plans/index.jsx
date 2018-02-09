import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';

import { Modal } from 'components/common/modal';
import Im from 'immutable';
import Style from 'style';

import Marty from 'marty';
import $y from 'utilities/yaler';
import TrainingPlansState from 'state/training-plans';
import ModuleTrainingPlansState from 'state/module-training-plans';
import containerUtils from 'utilities/containers';
import { LoadingContainer } from 'components/common/loading';
import { EditButton } from '../../../common/edit-button';
import { PlansModal } from './modal';

const styles = {
  container: {},
  plan: {
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    borderRadius: 5,
    border: '1px solid #fff',
    cursor: 'pointer',
    margin: '10px 0px',
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
    height: 40,
    width: 40 * 16 / 9,
    marginRight: 10,
    backgroundColor: '#f6f6f6',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    flexShrink: 0
  },
  name: {
    color: '#111',
    flexShrink: 1
  },
  archivedName: {
    color: '#999 !important'
  },
  notPubText: {
    color: Style.vars.colors.get('darkRed')
  }
};

@Radium
export class PlansInner extends React.Component {
  static data = {
    plans: {
      required: true,
      fields: ['id', 'name', 'thumbnail_url', 'url', 'deactivated', 'is_published']
    }
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  };

  renderUnpublishedLessonWarning = () => {
    const { moduleTrainingPlans } = this.props;
    const publishedPlans = moduleTrainingPlans.filter(mtp => {
      const tp = mtp.get('training_plan');
      return tp.is_published;
    });
    if (publishedPlans.size) {
      return <span />;
    }
    return (
      <div className="ui red message">
        <div className="header">{t('this_lesson_is_not_accessible')}</div>
        <p>{t('lesson_does_not_belong_to_plan')}</p>
      </div>
    );
  };

  render() {
    return (
      <div style={styles.container}>
        {this.renderUnpublishedLessonWarning()}
        <div>
          <div style={styles.title}>{t('plans')}</div>
          {this.props.moduleTrainingPlans.map(mtp => {
            const trainingPlan = mtp.get('training_plan');
            const deactivated = trainingPlan.deactivated;
            const link = `${resolve('plan-management', {
              planId: trainingPlan.id
            })}?previous=Lesson`;
            const inner = (
              <div style={styles.plan} key={mtp.get('id')}>
                <div
                  style={{
                    ...styles.img,
                    backgroundImage: `url(${trainingPlan.thumbnail_url})`
                  }}
                />
                <div
                  style={{
                    ...styles.name,
                    ...(deactivated && styles.archivedName)
                  }}
                >
                  {trainingPlan.name}{' '}
                  {!trainingPlan.is_published && (
                    <span style={styles.notPubText}>{`(${t('not_published')})`}</span>
                  )}
                  {deactivated && <i> {`(${t('archived')})`} </i>}
                </div>
              </div>
            );

            return deactivated ? (
              <div style={{ pointerEvents: 'none' }} key={trainingPlan.id}>
                {inner}
              </div>
            ) : (
              <Link to={link} key={trainingPlan.id}>
                {inner}
              </Link>
            );
          })}
          <EditButton
            onClick={() => this.planModal.show()}
            length={this.props.moduleTrainingPlans.size}
          />
        </div>

        <Modal ref={m => (this.planModal = m)} header={t('plans')}>
          <PlansModal
            lesson={this.props.lesson}
            currentUser={this.context.currentUser}
            initialPlans={this.props.moduleTrainingPlans.map(mtp => mtp.get('training_plan'))}
            onSubmit={() => this.planModal.hide()}
          />
        </Modal>
      </div>
    );
  }
}

export class PlansContainer extends React.Component {
  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.moduleTrainingPlans]}
        createComponent={props => <PlansInner {...this.props} />}
      />
    );
  }
}

export const Plans = Marty.createContainer(PlansContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [TrainingPlansState.Store, ModuleTrainingPlansState.Store],
  fetch: {
    moduleTrainingPlans() {
      return ModuleTrainingPlansState.Store.getItems(
        {
          ordering: 'training_plan__name',
          module: this.props.lesson.get('id'),
          limit: 0,
          fields: ['order', $y.getFields(PlansInner, 'plans', 'training_plan')]
        },
        { dependantOn: ModuleTrainingPlansState.Store }
      );
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PlansContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, PlansContainer, errors);
  }
});
