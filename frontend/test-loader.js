// Disable fetch here. This forces fetch to be polyfilled,
// which means we can then stub it out using sinon during testing.
window.fetch = undefined;

const context = require.context('./src/js', true, /__tests__|test-main\.js/);
context.keys().forEach(context);
