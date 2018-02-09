import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';
import $y from 'utilities/yaler';
import { isMobileWidth } from 'utilities/generic';
import { PAGE_TYPES_LOOKUP } from './pages';

const DISPLAY_LAST_PAGE = 'last';
const DISPLAY_ALL_PAGES = 'all';

const style = {
  container: {
    ...Style.common.verticalDiscreteProgressBar.container,
    backgroundColor: Style.vars.colors.get('mediumGrey'),
    [Style.vars.media.get('mobile')]: {
      backgroundColor: Style.vars.colors.get('xLightGrey'),
      paddingBottom: 60
    }
  },
  modContainer: {
    padding: '10px 15px'
  },
  modOuterContainer: Style.common.verticalDiscreteProgressBar.itemOuterContainer,
  modInnerContainer: Style.common.verticalDiscreteProgressBar.itemInnerContainer,
  modInnerContainerInProgress:
    Style.common.verticalDiscreteProgressBar.itemInnerContainerInProgress,
  blackLine: Style.common.verticalDiscreteProgressBar.blackLine,
  image: {
    display: 'flex',
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: Style.vars.colors.get('grey'),
    height: 35,
    width: 65
  },
  icon: {
    position: 'absolute',
    fontSize: 25,
    lineHeight: 25,
    color: Style.vars.colors.get('lightGrey'),
    zIndex: 10,
    top: '50%',
    transform: 'translateY(-50%)'
  },
  imgIcon: {
    height: '2.5rem',
    width: '2.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    color: Style.vars.colors.get('primaryFontColor'),
    zIndex: 2,
    backgroundColor: Style.vars.colors.get('primary'),
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  imgIconCompleted: {
    backgroundColor: Style.vars.colors.get('green')
  },
  modName: {
    flex: '55%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  img: {
    width: '100%',
    height: '100%',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  hideThisOnMobile: {
    display: 'none',
    [Style.vars.media.get('tablet')]: {
      display: 'block'
    }
  },
  pages: {
    padding: '0 0 1rem 5px',
    marginLeft: 15
  },
  page: {
    minHeight: '2.5rem',
    position: 'relative'
  },
  pageInfo: {
    display: 'inline-block',
    paddingLeft: 25,
    paddingBottom: 15
  },
  circleContainer: {
    position: 'absolute',
    zIndex: '2'
  },
  modThumbnailContainer: {
    position: 'relative',
    display: 'flex',
    flex: '50%',
    justifyContent: 'center',
    height: '100%',
    maxHeight: '5rem'
  },
  modInfo: {
    flex: '45%',
    paddingRight: 20,
    minHeight: '5rem'
  },
  modInfoContainer: {
    cursor: 'pointer',
    display: 'flex',
    flexFlow: 'row',
    marginBottom: 10
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    zIndex: 1,
    position: 'fixed',
    width: '25%',
    fixed: {
      top: 0,
      height: '100vh'
    },
    relative: {
      position: 'relative'
    },
    backgroundColor: Style.vars.colors.get('mediumGrey'),
    [Style.vars.media.get('mobile')]: {
      backgroundColor: Style.vars.colors.get('xLightGrey'),
      width: 'calc(100vw - 1.5em)'
    }
  },
  trainingPlan: {
    textAlign: 'center',
    paddingTop: 25
  },
  trainingUnit: {
    textAlign: 'center',
    margin: '10px 0 5px 0',
    fontSize: '1.2rem'
  },
  trainingPlanDescription: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: '10px 12px 0 12px',
    margin: 0
  },
  notExpandable: {
    width: '25%',
    backgroundColor: Style.vars.colors.get('mediumGrey')
  },
  accordion: {
    display: 'none',
    top: 0,
    flexDirection: 'row',
    minHeight: '100vh',
    zIndex: 2,
    position: 'fixed',
    backgroundColor: Style.vars.colors.get('xLightGrey'),
    [Style.vars.media.get('mobile')]: {
      display: 'flex'
    },
    open: {
      width: '100%',
      height: '100vh'
    },
    close: {
      width: 'auto'
    }
  },
  accordionHandle: {
    border: 'none',
    color: Style.vars.colors.get('xxDarkGrey'),
    backgroundColor: Style.vars.colors.get('mediumGrey'),
    order: '1',
    padding: 0
  },
  icon: {
    fontSize: '1.2rem',
    fontWeight: 'bold'
  },
  hideThisOnBigScreens: {
    display: 'none',
    [Style.vars.media.get('mobile')]: {
      display: 'block'
    }
  },
  mobileProgressContainer: {
    width: 'calc(100vw - 1.5em)',
    justifyContent: 'center',
    open: {
      display: 'flex',
      height: '100vh'
    },
    close: {
      display: 'none'
    },
    [Style.vars.media.get('mobile')]: {
      backgroundColor: Style.vars.colors.get('xLightGrey')
    }
  }
};

@Radium
export class NotExpandable extends React.Component {
  render() {
    return (
      <div style={{ ...style.hideThisOnMobile, ...style.notExpandable }}>{this.props.children}</div>
    );
  }
}

@Radium
export class TrainingPlanProgressBarVertical extends React.Component {
  static data = {
    trainingPlan: {
      required: true,
      fields: ['id', 'url', 'progress_for_user']
    },
    modules: {
      many: true,
      fields: [
        'name',
        'successfully_completed_by_current_user',
        'id',
        'thumbnail_url',
        'description',
        'pages',
        'pages.type',
        'pages.thumbnail_url',
        'pages.question',
        'pages.cards'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(TrainingPlanProgressBarVertical, {
    currentModule: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  findCurrentModule = mod => mod.get('id') === this.props.currentModule.get('id');

  componentDidMount() {
    this.autoScroll();
  }

  autoScroll = () => {
    _.defer(() => {
      const index = this.props.modules.findIndex(this.findCurrentModule);
      this.refs[`mod${index}`].scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 200);
  };

  createThumbnailMarker(mod) {
    if (mod.get('successfully_completed_by_current_user')) {
      return (
        <i
          key="checkmark"
          style={{ ...style.imgIcon, ...style.imgIconCompleted }}
          className="ui icon checkmark"
        />
      );
    }

    if (mod.get('id') === this.props.currentModule.get('id')) {
      return <i style={style.imgIcon} className="ui icon play" />;
    }
  }

  createProgressMarker(i, currentPage, mod) {
    const primaryColor = Style.vars.colors.get('primary');
    let circle = <div style={style.modInnerContainer} />;
    if (i === currentPage && !mod.get('successfully_completed_by_current_user')) {
      circle = (
        <div
          style={{
            ...style.modInnerContainer,
            border: `solid 2px ${primaryColor} `
          }}
        />
      );
    }
    if (i < currentPage || mod.get('successfully_completed_by_current_user')) {
      circle = (
        <div
          style={{
            ...style.modInnerContainerInProgress,
            border: `1px solid ${primaryColor}`
          }}
        />
      );
    }
    return circle;
  }

  getSurroundingPageTypes(i, mod) {
    const pageTypes = mod.get('pages').map(p => p.type);
    return { next: pageTypes[i + 1] || null, previous: pageTypes[i - 1] || null };
  }

  setStart(pageTypes, page, i, start) {
    // Determines the index of the first question, flip card or flip card match in a set. The 'start' is used to help determine the progress (numerator)
    if (
      PAGE_TYPES_LOOKUP[page.type].display === DISPLAY_LAST_PAGE &&
      pageTypes.previous !== page.type
    ) {
      return i;
    }
    return start;
  }

  getProgress(currentPage, start) {
    if (currentPage > start) {
      return currentPage - start;
    }
    return 0;
  }

  createPages(mod, currentPage) {
    let start = 0;
    let endpoint = -1;
    return (
      <div
        style={{
          ...style.hideThisOnMobile,
          ...style.pages
        }}
      >
        {mod.get('pages').map((page, i) => {
          let line;
          const circle = this.createProgressMarker(i, currentPage, mod);
          const pageTypes = this.getSurroundingPageTypes(i, mod);
          start = this.setStart(pageTypes, page, i, start);
          const progress = this.getProgress(currentPage, start);

          const Component = PAGE_TYPES_LOOKUP[page.type].component;

          // display only the last question, flip card or flip card match in a consecutive set otherwise display for all snippet, video and pdf pages
          if (
            (PAGE_TYPES_LOOKUP[page.type].display === DISPLAY_LAST_PAGE &&
              page.type !== pageTypes.next) ||
            PAGE_TYPES_LOOKUP[page.type].display === DISPLAY_ALL_PAGES
          ) {
            const count = i - endpoint;
            endpoint = i;
            // show the vertical linking line for the current page
            if (i !== mod.get('pages').length - 1) {
              line = <div style={style.blackLine} />;
            }
            return (
              <div style={style.page}>
                <div>
                  {line}
                  {circle}
                  <div style={style.pageInfo}>
                    <Component page={page} count={count} progress={progress} />
                  </div>
                </div>
              </div>
            );
            // ensures 'in progress' circle is displayed for question, flip card and flip card match pages in a set (as only the last page is being displayed for these)
          } else if (i === currentPage) {
            return <div style={style.circleContainer}>{circle}</div>;
          }
        })}
      </div>
    );
  }

  makeModComponent = (mod, i) => {
    const primaryColor = Style.vars.colors.get('primary');
    const modOuterContainerStyle = _.extend({}, style.modOuterContainer);
    let modContainerStyle = style.modContainer;
    let pages;
    const tick = this.createThumbnailMarker(mod);
    if (mod.get('id') === this.props.currentModule.get('id')) {
      pages = this.createPages(mod, this.props.currentPage);
      modContainerStyle = _.extend({}, style.modContainer, {
        borderLeft: `5px solid ${primaryColor}`
      });
    }

    return (
      <div ref={`mod${i}`} key={`mod${i}`} style={modContainerStyle}>
        <div style={modOuterContainerStyle} key={mod.get('id')}>
          <div style={{ width: '100%' }}>
            <div style={style.modInfoContainer} onClick={_.partial(this.transitionToMod, mod)}>
              <div style={style.modInfo}>
                <div style={style.modThumbnailContainer}>
                  {tick}
                  <div
                    style={{
                      ...style.img,
                      backgroundImage: `url(${mod.get('thumbnail_url')})`
                    }}
                  />
                </div>
              </div>
              <div style={style.modName}>
                <h3 style={{ ...style.stepTitle, paddingBottom: 0 }}>{mod.get('name')}</h3>
              </div>
            </div>
          </div>
        </div>
        {pages}
      </div>
    );
  };

  transitionToMod = mod => {
    const { goToChannelOnCompletion } = this.context.location.query;
    let nextQuery = '';
    if (goToChannelOnCompletion) {
      nextQuery = `?goToChannelOnCompletion=true`;
    }
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: mod.get('id'),
      trainingPlanId: this.props.trainingPlan.get('id')
    }) + nextQuery);
  };

  render() {
    const modComponents = this.props.modules.map((mod, i) => this.makeModComponent(mod, i));
    return (
      <div ref="container" style={style.container}>
        {modComponents}
        {isMobileWidth() && <div style={{ paddingBottom: 60 }} />}
      </div>
    );
  }
}

@Radium
class DetailedProgressBarDesktop extends React.Component {
  render() {
    const {
      plan,
      moduleAttempt,
      distanceFromTop,
      position,
      currentUser,
      curPageIdx,
      currentModule,
      moduleTrainingPlans
    } = this.props;
    let progressContainerStyle = _.extend({}, style.progressContainer, {
      top: distanceFromTop,
      height: `calc(100vh - ${distanceFromTop}px)`
    });
    if (position === 'fixed') {
      progressContainerStyle = _.extend({}, style.progressContainer, style.progressContainer.fixed);
    } else if (position === 'relative') {
      progressContainerStyle = _.extend(
        {},
        style.progressContainer,
        style.progressContainer.relative
      );
    }
    const trainingPlan = plan && plan.get('name');
    const trainingPlanDescription = plan && plan.get('description');
    const trainingUnit =
      moduleAttempt &&
      moduleAttempt.get('training_unit') &&
      moduleAttempt.get('training_unit').display_name;
    return (
      <div style={progressContainerStyle}>
        <h2 style={style.trainingPlan}>{trainingPlan}</h2>
        <p style={style.trainingUnit}>{trainingUnit}</p>
        {trainingPlanDescription && (
          <p style={style.trainingPlanDescription}>{trainingPlanDescription}</p>
        )}
        {/* isObject test prevents occasional and elusive error thrown by Im.Map.
          Not sure currently how plan can ever not be an object, but at least
          this means the user is only minimally affected */}
        {_.isObject(plan) &&
          moduleTrainingPlans && (
            <TrainingPlanProgressBarVertical
              currentUser={currentUser}
              currentPage={curPageIdx}
              currentModule={currentModule}
              modules={moduleTrainingPlans.map(mtp => Im.Map(mtp.get('module')))}
              trainingPlan={new Im.Map(plan)}
            />
          )}
      </div>
    );
  }
}

@Radium
class DetailedProgressBarMobile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  handleClick = () => {
    this.setState(
      {
        open: !this.state.open
      },
      () => {
        this.props.onAccordionClick(this.state.open);
      }
    );
  };

  render() {
    let className = 'angle right icon';
    let accordionStyle = _.extend({}, style.accordion, style.accordion.close);
    let mobileProgressContainerStyle = _.extend(
      {},
      style.mobileProgressContainer,
      style.mobileProgressContainer.close
    );
    if (this.state.open === true) {
      className = 'angle left icon';
      accordionStyle = _.extend({}, style.accordion, style.accordion.open);
      mobileProgressContainerStyle = _.extend(
        {},
        style.mobileProgressContainer,
        style.mobileProgressContainer.open
      );
    }
    return (
      <div style={accordionStyle}>
        <button style={style.accordionHandle} onClick={this.handleClick}>
          <i style={style.icon} className={className} />
        </button>
        <div style={mobileProgressContainerStyle}>
          <DetailedProgressBarDesktop
            {...this.props}
            plan={this.props.plan}
            currentModule={this.props.currentModule}
            moduleTrainingPlans={this.props.moduleTrainingPlans}
            curPageIdx={this.props.curPageIdx}
            moduleAttempt={this.props.moduleAttempt}
            distanceFromTop={80}
          />
        </div>
      </div>
    );
  }
}

export class DetailedProgressBar extends React.Component {
  render() {
    return (
      <div>
        {isMobileWidth() ? (
          <DetailedProgressBarMobile {...this.props} />
        ) : (
          <NotExpandable>
            <DetailedProgressBarDesktop {...this.props} />
          </NotExpandable>
        )}
      </div>
    );
  }
}
