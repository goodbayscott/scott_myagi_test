export const assert = (condition, message) => {
  // From http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    message = message || 'Assertion failed';
    if (typeof Error !== 'undefined') {
      throw new Error(message);
    }
    // Fallback
    throw message;
  }
};
