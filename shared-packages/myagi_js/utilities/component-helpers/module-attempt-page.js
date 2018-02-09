import _ from 'lodash';

const ANSWER_KEYS = ['a', 'b', 'c', 'd', 'e'];

export function randomiseOptions(options) {
  let asLists = _.map(options, (val, key) => (val ? [key, val] : null));
  asLists = _.filter(asLists, Boolean);
  asLists = _.shuffle(asLists);
  return asLists;
}
export function mapRandomizedOptions(opts, cb) {
  return _.map(ANSWER_KEYS, (displayKey, i) => {
    const optData = opts[i];
    if (!optData) return null;
    const actualKey = optData[0];
    const option = optData[1];
    return cb(option, actualKey, displayKey);
  });
}

// Question page type
export function getFirstQuestionPageIndex(pageIndex, pType, allPageTypes) {
  // If this is a sequence of question pages,
  // get the index of the first
  let idx = pageIndex;
  while (idx >= 0 && allPageTypes[idx] === pType) {
    idx -= 1;
  }
  return idx + 1;
}

export function getNumQuestions(pageIndex, pType, allPageTypes) {
  const first = getFirstQuestionPageIndex(pageIndex, pType, allPageTypes);
  let idx = first;
  while (idx < allPageTypes.length && allPageTypes[idx] === pType) {
    idx += 1;
  }
  return idx - first;
}

export function getQuestionNumber(pageIndex, pType, allPageTypes) {
  return pageIndex - getFirstQuestionPageIndex(pageIndex, pType, allPageTypes) + 1;
}
