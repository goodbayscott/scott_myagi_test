import {
  getApplication,
  getHistory,
  getMarty,
  makeEntitiesFullyImmutable,
  getAPIBaseURL
} from 'core/state-configuration';

const app = getApplication();
const history = getHistory();
const Marty = getMarty();

import React from 'react';
import Im from 'immutable';
import { attachExtendMethod } from 'utilities/classes';
import _ from 'lodash';

import Raven from 'raven-js';
import moment from 'moment';

import { assert } from 'utilities/assert';

import { getClassId } from './common';

const RESULT_COUNT_HEADER = 'X-Result-Count';
const BASE_NON_FILTER_PARAMS = ['fields', 'ordering'];
const PAGINATION_NON_FILTER_PARAMS = ['limit', 'offset'];
export const FILTER_BY_PAGINATION_PARAMS = '__filter_by_pagination_params__';
const REVERSE_SORT_SPECIFIER = '-';
const ORDERING = 'ordering';
const RELATIONAL_DIVIDER = '__';
const MAIN_VERSION = '__main___';
const ALL_FIELDS = ['*'];
const REQUIRED_FIELDS = ['id', 'url'];
const ALL_FILTER_ID = '{}';
const MAX_QUEUED_FETCH_RETRIES = 5;

function getFilterId(opts) {
  opts = opts || Im.Map();
  // Convert vals to strings to avoid issues where ids have been specified as
  // string or integer in different circumstances
  const stringValOpts = {};
  _.each(opts.toObject(), (val, key) => {
    let asString;
    if (val === null) {
      asString = 'null';
    } else if (val === undefined) {
      asString = 'undefined';
    } else if (val.toString) {
      asString = val.toString();
    } else {
      throw new Error('Value could not be converted to a string');
    }
    stringValOpts[key] = asString;
  });
  // TODO - The FILTER_BY_PAGINATION_PARAMS query value should really
  // be a storeOpt, however that would require significant reworking of the
  // `createStore` function. The purpose is to support infinite scroll type
  // pagination as opposed to regular number based pagination (the later of
  // which requires filtering data by limit / offset, while the former
  // does not).
  const filterParams = opts.get(FILTER_BY_PAGINATION_PARAMS)
    ? BASE_NON_FILTER_PARAMS
    : BASE_NON_FILTER_PARAMS.concat(PAGINATION_NON_FILTER_PARAMS);
  filterParams.forEach(param => delete stringValOpts[param]);
  return `${JSON.stringify(stringValOpts)}`;
}

function getFieldsId(fields) {
  fields = _.sortBy(fields);
  return JSON.stringify(fields);
}

export function entitiesAreEqual(e1, e2) {
  if (!e1 && e2) return false;
  if (e1 && !e2) return false;
  if (e1.count() !== e2.count()) return false;
  // TODO - This is really not ideal. Should use the Immutable.is() function,
  // however that does not play well with the __matchesFilters val on single entities,
  // as it always concludes that two entites are different even when they are the same because
  // __matchesFilters is a new object each time.
  return JSON.stringify(e1.toJSON()) === JSON.stringify(e2.toJSON());
}

function _normalizeId(id) {
  if (!isNaN(id)) {
    id = parseInt(id);
  }
  assert(Boolean(id), `ID is falsy: '${id}'`);
  return id;
}

function getItemRelatedVal(item, parts) {
  // Sort by related field if requested
  let val = item.get(_.head(parts));
  _.tail(parts).forEach((part) => {
    try {
      if (val.get) {
        val = val.get(part);
      } else {
        val = val[part];
      }
    } catch (e) {
      console.warn('Error while ordering by related field ', parts, e);
    }
  });
  return val;
}

export class ItemContainer {
  constructor(id) {
    if (!id) console.warn('`ItemContainer` created without an `id`');
    this.id = _normalizeId(id);
    this.matchesFilterIds = Im.Map({
      [ALL_FILTER_ID]: true
    });
    this.versions = Im.Map();
  }

  _validateNewVersion(newVersion) {
    if (!newVersion.toJS) throw new Error('`newVersion` argument should be an immutable Map');
  }

  getId() {
    return this.id;
  }

  clearMatchesFilters() {
    this.matchesFilterIds = this.matchesFilterIds.clear();
  }

  updateMatchesFilter(fetchOpts, val = true) {
    const filterId = getFilterId(fetchOpts);
    this.matchesFilterIds = this.matchesFilterIds.set(filterId, val);
  }

  doesMatchFilterId(filterId) {
    return this.matchesFilterIds.get(filterId);
  }

  doesMatchFilter(fetchOpts) {
    return this.doesMatchFilterId(getFilterId(fetchOpts));
  }

  hasMatchingVersion(newVersion, fetchOpts = Im.Map()) {
    this._validateNewVersion(newVersion);
    const fields = fetchOpts.get('fields') || ALL_FIELDS;
    const fieldsId = getFieldsId(fields);
    const existingVersion = this.versions.get(fieldsId);
    let hasMatchingVersion = false;
    if (existingVersion) {
      if (entitiesAreEqual(newVersion, existingVersion)) {
        hasMatchingVersion = true;
      }
    }
    return hasMatchingVersion;
  }

  addVersion(newVersion, fetchOpts = Im.Map()) {
    this._validateNewVersion(newVersion);
    const fields = fetchOpts.get('fields') || ALL_FIELDS;
    const fieldsId = getFieldsId(fields);
    this.versions = this.versions.set(fieldsId, newVersion);
    this.updateMatchesFilter(fetchOpts);
  }

  getVersion(fetchOpts = Im.Map()) {
    const fields = fetchOpts.get('fields') || ALL_FIELDS;
    const fieldsId = getFieldsId(fields);
    return this.versions.get(fieldsId);
  }

  getAnyVersion() {
    // Useful for just retrieving whatever version is currently stored
    // in the container. Prefers the `ALL_FIELDS` version.
    let version = this.getVersion();
    if (!version) version = this.versions.first();
    return version;
  }

  updateVersions(data) {
    this.prevVersions = this.versions;
    this.versions = this.versions.map(version => (version = version.merge(data)));
  }

  rollbackMostRecentUpdate() {
    if (!this.prevVersions) return;
    this.versions = this.prevVersions;
  }
}

function getDefaultState() {
  return {
    knownCounts: Im.Map(),
    pendingFetches: Im.OrderedMap(),
    queuedFetches: Im.OrderedMap(),
    recentFetches: Im.OrderedMap(),
    itemContainers: Im.OrderedMap(),
    itemContainersPendingDelete: Im.Map(),
    itemContainersPendingDoDetailAction: Im.Map(),
    itemContainersPendingUpdate: Im.Map(),
    lastWriteDateTime: null,
    queuedFetchRetries: 0
  };
}

export function createStore(entityName, constants, queries, endpoint, localMakeEntitiesImmutable) {
  const id = getClassId(entityName, 'Store');

  const storeClass = Marty.createStore({
    id,
    handlers: {
      onRetrieved: constants[`RETRIEVED_${entityName}`],
      onRetrievedMany: constants[`RETRIEVED_MANY_${entityName}`],
      onDeleteStarting: constants[`DELETE_${entityName}_STARTING`],
      onDelete: constants[`DELETE_${entityName}`],
      onDeleteFailed: constants[`DELETE_${entityName}_FAILED`],
      onCreate: constants[`CREATE_${entityName}`],
      onCreateStarting: constants[`CREATE_${entityName}_STARTING`],
      onUpdateStarting: constants[`UPDATE_${entityName}_STARTING`],
      onUpdate: constants[`UPDATE_${entityName}`],
      onUpdateFailed: constants[`UPDATE_${entityName}_FAILED`],
      onDoDetailAction: constants[`DO_DETAIL_ACTION_${entityName}`],
      onDoDetailActionStarting: constants[`DO_DETAIL_ACTION_${entityName}_STARTING`],
      onDoDetailActionFailed: constants[`DO_DETAIL_ACTION_${entityName}_FAILED`],
      onDoListAction: constants[`DO_LIST_ACTION_${entityName}`],
      onClearRecentFetches: constants[`CLEAR_RECENT_FETCHES_FOR_${entityName}`],
      onClearRecentFetchesForQuery: constants[`CLEAR_RECENT_FETCHES_FOR_QUERY_${entityName}`],
      onResetLocalData: constants[`RESET_LOCAL_DATA_FOR_${entityName}`],
      // This is only relevant in native app. Arguably it should be part of the
      // start configuration module.
      onAuthStatusChanged: 'SET_AUTH_TOKEN'
    },

    getInitialState() {
      return getDefaultState();
    },

    //
    // Parsing
    //
    fullParse(entity, fetchOpts) {
      entity = this.parse(entity);
      // `makeEntitiesFullyImmutable` can be set globally for all stores
      // or locally for a single state module.
      // TODO - Upgrade webapp to use fully immutable entities,
      // then get rid of both of these settings.
      if (makeEntitiesFullyImmutable || localMakeEntitiesImmutable) {
        return Im.fromJS(entity);
      }
      return Im.Map(entity);
    },

    parse(entity) {
      // Override if required.
      return entity;
    },

    //
    // Action handlers
    //

    _getItemContainerForEntity(entity) {
      const id = entity.get ? entity.get('id') : entity.id;
      return this._getItemContainerForID(id);
    },

    _getItemContainerForID(id) {
      id = _normalizeId(id);
      const itemContainer = this.state.itemContainers.get(id) || new ItemContainer(id);
      return itemContainer;
    },

    onAuthStatusChanged() {
      // Reset state entirely. Should
      // end up with fresh stores.
      this.setState(this.getInitialState());
      this.hasChanged();
    },

    onRetrieved(id, entity, headers, fetchOpts, storeOpts) {
      id = _normalizeId(id);
      // If there are pending operations we care about then it would not be good to
      // alter state of the store.
      if (this._finishEarly(fetchOpts, storeOpts)) return;
      const parsedEntity = this.fullParse(entity);
      const itemContainer = this._getItemContainerForEntity(parsedEntity);
      const hasChanged = !itemContainer.hasMatchingVersion(parsedEntity, fetchOpts);
      itemContainer.addVersion(parsedEntity, fetchOpts);
      this.state.itemContainers = this.state.itemContainers.set(id, itemContainer);
      const fetchId = this.getFetchId(fetchOpts);
      if (hasChanged) {
        this.hasChanged();
      }
      // Prevent another fetch for same data this tick
      this.cleanupPostFetch(fetchId);
    },

    onRetrievedMany(entities, headers, fetchOpts, storeOpts) {
      // If there are pending operations we care about then it would not be good to
      // alter state of the store.
      if (this._finishEarly(fetchOpts, storeOpts)) return;
      let newState = this.state.itemContainers;
      const fetchId = this.getFetchId(fetchOpts);
      let hasChanged = false;
      newState = newState.withMutations((mutableState) => {
        entities.forEach((entity) => {
          if (!entity) return;
          let id = entity.id;
          id = _normalizeId(id);
          const parsedEntity = this.fullParse(entity, fetchOpts);
          const itemContainer = this._getItemContainerForEntity(parsedEntity);
          if (!hasChanged) hasChanged = !itemContainer.hasMatchingVersion(parsedEntity, fetchOpts);
          itemContainer.addVersion(parsedEntity, fetchOpts);
          mutableState.set(id, itemContainer);
        });
      });
      // Trigger has changed if new state and old state are not equal, or if current fetch has not yet been added
      // to recent fetches (which implies that fetch has never triggered a change event).
      hasChanged = hasChanged || !this.state.recentFetches.get(fetchId);
      this.state.itemContainers = newState;
      let totalCount = headers.get(RESULT_COUNT_HEADER);
      if (totalCount !== undefined) {
        const filterIds = [getFilterId(fetchOpts)];
        // If we are including pagination params in filtering, then
        // we still want to set the known count for the query where pagination
        // params are ignored.
        if (fetchOpts.get(FILTER_BY_PAGINATION_PARAMS)) {
          filterIds.push(getFilterId(fetchOpts.set(FILTER_BY_PAGINATION_PARAMS, false)));
        }
        totalCount = parseInt(totalCount);
        filterIds.forEach((i) => {
          this.state.knownCounts = this.state.knownCounts.set(i, totalCount);
        });
      }
      if (hasChanged) {
        this.hasChanged();
      }
      // Set pending fetches state on next tick to prevent any new fetches for same data this tick.
      this.cleanupPostFetch(fetchId);
    },

    _finishEarly(fetchOpts, storeOpts) {
      // Finish early if there are pending writes, but make sure to
      // cleanup post fetch
      const r = this.getPendingWritesCount(storeOpts);
      if (r) {
        this.cleanupPostFetch(fetchOpts);
      }
      return r;
    },

    onDeleteStarting(id) {
      id = _normalizeId(id);
      const existing = this.state.itemContainers.get(id);
      if (existing) {
        this.state.itemContainersPendingDelete = this.state.itemContainersPendingDelete.set(
          id,
          existing
        );
      }
      this.state.itemContainers = this.state.itemContainers.delete(_normalizeId(id));
      this.hasChanged();
    },

    onDelete(id) {
      id = _normalizeId(id);
      this.state.itemContainers = this.state.itemContainers.delete(_normalizeId(id));
      this.state.itemContainersPendingDelete = this.state.itemContainersPendingDelete.delete(_normalizeId(id));
      this.hasChanged();
      this.clearRecentFetches();
    },

    onDeleteFailed(id) {
      id = _normalizeId(id);
      this.state.itemContainers = this.state.itemContainers.set(
        id,
        this.state.itemContainersPendingDelete.get(id)
      );
      this.state.itemContainersPendingDelete = this.state.itemContainersPendingDelete.delete(id);
      this.hasChanged();
    },

    onDoDetailActionStarting(id, action, payload) {
      id = _normalizeId(id);
      const existing = this.state.itemContainers.get(id);
      if (existing) {
        this.state.itemContainersPendingDoDetailAction = this.state.itemContainersPendingDoDetailAction.set(
          id,
          existing
        );
      }
      this.hasChanged();
    },

    onDoDetailAction(id, body, headers, opts = {}) {
      // TODO - There is some duplication of logic here
      id = _normalizeId(id);
      const fetchOpts = Im.Map(opts.query);
      this.state.itemContainersPendingDoDetailAction = this.state.itemContainersPendingDoDetailAction.delete(id);
      this.onRetrieved(id, body, headers, fetchOpts);
      this.setLastWriteNow();
      this.clearRecentFetches();
      this.hasChanged();
    },

    onDoListAction(entities, headers) {
      if (!_.isArray(entities)) entities = [entities];
      entities.forEach((entity) => {
        if (!entity || !entity.id) return;
        this.onCreate(entity, headers);
      });
      this.setLastWriteNow();
      this.hasChanged();
      this.clearRecentFetches();
    },

    onDoDetailActionFailed(id, action, payload) {
      id = _normalizeId(id);
      this.state.itemContainersPendingDoDetailAction = this.state.itemContainersPendingDoDetailAction.delete(id);
      this.hasChanged();
    },

    onCreateStarting(entity, headers) {
      // TODO - Optimistic updates
    },

    onCreate(entity, headers, origData, createOpts = {}) {
      createOpts = Im.Map(createOpts);
      const asFetchOpts = Im.Map(createOpts.get('query'));
      this.setLastWriteNow();
      const id = _normalizeId(entity.id);
      this.onRetrieved(id, entity, headers, asFetchOpts);
      // Need to clear fetches before calling has changed...otherwise
      // fetches will not get remade when they need to be.
      // This can optionally be disabled on a create by create basis.
      if (!createOpts.get('disableClearRecentFetches')) this.clearRecentFetches();
      this.hasChanged();
    },

    onUpdateStarting(id, data, updateOpts = { updateOptimistically: true }) {
      id = _normalizeId(id);
      const curItemContainer = this.state.itemContainers.get(id);
      if (curItemContainer && updateOpts.updateOptimistically) {
        this.state.itemContainersPendingUpdate = this.state.itemContainersPendingUpdate.set(
          id,
          curItemContainer
        );
        curItemContainer.updateVersions(data);
        this.hasChanged();
      }
    },

    onUpdate(id, entity, headers, updateOpts = { clearMatchesFilters: true }) {
      id = _normalizeId(id);
      updateOpts = Im.Map(updateOpts);
      this.state.itemContainersPendingUpdate = this.state.itemContainersPendingUpdate.delete(id);
      this.setLastWriteNow();
      entity = this.fullParse(entity);

      let itemContainer = this._getItemContainerForID(id);
      const asFetchOpts = Im.Map(updateOpts.get('query'));
      itemContainer.addVersion(entity, asFetchOpts);
      this.state.itemContainers = this.state.itemContainers.set(entity.get('id'), itemContainer);

      // This option can be used by components to prevent
      // the `__matchesFilters` value from being cleared and
      // having the page update unnecessarily.
      if (updateOpts.get('clearMatchesFilters')) {
        // We cannot be sure what filters this item still
        // matches, so just clear `__matchesFilters` val and
        // let it be updated on next fetch.
        itemContainer = this.state.itemContainers.get(id);
        if (itemContainer) itemContainer.clearMatchesFilters();
      }

      this.clearRecentFetches();
      // Trigger this no matter what.
      // It sometimes will not be triggered due
      // to optimistic updating by onUpdateStarting.
      this.hasChanged();
    },

    onUpdateFailed(id) {
      id = _normalizeId(id);
      console.warn('Updaing entity failed, ID was', id);
      const pending = this.state.itemContainersPendingUpdate.get(id);
      if (pending) {
        pending.rollbackMostRecentUpdate();
        this.state.itemContainers = this.state.itemContainers.set(id, pending);
      }
      this.state.itemContainersPendingUpdate = this.state.itemContainersPendingUpdate.delete(id);
      this.hasChanged();
    },

    onClearRecentFetches() {
      this.clearRecentFetches();
      this.hasChanged();
    },

    onClearRecentFetchesForQuery(query) {
      this._clearFromRecentFetchesNextTick(this.getFetchId(Im.fromJS(query)));
      this.hasChanged();
    },

    onResetLocalData() {
      // Do not reset local data if there are pending operations...
      // otherwise views can end up in a situation where they load indefinitely.
      // TODO - Should probably have some way of waiting until pending ops have
      // finished, then should reset state.
      if (this.getPendingOperationsCount() > 0) {
        console.warn(`Request was made to reset data for the ${id} store, but there are pending operations so request was ignored.`);
        return;
      }
      this.resetState();
      this.hasChanged();
    },

    setLastWriteNow() {
      this.state.lastWriteDateTime = moment();
    },

    setMatchesFilter(entity, filterSpecifier, val) {
      // Can be used to indicate that a given `entity` matches or does not
      // match a given `filterSpecifier`.
      filterSpecifier = Im.Map(filterSpecifier);
      const existing = this.state.itemContainers.get(entity.get('id'));
      if (existing) {
        // Indicate that entity does or does not match filter
        existing.updateMatchesFilter(filterSpecifier, val);
      }
      // Need to clearRecentFetches as state of local data should be updated
      this.clearRecentFetches();
    },

    resetState() {
      // Only overwrite state which is in default state
      // instead of calling this.state.replaceState(this.getInitialState()).
      // This is so that if getInitialState is overridden, the extra state isn't
      // cleared by default.
      const newState = getDefaultState();
      _.extend(this.state, newState);
    },

    onRouteChange() {
      // By clearing recent fetches instead of resetting state,
      // previously fetched data will be cached and re-used across pages.
      // The data will still be refetched though because recent fetches are cleared,
      // so cached data should still be updated on page load if it is stale.
      this.clearRecentFetches();
    },

    //
    // Data access
    //

    getFetchId(opts) {
      opts = opts || Im.Map();
      opts = opts.toObject();
      return `${entityName}:${JSON.stringify(opts)}`;
    },

    getPendingWritesCount(opts) {
      opts = opts || Im.Map();
      let pendingCount =
        this.state.itemContainersPendingDelete.count() +
        this.state.itemContainersPendingDoDetailAction.count() +
        this.state.itemContainersPendingUpdate.count();
      // dependantOn option is a store or list of other stores to include when counting
      // pending writes. This prevents reads being made while dependant stores are being written to.
      if (opts.get('dependantOn')) {
        const asArray =
          opts.get('dependantOn').forEach === undefined
            ? [opts.get('dependantOn')]
            : opts.get('dependantOn');
        asArray.forEach((s) => {
          pendingCount += s.getPendingWritesCount();
        });
      }
      return pendingCount;
    },

    getPendingOperationsCount(opts) {
      opts = opts || Im.Map();
      return this.getPendingWritesCount(opts) + this.state.pendingFetches.count();
    },

    _itemHasRequiredFields(item, fields) {
      if (!fields) return true;
      let hasFields = true;
      if (!item.get('__hasFields')) return false;
      const itemFields = Im.List(item.get('__hasFields') || []);
      const requestedFields = Im.List(fields);
      hasFields = Im.is(itemFields, requestedFields);
      return hasFields;
    },

    clearRecentFetches() {
      // Can be called to ensure data is refetched in future.
      // Should be run any time store data is mutated.
      this.state.recentFetches = Im.Map();
      // Note sure if this is a good idea or not...will mean previously failed requests
      // are retriggered by Marty. Usually they are not due to the `cacheErrors` option.
      this.__failedFetches = {};
    },

    _clearFromRecentFetchesNextTick(fetchId) {
      _.defer(() => {
        this.state.recentFetches = this.state.recentFetches.delete(fetchId);
        this.hasChanged();
      });
    },

    _clearPendingFetchStateNextTick(fetchId) {
      // Update recent fetches to handle instance where no data was returned from server.
      // If recent fetches not updated here, then 404 will be raised unnecessarily.
      this.state.recentFetches = this.state.recentFetches.set(fetchId, moment());
      _.defer(() => {
        this.state.pendingFetches = this.state.pendingFetches.delete(fetchId);
      });
    },

    cleanupPostFetch(fetchId) {
      if (_.isObject(fetchId)) fetchId = this.getFetchId(fetchId);
      // Basically an alias for this _clearPendingFetchStateNextTick.
      // Indended to be used by method overrides.
      this._clearPendingFetchStateNextTick(fetchId);
    },

    filterAccordingToQuery(itemContainers, query) {
      // Uses simple filtering mechanism for now which checks most recent filters
      // which have matched a given item. If that filter matches the current one,
      // then item is included in the returned set.
      const filterId = getFilterId(query);
      const self = this;
      itemContainers = itemContainers.filter(itemContainer =>
        itemContainer.doesMatchFilterId(filterId));
      // Make sure itemContainers which are being deleted are not displayed
      itemContainers = itemContainers.filter(itemContainer => !self.state.itemContainersPendingDelete.get(itemContainer.getId()));
      return itemContainers;
    },

    sortAccordingToQuery(items, query) {
      // Allows sorting on multiple fields but seems to be not stable
      // Especially if sorting with a boolean field

      const orderingSpecifier = query.get(ORDERING);

      if (!orderingSpecifier) {
        return items;
      }

      const orderingFields = orderingSpecifier.split(',');

      let sorted = items.toSeq();

      sorted = sorted.sort((item1, item2) => {
        let rVal = null;
        orderingFields.forEach((field) => {
          // If `rVal` is already set, then these items
          // were sorted already by a previous field.
          if (rVal !== null) {
            return;
          }
          const reverse = field.charAt(0) === REVERSE_SORT_SPECIFIER;
          field = field.replace(REVERSE_SORT_SPECIFIER, '');
          // Get field value from the item and use to sort
          const parts = field.split(RELATIONAL_DIVIDER);
          const item1Val = getItemRelatedVal(item1, parts);
          const item2Val = getItemRelatedVal(item2, parts);

          // Postgres doesn't sort by these, so the frontend shouldn't either.
          let item1ValClean = item1Val;
          let item2ValClean = item2Val;
          if (item1Val && typeof item1Val === 'string') {
            item1ValClean = item1Val
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
              .trim()
              .toLowerCase();
          }
          if (item2Val && typeof item1Val === 'string') {
            item2ValClean = item2Val
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
              .trim()
              .toLowerCase();
          }

          if (item1ValClean < item2ValClean) {
            rVal = -1;
          } else if (item1ValClean > item2ValClean) {
            rVal = 1;
          }
          // Make sure to reverse if necessary
          if (rVal && reverse) {
            rVal = -rVal;
          }
        });
        // If rVal not defined by now, then presumably the
        // two items are equal, so return 0.
        return rVal || 0;
      });

      // Make sure to return a list, as that is what
      // is expected by many components
      return sorted.toList();
    },

    getItemContainersMatchingFilter(filterOpts) {
      if (!(filterOpts instanceof Im.Map)) {
        filterOpts = Im.Map(filterOpts);
      }
      return this.filterAccordingToQuery(this.state.itemContainers, filterOpts);
    },

    getItemVersionsForFields(itemContainers, fetchOpts) {
      return itemContainers.map(ic => ic.getVersion(fetchOpts)).filter(item => Boolean(item));
    },

    getManyLocally(opts) {
      let itemContainers = this.getItemContainersMatchingFilter(opts);
      itemContainers = itemContainers.toList();
      let items = this.getItemVersionsForFields(itemContainers, opts);
      items = this.sortAccordingToQuery(items, opts);
      const fetchId = this.getFetchId(opts);
      // Take into account limit and offset when returning data. This actually helps
      // with pagination and keeping local data in sync with serverside data.
      const limit = opts.get('limit') || 0;
      const offset = opts.get('offset') || 0;
      const max = limit + offset;
      if (items.count() > 0) {
        if (max > 0) {
          return items.slice(0, max);
        }
        return items;
      }
      return undefined;
    },

    getLocalItemContainer(id) {
      return this.state.itemContainers.get(id);
    },

    getLocalItemContainerByURL(url) {
      return this.state.itemContainers.find(item => item.get('url') === url);
    },

    getManyRemotely(opts, storeOpts) {
      const fetchId = this.getFetchId(opts);
      const self = this;
      this.state.pendingFetches = this.state.pendingFetches.set(fetchId, true);
      return queries.getMany(opts, storeOpts).then(() => {
        self.state.queuedFetches = self.state.queuedFetches.delete(fetchId);
        // Execute next fetch in queue if there is one.
        if (self.state.queuedFetches.count() > 0) self._executeNextFetchInQueue(fetchId, storeOpts);
      });
    },

    _queueGetManyRemotely(opts) {
      // Allows fetches to be queued
      this.state.queuedFetches = this.state.queuedFetches.set(this.getFetchId(opts), opts);
    },

    _executeNextFetchInQueue(prevFetchId, storeOpts) {
      // If there is a new fetch in the queue, execute that.
      // getManyRemotely will then call this function again when it is done.
      if (this.state.queuedFetches.count() > 0) {
        if (!this.getPendingOperationsCount()) {
          const fetchId = this.state.queuedFetches
            .toSeq()
            .keySeq()
            .first();
          const first = this.state.queuedFetches.get(fetchId);
          if (fetchId === prevFetchId) {
            this.state.queuedFetches = this.state.queuedFetches.delete(first);
            return this._executeNextFetchInQueue(prevFetchId);
          }
          this.state.queuedFetchRetries = 0;
          this.getManyRemotely(first, storeOpts);
        } else {
          this.state.queuedFetchRetries += 1;
          // Prevent infinite retries using `MAX_QUEUED_FETCH_RETRIES` var.
          if (this.state.queuedFetchRetries < MAX_QUEUED_FETCH_RETRIES) {
            _.defer(this._executeNextFetchInQueue.bind(this), prevFetchId, storeOpts);
          } else {
            this.state.queuedFetchRetries = 0;
            console.warn('Failed to execute a queued fetch');
          }
        }
      }
    },

    _getFetchedRecentlyForRead(fetchId, storeOpts) {
      let fetchedRecently = this.state.recentFetches.get(fetchId);
      const dependantStores = storeOpts.get('dependantOn');
      if (dependantStores) {
        const asArray = dependantStores.forEach === undefined ? [dependantStores] : dependantStores;
        let lastWrite;
        asArray.forEach((store) => {
          const curStoreWrite = store.getLastWriteDateTime();
          if (curStoreWrite) {
            if (!lastWrite || curStoreWrite.isAfter(lastWrite)) {
              lastWrite = curStoreWrite;
            }
          }
        });
        if (fetchedRecently && lastWrite && fetchedRecently.isBefore(lastWrite)) {
          fetchedRecently = false;
        }
      }
      return Boolean(fetchedRecently);
    },

    addRequiredFields(fields) {
      if (!_.includes(fields, ALL_FIELDS[0])) {
        REQUIRED_FIELDS.forEach((requiredField) => {
          if (!_.includes(fields, requiredField)) {
            fields.push(requiredField);
          }
        });
      }
      return fields;
    },

    checkFetchOpts(opts) {
      if (!opts.fields) {
        console.warn(`All fetches should include a 'fields' value for performance reasons. Please update fetch to ${id}.`);
      }
    },

    getItems(fetchOpts = {}, storeOpts) {
      /*
        `fetchOpts` are passed to the server. `storeOpts` can be used to
        manipulate how the fetch is performed (e.g. whether to wait for
        other stores to fetch or perform writes remotely before executing).
      */
      this.checkFetchOpts(fetchOpts);
      if (this.defaultFetchOpts) fetchOpts = _.extend({}, this.defaultFetchOpts, fetchOpts);
      // Check `isArray` in case caller passed in * for fields value.
      if (fetchOpts.fields && _.isArray(fetchOpts.fields)) {
        fetchOpts.fields = this.addRequiredFields(fetchOpts.fields);
      }
      fetchOpts = Im.Map(fetchOpts);
      storeOpts = Im.Map(storeOpts);
      // This func should not be used for retrieving single itemContainers
      if (fetchOpts.get('id')) fetchOpts = fetchOpts.delete('id');
      const fetchId = this.getFetchId(fetchOpts);
      let fetchedRemotely = false;
      const fetch = this.fetch({
        id: fetchId,
        locally() {
          let data = this.getManyLocally(fetchOpts);
          if (data) {
            // This purpose of this block is to decide whether, even though data was returned,
            // we should still trigger another fetch to update the data stored locally.
            const limit = fetchOpts.get('limit') || 0;
            const offset = fetchOpts.get('offset') || 0;
            const requiredLength = offset + limit;
            const lessThanRequiredLength = data.count() < requiredLength;
            // Check recent fetches to prevent excessive remote API calls.
            // NOTE - Check against recentFetches can be removed, but it will result in excessive
            // API calls being made (which shouldn't affect the user experience). Downside is that data
            // won't always be refreshed automatically.
            const fetchedRecently = this._getFetchedRecentlyForRead(fetchId, storeOpts);
            const needsRefresh = (!fetchedRemotely || lessThanRequiredLength) && !fetchedRecently;
            if (needsRefresh) {
              fetchedRemotely = true;
              if (!this.getPendingOperationsCount(storeOpts)) {
                this.getManyRemotely(fetchOpts, storeOpts);
              } else if (
                !this.state.pendingFetches.get(fetchId) &&
                !this.getPendingWritesCount(storeOpts)
              ) {
                // Queue fetch only if same fetch is not already being made and there are no pending writes
                this._queueGetManyRemotely(fetchOpts, storeOpts);
              }
            }
          } else {
            // No data available but this fetch was made recently, therefore
            // return empty list.
            if (this.state.recentFetches.get(fetchId)) {
              data = Im.List();
            } else {
              // No data returned and fetch not made recently.
              // Returning undefined should make marty trigger remote fetch.
              data = undefined;
            }
          }
          return data;
        },

        remotely() {
          fetchedRemotely = true;
          const promise = this.getManyRemotely(fetchOpts, storeOpts);
          return promise;
        },

        cacheError: true
      });
      return fetch;
    },

    getOneLocally(id, opts) {
      id = _normalizeId(id);
      const container = this.state.itemContainers.get(id);
      if (container) {
        return container.getVersion(opts);
      }
      return undefined;
    },

    getOneRemotely(id, opts, storeOpts) {
      const fetchId = this.getFetchId(opts);
      const self = this;
      this.state.pendingFetches = this.state.pendingFetches.set(fetchId, true);
      return queries.getOne(id, opts, storeOpts);
    },

    getItem(id, opts = {}, storeOpts) {
      if (!id) throw new Error('No `id` passed to `getItem`');
      this.checkFetchOpts(opts);
      if (this.defaultFetchOpts) opts = _.extend({}, this.defaultFetchOpts, opts);
      if (opts.fields) opts.fields = this.addRequiredFields(opts.fields);
      opts = Im.Map(_.extend(opts || {}, { id }));
      storeOpts = Im.Map(storeOpts);
      const fetchId = this.getFetchId(opts);
      let fetchedRemotely = false;
      const fetch = this.fetch({
        id: fetchId,
        locally() {
          let data = this.getOneLocally(id, opts);
          if (data) {
            // Check recent fetches to prevent excessive remote API calls.
            const fetchedRecently = this._getFetchedRecentlyForRead(fetchId, storeOpts);
            // We differ here in how we determine whether to perform another check compared to
            // `getMany`. Only pending writes are used, not pending fetches. This is because
            // `getItem` fetches cannot currently be queued. If `getItem` fetches could be queued,
            // then we should move to using the `getPendingOperationsCount` instead, and queue if
            // there are any pending operations.
            const needsRefresh =
              !fetchedRemotely &&
              !this.getPendingWritesCount(storeOpts) &&
              !fetchedRecently &&
              !this.state.pendingFetches.get(fetchId);
            if (needsRefresh) {
              fetchedRemotely = true;
              this.getOneRemotely(id, opts, storeOpts);
            }
          } else {
            // Data should always be undefined if entity not available locally.
            // If fetch is made to the server for entity, and nothing comes back, then
            // 404 should be raised (which is what will happen if undefined is returned twice
            // to marty). This differs from getItemContainers, where an empty list is returned on second
            // check.
            data = undefined;
          }
          return data;
        },
        remotely() {
          fetchedRemotely = true;
          return this.getOneRemotely(id, opts, storeOpts);
        },
        cacheError: storeOpts.get('cacheError', true)
      });
      return fetch;
    },

    getKnownCountForQuery(query) {
      query = Im.Map(query);
      return this.state.knownCounts.get(getFilterId(query));
    },

    getLastWriteDateTime() {
      return this.state.lastWriteDateTime;
    },

    fetchIsPending(query) {
      const fetchId = this.getFetchId(Im.Map(query));
      return (
        Boolean(this.state.pendingFetches.get(fetchId)) ||
        Boolean(this.state.queuedFetches.get(fetchId))
      );
    },

    updateLocalFilterResults(filter, newValSet, getAttrFunc) {
      /*
        This method should only be used by stores or extensions of stores.
      */
      if (newValSet === undefined) return;
      const itemContainersMatchingFilter = this.getItemContainersMatchingFilter(filter);
      itemContainersMatchingFilter.forEach((itemContainer) => {
        const item = itemContainer.getAnyVersion();
        const val = getAttrFunc(item);
        const inNewValSet = _.includes(newValSet, val);
        this.setMatchesFilter(item, filter, inNewValSet);
      });
      this.hasChanged();
    },

    clearMatchesFilterForAllItems() {
      /*
        This method should only be used by stores or extensions of stores.
        Is useful when there is a dependency between one entity being changed
        and whether or not another item matches a specific filter.
      */
      this.state.itemContainers.forEach((ic) => {
        ic.clearMatchesFilters();
      });
      this.hasChanged();
    },

    clearMatchesFilterForItem(id) {
      const ic = this._getItemContainerForID(id);
      if (ic) {
        ic.clearMatchesFilters();
      }
      this.hasChanged();
    },

    isPendingUpdates(item) {
      const id = item.get('id');
      return (
        Boolean(this.state.itemContainersPendingDoDetailAction.get(id)) ||
        Boolean(this.state.itemContainersPendingUpdate.get(id)) ||
        Boolean(this.state.itemContainersPendingDelete.get(id))
      );
    },

    getURLForItemWithID(itemID) {
      // if (API_BASE_URL.indexOf('http') > -1) {
      //   return `${API_BASE_URL}${endpoint}/${itemID}/`;
      // }
      // return `${window.location.protocol}//${window.location.host}${API_BASE_URL}${endpoint}/${itemID}/`;

      const base = getAPIBaseURL();
      if (base.indexOf('http') > -1) {
        return `${base}${endpoint}/${itemID}/`;
      }
      return `${window.location.protocol}//${window.location.host}${base}${endpoint}/${itemID}/`;
    },

    getLocalItemCount() {
      return this.state.itemContainers.count();
    }
  });

  app.register(id, storeClass);
  const store = app[id];

  attachExtendMethod(store);

  const origHasChanged = store.hasChanged;
  store.hasChanged = function () {
    // When fetch method is used on a store, hasChanged is
    // called automatically by Marty. If an error is raised
    // by hasChanged (usually because of issue in render method
    // of components listening to store) then a cryptic error message
    // is displayed in the console. Have overriden hasChanged to ensure that
    // more helpful error message is logged and sent to Sentry via Raven.
    try {
      return origHasChanged.apply(this, arguments);
    } catch (err) {
      const msg = `Error thrown when calling hasChanged for ${store.id}`;
      console.log(msg);
      // Pass error to sentry
      Raven.captureException(err, {
        extra: {
          details: msg
        }
      });
      // Log the stack so that error is properly source mapped
      console.error(err.stack || err);
      throw err;
    }
  };

  // TODO - Need history to be configurable
  history.listen(store.onRouteChange.bind(store));

  return store;
}
