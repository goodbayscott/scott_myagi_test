import _ from 'lodash';
import Pusher from 'pusher-js';

import config from 'core/config';

const CREATED = 'created';
const UPDATED = 'updated';
const DELETED = 'deleted';

const pusher = new Pusher(config.PUSHER_KEY, {
  encrypted: true
});

export default {
  _existingChannels: {},
  getEntityChannel(entityName, filterOpts) {
    /*
      Backend looks for channels with a specific format -
      {entityName}-{querysetFilter}, e.g. `Threads-members=123`.
      This function is a shortcut for creating channels with
      such names.
    */

    let channelName = entityName;
    if (filterOpts) {
      const queries = _.map(filterOpts, (val, key) => `${key}=${val}`);
      const filterStr = queries.join(',');
      channelName = `${entityName}-${filterStr}`;
    }
    // Pusher will complain if we try to subscribe to the same channel
    // twice
    if (!this._existingChannels[channelName]) {
      this._existingChannels[channelName] = pusher.subscribe(channelName);
    }
    return this._existingChannels[channelName];
  },
  subscribeToChanges(entityName, filterOpts, func) {
    /*
      Shortcut for creating a channel that listens for
      creations, updates and deletions of a particular
      entity (`entityName`) queryset (`filterOpts`) and
      then running a function (`func`) when any of these
      events occur. Returns a channel on which
      `unbind(null, func)` should be called once subscriptions
      are no longer necessary. Do not just call `unbind()` as
      channels are recycled, and this may accidentally unbind handlers
      for other components.
    */
    const channel = this.getEntityChannel(entityName, filterOpts);
    channel.bind(CREATED, func);
    channel.bind(UPDATED, func);
    channel.bind(DELETED, func);
    return channel;
  }
};
