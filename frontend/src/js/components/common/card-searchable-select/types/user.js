import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import _ from 'lodash';

import { t } from 'i18n';
import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { SubmitButton } from 'components/common/form';

import { Modal } from 'components/common/modal';
import { TickCircle } from 'components/common/tick-circle';
import PageState from '../page-state';
import UsersState from 'state/users';
import createPaginatedStateContainer from 'state/pagination';

import { cardStyle } from '../constants';
import { EntitySelect } from 'components/common/card-searchable-select/entity-select';

import { CardImage, Card } from 'components/common/cards';

export class UserCard extends React.Component {
  static data = {
    user: {
      required: true,
      fields: ['first_name', 'last_name', 'email', 'id', 'url', 'learner.profile_photo']
    }
  };

  onCardClick = () => {
    this.props.onCardClick(this.props.entity);
  };

  render() {
    const user = this.props.entity;
    const imageEl = <CardImage src={user.get('learner').profile_photo} />;
    const userURL = user.get('url');
    let selected = false;
    if (this.props.selectedEntities) {
      selected = _.includes(this.props.selectedEntities, userURL);
    }

    let tickCircle = null;
    if (selected) {
      tickCircle = <TickCircle isSelected style={cardStyle.tickCircle} />;
    }
    return (
      <Card onClick={this.onCardClick}>
        {imageEl}
        {tickCircle}
        <div className="content">
          <div className="header" style={{ fontSize: '1em', fontWeight: 'normal' }}>
            {`${user.get('first_name')} ${user.get('last_name')}`}
            <br />
            {user.get('email')}
            <div />
          </div>
        </div>
      </Card>
    );
  }
}

export const UserCardSelect = createPaginatedStateContainer(EntitySelect, {
  listenTo: [PageState.Store],

  isValid() {
    const ic = PageState.Store.getEntitySelectComponent();
    if (!ic) return true;
    return ic.isValid();
  },

  getNameAndValue() {
    const ic = PageState.Store.getEntitySelectComponent();
    return ic.getNameAndValue();
    // return this.getInnerComponent().getNameAndValue();
  },

  paginate: {
    store: UsersState.Store,
    propName: 'entities',
    limit: 6,
    getQuery() {
      const query = {
        ordering: 'first_name',
        fields: [$y.getFields(UserCard, 'user')]
      };
      const search = PageState.Store.getEntitySearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      if (this.props.fetchOpts) {
        _.extend(query, this.props.fetchOpts);
      }
      return query;
    }
  },
  done(results) {
    return <EntitySelect {...this.props} {...results} entityName="user" cardComponent={UserCard} />;
  },
  pending() {
    return containerUtils.defaultPending(this, EntitySelect);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EntitySelect, errors);
  }
});

export class UserCardSelectModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      innerComponent: null,
      isValid: false
    };
  }

  isValid = () => {
    const ic = PageState.Store.getEntitySelectComponent();
    if (!ic) {
      if (this.state.innerComponent) {
        const isValid = this.state.innerComponent.isValid();
        this.setState({ isValid });
        return isValid;
        // return this.state.innerComponent.isValid()
      }
      if (this.props.initialValue && this.props.initialValue.length) {
        this.setState({ isValid: true });
        return true;
      }
      this.setState({ isValid: false });
      return false;
    }
    // let ic = this.state.innerComponent;
    const isValid = ic.isValid();
    this.setState({ isValid });
    return isValid;
  };

  getNameAndValue = () => {
    let nameAndValue = {};
    const ic = PageState.Store.getEntitySelectComponent();
    // If the modal has been closed, the page state will be reset, so make sure
    // to set component state so we can still get name and value. Otherwise,
    // use page state for component.
    if (this.state.innerComponent) {
      nameAndValue[this.props.name] = this.state.innerComponent.state.selections;
      return nameAndValue;
    }
    if (!ic) {
      if (this.props.name && this.props.initialValue) {
        nameAndValue = {};
        nameAndValue[this.props.name] = this.props.initialValue;
        return nameAndValue;
      }
      return null;
    }
    return ic.getNameAndValue();
  };

  onCardClick = () => {};

  onUserSelectSubmit = () => {
    this.refs.selectUserModal.hide();
  };

  show = () => {
    this.refs.selectUserModal.show();
  };

  hide = () => {
    this.refs.selectUserModal.hide();
  };

  getUserObject = user => {
    // Provide as much info as we have when selection has changed. We don't
    // necessarily have data for plans that are set as initialValue, so in that
    // case, just return object with a URL attr.
    const ic = PageState.Store.getEntitySelectComponent();
    const entities = ic.props.entities;
    let obj;
    if (entities && entities.size) {
      obj = entities.find(item => item.get('url') == user);
    }

    if (obj === undefined) {
      return Im.Map(user);
    }
    return obj;
  };

  getSelectedEntitiesArray = () => PageState.Store.getSelectedEntities().toArray();

  onChange = innerComponent => {
    // set component state innerComponent so we can still get name and value
    // (for form data) when the modal is closed.
    const ic = PageState.Store.getEntitySelectComponent();
    // re-validate on change
    this.isValid();
    this.setState({ innerComponent });
    _.defer(() => {
      // this.props.onChange();
      const selectedUserObjects = ic.state.selections.map(user => this.getUserObject(user));
      this.props.onUsersChange(selectedUserObjects);
    });
  };

  render() {
    let initialUsers;
    if (this.props.initialValue) initialUsers = this.props.initialValue;
    return (
      <Modal ref="selectUserModal" header="Select a user" closeOnDimmerClick>
        <div className="content">
          <UserCardSelect
            initialValue={initialUsers}
            name={this.props.name}
            ref="UserCardSelect"
            currentUser={this.props.currentUser}
            company={this.props.company}
            onChange={this.onChange}
            onCardClick={this.onCardClick}
            fetchOpts={this.props.fetchOpts}
            required={this.props.required}
            many={this.props.many}
          />
          <SubmitButton text={t('done')} formIsValid={this.state.isValid} onClick={this.hide} />
        </div>
      </Modal>
    );
  }
}
