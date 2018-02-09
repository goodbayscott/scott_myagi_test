import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import createPaginatedStateContainer from 'state/pagination';

import PublicCompaniesState from 'state/public-companies';
import PageState from './page-state';

import { t } from 'i18n';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import { Title, ListItem, ListItemCollection } from 'components/common/list-items';
import { Image } from 'components/common/image';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { ExistingCompanyModal } from 'components/accounts/signup/company/page';

const styles = {
  formBox: {
    color: Style.vars.colors.get('white'),
    textAlign: 'center'
  },
  container: {
    padding: 40,
    marginTop: 100,
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
    color: Style.vars.colors.get('white')
  },
  forwardIcon: {
    margin: '0, 0, 15px, 0'
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
  searchInputContainerStyle: {
    width: '100%',
    marginTop: 40
  }
};

// const spinnerProps = {containerStyle: {backgroundColor: Style.vars.colors.get('accountsBackground')}};

class CompanyItem extends React.Component {
  static data = {
    company: {
      required: true,
      fields: [
        'id',
        'url',
        'company_name',
        'company_url',
        'subdomain',
        'company_logo',
        $y.getFields(ExistingCompanyModal, 'existingCompany')
      ]
    }
  };

  static propTypes = {
    company: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  navigateToCompanySubdomain = () => {
    const hostname = window.location.hostname.replace('www.', '');
    const port = window.location.port ? `:${window.location.port}` : '';
    const next = `${window.location.protocol}//${this.props.company.get('subdomain')}.${hostname}${port}${window.location.search}`;
    window.location.href = next;
  };

  onCompanySelect = () => {
    this.props.onCompanySelect(this.props.company);
  };

  render() {
    return (
      <ListItem onClick={this.onCompanySelect}>
        <div className="ui grid">
          <div className="ui four wide column">
            <Image src={this.props.company.get('company_logo')} style={{ height: '3em' }} />
          </div>
          <div className="ui twelve wide column">
            <Title>{this.props.company.get('company_name')}</Title>
            <p style={styles.joinCoLink}>{t('join_this_company')} &gt;</p>
          </div>
        </div>
      </ListItem>
    );
  }
}

class CompanyList extends React.Component {
  static data = {
    companies: {
      required: true,
      many: true,
      fields: $y.getFields(CompanyItem, 'company')
    }
  };

  static propTypes = {
    companies: React.PropTypes.instanceOf(Im.List).isRequired
  };

  createListItem = company => (
    <CompanyItem
      key={company.get('id')}
      company={company}
      onCompanySelect={this.props.onCompanySelect}
    />
  );

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
        spinnerProps={this.props.spinnerProps}
      >
        <ListItemCollection entities={this.props.companies} createListItem={this.createListItem} />
      </InfiniteScroll>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch.bind(PageState.ActionCreators)))
class CompanySelect extends React.Component {
  static data = {
    companies: $y.getData(CompanyList, 'companies', { required: false })
  };

  render() {
    return (
      <div>
        {this.getSearchInput({ style: { container: styles.searchInputContainerStyle } })}
        <LoadingContainer
          spinnerProps={this.props.spinnerProps}
          loadingProps={[this.props.companies]}
          noDataText={t('no_companies_match')}
          createComponent={() => (
            <CompanyList {...this.props} onCompanySelect={this.props.onCompanySelect} />
          )}
        />
      </div>
    );
  }
}

export const PublicCompanySelect = createPaginatedStateContainer(CompanySelect, {
  contextTypes: {
    location: React.PropTypes.object.isRequired
  },

  listenTo: [PageState.Store],

  paginate: {
    store: PublicCompaniesState.Store,
    propName: 'companies',
    limit: 100,
    getQuery() {
      const q = {
        fields: $y.getFields(CompanySelect, 'companies'),
        has_subdomain: true,
        ordering: 'company_name'
      };
      const search = PageState.Store.getSearch();
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      return q;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CompanySelect);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompanySelect, errors);
  }
});
