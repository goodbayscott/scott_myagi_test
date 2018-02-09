import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { qs } from 'utilities/http';

import ModuleCreationState from 'state/module-creation';

import { RouterBackButton } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { Details } from './details';
import { Analytics } from './analytics';
import { Plans } from './plans';
import { Pages } from './pages';

const COLUMN_PANELS = '@media screen and (max-width: 750px)';

const styles = {
  container: {
    background: '#eee',
    minHeight: 'calc(100vh - 80px)'
  },
  panelContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    background: '#eee',
    width: '100%',
    [COLUMN_PANELS]: {
      flexDirection: 'column',
      alignItems: 'center'
    }
  },
  panel: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginLeft: 10,
    marginBottom: 10,
    marginRight: 10,
    padding: 22
  },
  rightPanels: {
    marginTop: 30,
    maxWidth: 435,
    minWidth: 320
  },
  leftPanels: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 1300,
    flexGrow: 1
  },
  break: {
    borderBottom: '1px solid #e5e5e5',
    marginTop: 40,
    marginBottom: 40
  },
  backLink: {
    color: '#555',
    fontSize: '1.4rem',
    paddingTop: 10,
    paddingLeft: 30
  }
};

@Radium
class Lesson extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    location: React.PropTypes.object.isRequired
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.saveExecuting && !nextProps.saveExecuting) {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    }
  }

  render() {
    let route;
    const planId = this.context.location.query.returnToPlan;
    if (planId) {
      route = `/views/content/plans/${planId}/`;
    }
    return (
      <div style={styles.container}>
        <div style={styles.panelContainer}>
          <div style={styles.leftPanels}>
            <div style={styles.backLink}>
              <RouterBackButton text="Plan" route={route} />
            </div>
            <div style={styles.panel}>
              <Details {...this.props} />
            </div>
            <div style={styles.panel}>
              <Pages lesson={this.props.lesson} />
            </div>
          </div>
          <div style={styles.rightPanels}>
            <div style={styles.panel}>
              {this.props.currentUser.get('learner').is_learner_group_admin &&
              !this.props.currentUser.get('learner').is_company_admin ? (
                <div />
                ) : (
                  <div>
                    <Plans lesson={this.props.lesson} />
                    <div style={styles.break} />
                  </div>
                )}
              <Analytics lesson={this.props.lesson} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class LessonContainer extends React.Component {
  render() {
    const loaded = this.props.lesson && this.props.lesson.get('id');
    return (
      <LoadingContainer
        loadingProps={[loaded ? this.props.lesson : undefined]}
        createComponent={props => <Lesson {...this.props} />}
      />
    );
  }
}

export const Page = Marty.createContainer(LessonContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [ModuleCreationState.Store],

  fetch: {
    lesson() {
      return ModuleCreationState.Store.getModule();
    },
    saveExecuting() {
      return ModuleCreationState.Store.getSaveExecuting();
    }
  },

  componentDidMount() {
    ModuleCreationState.Store.reset(parseInt(this.context.routeParams.lessonId));
  },

  pending() {
    return containerUtils.defaultPending(this, LessonContainer);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, LessonContainer, errors);
  }
});
