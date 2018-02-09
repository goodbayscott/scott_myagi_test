import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { Link } from 'react-router';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';

import Style from 'style';
import StyleCustomization from 'style/customization';
import { t } from 'i18n';

import AppState from '../app/state';

import { getIdFromApiUrl } from 'utilities/generic';
import containerUtils from 'utilities/containers';
import { getOrigin, qs } from 'utilities/http';
import { isAndroid, isIPhone } from 'utilities/browser';

import { SearchBarContainer } from 'components/common/universal-search-bar';
import { HoverMixin } from 'components/common/hover';
import { Dropdown } from 'components/common/dropdown';
import { HamburgerMenu } from './hamburger-menu';
import { AvatarImage } from 'components/common/avatar-images';
import { remoteSearchMixinFactory } from 'components/common/search';

// Using regular css for message dot notification, as there is no way to replicate
// the glowing effect using inline styles
require('css/style.css');

const IOS_APP_DOWNLOAD_LINK = 'https://itunes.apple.com/app/myagi/id1093253823';
const ANDROID_APP_DOWNLOAD_LINK =
  'intent://myagi.com/download/#Intent;package=com.myagi;scheme=https;end;';
const APP_OPEN_LINK_BASE = 'myagi://';
const MOBILE_WIDTH_PX = 950;
export const MOBILE_WIDTH = `@media screen and (max-width: ${MOBILE_WIDTH_PX}px)`;

export const NAVBAR_HEIGHT = 80;

const navbar = {
  navbarContainer: {
    backgroundColor: Style.vars.colors.get('navBackground'),
    display: 'flex',
    justifyContent: 'center'
  },
  navbar: {
    border: 0,
    boxShadow: '0 0 0',
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 25px',
    height: NAVBAR_HEIGHT,
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    backgroundColor: Style.vars.colors.get('navBackground'),
    width: '100%',
    zIndex: 999
  },
  navBarContainerNew: {
    borderBottom: Style.funcs.makeBrandedBorder()
  },
  navbarNew: {
    backgroundColor: Style.vars.colors.get('white')
  },
  downloadLink: {
    background: Style.vars.colors.get('primary'),
    zIndex: 3,
    marginRight: -1,
    marginLeft: -1,
    marginTop: -1,
    color: Style.vars.colors.get('primaryFontColor'),
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    lineHeight: 2
  },
  downloadLinkHamburger: {
    color: Style.vars.colors.get('primaryFontColor'),
    textAlign: 'center'
  },
  indicator: {
    marginLeft: 10
  },
  logoContainer: {
    marginRight: 40,
    display: 'flex'
  },
  logoImage: {
    width: 80,
    height: 70,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    cursor: 'pointer'
  },
  profileCircle: {
    borderRadius: 40,
    marginTop: 4,
    height: 40,
    width: 40
  },
  profilePicMenu: {
    marginTop: 11
  },
  dropdown: {
    marginLeft: -13
  },
  mobileDropdownIcon: {
    color: 'white',
    fontSize: 25,
    display: 'flex !important',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 22,
    marginLeft: 25,
    [MOBILE_WIDTH]: {
      display: 'block'
    }
  },
  mobileDropdownIconNew: {
    color: 'block'
  },
  mobileMenu: {
    display: 'none',
    [MOBILE_WIDTH]: {
      backgroundColor: Style.vars.colors.get('navBackground'),
      marginTop: 15
    }
  },
  mobileMenuNew: {
    backgroundColor: 'white'
  },
  navItemContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginRight: 40,
    [MOBILE_WIDTH]: {
      marginRight: 0
    }
  },
  navItem: Style.funcs.merge(
    {
      fontSize: 12,
      letterSpacing: '0.5px',
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 10,
      paddingBottom: 10,
      cursor: 'pointer',
      color: Style.vars.colors.get('navFontColor')
    },
    Style.funcs.makeTransitionAll()
  ),
  navItemActive: {
    color: Style.vars.colors.get('white')
  },
  navItemHover: {
    color: Style.vars.colors.get('white')
  },

  navItemNew: {
    color: Style.vars.colors.get('navInactiveGrey')
  },
  navItemHoverNew: {
    color: Style.vars.colors.get('textBlack')
  },
  navItemActiveNew: {
    color: Style.vars.colors.get('textBlack')
  },

  rightMenu: {
    display: 'flex',
    alignItems: 'center'
  },
  mobileDropdown: {
    display: 'none',
    marginLeft: -25,
    [MOBILE_WIDTH]: {
      display: 'inherit'
    }
  },
  desktopDropdown: {
    display: 'flex',
    alignItems: 'center',
    [MOBILE_WIDTH]: {
      display: 'none'
    }
  },
  avatarImgContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    color: Style.vars.colors.get('white')
  },
  searchMobile: {
    container: {
      width: '90vw',
      margin: '0 auto 20px auto'
    }
  },
  avatarImgContainerNew: {
    color: Style.vars.colors.get('textBlack')
  },
  searchDesktopContainer: {
    [MOBILE_WIDTH]: {
      display: 'none'
    }
  },
  avatarImgText: {
    marginLeft: 10,
    [Style.vars.media.get('mobile')]: {
      display: 'none'
    }
  },
  avatarIcon: {
    marginLeft: 5
  },
  desktopRightSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

function goToApp(evt) {
  /* If in browser, this will go straight to the app download page.
  If on iOS or Android, will try open the app directly or will navigate
  straight to the app store so the user can download it */
  if (!isIPhone() && !isAndroid()) {
    evt.stopPropagation();
    window.open('https://myagi.com/download/', '_blank');
    return;
  }
  let inAppRoute;
  // Use the `next` param as inAppRoute (will be set on login page).
  // Otherwise, use the current pathname.
  const next = qs('next');
  if (next) {
    inAppRoute = next;
  } else {
    inAppRoute = window.location.pathname;
  }
  inAppRoute = inAppRoute.replace(/^\//, '');
  const openAppLink = APP_OPEN_LINK_BASE + inAppRoute;

  // Try to open the app, but if that doesn't work, open the app store.
  setTimeout(() => {
    if (isAndroid()) {
      window.location = ANDROID_APP_DOWNLOAD_LINK;
    } else {
      window.location = IOS_APP_DOWNLOAD_LINK;
    }
  }, 25);

  if (isAndroid()) {
    window.location = ANDROID_APP_DOWNLOAD_LINK;
  } else {
    window.location = openAppLink;
  }
}

@reactMixin.decorate(HoverMixin)
@Radium
export class NavItem extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  isActive() {
    const loc = resolve(this.props.to, this.props.params);
    if (_.includes(this.props.currentRoute, loc)) {
      return true;
    }
    return false;
  }
  goToRoute = evt => {
    if (this.props.onClick) {
      return this.props.onClick(evt);
    }
    this.context.router.push(resolve(this.props.to, this.props.params));
  };
  render() {
    const isUsingNewHome = this.props.currentUser.get('learner').tmp_new_home_page_enabled;
    const activeStyle = this.isActive()
      ? Style.funcs.mergeIf(isUsingNewHome, navbar.navItemActive, navbar.navItemActiveNew)
      : {};
    const style = this.getHoverStyle(
      activeStyle,
      Style.funcs.mergeIf(isUsingNewHome, navbar.navItemHover, navbar.navItemHoverNew)
    );
    return (
      <div style={navbar.navItemContainer} className="ui item" onClick={this.goToRoute}>
        <p
          {...this.getHoverProps()}
          style={{
            ...navbar.navItem,
            ...(isUsingNewHome ? navbar.navItemNew : {}),
            ...style
          }}
          {...this.props}
          onClick={this.goToRoute}
        />
        {/* Display a little orange dot next to a navbar link if
        shouldRenderIndicator is truthy. */}
        {this.props.shouldRenderIndicator &&
          this.props.shouldRenderIndicator() && (
            <div style={navbar.indicator} className="ui orange empty circular mini label" />
          )}
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(AppState.ActionCreators.setSearch.bind(AppState.ActionCreators)))
@Radium
export class NavBarInner extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    const learner = props.currentUser.get('learner');
    const hasCompany = Boolean(props.currentUser.get('learner').company);
    const companyAdmin = learner.is_company_admin && hasCompany;
    const channelsManager = learner.is_training_unit_admin && hasCompany;
    const hasTeam = Boolean(learner.learner_group) && hasCompany;
    const teamManager = hasTeam && learner.is_learner_group_admin && hasCompany;
    const leaderboardsEnabled = hasCompany && learner.company.companysettings.leaderboard_enabled;
    const flags = props.currentUser.get('feature_flags');
    const canManageOrEnroll =
      learner.can_manage_training_content || learner.can_enroll_others_in_training_content;
    let newContentManagement = false;
    if (flags && flags['new-content-management']) newContentManagement = true;
    let subscriptionPaused = false;
    let subscription;
    if (hasCompany) subscription = props.currentUser.get('learner').company.subscription;
    if (subscription) {
      subscriptionPaused = subscription.paused;
    }
    const isUsingNewHome = props.currentUser.get('learner').tmp_new_home_page_enabled;

    this.state = {
      navItems: [
        {
          name: 'home',
          route: 'home',
          show: hasCompany && isUsingNewHome
        },
        {
          name: 'home',
          route: 'training',
          show: hasCompany && !isUsingNewHome
        },
        {
          name: 'learning',
          route: 'training',
          show: hasCompany && !subscriptionPaused && isUsingNewHome
        },
        {
          name: 'content',
          route: 'content',
          shouldRenderIndicator: this.shouldRenderIndicator,
          show: newContentManagement && canManageOrEnroll && !subscriptionPaused
        },
        {
          name: 'people',
          route: companyAdmin || learner.is_area_manager ? 'people' : 'team',
          params: companyAdmin
            ? null
            : {
              teamId: hasTeam ? getIdFromApiUrl(learner.learner_group) : null
            },
          show: (hasTeam || companyAdmin) && !subscriptionPaused
        },
        {
          name: 'channels',
          route: 'channels',
          shouldRenderIndicator: this.shouldRenderChannelIndicator,
          show: (companyAdmin || channelsManager) && !subscriptionPaused && !newContentManagement
        },
        {
          name: 'allocation',
          route: 'demo-allocation-management',
          show: hasCompany && companyAdmin && learner.is_demo_account
        },
        {
          name: 'leaderboards',
          route: 'leaderboards',
          show: leaderboardsEnabled && !subscriptionPaused
        },
        {
          name: 'analytics',
          route: 'analytics',
          show: (companyAdmin || teamManager || learner.is_area_manager) && !subscriptionPaused
        },
        {
          name: 'support',
          route: 'support',
          show: false
        }
      ]
    };
  }

  updateDimensions = () => {
    if (this.state.width !== window.innerWidth) {
      this.setState({ width: window.innerWidth });
    }
  };

  componentWillMount() {
    this.updateDimensions();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  componentDidUpdate() {
    // Ensures that search input is cleared when
    // AppStore search state is cleared
    if (!this.props.curSearch && this.getSearchVal()) {
      this.clearSearch();
    }
  }

  logout = () => {
    if (window.Intercom) window.Intercom('shutdown');
    window.location.href = `${getOrigin()}/accounts/logout/`;
  };

  shouldRenderIndicator = () =>
    this.shouldRenderCuratedIndicator() || this.shouldRenderChannelIndicator();

  shouldRenderCuratedIndicator = () => {
    const learner = this.props.currentUser.get('learner');
    return Boolean(learner.num_unfulfilled_company_connection_request_channels_for_user &&
        learner.can_make_new_channel_connections);
  };

  shouldRenderChannelIndicator = () => {
    // Check if there are any open channel connections. This function is passed
    // as a prop so that updates to the current user fetch will cause the
    // NavItem to re-render.
    const learner = this.props.currentUser.get('learner');
    // Don't show indicator dot if shared content is turned off, or the user
    // can't manage training content.
    return Boolean(learner.can_manage_training_content &&
        (learner.company.open_connection_request_count.incoming ||
          (learner.company.open_connection_request_count.outgoing &&
            learner.company.subscription.shared_content_enabled)));
  };

  render() {
    const isUsingNewHome = this.props.currentUser.get('learner').tmp_new_home_page_enabled;
    const logo = StyleCustomization.getNavLogoForCompany(Im.Map(this.props.currentUser.get('learner').company));
    const learner = this.props.currentUser.get('learner');
    const navItems = this.state.navItems.filter(n => n.show).map(n => (
      <NavItem
        key={n.route}
        to={n.route}
        params={n.params}
        currentRoute={window.location.href}
        shouldRenderIndicator={n.shouldRenderIndicator}
        currentUser={this.props.currentUser}
      >
        {t(n.name)}
      </NavItem>
    ));

    let logoLink = 'training';
    if (learner.is_myagi_staff) {
      logoLink = 'myagi-staff';
    } else if (isUsingNewHome) {
      logoLink = 'home';
    }

    return (
      <div style={[navbar.navbarContainer, isUsingNewHome && navbar.navBarContainerNew]}>
        <div style={[navbar.navbar, isUsingNewHome && navbar.navbarNew]}>
          <div style={navbar.rightMenu}>
            <div style={navbar.mobileDropdown}>
              {/* Only render the hamburger menu on mobile so that the onClickOutside function isn't triggered on desktop */}
              {window.innerWidth < MOBILE_WIDTH_PX ? (
                <HamburgerMenu currentUser={this.props.currentUser}>
                  {[
                    <NavItem onClick={goToApp} currentUser={this.props.currentUser}>
                      {t('get_the_app')}
                    </NavItem>,
                    ...navItems
                  ]}
                </HamburgerMenu>
              ) : null}
            </div>

            <Link to={logoLink} style={navbar.logoContainer}>
              <div style={{ ...navbar.logoImage, backgroundImage: `url(${logo})` }} />
            </Link>

            <div style={navbar.desktopDropdown}>{navItems}</div>
          </div>

          <div style={navbar.desktopRightSection}>
            <div style={navbar.searchDesktopContainer}>
              <SearchBarContainer />
            </div>
            <Dropdown className="ui top right pointing dropdown" style={navbar.dropdown}>
              <div
                style={[navbar.avatarImgContainer, isUsingNewHome && navbar.avatarImgContainerNew]}
              >
                <AvatarImage user={this.props.currentUser} size="3" style={navbar.profileCircle} />
                <p style={navbar.avatarImgText}>
                  {this.props.currentUser.get('first_name')}
                  <i style={navbar.avatarIcon} className="ui icon angle down" />
                </p>
              </div>
              <div className="menu" style={navbar.profilePicMenu}>
                <a className="ui item" style={navbar.downloadLink} onClick={goToApp}>
                  {t('get_the_app')}
                </a>
                <Link
                  className="item"
                  to="profile"
                  params={{ userId: this.props.currentUser.get('id') }}
                >
                  {t('profile')}
                </Link>
                <a className="ui item" href="http://help.myagi.com/" target="_blank">
                  {t('help_center')}
                </a>
                <Link className="item" to="settings">
                  {t('settings')}
                </Link>
                <a className="ui item" href="#" onClick={this.logout}>
                  {t('logout')}
                </a>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }
}

export const NavBar = Marty.createContainer(NavBarInner, {
  listenTo: [AppState.Store],

  fetch: {
    curSearch() {
      return AppState.Store.getSearch();
    }
  },

  pending() {
    return containerUtils.defaultPending(this, NavBarInner);
  },

  failed(errors) {
    return containerUtils.defaultPending(this, NavBarInner);
  }
});
