import ReactNative from 'react-native';

import { truncateText } from './generic';

INPUT_SCROLL_DELAY = 50;
MAX_TITLE_LENGTH = 34;

export default {
  inputFocusAutoScroll(scrollView, inputRef, offset = 150) {
    setTimeout(() => {
      const scrollResponder = scrollView.getScrollResponder();
      scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
        ReactNative.findNodeHandle(inputRef),
        offset,
        true
      );
    }, INPUT_SCROLL_DELAY);
  },
  inputBlurAutoScroll(scrollView, inputRef, offset = 150) {
    setTimeout(() => {
      const scrollResponder = scrollView.getScrollResponder();
      scrollResponder.scrollResponderScrollTo({ x: 0, y: 0 });
    }, INPUT_SCROLL_DELAY);
  },
  truncateTitle(title) {
    return truncateText(title, MAX_TITLE_LENGTH);
  },
  isAndroid() {
    return ReactNative.Platform.OS === 'android';
  }
};
