'use strict';

export default {
  production: {
    SENTRY_KEY: 'a29b1134856044e4adda06b97b7046dc',
    SENTRY_APP_ID: '26503',
    OAUTH_CLIENT_ID: '729689349142-1koo5fi96ofprifealm8nqo8kn8ofn6q.apps.googleusercontent.com',
    PUSHER_KEY: '8f18a9833f619a1dba92',
    WISTIA_TOKEN: '8447109cc354c1e40f9d17d04cdaad07c9df612646ec43836be70145209b896c',
    WISTIA_PROJECT_ID: 'ranmmjh0tv',
    EMBEDLY_API_TOKEN: '67031635e1e84ea6a8df7f86c0c3d84b'
  },
  development: {
    SENTRY_KEY: '', // 'b30df85e5d6e456dad8757627763c199',
    SENTRY_APP_ID: '', // '33869'
    OAUTH_CLIENT_ID: '729689349142-8poe1a38vh2mkpg3otk4g7nm1adt6ndg.apps.googleusercontent.com',
    PUSHER_KEY: 'e1eafedbf59c49f198cb',
    WISTIA_TOKEN: '8447109cc354c1e40f9d17d04cdaad07c9df612646ec43836be70145209b896c',
    WISTIA_PROJECT_ID: 'tzyfqx59ua',
    EMBEDLY_API_TOKEN: '67031635e1e84ea6a8df7f86c0c3d84b'
  }
}[process.env.NODE_ENV || 'development'];
