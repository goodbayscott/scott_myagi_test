import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import cx from 'classnames';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';

import {
  VIDEO_PAGE_TYPE,
  PDF_PAGE_TYPE,
  QUESTION_SET_PAGE_TYPE,
  SNIPPET_PAGE_TYPE,
  FLIP_CARD_PAGE_TYPE,
  FLIP_CARD_MATCH_PAGE_TYPE,
  QUESTION_PAGE_TYPE,
  IFRAME_PAGE_TYPE,
  ANALYTICS_EVENTS,
  HTML_PAGE_TYPE
} from 'core/constants';
import Style from 'style';

import TrainingPlansState from 'state/training-plans';
import ModulesState from 'state/modules';
import ModuleAttemptsState from 'state/module-attempts';
import ModuleTrainingPlansState from 'state/module-training-plans';
import NavbarState from 'components/navbar/component-state';
import ComponentState from './state';
import PageState from '../content-management/lessons-tab/page-state';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { qs } from 'utilities/http';

import { Box, BoxHeader } from 'components/common/box';
import { Image } from 'components/common/image';
import { LoadingContainer } from 'components/common/loading';
import { ViewSequence, View } from 'components/common/view-sequence/index';
import { DetailedProgressBar, TrainingPlanProgressBarVertical } from './training-plan-progress-bar';
import { ProgressBarWithLabel, makeProgressBarStyle } from 'components/common/progress';
import { isMobileWidth } from 'utilities/generic';
import { ReportIssue } from 'components/common/report-issue';

import { Page as VideoPage } from './module-pages/video-page';
import { Page as PDFPage } from './module-pages/pdf-page';
import { Page as QuestionSetPage } from './module-pages/question-set-page';
import { Page as FlipCardPage } from './module-pages/flip-card-page';
import { Page as FlipCardMatchPage } from './module-pages/flip-card-match-page';
import { Page as SnippetPage } from './module-pages/snippet-page/page';
import { Page as QuestionPage } from './module-pages/question-page';
import { Page as IFramePage } from './module-pages/iframe-page';
import { Page as HTMLPage } from './module-pages/html-page';

const PAGE_TYPES_TO_COMPONENTS = {
  [VIDEO_PAGE_TYPE]: VideoPage,
  [PDF_PAGE_TYPE]: PDFPage,
  [QUESTION_SET_PAGE_TYPE]: QuestionSetPage,
  [SNIPPET_PAGE_TYPE]: SnippetPage,
  [FLIP_CARD_PAGE_TYPE]: FlipCardPage,
  [FLIP_CARD_MATCH_PAGE_TYPE]: FlipCardMatchPage,
  [QUESTION_PAGE_TYPE]: QuestionPage,
  [IFRAME_PAGE_TYPE]: IFramePage,
  [HTML_PAGE_TYPE]: HTMLPage
};

const ATTEMPTABLE_PAGES = [
  QUESTION_SET_PAGE_TYPE,
  QUESTION_PAGE_TYPE,
  FLIP_CARD_MATCH_PAGE_TYPE,
  IFRAME_PAGE_TYPE,
  HTML_PAGE_TYPE
];

const NAVIGATION_WARNING = 'If you leave this page, your attempt will be incomplete.';

const style = {
  headerBox: {
    marginBottom: 0,
    borderRadius: 0,
    width: '100%',
    overflowY: 'auto'
  },
  moduleHeading: {
    fontWeight: 500
  },
  infoLink: {
    float: 'right',
    marginTop: 10
  },
  container: {
    margin: '0',
    display: 'flex',
    flexFlow: 'row',
    boxSizing: 'border-box' /** add this * */,
    mozBoxSizing: 'border-box' /** add this * */,
    webkitBoxSizing: 'border-box' /** add this * */,
    msBoxSizing: 'border-box' /** add this * */,
    position: 'relative'
  },
  contentContainer: {
    width: '72%',
    right: '0',
    marginRight: 25,
    marginLeft: 10,
    position: 'absolute',
    overflow: 'auto',
    [Style.vars.media.get('mobile')]: {
      width: '90%',
      margin: 0,
      right: 10,
      paddingBottom: 20
    }
  },
  accordion: {
    display: 'none',
    top: 0,
    flexDirection: 'row',
    minHeight: '100vh',
    zIndex: 2,
    position: 'fixed',
    backgroundColor: Style.vars.colors.get('xLightGrey'),
    overflow: 'auto',
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
    width: '1.5em',
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
  hideThisOnMobile: {
    display: 'none',
    [Style.vars.media.get('tablet')]: {
      display: 'flex'
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
      backgroundColor: Style.vars.colors.get('xLightGrey'),
      marginTop: 80
    }
  },
  attemptPageContainer: {
    minHeight: 'calc(100vh - 80px)'
  },
  boxHeaderImg: {
    height: 'auto',
    marginRight: 10,
    borderRadius: 0,
    marginTop: 0
  }
};

const moduleProgressBarStyle = makeProgressBarStyle(10, '100%');

Object.assign(moduleProgressBarStyle.progress, {
  marginLeft: 0,
  borderRadius: 0
});

Object.assign(moduleProgressBarStyle.bar, {
  borderRadius: 0
});

@Radium
export class ModuleAttemptPagesContainer extends React.Component {
  static data = {
    module: {
      fields: ['completed_by_current_user', 'pages.url', 'pages.id', 'pages.type']
    }
  };

  static propTypes = $y.propTypesFromData(ModuleAttemptPagesContainer, {
    moduleAttempt: ModuleAttemptsState.Types.one,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    // Can be used to change what happens when attempt is complete.
    // Useful for when module attempt page is embedded
    onAttemptComplete: React.PropTypes.func
  });

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    onModuleAttemptComplete(cxt) {
      // Need to pass in planId here so we can use it to fetch details for the
      // side progress bar on the attempts page
      const { module, moduleAttempt, trainingPlan } = cxt.props;
      const { query, search } = cxt.context.location;
      let route = `/views/modules/${module.get('id')}/attempts/${moduleAttempt.get('id')}/`;
      if (search) route = `${route}${search}`;
      if (!query.planId) {
        let planQuery = `?planId=${trainingPlan.get('id')}`;
        if (search) {
          planQuery = planQuery.replace('?', '&');
        }
        route = `${route}${planQuery}`;
      }
      cxt.context.router.push(resolve(route));
    }
  };

  constructor() {
    super();
    this.state = {
      showDimmer: false
    };
  }

  finishModule() {
    analytics.track(ANALYTICS_EVENTS.FINISH_MODULE, {
      'Module ID': this.props.moduleAttempt.get('id')
    });
    this.setState({ showDimmer: true });
    ModuleAttemptsState.ActionCreators.doDetailAction(
      this.props.moduleAttempt.get('id'),
      'finish'
    ).then(() => {
      this.props.onModuleAttemptComplete(this);
    });
  }

  goToPrevPage = () => {
    if (!this.refs.viewSequence || !this.refs.viewSequence.canGoBackward()) return;
    this.props.decreaseCurPageIdx();
    this.refs.viewSequence.goBackward();
  };

  goToNextPage = () => {
    if (!this.refs.viewSequence) return;
    if (!this.refs.viewSequence.canGoForward()) {
      this.finishModule();
      return;
    }
    this.props.increaseCurPageIdx();
    this.refs.viewSequence.goForward();
  };

  getPageComponentForPage = (page, allPageTypes, i) => {
    // TODO - Should deprecate the usage of this value within page types,
    // as they now get passed `allPageTypes` and their index instead.
    const nextPage = allPageTypes[i + 1];
    let pageComponent = PAGE_TYPES_TO_COMPONENTS[page.type];
    if (!pageComponent) throw new Error(`Could not find page component for page type ${page.url}`);
    const isFirst = i === 0;
    pageComponent = React.createFactory(pageComponent);
    const pageProps = {
      pageId: page.id,
      key: page.id,
      moduleAttempt: this.props.moduleAttempt,
      module: this.props.module,
      currentUser: this.props.currentUser,
      goToNextPage: this.goToNextPage,
      goToPrevPage: isFirst ? null : this.goToPrevPage,
      nextPageType: nextPage ? nextPage.type : null,
      allPageTypes,
      pageIndex: i
    };
    return pageComponent(pageProps);
  };

  render() {
    const { module, currentUser } = this.props;
    const allPageTypes = module.get('pages').map(p => p.type);
    const pageComponents = module
      .get('pages')
      .map((p, i) => this.getPageComponentForPage(p, allPageTypes, i));
    const scenes = pageComponents.map((page, i) => (
      <View key={i} ref={i}>
        {page}
      </View>
    ));
    const containerClass = cx('ui', 'dimmable', {
      dimmed: this.state.showDimmer
    });
    return (
      <div className={containerClass}>
        <ViewSequence ref="viewSequence">{scenes}</ViewSequence>
        <ReportIssue module={module} currentUser={currentUser} style={{ marginLeft: 20 }} />
        <div className="ui simple inverted dimmer">
          <div className="ui large text loader" />
        </div>
      </div>
    );
  }
}

@Radium
class MobileProgress extends React.Component {
  render() {
    return (
      <div style={style.hideThisOnBigScreens}>
        <ProgressBarWithLabel
          percent={this.props.progress}
          baseStyle={this.props.moduleProgressBarStyle}
          barColor={Style.vars.colors.get('yellow')}
        />
      </div>
    );
  }
}

@Radium
export class ModuleAttemptPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curPageIdx: 0,
      positionFixed: false,
      distanceFromTop: 80,
      accordionOpen: false
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = event => {
    const distanceFromTop = this.refs.pageContainer.getBoundingClientRect().top;
    if (distanceFromTop <= 0 && !this.state.positionFixed) {
      this.setState({
        positionFixed: true,
        distanceFromTop
      });
    }
    if (distanceFromTop > 0 && this.state.positionFixed) {
      this.setState({
        positionFixed: false,
        distanceFromTop
      });
    }
    this.setState({
      distanceFromTop
    });
  };

  onAccordionClick = open => {
    this.setState({ accordionOpen: open });
  };

  static data = {
    module: {
      required: false,
      fields: [
        'id',
        'name',
        'description',
        'info_url',
        'created_by.learner.company.company_logo',
        'created_by.learner.company.company_name',
        $y.getFields(ModuleAttemptPagesContainer, 'module')
      ]
    },
    trainingPlan: {
      fields: [
        'name',
        'description',
        'training_unit',
        'custom_thumbnail',
        'owner.company_logo',
        'owner.company_name'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(ModuleAttemptPage, {
    moduleAttempt: ModuleAttemptsState.Types.one,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    // Can be used if attempt component is wrapped in another component
    showPlanProgressBar: React.PropTypes.bool,
    showModuleDetails: React.PropTypes.bool
  });

  static defaultProps = {
    showPlanProgressBar: true,
    showModuleDetails: true
  };

  decreaseCurPageIdx = () => {
    this.setState({ curPageIdx: this.state.curPageIdx - 1 });
  };

  increaseCurPageIdx = () => {
    this.setState({ curPageIdx: this.state.curPageIdx + 1 });
  };

  render() {
    const distanceFromTop = this.state.distanceFromTop;
    const name = this.props.module && this.props.module.get('name');
    const subHeading = this.props.module ? this.props.module.get('description') : null;
    const moreInfo = this.props.module ? this.props.module.get('info_url') : null;
    const progress = this.props.moduleProgressPerc;
    const contentDisplay = this.state.accordionOpen ? 'none' : 'block';
    const contentContainerStyle = _.extend(style.contentContainer, { display: contentDisplay });
    return (
      <div>
        <div style={style.attemptPageContainer} ref="pageContainer">
          <LoadingContainer
            loadingProps={{
              module: this.props.module,
              trainingPlan: this.props.trainingPlan,
              moduleTrainingPlans: this.props.moduleTrainingPlans,
              moduleAttempt: this.props.moduleAttempt
            }}
            createComponent={props => {
              const plan = props.trainingPlan;
              return (
                <div style={style.container}>
                  <DetailedProgressBar
                    {...this.props}
                    plan={plan}
                    currentModule={props.module}
                    moduleTrainingPlans={props.moduleTrainingPlans}
                    curPageIdx={this.state.curPageIdx}
                    moduleAttempt={props.moduleAttempt}
                    positionFixed={this.state.positionFixed}
                    distanceFromTop={this.state.distanceFromTop}
                    onAccordionClick={this.onAccordionClick}
                  />
                  <div style={contentContainerStyle}>
                    {this.props.showModuleDetails ? (
                      <Box style={style.headerBox}>
                        <BoxHeader
                          heading={name}
                          subHeading={subHeading}
                          imgSrc={plan.get('owner').company_logo}
                          imgStyle={style.boxHeaderImg}
                          headingStyle={style.moduleHeading}
                          noDivider
                        >
                          {moreInfo && (
                            <a style={style.infoLink} href={moreInfo} target="_blank">
                              More info &gt;
                            </a>
                          )}
                        </BoxHeader>
                      </Box>
                    ) : null}
                    <MobileProgress
                      progress={progress}
                      moduleProgressBarStyle={moduleProgressBarStyle}
                    />
                    <ModuleAttemptPagesContainer
                      key={this.props.module.get('id')}
                      {...this.props}
                      increaseCurPageIdx={this.increaseCurPageIdx}
                      decreaseCurPageIdx={this.decreaseCurPageIdx}
                    />
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    );
  }
}

export const Page = Marty.createContainer(ModuleAttemptPage, {
  statics: {
    willTransitionFrom() {
      // TODO - This no longer works in react router 2 :( :(
      return;
      // This regex will pass if we are transitioning to the module attempt
      // summary page.
      if (/attempts\/\d+/.test(window.location.pathname)) return;
      const r = window.confirm(NAVIGATION_WARNING);
      return r;
    }
  },

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired
  },

  listenTo: [
    PageState.Store,
    ModulesState.Store,
    ComponentState.Store,
    TrainingPlansState.Store,
    ModuleTrainingPlansState.Store
  ],

  getModuleId(props, context) {
    // `moduleId` prop allows this to be used within other components
    return props.moduleId || context.routeParams.moduleId;
  },

  getTrainingPlanId(props, context) {
    // `moduleId` prop allows this to be used within other components
    return props.trainingPlanId || context.routeParams.trainingPlanId;
  },

  generateModuleAttempt(props, context) {
    // Generate a new module attempt entity to pass down to pages
    const moduleURL = ModulesState.Store.getURLForItemWithID(this.getModuleId(props, context));
    const trainingPlanURL = TrainingPlansState.Store.getURLForItemWithID(this.getTrainingPlanId(props, context));
    ModuleAttemptsState.ActionCreators.create(
      {
        module: moduleURL,
        training_plan: trainingPlanURL,
        user: props.currentUser.get('url')
      },
      {
        query: {
          fields: [
            'url',
            'user',
            'module',
            'training_unit.url',
            'training_unit.display_name',
            'training_unit.logo',
            'training_plan'
          ]
        }
      }
    ).then(res => {
      const attempt = Im.Map(res.body);
      this.setState({
        moduleAttempt: attempt,
        moduleId: this.getModuleId(props, context)
      });
      // Can be used if this component is embedded in another component
      if (this.props.onModuleAttemptCreated) {
        this.props.onModuleAttemptCreated(attempt);
      }
    });
  },

  componentWillMount() {
    NavbarState.ActionCreators.setTitle('Lesson Attempt');

    ComponentState.Store.resetState();

    // Disabled because not really that useful
    // window.onbeforeunload = function (evt) {
    //   evt.returnValue = NAVIGATION_WARNING;
    //   return evt.returnValue;
    // };

    this.generateModuleAttempt(this.props, this.context);

    const company = this.props.currentUser.get('learner').company;

    analytics.track(ANALYTICS_EVENTS.BEGIN_MODULE, {
      'Module ID': this.getModuleId(this.props, this.context),
      'Company ID': company.id,
      Company: company.company_name
    });
  },

  componentDidMount() {
    // On iOS, when transitioning from
    // training to this view,
    // body will be scrolled far
    // down and screen will appear to
    // be blank.
    _.delay(() => (document.body.scrollTop = 0));
  },

  componentWillUnmount() {
    window.onbeforeunload = _.noop;
  },

  componentWillUpdate(nextProps, nextState, nextContext) {
    const nextId = this.getModuleId(nextProps, nextContext);
    if (nextId !== this.getModuleId(this.props, this.context)) {
      this.setState({ moduleAttempt: null, moduleId: null });
      this.generateModuleAttempt(nextProps, nextContext);
    }
  },

  fetch: {
    module() {
      return ModulesState.Store.getItem(this.getModuleId(this.props, this.context), {
        fields: [$y.getFields(ModuleAttemptPage, 'module')]
      });
    },
    moduleTrainingPlans() {
      const planId = this.getTrainingPlanId(this.props, this.context);
      return ModuleTrainingPlansState.Store.getItems({
        ordering: 'order,module__name',
        training_plan: planId,
        module_is_attemptable: true,
        module__deactivated__isnull: true,
        limit: 0,
        fields: [
          'order',
          $y.getFields(TrainingPlanProgressBarVertical, 'modules', 'module', 'module__name')
        ]
      });
    },
    trainingPlan() {
      // A module may be associated with many training plans, but we want to find
      // which training plan the user is attempting so that they will be directed
      // to the next module in the training plan.
      const planId = this.getTrainingPlanId(this.props, this.context);
      // Do not fetch plan more than once. Double fetching will happen when module attempt is
      // finished (because this invalidated the training plan). If it is refetched, then
      // `done` function runs again causing entire page to be re-rendered (and new
      // question set attempts to be generated)
      if (this.fetchedPlan) {
        return this.fetchedPlan;
      }
      return TrainingPlansState.Store.getItem(planId, {
        show_public: true,
        fields: [
          'name',
          'description',
          'training_unit',
          'custom_thumbnail',
          'owner.company_logo',
          'owner.company_name',
          $y.getFields(TrainingPlanProgressBarVertical, 'trainingPlan')
        ]
      });
    },
    moduleProgressPerc() {
      return ComponentState.Store.getCurProgressPercentage();
    }
  },

  done(results) {
    // Store the fetched plan so that we do not need to refetch
    this.fetchedPlan = results.trainingPlan;
    return (
      <div key={results.module.get('id')}>
        <ModuleAttemptPage
          ref="innerComponent"
          {...this.props}
          {...results}
          moduleAttempt={this.state.moduleAttempt}
        />
      </div>
    );
  },

  pending() {
    return containerUtils.defaultPending(this, ModuleAttemptPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ModuleAttemptPage, errors);
  }
});
