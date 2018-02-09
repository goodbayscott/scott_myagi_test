import React from 'react';

import PublicCompaniesState from 'state/public-companies';
import { AsyncSearchableSelect } from 'components/common/form/select';

export class CompanySearchableSelect extends React.Component {
  /*
    An `AsyncSearchableSelect` component for company
    URLs. Should be used whenever a company needs
    to be selected on a form.
  */
  fetch(search) {
    if (!search) return null;
    return PublicCompaniesState.Store.getItems({
      limit: 20,
      search,
      ordering: '-search_rank',
      fields: ['company_name', 'url', 'id', 'search_rank']
    });
  }

  makeOption = co => {
    // display company id for staff (internal) users for easier ID
    let label = co.get('company_name');
    if (this.props.internalUse) label = `${co.get('company_name')} (${co.get('id').toString()})`;
    return {
      value: co.get('url'),
      label
    };
  };

  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  render() {
    return (
      <AsyncSearchableSelect
        initialValue="Search for a company..."
        {...this.props}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'companyURL'}
        ref="searchableSelection"
        required
      />
    );
  }
}
