import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const SubscriptionsState = stateDefaultsGenerator({
  entity: 'subscription',
  endpoint: 'subscriptions'
});

export default SubscriptionsState;
