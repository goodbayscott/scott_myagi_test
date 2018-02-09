import Marty from 'marty';
import Im from 'immutable';
import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import Style from 'style';

import { ANALYTICS_EVENTS } from 'core/constants';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getSubdomain } from 'utilities/generic';
import { qs, getOrigin } from 'utilities/http';
import { t } from 'i18n';

import UsersState from 'state/users';
import PublicUsersState from 'state/public-users';

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { PublicStyling } from 'components/common/public-styling';
import { HoverableLink } from 'components/common/hover';
import { Form, EmailInput, SubmitButton } from 'components/common/form';
import { Image } from 'components/common/image';
import { PrimaryButton } from 'components/common/buttons';
import Rating from 'react-rating';
import PoweredByMyagi from 'components/app/powered-by';

const LOGIN_PATH = '/accounts/login/';

const styles = {
  container: {
    color: Style.vars.colors.get('xxxDarkGrey'),
    width: '80%',
    margin: 'auto',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    minHeight: '100vh',
    [Style.vars.media.get('computer')]: {
      width: '75%'
    },
    [Style.vars.media.get('mobile')]: {
      width: '90%'
    }
  },
  logo: {
    height: '13vh',
    width: '50%',
    margin: '0 auto 3vh auto'
  },
  heading: {
    fontSize: '2.5rem',
    marginBottom: '2.5rem',
    fontWeight: '400',
    [Style.vars.media.get('mobile')]: {
      fontSize: '2rem'
    },
    [Style.vars.media.get('xSmall')]: {
      fontSize: '1.5rem',
      marginBottom: '1.75rem'
    }
  },
  carouselContainer: {
    textAlign: 'center',
    width: '100%',
    margin: 'auto'
  },
  slideContainer: {
    width: '100%'
  },
  slideInnerContainer: {
    width: '92%',
    margin: '0 auto 15px auto'
  },
  cardImg: {
    width: '100%',
    paddingTop: '56.25%',
    height: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  planInfoContainer: {
    width: '100%',
    height: '7rem',
    padding: '10px 15px 0 15px',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  slideTitle: {
    fontSize: '1.25rem',
    fontWeight: '400',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    WebkitLineClamp: '2',
    margin: 0,
    [Style.vars.media.get('mobile')]: {
      fontSize: '1.1rem'
    }
  },
  slideFooter: {
    textAlign: 'center',
    width: '100%',
    minHeight: '7vh',
    display: 'flex',
    justifyContent: 'center'
  },
  slideFooterHalf: {
    width: '50%',
    height: '100%',
    padding: 5
  },
  sliderImg: {
    height: '17vh',
    backgroundColor: 'none',
    margin: '0 10px 2rem 10px'
  },
  slideFooterTextNumber: {
    fontSize: 20,
    color: Style.vars.colors.get('primary'),
    [Style.vars.media.get('mobile')]: {
      fontSize: 18
    }
  },
  slideFooterText: {
    margin: '0 auto'
  },
  companyInfoContainer: {
    marginBottom: '2rem'
  },
  signUpHeading: {
    paddingBottom: '1rem',
    fontWeight: '400',
    [Style.vars.media.get('mobile')]: {
      paddingBottom: '0.75rem',
      fontSize: '1.2rem'
    }
  },
  emailInputContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  emailInput: {
    border: `1px solid ${Style.vars.colors.get('xDarkGrey')}`,
    width: '40%',
    margin: 0,
    [Style.vars.media.get('xSmall')]: {
      width: '60%'
    }
  },
  signUpButton: {
    height: 37,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('white'),
    margin: '0 0 0 5px'
  },
  signupButtonInvalid: {
    background: Style.vars.colors.get('fadedPrimary'),
    cursor: 'not-allowed'
  },
  existingAccountLink: {
    color: Style.vars.colors.get('primary'),
    textAlign: 'center',
    margin: '10px 0',
    display: 'block',
    fontSize: 15,
    cursor: 'pointer',
    [Style.vars.media.get('xSmall')]: {
      fontSize: 13
    }
  },
  linkHover: {
    color: Style.vars.colors.get('primary'),
    textDecoration: 'underline'
  },
  tilesContainer: {
    whiteSpace: 'nowrap',
    padding: '0 10px',
    [Style.vars.media.get('mobile')]: {
      overflowX: 'auto'
    }
  },
  tileContainer: {
    width: '30%',
    margin: '0 10px 10px 10px',
    display: 'inline-block',
    [Style.vars.media.get('mobile')]: {
      width: '44%'
    },
    [Style.vars.media.get('xSmall')]: {
      width: '60%'
    }
  },
  star: {
    fontSize: '1.2rem',
    color: Style.vars.colors.get('primary'),
    margin: '10px 0 5px 0',
    [Style.vars.media.get('xSmall')]: {
      fontSize: '0.80rem'
    }
  },
  cardContainer: {
    boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.2)'
  },
  viewContent: {
    paddingTop: '1.5vh',
    marginBottom: 20
  }
};

@Radium
class TrainingPlanCard extends React.Component {
  render() {
    const lessons = this.props.num_modules === 1 ? t('lesson') : t('lessons');
    const views = this.props.num_of_attempts === 1 ? t('view') : t('views');
    return (
      <div style={styles.cardContainer}>
        <div
          style={{
            ...styles.cardImg,
            backgroundImage: `url(${this.props.img})`
          }}
        />
        <div style={styles.planInfoContainer}>
          <h1 style={styles.slideTitle}>{this.props.name}</h1>
          {this.props.rating > 3 ? (
            <Rating
              empty={<i style={styles.star} className="icon empty star" />}
              full={<i style={styles.star} className="icon star" />}
              initialRate={this.props.rating}
              readonly
            />
          ) : null}
        </div>
        <div style={styles.slideFooter}>
          <div style={styles.slideFooterHalf}>
            <h2 style={{ ...styles.slideFooterText, ...styles.slideFooterTextNumber }}>
              {this.props.num_modules}
            </h2>
            <p style={styles.slideFooterText}>{lessons}</p>
          </div>
          <div style={styles.slideFooterHalf}>
            <h2 style={{ ...styles.slideFooterText, ...styles.slideFooterTextNumber }}>
              {this.props.num_of_attempts}
            </h2>
            <p style={styles.slideFooterText}>{views}</p>
          </div>
        </div>
      </div>
    );
  }
}

@Radium
class Tiles extends React.Component {
  render() {
    return (
      <div style={{ ...styles.plansContainer, ...styles.tilesContainer }}>
        {this.props.plans.map((plan, i) => (
          <div key={i} style={styles.tileContainer}>
            <TrainingPlanCard
              img={plan.thumbnail_url}
              name={plan.name}
              num_modules={plan.modules.length}
              num_of_attempts={plan.num_of_attempts}
              rating={plan.avg_like_rating}
            />
          </div>
        ))}
      </div>
    );
  }
}

@Radium
class Carousel extends React.Component {
  render() {
    const settings = {
      dots: false,
      arrows: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3000,
      pauseOnHover: false,
      swipeToSlide: true,
      centerMode: true,
      slidesToShow: 3,
      centerPadding: '60px',
      responsive: [
        { breakpoint: 992, settings: { slidesToShow: 2 } },
        { breakpoint: 520, settings: { slidesToShow: 1 } }
      ]
    };

    return (
      <div style={styles.carouselContainer}>
        <Slider ref="slick" {...settings}>
          {this.props.plans.map((plan, i) => (
            <div key={i} style={styles.slideContainer}>
              <div style={styles.slideInnerContainer}>
                <TrainingPlanCard
                  img={plan.thumbnail_url}
                  name={plan.name}
                  num_modules={plan.modules.length}
                  num_of_attempts={plan.num_of_attempts}
                  rating={plan.avg_like_rating}
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    );
  }
}

@Radium
class ChannelInfo extends React.Component {
  render() {
    const heading =
      this.props.plans.length === 1
        ? t('has_shared_training_plan')
        : t('has_shared_training_plans');
    return (
      <div style={styles.companyInfoContainer}>
        <h1 style={styles.heading}>{`${this.props.company} ${heading}`}</h1>
        {this.props.plans.length > 3 ? (
          <Carousel plans={this.props.plans} />
        ) : (
          <Tiles plans={this.props.plans} />
        )}
      </div>
    );
  }
}

@Radium
class SignUp extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loginError: null,
      email: null,
      loading: false
    };
  }

  checkEmailIsUnique(val) {
    const p = new Promise((pResolve, reject) => {
      PublicUsersState.ActionCreators.doListAction('check_email_is_unique', { email: val }).then(res => {
        pResolve(res.body.is_unique);
      });
    });
    return p;
  }

  onEmailChange = e => {
    this.setState({ email: e.target.value, loginError: null });
  };

  onSubmitAndValid = () => {
    analytics.track(ANALYTICS_EVENTS.SIGN_UP_VIA_SHARELINK);
    this.context.router.push({
      pathname: `/signup/user/${this.props.linkName}`,
      state: { email: this.state.email, link: this.props.linkName }
    });
  };

  goToLogIn = () => {
    analytics.track(ANALYTICS_EVENTS.LOG_IN_VIA_SHARELINK);
    const firstChannel = this.props.initialChannel
      ? this.props.initialChannel.id
      : this.props.firstChannelId;
    this.context.router.push({
      pathname: LOGIN_PATH,
      state: { link: this.props.linkName, firstChannelId: firstChannel }
    });
  };

  render() {
    const signUpBelow =
      this.props.plansLength === 1 ? t('sign_up_to_access_it') : t('sign_up_to_access_them');
    return (
      <div>
        <h3 style={styles.signUpHeading}>{signUpBelow}</h3>
        <Form
          onSubmitAndValid={this.onSubmitAndValid}
          style={styles.emailInputContainer}
          ref="sharelinkForm"
        >
          <EmailInput
            name="email"
            type="email"
            style={styles.emailInput}
            placeholder={t('email')}
            onChange={this.onEmailChange}
            isUnique={this.checkEmailIsUnique}
            placeholderColor="gray"
            required
          />
          <SubmitButton
            style={styles.signUpButton}
            invalidStyle={styles.signupButtonInvalid}
            text={t('sign_up')}
            loading={this.state.loading}
          />
        </Form>
        <HoverableLink
          hoverStyle={styles.linkHover}
          style={styles.existingAccountLink}
          onClick={this.goToLogIn}
        >
          {t('i_already_have_an_account')}
          <i style={styles.forwardIcon} className="angle right icon" />
        </HoverableLink>
      </div>
    );
  }
}

class ViewContent extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  viewContent = () => {
    analytics.track(ANALYTICS_EVENTS.VIEW_CONTENT_VIA_SHARELINK);
    const firstChannel = this.props.initialChannel
      ? this.props.initialChannel.id
      : this.props.channel;
    this.context.router.push(`/views/channel-content/${firstChannel}/`);
  };

  render() {
    return (
      <div style={styles.viewContent}>
        <PrimaryButton onClick={this.viewContent}>{t('view_content')}</PrimaryButton>
      </div>
    );
  }
}

@Radium
class ShareLinkPage extends React.Component {
  render() {
    const initialChannel = this.props.link.get('initial_channel');
    const channels = this.props.link && this.props.link.get('channels');
    const companyName = this.props.linkCompany && this.props.linkCompany.get('company_name');
    const companyLogo = this.props.linkCompany && this.props.linkCompany.get('company_logo');
    const plans = [];
    channels.map(channel =>
      channel.training_plans.map(plan => {
        if (plan.is_published) {
          plans.push(plan);
        }
      }));
    return (
      <div style={styles.container}>
        <Image src={companyLogo} style={styles.logo} />
        <ChannelInfo company={companyName} plans={plans} />
        {this.props.currentUser ? (
          <ViewContent channel={channels[0].id} initialChannel={initialChannel} />
        ) : (
          <div>
            <SignUp
              plansLength={plans.length}
              linkName={this.props.link.get('name')}
              firstChannelId={channels[0].id}
              initialChannel={initialChannel}
            />
            <PoweredByMyagi />
          </div>
        )}
      </div>
    );
  }
}

class ShareLinkPageContainer extends React.Component {
  render() {
    return (
      <PublicStyling>
        <ShareLinkPage currentUser={this.props.currentUser} />
      </PublicStyling>
    );
  }
}

export const Page = Marty.createContainer(ShareLinkPageContainer, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [UsersState.Store],

  fetch: {
    currentUser() {
      const fetch = UsersState.Store.getCurrent();
      return fetch;
    }
  },

  done(results) {
    return <ShareLinkPageContainer {...results}>{this.props.children}</ShareLinkPageContainer>;
  },

  pending() {
    return containerUtils.defaultPending(this, ShareLinkPageContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ShareLinkPageContainer, errors);
  }
});
