export default {
  requireView(currentUser, module, page) {
    if (module.get('completed_by_current_user')) {
      return false;
    }
    const learner = currentUser.get('learner');
    const must_watch = learner.get
      ? learner.get('must_watch_videos_in_full')
      : learner.must_watch_videos_in_full;
    return page.get('require_video_view') || must_watch;
  }
};
