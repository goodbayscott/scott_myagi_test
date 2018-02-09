/* Global */

$('.open-intercom').click(function(e) {
    e.preventDefault();
    window.Intercom('showNewMessage');
});
/* End Global */


/* "index.html" */

$('button.home-cta-btn').click(function(e) {
    e.preventDefault();
    var email = $('input#home-cta-input').val();
    window.location = 'https://myagi.com/signup/user/?locale=en&ueml=' + email;
});

/* End "index.html" */