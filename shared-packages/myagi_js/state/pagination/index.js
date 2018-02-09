import { getMarty, getApplication, getHistory } from 'core/state-configuration';

import { FILTER_BY_PAGINATION_PARAMS } from '../common/generators/http-api/create-store';

const Marty = getMarty();
const app = getApplication();

const Im = require('immutable');
const React = require('react');
const _ = require('lodash');

const history = getHistory();

const DEFAULT_LIMIT = 20;

// The two pagination types:
// PAGED is when we want just the current page of data to be fetched.
// INFINITE is when we want all data, including the current page, to be returned
// from the store.
export const NUM_PAGED = 'paged';
export const INFINITE = 'infinite';

const PaginationStoreClass = Marty.createStore({
  /*
    Stores pagination data for stores. Allows same store to be paginated
    according to separate queries simultaneously.
  */
  id: 'PaginationStore',

  getInitialState() {
    return Im.Map();
  },

  getPaginationOptsID(pOpts) {
    return pOpts.store.id;
  },

  getStateForOpts(pOpts) {
    return this.state.get(this.getPaginationOptsID(pOpts));
  },

  setStateForOpts(pOpts, newState) {
    this.state = this.state.set(this.getPaginationOptsID(pOpts), newState);
  },

  resetStateForPaginatedStore(opts) {
    const { store } = opts;
    if (!store.id) console.warn('Paginated stores should have an id');
    const initState = {
      initOffset: opts.offset || 0,
      initLimit: opts.limit === undefined || opts.limit === null ? DEFAULT_LIMIT : opts.limit,
      // Paginates by query, meaning that same store can be paginated according to separate queries
      // simultaneously.
      queryData: {},
      lastQuery: null,
      lastFetch: null,
      loading: false,
      paginatedStore: store,
      getQuery: opts.getQuery,
      storeOpts: opts.storeOpts,
      paginationType: opts.paginationType || INFINITE,
      // This option specifies whether only the most recent
      // page should be fetched, or if all previous pages
      // should also be fetched each time request is made.
      // When `true`, data is more likely to be up to date,
      // however there is the risk of very large fetches.
      // It is most relevant when the INFINITE paginationType
      // is used.
      fetchAll: opts.fetchAll
    };
    this.setStateForOpts(opts, initState);
  },

  getQueryId(query) {
    return JSON.stringify(query);
  },

  getCurrentQuery(pOpts) {
    const state = this.getStateForOpts(pOpts);
    return state.getQuery();
  },

  getDefaultQueryData(pOptsState) {
    return { limit: pOptsState.initLimit, offset: pOptsState.initOffset };
  },

  getQueryData(pOptsState, query) {
    const queryId = this.getQueryId(query);
    pOptsState.queryData[queryId] =
      pOptsState.queryData[queryId] || this.getDefaultQueryData(pOptsState);
    return pOptsState.queryData[queryId];
  },

  pWrap(pOpts, data) {
    // Includes limit and offset values in given `data`.
    const state = this.getStateForOpts(pOpts);
    data = data || {};
    const queryData = this.getQueryData(state, data);
    let offset;
    let limit;
    // If the `fetchAll` strategy is requested, then
    // fetch all preceeding entities as well as the
    // the latest set.
    if (state.fetchAll) {
      offset = 0;
      limit = queryData.offset + queryData.limit;
    } else {
      offset = queryData.offset;
      limit = queryData.limit;
    }
    const addedQuery = { offset, limit };

    // The `FILTER_BY_PAGINATION_PARAMS` value is
    // passed in as a query param, even though it should
    // really be storeOpt...this is something which should
    // be fixed in future.
    if (state.paginationType === NUM_PAGED) {
      addedQuery[FILTER_BY_PAGINATION_PARAMS] = true;
    }
    return _.extend({}, data, addedQuery);
  },

  loadMore(pOpts, cxt) {
    const state = this.getStateForOpts(pOpts);
    if (!this.moreAvailable(pOpts) || state.loading || !state.lastFetch) return;
    const nextOffset = state.lastFetch.result.count();
    const query = state.getQuery();
    const queryData = this.getQueryData(state, query);
    const { offset, limit } = queryData;
    queryData.offset = nextOffset;
    const updatedQuery = this.pWrap(pOpts, query);
    if (this.getQueryId(updatedQuery) === this.getQueryId(state.lastQuery)) {
      // No actual changes, so just return. Prevents infinite loops when using InfiniteScroll
      // component.
      return;
    }
    state.loading = true;
    // Trigger hasChanged so that the container will know to
    // refetch data.
    this.hasChanged();
  },

  moreAvailable(pOpts) {
    const state = this.getStateForOpts(pOpts);
    const knownCount = state.paginatedStore.getKnownCountForQuery(state.lastQuery);
    if (!state.lastFetch || !state.lastFetch.result) return true;
    const curCount = state.lastFetch.result.count();
    if (curCount < knownCount) {
      return true;
    }
    // Don't know count, so assume there is more data.
    if (knownCount === undefined) {
      return true;
    }
    return false;
  },

  numAvailablePages(pOpts) {
    const state = this.getStateForOpts(pOpts);
    let curQuery = state.lastQuery;
    // Query can be null if caller does not want to trigger a fetch
    if (curQuery === null) return null;
    if (curQuery[FILTER_BY_PAGINATION_PARAMS]) {
      curQuery = _.extend({}, curQuery, {
        [FILTER_BY_PAGINATION_PARAMS]: false
      });
    }
    const knownCount = state.paginatedStore.getKnownCountForQuery(curQuery);
    if (!knownCount) return null;
    const query = state.getQuery();
    const queryData = this.getQueryData(state, query);
    const num = Math.ceil(knownCount / queryData.limit);
    return num;
  },

  numResults(pOpts) {
    const state = this.getStateForOpts(pOpts);
    const curQuery = state.lastQuery;
    const knownCount = state.paginatedStore.getKnownCountForQuery(curQuery);
    return knownCount;
  },

  goToPage(pOpts, pageNum) {
    const state = this.getStateForOpts(pOpts);
    if (state.loading || !state.lastFetch) return;
    if (state.paginationType !== NUM_PAGED) {
      console.warn('You are usinig `goToPage` with a `paginationType` which is not `NUM_PAGED`. You probably do not want to do this.');
    }
    const query = state.getQuery();
    const queryData = this.getQueryData(state, query);

    // TODO - Lots of duplication with loadMore!!!!!!!!!
    const { offset, limit } = queryData;
    const nextOffset = pageNum * limit;
    queryData.offset = nextOffset;
    const updatedQuery = this.pWrap(pOpts, query);
    if (this.getQueryId(updatedQuery) === this.getQueryId(state.lastQuery)) {
      // No actual changes, so just return. Prevents infinite loops when using InfiniteScroll
      // component.
      return;
    }
    state.loading = true;
    // Trigger hasChanged so that the container will know to
    // refetch data.
    this.hasChanged();
  },

  getCurrentPage(pOpts) {
    const state = this.getStateForOpts(pOpts);
    if (!state.lastFetch) return 0;
    const query = state.getQuery();
    const queryData = this.getQueryData(state, query);
    const { offset, limit } = queryData;
    return Math.ceil(offset / limit);
  },

  hasLoadedData(pOpts) {
    const state = this.getStateForOpts(pOpts);
    return state.lastFetch !== null && state.lastFetch.result !== undefined;
  },

  bindQueryFunc(pOpts, cxt) {
    const state = this.getStateForOpts(pOpts);
    // getQuery func is bound to cxt (which should be the
    // current container instance). That way, getQuery func has
    // access to container props.
    state.getQuery = state.getQuery.bind(cxt);
  },

  doCurrentFetch(pOpts) {
    const state = this.getStateForOpts(pOpts);

    // getQuery func is bound to cxt (which should be the
    // current container instance). That way, getQuery func has
    // access to container props.
    const baseQuery = state.getQuery();
    const query = this.pWrap(pOpts, baseQuery);
    const fetch = state.paginatedStore.getItems(query, state.storeOpts);
    const promise = fetch.toPromise();
    // These must be set here for infinite scroll to
    // work correctly
    state.lastQuery = query;
    state.lastFetch = fetch;
    const setLoading = res => {
      // Set loading for this store to false.
      // isLoading can then be called by components to determine
      // state to display.
      const last = state.loading;
      state.loading = false;
      if (res && last) {
        if (!state.lastResult || state.lastResult.count() !== res.count()) {
          // Call has changed if amount of data returned has changed.
          // Do not call otherwise as will result in infinite loop.
          this.hasChanged();
        }
      }
      state.lastResult = res;
    };
    promise.then(setLoading);
    promise.catch(setLoading);
    const fetchIsPending = pOpts.store.fetchIsPending(query);
    if (fetch.done && !fetchIsPending) {
      setLoading();
    }
    return fetch;
  },

  isLoading(pOpts) {
    const state = this.getStateForOpts(pOpts);
    return state.loading || !this.hasLoadedData(pOpts);
  }
});

app.register('PaginationStore', PaginationStoreClass);
const PaginationStore = app.PaginationStore;

function createPaginatedStateContainer(innerComponent, opts) {
  /*
    Creates a marty container which supports
    pagination. Expects innerComponent and opts in the form:
     {
        paginate: { store: ..., query: ..., propName: ... },
        ...
     }
    The paginate.store value should be store from which paginated data is retrieved.
    The paginate.query value should be an object which defines the query which should be
    sent to the store.getItems method to retrieve data.
    The paginate.propName value should be the desired key for the retrieved data on this.state.
    Other options outside of paginate will be passed as config to the standard Marty.createContainer method.
  */

  // Make sure opts is not updated somewhere else.
  opts = _.extend({}, opts);

  // Set initial opts in pagination store
  PaginationStore.resetStateForPaginatedStore(opts.paginate);

  opts.listenTo = opts.listenTo || [];
  opts.listenTo.push(opts.paginate.store);
  opts.listenTo.push(PaginationStore);

  // Create fetch func
  const fetchFunc = function () {
    // Ensure fetch function is bound to current component instance.
    // NOTE - Future calls to loadMore func require that this
    // binding occurs.
    PaginationStore.bindQueryFunc(opts.paginate, this);
    return PaginationStore.doCurrentFetch(opts.paginate);
  };

  // Create an isLoading fetch func
  // NOTE - This is the new way to keep track of whether there
  // is more data available. Original `isLoading` function should
  // be deprecated
  const isLoadingFetch = function () {
    return PaginationStore.isLoading(opts.paginate);
  };

  // Create an moreAvailable fetch func
  // NOTE - This is the new way to keep track of whether there
  // is more data available. Original `moreAvailable` function should
  // be deprecated
  const moreAvailableFetch = function () {
    return PaginationStore.moreAvailable(opts.paginate);
  };

  const numAvailablePagesFetch = function () {
    return PaginationStore.numAvailablePages(opts.paginate);
  };

  const numResultsFetch = function () {
    return PaginationStore.numResults(opts.paginate);
  };

  const currentPageFetch = function () {
    return PaginationStore.getCurrentPage(opts.paginate);
  };

  const getCurrentQuery = function () {
    return PaginationStore.getCurrentQuery(opts.paginate);
  };

  // Include other fetch functions if they were specified in opts.
  let fetchOpt = {};
  fetchOpt[opts.paginate.propName] = fetchFunc;
  fetchOpt.dataIsLoading = isLoadingFetch;
  fetchOpt.moreDataAvailable = moreAvailableFetch;
  fetchOpt.numAvailablePages = numAvailablePagesFetch;
  fetchOpt.numResults = numResultsFetch;
  fetchOpt.currentPage = currentPageFetch;
  fetchOpt.currentQuery = getCurrentQuery;
  fetchOpt = _.extend(opts.fetch || {}, fetchOpt);

  // Add extra methods to the container
  opts = _.extend(opts, {
    fetch: fetchOpt
  });

  // Create container class
  const martyContainer = Marty.createContainer(innerComponent, opts);

  // Make it possible for paginated state to be reset easily
  martyContainer.prototype.resetPaginatedState = function () {
    PaginationStore.resetStateForPaginatedStore(opts.paginate);
  };

  martyContainer.prototype.getCurPaginatedQuery = function () {
    const state = PaginationStore.getStateForOpts(opts.paginate);
    return PaginationStore.pWrap(opts.paginate.store, state.getQuery());
  };

  // Add new getInitialState method to reset pagination state for this store.
  // TODO - Submit pull request to marty.js repo which allows override of getInitialState
  // on containers.
  const origGetInitialState = martyContainer.prototype.getInitialState;
  martyContainer.prototype.getInitialState = function () {
    // Ensure that pagination state gets reset when page loads
    this.resetPaginatedState();
    // history.listen(this.resetPaginatedState.bind(this));
    if (origGetInitialState) return origGetInitialState.apply(this, arguments);
  };

  // Hack to suppress warning message
  martyContainer.prototype.getInitialState.isReactClassApproved =
    origGetInitialState.isReactClassApproved;

  // Add references to these functions to props so that they will be passed down
  // to child components.
  const defaults = opts.getDefaultProps ? opts.getDefaultProps() : {};
  martyContainer.defaultProps = _.extend(defaults, {
    // THESE ARE DEPRECATED, DO NOT USE
    moreAvailable: PaginationStore.moreAvailable.bind(PaginationStore, opts.paginate),
    hasLoadedData: PaginationStore.hasLoadedData.bind(PaginationStore, opts.paginate),
    isLoading: PaginationStore.isLoading.bind(PaginationStore, opts.paginate),
    //

    loadMore: PaginationStore.loadMore.bind(PaginationStore, opts.paginate),
    goToPage: PaginationStore.goToPage.bind(PaginationStore, opts.paginate),
    currentQuery: PaginationStore.getCurrentQuery.bind(PaginationStore, opts.paginate),
    resetPagination: () => {
      PaginationStore.resetStateForPaginatedStore(opts.paginate);
    },
    numResults: null,
    dataIsLoading: true,
    moreDataAvailable: false,
    numAvailablePages: null,
    currentPage: 0
  });

  return martyContainer;
}

export default createPaginatedStateContainer;
