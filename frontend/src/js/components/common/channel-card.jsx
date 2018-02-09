import React from 'react';

import Rating from 'react-rating';
import Radium from 'radium';

import Style from 'style';
import { t } from 'i18n';

import parsing from 'components/analytics/parsing';
import trainingPageUtils from 'utilities/component-helpers/training-page';
import { ProgressBarWithLabel } from 'components/common/progress';
import { orderingStyles } from 'components/common/ordering';

export const CHANNEL_CARD_HEIGHT = 300;
export const CHANNEL_CARD_WIDTH = 250;

const styles = {
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: -5,
    zIndex: 9
  },
  ratingContainer: {
    paddingLeft: 10,
    opacity: 0.9,
  },
  likeRatingText: {
    color: Style.vars.colors.get('white')
  },
  channelStats: {
    zIndex: 2,
    display: 'flex',
    width: '100%',
    minHeight: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(1, 1, 1, 0.4)'
  },
  star: {
    fontSize: 16,
    color: Style.vars.colors.get('yellow'),
  },
  freePriceText: {
    color: Style.vars.colors.get('green'),
    paddingRight: 10,
  },
  paidPriceText: {
    backgroundColor: Style.vars.colors.get('myagiOrange'),
    padding: '9px 15px',
    color: 'white',
  },
  progressContainer: {
    zIndex: 99
  },
  progressBarLabel: {
    position: 'absolute',
    bottom: 40,
    zIndex: 9,
    left: 0,
    marginLeft: 20
  },
  channelCard: Style.funcs.merge(
    {
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      backgroundRepeat: 'no-repeat',
      height: CHANNEL_CARD_HEIGHT,
      width: CHANNEL_CARD_WIDTH,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      position: 'relative'
    },
    Style.funcs.makeTransitionAll()
  ),
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    background: 'black',
    opacity: 0.4,
    zIndex: 1,
    cursor: 'pointer'
    // ':hover': {
    //   opacity: 0,
    // },
  },
  logo: {
    maxWidth: 75,
    maxHeight: 100,
    zIndex: 2,
    margin: 'auto',
    position: 'absolute',
    top: -130,
    left: 0,
    bottom: 0,
    right: 0,
    borderRadius: 5
  },
  channelNameContainer: {
    zIndex: 99,
    paddingLeft: 10,
    paddingRight: 10
  },
  channelNameWhite: {
    fontSize: 22,
    textAlign: 'center',
    color: 'white',
    marginTop: 45,
  }
};

@Radium
export class ChannelCard extends React.Component {
  calcProgressProportion() {
    return Math.floor(this.props.channel.get('progress_for_user') * 100);
  }

  render() {
    const { channel } = this.props;
    const company = channel.get('company');
    const price = channel.get('price');
    let channelCoverImage;
    let channelLogo;
    channelCoverImage = channel.get('cover_image_thumbnail')
      ? channel.get('cover_image_thumbnail')
      : channel.get('cover_image');
    channelLogo = channel.get('logo');
    // Default to company images if channel attributes don't exist
    if (!channelCoverImage) {
      channelCoverImage = company.cover_image_thumbnail
        ? company.cover_image_thumbnail
        : company.cover_image;
    }
    if (!channelLogo) {
      channelLogo = company.company_logo;
    }
    return (
      <div
        key={`channel-card-${channel.get('id')}`}
        onClick={this.props.onClick}
        style={[
          styles.channelCard,
          {
            backgroundImage: `url('${channelCoverImage}')`,
            backgroundColor: Style.vars.colors.get('navBackground')
          },
          this.props.reorderEnabled && orderingStyles.highlight
        ]}
      >
        <div>
          <img src={channelLogo} style={styles.logo} />
          <div style={styles.overlay} key={`overlay-${channel.get('id')}`} />
        </div>

        <div style={styles.channelNameContainer}>
          <h5 style={styles.channelNameWhite}>
            {channel.get('display_name') || channel.get('name')}
          </h5>
        </div>
        {// Show a star rating if user is looking at channel discovery //
          this.props.isPublicPage ? (
            <div style={styles.channelStats}>
              {this.props.channel.get('avg_like_rating') ? (
                <div style={styles.ratingContainer}>
                  <Rating
                    empty={<i style={styles.star} className="icon empty star" />}
                    full={<i style={styles.star} className="icon star" />}
                    initialRate={this.props.channel.get('avg_like_rating')}
                    readonly
                  />
                  <span style={styles.likeRatingText}>
                    {parsing.toOneDecimalPlace(this.props.channel.get('avg_like_rating'))}
                  </span>
                </div>
              ) : (
                <span />
              )}
              {price ?
                <span style={styles.paidPriceText}>${price}</span>
              :
                <span style={styles.freePriceText}>{t('free')}</span>
              }
            </div>
          ) : null}

        {this.props.showProgress ? (
          <div style={styles.progressContainer}>
            <div style={styles.progressBarLabel}>
              <span
                style={{
                  color: Style.vars.colors.get('white')
                }}
              >
                {`${this.calcProgressProportion()}% ${t('completed')}`}
              </span>
            </div>
            <ProgressBarWithLabel
              barColor={trainingPageUtils.getColorForProgress(this.calcProgressProportion())}
              style={styles.progressBar}
              percent={this.calcProgressProportion()}
            />
          </div>
        ) : null}
      </div>
    );
  }
}
