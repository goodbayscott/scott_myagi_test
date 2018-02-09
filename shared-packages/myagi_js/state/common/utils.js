import Im from 'immutable';
import querystring from 'querystring';
import { getCSRFToken } from 'utilities/http';

const Dispatcher = require('core/application').dispatcher;

export function getWriteHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-CSRFToken': getCSRFToken()
  };
}

export function getReadHeaders() {
  return {
    Accept: 'application/json'
  };
}

export function parseQueryOpt(key, val) {
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
}

export function generateQueryString(query) {
  const parsedQuery = {};
  // Convert array into comma separated list.
  Object.keys(query).forEach((key) => {
    let val = query[key];
    val = parseQueryOpt(key, val);
    parsedQuery[key] = val;
  });
  return querystring.stringify(parsedQuery);
}

export function getFullUrl(endpoint, query) {
  if (query) {
    query = query.toObject();
  } else {
    query = {};
  }

  if (query.id) {
    endpoint = `${endpoint}/${query.id}`;
    delete query.id;
  }
  const qs = generateQueryString(query);
  const url = `${endpoint}/?${qs}`;
  return url;
}

export function getActionConstants(base) {
  return {
    base,
    starting: `${base}_STARTING`,
    failed: `${base}_FAILED`
  };
}

export function wrapApiGet(baseConstant) {
  const actionConstants = getActionConstants(baseConstant);

  return function (target, key, descriptor) {
    const value = descriptor.value;

    descriptor.value = function () {
      Dispatcher.dispatchAction({ type: actionConstants.starting });

      return value(...arguments)
        .then((response) => {
          Dispatcher.dispatchAction({
            type: actionConstants.base,
            arguments: [Im.fromJS(response.body)]
          });
        })
        .catch((err) => {
          Dispatcher.dispatchAction({
            type: actionConstants.failed,
            arguments: [err]
          });
        });
    };

    return descriptor;
  };
}

export function wrapApiPatch(baseConstant) {
  const actionConstants = getActionConstants(baseConstant);

  return function (target, key, descriptor) {
    const value = descriptor.value;

    descriptor.value = function (id, entity) {
      Dispatcher.dispatchAction({ type: actionConstants.starting }, id, entity);

      return value(id, entity)
        .then((response) => {
          Dispatcher.dispatchAction({
            type: actionConstants.base,
            arguments: [Im.fromJS(response.body), id, response.headers]
          });
        })
        .catch((err) => {
          Dispatcher.dispatchAction({
            type: actionConstants.failed,
            arguments: [id, entity, err]
          });
        });
    };

    return descriptor;
  };
}

export function wrapApiPost(baseConstant) {
  const actionConstants = getActionConstants(baseConstant);

  return function (target, key, descriptor) {
    const value = descriptor.value;

    descriptor.value = function (id, entity) {
      Dispatcher.dispatchAction({ type: actionConstants.starting }, entity);

      return value(id, entity)
        .then((response) => {
          Dispatcher.dispatchAction({
            type: actionConstants.base,
            arguments: [Im.fromJS(response.body), response.headers, entity]
          });
        })
        .catch((err) => {
          console.log(err);
          Dispatcher.dispatchAction({
            type: actionConstants.failed,
            arguments: [entity, err]
          });
        });
    };

    return descriptor;
  };
}

export function compatGet(obj, attr) {
  /* Makes it easier to retrieve value of `attr` from `obj`,
  regardless of whether the `makeEntitiesFullyImmutable` setting
  is being used. */
  return obj.get ? obj.get(attr) : obj[attr];
}
