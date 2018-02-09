'use strict';

import _ from 'lodash';

export function getClassId(entityName, classType) {
  return `${_.capitalize(entityName.toLowerCase())}${classType}`;
}
