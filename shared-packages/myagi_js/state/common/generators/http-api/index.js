import {
  getApplication,
  getMarty,
  getAPIBaseURL,
  getWriteAuthHeader,
  getReadAuthHeader
} from 'core/state-configuration';

const app = getApplication();
const Marty = getMarty();

import React from 'react';
import PropTypes from 'prop-types';
import Im from 'immutable';
import querystring from 'querystring';
import { attachExtendMethod } from 'utilities/classes';
import _ from 'lodash';
import Raven from 'raven-js';
import moment from 'moment';

import { assert } from 'utilities/assert';

import { getClassId } from './common';

import { createStore } from './create-store';

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_CREATED = 201;
const HTTP_ACCEPTED = 202;
const ID = 'id';

function getActionCreatorConstantStrings(entityName) {
  return [
    `CREATE_${entityName}`,
    `UPDATE_${entityName}`,
    `DELETE_${entityName}`,
    // Local data updates
    `CLEAR_RECENT_FETCHES_FOR_${entityName}`,
    `CLEAR_RECENT_FETCHES_FOR_QUERY_${entityName}`,
    `RESET_LOCAL_DATA_FOR_${entityName}`,
    // For use by Query class and Action creators
    // TODO - Change RETRIEVED to RECEIVE?
    `RETRIEVED_${entityName}`,
    `RETRIEVED_MANY_${entityName}`,
    `DO_DETAIL_ACTION_${entityName}`,
    `DO_LIST_ACTION_${entityName}`
  ];
}

function createConstants(entityName) {
  const constants = getActionCreatorConstantStrings(entityName);
  return Marty.createConstants(constants);
}

function createActionCreators(entityName, endpoint, constants, source) {
  const id = getClassId(entityName, 'ActionCreators');
  const actionCreatorClass = Marty.createActionCreators({
    id,
    clearRecentFetches() {
      this.dispatch(constants[`CLEAR_RECENT_FETCHES_FOR_${entityName}`]);
    },
    clearRecentFetchesForQuery(query) {
      this.dispatch(constants[`CLEAR_RECENT_FETCHES_FOR_QUERY_${entityName}`], query);
    },
    resetLocalData() {
      this.dispatch(constants[`RESET_LOCAL_DATA_FOR_${entityName}`]);
    },
    _resToError(res) {
      const err = new Error(`Request failed with status ${res.status}. Response was: ${JSON.stringify(res.body)}`);
      err.response = res;
      return err;
    },
    _standardResHandler(action, expectedStatuses, res, returnPayload) {
      if (_.includes(expectedStatuses, res.status)) {
        this.dispatch.apply(this, [constants[`${action}_${entityName}`]].concat(returnPayload));
      } else {
        throw this._resToError(res);
      }
      return res;
    },
    _standardCatch(action, err, returnPayload) {
      const msg = 'Error in Action Creator:';
      this.dispatch.apply(
        this,
        [constants[`${action}_${entityName}_FAILED`]].concat(returnPayload)
      );
      throw err;
    },
    delete(id) {
      this.dispatch(constants[`DELETE_${entityName}_STARTING`], id);
      return source
        .makeDeleteRequest(id)
        .then(res =>
          this._standardResHandler('DELETE', [HTTP_NO_CONTENT], res, [id, res.body, res.headers]))
        .catch((err) => {
          this._standardCatch('DELETE', err, [id, err]);
        });
    },
    create(data, opts) {
      data = Im.Map(data);

      // Validate fields query param to prevent
      // serverside errors
      if (opts && opts.query && opts.query.fields && !_.includes(opts.query.fields, '*')) {
        // Only take top level fields
        const fields = opts.query.fields.map(f => f.split('.')[0]);
        _.each(data.toJS(), (v, k) => {
          if (!_.includes(fields, k)) {
            throw Error(`You are setting the value of '${k}' but not requesting it in query.fields. This is likely to cause serverside errors.`);
          }
        });
        // Make sure ID is always requested, otherwise there will be store level errors.
        if (!_.includes(opts.query.fields, ID)) {
          opts.query.fields.push(ID);
        }
      }

      this.dispatch(constants[`CREATE_${entityName}_STARTING`], data, opts);
      return source
        .makePostRequest(data, opts)
        .then(res =>
          this._standardResHandler('CREATE', [HTTP_CREATED, HTTP_OK], res, [
            res.body,
            res.headers,
            data,
            opts
          ]))
        .catch((err) => {
          this._standardCatch('CREATE', err, [data, err]);
        });
    },
    doDetailAction(id, action, payload, opts) {
      payload = Im.Map(payload);
      this.dispatch(
        constants[`DO_DETAIL_ACTION_${entityName}_STARTING`],
        id,
        action,
        payload,
        opts
      );
      return source
        .makeDetailActionPostRequest(id, action, payload, opts)
        .then(res =>
          this._standardResHandler('DO_DETAIL_ACTION', [HTTP_OK], res, [
            id,
            res.body,
            res.headers,
            opts,
            action
          ]))
        .catch((err) => {
          this._standardCatch('DO_DETAIL_ACTION', err, [id, action, err, opts]);
        });
    },
    doListAction(action, payload, opts) {
      payload = Im.Map(payload);
      this.dispatch(constants[`DO_LIST_ACTION_${entityName}_STARTING`], action);
      return source
        .makeListActionPostRequest(action, payload, opts)
        .then(res =>
          this._standardResHandler('DO_LIST_ACTION', [HTTP_OK, HTTP_CREATED], res, [
            res.body,
            res.headers,
            opts,
            action,
            payload
          ]))
        .catch((err, res) => {
          this._standardCatch('DO_LIST_ACTION', err, [action, err]);
        });
    },
    update(idOrEntity, entity, opts) {
      let id;
      if (entity === undefined) {
        entity = idOrEntity;
      } else {
        id = idOrEntity;
      }
      entity = Im.Map(entity);
      if (!id) {
        id = entity.get('id');
      }
      assert(id !== undefined, 'No ID could be determined for update');
      const data = entity;
      this.dispatch(constants[`UPDATE_${entityName}_STARTING`], id, entity, opts);
      return source
        .makePatchRequest(id, data, opts)
        .then(res =>
          this._standardResHandler('UPDATE', [HTTP_OK], res, [id, res.body, res.headers, opts]))
        .catch((err) => {
          this._standardCatch('UPDATE', err, [id, data, err]);
        });
    },
    createOrUpdate(existingEntityOrData, data) {
      /*
        If both args are specified, then first arg is assumed to be an existing entity
        which should be updated with the data contained in the second argument. In that case
        if the first arg is undefined, then it is assumed to not exist yet, therefore create is
        used.

        Otherwise, if only one arg is specified, then it is assumed to represent data for
        the new or existing entity (will be considered existing if entity has an id).
      */
      let entity = existingEntityOrData;
      if (data) entity = existingEntityOrData || data;
      else data = existingEntityOrData;
      let actionCreator = this.create.bind(this);
      const id = entity.get ? entity.get('id') : entity.id;
      if (id) {
        actionCreator = _.bind(this.update, this, id);
      }
      return actionCreator(data);
    }
  });

  app.register(id, actionCreatorClass);
  return app[id];
}

function createHttpAPIStateSource(entityName, endpoint, sourceActionCreators) {
  // Somehow the value of endpoint gets set to undefined when
  // methods are run, so maintain value here.
  const relEndpoint = endpoint;
  const baseURL = getAPIBaseURL();
  const id = getClassId(entityName, 'API');
  const apiClass = Marty.createStateSource({
    id,
    type: 'http',
    baseUrl: baseURL,
    _parseQueryOpt(key, val) {
      /*
        Convert queries into django compatible values
      */
      if (Array.isArray(val)) {
        return val.join(',');
      }
      if (val === true) {
        return 'True';
      }
      if (val === false) {
        return 'False';
      }
      return val;
    },
    _getFullUrlForGet(baseUrl, query) {
      query = query.toObject();
      if (query.id) {
        baseUrl = `${baseUrl}/${query.id}`;
        delete query.id;
      }
      const qs = this._queryToQueryString(query);
      return `${baseUrl}/${qs}`;
    },
    _queryToQueryString(query) {
      if (!query) return '';
      const parsedQuery = {};
      // Convert array into comma separated list.
      Object.keys(query).forEach((key) => {
        let val = query[key];
        val = this._parseQueryOpt(key, val);
        parsedQuery[key] = val;
      });
      return `?${querystring.stringify(parsedQuery)}`;
    },
    _getStandardWriteHeaders() {
      return _.extend(
        {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        getWriteAuthHeader()
      );
    },
    _getStandardReadHeaders() {
      return _.extend(
        {
          Accept: 'application/json'
        },
        getReadAuthHeader()
      );
    },

    // Need verbose method names so as not to conflict with builtin
    // get, post, put, patch, delete methods.
    makeGetRequest(opts) {
      const url = this._getFullUrlForGet(relEndpoint, opts);
      return this.get({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders()
      });
    },
    makeDeleteRequest(id) {
      const url = `${relEndpoint}/${id}/`;
      return this.delete({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders()
      });
    },
    makePostRequest(data, opts = {}) {
      const qs = this._queryToQueryString(opts.query);
      const url = `${relEndpoint}/${qs}`;
      return this.post({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders(),
        body: JSON.stringify(data.toJSON())
      });
    },
    makePatchRequest(id, data, opts = {}) {
      const qs = this._queryToQueryString(opts.query);
      const url = `${relEndpoint}/${id}/${qs}`;
      return this.patch({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders(),
        body: JSON.stringify(data.toJSON())
      });
    },
    makeDetailActionPostRequest(id, route, payload, opts = {}) {
      const qs = this._queryToQueryString(opts.query);
      const url = `${relEndpoint}/${id}/${route}/${qs}`;
      return this.post({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders(),
        body: JSON.stringify(payload.toJSON())
      });
    },
    makeListActionPostRequest(route, data, opts = {}) {
      const qs = this._queryToQueryString(opts.query);
      const url = `${relEndpoint}/${route}/${qs}`;
      return this.post({
        url,
        credentials: 'include',
        headers: this._getStandardWriteHeaders(),
        body: JSON.stringify(data.toJSON())
      });
    }
  });
  app.register(id, apiClass);
  return app[id];
}

function createQueries(entityName, source, constants) {
  // TODO - This is some duplication between this and the default state source class
  const id = getClassId(entityName, 'Queries');
  const qClass = Marty.createQueries({
    id,
    getOne(id, opts, storeOpts) {
      this.dispatch(constants[`RETRIEVED_${entityName}_STARTING`], id);
      return source
        .makeGetRequest(Im.Map(_.extend(opts, { id })))
        .then((res) => {
          if (res.status === HTTP_OK) {
            this.dispatch(
              constants[`RETRIEVED_${entityName}`],
              id,
              res.body,
              res.headers,
              opts,
              storeOpts
            );
          } else {
            this.dispatch(constants[`RETRIEVED_${entityName}_FAILED`], id);
          }
        })
        .catch((err) => {
          this.dispatch(constants[`RETRIEVED_${entityName}_FAILED`], id, err);
          console.error(err);
          throw err;
        });
    },
    getMany(opts, storeOpts) {
      this.dispatch(constants[`RETRIEVED_MANY_${entityName}_STARTING`], opts);
      return source
        .makeGetRequest(opts)
        .then((res) => {
          if (res.status === HTTP_OK) {
            this.dispatch(
              constants[`RETRIEVED_MANY_${entityName}`],
              res.body,
              res.headers,
              opts,
              storeOpts
            );
          } else {
            this.dispatch(constants[`RETRIEVED_MANY_${entityName}_FAILED`], opts);
          }
        })
        .catch((err) => {
          this.dispatch(constants[`RETRIEVED_MANY_${entityName}_FAILED`], opts, err);
          console.log(err);
          throw err;
        });
    }
  });
  app.register(id, qClass);
  return app[id];
}

const allStateObjs = [];
export function stateDefaultsGenerator(opts) {
  const entityName = opts.entity.toUpperCase();
  const endpoint = opts.endpoint;
  const constants = createConstants(entityName);
  const source = createHttpAPIStateSource(entityName, endpoint);
  const actionCreators = createActionCreators(entityName, endpoint, constants, source);
  const queries = createQueries(entityName, source, constants);
  const store = createStore(
    entityName,
    constants,
    queries,
    endpoint,
    opts.makeEntitiesFullyImmutable
  );
  const stateObj = {
    Constants: constants,
    ActionCreators: actionCreators,
    Store: store,
    Types: {
      one: PropTypes.instanceOf(Im.Map),
      many: PropTypes.instanceOf(Im.List)
    }
  };
  allStateObjs.push(stateObj);
  return stateObj;
}

export function getAll() {
  return [].concat(allStateObjs);
}
