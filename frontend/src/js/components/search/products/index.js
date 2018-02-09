import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import Style from 'style/index';

import { ANALYTICS_EVENTS } from 'core/constants';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { qs } from 'utilities/http';

import { t, getNavigatorLocale } from 'i18n';

import createPaginatedStateContainer from 'state/pagination';
import ProductsState from 'state/products';

import { LoadingContainer } from 'components/common/loading';
import { Title, Description, ListItem, ListItemCollection } from 'components/common/list-items';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { Image } from 'components/common/image';
import { ProductDetails } from './product-details';
import FeatureRequestButton from 'components/common/feature-request-button';

class ProductResult extends React.Component {
  constructor() {
    super();
    this.state = {
      showDetails: false
    };
  }

  toggle = () => {
    const newVal = !this.state.showDetails;
    this.setState({ showDetails: newVal });
    if (newVal) {
      analytics.track(ANALYTICS_EVENTS.VIEWED_PRODUCT_SEARCH_RESULT, {
        'Product name': this.props.product.get('title')
      });
    }
  };

  render() {
    const { product } = this.props;
    const image = product.get('image');
    return (
      <ListItem onClick={_.noop}>
        <div className="ui two column grid" onClick={this.toggle}>
          <div className="ui column">
            <Title>{product.get('title')}</Title>
            <Description>{product.get('brand')}</Description>
          </div>
          <div className="ui column">
            <Image src={image} style={{ height: '6em' }} />
          </div>
        </div>
        {this.state.showDetails && (
          <ProductDetails
            product={product}
            currentUser={this.props.currentUser}
            onModCreate={this.props.onModCreate}
          />
        )}
      </ListItem>
    );
  }
}

class ProductResults extends React.Component {
  render() {
    if (!this.props.currentUser.get('learner').company.companysettings.product_search_enabled) {
      return (
        <FeatureRequestButton
          currentUser={this.props.currentUser}
          featureName="product search"
          btnText="Enable product search"
          modalHeader="Make it super simple to search for product information from within Myagi"
        />
      );
    }
    return (
      <LoadingContainer
        loadingProps={[this.props.products]}
        noDataText="We could not find any products matching that search term"
        createComponent={() => (
          <InfiniteScroll
            loadMore={this.props.loadMore}
            moreDataAvailable={this.props.moreDataAvailable}
            dataIsLoading={this.props.dataIsLoading}
          >
            <ListItemCollection
              entities={this.props.products}
              createListItem={product => (
                <ProductResult
                  key={product.get('id')}
                  product={product}
                  currentUser={this.props.currentUser}
                  onModCreate={this.props.onModCreate}
                />
              )}
            />
          </InfiniteScroll>
        )}
      />
    );
  }
}

export const ProductSearch = createPaginatedStateContainer(ProductResults, {
  listenTo: [ProductsState.Store],

  paginate: {
    store: ProductsState.Store,
    propName: 'products',
    limit: 20,
    getQuery() {
      const q = this.props.query;
      if (!q) return undefined;
      return {
        q,
        ordering: '-_score'
      };
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ProductResults);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ProductResults, errors);
  }
});
