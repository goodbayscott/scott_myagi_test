import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import reactMixin from 'react-mixin';

import { t } from 'i18n';

import Style from 'style';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import AreasState from 'state/areas';

import PageState from './state';

import createPaginatedStateContainer from 'state/pagination';

import { GatedFeatureBox, GROUPS_AND_AREAS } from 'components/common/gated-feature';
import { LoadingContainer } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { ListItemCollection } from 'components/common/list-items';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { AreaDetailsForm } from './area-details-form';
import { AreaItem } from './area-item';
import { InfiniteScroll } from 'components/common/infinite-scroll';

import blurImage from 'img/areas-dash-blur.jpg';

class AddAreaModal extends React.Component {
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
      <Modal ref="modal" header={t('create_area')} closeOnDimmerClick>
        <div className="content">
          <AreaDetailsForm currentUser={this.props.currentUser} onSubmit={this.hide} />
        </div>
      </Modal>
    );
  }
}

class AreasCollection extends React.Component {
  static data = {
    areas: $y.getData(AreaItem, 'area', { many: true })
  };

  static propTypes = {
    areas: React.PropTypes.instanceOf(Im.List).isRequired
  };

  createListItem(area) {
    return <AreaItem key={area.get('id')} area={area} />;
  }

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
      >
        <ListItemCollection entities={this.props.areas} createListItem={this.createListItem} />
      </InfiniteScroll>
    );
  }
}

const pStyle = {
  addAreaBtn: {
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
class AreasPage extends React.Component {
  static data = {
    areas: $y.getData(AreasCollection, 'areas', { required: false })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(AreasPage, {
    moreDataAvailable: React.PropTypes.bool.isRequired,
    loadMore: React.PropTypes.func.isRequired,
    hasLoadedData: React.PropTypes.func.isRequired,
    dataIsLoading: React.PropTypes.bool
  });

  showAddAreaModal = () => {
    this.refs.addAreaModal.show();
  };

  render() {
    const learner = this.context.currentUser.get('learner');
    const groupsAndAreasEnabled = learner.company.subscription.groups_and_areas_enabled;
    return (
      <GatedFeatureBox
        hideContent={!groupsAndAreasEnabled}
        descriptionText={t('create_groups_desc')}
        headerText={t('upgrade_to_pro_organise_area')}
        backgroundImage={blurImage}
        featureType={GROUPS_AND_AREAS}
      >
        <div className="ui two column stackable grid" style={pStyle.header}>
          <div className="ui column">{this.getSearchInput({ className: 'ui column' })}</div>
          <div className="ui column">
            {learner.is_company_admin ? (
              <PrimaryButton style={pStyle.addAreaBtn} onClick={this.showAddAreaModal}>
                {t('create_area')}
              </PrimaryButton>
            ) : null}
          </div>
        </div>
        <LoadingContainer
          loadingProps={{
            areas: this.props.areas
          }}
          createComponent={props => (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 800, width: '100%' }}>
                <AreasCollection
                  areas={this.props.areas}
                  loadMore={this.props.loadMore}
                  moreDataAvailable={this.props.moreDataAvailable}
                  dataIsLoading={this.props.dataIsLoading}
                />
              </div>
            </div>
          )}
          noDataText={t('no_areas_available')}
        />
        <AddAreaModal ref="addAreaModal" currentUser={this.context.currentUser} />
      </GatedFeatureBox>
    );
  }
}

export const Page = createPaginatedStateContainer(AreasPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [AreasState.Store, PageState.Store],
  paginate: {
    store: AreasState.Store,
    propName: 'areas',
    limit: 20,
    getQuery() {
      const search = PageState.Store.getSearch();
      const q = {
        fields: $y.getFields(AreasPage, 'areas'),
        company: this.context.currentUser.get('learner').company.id,
        ordering: 'name'
      };
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      const learner = this.context.currentUser.get('learner');
      if (!learner.is_company_admin) {
        q.managers = this.context.currentUser.get('id');
      }
      return q;
    }
  },
  done(results) {
    return <AreasPage ref="innerComponent" {...this.props} {...results} />;
  },
  pending() {
    return containerUtils.defaultPending(this, AreasPage);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, AreasPage, errors);
  }
});
