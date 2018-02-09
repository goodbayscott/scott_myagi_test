'use strict';

import { getApplication, getHistory, getMarty, getAPIBaseURL } from 'core/state-configuration';

const app = getApplication();
const history = getHistory();
const Marty = getMarty();

const Im = require('immutable');
const querystring = require('querystring');

import { attachExtendMethod } from 'utilities/classes';

const { browserHistory } = require('react-router');
const Baby = require('babyparse');

const _ = require('lodash');

import { assert } from 'utilities/assert';

const HTTP_OK = 200;
const LIST_ROUTE = 'list_route';
const TO_PIVOT = 'to_pivot_table';
const TO_TIMESERIES = 'to_timeseries';

function getClassId(entityName, classType) {
  return `${_.capitalize(entityName.toLowerCase())}${classType}`;
}

function getActionCreatorConstantStrings(entityName) {
  return [`RETRIEVED_${entityName}_DATAFRAME`];
}

function createConstants(entityName) {
  const constants = getActionCreatorConstantStrings(entityName);
  return Marty.createConstants(constants);
}

function createHttpAPIStateSource(entityName, endpoint, sourceActionCreators) {
  /*
    TODO - There is a lot of duplication between this and what is in http-api.js
  */

  // Somehow the value of endpoint gets set to undefined when
  // methods are run, so maintain value here.
  const relEndpoint = endpoint;
  const baseURL = getAPIBaseURL();
  const id = getClassId(entityName, 'DataframeAPI');
  const apiClass = Marty.createStateSource({
    id,
    type: 'http',
    baseUrl: baseURL,
    _getFullUrl(baseUrl, query) {
      query = query.toObject();
      let list_route = query.list_route || '';
      if (list_route) {
        delete query.list_route;
        list_route += '/';
      }
      const parsedQuery = {};
      // Convert array into comma separated list.
      Object.keys(query).forEach((key) => {
        let val = query[key];
        if (Array.isArray(val)) {
          val = val.join(',');
        }
        parsedQuery[key] = val;
      });
      const qs = querystring.stringify(parsedQuery);
      const url = `${baseUrl}/${list_route}?${qs}`;
      return url;
    },
    makeGetRequest(opts) {
      const url = this._getFullUrl(relEndpoint, opts);
      return this.get({
        url,
        credentials: 'include',
        headers: {
          Accept: 'text/csv'
        }
      });
    },
    getURL(opts) {
      return baseURL + this._getFullUrl(relEndpoint, opts);
    }
  });
  app.register(id, apiClass);
  return app[id];
}

function createQueries(entityName, source, constants) {
  const id = getClassId(entityName, 'DataframeQueries');
  const qClass = Marty.createQueries({
    id,
    getDataframe(opts) {
      this.dispatch(constants[`RETRIEVED_${entityName}_DATAFRAME_STARTING`], opts);
      return source
        .makeGetRequest(opts)
        .then((res) => {
          if (res.status === HTTP_OK) {
            return res.text().then((text) => {
              const parsed = Baby.parse(text);
              const data = parsed.data;
              this.dispatch(
                constants[`RETRIEVED_${entityName}_DATAFRAME`],
                data,
                res.headers,
                opts
              );
            });
          }
          this.dispatch(constants[`RETRIEVED_${entityName}_DATAFRAME_FAILED`], opts);
        })
        .catch((err) => {
          console.error(err);
          this.dispatch(constants[`RETRIEVED_${entityName}_DATAFRAME_FAILED`], opts, err);
          throw err;
        });
    }
  });
  app.register(id, qClass);
  return app[id];
}

function createStore(entityName, constants, queries, source) {
  const id = getClassId(entityName, 'DataframeStore');
  const sClass = Marty.createStore({
    id,

    handlers: {
      onRetrieved: constants[`RETRIEVED_${entityName}_DATAFRAME`]
    },

    getInitialState() {
      return {
        dataframes: Im.OrderedMap()
      };
    },

    onRetrieved(data, headers, query) {
      const fetchId = this._getFetchId(query);
      this.state.dataframes = this.state.dataframes.set(fetchId, Im.List(data.map(Im.List)));
      this.hasChanged();
    },

    onRouteChange() {
      this.resetState();
    },

    resetState() {
      this.state = this.getInitialState();
    },

    _getData(query, route) {
      query = Im.Map(query);
      if (route) query = query.set(LIST_ROUTE, route);
      const fetchId = this._getFetchId(query);

      return this.fetch({
        id: fetchId,

        locally() {
          const ret = this.state.dataframes.get(fetchId) || undefined;
          return ret;
        },

        remotely() {
          return queries.getDataframe(query);
        }
      });
    },

    getDataframe(query) {
      return this._getData(query);
    },

    getPivotTable(query) {
      return this._getData(query, TO_PIVOT);
    },

    getTimeseries(query) {
      return this._getData(query, TO_TIMESERIES);
    },

    getDataframeURL(query) {
      query = Im.Map(query);
      return source.getURL(query);
    },

    _getFetchId(opts) {
      // TODO - This is copied from http-api.js
      opts = opts || Im.Map();
      opts = opts.toObject();
      return `${entityName}_DATAFRAME:${JSON.stringify(opts)}`;
    }
  });

  app.register(id, sClass);
  const s = app[id];

  attachExtendMethod(s);

  // Clear Store data when page is changed. This means data isn't
  // cached and shared across views, which is a temporary simplication until
  // caching works reliably.
  history.listen(s.onRouteChange.bind(s));

  return s;
}

export function stateDefaultsGenerator(opts) {
  const entityName = opts.entity.toUpperCase();
  const endpoint = opts.endpoint;
  const constants = createConstants(entityName);
  const source = createHttpAPIStateSource(entityName, endpoint);
  const queries = createQueries(entityName, source, constants);
  const store = createStore(entityName, constants, queries, source);
  const stateObj = {
    Constants: constants,
    Store: store
  };
  return stateObj;
}
