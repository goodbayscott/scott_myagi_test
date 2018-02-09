import React from 'react';

import Style from 'style';

import { LOGIN_URL } from 'core/constants';

import { t } from 'i18n';
import { ThinBox } from 'components/common/box';
import { HoverableLink } from 'components/common/hover';
import { PublicStyling, FallbackLogo } from 'components/common/public-styling';
import { PublicCompanySelect } from './company-search';

const styles = {
  formBox: {
    color: Style.vars.colors.get('white'),
    textAlign: 'center'
  },
  container: {
    padding: 40,
    background: Style.vars.colors.get('accountsBackground'),
    color: Style.vars.colors.get('white')
  },
  header: {
    marginBottom: 10,
    textAlign: 'center'
  },
  link: {
    textAlign: 'center',
    display: 'block'
  },
  linkHover: {
    color: Style.vars.colors.get('white'),
    cursor: 'pointer'
  },
  forwardIcon: {
    margin: 0,
    marginLeft: -5
  },
  form: {
    margin: '40px 0'
  },
  submitButton: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.4)',
    height: 50,
    padding: 15
  },
  joinCoLink: {
    color: Style.vars.colors.get('xxDarkGrey')
  },
  searchInputContainerStyle: { width: '100%', marginTop: 40 }
};

const spinnerProps = {
  containerStyle: { backgroundColor: Style.vars.colors.get('accountsBackground') }
};

class CompanySelect extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  navigateToCompanySubdomain = company => {
    const hostname = window.location.hostname.replace('www.', '');
    const port = window.location.port ? `:${window.location.port}` : '';
    const next = `${window.location.protocol}//${company.get('subdomain')}.${hostname}${port}${
      window.location.search
    }`;
    window.location.href = next;
  };

  onCompanySelect = company => {
    this.navigateToCompanySubdomain(company);
  };

  createCompany = () => {
    this.context.router.push(`/signup/user/${window.location.search}`);
  };

  render() {
    return (
      <ThinBox style={styles.container}>
        <FallbackLogo company={this.props.linkCompany || this.props.subdomainCompany} />
        <h1 style={styles.header}>{t('select_your_company_below')}</h1>
        <p style={{ textAlign: 'center' }}>{t('if_you_were_invited_here_by')}</p>
        <HoverableLink
          style={styles.link}
          hoverStyle={styles.linkHover}
          onClick={this.createCompany}
        >
          {t('cant_find_your_company')} {t('create_one_here')}{' '}
          <i style={styles.forwardIcon} className="angle right icon" />
        </HoverableLink>
        <HoverableLink style={styles.link} hoverStyle={styles.linkHover} href={LOGIN_URL}>
          {t('already_using_myagi')} {t('log_in_here')}{' '}
          <i style={styles.forwardIcon} className="angle right icon" />
        </HoverableLink>
        <PublicCompanySelect onCompanySelect={this.onCompanySelect} spinnerProps={spinnerProps} />
      </ThinBox>
    );
  }
}

export class Page extends React.Component {
  render() {
    return (
      <PublicStyling>
        <CompanySelect />
      </PublicStyling>
    );
  }
}
