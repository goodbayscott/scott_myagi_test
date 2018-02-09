import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Style from 'style';
import StyleCustomization from 'style/customization';

import $y from 'utilities/yaler';
import { getSubdomain } from 'utilities/generic';

import PublicCompaniesState from 'state/public-companies';
import PublicLinkState from 'state/public-links';
import TrainingPlansState from 'state/training-plans';

import { LoadingSpinner } from 'components/common/loading';

/*
  These components are used to genericize the fetching and styling
  of the public company from either the subdomain or the link_id.
  Used in the onboarding process / company select
*/

const MYAGI_LOGO = require('img/logo-white.svg');

export function FallbackLogo(props) {
  const companyLogo = props.company && props.company.get('company_logo');
  const companyNavLogo = props.company && props.company.get('companysettings').nav_logo;
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <img
        src={companyNavLogo || companyLogo || MYAGI_LOGO}
        style={{ maxHeight: 200, width: 200 }}
      />
    </div>
  );
}

class PublicStylingInner extends React.Component {
  static data = {
    // data to fetch from public_link query param
    link: {
      required: false,
      fields: [
        'name',
        'initial_channel',
        'initial_channel.id',
        'channels.id',
        'channels.training_plans',
        'channels.training_plans.id',
        'channels.training_plans.thumbnail_url',
        'channels.training_plans.name',
        'channels.training_plans.avg_like_rating',
        'channels.training_plans.modules',
        'channels.training_plans.num_of_attempts',
        'channels.training_plans.is_published',
        'company.company_name',
        'company.company_logo',
        'company.companysettings.style_customization_enabled',
        'company.companysettings.nav_logo',
        'company.companysettings.nav_color',
        'company.companysettings.primary_color',
        'company.companysettings.nav_font_color',
        'company.companysettings.primary_font_color',
        'company.companysettings.allow_signups_to_create_teams'
      ]
    },

    // data to fetch from subdomain company
    company: {
      required: false,
      fields: [
        'company_name',
        'company_logo',
        'has_access_code',
        'companysettings.style_customization_enabled',
        'companysettings.nav_logo',
        'companysettings.nav_color',
        'companysettings.primary_color',
        'companysettings.nav_font_color',
        'companysettings.primary_font_color'
      ]
    }
  };

  componentWillMount() {
    const company = this.props.linkCompany || this.props.subdomainCompany;
    if (company) {
      StyleCustomization.setStylingForCompany(company);
    }
  }

  render() {
    return React.cloneElement(this.props.children, {
      ...this.props,
      key: Style.vars.colors.get('accountsBackground')
    });
  }
}

export const PublicStyling = Marty.createContainer(PublicStylingInner, {
  listenTo: [PublicLinkState.Store, PublicCompaniesState.Store, TrainingPlansState.Store],

  contextTypes: {
    location: React.PropTypes.object.isRequired,
    routeParams: React.PropTypes.object
  },

  fetch: {
    link() {
      const linkName = this.context.routeParams.splat;
      if (!linkName) {
        return null;
      }
      return PublicLinkState.Store.getItems({
        fields: $y.getFields(PublicStylingInner, 'link'),
        name: linkName,
        limit: 1
      });
    },
    companies() {
      const sub = getSubdomain();
      if (!sub) return null;
      return PublicCompaniesState.Store.getItems({
        fields: $y.getFields(PublicStylingInner, 'company'),
        subdomain__iexact: sub
      });
    }
  },

  pending() {
    return <LoadingSpinner containerStyle={{ backgroundColor: 'rgba(0,0,0,0)', height: '100%' }} />;
  },

  done(results) {
    const link = results.link && results.link.get(0);
    const subdomainCompany = results.companies ? results.companies.first() : null;
    const linkCompany = link ? Im.Map(link.get('company')) : null;

    return (
      <PublicStylingInner
        {...this.props}
        {...{
          linkCompany,
          subdomainCompany,
          link
        }}
      />
    );
  },

  failed(errors) {
    return <PublicStylingInner {...this.props} />;
  }
});
