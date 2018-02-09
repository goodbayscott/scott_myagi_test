export const setupFacebook = function () {
  // Init facebook here
  window.fbAsyncInit = function () {
    FB.init({
      appId: '1578945815676308',
      status: true,
      cookie: true,
      xfbml: true,
      version: 'v2.3'
    });
  };
};
