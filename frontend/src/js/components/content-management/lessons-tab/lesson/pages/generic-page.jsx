import React from 'react';
import Radium from 'radium';
import { SortableElement, orderingStyles } from 'components/common/ordering';

import { VideoListItem } from './page-types/video/list-item';
import { QuestionListItem } from './page-types/question/list-item';
import { PdfListItem } from './page-types/pdf/list-item';
import { SnippetListItem } from './page-types/snippet/list-item';
import { FlipCardListItem, FlipCardMatchListItem } from './page-types/flip-card/list-item';
import { IFrameListItem } from './page-types/iframe/list-item';
import { HTMLListItem } from './page-types/html/list-item';

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

const PAGE_TYPES_LOOKUP = {
  [VIDEO_PAGE_TYPE]: VideoListItem,
  [QUESTION_PAGE_TYPE]: QuestionListItem,
  [PDF_PAGE_TYPE]: PdfListItem,
  [SNIPPET_PAGE_TYPE]: SnippetListItem,
  [FLIP_CARD_PAGE_TYPE]: FlipCardListItem,
  [FLIP_CARD_MATCH_PAGE_TYPE]: FlipCardMatchListItem,
  [IFRAME_PAGE_TYPE]: IFrameListItem,
  [HTML_PAGE_TYPE]: HTMLListItem
};

const styles = {
  listItem: {
    margin: '0px 0px 20px',
    cursor: 'pointer',
    width: '100%',
    transition: 'box-shadow 0.3s ease'
  }
};

@Radium
class Page extends React.Component {
  render() {
    const Component = PAGE_TYPES_LOOKUP[this.props.page.get('type')];
    return (
      <div style={[styles.listItem, this.props.highlight && orderingStyles.highlight]}>
        <Component page={this.props.page} />
      </div>
    );
  }
}

export const SortablePage = SortableElement(Page);
