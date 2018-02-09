import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import { Link } from 'react-router';
import reactMixin from 'react-mixin';
import Style from 'style';

import { t } from 'i18n';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import PublicCompanyState from 'state/public-companies';
import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';
import PublicTrainingPlanTrainingUnitsState from 'state/public-training-plan-training-units';
import ChannelsState from 'state/channels';
import PublicChannelsState from 'state/public-channels';
import TrainingSchedulesState from 'state/training-schedules';
import PageState from '../plans/page-state';
import ModulesState from 'state/modules';

import { LoadingContainer, NoData } from 'components/common/loading';
import { Panel } from 'components/common/box';
import { TrainingPlanCard, TrainingPlansCollection } from '../plans/plan-card';
import { remoteSearchMixinFactory } from 'components/common/search';
import { Modal } from 'components/common/modal';
import { EmbedlyCard } from 'components/common/cards/embedly';
import { ViewTrainingPlanModal } from '../plans/plan-modal';
import { Info } from 'components/common/info';

const styles = {
  background: {
    backgroundColor: Style.vars.colors.get('white')
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    height: 500,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    backgroundColor: Style.vars.colors.get('navBackground'),
    display: 'flex',
    alignContent: 'center',
    alignItems: 'center'
  },
  coverInnerContainer: {
    width: '100%',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    height: '100%',
    display: 'flex',
    margin: '0 auto',
    position: 'relative'
  },
  coverDetailsContainer: {
    display: 'inline-block',
    margin: '0 auto',
    justifySelf: 'center',
    alignSelf: 'center'
  },
  standardCoverContainer: {
    position: 'relative',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    margin: '0 auto',
    padding: '40px 0px',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    [Style.vars.media.get('mobile')]: {
      paddingTop: 60
    }
  },
  overlay: {
    backgroundColor: Style.vars.colors.get('overlay'),
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  searchInput: {
    marginTop: 40,
    marginLeft: 10,
    float: 'left',
    [Style.vars.media.get('mobile')]: {
      marginLeft: 23
    }
  },
  borderedNameContainer: {
    borderRadius: 5,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white'
  },
  nameContainer: {
    position: 'relative',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nameContainerText: {
    fontSize: 50,
    lineHeight: 1,
    [Style.vars.media.get('mobile')]: {
      fontSize: 30
    }
  },
  standardBackIconContainer: {
    position: 'absolute',
    color: Style.vars.colors.get('textBlack'),
    cursor: 'pointer',
    fontSize: 14,
    marginLeft: 10,
    top: 44,
    [Style.vars.media.get('mobile')]: {
      top: 20
    }
  },
  coverBackIconContainer: {
    position: 'absolute',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    top: 18,
    left: 18,
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  companyLogo: {
    position: 'relative',
    height: 150,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    display: 'block',
    margin: '10px auto',
    [Style.vars.media.get('mobile')]: {
      height: 100
    }
  },
  infoIcon: {
    fontSize: 15,
    verticalAlign: 'middle'
  },
  tooltipStyle: {
    fontSize: 18
  },
  footer: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    padding: '10px 5%'
  },
  footerField: {
    margin: '20px 0px'
  },
  footerFieldTitle: {
    fontSize: '1.6rem',
    fontWeight: 200
  },
  bullet: {
    fontSize: '0.6rem'
  },
  footerFieldContent: {
    display: 'flex',
    alignItems: 'center',
    margin: 5
  },
  footerLearnItem: {
    maxWidth: 320
  },
  learnItemsVideoRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  }
};

@Radium
class ChannelPageCoverImage extends React.Component {
  static propTypes = {
    channel: React.PropTypes.object.isRequired,
    openModal: React.PropTypes.func.isRequired
  };

  renderNameWithIcon() {
    const { name, display_name, description } = this.props.channel;
    return (
      <div style={styles.nameContainer}>
        <span style={styles.nameContainerText}>{display_name || name} </span>
        {description && (
          <Info
            title={t('description')}
            content={description}
            style={styles.infoIcon}
            tooltipStyle={styles.tooltipStyle}
          />
        )}
      </div>
    );
  }

  render() {
    const {
      logo, cover_image, company, video
    } = this.props.channel;
    const coverImage = cover_image || company.cover_image;
    return (
      <div>
        <div
          style={Style.funcs.merge(styles.coverContainer, {
            backgroundImage: `url('${coverImage}')`
          })}
        >
          <div style={styles.coverInnerContainer}>
            {!this.props.isPublicPage ? (
              <Link
                to={{
                  pathname: '/views/training/',
                  query: { tab: 'Channels' }
                }}
              >
                <div style={styles.coverBackIconContainer}>
                  <i className="chevron left icon" style={styles.backIcon} />
                  {t('all_content')}
                </div>
              </Link>
            ) : null}

            <div style={styles.coverDetailsContainer}>
              <img style={styles.companyLogo} src={logo || company.company_logo} />
              <div style={styles.borderedNameContainer}>{this.renderNameWithIcon()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setTrainingPlanSearch.bind(PageState.ActionCreators)))
@Radium
class ChannelContentPage extends React.Component {
  static data = {
    channel: {
      required: true,
      fields: [
        'id',
        'name',
        'display_name',
        'description',
        'logo',
        'price',
        'cover_image',
        'video',
        'learn_items',
        'company.company_logo',
        'company.cover_image',
        'is_subscribed_to_by_current_company',
        'existing_request_for_current_company',
        'require_sequential_completion'
      ]
    }
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedPlan: null
    };
  }

  openTrainingPlanModal = plan => {
    this.setState({ selectedPlan: plan });
    this.refs.viewTrainingPlanModal.show();
  };

  createTrainingPlanCard = (plan, shouldLock) => (
    <TrainingPlanCard
      key={plan.get('id')}
      trainingPlan={plan}
      currentUser={this.context.currentUser}
      openTrainingPlanModal={this.openTrainingPlanModal}
      isPublicPage={this.props.isPublicPage}
      onPlanCardClick={this.props.onPlanCardClick}
      channelConnected={this.props.channel.get('is_subscribed_to_by_current_company')}
      channelRequested={this.props.channel.get('existing_request_for_current_company')}
      lock={shouldLock}
      goToChannelOnCompletion
    />
  );

  showVideoModal = () => {
    this.refs.modal.show();
  };

  updateParentModal = () => {
    // Refresh parent modal so it's scrollable once video is closed. This is
    // a hack that's needed because if there's a modal on top of another modal,
    // the 1st modal will lose ability to scroll after the 2nd modal is closed.
    // Bumping the modal's key fixes this problem.
    if (this.props.isPublicPage && this.props.updateParentModal) {
      this.props.updateParentModal();
    }
  };

  render() {
    let coverImage,
      channelName,
      channelVideo,
      channelId;

    if (this.props.channel) {
      const channel = this.props.channel.toJS();
      coverImage = (
        <ChannelPageCoverImage
          channel={channel}
          currentUser={this.context.currentUser}
          isPublicPage={this.props.isPublicPage}
        />
      );
      channelName = channel.name;
      channelVideo = channel.video;
      channelId = channel.id;
    }

    const noPlansText = this.props.isPublicPage
      ? t('no_plans_available_connect')
      : t('no_plans_available');

    return (
      <div style={styles.background}>
        {coverImage}
        <Panel>
          {!this.props.isPublicPage ? (
            <div style={styles.searchInput}>{this.getSearchInput()}</div>
          ) : null}
          <div style={Style.common.clearBoth} />
          <LoadingContainer
            loadingProps={[this.props.trainingPlanTrainingUnits, this.props.channel]}
            createComponent={props => (
              <div>
                <TrainingPlansCollection
                  trainingPlans={this.props.trainingPlanTrainingUnits.map(tptu =>
                    Im.Map(tptu.get('training_plan')))}
                  loadMore={this.props.loadMore}
                  moreAvailable={this.props.moreAvailable}
                  isLoading={this.props.isLoading}
                  createCard={this.createTrainingPlanCard}
                  requireSequentialCompletion={this.props.channel.get('require_sequential_completion')}
                />
              </div>
            )}
            createNoDataComponent={() => <NoData style={{ padding: 20 }}>{noPlansText}</NoData>}
          />
          {this.props.channel && (
            <div style={styles.footer}>
              {this.props.channel.get('learn_items').length > 0 && (
                <div style={styles.learnItemsVideoRow}>
                  <div style={styles.footerField}>
                    <div style={styles.footerFieldTitle}>{t('what_youll_learn')}</div>
                    {this.props.channel.get('learn_items').map(l => (
                      <div
                        style={{
                          ...styles.footerFieldContent,
                          ...styles.footerLearnItem
                        }}
                      >
                        <i className="ui icon circle" style={styles.bullet} />
                        {l}
                      </div>
                    ))}
                  </div>
                  {this.props.channel.get('video') && (
                    <div style={styles.footerField}>
                      <EmbedlyCard url={channelVideo} />
                    </div>
                  )}
                </div>
              )}

              {this.props.channel.get('description') && (
                <div style={styles.footerField}>
                  <div style={styles.footerFieldTitle}>{t('description')}</div>
                  <div style={styles.footerFieldContent}>
                    {this.props.channel.get('description')}
                  </div>
                </div>
              )}
            </div>
          )}
          <ViewTrainingPlanModal
            ref="viewTrainingPlanModal"
            trainingPlan={this.state.selectedPlan}
            currentUser={this.context.currentUser}
            goToChannelOnCompletion={channelId}
            editable
          />
        </Panel>
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(ChannelContentPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [
    PageState.Store,
    PublicCompanyState.Store,
    TrainingPlanTrainingUnitsState.Store,
    TrainingSchedulesState.Store,
    ChannelsState.Store,
    PublicChannelsState.Store,
    ModulesState.Store
  ],

  paginate: {
    store: TrainingPlanTrainingUnitsState.Store,
    propName: 'trainingPlanTrainingUnits',
    storeOpts: {
      dependantOn: TrainingSchedulesState.Store
    },

    getQuery() {
      const channelId = this.props.channelId || this.context.routeParams.channelId;
      const query = {
        training_unit: channelId,
        training_plan__deactivated__isnull: true,
        training_plan__is_published: true,
        limit: 10,
        fields: ['order', $y.getFields(TrainingPlanCard, 'trainingPlan', 'training_plan')],
        ordering: 'order,training_plan__name'
      };
      const search = PageState.Store.getTrainingPlanSearch();
      if (search) {
        query.search = search;
      }
      return query;
    }
  },

  fetch: {
    channel() {
      const channelId = this.props.channelId || this.context.routeParams.channelId;
      return ChannelsState.Store.getItem(channelId, {
        fields: $y.getFields(ChannelContentPage, 'channel'),
        limit: 0
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelContentPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelContentPage, errors);
  }
});

// PublicPage is used for channel discovery. TODO: reduce boilerplate
// and re-use most of Page.
export const PublicPage = createPaginatedStateContainer(ChannelContentPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [
    PageState.Store,
    PublicCompanyState.Store,
    PublicTrainingPlanTrainingUnitsState.Store,
    TrainingSchedulesState.Store,
    ChannelsState.Store,
    PublicChannelsState.Store,
    ModulesState.Store
  ],

  paginate: {
    store: PublicTrainingPlanTrainingUnitsState.Store,
    propName: 'trainingPlanTrainingUnits',
    storeOpts: {
      dependantOn: TrainingSchedulesState.Store
    },

    getQuery() {
      const channelId = this.props.channelId || this.context.routeParams.channelId;
      const query = {
        training_unit: channelId,
        training_plan__deactivated__isnull: true,
        training_plan__is_published: true,
        limit: 10,
        fields: ['order', $y.getFields(TrainingPlanCard, 'trainingPlan', 'training_plan')],
        ordering: 'order,training_plan__name'
      };
      const search = PageState.Store.getTrainingPlanSearch();
      if (search) {
        query.search = search;
      }
      return query;
    }
  },

  fetch: {
    channel() {
      // use ChannelsState for public page to preview unpublished/private content
      // if the user is already connected
      const channelState = this.props.viewerHasChannelConnection
        ? ChannelsState
        : PublicChannelsState;

      const channelId = this.props.channelId || this.context.routeParams.channelId;

      return channelState.Store.getItem(
        channelId,
        {
          fields: $y.getFields(ChannelContentPage, 'channel'),
          limit: 0
        },
        {
          // for channel edit preview
          dependantOn: [ChannelsState.Store]
        }
      );
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelContentPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelContentPage, errors);
  }
});
