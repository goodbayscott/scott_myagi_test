import WistiaAPI from 'vendor/wistia/api';

import config from 'core/config';

export default {
  onUploaderReady(f) {
    window._wapiq = window._wapiq || [];
    window._wapiq.push(f);
  },
  onPlayerReady(conf) {
    window._wq = window._wq || [];
    window._wq.push(conf);
  },
  mergeWithBaseConfig(conf) {
    return Object.assign(
      {
        accessToken: config.WISTIA_TOKEN,
        projectId: config.WISTIA_PROJECT_ID
      },
      conf
    );
  },
  api(...args) {
    return window.Wistia.api.apply(args);
  }
};
