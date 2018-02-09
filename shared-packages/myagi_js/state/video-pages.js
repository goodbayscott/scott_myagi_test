import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const VideoPagesState = stateDefaultsGenerator({
  entity: 'videoPages',
  endpoint: 'video_pages'
});

export default VideoPagesState;
