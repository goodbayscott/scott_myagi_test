'use strict';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import { TextMessagesState } from 'state/messages-text';
import _ from 'lodash';
import Im from 'immutable';
import { getIdFromApiUrl } from 'utilities/generic';

const MessagesState = stateDefaultsGenerator({
  entity: 'message',
  endpoint: 'messages'
});

MessagesState.Store = MessagesState.Store.extend({
  handlers: _.extend(
    {
      onTextMessageCreate: 'CREATE_TEXT_MESSAGE'
    },
    MessagesState.Store.handlers
  ),
  // add a new text message to the local set
  onTextMessageCreate(textMessage) {
    this.onCreate.apply(this, arguments);
    if (textMessage.thread) {
      const threadId = getIdFromApiUrl(textMessage.thread);
      this.setMatchesFilter(Im.Map(textMessage), { thread: threadId }, true);
    }
  }
});

export default MessagesState;
