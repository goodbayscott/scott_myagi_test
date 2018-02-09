/*
  A FlipCardPage is simply a flip card with information on the front
  and back. They form the learning portion of microdeck modules.
*/
import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import Radium from 'radium';
import { fadeInRight, fadeOutLeft } from 'react-animations';

import Style from 'style';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import FlipCardPagesState from 'state/flip-card-pages';
import ModuleAttemptPageState from '../../state';

import { default as ReactFlipCard } from 'react-flipcard';
import { LoadingContainer } from 'components/common/loading';
import { Image } from 'components/common/image';
import { SecondaryButton } from 'components/common/buttons';

export const CARD_HEIGHT = 432;
export const CARD_WIDTH = 310;
const FLIP_DELAY = 500;

export const styles = {
  pageContainer: Style.funcs.merge(Style.common.attemptPageContent, {
    // iPhone 6s Plus width
    maxWidth: CARD_WIDTH,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: 0,
    paddingBottom: 20,
    backgroundColor: 'transparent'
  }),
  statusHeader: {
    textAlign: 'center',
    margin: 10,
    fontWeight: 600,
    fontSize: 18,
    color: Style.vars.colors.get('xDarkGrey')
  },
  btnContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 20
  },
  flipCard: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    cursor: 'pointer'
  },
  flipCardContainer: {
    animation: 'x 1s',
    animationName: Radium.keyframes(fadeInRight, 'fadeInRight')
  },
  flipCardContainerOut: {
    animationName: Radium.keyframes(fadeOutLeft, 'fadeOutLeft')
  },
  cardContainerCommon: {
    textAlign: 'center',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Style.vars.colors.get('primary'),
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardFront: {
    backgroundColor: Style.vars.colors.get('primary')
  },
  cardFrontOneSided: {
    backgroundColor: 'black',
    cursor: 'auto'
  },
  cardBack: {
    backgroundColor: Style.vars.colors.get('navBackground')
  },
  cardImg: {
    height: 'auto',
    backgroundColor: 'rgba(1, 1, 1, 0.4)',
    backgroundSize: 'cover',
    flexGrow: 4
  },
  cardImgContain: {
    backgroundSize: 'contain'
  },
  cardTxtContainer: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%'
  },
  cardTitle: {
    fontSize: '1em',
    textTransform: 'uppercase',
    color: 'white',
    marginTop: 20
  },
  cardTxt: {
    marginTop: 0,
    color: 'white',
    fontSize: '2em',
    lineHeight: 'normal'
  }
};

@Radium
export class FlipCard extends React.Component {
  static data = {
    page: {
      fields: [
        'front_text',
        'front_image',
        'front_image_contain',
        'front_title',
        'back_image',
        'back_image_contain',
        'back_text'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(FlipCard, {
    flipped: React.PropTypes.bool.isRequired
  });

  oneSided = () => {
    const { page } = this.props;
    return !(page.get('back_text') || page.get('back_image'));
  };

  renderSide(txt, img, imgContain, title, style) {
    // Split on new line, then render HTML breaks between
    // each line
    const txtArray = txt.split('\n');
    return (
      <div
        style={Style.funcs.merge(styles.cardContainerCommon, style)}
        onClick={this.props.onClick}
      >
        {title && <div style={styles.cardTitle}>{title}</div>}
        {img && (
          <Image
            src={img}
            style={Style.funcs.mergeIf(imgContain, styles.cardImg, styles.cardImgContain)}
          />
        )}
        {txt.length > 0 && (
          <div style={styles.cardTxtContainer}>
            <div style={styles.cardTxt}>
              {txtArray.map(line => (
                <span>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { page } = this.props;
    // Disabling this for now, as it complicates things during card creation (as card
    // colour changes suddenly when you add back content).
    // const frontStyle = !this.oneSided() ? styles.cardFront : styles.cardFrontOneSided;
    return (
      <ReactFlipCard flipped={this.props.flipped} disabled containerStyle={styles.flipCard}>
        {/* The first child is used as the front of the card */}
        {this.renderSide(
          page.get('front_text'),
          page.get('front_image'),
          page.get('front_image_contain'),
          page.get('front_title'),
          styles.cardFront
        )}
        {/* The second child is used as the back of the card */}
        {this.renderSide(
          page.get('back_text'),
          page.get('back_image'),
          page.get('back_image_contain'),
          null,
          styles.cardBack
        )}
      </ReactFlipCard>
    );
  }
}

@Radium
class PageContent extends React.Component {
  static data = {
    page: {
      fields: [$y.getFields(FlipCard, 'page')]
    }
  };

  static propTypes = $y.propTypesFromData(PageContent, {
    module: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  });

  constructor() {
    super();
    this.state = {
      isFlipped: false,
      hasFlipped: false,
      canFlip: true
    };
  }

  canFlip = () => {
    const { page } = this.props;
    const { canFlip } = this.state;
    if (!canFlip) return false;
    return page.get('back_text') || page.get('back_image');
  };

  flip = () => {
    if (!this.canFlip()) return;
    this.setState({ isFlipped: !this.state.isFlipped, hasFlipped: true, canFlip: false });
    // Throttle flipping using flip delay. This prevents some weird visual issues
    // which occur if the user flips over and over
    _.delay(() => this.setState({ canFlip: true }), FLIP_DELAY);
    return false;
  };

  next = () => {
    if (this.clicked) return;
    this.clicked = true;
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    this.setState({ animOut: true });
    // Allow time for animation to complete
    _.delay(this.props.goToNextPage, 1000);
  };

  prev = () => {
    this.props.goToPrevPage();
    this.setState({ isFlipped: false });
  };

  renderButton() {
    let showFlip = false;
    if (this.canFlip()) {
      showFlip = !this.state.hasFlipped;
    }
    // Prevent default event from firing due to an Android Chrome bug that will
    // fire twice, and result in the next button being clicked immediately after flip.
    // https://github.com/facebook/react/issues/2061
    return showFlip ? (
      <SecondaryButton
        onClick={e => {
          e.preventDefault();
          this.flip();
        }}
      >
        Flip
      </SecondaryButton>
    ) : (
      <SecondaryButton onClick={this.next}>Next</SecondaryButton>
    );
  }

  render() {
    const { page } = this.props;
    return (
      <div>
        <div style={styles.statusHeader}>Learn key info by studying the following cards</div>
        <div className="ui segment" style={styles.pageContainer}>
          <div
            style={[styles.flipCardContainer, this.state.animOut && styles.flipCardContainerOut]}
          >
            <FlipCard flipped={this.state.isFlipped} page={page} onClick={this.flip} />
          </div>
          <div style={{ clear: 'both' }} />
          <div style={styles.btnContainer}>{this.renderButton()}</div>
        </div>
      </div>
    );
  }
}

export class FlipCardPage extends React.Component {
  static data = {
    page: $y.getData(PageContent, 'page', { required: false })
  };

  static propTypes = {
    page: FlipCardPagesState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  };

  render() {
    return this.props.page ? <PageContent {...this.props} /> : null;
  }
}

export const Page = Marty.createContainer(FlipCardPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  },

  listenTo: [FlipCardPagesState.Store],

  fetch: {
    page() {
      return FlipCardPagesState.Store.getItem(this.props.pageId, {
        fields: $y.getFields(FlipCardPage, 'page')
      });
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  },

  pending() {
    return containerUtils.defaultPending(this, FlipCardPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, FlipCardPage, errors);
  }
});
