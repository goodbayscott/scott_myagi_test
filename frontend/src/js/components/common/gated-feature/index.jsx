import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import Style from 'style';

import { BackButton, PrimaryButton } from 'components/common/buttons';
import { ANALYTICS_EVENTS } from 'core/constants';
import { getVideoContainer } from 'components/module-attempt/module-pages/video-page/video-containers';
import { Modal } from 'components/common/modal';

import groups1 from 'img/groups-1.gif';
import groups2 from 'img/groups-2.gif';
import groups3 from 'img/groups-3.gif';

import analytics1 from 'img/analytics-1.gif';
import analytics2 from 'img/analytics-2.gif';
import analytics3 from 'img/analytics-3.gif';

import sharing1 from 'img/sharing-1.gif';
import sharing2 from 'img/sharing-2.gif';
import sharing3 from 'img/sharing-3.gif';

const VIDEO_WIDTH = 450;
const VIDEO_HEIGHT = 252;

const styles = {
  container: {
    padding: 0,
    maxWidth: 900,
    margin: '0 auto'
  },
  modalContent: {
    padding: 0
  },
  opaqueContainer: {
    filter: 'blur(4px)',
    pointerEvents: 'none',
    overflowY: 'hidden'
  },
  contentContainer: {
    position: 'absolute',
    border: '1px solid #CCCCCC',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    color: 'black',
    minHeight: 490,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    // maxWidth: 800,
    margin: '120px auto auto auto'
  },
  modalContentContainer: {
    border: '1px solid #CCCCCC',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'black',
    minHeight: 490,
    backgroundColor: 'white',
    borderRadius: 5
  },
  disabledContentContainer: {
    display: 'flex',
    width: '100%',
    height: 'auto',
    alignItems: 'center',
    // position: 'absolute',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: 10,
    marginBottom: 80
  },
  descriptionText: {
    paddingRight: 30,
    paddingBottom: 50,
    paddingLeft: 30,
    lineHeight: '1.5em'
  },
  contactMyagiButton: {
    width: '100%',
    bottom: 0,
    height: 70,
    textAlign: 'center',
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: '0 0 4px 4px',
    marginLeft: 0
  },
  backgroundImage: {
    backgroundSize: 'contain',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    height: window.innerHeight
  },
  fadedOverlay: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  featuresContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  videoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  featuresElementsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: 20,
    marginBottom: 20
  },
  featureElement: {
    height: 110,
    width: 330,
    cursor: 'default',
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
    transition: 'box-shadow 0.3s ease',
    ':hover': {
      boxShadow: 'rgba(0, 0, 0, 0.3) 0px 10px 25px',
      borderRadius: 6,
      transform: 'scale(1.03)',
      opacity: 1
    }
  },
  icon: {
    fontSize: '2.5rem',
    marginLeft: 20
  },
  featureTextContainer: {
    textAlign: 'left',
    marginLeft: 15
  },
  featureHeaderText: {
    fontSize: 16,
    fontWeight: 700
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: '1.5em',
    marginTop: 6
  },
  gif: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT
  }
};

export const ANALYTICS = 'analytics';
export const GROUPS_AND_AREAS = 'areasAndGroups';
export const CONTENT_SHARING = 'contentSharing';

class Feature extends React.Component {
  selectImage = image => {
    this.props.selectImage(image);
  };
}

class AnalyticsFeatures extends Feature {
  render() {
    return (
      <div style={styles.featuresElementsContainer}>
        <GatedFeatureElement
          icon="bar chart"
          headerText="Content Performance"
          gifName={FEATURE_GIFS[ANALYTICS][0]}
          selectImage={this.selectImage}
          featureDescription="Analyze content consumption and usefulness across all your subscribed channels & review lesson feedback"
        />
        <GatedFeatureElement
          icon="line chart"
          headerText="Engagement"
          gifName={FEATURE_GIFS[ANALYTICS][1]}
          selectImage={this.selectImage}
          featureDescription="Discover how each store or associate is doing on their assigned lessons and uncover new ways to improve sales"
        />
        <GatedFeatureElement
          icon="users"
          headerText="Team Analytics"
          gifName={FEATURE_GIFS[ANALYTICS][2]}
          selectImage={this.selectImage}
          featureDescription="Compare statistics across groups of users & learn how to replicate the success of your top performers company-wide"
        />
      </div>
    );
  }
}

class AreasAndGroupsFeatures extends Feature {
  render() {
    return (
      <div style={styles.featuresElementsContainer}>
        <GatedFeatureElement
          icon="add user"
          headerText="Groups and Areas"
          gifName={FEATURE_GIFS[GROUPS_AND_AREAS][0]}
          selectImage={this.selectImage}
          featureDescription="Create Groups & Areas to customize how content is delivered to your users"
        />
        <GatedFeatureElement
          icon="student"
          headerText="Allocation Rules"
          gifName={FEATURE_GIFS[GROUPS_AND_AREAS][1]}
          selectImage={this.selectImage}
          featureDescription="Selectively enroll users in content"
        />
        <GatedFeatureElement
          icon="users"
          headerText="User Permissions"
          gifName={FEATURE_GIFS[GROUPS_AND_AREAS][2]}
          selectImage={this.selectImage}
          featureDescription="Grant permissions to certain users & select who controls your content"
        />
      </div>
    );
  }
}

class ContentSharingFeatures extends Feature {
  render() {
    return (
      <div style={styles.featuresElementsContainer}>
        <GatedFeatureElement
          icon="share alternate"
          headerText="Instant Access"
          gifName={FEATURE_GIFS[CONTENT_SHARING][0]}
          selectImage={this.selectImage}
          featureDescription="Your content is delivered and available to influencers on the sales floor the very moment you submit"
        />
        <GatedFeatureElement
          icon="university"
          headerText="Source from Experts"
          gifName={FEATURE_GIFS[CONTENT_SHARING][1]}
          selectImage={this.selectImage}
          featureDescription="Create your own content or tap our network of experts who deeply understand your brand, industry, and market"
        />
        <GatedFeatureElement
          icon="linkify"
          headerText="Share Links"
          gifName={FEATURE_GIFS[CONTENT_SHARING][2]}
          selectImage={this.selectImage}
          featureDescription="Generate share links for your content & allow users to instantly connect and get trained inside Myagi"
        />
      </div>
    );
  }
}

const GATED_FEATURE_COMPONENTS = {
  [ANALYTICS]: AnalyticsFeatures,
  [GROUPS_AND_AREAS]: AreasAndGroupsFeatures,
  [CONTENT_SHARING]: ContentSharingFeatures
};

const FEATURE_GIFS = {
  [ANALYTICS]: [analytics1, analytics2, analytics3],
  [GROUPS_AND_AREAS]: [groups1, groups2, groups3],
  [CONTENT_SHARING]: [sharing1, sharing2, sharing3]
};

@Radium
class GatedFeatureElement extends React.Component {
  onMouseEnter = () => {
    this.props.selectImage(this.props.gifName);
  };

  render() {
    return (
      <div style={styles.featureElement} onMouseEnter={this.onMouseEnter}>
        <i style={styles.icon} className={`ui icon ${this.props.icon}`} />
        <div style={styles.featureTextContainer}>
          <div style={styles.featureHeaderText}>{this.props.headerText}</div>
          <div style={styles.featureDescription}>{this.props.featureDescription}</div>
        </div>
      </div>
    );
  }
}

class GatedFeatureInner extends React.Component {
  constructor(props) {
    super(props);
    let selectedImage;
    if (FEATURE_GIFS[this.props.featureType]) {
      selectedImage = FEATURE_GIFS[this.props.featureType][0];
    }
    this.state = {
      selectedImage
    };
  }

  componentDidMount = () => {
    // Fire mixpanel event, and make sure it only fires once per page view.
    analytics.track(ANALYTICS_EVENTS.PAYWALL_DISPLAYED, {
      feature: this.props.featureType
    });
  };

  getGIFContainer = () => {
    const videoContainerStyle = _.extend(styles.videoContainer, {
      backgroundImage: `url(${this.state.selectedImage})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT
    });
    return <div style={videoContainerStyle} />;
  };

  getVideoContainer = () => {
    if (!this.props.videoURL) return;
    const video = getVideoContainer(this.props.videoURL, {
      ref: 'videoContainer',
      // onEnd: this.onVideoEnd,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      allowControl: false,
      autoPlay: true
    });
    return <div style={styles.videoContainer}>{video}</div>;
  };

  requestFeature = () => {
    analytics.track(ANALYTICS_EVENTS.PAYWALL_CONTACT_MYAGI_CLICK, {
      feature: this.props.featureType
    });
    if (!window.Intercom) return;
    window.Intercom('showNewMessage', "I'm interested in upgrading my account. Can you help me?");
  };

  selectImage = imageName => {
    this.setState({ selectedImage: imageName });
  };

  getFeatureComponents = () => {
    if (this.props.featureType) {
      const Component = GATED_FEATURE_COMPONENTS[this.props.featureType];
      return <Component {...this.props} selectImage={this.selectImage} />;
    }
    return null;
  };

  render() {
    const headerText = this.props.headerText ? this.props.headerText : 'Premium Feature';
    const descriptionText = this.props.descriptionText ? this.props.descriptionText : '';
    let container = styles.contentContainer;

    if (this.props.modal) {
      container = styles.modalContentContainer;
    }

    let contentContainer = styles.disabledContentContainer;
    if (this.props.videoURL) {
      container = _.extend(container, { minHeight: 490 });
      contentContainer = _.extend(contentContainer, { height: 'auto' });
    }
    return (
      <div style={container}>
        <div style={contentContainer}>
          <h1>{headerText}</h1>
          <div style={styles.descriptionText}>{descriptionText}</div>
          <div style={styles.featuresContainer}>
            {this.getFeatureComponents()}
            {this.getGIFContainer()}
          </div>
        </div>
        <PrimaryButton style={styles.contactMyagiButton} onClick={this.requestFeature}>
          Contact a Myagi admin to gain access
        </PrimaryButton>
      </div>
    );
  }
}

export class GatedFeatureBox extends React.Component {
  render() {
    const style = _.extend({}, this.props.style);
    if (this.props.backgroundImage) {
      _.extend(style, {
        backgroundImage: `url(${this.props.backgroundImage})`,
        ...styles.backgroundImage
      });
    }
    const children =
      this.props.backgroundImage && this.props.hideContent ? null : this.props.children;
    if (this.props.hideContent) {
      return (
        <div style={styles.container}>
          <div style={style}>
            <GatedFeatureInner {...this.props} />
            <div style={styles.opaqueContainer}>{children}</div>
          </div>
        </div>
      );
    }
    return <div>{children}</div>;
  }
}

export class GatedFeatureModal extends React.Component {
  show = () => {
    this.gatedFeatureModal.show();
  };

  render() {
    return (
      <Modal
        size="large"
        contentStyle={styles.modalContent}
        ref={gatedFeatureModal => (this.gatedFeatureModal = gatedFeatureModal)}
      >
        <GatedFeatureInner {...this.props} hideContent modal />
      </Modal>
    );
  }
}
