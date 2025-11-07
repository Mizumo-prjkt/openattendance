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


// Popup modal for the raw-report button
var popup = app.popup.create({
    el: '.popup-card',
    closeByBackdropClick: true,
});

// // Add event listener to the raw-report link to open the popup
// document.querySelector('.raw-report').addEventListener('click', function (e) {
//   e.preventDefault();
//   popup.open(); // Open the popup modal
// });

// // Add event listener to the close button
// document.querySelector('.close-popup').addEventListener('click', function (e) {
//     e.preventDefault();
//     popup.close(); // Close the popup modal
// });

document.querySelector('.raw-report').addEventListener('click', function (e) {
    e.preventDefault();
    popup.open();
});
