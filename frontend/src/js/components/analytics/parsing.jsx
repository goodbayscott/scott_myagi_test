import moment from 'moment';

const toTruncatedInt = function (i) {
  let asNum = parseFloat(i);
  if (asNum !== undefined) {
    asNum = Math.round(asNum);
  } else {
    asNum = i;
  }
  return asNum;
};

const toOneDecimalPlace = function (i) {
  let asNum = parseFloat(i);
  if (asNum !== undefined) {
    asNum = asNum.toFixed(1);
  } else {
    asNum = i;
  }
  return asNum;
};

const proportionToPercentage = function (i) {
  let asNum = parseFloat(i);
  if (asNum !== undefined) {
    asNum *= 100;
    asNum = asNum.toFixed(1);
  } else {
    asNum = i;
  }
  return asNum;
};

const toDateTime = function (i) {
  /*
   * Takes a timestamp and returns
   * a human readable date and time
  */

  return moment(i).format('Do MMM YYYY');
};

export default {
  toTruncatedInt,
  toOneDecimalPlace,
  toDateTime,
  proportionToPercentage
};
