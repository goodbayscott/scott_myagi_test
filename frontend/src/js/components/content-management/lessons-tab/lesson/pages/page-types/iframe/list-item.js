import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';
import Im from 'immutable';
import Style from 'style';
import SnippetPagesState from 'state/snippet-pages';

import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 1
  },
  muted: {
    color: Style.vars.colors.get('xDarkGrey')
  }
};

@Radium
export class IFrameListItem extends React.Component {
  // delete = () => {
  //   SnippetPagesState.ActionCreators.update(this.props.page.get('id'), {
  //     deactivated: momentToISO(moment()),
  //   });
  // };

  render() {
    const { page } = this.props;

    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <div style={styles.textSection}>
            <div style={styles.muted}>IFramed Webpage</div>
            <div>{page.get('website_url')}</div>
          </div>
        </div>
        {/* <DeleteButton delete={this.delete} page={this.props.page} /> */}
        {/* <DetailsModal ref="details" page={Im.Map(this.props.page)} /> */}
      </div>
    );
  }
}
