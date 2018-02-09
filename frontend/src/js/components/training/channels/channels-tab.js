import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import Style from 'style';

import { ANALYTICS_EVENTS } from 'core/constants';
import trainingPageUtils from 'utilities/component-helpers/training-page';

import ChannelsState from 'state/channels';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers.js';
import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import { Box, BoxContent } from 'components/common/box';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer } from 'components/common/loading';

import { ChannelCard } from 'components/common/channel-card';
import { FindMoreContentCard } from 'components/common/channels/find-more-channels';
import { isFromRetailerOrHospo } from 'components/company-connections/utils';

const PROGRESS_COLORS = {
  0: Style.vars.colors.get('mediumGrey'),
  25: Style.vars.colors.get('red'),
  50: Style.vars.colors.get('red'),
  75: Style.vars.colors.get('red')
};

const styles = {
  container: {
    width: '100%',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    marginLeft: '-20px !important'
  },
  channelCard: {
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    backgroundRepeat: 'no-repeat',
    height: 300,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    position: 'relative',
    marginBottom: 25,
    border: '1px solid #CCCCCC',
    borderRadius: 10
  },
  channelCardContainer: {
    width: 250,
    maxWidth: 250,
    marginLeft: 14,
    marginRight: 14,
    paddingLeft: 0,
    paddingRight: 0
  },
  channelNameContainer: {
    zIndex: 99,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%'
  },
  channelName: {
    fontSize: 22,
    textAlign: 'center',
    color: 'black'
  },
  rightArrow: {
    width: '100%',
    textAlign: 'center',
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 28
  }
};

export class ChannelCardItem extends React.Component {
  static data = {
    channels: {
      many: true,
      required: true,
      fields: [
        'id',
        'logo',
        'cover_image',
        'cover_image_thumbnail',
        'name',
        'display_name',
        'is_myagi',
        'company.company_logo',
        'company.cover_image',
        'progress_for_user',
        'is_company_owned'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  goToBrand = () => {
    analytics.track(ANALYTICS_EVENTS.CLICKED_CHANNEL_CARD);
    this.context.router.push(resolve('channel-content', {
      channelId: this.props.channel.get('id')
    }));
  };

  calcProgressProportion() {
    return Math.floor(this.props.channel.get('progress_for_user') * 100);
  }

  render() {
    const channel = this.props.channel;
    const company = channel.get('company');

    let channelCoverImage = channel.get('cover_image_thumbnail')
      ? channel.get('cover_image_thumbnail')
      : channel.get('cover_image');
    let channelLogo = channel.get('logo');

    // Default to company images if channel attributes don't exist
    if (!channelCoverImage) {
      channelCoverImage = company.cover_image;
    }
    if (!channelLogo) {
      channelLogo = company.company_logo;
    }

    return (
      <div className="column" style={styles.channelCardContainer}>
        <ChannelCard channel={channel} onClick={this.goToBrand} showProgress />
        {/* <div style={styles.overlay} /> */}
      </div>
    );
  }
}

class ChannelsTabContent extends React.Component {
  static data = {
    channels: {
      many: true,
      required: true,
      fields: [$y.getFields(ChannelCardItem, 'channels')]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  goToChannels = () => {
    this.context.router.push(`${resolve('content-channels')}`);
  };

  renderCards = channels => channels.map(ch => <ChannelCardItem key={ch.get('id')} channel={ch} />);

  getFindChannelsCard = () => (
    <FindMoreContentCard
      class="column"
      style={{ container: styles.channelCardContainer, card: styles.channelCard }}
    />
  );

  getManageChannelsCard = () => (
    <div className="column" style={styles.channelCardContainer}>
      <div onClick={this.goToChannels} style={styles.channelCard}>
        <div style={styles.channelNameContainer}>
          <h5 style={styles.channelName}>{t('no_content_manage_channels')}</h5>
          <i className="ui arrow right icon" style={styles.rightArrow} />
        </div>
      </div>
    </div>
  );

  renderFindContentCard = () => {
    const user = this.context.currentUser;
    const learner = user.get('learner');
    if (!learner.can_make_new_channel_connections || !isFromRetailerOrHospo(user)) {
      return null;
    }
    return this.getFindChannelsCard();
  };

  renderNoDataCard = () => {
    const user = this.context.currentUser;
    const learner = user.get('learner');
    if (learner.can_manage_training_content && !isFromRetailerOrHospo(user)) {
      return this.getManageChannelsCard();
    }
    return this.renderFindContentCard();
  };

  render() {
    const {
      channels, loadMore, moreAvailable, isLoading
    } = this.props;
    return (
      <Box style={styles.container}>
        <BoxContent>
          <LoadingContainer
            loadingProps={{ channels }}
            createComponent={() => (
              <InfiniteScroll
                loadMore={loadMore}
                moreAvailable={moreAvailable}
                isLoading={isLoading}
              >
                <div className="ui stackable equal width centered grid">
                  {this.renderCards(channels)}
                  {this.renderFindContentCard()}
                </div>
              </InfiniteScroll>
            )}
            createNoDataComponent={() => (
              <div className="ui stackable equal width centered grid">
                {this.renderNoDataCard()}
              </div>
            )}
          />
        </BoxContent>
      </Box>
    );
  }
}

export const Page = createPaginatedStateContainer(ChannelsTabContent, {
  listenTo: [ChannelsState.Store],

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  paginate: {
    store: ChannelsState.Store,
    propName: 'channels',
    limit: 20,
    getQuery() {
      const q = {
        order_for_user_consumption: this.context.currentUser.get('id'),
        has_content: true,
        fields: $y.getFields(ChannelsTabContent, 'channels')
      };
      // Do this check here, as if done on backend then query time will be longer
      if (!this.context.currentUser.get('learner').can_view_all_training_content) {
        q.has_enrollments_for_user = this.context.currentUser.get('id');
      }
      return q;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelsTabContent);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelsTabContent, errors);
  }
});
