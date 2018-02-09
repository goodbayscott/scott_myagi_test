import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';

import { t } from 'i18n';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import Style from 'style';

import TagsState from 'state/tags';

import { LoadingContainer } from 'components/common/loading';
import { SearchableMultiSelect } from 'components/common/form/select';

class TagSearchableMultiSelectInner extends React.Component {
  static data = {
    tags: {
      many: true,
      required: false,
      fields: ['name', 'url', 'id']
    }
  };

  static propTypes = $y.propTypesFromData(TagSearchableMultiSelectInner, {
    // Uses current user to determine default tags
    currentUser: React.PropTypes.instanceOf(Im.Map)
  });

  static defaultProps = {
    name: 'tagURLs'
  };

  makeOption = tp => ({
    value: tp.get('url'),
    label: tp.get('name')
  });

  getNameAndValue() {
    const nameAndVal = this.refs.loadingContainer.refs.searchableSelection.getNameAndValue();
    return nameAndVal;
  }

  getInitialSelections() {
    if (this.props.initialSelections && this.props.initialSelections.length) {
      return this.props.initialSelections;
    }
    if (!this.props.currentUser) return;
    const coName = this.props.currentUser.get('learner').company.company_name;
    const coTagURLs = this.props.currentUser.get('learner').company.tags.map(tag => tag.url);
    const matchingTags = this.props.tags.filter(tag => _.includes(coName, tag.get('name')) || _.includes(coTagURLs, tag.get('url')));
    const urls = matchingTags.map(tag => tag.get('url'));
    return urls;
  }

  onChange = tags => {
    if (this.props.onChange) this.props.onChange(tags);
  };

  render() {
    const loading = !this.props.tags;
    const placeholder = this.props.placeholder
      ? this.props.placeholder
      : 'search_for_tags_with_dots';
    let opts;
    if (loading) opts = [];
    else opts = this.props.tags.map(this.makeOption).toArray();
    const noSelectionText = loading ? 'loading_with_dots' : placeholder;
    return (
      <LoadingContainer
        loadingProps={{
          tags: this.props.tags
        }}
        ref="loadingContainer"
        createComponent={props => (
          <SearchableMultiSelect
            noSelectionText={t(noSelectionText)}
            {...this.props}
            initialSelections={this.getInitialSelections()}
            options={opts}
            name={this.props.name}
            ref="searchableSelection"
            style={{ container: { marginBottom: 10 } }}
            onChange={this.onChange}
            required
          />
        )}
        noDataText="There are no available tags."
      />
    );
  }
}

export const TagSearchableMultiSelect = Marty.createContainer(TagSearchableMultiSelectInner, {
  listenTo: [TagsState.Store],
  fetch: {
    tags() {
      const opts = _.extend(
        {
          limit: 0,
          fields: $y.getFields(TagSearchableMultiSelectInner, 'tags'),
          type: 'general',
          ordering: 'name'
        },
        this.props.fetchOpts
      );
      return TagsState.Store.getItems(opts);
    }
  },
  getNameAndValue() {
    const inner = this.getInnerComponent();
    if (!inner) return {};
    return inner.getNameAndValue();
  },
  pending() {
    return containerUtils.defaultPending(this, TagSearchableMultiSelectInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, TagSearchableMultiSelectInner, errors);
  }
});
