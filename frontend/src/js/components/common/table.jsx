import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import Style from 'style';
import _ from 'lodash';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';
import Baby from 'babyparse';
import cx from 'classnames';

import { isMobileWidth, getScrollBarWidth, arraysEqual } from 'utilities/generic';

import { HoverMixin } from 'components/common/hover';
import { SecondaryButton } from 'components/common/buttons';

const SORT_DESC = 'ascending';
const SORT_ASC = 'descending';
const DEFAULT_SORT_DIR = SORT_DESC;

const stdStyles = {
  container: {
    marginBottom: 30
  },
  table: {
    tableLayout: 'fixed'
  },
  thead: {
    zIndex: 10
  },
  tbody: {
    overflowX: 'hidden'
  },
  tr: {},
  trHoverable: {
    cursor: 'pointer'
  },
  trMobile: {
    borderBottom: 'none'
  },
  trHover: {
    backgroundColor: Style.vars.colors.get('hoverGrey')
  },
  th: {
    whiteSpace: 'normal',
    fontSize: '0.9em',
    borderLeft: 'none',
    textTransform: 'uppercase',
    backgroundColor: 'white'
  },
  td: {
    fontSize: '0.9em',
    border: 'none',
    wordBreak: 'break-word',
    maxWidth: 250,
    minWidth: 80
  },
  tdMobile: {
    marginBottom: 10
  },
  tdMobileHeader: {
    fontWeight: 'bold !important'
  },
  divider: {
    marginBottom: 25,
    // Matches semantic UI styling of header / body divider
    color: '#E9E9E9',
    borderStyle: 'solid',
    borderTopWidth: 0
  },
  btn: {
    marginLeft: 0,
    display: 'inline-block'
  }
};

const reducedHeightStyles = {
  /*
    Mostly from
        http://stackoverflow.com/questions/17067294/html-table-with-100-width-with-vertical-scroll-inside-tbody
  */
  container: {
    marginBottom: 5
  },
  table: Style.funcs.merge(stdStyles.table, {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
    width: '100%',
    tableLayout: 'fixed'
  }),
  thead: Style.funcs.merge(stdStyles.thead, {
    flex: '0 0 auto',
    width: `calc(100% - ${getScrollBarWidth()}px)`,
    display: 'table',
    tableLayout: 'fixed'
  }),
  tbody: Style.funcs.merge(stdStyles.tbody, {
    flex: '1 1 auto',
    display: 'block',
    overflowY: 'auto'
  }),
  tr: Style.funcs.merge(stdStyles.tr, {
    width: '100%',
    display: 'table',
    tableLayout: 'fixed'
  }),
  th: Style.funcs.merge(stdStyles.th, {}),
  td: Style.funcs.merge(stdStyles.td, {}),
  trHoverable: Style.funcs.merge(stdStyles.trHoverable, {}),
  trHover: Style.funcs.merge(stdStyles.trHover, {}),
  trMobile: Style.funcs.merge(stdStyles.trMobile, {}),
  tdMobile: Style.funcs.merge(stdStyles.tdMobile, {}),
  tdMobileHeader: Style.funcs.merge(stdStyles.tdMobileHeader, {})
};

export class TableHeaderElements extends React.Component {
  render() {
    let headerEls;
    if (!this.props.isMobileWidth) {
      // If not mobile, display header els. Otherwise, headers will be
      // included in each row.
      headerEls = this.props.headers.map((header, i) => {
        let className;
        if (this.props.sortHeader === header && !this.props.sortDisabled) {
          className = `sorted ${this.props.sortDirection}`;
        }
        let width = {};
        if (
          this.props.fixHeaderTop &&
          this.props.nodeWidthMapping.length &&
          this.props.nodeWidthMapping.length > i - 1
        ) {
          width = { width: this.props.nodeWidthMapping[i] };
        }
        const key = `header-${this.props.renderKey}-${i}`;
        return (
          <th
            className={className}
            key={key}
            onClick={_.partial(this.props.updateSorting, header)}
            style={Style.funcs.merge(this.props.styles.th, width)}
          >
            {header}
          </th>
        );
      });
    }
    const fixHeaderTop = this.props.fixHeaderTop;
    let theadStyles = this.props.styles.thead;
    if (fixHeaderTop) {
      theadStyles = Style.funcs.merge(this.props.styles.thead, {
        position: 'fixed',
        top: 0
      });
    }
    return (
      <thead key="thead" style={theadStyles}>
        <tr style={this.props.styles.tr}>{headerEls}</tr>
      </thead>
    );
  }
}

export class ScrollableDataTable extends React.Component {
  /*
    Table with a scrollable body. Clicking on headers
    also resorts the table according to that header.
  */
  static propTypes = {
    // Table headers
    headers: React.PropTypes.instanceOf(Im.List).isRequired,
    // Table rows
    rows: React.PropTypes.instanceOf(Im.List).isRequired,
    // Height of the table body. If body overflows this amount it will
    // be scrollable. If no bodyHeight is specified, then this will
    // act pretty much like a regular table
    bodyHeight: React.PropTypes.string,
    onRowClick: React.PropTypes.func,
    // Header to sort by initially
    initialSortHeader: React.PropTypes.string,
    initialSortDirection: React.PropTypes.oneOf(SORT_DESC, SORT_ASC),
    // Allows sorting to be disabled
    sortDisabled: React.PropTypes.bool,
    // If this is `true`, then an export button will be added to the
    // bottom of the table.
    exportEnabled: React.PropTypes.bool,
    // Only relevant if export is enabled. An array of headers
    // which should not be included in the export.
    exportIgnoreHeaders: React.PropTypes.array,
    exportButtonText: React.PropTypes.string
  };

  static defaultProps = {
    bodyHeight: '40em',
    exportButtonText: 'Export as CSV'
  };

  constructor(props) {
    super();
    this.state = {
      // Sort by first header which has a value
      sortHeader: this.getDefaultSortHeader(props),
      sortDirection: props.initialSortDirection || DEFAULT_SORT_DIR,
      nodeWidthMapping: [],
      renderKey: 0,
      fixHeaderTop: false
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Performance enhancements for when there are a very large number
    // of rows.
    if (nextState.fixHeaderTop !== this.state.fixHeaderTop) return true;
    if (nextState.sortHeader !== this.state.sortHeader) return true;
    if (nextState.sortDirection !== this.state.sortDirection) return true;
    if (nextProps.sortDisabled !== this.props.sortDisabled) return true;
    if (Im.is(this.props.headers, nextProps.headers) && Im.is(this.props.rows, nextProps.rows)) {
      return false;
    }
    return true;
  }

  getDefaultSortHeader(props) {
    return props.initialSortHeader || props.headers.find(Boolean);
  }

  updateSorting = header => {
    // Do not allow sorting by empty headers.
    // These are assumed to be fields which the
    // user probably does not want to sort by
    // (e.g. an image).
    if (!header) return;
    if (this.state.sortHeader === header) {
      const newDirection = this.state.sortDirection === SORT_ASC ? SORT_DESC : SORT_ASC;
      this.setState({
        sortDirection: newDirection
      });
    } else {
      this.setState({
        sortHeader: header,
        sortDirection: DEFAULT_SORT_DIR
      });
    }
  };

  convertForSorting(val) {
    // If this is a `ReactElement`, sort by it's key.
    // This allows parent component to manage how `ReactElement`
    // cells are sorted.
    if (val.key) val = val.key;
    // Sort by parsed date if val is a valid date / datetime
    const formats = [moment.ISO_8601];
    if (moment(val, formats).isValid()) return Date.parse(val);
    const asFloat = parseFloat(val);
    if (!isNaN(asFloat)) return asFloat;
    if (val.toLowerCase) return val.toLowerCase();
    return val;
  }

  applySorting(rows, headers) {
    const { hideColumnIndex } = this.props;
    let sortedRows = rows;
    if (this.state.sortHeader && !this.props.sortDisabled) {
      const index = headers.findIndex(val => val === this.state.sortHeader);
      const reverse = this.state.sortDirection === SORT_ASC;
      sortedRows = sortedRows.sort((r1, r2) => {
        let r1Val =
          hideColumnIndex !== undefined
            ? r1.delete(Number(hideColumnIndex)).get(index)
            : r1.get(index);
        let r2Val =
          hideColumnIndex !== undefined
            ? r2.delete(Number(hideColumnIndex)).get(index)
            : r2.get(index);

        r1Val = this.convertForSorting(r1Val);
        r2Val = this.convertForSorting(r2Val);

        let val = 0;
        if (r1Val < r2Val) {
          val = -1;
        } else if (r1Val > r2Val) {
          val = 1;
        }
        if (reverse) val = -val;
        return val;
      });
    }
    return sortedRows;
  }

  isReducedHeight() {
    return Boolean(this.props.bodyHeight);
  }

  getExportHref = () => {
    const data = this.props.rows.unshift(this.props.headers).toJS();

    const ignoreHeaders = this.props.exportIgnoreHeaders || [];
    const ignoreIndexes = ignoreHeaders.map(header => this.props.headers.indexOf(header));

    // Remove headers/vals which we have been told to ignore
    data.forEach(row => {
      let offset = 0;
      ignoreIndexes.forEach(index => {
        row.splice(index + offset, 1);
        offset -= 1;
      });
    });

    // Convert each data element into an exportable
    // value (some of them may be react elements).
    // If the element has an `exportVal` prop, then that
    // will be used. Otherwise, `key` will be used.
    data.forEach(row => {
      for (let i = 0; i < row.length; i++) {
        let val = row[i];
        if (val) {
          const props = val.props || {};
          if (props.exportVal) val = props.exportVal;
          if (val.key) val = val.key;
        }
        row[i] = val;
      }
    });
    const csv = Baby.unparse(data);

    return `data:text/csv;charset=UTF-8,${encodeURIComponent(csv)}`;
  };

  detachHeader = () => {
    this.setState({
      fixHeaderTop: false
    });
  };

  attachHeader = () => {
    this.setState({
      fixHeaderTop: true
    });
  };

  updateNodeWidthMapping = mapping => {
    if (mapping.length && !arraysEqual(this.state.nodeWidthMapping, mapping)) {
      this.setState({
        nodeWidthMapping: mapping,
        renderKey: this.state.renderKey + 1
      });
    }
    const tableHeaderElements = this.refs.tableHeaderElements;
    const tableHeaderNode = ReactDOM.findDOMNode(tableHeaderElements);
    const tableBody = this.refs.body;
    const tableBodyNode = ReactDOM.findDOMNode(tableBody);

    if (!tableHeaderNode || !tableBodyNode) return;
    const tableHeaderNodeTop = tableHeaderNode.getBoundingClientRect().top;
    const tableBodyNodeTop = tableBodyNode.getBoundingClientRect().top;

    this.setState({
      tableHeaderNodeScrollHeight: tableHeaderNode.scrollHeight
    });

    if (this.state.fixHeaderTop && tableBodyNodeTop >= tableHeaderNode.scrollHeight) {
      this.detachHeader();
    }

    if (!this.state.fixHeaderTop && tableHeaderNodeTop < 0) {
      this.attachHeader();
    }
  };

  render() {
    const isMobile = isMobileWidth();
    const reducedHeight = this.isReducedHeight();
    const styles = reducedHeight ? reducedHeightStyles : stdStyles;
    let containerStyle = Style.funcs.mergeIf(reducedHeight, styles.container, {
      height: this.props.bodyHeight
    });
    containerStyle = Style.funcs.merge(containerStyle, this.props.style);
    if (this.state.fixHeaderTop) {
      // Apply an offset on the margin top of the table so we have a smooth transition
      // when attaching / detaching the table header to / from a fixed position.
      containerStyle = Style.funcs.merge(containerStyle, {
        marginTop: this.state.tableHeaderNodeScrollHeight
      });
    }
    const { rows, onRowClick, hideColumnIndex } = this.props;
    let headers = this.props.headers;
    if (hideColumnIndex !== undefined && !isMobile) {
      headers = headers.delete(Number(hideColumnIndex));
    }
    const sortedRows = this.applySorting(rows, headers);
    const rowEls = sortedRows.map((row, i) => (
      <TableRow
        key={`${row.toJSON().toString()}.${i}`}
        ref={`row${i}`}
        row={row}
        rowIndex={i}
        headers={headers}
        style={styles}
        onClick={onRowClick}
        updateNodeWidthMapping={this.updateNodeWidthMapping}
        isReducedHeight={reducedHeight}
        hideColumnIndex={hideColumnIndex}
      />
    ));

    return (
      <div style={containerStyle}>
        <table
          ref="table"
          className={cx('ui', { sortable: !this.props.sortDisabled }, 'very basic large table')}
          style={styles.table}
        >
          <TableHeaderElements
            ref="tableHeaderElements"
            key={this.state.renderKey}
            headers={headers}
            styles={styles}
            fixHeaderTop={this.state.fixHeaderTop}
            nodeWidthMapping={this.state.nodeWidthMapping}
            sortHeader={this.state.sortHeader}
            sortDirection={this.state.sortDirection}
            sortDisabled={this.props.sortDisabled}
            updateSorting={this.updateSorting}
            renderKey={this.state.renderKey}
            isMobileWidth={isMobileWidth()}
          />
          <tbody style={styles.tbody} ref="body">
            {rowEls}
          </tbody>
        </table>
        <hr style={styles.divider} />
        {this.props.exportEnabled && (
          <SecondaryButton download="data.csv" href={this.getExportHref()} style={styles.btn}>
            {this.props.exportButtonText}
          </SecondaryButton>
        )}
      </div>
    );
  }
}

@reactMixin.decorate(HoverMixin)
export class TableRow extends React.Component {
  static propTypes = {
    row: React.PropTypes.instanceOf(Im.List).isRequired,
    onClick: React.PropTypes.func,
    style: React.PropTypes.object.isRequired,
    isReducedHeight: React.PropTypes.bool.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      nodeWidthMapping: []
    };
  }

  onClick = dataNum => {
    if (this.props.onClick) {
      this.props.onClick(this.props.row, dataNum);
    }
  };

  getNodeWidthMapping = () => {
    // Get the width of all the columns in a row. Use these figures to set the
    // width on the headers and cells so everything lines up. This is required
    // when the header gets position: fixed and sticks to the top of the screen.
    const node = this.refs[`tableRow-${this.props.rowIndex}`];
    if (node) {
      const children = this.refs[`tableRow-${this.props.rowIndex}`].children;
      const nodeWidthMapping = [];
      _.forEach(children, child => {
        const childNode = ReactDOM.findDOMNode(child);
        const childWidth = childNode.getBoundingClientRect().width;
        nodeWidthMapping.push(childWidth);
      });
      if (this.state.nodeWidthMapping !== nodeWidthMapping) {
        this.setState({ nodeWidthMapping });
      }
      return nodeWidthMapping;
    }
    return [];
  };

  handleViewportChange = e => {
    if (isMobileWidth()) return;
    // Handle scroll & resize so we can match up widths of column headers and cells
    // when header is fixed to the top of the screen.
    const nodeWidthMapping = this.getNodeWidthMapping();
    this.props.updateNodeWidthMapping(nodeWidthMapping);
  };

  componentDidMount() {
    window.addEventListener('scroll', _.throttle(this.handleViewportChange, 100));
    window.addEventListener('resize', _.throttle(this.handleViewportChange, 100));
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleViewportChange);
    window.addEventListener('resize', this.handleViewportChange);
  }

  render() {
    const isMobile = isMobileWidth();
    const styles = this.props.isReducedHeight ? reducedHeightStyles : stdStyles;
    let tdStyle = styles.td;
    // let tdStyle = Style.funcs.merge(styles.td, {width: this.props.tdWidth});
    tdStyle = Style.funcs.mergeIf(isMobile, tdStyle, styles.tdMobile);
    let trStyle = Style.funcs.mergeIf(isMobile, styles.tr, styles.trMobile);
    if (this.props.onClick) {
      trStyle = Style.funcs.merge(trStyle, styles.trHoverable);
      trStyle = this.getHoverStyle(trStyle, styles.trHover);
    }
    let dataNum = -1;
    const dataEls = this.props.row.map((data, i) => {
      dataNum += 1;
      let headerEl;
      if (isMobile) {
        headerEl = <div style={styles.tdMobileHeader}>{this.props.headers.get(dataNum)}</div>;
      }
      // `onClick` handler is attached to data cells, so that callback can determine
      // what to do when a particular cell is clicked.

      if (
        this.state.nodeWidthMapping.length &&
        this.state.nodeWidthMapping.length === this.props.row.count() &&
        !isMobile
      ) {
        tdStyle = Style.funcs.merge(tdStyle, {
          width: this.state.nodeWidthMapping[i]
        });
      }

      if (i === Number(this.props.hideColumnIndex)) {
        return null;
      }

      return (
        <td
          ref={`data${dataNum}`}
          key={dataNum}
          style={tdStyle}
          onClick={_.partial(this.onClick, dataNum)}
        >
          {headerEl}
          {data}
        </td>
      );
    });
    const trRef = `tableRow-${this.props.rowIndex}`;
    return (
      <tr ref={trRef} style={trStyle} {...this.getHoverProps()}>
        {dataEls}
      </tr>
    );
  }
}
