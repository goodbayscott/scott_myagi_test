import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import { t } from 'i18n';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import PageState from './page-state';

import { CardCollection } from 'components/common/cards';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
};

class EntityCardsCollection extends React.Component {
  createCard = entity => this.props.createCard(entity);

  loadMore = e => {
    // prevent form from being submitted
    e.preventDefault();
    this.props.loadMore();
  };

  render() {
    return (
      <div style={styles.container}>
        <CardCollection entities={this.props.entities} createCard={this.createCard} />
        {this.props.moreAvailable() ? (
          <button className="ui basic button" onClick={this.loadMore} style={{ marginTop: 20 }}>
            {t('show_more')}
          </button>
        ) : null}
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setEntitySearch.bind(PageState.ActionCreators)))
export class EntitySelect extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    initialValue: React.PropTypes.array
  };

  constructor(props) {
    super();
    let selections = [];
    if (props.initialValue) {
      selections = props.initialValue;
    }

    this.state = {
      selections,
      selectedEntities: []
    };
  }

  componentWillUnmount() {
    // reset page state so next modal open doesn't already have a search
    // filter set on it.
    PageState.Store.resetState();
  }

  componentDidMount() {
    // if (this.props.registerComponent) this.props.registerComponent(this);
    PageState.ActionCreators.setEntitySelectComponent(this);
    _.defer(() => {
      if (this.props.onChange) this.props.onChange(this);
    });
  }

  onCardClick = entity => {
    // This component contains the isValid method. Use PageState to
    // keep track of component which will be used to determine if the
    // field is valid.
    PageState.ActionCreators.toggleEntitySelection(entity);

    const entityURL = entity.get('url');
    let selections = this.state.selections;
    if (this.props.many) {
      // if many entities are allowed, append new one to list
      if (_.includes(selections, entityURL)) {
        // if entity is already selected, a click should remove the selection
        _.pull(selections, entityURL);
      } else {
        selections.push(entityURL);
      }
    } else {
      // only one entity is allowed
      selections = [entityURL];
    }
    this.setState({ selections, selectedEntities: [entity] });
    _.defer(() => {
      if (this.props.onChange) this.props.onChange(this);
      if (this.props.onCardClick) this.props.onCardClick();
    });
  };

  createEntityCard = entity => {
    const EntityCard = this.props.cardComponent;
    return (
      <EntityCard
        key={entity.get('id')}
        entity={entity}
        currentUser={this.props.currentUser}
        onCardClick={this.onCardClick}
        selectedEntities={this.state.selections}
      />
    );
  };

  getNameAndValue = () => ({
    [this.props.name]: this.state.selections
  });

  isValid() {
    if (this.props.required && !this.state.selections.length) return false;
    return true;
  }

  render() {
    return (
      <div>
        {this.getSearchInput()}
        <LoadingContainer
          loadingProps={{
            entities: this.props.entities
          }}
          createComponent={() => (
            <EntityCardsCollection {...this.props} createCard={this.createEntityCard} />
          )}
        />
      </div>
    );
  }
}
