import Marty from 'marty';
import React from 'react';
import AppState from './state';

export class TitleControllerInner extends React.Component {
  setTitle(title) {
    document.title = title;
  }

  render() {
    let title = this.props.title;
    if (this.props.newMessagesCount) {
      title = `(${this.props.newMessagesCount}) - ${title}`;
    }
    this.setTitle(title);
    return null;
  }
}

export const TitleController = Marty.createContainer(TitleControllerInner, {
  listenTo: [AppState.Store],

  getTitle() {
    // TODO - Fetch page title from a store which can be updated by other pages
    return AppState.Store.getTitle();
  },

  done(results) {
    return <TitleControllerInner {...this.props} title={this.getTitle()} />;
  },

  pending() {
    return <TitleControllerInner {...this.props} title={this.getTitle()} />;
  },

  failed(errors) {
    return this.pending();
  }
});
