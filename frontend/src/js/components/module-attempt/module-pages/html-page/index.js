import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Radium from 'radium';
import ReactQuill, { Quill } from 'react-quill';

import Style from 'style';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import HTMLPagesState from 'state/html-pages';
import ModuleAttemptPageState from '../../state';
import { NextPageButton } from '../common';

// Must explictely whitelist image attributes so that we can set
// a max-width on large images.
const BaseImageFormat = Quill.import('formats/image');

const ImageFormatAttributesList = ['width', 'style'];

class ImageFormat extends BaseImageFormat {
  static formats(domNode) {
    return ImageFormatAttributesList.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(ImageFormat, true);

const styles = {
  pageContainer: Style.common.attemptPageContent,
  contentContainer: {
    backgroundColor: 'white'
  },
  toolbar: {
    // Hide quill toolbar
    display: 'none'
  },
  editorStyle: {
    height: 'calc(100vh - 300px)',
    padding: '35px 5% 20px',
    boxShadow: '#ccc 3px 3px 20px',
    borderRadius: 3
  },
  nextBtn: {
    marginTop: '10px',
    marginLeft: 0,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    [Style.vars.media.get('mobile')]: {
      width: '100%'
    }
  }
};

const EDITOR_MODULES = {
  toolbar: {
    container: '#toolbar',
    items: ['image']
  },
  ImageResize: {}
};

@Radium
class PageContent extends React.Component {
  static data = {
    page: {
      fields: ['html']
    }
  };

  static propTypes = $y.propTypesFromData(PageContent, {
    module: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  });

  constructor() {
    super();
    this.state = {};
  }

  next = () => {
    if (this.clicked) return;
    this.clicked = true;
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    this.props.goToNextPage();
  };

  _isLastPage() {
    const last = _.last(this.props.module.get('pages'));
    return last.id === this.props.page.get('id');
  }

  render() {
    const { page } = this.props;
    let nextBtnText;
    if (this._isLastPage()) {
      nextBtnText = t('finish');
    } else {
      nextBtnText = t('next');
    }
    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentContainer}>
          <div id="toolbar" style={styles.toolbar} />
          <ReactQuill
            readOnly
            theme={null}
            style={styles.editorStyle}
            ref={editor => (this.editor = editor)}
            modules={EDITOR_MODULES}
            value={page.get('html')}
          />
        </div>
        <br />
        <NextPageButton
          page={page}
          module={this.props.module}
          goToNextPage={this.props.goToNextPage}
        />
      </div>
    );
  }
}

export class HTMLPage extends React.Component {
  static data = {
    page: $y.getData(PageContent, 'page', { required: false })
  };

  static propTypes = {
    page: HTMLPagesState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  };

  render() {
    return this.props.page ? <PageContent {...this.props} /> : null;
  }
}

export const Page = Marty.createContainer(HTMLPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    goToPrevPage: React.PropTypes.func
  },

  listenTo: [HTMLPagesState.Store],

  fetch: {
    page() {
      return HTMLPagesState.Store.getItem(this.props.pageId, {
        fields: $y.getFields(HTMLPage, 'page')
      });
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  },

  pending() {
    return containerUtils.defaultPending(this, HTMLPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, HTMLPage, errors);
  }
});
