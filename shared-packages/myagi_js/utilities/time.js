import moment from 'moment-timezone';

export function momentToISO(m) {
  // NOTE - Have stripped the Z from the end of the ISO string
  // as it confuses python :(
  return m.toISOString().replace('Z', '');
}

export function nowInISO() {
  return momentToISO(moment());
}
