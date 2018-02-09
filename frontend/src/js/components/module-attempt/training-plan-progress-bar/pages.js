import React from 'react';
import { t } from 'i18n';
import Style from 'style';

import {
  VIDEO_PAGE_TYPE,
  PDF_PAGE_TYPE,
  SNIPPET_PAGE_TYPE,
  QUESTION_PAGE_TYPE,
  FLIP_CARD_PAGE_TYPE,
  FLIP_CARD_MATCH_PAGE_TYPE,
  IFRAME_PAGE_TYPE,
  HTML_PAGE_TYPE
} from 'core/constants';

const DISPLAY_LAST_PAGE = 'last';
const DISPLAY_ALL_PAGES = 'all';

const style = {
  stepTitle: {
    margin: '0',
    paddingBottom: 12,
    fontWeight: 'normal'
  },
  stepThumbnail: {
    maxWidth: 70,
    maxHeight: 45
  },
  stepProgress: {
    fontSize: '0.85rem',
    color: Style.vars.colors.get('xxDarkGrey')
  }
};

class Video extends React.Component {
  render() {
    const page = this.props.page;
    return (
      <div>
        <h4 style={style.stepTitle}>Video</h4>
        <img src={page.thumbnail_url} style={style.stepThumbnail} />
      </div>
    );
  }
}

class Question extends React.Component {
  render() {
    const count = this.props.count;
    let progress = this.props.progress;
    if (!progress) {
      progress = 0;
    } else if (progress > count) {
      progress = count;
    }
    return (
      <div>
        <h4 style={style.stepTitle}>Quiz</h4>
        <p style={style.stepProgress}>
          {progress} / {count} complete
        </p>
      </div>
    );
  }
}

class Pdf extends React.Component {
  render() {
    return (
      <div>
        <h4 style={style.stepTitle}>PDF</h4>
      </div>
    );
  }
}

class Snippet extends React.Component {
  render() {
    const page = this.props.page;
    return (
      <div>
        <h4 style={style.stepTitle}>Snippet</h4>
        <img src={page.thumbnail_url} style={style.stepThumbnail} />
      </div>
    );
  }
}

class FlipCard extends React.Component {
  render() {
    const count = this.props.count;
    let progress = this.props.progress;
    if (!progress) {
      progress = 0;
    } else if (progress > count) {
      progress = count;
    }
    return (
      <div>
        <h4 style={style.stepTitle}>Flip Cards</h4>
        <p style={style.stepProgress}>
          {progress} / {count} complete
        </p>
      </div>
    );
  }
}

class IFrame extends React.Component {
  render() {
    const page = this.props.page;
    return (
      <div>
        <h4 style={style.stepTitle}>Main Content</h4>
      </div>
    );
  }
}

class HTML extends React.Component {
  render() {
    return (
      <div>
        <h4 style={style.stepTitle}>{t('document')}</h4>
      </div>
    );
  }
}

export const PAGE_TYPES_LOOKUP = {
  [VIDEO_PAGE_TYPE]: {
    component: Video,
    display: DISPLAY_ALL_PAGES
  },
  [QUESTION_PAGE_TYPE]: {
    component: Question,
    display: DISPLAY_LAST_PAGE
  },
  [PDF_PAGE_TYPE]: {
    component: Pdf,
    display: DISPLAY_ALL_PAGES
  },
  [SNIPPET_PAGE_TYPE]: {
    component: Snippet,
    display: DISPLAY_ALL_PAGES
  },
  [FLIP_CARD_PAGE_TYPE]: {
    component: FlipCard,
    display: DISPLAY_LAST_PAGE
  },
  [FLIP_CARD_MATCH_PAGE_TYPE]: {
    component: Question,
    display: DISPLAY_LAST_PAGE
  },
  [IFRAME_PAGE_TYPE]: {
    component: IFrame,
    display: DISPLAY_ALL_PAGES
  },
  [HTML_PAGE_TYPE]: {
    component: HTML,
    display: DISPLAY_ALL_PAGES
  }
};
