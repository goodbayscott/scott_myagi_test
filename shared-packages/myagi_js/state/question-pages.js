'use strict';

import _ from 'lodash';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';

import MultichoiceQuestionsState from 'state/multichoice-questions';

const mod = stateDefaultsGenerator({
  entity: 'questionPage',
  endpoint: 'question_pages'
});

mod.ActionCreators.createWithQuestion = function (pData, opts) {
  return MultichoiceQuestionsState.ActionCreators.create(pData.question).then(res => {
    pData.question = res.body.url;
    return mod.ActionCreators.create(pData, opts);
  });
};

mod.ActionCreators.updateWithQuestion = function (pData, opts) {
  return MultichoiceQuestionsState.ActionCreators.update(pData.question).then(res => {
    pData.question = res.body.url;
    return mod.ActionCreators.update(pData.id, pData, opts);
  });
};

export default mod;
