import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import { t } from 'i18n';

import Style from 'style';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import EnrollmentGroupsState from 'state/enrollment-groups';

import PageState from './state';

import createPaginatedStateContainer from 'state/pagination';

import { GatedFeatureBox, GROUPS_AND_AREAS } from 'components/common/gated-feature';
import { LoadingContainer } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { ListItemCollection } from 'components/common/list-items';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { EnrollmentGroupDetailsForm } from './enrollment-group-details-form';
import { EnrollmentGroupItem } from './enrollment-group-item';
import { InfiniteScroll } from 'components/common/infinite-scroll';

import blurImage from 'img/groups-dash-blur.jpg';

class AddEnrollmentGroupModal extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    this.refs.modal.show();
  };

  hide = () => {
    this.refs.modal.hide();
  };

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('create_group')}>
        <div className="content">
          <EnrollmentGroupDetailsForm currentUser={this.props.currentUser} onSubmit={this.hide} />
        </div>
      </Modal>
    );
  }
}

class EnrollmentGroupsCollection extends React.Component {
  static data = {
    enrollmentGroups: $y.getData(EnrollmentGroupItem, 'enrollmentGroup', { many: true })
  };

  static propTypes = {
    enrollmentGroups: React.PropTypes.instanceOf(Im.List).isRequired
  };

  createListItem(enrollmentGroup) {
    return (
      <EnrollmentGroupItem key={enrollmentGroup.get('id')} enrollmentGroup={enrollmentGroup} />
    );
  }

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
      >
        <ListItemCollection
          entities={this.props.enrollmentGroups}
          createListItem={this.createListItem}
        />
      </InfiniteScroll>
    );
  }
}

const pStyle = {
  addEnrollmentGroupBtn: {
    float: 'right',
    [Style.vars.media.get('mobile')]: {
      float: 'left',
      marginLeft: 0,
      marginTop: -35
    }
  },
  header: {
    display: 'flex',
    [Style.vars.media.get('mobile')]: {
      display: 'block'
    }
  }
};

@Radium
@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class EnrollmentGroupsPage extends React.Component {
  static data = {
    enrollmentGroups: $y.getData(EnrollmentGroupsCollection, 'enrollmentGroups', {
      required: false
    })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(EnrollmentGroupsPage, {
    moreDataAvailable: React.PropTypes.bool.isRequired,
    loadMore: React.PropTypes.func.isRequired,
    hasLoadedData: React.PropTypes.func.isRequired,
    dataIsLoading: React.PropTypes.bool
  });

  showAddEnrollmentGroupModal = () => {
    this.refs.addEnrollmentGroupModal.show();
  };

  render() {
    const learner = this.context.currentUser.get('learner');
    const groupsAndAreasEnabled = learner.company.subscription.groups_and_areas_enabled;
    return (
      <GatedFeatureBox
        hideContent={!groupsAndAreasEnabled}
        descriptionText={t('create_groups_desc')}
        headerText={t('upgrade_to_pro_organise')}
        backgroundImage={blurImage}
        featureType={GROUPS_AND_AREAS}
      >
        <div className="ui two column stackable grid" style={pStyle.header}>
          <div className="ui column">{this.getSearchInput({ className: 'ui column' })}</div>
          <div className="ui column">
            {learner.is_company_admin ? (
              <PrimaryButton
                style={pStyle.addEnrollmentGroupBtn}
                onClick={this.showAddEnrollmentGroupModal}
              >
                {t('create_group')}
              </PrimaryButton>
            ) : null}
          </div>
        </div>
        <LoadingContainer
          loadingProps={{
            enrollmentGroups: this.props.enrollmentGroups
          }}
          createComponent={props => (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 800, width: '100%' }}>
                <EnrollmentGroupsCollection
                  enrollmentGroups={this.props.enrollmentGroups}
                  loadMore={this.props.loadMore}
                  moreDataAvailable={this.props.moreDataAvailable}
                  dataIsLoading={this.props.dataIsLoading}
                  currentUser={this.context.currentUser}
                />
              </div>
            </div>
          )}
          noDataText={t('no_groups_available')}
        />
        <AddEnrollmentGroupModal
          ref="addEnrollmentGroupModal"
          currentUser={this.context.currentUser}
        />
      </GatedFeatureBox>
    );
  }
}

export const Page = createPaginatedStateContainer(EnrollmentGroupsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [EnrollmentGroupsState.Store, PageState.Store],
  paginate: {
    store: EnrollmentGroupsState.Store,
    propName: 'enrollmentGroups',
    limit: 20,
    getQuery() {
      const search = PageState.Store.getSearch();
      const q = {
        fields: $y.getFields(EnrollmentGroupsPage, 'enrollmentGroups'),
        company: this.context.currentUser.get('learner').company.id,
        ordering: 'name'
      };
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      return q;
    }
  },
  done(results) {
    return <EnrollmentGroupsPage ref="innerComponent" {...this.props} {...results} />;
  },
  pending() {
    return containerUtils.defaultPending(this, EnrollmentGroupsPage);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollmentGroupsPage, errors);
  }
});
