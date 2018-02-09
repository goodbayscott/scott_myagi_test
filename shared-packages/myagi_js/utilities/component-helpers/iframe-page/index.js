import { setupScormLmsApi } from './lms-api';

export default class IFramePageHelper {
  constructor(opts) {
    this.opts = opts;
    this.lmsAPI = setupScormLmsApi({
      // Treat completion and finishing the same way.
      // Courses are embedded, so LMSFinish should
      // only be called at completion time anyhow.
      onFinish: this.onFinish,
      onComplete: this.onFinish,
      onSetCurrentScore: this.onCurrentScoreUpdate,
      onSetMaxScore: this.onMaxScoreUpdate,
      onSetSuspendData: this.onSetSuspendData,
      data: {
        suspendData: opts.suspendData
      }
    });
  }

  onCurrentScoreUpdate = score => (this.score = parseInt(score));

  onMaxScoreUpdate = score => (this.maxScore = parseInt(score));

  onSetSuspendData = data => {
    this.opts.iFramePageAttemptsState.ActionCreators.update(this.opts.pageAttemptId, {
      suspend_data: data
    });
  };

  onFinish = () => {
    // ComponentState is optional
    if (this.opts.componentState) this.opts.componentState.ActionCreators.incrementProgress();
    this.opts.iFramePageAttemptsState.ActionCreators.update(this.opts.pageAttemptId, {
      score: this.score || 0,
      highest_possible_score: this.maxScore || 0,
      reached_end: true
    }).then(this.opts.goToNextPage);
  };
}
