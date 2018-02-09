const React = require('react');
const ReactDOM = require('react-dom');

import { isVisible } from 'utilities/generic';

const { LoadingSpinner } = require('./loading');

function topPosition(domElt) {
  if (!domElt) {
    return 0;
  }
  return domElt.offsetTop + topPosition(domElt.offsetParent);
}

export class InfiniteScroll extends React.Component {
  /*
    Wrap collections of content in this component to make it infinitely scrollable.
    Requires a `moreAvailable` function which returns `true` if there is more
    content available to fetch, a `loadMore` function which triggers the fetching
    of new content and an `isLoading` function which returns `true` if content
    is currently being fetched.

    Example usage:

      <InfiniteScroll
        loadMore={this.loadMoreFoobars}
        moreAvailable={ this.moreFoobarsAvailable}
        isLoading={ this.isLoadingFoobars }
      >
        { this.props.foobars.map( foobar => <p>{ foobar.name }</p> )}
      </ InfiniteScroll>

    In this example, when user scrolls to bottom of the set of foobar name
    paragraph elements, a fetch for more foobars will be triggered.

    Modified from https://github.com/guillaumervls/react-infinite-scroll/blob/master/src/react-infinite-scroll.js
  */
  constructor(props) {
    super(props);
    this.state = {
      // Keeps track of whether initial data has been loaded.
      // If not, do not want to display loader.
      initDataHasLoaded: false,
      scrollListenerAttached: false
    };
  }

  static propTypes = {
    loadMore: React.PropTypes.func.isRequired,

    // One of these needs to be defined. Going forward,
    // `dataIsloading` should be used.
    isLoading: React.PropTypes.func,
    dataIsLoading: React.PropTypes.bool,

    // One of these needs to be defined. Going forward,
    // `moreDataAvailable` should be used.
    moreAvailable: React.PropTypes.func,
    moreDataAvailable: React.PropTypes.bool,

    // If the container is scrollable (eg container style has restricted height)
    scrollableContainer: React.PropTypes.bool,

    disabled: React.PropTypes.bool
  };

  static defaultProps = {
    pageStart: 0,
    threshold: 250
  };

  componentDidMount() {
    this.pageLoaded = this.props.pageStart;
    this.attachScrollListener();
  }

  componentDidUpdate() {
    this.attachScrollListener();
  }

  scrollListener = () => {
    if (this.isLoading() || !this.moreAvailable() || this.props.disabled) {
      return;
    }
    if (!this.state.initDataHasLoaded) this.setState({ initDataHasLoaded: true });

    const el = ReactDOM.findDOMNode(this);

    let spaceAtBottom;
    if (this.props.scrollableContainer) {
      const scrollTop = el.scrollTop;
      spaceAtBottom = el.scrollHeight - el.offsetHeight - scrollTop;
    } else {
      const scrollTop =
        window.pageYOffset !== undefined
          ? window.pageYOffset
          : (document.documentElement || document.body.parentNode || document.body).scrollTop;
      spaceAtBottom = topPosition(el) + el.offsetHeight - scrollTop - window.innerHeight;
    }

    if (spaceAtBottom < Number(this.props.threshold)) {
      // Don't perform infinite scroll if element is not currently visible.
      // Useful for when there are multiple infinite scroll lists on the page,
      // each in a separate tab.
      if (!isVisible(el)) return;
      this.detachScrollListener();
      // call loadMore after detachScrollListener to allow
      // for non-async loadMore functions
      this.props.loadMore((this.pageLoaded += 1));
    }
  };

  attachScrollListener = () => {
    if (this.state.scrollListenerAttached) return;
    // Prevents infinite loops
    this.state.scrollListenerAttached = true;

    const container = this.props.scrollableContainer ? this.container : window;
    container.addEventListener('scroll', this.scrollListener);
    container.addEventListener('resize', this.scrollListener);
    this.scrollListener();
  };

  detachScrollListener = () => {
    this.state.scrollListenerAttached = false;
    const container = this.props.scrollableContainer ? this.container : window;
    container.removeEventListener('scroll', this.scrollListener);
    container.removeEventListener('resize', this.scrollListener);
  };

  componentWillUnmount = () => {
    this.detachScrollListener();
  };

  isLoading = () => {
    if (this.props.isLoading) {
      return this.props.isLoading();
    }
    return this.props.dataIsLoading;
  };

  moreAvailable = () => {
    if (this.props.moreAvailable) {
      return this.props.moreAvailable();
    }
    return this.props.moreDataAvailable;
  };

  render() {
    const props = this.props;
    const loader =
      this.isLoading() && this.state.initDataHasLoaded && !this.props.disabled ? (
        <LoadingSpinner {...this.props.spinnerProps} />
      ) : null;
    return (
      <div ref={c => (this.container = c)} style={this.props.style}>
        {props.children}
        {loader}
      </div>
    );
  }
}
