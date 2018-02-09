import Im from 'immutable';

export function getHeaders(dataMapping) {
  return Im.List(_.keys(dataMapping));
}

export function getRows(dataMapping, imList, cxt) {
  const funcs = _.values(dataMapping);
  const rows = imList.map(i => Im.List(funcs.map(f => f(i, cxt))));
  return rows;
}
