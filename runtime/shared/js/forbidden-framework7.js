// For Framework7 forbidden page, specific functions

// /assets/js/forbidden-framework7.js

var app = new Framework7({
  root: '#app',
  name: 'Forbidden',
  id: 'openattendance.forbidden',
  routes: [
    {
      path: '/back/',
      back: true,
    },
  ],
});

// Add event listener to the back link
document.querySelector('.back-link').addEventListener('click', function (e) {
  e.preventDefault();
  app.router.back(); // Navigate back in Framework7's history
});

// Function to update page content based on URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const title = params.get('title');
    const message = params.get('message');

    // Only update if we have parameters
    if (code && title && message) {
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-code-display').textContent = code;

        // Prepare the JSON for the popup
        const errorJson = {
            status: parseInt(code, 10),
            error: title,
            message: message
        };

        // Update the <pre> tag in the popup
        const jsonString = JSON.stringify(errorJson, null, 4); // Pretty print JSON
        document.getElementById('error-json').textContent = jsonString;
    } else {
        // Fallback for direct access without params
        document.getElementById('error-json').textContent = JSON.stringify({ status: 403, error: 'Forbidden', message: 'You do not have permission to access this page.' }, null, 4);
    }
});

// Popup modal for the raw-report button
var popup = app.popup.create({
    el: '.popup-card',
    closeByBackdropClick: true,
});


document.querySelector('.raw-report').addEventListener('click', function (e) {
    e.preventDefault();
    popup.open();
});
