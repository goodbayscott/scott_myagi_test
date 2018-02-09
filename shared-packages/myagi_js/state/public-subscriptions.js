import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const PublicSubscriptionsState = stateDefaultsGenerator({
  entity: 'publicSubscription',
  endpoint: 'public/subscriptions'
});

export default PublicSubscriptionsState;
