import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

export class ShortAnswerQuestion extends React.Component {
  static propTypes = {
    question: React.PropTypes.instanceOf(Im.Map)
  };

  render() {
    return <div />;
  }
}
